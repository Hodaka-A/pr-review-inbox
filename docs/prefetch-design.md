# PR コメントの事前取得（バックグラウンド・プリフェッチ）

> このドキュメントは設計案です。2026-07-25 時点で実装は行われていません。

## これは何を解決するのか

### 現状の問題

いまの拡張機能は、**ユーザーが popup を開いた瞬間に GitHub API を叩き始めます。**

```
popup を開く → fetch 開始 → 待つ… → 表示
                            ↑ ここでユーザーが待たされる
```

GitHub の GraphQL API は、PR・レビュー・スレッド・コメントをまとめて取得しているため応答に時間がかかります。つまり**アイコンをクリックするたびに毎回待つ**ことになります。

### 変更後

**popup を開く前に、あらかじめ裏側で取得しておく**ようにします。

```
（裏側で10分ごとに取得 → 保存）

popup を開く → 保存済みデータを表示（待ち 0 秒）
                → 同時に裏で最新化
```

ユーザーから見ると、**アイコンをクリックした瞬間に一覧が出る**ようになります。

---

## 前提知識：Chrome 拡張の3つの登場人物

この変更を理解するには、次の3つの区別が必要です。

| 登場人物 | 実体 | 生きている時間 |
|---|---|---|
| **popup** | アイコンをクリックすると出る画面 | **開いている間だけ** |
| **service worker**（background） | 画面を持たない裏方のスクリプト | イベント発生時だけ起きて、**数十秒で寝る** |
| **storage** | 拡張機能用のデータ保存領域 | **ずっと残る** |

ここで一番重要なのは:

> **popup を閉じると、popup の JavaScript は完全に消えます。** 変数もメモリも残りません。

だから「popup で取得したデータを次回に使い回す」ことは、そのままではできません。データを**storage に書いておく**必要があります。

そしてもう一つ:

> **service worker も数十秒で停止します。**

なので service worker も変数にデータを持てません。結局、**データの置き場所は storage しかない**ということになります。

```
┌─────────┐   ①取得を依頼    ┌──────────────┐
│  popup  │ ───────────────→ │service worker│
│ (一時的) │                  │  (一時的)     │
└─────────┘                  └──────────────┘
     ↑                              │
     │ ③読む                  ②書く │
     │        ┌──────────┐          │
     └────────│ storage  │←─────────┘
              │ (永続)    │
              └──────────┘
```

---

## storage の `sync` と `local`

Chrome の storage には2種類あります。**この使い分けが今回の設計の中心です。**

| | `chrome.storage.sync` | `chrome.storage.local` |
|---|---|---|
| 容量 | **100KB**（1キー 8KB） | **10MB** |
| 端末間の同期 | される | されない |
| 用途 | 設定・トークン | キャッシュ |

### なぜキャッシュは `local` なのか

理由は2つあります。

**理由1: 容量**

PR コメントのデータには、コメント本文（`body`）とコード差分（`diffHunk`）が含まれます。これが大きい。

```
フルデータ（PR 20件） ≒ 200KB

sync の上限  100KB  → ❌ 入らない
local の上限  10MB  → ✅ 使用率 2%
```

**理由2: そもそも同期する意味がない**

このデータは GitHub API から**いつでも取り直せます**。別の PC で開いても、その PC が自分で取得すれば同じものが手に入ります。端末をまたいで同期する必要はありません。

一方**トークンは同期したい**（別の PC で再入力したくない）ので、こちらは `sync` に置いたままにします。

```
sync  → トークン（同期したい / 小さい）
local → キャッシュ（同期不要 / 大きい）
```

### 「200KB もストレージを使って大丈夫か」について

大丈夫です。理由は**キャッシュが累積しないから**です。

```ts
// 毎回この1つのキーを丸ごと上書きする（追記ではない）
chrome.storage.local.set({ pr_comments_cache: { ... } });
```

10分ごとに1日144回書き込んでも、**サイズは常に約200KB のまま**です。ログを溜める設計なら心配ですが、これは「最新のスナップショット1枚」を置き換え続けるだけです。

参考までに、200KB はスマホの写真1枚（3〜5MB）よりずっと小さいサイズです。

---

## 変更するファイル一覧

```
新規作成
├─ src/utils/strorage/chromeLocalStrage.ts             local への読み書き
├─ src/features/prComments/services/prCommentsCache.ts キャッシュの読み書き + 鮮度判定
└─ src/background/refreshPrComments.ts                 取得処理の本体

変更
├─ src/background/index.ts                             いつ取得するかの登録
├─ src/features/prComments/hooks/useFetchPrCommets.ts  キャッシュを使って表示
├─ src/popup/App.tsx                                   バグ修正（後述）
└─ manifest.config.ts                                  権限の追加

変更しない（重要）
├─ src/apiClient/FetchGraphQLApiClient.ts
├─ src/features/prComments/services/prCommentsService.ts
└─ 表示コンポーネント全部（PrCommentsList, PrCommentCard, ...）
```

**既存の取得ロジックと表示コンポーネントには一切手を入れません。** 変更は「いつ・どこにデータを置くか」の部分だけです。

---

## 各ファイルの解説

### 1. `chromeLocalStrage.ts`（新規）

既存の `chromeSyncStrage.ts` と**まったく同じ構造**で、`sync` を `local` に置き換えただけのファイルです。

```ts
export const getChromeLocalStorage = async <T>(
  key: string,
): Promise<T | undefined> => {
  const result = await chrome.storage.local.get([key]);
  return result[key] as T | undefined;
};

export const setChromeLocalStorage = async <T>(
  key: string,
  item: T,
): Promise<void> => {
  await chrome.storage.local.set({ [key]: item });
};
```

`chrome.storage.local.get` は `{ キー名: 値 }` という形のオブジェクトを返すので、**キーを開いて値だけを取り出す**のがこの関数の役目です。既存の sync 版と同じ考え方です。

---

### 2. `prCommentsCache.ts`（新規）— キャッシュの管理

ここには3つの役割があります。

#### 役割A: 何を保存するかの定義

```ts
export type PrCommentsCache = {
  data: PullRequestWithCommentsType[];  // PR コメントの中身
  fetchedAt: number;                    // いつ取得したか（epoch ms）
  error: string | null;                 // 直近の取得が失敗したか
};
```

`fetchedAt` が重要です。**「このデータはいつのものか」が分からないと、古いデータを最新として見せてしまう**からです。

#### 役割B: 鮮度の2段階判定

「古い」を1段階で判定すると困ったことが起きます。

- 判定が緩いと → 古いデータを最新として表示してしまう
- 判定が厳しいと → 毎回 Loading になって、キャッシュの意味がない

そこで**2つの閾値**を持たせます。

```ts
export const SOFT_STALE_MS = 10 * 60 * 1000;  // 10分
export const HARD_STALE_MS = 60 * 60 * 1000;  // 60分
```

| データの古さ | 画面の見え方 | 裏側 |
|---|---|---|
| キャッシュなし | Loading | 取得を待つ |
| 10分以内 | **即表示** | 何もしない |
| 10〜60分 | **即表示** | 裏で更新 → 静かに差し替え |
| 60分超 | Loading | 取得を待つ |

真ん中の「10〜60分」が肝です。**古いデータをまず見せて、裏で更新する**（stale-while-revalidate と呼ばれるパターン）。ユーザーは待たされず、しかもすぐ最新に更新されます。

60分超で Loading にするのは、**1時間前のレビューコメントを「最新」として見せるのは不誠実**だからです。

#### 役割C: サイズの上限を守る

現在の GraphQL クエリは `first: 20` を各階層で使っています。理論上の最大は:

```
20 PR × 20 スレッド × 20 コメント × 約1KB ≒ 8MB
```

現実にはこんな PR は存在しませんが（1つの PR に20スレッド、各20返信が20本並ぶ状況）、**設計としては上限を持たせるべき**です。

```ts
const SIZE_LIMIT_BYTES = 2 * 1024 * 1024; // 2MB

const truncateToSizeLimit = (data) => {
  // updatedAt が新しい順に並べる
  const sorted = [...data].sort((a, b) =>
    (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""),
  );

  // 上限に収まるまで、末尾（= 古いもの）から落とす
  let payload = sorted;
  while (
    payload.length > 1 &&
    new Blob([JSON.stringify(payload)]).size > SIZE_LIMIT_BYTES
  ) {
    payload = payload.slice(0, -1);
  }

  // 何件落としたかを必ず記録する（黙って切り捨てない）
  if (payload.length < sorted.length) {
    console.warn(
      `キャッシュのサイズ上限により ${sorted.length - payload.length} 件の PR を除外しました`,
    );
  }

  return payload;
};
```

**新しい PR を優先して残す**のがポイントです。レビューコメントは新しいものほど重要なので。

#### 役割D: 失敗しても既存データを消さない

```ts
export const writePrCommentsCacheError = async (message: string) => {
  const current = await readPrCommentsCache();
  await setChromeLocalStorage(PR_COMMENTS_CACHE_KEY, {
    data: current?.data ?? [],   // ← 既存のデータはそのまま残す
    fetchedAt: current?.fetchedAt ?? 0,
    error: message,
  });
};
```

ネットワークが切れた時に、**手元にあるデータまで消えてしまうと最悪**です。「取得は失敗したが、10分前のデータは見られる」状態を保ちます（stale-while-error）。

---

### 3. `refreshPrComments.ts`（新規）— 取得処理の本体

**このプロジェクトで GitHub API を叩くのは、この関数だけになります。** 取得の入口を1箇所に絞るのが設計の要点です。

```ts
let inFlight: Promise<void> | null = null;
const COOLDOWN_MS = 60 * 1000;

export const refreshPrComments = async (force = false): Promise<void> => {
  // ガード1: すでに取得中なら、その処理に相乗りする
  if (inFlight) return inFlight;

  // ガード2: 直前に取得したばかりならスキップ
  if (!force) {
    const cache = await readPrCommentsCache();
    if (cache && Date.now() - cache.fetchedAt < COOLDOWN_MS) return;
  }

  inFlight = (async () => {
    try {
      const token = await getChromeSyncStorage<string>(GITHUB_TOKEN_KEY);
      if (!token) return;

      const data = await fetchPrComments(token);      // ← 既存関数を再利用
      await writePrCommentsCache(data, Date.now());
      await updateBadge(data.length);
    } catch (error) {
      console.error("PR コメントの取得に失敗しました:", error);
      await writePrCommentsCacheError(...);           // 既存データは消さない
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
};
```

#### 2つのガードは何のためか

後述しますが、取得のきっかけ（トリガ）は**6種類**あります。これらが同時に発火することがあります。

**`inFlight`（同時実行の防止）**

```
時刻 0.0秒  alarm が発火     → 取得開始
時刻 0.1秒  popup が開かれた → 取得したい

  ガードなし → API を2回叩く（無駄 + レート制限を消費）
  ガードあり → 2つ目は1つ目の Promise を待つだけ（API は1回）
```

**`COOLDOWN_MS`（連発の防止）**

`idle` イベントは PC の状態次第で短時間に何度も発火することがあります。「前回の取得から60秒以内なら何もしない」で抑えます。

ただし popup からの明示的な更新は `force = true` でこのガードを**貫通**させます。ユーザーが更新ボタンを押したのに何も起きないのは困るからです。

#### `let inFlight` はグローバル変数だが問題ないのか

service worker は停止すると `inFlight` を失います。しかしこれは問題になりません。**失われた時点で取得も終わっている（もしくは中断されている）ので、次のトリガで改めて取得されるだけ**です。「取得中」の状態が消えても、storage のデータは残ります。

---

### 4. `background/index.ts`（変更）— いつ取得するか

現状のファイルは中身が空です。

```ts
// 変更前
chrome.runtime.onInstalled.addListener(() => {});

chrome.idle.onStateChanged.addListener((state) => {
    if(state === "active"){
        // ← ここが空
    }
});
```

ここに**6つのトリガ**を登録します。

```ts
const ALARM_NAME = "refreshPrComments";

// ① インストール直後
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 10 });
  refreshPrComments();
});

// ② ブラウザ起動時
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 10 });
  refreshPrComments();
});

// ③ 10分ごと
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) refreshPrComments();
});

// ④ 離席から戻ったとき
chrome.idle.onStateChanged.addListener((state) => {
  if (state === "active") refreshPrComments();
});

// ⑤ トークンが設定されたとき
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "sync" && changes[GITHUB_TOKEN_KEY]) {
    refreshPrComments(true);
  }
});

// ⑥ popup から依頼されたとき
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== REFRESH_PR_COMMENTS_MESSAGE) return;
  refreshPrComments(true).then(() => sendResponse({ ok: true }));
  return true;  // ← これが無いと動かない（後述）
});
```

#### なぜ `setInterval` ではなく `chrome.alarms` なのか

**`setInterval` は使えません。** service worker は数十秒で停止するので、タイマーごと消滅します。

`chrome.alarms` は Chrome 本体が時間を管理し、**時間が来たら止まっている service worker を起こしてくれる**仕組みです。これが MV3 で定期実行する唯一の方法です。

#### なぜ ④ の「離席から戻る」が必要なのか

**`chrome.alarms` は PC がスリープしている間は止まります。**

```
23:00  PC をスリープ
09:00  復帰 → alarm は10時間分カウントしていない
              → データは10時間前のもの
```

ここで `idle: active`（＝ユーザーが操作を再開した）を捉えて取得することで、**復帰直後でも新しいデータが用意されます**。この2つは互いの穴を埋め合う関係です。

#### ⑥ の `return true` の意味

Chrome のメッセージリスナーは、**何も返さないと「返事はない」と判断して通信路を閉じます。**

```ts
refreshPrComments(true).then(() => sendResponse({ ok: true }));
                                 ↑ 非同期なので、後で呼ばれる
return true;  // ← 「あとで sendResponse を呼ぶから待って」の意思表示
```

これを忘れると `sendResponse` が呼ばれる前に通信路が閉じ、**popup 側が永久に待ち続けます**。MV3 で最も引っかかりやすい落とし穴の一つです。

---

### 5. `useFetchPrCommets.ts`（変更）— 表示側

**戻り値の形（`prComments` / `isPending` / `isError` / `error`）は変えません。** そのため呼び出し元の `PrCommentsListContainer.tsx` は無修正で動きます。

#### 変更前

```ts
const { data, ... } = useQuery({
  queryKey: ["prComments", token],
  queryFn: () => fetchPrComments(token),  // ← popup が直接 API を叩く
  enabled: !isTokenLoading && !!token,
});
```

#### 変更後の3つのポイント

**ポイント1: 起動時にまずキャッシュを読む**

```ts
const { data: cache } = useQuery({
  queryKey: ["prCommentsCache"],
  queryFn: readPrCommentsCache,
  staleTime: Infinity,
});
```

storage の読み込みはミリ秒単位で終わるので、**ここが表示の初速を決めます**。

**ポイント2: キャッシュを初期値として渡す**

```ts
useQuery({
  queryKey: ["prComments", token],
  queryFn: requestRefresh,

  initialData: () => (isHardStale(cache) ? undefined : cache?.data),
  initialDataUpdatedAt: cache?.fetchedAt,
  staleTime: SOFT_STALE_MS,
});
```

3行が連携しています。

- `initialData` — キャッシュを初期表示に使う。ただし 60分超なら `undefined` にして Loading を出す
- `initialDataUpdatedAt` — **「このデータは `fetchedAt` の時点のもの」と react-query に伝える**。これがないと react-query は「今取得したデータ」と誤認して、10分経っても再取得しません
- `staleTime` — 10分以内なら再取得しない

`initialDataUpdatedAt` は忘れやすく、しかも忘れると**古いデータが更新されなくなる**ので重要です。

**ポイント3: popup 自身は API を叩かない**

```ts
const requestRefresh = async () => {
  await chrome.runtime.sendMessage({ type: REFRESH_PR_COMMENTS_MESSAGE });
  const cache = await readPrCommentsCache();
  if (cache?.error && cache.data.length === 0) throw new Error(cache.error);
  return cache?.data ?? [];
};
```

「service worker に依頼する → 結果を storage から読む」という流れです。

**なぜ popup が直接 fetch してはいけないのか:**

```
popup が直接 fetch した場合:
  fetch 開始 → ユーザーが popup を閉じる → fetch も中断 → キャッシュは更新されない
                                                        ↑ 次回また待たされる

service worker 経由の場合:
  依頼 → popup が閉じても service worker は取得を続ける → キャッシュが更新される
```

さらに、popup が直接叩くと `inFlight` による重複防止が効かなくなります。**取得の入口を1箇所に保つ理由がここにあります。**

**おまけ: 開いている間の自動反映**

```ts
useEffect(() => {
  const handleChange = (changes, areaName) => {
    if (areaName !== "local" || !changes[PR_COMMENTS_CACHE_KEY]) return;
    const next = changes[PR_COMMENTS_CACHE_KEY].newValue;
    queryClient.setQueryData(["prComments", token], next.data);
    queryClient.setQueryData(["prCommentsCache"], next);
  };

  chrome.storage.onChanged.addListener(handleChange);
  return () => chrome.storage.onChanged.removeListener(handleChange);
}, [queryClient, token]);
```

storage の変更を監視することで、**popup を開いたまま裏で更新が完了した場合も、画面が自動で最新になります**。

---

### 6. `App.tsx`（変更）— 既存のバグ修正

```diff
+ // レンダー毎に作り直すとキャッシュが破棄されるため、モジュールスコープに置く
+ const queryClient = new QueryClient();
+
  export default function App() {
-   const queryClient = new QueryClient();
-
    return (
```

**これは今ある不具合の修正です。**

`new QueryClient()` がコンポーネントの中にあるため、**再レンダーのたびに新しい QueryClient が作られ、それまでのキャッシュが全部捨てられています。** react-query のキャッシュ機構が実質的に無効化されている状態です。

たった2行の移動ですが、**これを直さないと上で設定した `staleTime` や `initialData` が一切機能しません。** 今回の変更の土台になる修正です。

---

### 7. `manifest.config.ts`（変更）

```diff
-  permissions: ["storage", "nativeMessaging", "idle"],
+  permissions: ["storage", "alarms", "idle"],
```

| 権限 | 扱い | 理由 |
|---|---|---|
| `alarms` | **追加** | 10分ごとの定期実行に必須 |
| `nativeMessaging` | **削除** | コード内で使われていない。ストア審査で用途説明を求められる権限なので、不要なら外すべき |
| `storage` / `idle` | そのまま | 継続して使用 |

---

## 変更後の全体の流れ

### ケース1: 普段の使い方（一番多い）

```
（裏側）10分ごとに alarm → 取得 → local に保存

ユーザーがアイコンをクリック
  ↓
local を読む（数ミリ秒）
  ↓
一覧を表示 ← 待ち 0 秒 ✨
  ↓
10分以内のデータなので、API は叩かない
```

### ケース2: 離席から戻ってきた

```
PC を操作再開 → idle: active が発火 → 裏で取得 → local を更新

アイコンをクリック → ほぼ最新のデータを即表示
```

### ケース3: スリープから復帰した直後

```
alarm はスリープ中止まっていたので、データは古い

アイコンをクリック
  ↓
データが 10〜60分前
  ↓
古いデータをまず表示（待ち 0 秒）+ 裏で更新
  ↓
更新完了 → 画面が静かに最新に切り替わる
```

### ケース4: 初回（トークン設定直後）

```
トークンを保存 → sync.onChanged が発火 → 即取得

以降はケース1と同じ
```

---

## API のレート制限について

GitHub GraphQL API は **5,000 ポイント/時**です。

現在のクエリのコストを概算すると:

```
search 20
+ comments      20×20 =   400
+ reviews       20×20 =   400
+ reviewThreads 20×20 =   400
+ labels        20×20 =   400
+ reviewThreads.comments 20×20×20 = 8,000
─────────────────────────────────────
≒ 9,620 ノード → 約 96 ポイント/回
```

10分間隔なら **6回/時 × 96 = 約 580 ポイント/時**。上限の **12%** です。`idle` トリガやフォールバックを足しても、`inFlight` とクールダウンのガードがあれば 20% 以内に収まります。

**ただしこの 96 は概算です。** クエリに実測用のフィールドを足しておくと正確な値が分かります。

```graphql
query GetPRComments {
  rateLimit { cost remaining resetAt }   # ← 追加
  search(...) { ... }
}
```

もし想定より大きければ、`reviewThreads.comments(first: 20)` を `first: 10` に下げるだけでコストが半減します（1つのコメントスレッドに20返信は現実的にほぼ無いため）。

---

## 実装上の注意点

### service worker のログは popup の DevTools に出ない

`chrome://extensions` → 対象の拡張機能 → **「Service Worker」** のリンクから専用の DevTools を開く必要があります。ここを知らないと「ログが出ない、動いていない」と誤解します。

同じ画面から手動で `refreshPrComments()` を実行できるので、**10分待たずに動作確認できます**。

### service worker はすぐ寝る

数十秒で停止するのが**正常な動作**です。「止まっている＝壊れている」ではありません。トリガが来れば起きます。

### スリープ中は alarm が止まる

これは Chrome の仕様で、回避できません。だから `idle: active` と `onStartup` を併用しています。

---

## 影響範囲とリスク

### 変更しないもの（安全な理由）

```
✅ src/apiClient/FetchGraphQLApiClient.ts                   無変更
✅ src/features/prComments/services/prCommentsService.ts    無変更
✅ src/features/prComments/components/*                     無変更
✅ src/features/threads/components/*                        無変更
✅ src/components/*                                         無変更
```

`useFetchPrComments` の**戻り値の形を維持する**ため、表示側は一切影響を受けません。仮に失敗しても、影響は hook と background に閉じています。

### 唯一の挙動変化

`App.tsx` の `QueryClient` 修正により、**これまで無効だった react-query のキャッシュが実際に効き始めます**。意図した修正ですが、既存の表示に何らかの影響が出る可能性はゼロではないので、動作確認の対象です。

---

## 段階的に進める案

一度に全部やらず、2段に分けると各段階で動作確認できます。

### Step 1（約30分・低リスク）

- `App.tsx` の `QueryClient` をモジュールスコープへ
- `prCommentsService.ts:55` と `PrCommentsListContainer.tsx:7` の `console.log` を削除

これだけで、**popup を開き直した際に react-query のキャッシュが効き始めます**。事前取得なしでも体感が改善する可能性があり、**そもそも事前取得がどれだけ必要かの判断材料**になります。

### Step 2（約2時間）

background による事前取得の一式。

Step 1 だけで十分だった、という結果もあり得るので、こちらから始めるのを勧めます。

---

## 用語のまとめ

| 用語 | 意味 |
|---|---|
| service worker | 画面を持たない裏方スクリプト。MV3 では常駐せず、イベントごとに起きて数十秒で停止する |
| `chrome.storage.sync` | 端末間で同期される保存領域。100KB。設定やトークン向け |
| `chrome.storage.local` | 同期されない保存領域。10MB。キャッシュ向け |
| `chrome.alarms` | Chrome 本体が管理するタイマー。停止中の service worker を起こせる |
| stale-while-revalidate | 古いデータをまず表示し、裏で更新して差し替える手法 |
| stale-while-error | 取得に失敗しても手元の古いデータを保持し続ける手法 |
| soft stale / hard stale | 「裏で更新すればいい古さ」と「待たせてでも取り直すべき古さ」の2段階の閾値 |
