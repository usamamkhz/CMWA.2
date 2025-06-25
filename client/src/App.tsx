import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import AuthPage from "@/pages/auth";
import ClientDashboardPage from "@/pages/client-dashboard";
import AdminDashboardPage from "@/pages/admin-dashboard";
import NotFound from "@/pages/not-found";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <AuthPage />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <NotFound />;
  }

  return <>{children}</>;
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Switch>
      <Route path="/">
        {user ? (
          user.role === 'admin' ? (
            <AdminDashboardPage />
          ) : (
            <ClientDashboardPage />
          )
        ) : (
          <AuthPage />
        )}
      </Route>
      
      <Route path="/auth">
        <AuthPage />
      </Route>
      
      <Route path="/client">
        <ProtectedRoute allowedRoles={['client']}>
          <ClientDashboardPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin">
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboardPage />
        </ProtectedRoute>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
