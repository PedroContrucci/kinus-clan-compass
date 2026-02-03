import { useLocation, Link } from 'react-router-dom';
import { Plane, MapPin } from 'lucide-react';

const BottomNavigation = () => {
  const location = useLocation();
  
  // Don't show on 404 or destination detail pages
  if (location.pathname.startsWith('/destino/')) {
    return null;
  }

  const navItems = [
    { to: '/planejar', icon: '✈️', label: 'Planejar', iconComponent: Plane },
    { to: '/viagens', icon: '🗺️', label: 'Viagens', iconComponent: MapPin },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-4">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-6 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-primary scale-105'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className={`text-xs font-medium font-['Plus_Jakarta_Sans'] ${
                isActive ? 'text-primary' : ''
              }`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
