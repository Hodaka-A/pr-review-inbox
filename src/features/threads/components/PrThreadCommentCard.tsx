import { Avatar } from "@/components/ui/Avatar";
import { ReviewStateBadge } from "@/components/ui/ReviewStateBadge";
import { CheckCircle } from "@/components/ui/icons/CheckCircle";
import { MergedComment } from "@/types/pullRequestDataType";
import { APPROVED_TEXT_CLASS, isApprovedState } from "@/utils/reviewState";
import { formatDate } from "../utils/formatDate";
import { CommentMarkdown } from "./markdown/CommentMarkdown";

type PrThreadCommentCardProps = {
 comment:MergedComment;
};

export const PrThreadCommentCard = ({ comment }: PrThreadCommentCardProps) => {
  const reviewState =
    comment.commentType === "reviewerComment" ? comment.state : undefined;
  const isApproved = isApprovedState(reviewState);
  const hasBody = !!comment.body && comment.body.trim() !== "";

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
        <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-200 bg-gray-50 px-3 py-2">
          <span className="text-xs text-gray-900">
            <b className="font-semibold">{comment.author ?? "Unknown"}</b>
          </span>
          <span className="text-[11px] text-gray-500">
            {formatDate(comment.createdAt)}
          </span>
          {!isApproved && (
            <ReviewStateBadge state={reviewState} className="ml-auto" />
          )}
        </div>

        {/* Comment Body */}
        <div className="px-3 py-2.5">
          {/* 承認は本文が空でも承認したことがわかるように表示する */}
          {isApproved && (
            <div
              className={`flex items-center gap-1 text-xs font-medium ${APPROVED_TEXT_CLASS} ${
                hasBody ? "mb-2" : ""
              }`}
            >
              <CheckCircle />
              approved
            </div>
          )}
          {hasBody && (
            <CommentMarkdown
              body={comment.body ?? ""}
              {...(comment.commentType === "threadComment"
                ? {
                    diffHunk: comment.diffHunk,
                    line: comment.line,
                    startLine: comment.startLine,
                  }
                : {})}
            />
          )}
        </div>
      </div>
    </div>
  );
};
