import { Setting } from "@/components/ui/icons/Setting";
import { Redirect } from "@/components/ui/icons/Redirect";
import { useState, useEffect } from "react";
import { getChromeSyncStorage, setChromeSyncStorage } from "@/utils/strorage/chromeSyncStrage";
import { GITHUB_TOKEN_KEY } from "@/constants/storageKeys";

type SettingModalProps = {
  onClose: () => void;
};

export const SettingModal = ({ onClose }: SettingModalProps) => {
  const [token, setToken] = useState("");

  // モーダルを開いたときに保存されているトークンを読み込む
  useEffect(() => {
    const loadToken = async () => {
      try {
        const result = await getChromeSyncStorage<string>(GITHUB_TOKEN_KEY);
          setToken(result);
      } catch (error) {
        console.error("Failed to load token:", error);
      }
    };
    loadToken();
  }, []);

  const handleSave = async () => {
    try {
      await setChromeSyncStorage(GITHUB_TOKEN_KEY, token);
      console.log("Token saved successfully");
      onClose();
    } catch (error) {
      console.error("Failed to save token:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-lg shadow-xl w-[640px] max-w-[90%] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Setting />
            <h2 className="text-xl font-semibold">設定</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-6 space-y-4">
          <div>
            <h3 className="text-base font-semibold mb-2">パーソナルアクセストークン</h3>
            <p className="text-sm text-gray-600 mb-3">
              GitHubで <span className="text-blue-600 font-mono">repo</span> スコープ付きのトークンを発行し、下に貼り付けてください。{" "}
              <a
                href="https://github.com/settings/tokens/new"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                トークン発行ページを開く
                <Redirect size={16} />
              </a>
            </p>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxx"
              className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};
