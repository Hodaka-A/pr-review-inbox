import { Setting } from "@/components/ui/icons/Setting";
import { Redirect } from "@/components/ui/icons/Redirect";
import type { FormEvent } from "react";

type SettingModalProps = {
  token: string;
  onTokenChange: (token: string) => void;
  onSave: () => void;
  onClose: () => void;
  isLoading: boolean;
};

export const SettingModal = ({
  token,
  onTokenChange,
  onSave,
  onClose,
  isLoading,
}: SettingModalProps) => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    // 拡張のポップアップ内なので、送信によるページ遷移を止める
    event.preventDefault();
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-lg shadow-xl w-[640px] max-w-[70%] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Setting />
            <h2 className="text-xl font-semibold">設定</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="rounded-full p-1 cursor-pointer text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors duration-150"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        {/* required による必須チェックをブラウザに任せるため form の submit で保存する */}
        <form onSubmit={handleSubmit}>
          <div className="px-8 py-8 space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-2">
                パーソナルアクセストークン
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                GitHubで <span className="text-blue-600 font-mono">repo</span>{" "}
                スコープ付きのトークンを発行し、下に貼り付けてください。{" "}
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
              <div className="flex items-center gap-3">
                <span className="px-1.5 py-0.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded">
                  必須
                </span>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => onTokenChange(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxx"
                  className="w-[70%] px-4 py-2 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center px-6 py-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-2 cursor-pointer text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
