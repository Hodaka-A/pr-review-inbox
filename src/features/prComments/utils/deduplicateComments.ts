import { ThreadComment, ReviewComment } from "@/types/pullRequestDataType";

/**
 * コメントの重複を削除
 * ThreadCommentを優先的に保持
 * @param comments - コメントの配列
 * @returns 重複が削除されたコメントの配列
 */
export const deduplicateComments = (
  comments: (ThreadComment | ReviewComment)[]
): (ThreadComment | ReviewComment)[] => {
  const commentMap = new Map<string, ThreadComment | ReviewComment>();

  for (const comment of comments) {
    const key = 'url' in comment && comment.url
      ? comment.url
      : `${comment.author}-${comment.createdAt}-${comment.body}`;

    if (!commentMap.has(key) || comment.commentType === 'threadComment') {
      commentMap.set(key, comment);
    }
  }

  return Array.from(commentMap.values());
};
