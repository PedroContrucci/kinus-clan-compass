import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import kinuLogo from '@/assets/KINU_logo.png';
import { useAuth } from '@/hooks/useAuth';
import { consumeLegacyUser } from '@/lib/legacyAuth';

/**
 * Tradutor do erro do Supabase Auth para português de gente.
 *
 * Casa primeiro por `code` (auth-js 2.93 manda um código estável em todo erro
 * de HTTP); o casamento por texto é a rede de segurança para erros antigos ou
 * de rede, que vêm sem código. O que não cair em nenhum dos dois vira genérico
 * — e vai para o console inteiro, porque erro de auth engolido é dor de cabeça
 * de suporte.
 */
function mapAuthError(error: unknown, mode: 'entrar' | 'criar'): string {
  const code = typeof (error as { code?: unknown })?.code === 'string'
    ? (error as { code: string }).code
    : '';
  const name = typeof (error as { name?: unknown })?.name === 'string'
    ? (error as { name: string }).name
    : '';
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  switch (code) {
    case 'invalid_credentials':
      return 'Email ou senha incorretos.';
    case 'user_already_exists':
    case 'email_exists':
      return 'Esse email já tem conta no KINU — toque em "Entrar".';
    case 'weak_password':
      return 'Senha muito fraca — use pelo menos 6 caracteres.';
    case 'email_not_confirmed':
      return 'Sua conta ainda não foi confirmada — confira o link no seu email.';
    case 'email_address_invalid':
    case 'validation_failed':
      return 'Email inválido.';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Muitas tentativas seguidas. Espere alguns segundos e tente de novo.';
    case 'signup_disabled':
    case 'email_provider_disabled':
      return 'O cadastro por email está desligado no momento.';
    case 'provider_disabled':
      return 'Esse login não está habilitado no momento.';
    case 'user_banned':
      return 'Esta conta está bloqueada. Fale com a gente.';
  }

  if (name === 'AuthRetryableFetchError' || message.includes('fetch') || message.includes('network')) {
    return 'Sem conexão com o servidor. Verifique sua internet e tente de novo.';
  }
  if (message.includes('invalid login credentials')) return 'Email ou senha incorretos.';
  if (message.includes('already registered')) return 'Esse email já tem conta no KINU — toque em "Entrar".';
  if (message.includes('password should be at least')) return 'Senha muito curta — use pelo menos 6 caracteres.';

  console.error('[login] erro não mapeado', error);
  return mode === 'entrar'
    ? 'Não consegui entrar agora. Tente de novo em instantes.'
    : 'Não consegui criar sua conta agora. Tente de novo em instantes.';
}

const Login = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, signIn, signUp, signInWithGoogle } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showLegacyNotice, setShowLegacyNotice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const legacyChecked = useRef(false);

  // O inverso do guard (recon §4): quem já tem sessão não fica parado na porta.
  // `replace` para que o botão Voltar não traga a pessoa de volta ao login.
  useEffect(() => {
    if (!authLoading && isAuthenticated) navigate('/dashboard', { replace: true });
  }, [authLoading, isAuthenticated, navigate]);

  // Corte seco com verniz B (recon §6(d)). Só depois que a sessão resolveu e
  // só se ela não existir — apagar antes disso tiraria a chave de quem está
  // legitimamente logado. Roda uma vez por montagem; consumeLegacyUser() já é
  // idempotente, o ref é para o verniz não piscar no StrictMode.
  useEffect(() => {
    if (authLoading || isAuthenticated || legacyChecked.current) return;
    legacyChecked.current = true;

    const legacy = consumeLegacyUser();
    if (!legacy) return;

    setShowLegacyNotice(true);
    setIsLogin(false); // é conta nova que ela precisa criar, não login
    setEmail((current) => current || legacy.email);
    setName((current) => current || legacy.name);
  }, [authLoading, isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');

    const trimmedEmail = email.trim();

    if (!trimmedEmail.includes('@')) {
      setError('Email inválido');
      return;
    }

    if (password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isLogin) {
        await signIn(trimmedEmail, password);
        navigate('/dashboard');
        return;
      }

      // Confirm email está DESLIGADO no painel do kinu-beta, então o caminho
      // normal já traz sessão. O ramo sem sessão é a rede de segurança para o
      // dia em que a confirmação for religada (recon §5.4): navegar sem sessão
      // criaria um loop visual /dashboard -> guard -> /.
      const { session } = await signUp(trimmedEmail, password, name);
      if (!session) {
        setNotice('Conta criada! Confira seu email para confirmar o cadastro e depois entre por aqui.');
        setIsLogin(true);
        setPassword('');
        return;
      }
      navigate('/dashboard');
    } catch (err) {
      setError(mapAuthError(err, isLogin ? 'entrar' : 'criar'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // signInWithGoogle redireciona o browser inteiro; em caso de sucesso esta
  // página some antes do finally, então o isSubmitting só volta no erro — o
  // botão fica travado durante o redirect, que é o comportamento desejado.
  const handleGoogle = async () => {
    setError('');
    setNotice('');
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(mapAuthError(err, 'entrar'));
      setIsSubmitting(false);
    }
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
            Sua jornada, nossa inteligência coletiva. 🌿
          </p>
        </div>

        {/* Separator */}
        <div className="w-full h-px bg-border mb-8" />

        {/* Welcome message */}
        <h2 className="text-center text-foreground font-['Outfit'] text-xl font-semibold mb-6">
          Bem-vindo ao clã. O seu próximo horizonte começa aqui.
        </h2>

        {/* Verniz do corte seco (recon §6(d)) — some depois do primeiro boot */}
        {showLegacyNotice && (
          <div className="mb-4 px-4 py-3 rounded-xl border border-primary/30 bg-primary/5">
            <p className="text-sm text-muted-foreground font-['Plus_Jakarta_Sans'] leading-relaxed">
              🌿 O KINU agora tem contas de verdade — crie sua senha pra continuar.
              Suas viagens continuam salvas neste navegador.
            </p>
          </div>
        )}

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

          {notice && (
            <p className="text-primary text-sm">{notice}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 btn-primary font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? <Loader2 size={18} className="animate-spin" />
              : <span>🌿</span>}
            <span>{isLogin ? 'Entrar no Clã' : 'Criar minha conta'}</span>
          </button>

          {/* Separador + Google */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">ou</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={isSubmitting}
            className="w-full py-3.5 bg-card border border-border rounded-xl font-medium text-foreground flex items-center justify-center gap-2 hover:bg-card/80 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.0 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.0 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C39.9 35.9 44 30.5 44 24c0-1.3-.1-2.6-.4-3.9z"/>
            </svg>
            <span>Entrar com Google</span>
          </button>
        </form>

        {/* Toggle */}
        <p className="text-center mt-6 text-muted-foreground font-['Plus_Jakarta_Sans']">
          {isLogin ? 'Ainda não faz parte do clã? ' : 'Já tem conta? '}
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(''); setNotice(''); }}
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
