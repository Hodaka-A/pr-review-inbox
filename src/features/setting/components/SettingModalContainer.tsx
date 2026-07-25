import { useEffect, useState } from "react";
import { useChromeSyncStorage } from "@/hooks/useChromeSyncStorage";
import { GITHUB_TOKEN_KEY } from "@/constants/storageKeys";
import { SettingModal } from "./SettingModal";

type SettingModalContainerProps = {
  onClose: () => void;
};

export const SettingModalContainer = ({
  onClose,
}: SettingModalContainerProps) => {
  const {
    storedValue: savedToken,
    saveValue,
    isLoading,
  } = useChromeSyncStorage(GITHUB_TOKEN_KEY, "");

  // 保存は「保存」ボタンで確定するので、入力中の値は保存済みの値と別に持つ
  const [token, setToken] = useState("");

  // 保存済みトークンの読み込みが終わったら入力欄へ反映する
  useEffect(() => {
    setToken(savedToken);
  }, [savedToken]);

  const handleSave = async () => {
    await saveValue(token);
    onClose();
  };

  return (
    <SettingModal
      token={token}
      onTokenChange={setToken}
      onSave={handleSave}
      onClose={onClose}
      isLoading={isLoading}
    />
  );
};
