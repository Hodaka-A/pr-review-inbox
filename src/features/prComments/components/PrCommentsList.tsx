import { PullRequestWithCommentsType, MergedComment } from "@/types/pullRequestDataType";
import { PrCommentCard } from "./PrCommentCard";

type PrCommentsListProps = {
  prComments: PullRequestWithCommentsType[];
};

export const PrCommentsList = ({ prComments }: PrCommentsListProps) => {
  // ユニークな著者リストを取得
  const getUniqueAuthors = (comments?: MergedComment[]) => {
    const authorsMap = new Map<string, { name: string; avatarUrl: string }>();

    if (!comments) return [];

    for (const comment of comments) {
      const author = comment.author ?? "Unknown";
      const avatarUrl = comment.avatarUrl ?? "";
      if (!authorsMap.has(author)) {
        authorsMap.set(author, {
          name: author,
          avatarUrl,
        });
      }
    }

    return Array.from(authorsMap.values());
  };

  return (
    <div className="p-4 bg-slate-50 h-full overflow-y-auto">
      {prComments.map((pr, index) => {
        const prId = `pr-${pr.number}`;
        const uniqueAuthors = getUniqueAuthors(pr.comments);

        return (
          <PrCommentCard
            key={index}
            pr={pr}
            prId={prId}
            uniqueAuthors={uniqueAuthors}
          />
        );
      })}
    </div>
  );
};
