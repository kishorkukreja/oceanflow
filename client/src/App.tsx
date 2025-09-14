import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Lanes from "@/pages/lanes";
import Simulation from "@/pages/simulation";
import Quotes from "@/pages/quotes";
import Alternatives from "@/pages/alternatives";
import Risk from "@/pages/risk";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { FloatingChatbot } from "@/components/chatbot/floating-chatbot";

function Router() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/lanes" component={Lanes} />
          <Route path="/simulation" component={Simulation} />
          <Route path="/quotes" component={Quotes} />
          <Route path="/alternatives" component={Alternatives} />
          <Route path="/risk" component={Risk} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <FloatingChatbot />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
