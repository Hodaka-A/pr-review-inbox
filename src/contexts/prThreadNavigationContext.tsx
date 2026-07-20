import { PullRequestWithCommentsType } from "@/types/pullRequestDataType";
import { createContext, useContext, useState } from "react"

export type PrThreadNavigationContextType = {
  prData?: PullRequestWithCommentsType;
  isShowingThread: boolean;
  setPrData: (prData: PullRequestWithCommentsType | undefined) => void;
  setIsShowingThread: (isShowingThread: boolean) => void;
};

const prThreadNavigationContext = createContext<PrThreadNavigationContextType | undefined>(undefined);

export const PrThreadNavigationProvider = ({ children }: { children: React.ReactNode }) => {
  const [prData, setPrData] = useState<PullRequestWithCommentsType | undefined>(undefined);
  const [isShowingThread, setIsShowingThread] = useState<boolean>(false);

  return (
    <prThreadNavigationContext.Provider value={{ prData, isShowingThread, setPrData, setIsShowingThread }}>
      {children}
    </prThreadNavigationContext.Provider>
  );
}

export const usePrThreadNavigation = () => {
  const context = useContext(prThreadNavigationContext);
  if (!context) {
    throw new Error("usePrThreadNavigation must be used within a PrThreadNavigationProvider");
  }
  return context;
}

