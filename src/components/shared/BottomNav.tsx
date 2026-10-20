// Bottom Navigation — C.7: 3 abas (Início · Clã · Perfil)
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const navItems = [
  { id: 'inicio', icon: '🏠', label: 'Início', path: '/inicio' },
  { id: 'cla', icon: '🌿', label: 'Clã', path: '/cla' },
  { id: 'conta', icon: '👤', label: 'Perfil', path: '/conta' },
];

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.startsWith('/destino')) return 'inicio';
    return navItems.find(item => item.path === path)?.id || 'inicio';
  };

  const activeTab = getActiveTab();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-lg border-t border-border px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-50 lg:hidden">
      <div className="flex justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center py-2 px-2 rounded-xl transition-all ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-0.5 w-8 h-1 bg-primary rounded-full"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
