import {
  fetchResponsePullRequestDataType,
  PullRequestWithCommentsType,
} from "@/types/pullRequestDataType";
import { FetchGraphQLApiClient } from "@/apiClient/FetchGraphQLApiClient";
import { deduplicateComments } from "../utils/deduplicateComments";
import { extractReviewComments } from "../utils/extractors/extractReviewComments";
import { extractThreadComments } from "../utils/extractors/extractThreadComments";
import { sortCommentsByCreatedAt } from "../utils/sortComments";

/**
 * GraphQLレスポンスをPullRequestWithComments型に変換
 * コメントがないPRは除外される
 * @param data - GraphQLレスポンスデータ
 * @returns 変換されたPullRequestの配列
 */
const transformPrSearchResults = (
  data: fetchResponsePullRequestDataType
): PullRequestWithCommentsType[] => {
  return data.search.edges
    .map((edge): PullRequestWithCommentsType => {
      const threadComments = extractThreadComments(edge.node.reviewThreads);
      const reviewsComments = extractReviewComments(edge.node.reviews);
      const mergedComments = [...threadComments, ...reviewsComments];
      const uniqueComments = deduplicateComments(mergedComments);
      const sortedComments = sortCommentsByCreatedAt(uniqueComments);

      return {
        title: edge.node.title,
        url: edge.node.url,
        number: edge.node.number,
        createdAt: edge.node.createdAt,
        updatedAt: edge.node.updatedAt,
        state: edge.node.state,
        isDraft: edge.node.isDraft,
        repository: edge.node.repository,
        comments: sortedComments,
        authorName: edge.node.author?.login,
        authorAvatarUrl: edge.node.author?.avatarUrl,
      };
    })
    .filter((pr) => pr.comments && pr.comments.length > 0);
};

/**
 * PRコメントをフェッチして変換
 * @param token - GitHub APIトークン
 * @returns 変換されたPullRequestの配列
 */
export const fetchPrComments = async (
  token: string
): Promise<PullRequestWithCommentsType[]> => {
  const client = new FetchGraphQLApiClient(token);
  const responseData = await client.fetch();
  return transformPrSearchResults(responseData);
};
