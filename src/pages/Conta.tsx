import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, User, HelpCircle, Star, Info, Loader2, Shield, Trash2 } from 'lucide-react';
import { BottomNav } from '@/components/shared/BottomNav';
import { toast } from '@/hooks/use-toast';
import kinuLogo from '@/assets/KINU_logo.png';
import { loadJson } from '@/lib/safeStorage';
import { listTrips, clearTrips } from '@/lib/tripStore';
import { useAuth } from '@/hooks/useAuth';
import { kinuBeta } from '@/integrations/kinu-beta/client';



const Conta = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, logout } = useAuth();
  const [stats, setStats] = useState({ trips: 0, countries: 0, activities: 0 });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Guard ASSÍNCRONO — a diferença que importa: só redireciona depois que a
  // sessão resolveu. Antes, o guard era síncrono (loadJson do mock) e mandaria
  // todo usuário logado para `/` a cada reload (recon §4). Mesmo formato do
  // Dashboard.tsx:34.
  useEffect(() => {
    if (!user && !authLoading) navigate('/');
  }, [user, authLoading, navigate]);

  // As estatísticas leem o funil do Arco 1 e não dependem de auth — efeito
  // separado para não recalcular a cada refresh de token.
  useEffect(() => {
    const savedTrips = listTrips();
    const uniqueCountries = new Set(savedTrips.map(t => t.country).filter(Boolean));
    const totalActivities = savedTrips.reduce((acc, trip) => {
      return acc + (trip.days || []).reduce((dayAcc, day) => dayAcc + (day.activities?.length || 0), 0);
    }, 0);
    setStats({
      trips: savedTrips.length,
      countries: uniqueCountries.size,
      activities: totalActivities,
    });
  }, []);

  // O logout paralelo morreu aqui (recon §2.2, §5.6): ele apagava o mock e
  // deixaria a sessão Supabase VIVA — a pessoa "sairia" e voltaria logada.
  // useAuth().logout faz signOut() e já navega para '/'.
  const handleLogout = () => { void logout(); };

  // Exclusão LGPD: a RPC delete_my_account apaga dados + auth row no servidor.
  // Em caso de erro NÃO sai da sessão — o usuário pode tentar de novo.
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'EXCLUIR' || isDeleting) return;
    setIsDeleting(true);
    try {
      const { error } = await kinuBeta.rpc('delete_my_account');
      if (error) throw error;

      await kinuBeta.auth.signOut();
      clearTrips();
      setDeleteDialogOpen(false);
      toast({ title: 'Conta excluída. Obrigado por testar o KINU.' });
      navigate('/', { replace: true });
    } catch (err) {
      console.error('[conta] delete_my_account falhou', err);
      toast({
        title: 'Não foi possível excluir agora. Tente novamente.',
        variant: 'destructive',
      });
      setIsDeleting(false);
    }
  };

  const handleComingSoon = (feature: string) => {
    toast({
      title: "Em breve! 🚀",
      description: `${feature} estará disponível na próxima versão.`,
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const menuItems = [
    { icon: User, label: 'Editar Perfil', action: () => handleComingSoon('Edição de perfil') },
    { icon: Star, label: 'Meus Favoritos', action: () => handleComingSoon('Favoritos') },
    { icon: HelpCircle, label: 'Ajuda e Suporte', action: () => handleComingSoon('Suporte') },
    { icon: Info, label: 'Sobre o KINU', action: () => {
      toast({
        title: "KINU — The Travel OS 🌿",
        description: "v0.1.0 POC • Onde a sabedoria do clã encontra a precisão da engenharia.",
      });
    }},
    { icon: Shield, label: 'Privacidade', action: () => navigate('/privacidade') },
  ];

  return (
    <div className="min-h-screen bg-background pb-36 lg:pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <img src={kinuLogo} alt="KINU" className="h-8 w-8 object-contain" />
          <span className="font-bold text-xl font-['Outfit'] text-foreground">KINU</span>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6">
        <h1 className="text-2xl font-bold mb-6 font-['Outfit'] text-foreground">Minha Conta 👤</h1>

        {/* Profile Card */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-2xl text-primary-foreground">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-lg text-foreground font-['Outfit']">{user.name}</p>
              <p className="text-muted-foreground text-sm">{user.email}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-primary text-xs">🌿 Membro do Clã</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground font-['Outfit']">{stats.trips}</p>
            <p className="text-xs text-muted-foreground">Viagens</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground font-['Outfit']">{stats.countries}</p>
            <p className="text-xs text-muted-foreground">Países</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground font-['Outfit']">{stats.activities}</p>
            <p className="text-xs text-muted-foreground">Atividades</p>
          </div>
        </div>

        {/* Menu */}
        <div className="space-y-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className="w-full flex items-center gap-3 p-4 bg-card border border-border rounded-xl text-left hover:bg-card/80 transition-colors"
            >
              <item.icon size={20} className="text-muted-foreground" />
              <span className="text-foreground font-['Plus_Jakarta_Sans']">{item.label}</span>
            </button>
          ))}
          
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-left hover:bg-destructive/20 transition-colors mt-4"
          >
            <LogOut size={20} className="text-destructive" />
            <span className="text-destructive font-['Plus_Jakarta_Sans']">Sair da Conta</span>
          </button>
        </div>

        {/* Beta Feedback Viewer */}
        {(() => {
          const feedbacks: any[] = loadJson<any[]>('kinu_feedback', []);
          return (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h2 className="text-lg font-bold font-['Outfit'] text-foreground">
                  📝 Feedbacks Recebidos {feedbacks.length > 0 ? `(${feedbacks.length})` : ''}
                </h2>
                <div className="flex items-center gap-2">
                  {feedbacks.length > 0 && (
                    <button
                      onClick={() => {
                        const data = JSON.stringify(feedbacks, null, 2);
                        const blob = new Blob([data], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `kinu-feedback-${new Date().toISOString().split('T')[0]}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      📥 Exportar JSON
                    </button>
                  )}
                </div>
              </div>


              {/* Local feedback list */}
              {feedbacks.length > 0 && (
                <div className="space-y-2">
                  {[...feedbacks].reverse().map((fb: any, i: number) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-3">
                      <div className="flex items-center gap-2 text-sm mb-1">
                        <span>{fb.category === 'bug' ? '🐛' : fb.category === 'confusing' ? '😕' : fb.category === 'suggestion' ? '💡' : '❤️'}</span>
                        <span className="font-medium text-foreground">{fb.category}</span>
                        <span className="text-muted-foreground">· {fb.page || '?'}</span>
                        <span className="text-amber-400 ml-auto">{'★'.repeat(fb.rating || 0)}</span>
                      </div>
                      <p className="text-sm text-foreground">{fb.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(fb.timestamp).toLocaleString('pt-BR')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Version */}
        <p className="text-center text-xs text-muted-foreground/50 mt-8 font-['Plus_Jakarta_Sans']">
          KINU v0.1.0 • The Travel OS
        </p>
      </main>
      <BottomNav />
    </div>
  );
};

export default Conta;
