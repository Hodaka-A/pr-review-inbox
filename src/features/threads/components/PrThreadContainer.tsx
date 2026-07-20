import { usePrThreadNavigation } from "@/contexts/prThreadNavigationContext";
import { PrThread } from "./PrThread";

export const PrThreadContainer = () => {
  const { prData, setIsShowingThread } = usePrThreadNavigation();
  return <PrThread pr={prData} setIsShowingThread={setIsShowingThread} />;
};
