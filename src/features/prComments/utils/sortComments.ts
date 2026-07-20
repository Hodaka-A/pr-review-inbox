import { ThreadComment, ReviewComment } from "@/types/pullRequestDataType";

/**
 * コメントをソート（スレッド対応）
 * - スレッドは作成日時で昇順（古いスレッドが上）
 * - スレッド内のコメントは古い順（threadIndex昇順）
 * - 単独のレビューコメントは作成日時で昇順
 * @param comments - ソート対象のコメント配列
 * @returns ソートされたコメント配列
 */
export const sortCommentsByCreatedAt = (
  comments: (ThreadComment | ReviewComment)[]
): (ThreadComment | ReviewComment)[] => {
  return [...comments].sort((a, b) => {
    // 1. スレッド作成日時 or 作成日時で比較（昇順 = 古い方が上）
    const aThreadTime =
      a.commentType === "threadComment"
        ? a.threadCreatedAt
        : a.createdAt || "";
    const bThreadTime =
      b.commentType === "threadComment"
        ? b.threadCreatedAt
        : b.createdAt || "";

    if (aThreadTime !== bThreadTime) {
      return aThreadTime.localeCompare(bThreadTime); // 昇順
    }

    // 2. 同じスレッドの場合、threadIndexで比較（昇順 = 古い方が上）
    if (
      a.commentType === "threadComment" &&
      b.commentType === "threadComment"
    ) {
      if (a.threadId === b.threadId) {
        return a.threadIndex - b.threadIndex; // 昇順
      }
    }

    // 3. 最終的にcreatedAtで比較（昇順）
    const aTime = a.createdAt || "";
    const bTime = b.createdAt || "";
    return aTime.localeCompare(bTime); // 昇順
  });
};
