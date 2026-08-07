/**
 * レビュー状態（GraphQL の PullRequestReviewState）の表示情報
 */
type ReviewStateDisplay = {
  /** 表示ラベル */
  label: string;
  /** バッジの配色（Tailwind クラス） */
  badgeClassName: string;
};

/** 承認を表す文字・アイコンの色 */
export const APPROVED_TEXT_CLASS = "text-green-800";

const REVIEW_STATE_DISPLAY: Record<string, ReviewStateDisplay> = {
  APPROVED: {
    label: "approved",
    badgeClassName: `bg-green-100 ${APPROVED_TEXT_CLASS} border-green-300`,
  },
  CHANGES_REQUESTED: {
    label: "changes requested",
    badgeClassName: "bg-red-100 text-red-800 border-red-300",
  },
  COMMENTED: {
    label: "commented",
    badgeClassName: "bg-gray-100 text-gray-700 border-gray-300",
  },
  DISMISSED: {
    label: "dismissed",
    badgeClassName: "bg-gray-100 text-gray-500 border-gray-300",
  },
  PENDING: {
    label: "pending",
    badgeClassName: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
};

export const isApprovedState = (state?: string) => state === "APPROVED";

/**
 * レビュー状態の表示情報を取得
 * 未知の state は SNAKE_CASE を小文字の語に整えて表示する
 * @param state - レビュー状態
 * @returns 表示情報。state が無い場合は null
 */
export const getReviewStateDisplay = (
  state?: string
): ReviewStateDisplay | null => {
  if (!state) return null;

  return (
    REVIEW_STATE_DISPLAY[state] ?? {
      label: state.toLowerCase().replace(/_/g, " "),
      badgeClassName: "bg-gray-100 text-gray-700 border-gray-300",
    }
  );
};
