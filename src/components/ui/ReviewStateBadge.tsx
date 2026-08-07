import { getReviewStateDisplay, isApprovedState } from "@/utils/reviewState";
import { CheckCircle } from "./icons/CheckCircle";

type ReviewStateBadgeProps = {
  state?: string;
  className?: string;
};

/**
 * レビュー状態（承認・変更リクエストなど）を色付きバッジで表示する
 */
export const ReviewStateBadge = ({
  state,
  className = "",
}: ReviewStateBadgeProps) => {
  const display = getReviewStateDisplay(state);
  if (!display) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${display.badgeClassName} ${className}`}
    >
      {isApprovedState(state) && <CheckCircle />}
      {display.label}
    </span>
  );
};
