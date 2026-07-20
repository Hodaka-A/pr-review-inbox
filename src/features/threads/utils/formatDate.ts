/**
 * 日付文字列を日本語フォーマットに変換
 * @param dateString - ISO形式の日付文字列
 * @returns フォーマットされた日付文字列
 */
export const formatDate = (dateString?: string): string => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
