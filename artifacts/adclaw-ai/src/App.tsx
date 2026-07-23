import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';

// Pages
import Dashboard from '@/pages/dashboard';
import BusinessesList from '@/pages/businesses-list';
import BusinessNew from '@/pages/businesses-new';
import BusinessDetail from '@/pages/business-detail';
import PipelineList from '@/pages/pipeline-list';
import PipelineNew from '@/pages/pipeline-new';
import PipelineDetail from '@/pages/pipeline-detail';
import BlueprintsList from '@/pages/blueprints-list';
import BlueprintDetail from '@/pages/blueprint-detail';
import CampaignsList from '@/pages/campaigns-list';
import CampaignsNew from '@/pages/campaigns-new';
import CampaignDetail from '@/pages/campaign-detail';
import ApprovalsList from '@/pages/approvals-list';
import MemoryList from '@/pages/memory-list';
import CopilotPage from '@/pages/copilot'
import Panduan from '@/pages/panduan';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/businesses" component={BusinessesList} />
      <Route path="/businesses/new" component={BusinessNew} />
      <Route path="/businesses/:id" component={BusinessDetail} />
      
      <Route path="/pipeline" component={PipelineList} />
      <Route path="/pipeline/new" component={PipelineNew} />
      <Route path="/pipeline/:id" component={PipelineDetail} />
      
      <Route path="/blueprints" component={BlueprintsList} />
      <Route path="/blueprints/:id" component={BlueprintDetail} />
      
      <Route path="/campaigns" component={CampaignsList} />
      <Route path="/campaigns/new" component={CampaignsNew} />
      <Route path="/campaigns/:id" component={CampaignDetail} />
      
      <Route path="/approvals" component={ApprovalsList} />
      <Route path="/memory" component={MemoryList} />
      <Route path="/copilot" component={CopilotPage} />
      <Route path="/panduan" component={Panduan} />
      
      <Route component={NotFound} />
    </Switch>
  );
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
