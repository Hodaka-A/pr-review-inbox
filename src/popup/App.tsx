import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MainContents } from "@/components/MainContents";
import { PrThreadNavigationProvider } from "@/contexts/prThreadNavigationContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function App() {
  const queryClient = new QueryClient();

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
