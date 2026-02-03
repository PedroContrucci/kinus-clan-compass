import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import kinuLogo from '@/assets/KINU_logo.png';

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Check if user is already authenticated
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/cla');
      }
      setCheckingSession(false);
    };
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          navigate('/cla');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Client-side validation
    if (!email.includes('@')) {
      setError('Email inválido');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Sign in with Supabase
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            setError('Email ou senha incorretos');
          } else if (signInError.message.includes('Email not confirmed')) {
            setError('Por favor, confirme seu email antes de entrar');
          } else {
            setError(signInError.message);
          }
          return;
        }

        if (data.session) {
          navigate('/cla');
        }
      } else {
        // Sign up with Supabase
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name || email.split('@')[0],
            },
            emailRedirectTo: window.location.origin,
          },
        });

        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            setError('Este email já está cadastrado');
          } else {
            setError(signUpError.message);
          }
          return;
        }

        if (data.user && !data.session) {
          // Email confirmation required
          setError('');
          alert('Verifique seu email para confirmar sua conta antes de entrar.');
          setIsLogin(true);
        } else if (data.session) {
          navigate('/cla');
        }
      }
    } catch (err) {
      setError('Erro ao processar. Tente novamente.');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between p-6 py-10">
      {/* Gradient overlays */}
      <div className="fixed inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent pointer-events-none" />
      <div className="fixed top-0 left-0 w-96 h-96 bg-gradient-radial from-primary/5 to-transparent pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-gradient-radial from-accent/5 to-transparent pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 flex-1 flex flex-col justify-center">
        {/* Logo Section */}
        <div className="text-center mb-6">
          <img 
            src={kinuLogo} 
            alt="KINU Logo" 
            className="w-24 h-24 mx-auto mb-4 object-contain"
          />
          <h1 className="text-[32px] font-bold text-foreground font-['Outfit']">KINU</h1>
          <p className="text-muted-foreground font-['Plus_Jakarta_Sans']">The Travel OS</p>
        </div>

        {/* Slogan */}
        <div className="text-center mb-8 px-4">
          <p className="text-muted-foreground font-['Plus_Jakarta_Sans'] text-base leading-relaxed">
            Sua jornada, nossa inteligência coletiva. 🌿
          </p>
        </div>

        {/* Separator */}
        <div className="w-full h-px bg-border mb-8" />

        {/* Welcome message */}
        <h2 className="text-center text-foreground font-['Outfit'] text-xl font-semibold mb-6">
          Bem-vindo ao clã. O seu próximo horizonte começa aqui.
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          {!isLogin && (
            <div>
              <input
                type="text"
                placeholder="Nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                disabled={loading}
              />
            </div>
          )}

          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              disabled={loading}
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground pr-12"
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              disabled={loading}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 btn-primary font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span>🌿</span>
                <span>{isLogin ? 'Entrar no Clã' : 'Criar minha conta'}</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle */}
        <p className="text-center mt-6 text-muted-foreground font-['Plus_Jakarta_Sans']">
          {isLogin ? 'Ainda não faz parte do clã? ' : 'Já tem conta? '}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-primary hover:underline font-medium"
            disabled={loading}
          >
            {isLogin ? 'Junte-se a nós →' : 'Entrar'}
          </button>
        </p>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-8">
        <div className="w-48 h-px bg-border mx-auto mb-4" />
        <p className="text-center text-sm text-muted-foreground/70 font-['Plus_Jakarta_Sans']">
          Sua jornada, nossa inteligência coletiva.
        </p>
      </div>
    </div>
  );
};

export default Login;
