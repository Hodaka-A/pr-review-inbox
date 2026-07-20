import { fetchPrComments } from "../services/prCommentsService";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getChromeSyncStorage } from "@/utils/strorage/chromeSyncStrage";
import { GITHUB_TOKEN_KEY } from "@/constants/storageKeys";

export const useFetchPrComments = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isTokenLoaded, setIsTokenLoaded] = useState(false);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const result = await getChromeSyncStorage<{ [GITHUB_TOKEN_KEY]: string }>(GITHUB_TOKEN_KEY);
        if (result[GITHUB_TOKEN_KEY]) {
          setToken(result[GITHUB_TOKEN_KEY]);
        }
      } catch (error) {
        console.error("Failed to load token:", error);
      } finally {
        setIsTokenLoaded(true);
      }
    };
    loadToken();
  }, []);

  const { data, error, isPending, isError } = useQuery({
    queryKey: ["prComments", token],
    queryFn: () => {
      if (!token) {
        throw new Error("GitHubトークンが設定されていません。設定画面からトークンを登録してください。");
      }
      return fetchPrComments(token);
    },
    enabled: isTokenLoaded && !!token,
  });

  return {
    prComments: data,
    isPending: isPending || !isTokenLoaded,
    isError: isError || (isTokenLoaded && !token),
    error: error || (isTokenLoaded && !token ? new Error("GitHubトークンが設定されていません") : null),
  };
};
