import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MainContents } from "@/components/MainContents";
import { PrThreadNavigationProvider } from "@/contexts/prThreadNavigationContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function App() {
  return (
    <div className="w-[650px] h-[600px] flex flex-col">
      <Header />
      <QueryClientProvider client={queryClient}>
        <PrThreadNavigationProvider>
          <MainContents />
        </PrThreadNavigationProvider>
      </QueryClientProvider>
      <Footer />
    </div>
  );
}
