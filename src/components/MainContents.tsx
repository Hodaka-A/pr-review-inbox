import { usePrThreadNavigation } from "@/contexts/prThreadNavigationContext";
import { PrCommentsListContainer } from "@/features/prComments/components/PrCommentsListContainer";
import { PrThreadContainer } from "@/features/threads/components/PrThreadContainer";

import { Activity } from "react";

export const MainContents = () => {
  const { isShowingThread } = usePrThreadNavigation();
  return (
    <main className="flex-1 min-h-0">
      <Activity mode={isShowingThread ? "hidden" : "visible"}>
        <PrCommentsListContainer />
      </Activity>
      {isShowingThread && (
        <PrThreadContainer />
      )}
    </main>
  );
};
