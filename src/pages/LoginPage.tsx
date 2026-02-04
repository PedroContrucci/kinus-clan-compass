import { useState } from 'react';
import { useAuthStore } from '../hooks/useAuthStore';
import kinuLogo from '@/assets/KINU_logo.png';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const { login, loginWithGoogle } = useAuthStore();
  
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <img 
          src={kinuLogo} 
          alt="KINU Logo" 
          style={{ width: '80px', height: '80px', marginBottom: '16px' }}
        />
        <h1 style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: '32px',
          fontWeight: 700,
          color: 'white',
          margin: 0
        }}>
          KINU
        </h1>
        <p style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          color: '#94a3b8',
          marginTop: '8px'
        }}>
          Sua jornada, nossa inteligência coletiva 🌿
        </p>
      </div>
      
      {/* Form */}
      <div style={{
        width: '100%',
        maxWidth: '360px',
        background: '#1e293b',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #334155'
      }}>
        <h2 style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: '20px',
          color: 'white',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          {isSignup ? 'Criar Conta' : 'Entrar no Clã'}
        </h2>
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: '100%',
            padding: '16px',
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '12px',
            color: 'white',
            fontSize: '16px',
            marginBottom: '16px',
            boxSizing: 'border-box',
            outline: 'none'
          }}
        />
        
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: '100%',
            padding: '16px',
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '12px',
            color: 'white',
            fontSize: '16px',
            marginBottom: '24px',
            boxSizing: 'border-box',
            outline: 'none'
          }}
        />
        
        <button
          onClick={() => login(email, password)}
          style={{
            width: '100%',
            padding: '16px',
            background: 'linear-gradient(135deg, #10b981, #0ea5e9)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: '16px',
            fontFamily: 'Plus Jakarta Sans, sans-serif'
          }}
        >
          🌿 {isSignup ? 'Criar Conta' : 'Entrar'}
        </button>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div style={{ flex: 1, height: '1px', background: '#334155' }} />
          <span style={{ color: '#64748b', fontSize: '14px' }}>ou</span>
          <div style={{ flex: 1, height: '1px', background: '#334155' }} />
        </div>
        
        <button
          onClick={loginWithGoogle}
          style={{
            width: '100%',
            padding: '16px',
            background: 'transparent',
            border: '1px solid #334155',
            borderRadius: '12px',
            color: 'white',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontFamily: 'Plus Jakarta Sans, sans-serif'
          }}
        >
          🔵 Continuar com Google
        </button>
        
        <p style={{
          textAlign: 'center',
          marginTop: '24px',
          color: '#94a3b8',
          fontSize: '14px'
        }}>
          {isSignup ? 'Já tem conta? ' : 'Ainda não faz parte? '}
          <button
            onClick={() => setIsSignup(!isSignup)}
            style={{
              background: 'none',
              border: 'none',
              color: '#10b981',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            {isSignup ? 'Entrar' : 'Junte-se ao Clã →'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
