import { MergedComment, ThreadComment } from "@/types/pullRequestDataType";

export type TimelineItem =
  | { type: "thread"; threadId: string; comments: ThreadComment[]; createdAt: string }
  | { type: "single"; comment: MergedComment; createdAt: string };

/**
 * コメントをスレッドごとにグルーピングし、時系列順に並べる
 * @param comments - コメント配列
 * @returns 時系列順に並べられたスレッドと単独コメントの配列
 */
export const groupCommentsByThread = (comments: MergedComment[]): TimelineItem[] => {
  const threadsMap = new Map<string, ThreadComment[]>();
  const singleComments: MergedComment[] = [];

  // スレッドと単独コメントを分類
  for (const comment of comments) {
    if (comment.commentType === "threadComment") {
      const existing = threadsMap.get(comment.threadId);
      if (!existing) {
        threadsMap.set(comment.threadId, [comment]);
      } else {
        existing.push(comment);
      }
    } else {
      singleComments.push(comment);
    }
  }

  // タイムラインアイテムを作成
  const timeline: TimelineItem[] = [];

  // スレッドをタイムラインアイテムに変換
  for (const [threadId, threadComments] of threadsMap) {
    timeline.push({
      type: "thread",
      threadId,
      comments: threadComments,
      createdAt: threadComments[0].threadCreatedAt,
    });
  }

  // 単独コメントをタイムラインアイテムに変換
  for (const comment of singleComments) {
    timeline.push({
      type: "single",
      comment,
      createdAt: comment.createdAt || "",
    });
  }

  // 時系列順にソート
  timeline.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return timeline;
};
