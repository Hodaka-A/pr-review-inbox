import { ReviewThreadNode, ThreadComment } from "@/types/pullRequestDataType";

/**
 * ReviewThreadsからThreadCommentを抽出
 * スレッド情報（threadId, threadIndex, threadLatestCommentAt）を付与
 * @param reviewThreads - レビュースレッドデータ
 * @returns 抽出されたThreadCommentの配列
 */
export const extractThreadComments = (reviewThreads: {
  nodes: ReviewThreadNode[];
}): ThreadComment[] => {
  return reviewThreads.nodes.flatMap((thread,index) => {
    if (!thread.comments?.nodes || thread.comments.nodes.length === 0) {
      return [];
    }

    // スレッドIDを生成（ファイルパス + 行番号）
    const threadId = `${thread.path}:${thread.line}:${index}`; // indexを追加して一意性を確保

    // スレッドの作成日時（最初のコメントの作成日時）を取得
    const threadCreatedAt = thread.comments.nodes[0].createdAt;

    return thread.comments.nodes.map((comment, index) => ({
      commentType: "threadComment" as const,
      threadId,
      threadIndex: index,
      threadCreatedAt,
      author: comment.author?.login ?? "Unknown",
      avatarUrl: comment.author?.avatarUrl ?? "",
      isResolved: thread.isResolved,
      body: comment.body,
      createdAt: comment.createdAt,
      diffHunk: comment.diffHunk,
      url: comment.url,
      line: thread.line,
      path: thread.path,
    }));
  });
};
