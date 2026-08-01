import { PullRequestWithCommentsType } from "@/types/pullRequestDataType";
import {
  getChromeLocalStorage,
  setChromeLocalStorage,
} from "../strorage/chromeLocalStrage";

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