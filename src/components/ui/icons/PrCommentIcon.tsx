import iconUrl from "@/assets/pr_comment_icon_white_64.svg";

type PrCommentIconProps = {
  size?: number;
};

export const PrCommentIcon = ({ size = 32 }: PrCommentIconProps) => {
  return (
    <img
      src={iconUrl}
      alt="PR Comment Icon"
      width={size}
      height={size}
      className="shrink-0"
    />
  );
};
