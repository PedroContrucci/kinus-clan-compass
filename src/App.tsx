import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { KinuAIProvider } from "@/contexts/KinuAIContext";
import { KinuAIButton, KinuAIChat } from "@/components/ai";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Cla from "./pages/Cla";
import NewPlanejar from "./pages/NewPlanejar";
import Viagens from "./pages/Viagens";
import Conta from "./pages/Conta";
import DestinationDetail from "./pages/DestinationDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to conditionally render KINU AI (not on login)
function KinuAIWrapper() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/";
  
  if (isLoginPage) return null;
  
  return (
    <>
      <KinuAIButton />
      <KinuAIChat />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <KinuAIProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <KinuAIWrapper />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cla" element={<Cla />} />
            <Route path="/planejar" element={<NewPlanejar />} />
            <Route path="/viagens" element={<Viagens />} />
            <Route path="/conta" element={<Conta />} />
            <Route path="/destino/:id" element={<DestinationDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </KinuAIProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
