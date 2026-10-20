import { useNavigate, useLocation } from 'react-router-dom';
import kinuLogo from '@/assets/KINU_logo.png';

const navItems = [
  { id: 'inicio', icon: '🏠', label: 'Início', path: '/inicio' },
  { id: 'cla', icon: '🌿', label: 'Clã', path: '/cla' },
  { id: 'conta', icon: '👤', label: 'Perfil', path: '/conta' },
];

export const TopNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoginPage = location.pathname === '/';

  if (isLoginPage) return null;

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.startsWith('/destino')) return 'inicio';
    return navItems.find(item => item.path === path)?.id || 'inicio';
  };

  const activeTab = getActiveTab();

  return (
    <nav className="hidden lg:block sticky top-0 z-50 bg-background/90 backdrop-blur-lg border-b border-border">
      <div className="max-w-6xl mx-auto px-6 py-2 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => navigate('/inicio')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <img src={kinuLogo} alt="KINU" className="h-8 w-8 object-contain" />
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-sm text-foreground font-['Outfit']">KINU</span>
            <span className="text-[10px] text-muted-foreground -mt-0.5">Travel OS</span>
          </div>
        </button>

        {/* Nav Items */}
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
