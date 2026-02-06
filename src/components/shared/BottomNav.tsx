// Bottom Navigation — Componente compartilhado

import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { id: 'dashboard', icon: '🏠', label: 'Home', path: '/dashboard' },
  { id: 'planejar', icon: '✨', label: 'Planejar', path: '/planejar' },
  { id: 'cla', icon: '👥', label: 'Clã', path: '/cla' },
  { id: 'conta', icon: '👤', label: 'Perfil', path: '/conta' },
];

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    const path = location.pathname;
    return navItems.find(item => item.path === path)?.id || 'dashboard';
  };

  const activeTab = getActiveTab();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-lg border-t border-border px-4 py-2 z-50">
      <div className="flex justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-all ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isActive && (
                <div className="w-6 h-0.5 bg-primary rounded-full mb-1" />
              )}
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs mt-0.5 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
