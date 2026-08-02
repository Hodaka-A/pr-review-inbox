import { Avatar } from "@/components/ui/Avatar";
import { Chat } from "@/components/ui/icons/Chat";
import { GitPullRequest } from "@/components/ui/icons/GitPullRequest";
import { GitPullRequestDraft } from "@/components/ui/icons/GitPullRequestDraft";
import { usePrThreadNavigation } from "@/contexts/prThreadNavigationContext";
import { PullRequestWithCommentsType } from "@/types/pullRequestDataType";
import { formatUpdatedAt } from "../utils/formatDate";
import { stripMarkdown } from "../utils/stripMarkdown";

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

  // 最新のコメントを取得
  const latestComment = pr.comments?.[pr.comments.length - 1];

  return (
    <div
      className="border border-gray-200 rounded-lg bg-white shadow-sm mb-3 cursor-pointer hover:bg-gray-50 transition-colors duration-150 p-4"
      onClick={handleCardClick}
    >
      <div className="flex gap-3">
        {/* PR Icon */}
        <div className="shrink-0 pt-1" title={pr.isDraft ? "下書き" : "オープン"}>
          {pr.isDraft ? (
            <GitPullRequestDraft size={20} className="text-gray-400" />
          ) : (
            <GitPullRequest size={20} className="text-green-600" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Updated Time */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <h2 className="text-base font-bold text-gray-900 flex-1">
              {pr.title}
            </h2>
            <span className="text-sm text-gray-500 shrink-0">
              {formatUpdatedAt(pr.updatedAt)}
            </span>
          </div>

          {/* Repo Info */}
          <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
            <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">
              {pr.repository?.nameWithOwner ?? "Unknown"} #{pr.number}
            </span>

            {/* Avatars and Comment Count */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {uniqueAuthors.map((author, idx) => (
                  <Avatar
                    key={`${prId}-badge-${idx}`}
                    src={author.avatarUrl}
                    alt={author.name}
                    size={24}
                  />
                ))}
              </div>
              <Chat size={16} className="text-gray-500" />
              <span className="text-gray-900 font-medium">
                {pr.comments?.filter((comment) => comment.author !== pr.authorName)
                  .length ?? 0}件
              </span>
            </div>
          </div>

          {/* Latest Comment Preview */}
          {latestComment && latestComment.body && (
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <Avatar
                src={latestComment.avatarUrl || ""}
                alt={latestComment.author || ""}
                size={24}
              />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-gray-700">{latestComment.author}</span>
                <span className="text-gray-500">: </span>
                <span className="text-gray-600">
                  {(() => {
                    const plainText = stripMarkdown(latestComment.body);
                    return plainText.substring(0, 40) + (plainText.length > 40 ? "..." : "");
                  })()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
