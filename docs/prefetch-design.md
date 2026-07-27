# PR コメントの事前取得（バックグラウンド・プリフェッチ）

> このドキュメントは設計案です。2026-07-25 時点で未実装。

## 解決したいこと

いまは popup を開いた瞬間に GitHub API を叩き始めるため、**開くたびに待たされます**（実測 約2.3秒）。この遅さは GitHub の `search` API 由来で、クライアント側では縮められません。

そこで **裏側で定期的に取得して保存しておき、popup は保存済みデータを即表示する**ようにします。fetch そのものは速くなりませんが、ユーザーの待ち時間は実質 0 になります。

```
Before: popup を開く → fetch(2.3秒待つ) → 表示
After : （裏で10分ごとに取得・保存）
        popup を開く → 保存済みを即表示 → 同時に裏で最新化
```

## 前提：Chrome 拡張の3つの登場人物

| 登場人物 | 実体 | 寿命 |
|---|---|---|
| popup | クリックで出る画面 | 開いている間だけ |
| service worker（background） | 画面のない裏方 | イベント時だけ起きて数十秒で停止 |
| storage | データ保存領域 | 永続 |

popup も service worker も**停止すると変数が消える**ため、データの置き場所は storage 一択です。

```
popup ──①取得依頼──→ service worker
  ↑                      │②書く
  │③読む                 ↓
  └──────── storage ←────┘
```

## storage は sync と local を使い分ける

| | sync | local |
|---|---|---|
| 容量 | 100KB | 10MB |
| 端末間同期 | する | しない |
| 用途 | トークン | キャッシュ |

- **トークン → sync**：小さく、別 PC でも再入力したくない
- **キャッシュ → local**：大きく（PR20件で約200KB）、API から取り直せるので同期不要

キャッシュは毎回1キーを丸ごと上書きするだけなので累積せず、サイズは常に一定です。

## 変更するファイル

```
新規
├─ src/utils/strorage/chromeLocalStrage.ts             local への読み書き
├─ src/features/prComments/services/prCommentsCache.ts キャッシュ管理・鮮度判定
└─ src/background/refreshPrComments.ts                 取得処理の本体

変更
├─ src/background/index.ts                             取得トリガの登録
├─ src/features/prComments/hooks/useFetchPrCommets.ts  キャッシュを使って表示
├─ src/popup/App.tsx                                   QueryClient のバグ修正
└─ manifest.config.ts                                  権限の追加

変更しない
└─ FetchGraphQLApiClient / prCommentsService / 表示コンポーネント全部
```

既存の取得ロジックと表示は触りません。変更は「いつ・どこにデータを置くか」だけです。

## 各ファイルの要点

### 1. chromeLocalStrage.ts（新規）

既存 `chromeSyncStrage.ts` の `sync` を `local` に置き換えただけ。`get`/`set` の2関数。

### 2. prCommentsCache.ts（新規）— キャッシュ管理

**鮮度は2段階で判定**（1段階だと「古いのに最新扱い」か「毎回 Loading」の一方に倒れるため）：

| データの古さ | 表示 | 裏側 |
|---|---|---|
| キャッシュなし / 60分超 | Loading | 取得を待つ |
| 10分以内 | 即表示 | 何もしない |
| 10〜60分 | 即表示 | 裏で更新→静かに差し替え |

真ん中が stale-while-revalidate（古いのを見せつつ裏で更新）。60分超で Loading にするのは、古すぎるコメントを「最新」と見せないため。

その他の役割：サイズ上限（2MB）を超えたら `updatedAt` の新しい順に残して超過分を落とし、件数を `console.warn` で記録（黙って切り捨てない）。取得失敗時も既存データは消さず `error` だけ立てる（stale-while-error）。

**全文**：

```ts
import {
  getChromeLocalStorage,
  setChromeLocalStorage,
} from "@/utils/strorage/chromeLocalStrage";
import { PullRequestWithCommentsType } from "@/types/pullRequestDataType";

/** local に保存するキャッシュのキー */
export const PR_COMMENTS_CACHE_KEY = "pr_comments_cache";

/** 10分。これ以内なら再取得しない（soft stale） */
export const SOFT_STALE_MS = 10 * 60 * 1000;
/** 60分。これを超えたら Loading を出して取り直す（hard stale） */
export const HARD_STALE_MS = 60 * 60 * 1000;

/** キャッシュ1件あたりのサイズ上限（2MB） */
const SIZE_LIMIT_BYTES = 2 * 1024 * 1024;

export type PrCommentsCache = {
  /** PR コメントの中身 */
  data: PullRequestWithCommentsType[];
  /** いつ取得したか（epoch ms）。古さ判定に必須 */
  fetchedAt: number;
  /** 直近の取得が失敗したときのメッセージ。成功時は null */
  error: string | null;
};

/**
 * キャッシュを読む。未保存なら undefined。
 */
export const readPrCommentsCache = async (): Promise<
  PrCommentsCache | undefined
> => {
  return getChromeLocalStorage<PrCommentsCache>(PR_COMMENTS_CACHE_KEY);
};

/**
 * サイズ上限に収まるよう、updatedAt の新しい順に残して超過分を落とす。
 * 新しい PR ほど重要なので、古いものから切り捨てる。
 * @param data - 元の PR 配列
 * @returns 上限内に収めた PR 配列
 */
const truncateToSizeLimit = (
  data: PullRequestWithCommentsType[],
): PullRequestWithCommentsType[] => {
  const sorted = [...data].sort((a, b) =>
    (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""),
  );

  let payload = sorted;
  while (
    payload.length > 1 &&
    new Blob([JSON.stringify(payload)]).size > SIZE_LIMIT_BYTES
  ) {
    payload = payload.slice(0, -1);
  }

  // 黙って切り捨てず、落とした件数を必ず記録する
  if (payload.length < sorted.length) {
    console.warn(
      `キャッシュのサイズ上限により ${sorted.length - payload.length} 件の PR を除外しました`,
    );
  }

  return payload;
};

/**
 * 取得成功時にキャッシュを書き込む。error は null にリセットする。
 * @param data - 取得した PR 配列
 * @param fetchedAt - 取得時刻（epoch ms）
 */
export const writePrCommentsCache = async (
  data: PullRequestWithCommentsType[],
  fetchedAt: number,
): Promise<void> => {
  await setChromeLocalStorage<PrCommentsCache>(PR_COMMENTS_CACHE_KEY, {
    data: truncateToSizeLimit(data),
    fetchedAt,
    error: null,
  });
};

/**
 * 取得失敗時に error だけ立てる。既存の data / fetchedAt は残す（stale-while-error）。
 * ネットワークが切れても手元の古いデータを見られるようにするため。
 * @param message - エラーメッセージ
 */
export const writePrCommentsCacheError = async (
  message: string,
): Promise<void> => {
  const current = await readPrCommentsCache();
  await setChromeLocalStorage<PrCommentsCache>(PR_COMMENTS_CACHE_KEY, {
    data: current?.data ?? [],
    fetchedAt: current?.fetchedAt ?? 0,
    error: message,
  });
};

/**
 * hard stale（60分超）かどうか。キャッシュが無い場合も true。
 * true のとき popup は初期表示せず Loading を出す。
 * @param cache - 判定対象のキャッシュ
 * @param now - 現在時刻（epoch ms）
 */
export const isHardStale = (
  cache: PrCommentsCache | undefined,
  now: number,
): boolean => {
  if (!cache) return true;
  return now - cache.fetchedAt > HARD_STALE_MS;
};

### 3. refreshPrComments.ts（新規）— 取得の本体

**GitHub API を叩くのはこの関数だけ**にする（入口を1箇所に絞る）。

```ts
let inFlight: Promise<void> | null = null;
const COOLDOWN_MS = 60 * 1000;

export const refreshPrComments = async (force = false) => {
  if (inFlight) return inFlight;                    // 同時実行を防ぐ
  if (!force) {                                     // 連発を防ぐ
    const cache = await readPrCommentsCache();
    if (cache && Date.now() - cache.fetchedAt < COOLDOWN_MS) return;
  }
  inFlight = (async () => {
    try {
      const token = await getChromeSyncStorage(GITHUB_TOKEN_KEY);
      if (!token) return;
      const data = await fetchPrComments(token);    // 既存関数を再利用
      await writePrCommentsCache(data, Date.now());
    } catch (e) {
      await writePrCommentsCacheError(...);          // 既存データは消さない
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
};
```

- **inFlight**：複数トリガが同時発火しても API は1回で済む
- **COOLDOWN_MS**：`idle` などの連発を抑える。ただし popup の更新ボタンは `force=true` で貫通させる
- service worker が停止して `inFlight` が消えても問題ない（次のトリガで取り直すだけ）

### 4. background/index.ts（変更）— いつ取得するか

現状は中身が空。6つのトリガを登録する。

```ts
const ALARM_NAME = "refreshPrComments";

chrome.runtime.onInstalled.addListener(() => {          // ①インストール時
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 10 });
  refreshPrComments();
});
chrome.runtime.onStartup.addListener(() => {            // ②ブラウザ起動時
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 10 });
  refreshPrComments();
});
chrome.alarms.onAlarm.addListener((a) => {              // ③10分ごと
  if (a.name === ALARM_NAME) refreshPrComments();
});
chrome.idle.onStateChanged.addListener((s) => {         // ④離席から復帰
  if (s === "active") refreshPrComments();
});
chrome.storage.onChanged.addListener((c, area) => {     // ⑤トークン設定時
  if (area === "sync" && c[GITHUB_TOKEN_KEY]) refreshPrComments(true);
});
chrome.runtime.onMessage.addListener((msg, _s, send) => { // ⑥popup からの依頼
  if (msg?.type !== REFRESH_PR_COMMENTS_MESSAGE) return;
  refreshPrComments(true).then(() => send({ ok: true }));
  return true;   // 非同期に sendResponse するので必須
});
```

補足：
- **`setInterval` は不可**。service worker が停止するとタイマーごと消える。定期実行は `chrome.alarms`（Chrome 本体が停止中の worker を起こす）が唯一の方法
- **④が必要な理由**：alarms はスリープ中止まる。復帰後に `idle: active` で取得して穴を埋める
- **⑥の `return true`**：これが無いと sendResponse 前に通信路が閉じ、popup が永久に待つ（MV3 頻出の罠）

### 5. useFetchPrCommets.ts（変更）— 表示側

**戻り値の形（`prComments` / `isPending` / `isError` / `error`）は変えない**ので、呼び出し元は無修正で動く。

```ts
// まずキャッシュを読む（storage 読み込みは数ミリ秒 = 初速を決める）
const { data: cache } = useQuery({
  queryKey: ["prCommentsCache"],
  queryFn: readPrCommentsCache,
  staleTime: Infinity,
});

useQuery({
  queryKey: ["prComments", token],
  queryFn: requestRefresh,                                  // popup は直接叩かない
  initialData: () => (isHardStale(cache) ? undefined : cache?.data),
  initialDataUpdatedAt: cache?.fetchedAt,                   // ← 忘れると再取得されない
  staleTime: SOFT_STALE_MS,
});
```

- `initialData`：キャッシュを初期表示に使う（60分超なら undefined で Loading）
- `initialDataUpdatedAt`：「このデータは `fetchedAt` 時点のもの」と伝える。無いと react-query が「今取得した」と誤認し、10分経っても再取得しない
- `staleTime`：10分以内は再取得しない

**popup が直接 fetch しない理由**：popup を閉じると fetch も中断され、キャッシュが更新されない。service worker 経由なら閉じても取得は続く。入口を1箇所に保つことで `inFlight` の重複防止も効く。

```ts
const requestRefresh = async () => {
  await chrome.runtime.sendMessage({ type: REFRESH_PR_COMMENTS_MESSAGE });
  const cache = await readPrCommentsCache();
  if (cache?.error && cache.data.length === 0) throw new Error(cache.error);
  return cache?.data ?? [];
};
```

おまけ：開いたまま裏で更新が完了しても反映されるよう、`chrome.storage.onChanged` を監視して `queryClient.setQueryData` で差し替える。

### 6. App.tsx（変更）— 既存バグの修正

```diff
+ const queryClient = new QueryClient();   // モジュールスコープへ
  export default function App() {
-   const queryClient = new QueryClient(); // ← 再レンダー毎に作り直してキャッシュ破棄
```

`QueryClient` がコンポーネント内にあると再レンダーのたびに作り直され、キャッシュが毎回捨てられる。**これを直さないと上の `staleTime`/`initialData` が一切効かない**。今回の土台となる修正。

### 7. manifest.config.ts（変更）

```diff
-  permissions: ["storage", "nativeMessaging", "idle"],
+  permissions: ["storage", "alarms", "idle"],
```

- `alarms` 追加：定期実行に必須
- `nativeMessaging` 削除：未使用。審査で用途説明を求められるので外す

## 動作フロー

| ケース | 挙動 |
|---|---|
| 普段 | 裏で10分ごとに取得 → 開いた瞬間に即表示（10分以内なので API を叩かない） |
| 離席から復帰 | `idle: active` で裏取得 → 開くとほぼ最新を即表示 |
| スリープ復帰 | データが10〜60分前 → 古いのを即表示しつつ裏で更新 → 静かに差し替え |
| 初回（トークン設定直後） | `sync.onChanged` で即取得 → 以降は普段と同じ |

## API レート制限

GitHub GraphQL は 5,000ポイント/時。**実測でこのクエリは cost=5**（当初の96という概算は誤り）。10分間隔でも消費はごくわずかで、上限に対して問題にならない。

## 実装上の注意

- **service worker のログは popup の DevTools に出ない**。`chrome://extensions` → 対象拡張 → 「Service Worker」から専用 DevTools を開く。同画面から `refreshPrComments()` を手動実行でき、10分待たずに確認できる
- **service worker は数十秒で停止するのが正常**。止まっていても壊れていない
- **スリープ中は alarms が止まる**（Chrome の仕様）。だから `idle: active` と `onStartup` を併用する

## 影響範囲

- 表示側は `useFetchPrComments` の戻り値の形を維持するため無影響。仮に失敗しても影響は hook と background に閉じる
- 唯一の挙動変化は `App.tsx` の `QueryClient` 修正で **react-query のキャッシュが実際に効き始める**こと（意図した修正だが動作確認の対象）

## 段階的に進める案

- **Step 1（低リスク・約30分）**：`App.tsx` の `QueryClient` をモジュールスコープへ + 不要な `console.log` 削除。これだけで popup 開き直し時にキャッシュが効き始め、事前取得がどれだけ必要かの判断材料になる
- **Step 2（約2時間）**：background による事前取得一式

Step 1 だけで十分な可能性もあるので、こちらから始めるのを勧める。

## 用語

| 用語 | 意味 |
|---|---|
| service worker | 画面のない裏方。MV3 では常駐せずイベントごとに起きて数十秒で停止 |
| chrome.storage.sync / local | 同期あり100KB（設定向け）/ 同期なし10MB（キャッシュ向け） |
| chrome.alarms | Chrome 本体が管理するタイマー。停止中の worker を起こせる |
| stale-while-revalidate | 古いデータを見せつつ裏で更新して差し替える |
| stale-while-error | 取得失敗時も手元の古いデータを保持する |
| soft / hard stale | 「裏で更新すればいい古さ」と「待たせてでも取り直す古さ」の2閾値 |
