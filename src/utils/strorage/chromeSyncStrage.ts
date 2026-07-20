export const getChromeSyncStorage = async <T>(
  key: string,
): Promise<T> => {
  const result = await chrome.storage.sync.get([key]);
  return result as T;
};

export const setChromeSyncStorage = async <T>(
  key: string,
  item: T,
): Promise<void> => {
  await chrome.storage.sync.set({ [key]: item });
};
