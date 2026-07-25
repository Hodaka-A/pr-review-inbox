export type DiffHunkLineType = "add" | "del" | "context";

export type DiffHunkLine = {
  type: DiffHunkLineType;
  /** 変更前ファイルの行番号。追加行では null */
  oldLineNumber: number | null;
  /** 変更後ファイルの行番号。削除行では null */
  newLineNumber: number | null;
  /** 行頭の +/-/空白マーカーを除いた本文 */
  content: string;
};

/** @@ -8,7 +8,9 @@ 形式のヘッダーから変更前・変更後の開始行番号を取り出す */
const HUNK_HEADER = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

/**
 * diffHunk をパースし、各行に変更前・変更後の行番号を付与する。
 *
 * 行番号は @@ ヘッダーの開始行から 2 つのカウンタを進めて復元する。
 * 削除行は変更前のみ、追加行は変更後のみ、context 行は両方を進める。
 * diffHunk には複数の hunk が含まれ得るので、@@ に当たるたびにカウンタを張り替える。
 *
 * @param hunk - diffHunk 文字列
 * @returns 行番号付きの差分行の配列
 */
export const parseDiffHunk = (hunk: string): DiffHunkLine[] => {
  if (!hunk) return [];

  const lines: DiffHunkLine[] = [];
  let oldLineNumber = 0;
  let newLineNumber = 0;

  for (const line of hunk.replace(/\n$/, "").split("\n")) {
    const header = line.match(HUNK_HEADER);
    if (header) {
      oldLineNumber = Number(header[1]);
      newLineNumber = Number(header[2]);
      continue;
    }

    // --- / +++ のファイル名行と \ No newline at end of file は表示対象外
    if (
      line.startsWith("---") ||
      line.startsWith("+++") ||
      line.startsWith("\\")
    ) {
      continue;
    }

    if (line.startsWith("+")) {
      lines.push({
        type: "add",
        oldLineNumber: null,
        newLineNumber: newLineNumber++,
        content: line.slice(1),
      });
    } else if (line.startsWith("-")) {
      lines.push({
        type: "del",
        oldLineNumber: oldLineNumber++,
        newLineNumber: null,
        content: line.slice(1),
      });
    } else {
      lines.push({
        type: "context",
        oldLineNumber: oldLineNumber++,
        newLineNumber: newLineNumber++,
        content: line.slice(1),
      });
    }
  }

  return lines;
};
