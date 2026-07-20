import { fetchResponsePullRequestDataType } from "@/types/pullRequestDataType";
import { GET_PR_COMMENTS_QUERY } from "./queries/query";

export class FetchGraphQLApiClient {
  static readonly ENDPOINT: string = "https://api.github.com/graphql";

  constructor(private readonly token: string) {}

  public async fetch(
    variables?: Record<string, unknown>,
  ): Promise<fetchResponsePullRequestDataType> {
    const response = await fetch(FetchGraphQLApiClient.ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        query: `${GET_PR_COMMENTS_QUERY}`,
        variables: variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`GitHub API エラー: ${response.status} ${response.statusText}`);
    }

    const responseJson = await response.json();

    if(responseJson.errors) {
      console.error("GitHub GraphQL API エラー:", responseJson.errors);
      throw new Error(`GitHub GraphQL API エラー: ${responseJson.errors.map((err: { message: string }) => err.message).join(", ")}`);
    }

    return responseJson.data;
  }
}
