import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { KinuAIProvider, useKinuAI } from "@/contexts/KinuAIContext";
import { KinuAIButton, KinuAIChat } from "@/components/ai";
import { TopNav } from "@/components/shared/TopNav";
import { FeedbackButton } from "@/components/shared/FeedbackButton";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Cla from "./pages/Cla";
import NewPlanejar from "./pages/NewPlanejar";
import Viagens from "./pages/Viagens";
import Conta from "./pages/Conta";
import DestinationDetail from "./pages/DestinationDetail";
import NotFound from "./pages/NotFound";
import SmokeTest from "./pages/SmokeTest";

const queryClient = new QueryClient();

function KinuAIWrapper() {
  const location = useLocation();
  const navigate = useNavigate();
  const { pendingNavigation, clearPendingNavigation, wizardPrefill } = useKinuAI();

  useEffect(() => {
    if (!pendingNavigation) return;
    const { destino, tripId } = pendingNavigation;
    if (tripId) {
      navigate(`/viagens?trip=${tripId}`);
    } else if (destino === 'planejar') {
      navigate('/planejar');
    } else {
      navigate('/viagens');
    }
    // Viagens will pick up the tab from pendingNavigation before clearing.
    // Small delay so consumers on the destination route can read it.
    const t = setTimeout(() => clearPendingNavigation(), 300);
    return () => clearTimeout(t);
  }, [pendingNavigation, navigate, clearPendingNavigation]);

  useEffect(() => {
    if (wizardPrefill && location.pathname !== '/planejar') {
      navigate('/planejar');
    }
  }, [wizardPrefill, location.pathname, navigate]);

  if (location.pathname === "/") return null;
  return (
    <>
      <KinuAIButton />
      <KinuAIChat />
    </>
  );
}

function BetaFeedbackWrapper() {
  const location = useLocation();
  if (location.pathname === "/") return null;
  return <FeedbackButton />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <KinuAIProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <TopNav />
          <KinuAIWrapper />
          <BetaFeedbackWrapper />
          <div className="min-h-screen bg-background">
            <div className="lg:max-w-5xl xl:max-w-6xl lg:mx-auto">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/cla" element={<Cla />} />
              <Route path="/planejar" element={<NewPlanejar />} />
              <Route path="/viagens" element={<Viagens />} />
              <Route path="/conta" element={<Conta />} />
              <Route path="/destino/:id" element={<DestinationDetail />} />
              <Route path="/smoke" element={<SmokeTest />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </div>
          </div>
        </BrowserRouter>
      </KinuAIProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
