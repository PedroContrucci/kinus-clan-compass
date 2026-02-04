import { useAuthStore } from '../hooks/useAuthStore';

export const ProfilePage = () => {
  const { user, logout } = useAuthStore();
  
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      padding: '24px 16px',
      paddingBottom: '100px'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '32px'
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          background: 'linear-gradient(135deg, #10b981, #0ea5e9)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '48px',
          margin: '0 auto 16px'
        }}>
          👤
        </div>
        <h1 style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: '24px',
          fontWeight: 700,
          color: 'white',
          margin: 0
        }}>
          {user?.name || 'Viajante'}
        </h1>
        <p style={{
          color: '#94a3b8',
          marginTop: '4px',
          fontFamily: 'Plus Jakarta Sans, sans-serif'
        }}>
          {user?.email || 'email@exemplo.com'}
        </p>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(16, 185, 129, 0.2)',
          color: '#10b981',
          padding: '6px 12px',
          borderRadius: '20px',
          marginTop: '12px',
          fontSize: '14px',
          fontWeight: 600
        }}>
          🌿 Membro do Clã
        </div>
      </div>
      
      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginBottom: '32px'
      }}>
        {[
          { label: 'Viagens', value: '3', icon: '✈️' },
          { label: 'Países', value: '5', icon: '🌍' },
          { label: 'Economizado', value: 'R$ 4.2k', icon: '💰' }
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              background: '#1e293b',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
              border: '1px solid #334155'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{stat.icon}</div>
            <div style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '20px',
              fontWeight: 700,
              color: 'white'
            }}>
              {stat.value}
            </div>
            <div style={{
              color: '#94a3b8',
              fontSize: '12px',
              marginTop: '4px'
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
      
      {/* Menu Items */}
      <div style={{
        background: '#1e293b',
        borderRadius: '16px',
        border: '1px solid #334155',
        overflow: 'hidden'
      }}>
        {[
          { icon: '🧳', label: 'Minhas Malas Salvas', action: null },
          { icon: '💳', label: 'Métodos de Pagamento', action: null },
          { icon: '🔔', label: 'Notificações', action: null },
          { icon: '🌙', label: 'Preferências', action: null },
          { icon: '❓', label: 'Ajuda & Suporte', action: null }
        ].map((item, i) => (
          <button
            key={i}
            style={{
              width: '100%',
              padding: '16px',
              background: 'transparent',
              border: 'none',
              borderBottom: i < 4 ? '1px solid #334155' : 'none',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: '15px',
              textAlign: 'left'
            }}
          >
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            <span>{item.label}</span>
            <span style={{ marginLeft: 'auto', color: '#64748b' }}>→</span>
          </button>
        ))}
      </div>
      
      {/* Logout */}
      <button
        onClick={logout}
        style={{
          width: '100%',
          padding: '16px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #ef4444',
          borderRadius: '12px',
          color: '#ef4444',
          fontSize: '16px',
          fontWeight: 600,
          cursor: 'pointer',
          marginTop: '24px',
          fontFamily: 'Plus Jakarta Sans, sans-serif'
        }}
      >
        🚪 Sair do Clã
      </button>
    </div>
  );
};

export default ProfilePage;
