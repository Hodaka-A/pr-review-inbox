export type DiffLineType = "add" | "del" | "context";

export type DiffLine = {
  type: DiffLineType;
  /** 行頭の +/- マーカーを除いた本文 */
  content: string;
};

/**
 * ```diff コードブロックの中身を 1 行ずつ +/-/context に分類する
 * @param code - コードフェンスの中身
 * @returns 分類済みの差分行の配列
 */
export const parseDiffLines = (code: string): DiffLine[] => {
  return code
    .replace(/\n$/, "")
    .split("\n")
    .map((line) => {
      if (line.startsWith("+")) return { type: "add" as const, content: line.slice(1) };
      if (line.startsWith("-")) return { type: "del" as const, content: line.slice(1) };
      return { type: "context" as const, content: line };
    });
};
