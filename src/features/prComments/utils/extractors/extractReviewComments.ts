import { ReviewNode, ReviewComment } from "@/types/pullRequestDataType";

/**
 * ReviewsからReviewCommentを抽出
 * bodyが空のコメントは除外
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
    .filter((comment) => comment.body && comment.body.trim() !== "");
};
