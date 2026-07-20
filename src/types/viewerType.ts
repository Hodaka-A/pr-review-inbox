/**
 * GitHub Viewer（認証済みユーザー）の型定義
 */

/**
 * Viewer型定義（認証済みユーザー）
 */
export type Author = {
  login: string;
  name: string | null;
  email: string;
  avatarUrl: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  url: string;
};

/**
 * Authorクエリのレスポンス型
 */
export type fetchGetAuthorResponse = {
  viewer: Author;
};
