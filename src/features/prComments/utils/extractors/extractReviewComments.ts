import { ReviewNode, ReviewComment } from "@/types/pullRequestDataType";

/**
 * bodyが空でも残すレビュー状態
 * 承認は本文なしで送られることが多く、本文の有無に関わらず表示したい
 */
const KEEP_WITHOUT_BODY_STATES = new Set(["APPROVED"]);

/**
 * ReviewsからReviewCommentを抽出
 * bodyが空のコメントは除外するが、承認レビューは本文が空でも残す
 * @param reviews - レビューデータ
 * @returns 抽出されたReviewCommentの配列
 */
export const extractReviewComments = (reviews: {
  nodes: ReviewNode[];
}): ReviewComment[] => {
  return reviews.nodes
    .map((review): ReviewComment => ({
      commentType: "reviewerComment",
      author: review.author?.login ?? "Unknown",
      avatarUrl: review.author?.avatarUrl ?? "",
      state: review.state,
      submittedAt: review.submittedAt,
      body: review.body,
      createdAt: review.submittedAt,
    }))
    .filter(
      (comment) =>
        (comment.body && comment.body.trim() !== "") ||
        KEEP_WITHOUT_BODY_STATES.has(comment.state ?? "")
    );
};
