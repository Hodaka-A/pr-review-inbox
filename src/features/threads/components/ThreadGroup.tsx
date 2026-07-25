import { useState } from "react";
import { ThreadComment } from "@/types/pullRequestDataType";
import { PrThreadCommentCard } from "./PrThreadCommentCard";
import { parseDiffHunk } from "../utils/parseDiffHunk";

type ThreadGroupProps = {
  threadId: string;
  comments: ThreadComment[];
  isResolved: boolean;
  path: string;
};

export const ThreadGroup = ({
  threadId,
  comments,
  isResolved,
  path,
}: ThreadGroupProps) => {
  // 未解決スレッドはデフォルトで展開、解決済みは折りたたみ
  const [isExpanded, setIsExpanded] = useState(!isResolved);

  const firstComment = comments[0];
  const diffHunk = firstComment?.diffHunk || "";
  const diffLines = parseDiffHunk(diffHunk);

  return (
    <div className="mb-6 border border-gray-300 rounded-md overflow-hidden bg-white">
      {/* ファイルパスヘッダー（折りたたみ可能） */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 text-xs text-gray-700 transition-colors text-left border-b border-gray-300"
      >
        {/* 展開/折りたたみアイコン */}
        <span className="shrink-0 text-gray-500">
          {isExpanded ? "▼" : "▶"}
        </span>

        {/* ファイルパス */}
        <span className="text-xs flex-1 truncate">
          {path}
        </span>

        {/* 解決状態 */}
        {isResolved && (
          <span className="text-green-700 text-xs shrink-0">✓ Resolved</span>
        )}

        {/* コメント数 */}
        <span className="text-gray-500 text-xs shrink-0">
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </span>
      </button>

      {/* 展開時の内容 */}
      {isExpanded && (
        <div>
          {/* 差分コード表示 */}
          {diffLines.length > 0 && (
            <div className="bg-gray-50 border-b border-gray-300 overflow-x-auto overflow-y-hidden">
              <div className="font-mono text-[12px] leading-[20px] min-w-max">
                {diffLines.map((line, index) => {
                  const isAddition = line.type === "add";
                  const isDeletion = line.type === "del";

                  return (
                    <div
                      key={index}
                      className={`flex items-stretch ${
                        isAddition
                          ? "bg-[#e6ffec]"
                          : isDeletion
                          ? "bg-[#ffebe9]"
                          : "bg-white"
                      }`}
                    >
                      {/* 行番号（変更前 / 変更後） */}
                      <div
                        className={`flex shrink-0 select-none border-r ${
                          isAddition
                            ? "bg-[#ccffd8] text-[#24292f]/60 border-[#bef5cb]"
                            : isDeletion
                            ? "bg-[#ffd7d5] text-[#24292f]/60 border-[#ffc1bc]"
                            : "bg-white text-gray-400 border-gray-200"
                        }`}
                      >
                        <span className="w-[36px] px-1.5 text-right">
                          {line.oldLineNumber ?? ""}
                        </span>
                        <span className="w-[36px] px-1.5 text-right">
                          {line.newLineNumber ?? ""}
                        </span>
                      </div>

                      {/* +/- マーカー */}
                      <div
                        className={`w-[20px] shrink-0 text-center select-none ${
                          isAddition
                            ? "bg-[#e6ffec] text-[#116329]"
                            : isDeletion
                            ? "bg-[#ffebe9] text-[#82071e]"
                            : "bg-white text-gray-300"
                        }`}
                      >
                        {isAddition ? "+" : isDeletion ? "-" : ""}
                      </div>

                      {/* コード内容 */}
                      <div className="px-2 flex-1 whitespace-pre text-[#24292f]">
                        {line.content || " "}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* コメント一覧 */}
          <div className="p-3">
            {comments.map((comment, index) => (
              <PrThreadCommentCard key={`${threadId}-${index}`} comment={comment} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
