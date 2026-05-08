import { Switch, Route, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import DashboardPage from "@/pages/dashboard";
import GeneratorPage from "@/pages/generator";
import CodmPage from "@/pages/codm";
import AboutPage from "@/pages/topup";
import AdminPage from "@/pages/admin";
import SmsPage from "@/pages/sms";
import TgPage from "@/pages/tg";
import FeedbackPage from "@/pages/feedback";
import CheckerPage from "@/pages/checker";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Redirect to="/" />;
  return <Component />;
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || !user.isAdmin) return <Redirect to="/dashboard" />;
  return <Component />;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return (
    <Switch>
      <Route path="/" component={() => user ? <Redirect to={user.isAdmin ? "/admin" : "/dashboard"} /> : <LoginPage />} />
      <Route path="/register" component={() => user ? <Redirect to="/dashboard" /> : <RegisterPage />} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={DashboardPage} />} />
      <Route path="/generator" component={() => <ProtectedRoute component={GeneratorPage} />} />
      <Route path="/codm" component={() => <ProtectedRoute component={CodmPage} />} />
      <Route path="/sms" component={() => <ProtectedRoute component={SmsPage} />} />
      <Route path="/tg" component={() => <ProtectedRoute component={TgPage} />} />
      <Route path="/feedback" component={() => <ProtectedRoute component={FeedbackPage} />} />
      <Route path="/checker" component={() => <ProtectedRoute component={CheckerPage} />} />
      <Route path="/about" component={() => <ProtectedRoute component={AboutPage} />} />
      <Route path="/topup" component={() => <Redirect to="/about" />} />
      <Route path="/admin" component={() => <AdminRoute component={AdminPage} />} />
      <Route component={() => <Redirect to="/" />} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
