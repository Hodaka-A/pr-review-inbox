import { fetchPrComments } from "../services/prCommentsService";
import { useQuery } from "@tanstack/react-query";
import { useChromeSyncStorage } from "@/hooks/useChromeSyncStorage";
import { GITHUB_TOKEN_KEY } from "@/constants/storageKeys";

export const useFetchPrComments = () => {
  const { storedValue: token, isLoading: isTokenLoading } =
    useChromeSyncStorage<string | null>(GITHUB_TOKEN_KEY, null);

  const hasNoToken = !isTokenLoading && !token;

  const { data, error, isPending, isError } = useQuery({
    queryKey: ["prComments", token],
    queryFn: () => {
      if (!token) {
        throw new Error("GitHubトークンが設定されていません。設定画面からトークンを登録してください。");
      }
      return fetchPrComments(token);
    },
    enabled: !isTokenLoading && !!token,
  });

  return {
    prComments: data,
    isPending: isPending || isTokenLoading,
    isError: isError || hasNoToken,
    error: error || (hasNoToken ? new Error("GitHubトークンが設定されていません") : null),
  };
};
