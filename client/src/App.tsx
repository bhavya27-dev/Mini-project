import { Switch, Route, Redirect } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LanguageProvider } from '@/contexts/LanguageContext';
import NotFound from '@/pages/not-found';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';
import Schemes from '@/pages/Schemes';
import SchemeDetail from '@/pages/SchemeDetail';
import ApplyScheme from '@/pages/ApplyScheme';
import ApplicationStatus from '@/pages/ApplicationStatus';
import Profile from '@/pages/Profile';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import ManageSchemes from '@/pages/admin/ManageSchemes';
import ReviewApplications from '@/pages/admin/ReviewApplications';
import Header from '@/components/Header';
import Chatbot from '@/components/Chatbot';

function PrivateRoute({ component: Component, adminOnly = false }: { component: React.ComponentType; adminOnly?: boolean }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/user/profile'],
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (adminOnly && !user.isAdmin) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <>
      <Header />
      <Component />
      {!adminOnly && <Chatbot />}
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/dashboard">
        {() => <PrivateRoute component={Dashboard} />}
      </Route>
      <Route path="/schemes">
        {() => <PrivateRoute component={Schemes} />}
      </Route>
      <Route path="/scheme/:id">
        {() => <PrivateRoute component={SchemeDetail} />}
      </Route>
      <Route path="/apply/:id">
        {() => <PrivateRoute component={ApplyScheme} />}
      </Route>
      <Route path="/application/:id">
        {() => <PrivateRoute component={ApplicationStatus} />}
      </Route>
      <Route path="/profile">
        {() => <PrivateRoute component={Profile} />}
      </Route>
      <Route path="/admin">
        {() => <PrivateRoute component={AdminDashboard} adminOnly />}
      </Route>
      <Route path="/admin/schemes">
        {() => <PrivateRoute component={ManageSchemes} adminOnly />}
      </Route>
      <Route path="/admin/applications">
        {() => <PrivateRoute component={ReviewApplications} adminOnly />}
      </Route>
      <Route path="/">
        <Redirect to="/login" />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <Toaster />
          <Router />
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
