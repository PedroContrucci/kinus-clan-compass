import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Planejar from "./pages/Planejar";
import Viagens from "./pages/Viagens";
import DestinationDetail from "./pages/DestinationDetail";
import NotFound from "./pages/NotFound";
import BottomNavigation from "./components/BottomNavigation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Direct access - no login required */}
          <Route path="/" element={<Navigate to="/planejar" replace />} />
          <Route path="/planejar" element={<Planejar />} />
          <Route path="/viagens" element={<Viagens />} />
          <Route path="/viagens/:tripId" element={<Viagens />} />
          <Route path="/destino/:id" element={<DestinationDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <BottomNavigation />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
