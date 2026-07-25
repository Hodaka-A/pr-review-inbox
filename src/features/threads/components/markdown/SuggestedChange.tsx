type SuggestedChangeProps = {
  /** ```suggestion の中身（置き換え後のコード） */
  code: string;
  /** 置き換え前の行。diffHunk から復元できなかった場合は undefined */
  baseLines?: string[];
};

/**
 * ```suggestion コードブロックを GitHub の「Suggested change」ブロック風に表示する。
 *
 * 生 Markdown には置き換え後のコードしか含まれないため、置き換え前の行は
 * extractSuggestionBase が diffHunk から復元したものを baseLines で受け取る。
 * 復元できない場合（レビューコメントで diffHunk が無い等）は追加行のみを表示する。
 */
export const SuggestedChange = ({ code, baseLines }: SuggestedChangeProps) => {
  const suggestedLines = code.replace(/\n$/, "").split("\n");

  return (
    <div className="my-2 overflow-hidden rounded-md border border-[#d1d9e0] bg-white">
      {/* ヘッダー */}
      <div className="border-b border-[#d1d9e0] bg-[#f6f8fa] px-3 py-1.5 text-[11px] text-[#1f2328]">
        Suggested change
      </div>

      <div className="overflow-x-auto overflow-y-hidden">
        <div className="w-max min-w-full font-mono text-[11px] leading-[18px]">
          {/* 変更前（削除行） */}
          {baseLines?.map((line, index) => (
            <div key={`del-${index}`} className="flex bg-[#ffebe9]">
              <span className="w-7 shrink-0 select-none bg-[#ffd7d5] px-2 text-[#1f2328]">
                -
              </span>
              <span className="whitespace-pre px-2 text-[#1f2328]">
                {line || " "}
              </span>
            </div>
          ))}

          {/* 変更後（追加行） */}
          {suggestedLines.map((line, index) => (
            <div key={`add-${index}`} className="flex bg-[#e6ffec]">
              <span className="w-7 shrink-0 select-none bg-[#ccffd8] px-2 text-[#1f2328]">
                +
              </span>
              <span className="whitespace-pre px-2 text-[#1f2328]">
                {line || " "}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
