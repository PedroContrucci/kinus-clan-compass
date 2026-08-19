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
import Planejar from "./pages/Planejar";
import Viagens from "./pages/Viagens";
import Conta from "./pages/Conta";
import DestinationDetail from "./pages/DestinationDetail";
import NotFound from "./pages/NotFound";
import SmokeTest from "./pages/SmokeTest";
import { migrateLegacyTripIds } from "@/lib/tripIdMigration";
import { startSession } from "@/lib/session";

// Boot, no escopo do módulo: roda uma vez na avaliação de App.tsx, portanto ANTES do
// `createRoot(...).render()` do main.tsx — nenhum componente que lê trips chegou a montar.
// Idempotente: na segunda carga não existe id legado e ela não escreve nada.
migrateLegacyTripIds();

// DEPOIS da migração, de propósito: quando o espelho do 4c entrar nesta mesma linha, ele já
// encontra todo id em uuid. startSession() não bloqueia nem devolve promessa — só assina o
// GoTrue e dispara o getSession inicial. Idempotente.
startSession();

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
              <Route path="/planejar" element={<Planejar />} />
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
