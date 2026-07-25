import { Avatar } from "@/components/ui/Avatar";
import { MergedComment } from "@/types/pullRequestDataType";
import { formatDate } from "../utils/formatDate";
import { enhanceDiffHtml } from "../utils/enhanceDiffHtml";

type PrThreadCommentCardProps = {
 comment:MergedComment;
};

export const PrThreadCommentCard = ({ comment }: PrThreadCommentCardProps) => {

  return (
    <div className="mb-6 flex gap-2">
      {/* Avatar */}
      <Avatar
        size={28}
        src={comment.avatarUrl ?? ""}
        alt={comment.author ?? "Unknown"}
      />

      {/* Comment Card */}
      <div className="flex-1 min-w-0 overflow-hidden rounded-md border border-gray-200 bg-white">
        {/* Comment Header */}
        <div className="flex items-center gap-1.5 border-b border-gray-200 bg-gray-50 px-3 py-2">
          <span className="text-xs text-gray-900">
            <b className="font-semibold">{comment.author ?? "Unknown"}</b>
          </span>
          <span className="text-[11px] text-gray-500">
            {formatDate(comment.createdAt)}
          </span>
        </div>

        {/* Comment Body */}
        {comment.bodyHTML ? (
          <div
            className="px-3 py-2.5 text-xs leading-relaxed text-gray-900 markdown-body"
            dangerouslySetInnerHTML={{ __html: enhanceDiffHtml(comment.bodyHTML) }}
          />
        ) : (
          <div className="px-3 py-2.5 text-xs leading-relaxed text-gray-900 whitespace-pre-wrap">
            {comment.body ?? ""}
          </div>
        )}

        {/* Additional Info for Review Comments */}
        {comment.commentType === "reviewerComment" && comment.state && (
          <div className="px-3 pb-2 text-[11px] text-gray-500">
            レビュー: {comment.state}
          </div>
        )}
      </div>
    </div>
  );
};
