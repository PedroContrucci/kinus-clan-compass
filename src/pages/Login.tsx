import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Gradient overlay */}
      <div className="fixed inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🌿</div>
          <h1 className="text-3xl font-bold text-foreground font-['Outfit']">KINU</h1>
          <p className="text-muted-foreground">The Travel OS</p>
        </div>

        {/* Welcome message */}
        <p className="text-center text-muted-foreground mb-8">
          "Bem-vindo ao clã.<br />
          O seu próximo horizonte<br />
          começa aqui." 🌿
        </p>

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
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 btn-primary font-semibold"
          >
            {isLogin ? 'Entrar no Clã' : 'Criar minha conta'}
          </button>
        </form>

        {/* Toggle */}
        <p className="text-center mt-6 text-muted-foreground">
          {isLogin ? 'Ainda não faz parte? ' : 'Já tem conta? '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline"
          >
            {isLogin ? 'Junte-se ao clã →' : 'Entrar'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
