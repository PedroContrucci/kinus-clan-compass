import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Cla from "./pages/Cla";
import Planejar from "./pages/Planejar";
import Viagens from "./pages/Viagens";
import Conta from "./pages/Conta";
import DestinationDetail from "./pages/DestinationDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/cla" element={<Cla />} />
          <Route path="/planejar" element={<Planejar />} />
          <Route path="/viagens" element={<Viagens />} />
          <Route path="/conta" element={<Conta />} />
          <Route path="/destino/:id" element={<DestinationDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
