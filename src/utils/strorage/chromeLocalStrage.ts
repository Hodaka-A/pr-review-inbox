/**
 * chrome.storage.local から 1 キー分の値を取り出す。
 * chrome.storage.local.get は { [key]: value } 形式のオブジェクトを返すので、
 * ここでキーを開いて値だけを返す（未保存のキーはオブジェクトに含まれない）
 * @param key - ストレージキー
 * @returns 保存された値。未保存なら undefined
 */
export const getChromeLocalStorage = async <T>(
  key: string,
): Promise<T | undefined> => {
  const result = await chrome.storage.local.get([key]);
  return result[key] as T | undefined;
};

export const setChromeLocalStorage = async <T>(
  key: string,
  item: T,
): Promise<void> => {
  await chrome.storage.local.set({ [key]: item });
};
