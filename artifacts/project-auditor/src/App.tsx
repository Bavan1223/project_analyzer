import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { WorkspaceShell } from '@/components/workspace-shell';
import NotFound from '@/pages/not-found';
import Overview from '@/pages/overview';
import NewAnalysis from '@/pages/new-analysis';
import AnalysisReport from '@/pages/analysis-report';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Router() {
  return (
    <RoutedErrorBoundary>
      <WorkspaceShell>
        <Switch>
          <Route path="/" component={Overview} />
          <Route path="/analyses/new" component={NewAnalysis} />
          <Route path="/analyses/:id" component={AnalysisReport} />
          <Route component={NotFound} />
        </Switch>
      </WorkspaceShell>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
