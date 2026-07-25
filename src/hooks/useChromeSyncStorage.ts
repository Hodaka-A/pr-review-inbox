import {
  getChromeSyncStorage,
  setChromeSyncStorage,
} from "@/utils/strorage/chromeSyncStrage";
import { useCallback, useEffect, useState } from "react";

/**
 * chrome.storage.sync と同期する状態を返す。
 * @param key - ストレージキー
 * @param initialValue - 保存値が読み込まれるまで、および未保存だった場合に使う値
 */
export const useChromeSyncStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const loadStoredValue = async () => {
      try {
        const value = await getChromeSyncStorage<T>(key);

        if (!ignore && value !== undefined) setStoredValue(value);
      } catch (error) {
        console.error(error);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    loadStoredValue();

    return () => {
      ignore = true;
    };
  }, [key]);

  const saveValue = useCallback(async (value: T) => {
    setStoredValue(value);
    try {
      await setChromeSyncStorage(key, value);
    } catch (error) {
      console.error(error);
    }
  }, [key]);

  return { storedValue, saveValue, isLoading };
};
