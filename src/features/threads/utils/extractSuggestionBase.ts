/**
 * ```suggestion が置き換える「変更前」の行を diffHunk から復元する。
 *
 * GitHub の suggestion はコメントが付いた行範囲 [startLine, line]（変更後ファイル基準）を
 * 置き換える仕組みで、生 Markdown 側には置き換え後のコードしか含まれない。
 * diffHunk はコメント行で終わる unified diff なので、変更後ファイルに存在する行
 * （context と追加行）だけを残して末尾から範囲の行数分を取れば置き換え対象が得られる。
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

  const rangeSize = line - (startLine ?? line) + 1;
  if (rangeSize < 1) return null;

  // 変更後ファイルに存在する行だけを残す（削除行 `-` は変更後には無い）。
  // \ No newline at end of file のようなメタ行も除外する
  const newFileLines = diffHunk
    .replace(/\n$/, "")
    .split("\n")
    .filter((l) => !l.startsWith("@@") && !l.startsWith("-") && !l.startsWith("\\"))
    .map((l) => l.slice(1));

  // diffHunk はコメント行で終わるため、末尾 rangeSize 行が置き換え対象。
  // 行数が足りなければ範囲がずれている（コメント後にファイルが更新された等）ので諦める
  if (newFileLines.length < rangeSize) return null;

  return newFileLines.slice(newFileLines.length - rangeSize);
};
