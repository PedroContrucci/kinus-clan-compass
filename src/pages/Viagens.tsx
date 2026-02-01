import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import kinuLogo from '@/assets/KINU_logo.png';

const Viagens = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<{ name: string } | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('kinu_user');
    if (!savedUser) {
      navigate('/');
      return;
    }
    setUser(JSON.parse(savedUser));
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0f172a] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0f172a]/80 backdrop-blur-lg border-b border-[#334155] px-4 py-3">
        <div className="flex items-center gap-2">
          <img src={kinuLogo} alt="KINU" className="h-8 w-8 object-contain" />
          <span className="font-bold text-xl font-['Outfit'] text-[#f8fafc]">KINU</span>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6">
        <h1 className="text-2xl font-bold mb-2 font-['Outfit'] text-[#f8fafc]">Minhas Viagens 💼</h1>
        <p className="text-[#94a3b8] mb-6 font-['Plus_Jakarta_Sans']">Teus roteiros salvos aparecem aqui.</p>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-6xl mb-4">🗺️</div>
          <p className="text-[#f8fafc] font-['Outfit'] text-lg mb-2">Nenhuma viagem salva ainda</p>
          <p className="text-[#94a3b8] text-center mb-6">Cria teu primeiro roteiro no Nexo!</p>
          <button
            onClick={() => navigate('/planejar')}
            className="px-6 py-3 bg-gradient-to-r from-[#10b981] to-[#0ea5e9] text-white rounded-xl font-semibold font-['Outfit']"
          >
            🧭 Ir para O Nexo
          </button>
        </div>
      </main>

      {/* Bottom Nav */}
      <BottomNav currentPath={location.pathname} />
    </div>
  );
};

const BottomNav = ({ currentPath }: { currentPath: string }) => {
  const navigate = useNavigate();
  
  const navItems = [
    { path: '/cla', icon: '🌿', label: 'Clã' },
    { path: '/planejar', icon: '🧭', label: 'Planejar' },
    { path: '/viagens', icon: '💼', label: 'Viagens' },
    { path: '/conta', icon: '👤', label: 'Conta' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1e293b]/90 backdrop-blur-lg border-t border-[#334155] px-4 py-3">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 ${isActive ? 'text-[#10b981]' : 'text-[#94a3b8]'}`}
            >
              {isActive && <div className="w-8 h-0.5 bg-[#10b981] rounded-full mb-1" />}
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-['Plus_Jakarta_Sans']">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Viagens;
