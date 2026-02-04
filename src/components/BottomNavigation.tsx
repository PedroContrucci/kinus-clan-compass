import { NavLink } from 'react-router-dom';

export const BottomNavigation = () => {
  const navItems = [
    { to: '/planejar', icon: '✈️', label: 'Planejar' },
    { to: '/viagens', icon: '🗺️', label: 'Viagens' },
    { to: '/cla', icon: '🌿', label: 'Clã' },
    { to: '/perfil', icon: '👤', label: 'Perfil' },
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      height: '70px',
      background: 'rgba(30, 41, 59, 0.95)',
      backdropFilter: 'blur(10px)',
      borderTop: '1px solid #334155',
      zIndex: 50,
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            color: isActive ? '#10b981' : '#64748b',
            textDecoration: 'none',
            fontSize: '12px',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            padding: '8px 16px',
            borderRadius: '12px',
            background: isActive ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
            transition: 'all 0.2s ease'
          })}
        >
          <span style={{ fontSize: '24px' }}>{item.icon}</span>
          <span style={{ fontWeight: 500 }}>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNavigation;
