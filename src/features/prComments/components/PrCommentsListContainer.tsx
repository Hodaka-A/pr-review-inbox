import { useFetchPrComments } from "../hooks/useFetchPrCommets";
import { PrCommentsList } from "./PrCommentsList";
import { Loading } from "./Loading";

export const PrCommentsListContainer = () => {
  const { prComments, isPending, isError, error } = useFetchPrComments();

  if (isPending) {
    return <Loading />;
  }

  if (isError) {
    return <div>Error: {error?.message}</div>;
  }

  if (!prComments || prComments.length === 0) {
    return <div>No pull request comments found.</div>;
  }

  return <PrCommentsList prComments={prComments!} />;
};
