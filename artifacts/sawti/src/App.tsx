import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/Auth";
import { AdminLayout } from "@/layouts/AdminLayout";
import { UserLayout } from "@/layouts/UserLayout";

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminUsers from "@/pages/admin/Users";
import AdminSessions from "@/pages/admin/Sessions";
import AdminRecordings from "@/pages/admin/Recordings";
import AdminSuggestions from "@/pages/admin/Suggestions";
import AdminDownload from "@/pages/admin/Download";

// User Pages
import UserDashboard from "@/pages/user/Dashboard";
import UserRecording from "@/pages/user/Recording";
import UserSuggest from "@/pages/user/Suggest";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={AuthPage} />

      <Route path="/admin">
        <AdminLayout><AdminDashboard /></AdminLayout>
      </Route>
      <Route path="/admin/users">
        <AdminLayout><AdminUsers /></AdminLayout>
      </Route>
      <Route path="/admin/sessions">
        <AdminLayout><AdminSessions /></AdminLayout>
      </Route>
      <Route path="/admin/recordings">
        <AdminLayout><AdminRecordings /></AdminLayout>
      </Route>
      <Route path="/admin/suggestions">
        <AdminLayout><AdminSuggestions /></AdminLayout>
      </Route>
      <Route path="/admin/download">
        <AdminLayout><AdminDownload /></AdminLayout>
      </Route>

      <Route path="/user">
        <UserLayout><UserDashboard /></UserLayout>
      </Route>
      <Route path="/user/session/:sessionId">
        {(params) => <UserLayout><UserRecording /></UserLayout>}
      </Route>
      <Route path="/user/suggest">
        <UserLayout><UserSuggest /></UserLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
