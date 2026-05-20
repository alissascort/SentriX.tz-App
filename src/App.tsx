import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import SplashScreen from "./pages/SplashScreen";
import EnvironmentCheck from "./pages/EnvironmentCheck";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import TwoFactorAuth from "./pages/TwoFactorAuth";
import Dashboard from "./pages/Dashboard";
import Alerts from "./pages/Alerts";
import Devices from "./pages/Devices";
import Analytics from "./pages/Analytics";
import AcceptInvite from "./pages/AcceptInvite";
import CompanyRegistration from "./pages/CompanyRegistration";
import Subscription from "./pages/Subscription";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { auth } from "@/services/api";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  useEffect(() => {
   const token = localStorage.getItem('sentrix_token') || sessionStorage.getItem('sentrix_token');
    if (token) {
      auth.me()
        .then(() => setIsAuth(true))
        .catch(() => {
          localStorage.removeItem('sentrix_token');
          setIsAuth(false);
        });
    } else {
      setIsAuth(false);
    }
  }, []);

  if (isAuth === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/environment-check" element={<EnvironmentCheck />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/two-factor" element={<TwoFactorAuth />} />
          <Route path="/register" element={<CompanyRegistration />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/accept-invite/:token" element={<AcceptInvite />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
          <Route path="/devices" element={<ProtectedRoute><Devices /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
