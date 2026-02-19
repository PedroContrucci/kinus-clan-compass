import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import kinuLogo from '@/assets/KINU_logo.png';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404: Rota não encontrada:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-6 p-6">
      <img src={kinuLogo} alt="KINU" className="w-20 h-20 object-contain opacity-60" />
      <h1 className="text-5xl font-bold text-foreground font-['Outfit']">404</h1>
      <p className="text-xl text-muted-foreground font-['Plus_Jakarta_Sans']">
        Página não encontrada
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold font-['Outfit'] hover:bg-primary/90 transition-colors"
      >
        🏠 Voltar para Home
      </button>
    </div>
  );
};

export default NotFound;
