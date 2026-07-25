type GitPullRequestDraftProps = {
  size?: number;
  className?: string;
};

export const GitPullRequestDraft = ({
  size = 16,
  className = "",
}: GitPullRequestDraftProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
    >
      {/* 左のブランチ（GitPullRequest と共通） */}
      <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm2.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" />
      {/* 右下のノード。マージ先がまだ確定していないので線でつながない */}
      <path d="M12.75 10.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Zm0 1.5a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5Z" />
      {/* 未完成であることを表す破線 */}
      <path d="M12.75 6.25a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5ZM12.75 2a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5Z" />
    </svg>
  );
};
