import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Chat from "@/pages/Chat";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "@/lib/protected-route";
import { useEffect } from "react";
import { apiRequest } from "./lib/queryClient";
import { AuthProvider } from "@/hooks/use-auth";
// We'll implement the theme provider later
// import { ThemeProvider } from "@/components/theme-provider";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Chat} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Ping server every 30 seconds to keep session alive and update online status
  useEffect(() => {
    const pingServer = async () => {
      try {
        await apiRequest("POST", "/api/ping", null);
      } catch (error) {
        console.error("Failed to ping server:", error);
      }
    };

    // Initial ping
    pingServer();

    // Set up interval
    const interval = setInterval(pingServer, 30000);

    // Clean up interval
    return () => clearInterval(interval);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
