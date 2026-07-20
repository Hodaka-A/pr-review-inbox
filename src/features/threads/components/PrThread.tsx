import { ChevronLeft } from "@/components/ui/icons/ChevronLeft";
import { Redirect } from "@/components/ui/icons/Redirect";
import { PullRequestWithCommentsType } from "@/types/pullRequestDataType";
import { groupCommentsByThread } from "../utils/groupCommentsByThread";
import { PrThreadCommentCard } from "./PrThreadCommentCard";
import { ThreadGroup } from "./ThreadGroup";

type PrThreadProps = {
  pr?: PullRequestWithCommentsType;
  setIsShowingThread: (isShowingThread: boolean) => void;
};

export const PrThread = ({ pr, setIsShowingThread }: PrThreadProps) => {
  const timeline = groupCommentsByThread(pr?.comments || []);
  console.log(timeline)
  return (
    <div className="min-h-[60px]">
      {/* Header Container */}
      <div className="bg-white border-b border-gray-300 flex flex-col">
        {/* Header Content */}
        <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-200">
          {/* Back Button */}
          <button
            type="button"
            onClick={() => setIsShowingThread(false)}
            title="一覧へ戻る"
            className="flex items-center justify-center w-7 h-7 rounded-md text-gray-700 hover:bg-gray-100 cursor-pointer shrink-0"
          >
            <ChevronLeft size={20} className="text-gray-400" />
          </button>

          {/* PR Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold truncate">{pr?.title}</h2>
            <div className="mt-1 text-sm text-gray-600">
              {pr?.repository?.nameWithOwner} #{pr?.number}
            </div>
          </div>

          {/* GitHub Link Button */}
          <a
            href={pr?.url}
            target="_blank"
            rel="noreferrer"
            title="GitHub で開く"
            className="flex items-center justify-center w-7 h-7 rounded-md text-gray-500 hover:bg-gray-100 cursor-pointer shrink-0"
          >
            <Redirect size={20} className="text-blue-600" />
          </a>
        </div>
      </div>

      <div className="p-4 bg-slate-50 h-full overflow-y-auto">
        {/* 時系列順にスレッドと単独コメントを表示 */}
        {timeline.map((item, index) => {
          if (item.type === "thread") {
            const firstComment = item.comments[0];
            return (
              <ThreadGroup
                key={item.threadId}
                threadId={item.threadId}
                comments={item.comments}
                isResolved={firstComment.isResolved ?? false}
                path={firstComment.path ?? ""}
              />
            );
          } else {
            return (
              <PrThreadCommentCard
                key={`single-${index}`}
                comment={item.comment}
              />
            );
          }
        })}
      </div>
    </div>
  );
};
