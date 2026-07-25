import { PrCommentIcon } from "@/components/ui/icons/PrCommentIcon";
import { Setting } from "@/components/ui/icons/Setting";
import { ArrowPath } from "./ui/icons/ArrawPath";
import { useState } from "react";
import { SettingModalContainer } from "@/features/setting/components/SettingModalContainer";

export const Header = () => {
  const [isShowModal, setIsShowModal] = useState<boolean>(false);
  return (
    <>
      <header className="px-4 py-2 flex justify-between items-center bg-white border-b border-gray-300 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <PrCommentIcon />
          <h1 className="text-lg font-bold">PR Comments Box</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-full cursor-pointer p-2 hover:bg-gray-100 transition-colors duration-150">
            <ArrowPath />
          </button>
          <button
            className="rounded-full cursor-pointer p-2 hover:bg-gray-100 transition-colors duration-150"
            onClick={() => setIsShowModal(true)}
          >
            <Setting />
          </button>
        </div>
      </header>
      {isShowModal && (
        <SettingModalContainer onClose={() => setIsShowModal(false)} />
      )}
    </>
  );
};
