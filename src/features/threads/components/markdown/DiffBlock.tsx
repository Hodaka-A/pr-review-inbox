import { parseDiffLines } from "../../utils/parseDiffLines";

type DiffBlockProps = {
  code: string;
};

/**
 * ```diff コードブロックを GitHub 風の行単位ハイライトで表示する。
 * 行頭マーカー列を濃色、本文側を淡色の 2 段で塗る。
 */
export const DiffBlock = ({ code }: DiffBlockProps) => {
  const lines = parseDiffLines(code);

  return (
    <div className="my-3 overflow-x-auto rounded-md bg-[#f6f8fa] py-2">
      <div className="w-max min-w-full font-mono text-[11px] leading-[18px]">
        {lines.map((line, index) => (
          <div
            key={index}
            className={
              line.type === "add"
                ? "flex bg-[#e6ffec]"
                : line.type === "del"
                ? "flex bg-[#ffebe9]"
                : "flex"
            }
          >
            {/* 行頭マーカー列 */}
            <span
              className={
                line.type === "add"
                  ? "w-7 shrink-0 select-none bg-[#ccffd8] px-2 text-[#1f2328]"
                  : line.type === "del"
                  ? "w-7 shrink-0 select-none bg-[#ffd7d5] px-2 text-[#1f2328]"
                  : "w-7 shrink-0 select-none px-2 text-gray-400"
              }
            >
              {line.type === "add" ? "+" : line.type === "del" ? "-" : ""}
            </span>
            {/* コード本文 */}
            <span className="whitespace-pre px-2 text-[#1f2328]">
              {line.content || " "}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
