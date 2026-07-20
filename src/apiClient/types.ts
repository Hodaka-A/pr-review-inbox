/**
 * GitHub GraphQL API共通型定義
 */

/**
 * GraphQLエラーレスポンス
 */
export type GraphQLError = {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: Array<string | number>;
  extensions?: Record<string, unknown>;
};

/**
 * GraphQLレスポンス基本型
 */
export type GraphQLResponse<T> = {
  data?: T;
  errors?: GraphQLError[];
};

/**
 * GraphQLリクエスト型
 */
export type GraphQLRequest = {
  query: string;
  variables?: Record<string, unknown>;
};
