import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import Home from "@/pages/home";
import Marketplace from "@/pages/marketplace";
import ModelDetail from "@/pages/model-detail";
import Studio from "@/pages/studio";
import Dashboard from "@/pages/dashboard";
import Activity from "@/pages/activity";
import Developers from "@/pages/developers";
import { WalletProvider } from "@/context/wallet";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WalletProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Layout>
              <Switch>
                <Route path="/" component={Home} />
                <Route path="/marketplace" component={Marketplace} />
                <Route path="/models/:id" component={ModelDetail} />
                <Route path="/studio" component={Studio} />
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/activity" component={Activity} />
                <Route path="/developers" component={Developers} />
                <Route component={NotFound} />
              </Switch>
            </Layout>
          </WouterRouter>
          <Toaster />
        </WalletProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
