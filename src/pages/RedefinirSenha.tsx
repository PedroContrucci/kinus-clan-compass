import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import kinuLogo from '@/assets/KINU_logo.png';
import { useAuth } from '@/hooks/useAuth';
import { kinuBeta } from '@/integrations/kinu-beta/client';

const MIN_PASSWORD = 6; // igual ao cadastro (Login.tsx)

const RedefinirSenha = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [linkError, setLinkError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Só registra o evento — o formulário nunca depende dele, porque a sessão de
  // recuperação pode já ter sido consumida antes desta tela montar.
  useEffect(() => {
    const { data: { subscription } } = kinuBeta.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') console.info('[auth] PASSWORD_RECOVERY');
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => () => {
    if (redirectTimer.current) clearTimeout(redirectTimer.current);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLinkError(false);

    if (password.length < MIN_PASSWORD) {
      setError(`A senha deve ter pelo menos ${MIN_PASSWORD} caracteres.`);
      return;
    }
    if (password !== confirm) {
      setError('As senhas não são iguais.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: updateError } = await updatePassword(password);
      if (updateError) {
        console.error('[redefinir-senha] updatePassword falhou', updateError);
        setLinkError(true);
        return;
      }
      setSuccess(true);
      redirectTimer.current = setTimeout(() => navigate('/inicio'), 2000);
    } catch (err) {
      console.error('[redefinir-senha] updatePassword falhou', err);
      setLinkError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground';

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 py-10">
      <div className="fixed inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          <img src={kinuLogo} alt="KINU Logo" className="w-24 h-24 mx-auto mb-4 object-contain" />
          <h1 className="text-[32px] font-bold text-foreground font-['Outfit']">KINU</h1>
        </div>

        <h2 className="text-center text-foreground font-['Outfit'] text-xl font-semibold mb-6">
          Redefinir senha
        </h2>

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Nova senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Confirmar nova senha"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            className={inputClass}
          />

          {error && <p className="text-destructive text-sm">{error}</p>}

          {linkError && (
            <p className="text-destructive text-sm">
              Este link expirou ou é inválido. Peça um novo link na tela de entrada.{' '}
              <Link to="/" className="text-primary hover:underline">Ir para a entrada</Link>
            </p>
          )}

          {success && <p className="text-primary text-sm">Senha redefinida com sucesso</p>}

          <button
            type="submit"
            disabled={isSubmitting || success}
            className="w-full py-3.5 btn-primary font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 size={18} className="animate-spin" />}
            <span>Redefinir senha</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default RedefinirSenha;
