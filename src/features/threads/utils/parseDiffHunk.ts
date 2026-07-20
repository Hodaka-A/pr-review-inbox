/**
 * diffHunkをパースして行ごとに分割
 * @@で始まる行と+++/---で始まる行を除外
 * @param hunk - diffHunk文字列
 * @returns パースされた差分行の配列
 */
export const parseDiffHunk = (hunk: string): string[] => {
  if (!hunk) return [];
  return hunk
    .split("\n")
    .filter((line) => {
      // @@で始まる行と+++/---で始まる行を除外
      return (
        !line.startsWith("@@") &&
        !line.startsWith("+++") &&
        !line.startsWith("---")
      );
    });
};
