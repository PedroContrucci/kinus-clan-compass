import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Settings, HelpCircle, Star, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import kinuLogo from '@/assets/KINU_logo.png';

const Conta = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
      </div>
    );
  }

  if (!user) return null;

  const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Viajante';
  const userEmail = user.email || '';

  const menuItems = [
    { icon: User, label: 'Editar Perfil', action: () => {} },
    { icon: Star, label: 'Meus Favoritos', action: () => {} },
    { icon: Settings, label: 'Configurações', action: () => {} },
    { icon: HelpCircle, label: 'Ajuda e Suporte', action: () => {} },
  ];

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
        <h1 className="text-2xl font-bold mb-6 font-['Outfit'] text-[#f8fafc]">Minha Conta 👤</h1>

        {/* Profile Card */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#10b981] to-[#0ea5e9] rounded-full flex items-center justify-center text-2xl">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-lg text-[#f8fafc] font-['Outfit']">{userName}</p>
              <p className="text-[#94a3b8] text-sm">{userEmail}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[#10b981] text-xs">🌿 Membro do Clã</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[#f8fafc] font-['Outfit']">0</p>
            <p className="text-xs text-[#94a3b8]">Viagens</p>
          </div>
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[#f8fafc] font-['Outfit']">0</p>
            <p className="text-xs text-[#94a3b8]">Países</p>
          </div>
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[#f8fafc] font-['Outfit']">0</p>
            <p className="text-xs text-[#94a3b8]">Dicas</p>
          </div>
        </div>

        {/* Menu */}
        <div className="space-y-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className="w-full flex items-center gap-3 p-4 bg-[#1e293b] border border-[#334155] rounded-xl text-left hover:bg-[#1e293b]/80 transition-colors"
            >
              <item.icon size={20} className="text-[#94a3b8]" />
              <span className="text-[#f8fafc] font-['Plus_Jakarta_Sans']">{item.label}</span>
            </button>
          ))}
          
          {/* Logout */}
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-left hover:bg-red-500/20 transition-colors mt-4"
          >
            <LogOut size={20} className="text-red-400" />
            <span className="text-red-400 font-['Plus_Jakarta_Sans']">Sair da Conta</span>
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

export default Conta;
