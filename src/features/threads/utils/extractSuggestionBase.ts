import { parseDiffHunk } from "./parseDiffHunk";

/**
 * ```suggestion が置き換える「変更前」の行を diffHunk から復元する。
 *
 * GitHub の suggestion はコメントが付いた行範囲 [startLine, line]（変更後ファイル基準）を
 * 置き換える仕組みで、生 Markdown 側には置き換え後のコードしか含まれない。
 * parseDiffHunk が各行に変更後の行番号を振るので、その範囲に入る行を拾えば置き換え対象になる。
 *
 * @param diffHunk - スレッドの diffHunk（@@ ヘッダー付きの unified diff）
 * @param line - コメントが付いた終了行（変更後ファイル基準）
 * @param startLine - コメントが付いた開始行。単一行なら line と同値
 * @returns 変更前の行の配列。復元できない場合は null
 */
export const extractSuggestionBase = (
  diffHunk?: string,
  line?: number,
  startLine?: number,
): string[] | null => {
  if (!diffHunk || !line) return null;

  const from = startLine ?? line;
  if (from > line) return null;

  // 変更後ファイル基準の行範囲に入る行を拾う（削除行は変更後に存在しないので newLineNumber が null）
  const baseLines = parseDiffHunk(diffHunk)
    .filter(
      (diffLine) =>
        diffLine.newLineNumber !== null &&
        diffLine.newLineNumber >= from &&
        diffLine.newLineNumber <= line,
    )
    .map((diffLine) => diffLine.content);

  // 範囲を全て復元できなかった場合（コメント後にファイルが更新された等）は諦める
  if (baseLines.length !== line - from + 1) return null;

  return baseLines;
};
