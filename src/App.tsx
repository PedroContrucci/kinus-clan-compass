import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { BottomNavigation } from "./components/BottomNavigation";
import { useAuthStore } from "./hooks/useAuthStore";

// Pages
import LoginPage from "./pages/LoginPage";
import PlannerPage from "./pages/PlannerPage";
import ItineraryPage from "./pages/ItineraryPage";
import MyTripsPage from "./pages/MyTripsPage";
import ClaPage from "./pages/ClaPage";
import ProfilePage from "./pages/ProfilePage";
import SmartPackingPage from "./pages/SmartPackingPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AuthenticatedApp = () => {
  return (
    <div style={{ paddingBottom: '70px' }}>
      <Routes>
        <Route path="/" element={<Navigate to="/planejar" replace />} />
        <Route path="/planejar" element={<PlannerPage />} />
        <Route path="/planejar/roteiro" element={<ItineraryPage />} />
        <Route path="/viagens" element={<MyTripsPage />} />
        <Route path="/cla" element={<ClaPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/packing/:tripId" element={<SmartPackingPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNavigation />
    </div>
  );
};

const App = () => {
  const { isAuthenticated } = useAuthStore();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {isAuthenticated ? (
            <AuthenticatedApp />
          ) : (
            <Routes>
              <Route path="*" element={<LoginPage />} />
            </Routes>
          )}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
