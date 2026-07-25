/**
 * chrome.storage.sync から 1 キー分の値を取り出す。
 * chrome.storage.sync.get は { [key]: value } 形式のオブジェクトを返すので、
 * ここでキーを開いて値だけを返す（未保存のキーはオブジェクトに含まれない）
 * @param key - ストレージキー
 * @returns 保存された値。未保存なら undefined
 */
export const getChromeSyncStorage = async <T>(
  key: string,
): Promise<T | undefined> => {
  const result = await chrome.storage.sync.get([key]);
  return result[key] as T | undefined;
};

export const setChromeSyncStorage = async <T>(
  key: string,
  item: T,
): Promise<void> => {
  await chrome.storage.sync.set({ [key]: item });
};
