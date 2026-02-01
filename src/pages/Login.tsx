import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import kinuLogo from '@/assets/KINU_logo.png';

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.includes('@')) {
      setError('Email inválido');
      return;
    }

    if (password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    // Save to localStorage
    const user = { email, name: name || email.split('@')[0] };
    localStorage.setItem('kinu_user', JSON.stringify(user));
    navigate('/cla');
  };

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
            Onde a precisão do algoritmo encontra o acolhimento do clã.
          </p>
          <p className="text-muted-foreground font-['Plus_Jakarta_Sans'] text-base mt-1">
            Tecnologia que respira natureza. 🌿
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
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-3.5 btn-primary font-semibold text-base flex items-center justify-center gap-2"
          >
            <span>🌿</span>
            <span>{isLogin ? 'Entrar no Clã' : 'Criar minha conta'}</span>
          </button>
        </form>

        {/* Toggle */}
        <p className="text-center mt-6 text-muted-foreground font-['Plus_Jakarta_Sans']">
          {isLogin ? 'Ainda não faz parte do clã? ' : 'Já tem conta? '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline font-medium"
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
