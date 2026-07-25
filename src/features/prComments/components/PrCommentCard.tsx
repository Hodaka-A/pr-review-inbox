import { Chat } from "@/components/ui/icons/Chat";
import { ChevronRight } from "@/components/ui/icons/ChevronRight";
import { GitPullRequest } from "@/components/ui/icons/GitPullRequest";
import { GitPullRequestDraft } from "@/components/ui/icons/GitPullRequestDraft";
import { usePrThreadNavigation } from "@/contexts/prThreadNavigationContext";
import { PullRequestWithCommentsType } from "@/types/pullRequestDataType";

type PrCommentCardProps = {
  pr: PullRequestWithCommentsType;
  prId: string;
  uniqueAuthors: { name: string; avatarUrl: string }[];
};

export const PrCommentCard = ({
  pr,
  prId,
  uniqueAuthors,
}: PrCommentCardProps) => {
  const { setPrData, setIsShowingThread } = usePrThreadNavigation();

  const handleCardClick = () => {
    setPrData(pr);
    setIsShowingThread(true);
  };

  return (
    <div className="border border-gray-300 rounded-lg bg-white shadow-sm mb-4">
      {/* PR Header */}
      <div className="p-4">
        <div className="flex gap-3 items-center">
          {/* PR Icon */}
          <div title={pr.isDraft ? "下書き" : "オープン"}>
            {pr.isDraft ? (
              <GitPullRequestDraft size={20} className="text-gray-400" />
            ) : (
              <GitPullRequest size={20} className="text-green-600" />
            )}
          </div>
          {/* PR Content */}
          <div className="flex-1 min-w-0">
            {/* Title and Link */}
            <a
              href={pr.url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 transition-colors block"
            >
              <h2 className="text-base font-bold">{pr.title}</h2>
            </a>

            {/* Repo Info */}
            <div className="mt-1 text-sm text-gray-600">
              {pr.repository?.nameWithOwner ?? "Unknown"} #{pr.number}
            </div>
          </div>
        </div>
      </div>

      {/* Comment Summary */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-150" onClick={handleCardClick}>
        {/* Comment Icon */}
        <Chat />

        {/* Avatars */}
        <div className="flex -space-x-1">
          {uniqueAuthors.map((author, idx) => (
            <div
              key={`${prId}-author-${idx}`}
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-medium"
            >
              <img
                src={author.avatarUrl}
                alt={author.name}
                className="w-full h-full rounded-full border border-gray-300 bg-white"
              />
            </div>
          ))}
        </div>

        {/* Comment Text */}
        <div className="flex-1 text-sm">
          <span className="font-medium text-gray-900">
            {pr.comments?.filter((comment) => comment.author !== pr.authorName)
              .length ?? 0}
            件のコメント
          </span>
        </div>

        {/* Arrow */}
        <ChevronRight size={20} className="text-gray-400" />
      </div>
    </div>
  );
};
