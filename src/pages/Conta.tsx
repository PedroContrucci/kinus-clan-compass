import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, HelpCircle, Star, Info, Sparkles, Loader2 } from 'lucide-react';
import { BottomNav } from '@/components/shared/BottomNav';
import { toast } from '@/hooks/use-toast';
import kinuLogo from '@/assets/KINU_logo.png';
import { SavedTrip } from '@/types/trip';
import { supabase } from '@/integrations/supabase/client';

const asArray = (v: unknown): any[] => Array.isArray(v) ? v : (v ? [v] : []);

const Conta = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [stats, setStats] = useState({ trips: 0, countries: 0, activities: 0 });
  const [digest, setDigest] = useState<any>(null);
  const [digestLoading, setDigestLoading] = useState(false);
  const [digestError, setDigestError] = useState<{ message: string; raw?: string } | null>(null);

  const handleGenerateDigest = async () => {
    setDigestLoading(true);
    setDigest(null);
    setDigestError(null);
    try {
      const { data, error } = await supabase.functions.invoke('feedback-digest');
      if (error) {
        setDigestError({ message: error.message || 'Falha ao chamar a função' });
      } else if (!data) {
        setDigestError({ message: 'Resposta vazia da função' });
      } else if (data.error) {
        setDigestError({ message: String(data.error), raw: data.raw });
      } else if (data.digest === null || data.digest === undefined) {
        toast({ title: data.message || 'Sem feedbacks ainda' });
      } else {
        setDigest(data.digest);
      }
    } catch (err: any) {
      setDigestError({ message: err?.message || 'Erro inesperado ao gerar análise' });
    } finally {
      setDigestLoading(false);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('kinu_user');
    if (!savedUser) {
      navigate('/');
      return;
    }
    setUser(JSON.parse(savedUser));

    const savedTrips: SavedTrip[] = JSON.parse(localStorage.getItem('kinu_trips') || '[]');
    const uniqueCountries = new Set(savedTrips.map(t => t.country).filter(Boolean));
    const totalActivities = savedTrips.reduce((acc, trip) => {
      return acc + (trip.days || []).reduce((dayAcc, day) => dayAcc + (day.activities?.length || 0), 0);
    }, 0);
    setStats({
      trips: savedTrips.length,
      countries: uniqueCountries.size,
      activities: totalActivities,
    });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('kinu_user');
    navigate('/');
  };

  const handleComingSoon = (feature: string) => {
    toast({
      title: "Em breve! 🚀",
      description: `${feature} estará disponível na próxima versão.`,
    });
  };

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
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
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
          const feedbacks: any[] = JSON.parse(localStorage.getItem('kinu_feedback') || '[]');
          return (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h2 className="text-lg font-bold font-['Outfit'] text-foreground">
                  📝 Feedbacks Recebidos {feedbacks.length > 0 ? `(${feedbacks.length})` : ''}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateDigest}
                    disabled={digestLoading}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                  >
                    {digestLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Analisando feedbacks...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        🤖 Gerar análise inteligente
                      </>
                    )}
                  </button>
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

              {/* Error card */}
              {digestError && (
                <div className="bg-card border-2 border-red-500/50 rounded-xl p-4 mb-4">
                  <h3 className="text-sm font-semibold text-red-400 mb-2">⚠️ Erro ao gerar análise</h3>
                  <p className="text-sm text-red-300/80">{digestError.message}</p>
                  {digestError.raw && (
                    <pre className="text-xs text-red-300/60 mt-2 whitespace-pre-wrap break-all max-h-40 overflow-auto">
                      {digestError.raw}
                    </pre>
                  )}
                </div>
              )}

              {/* Digest Cards */}
              {digest && (
                <div className="space-y-3 mb-4">
                  {/* Resumo */}
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-2">📋 Resumo</h3>
                    {Array.isArray(digest?.resumo) ? (
                      <ul className="space-y-1">
                        {asArray(digest?.resumo).map((item: any, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground list-disc list-inside">
                            {typeof item === 'string' ? item : JSON.stringify(item)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">{digest?.resumo ?? ''}</p>
                    )}
                  </div>

                  {/* Prioridade 1 */}
                  {digest?.prioridade_1 && (
                    <div className="bg-card rounded-xl p-4 border-2" style={{ borderColor: '#eab308' }}>
                      <h3 className="text-sm font-semibold text-foreground mb-2">🎯 Prioridade #1</h3>
                      <p className="text-sm text-muted-foreground">{digest?.prioridade_1 ?? ''}</p>
                    </div>
                  )}

                  {/* Críticos */}
                  {asArray(digest?.criticos).length > 0 && (
                    <div className="bg-card border border-red-500/30 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-red-400 mb-2">🔴 Críticos</h3>
                      <ul className="space-y-1">
                        {asArray(digest?.criticos).map((item: any, i: number) => (
                          <li key={i} className="text-sm text-red-300/80 list-disc list-inside">
                            {typeof item === 'string' ? item : JSON.stringify(item)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Padrões */}
                  {asArray(digest?.padroes).length > 0 && (
                    <div className="bg-card border border-amber-500/30 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-amber-400 mb-2">🟡 Padrões</h3>
                      <ul className="space-y-1">
                        {asArray(digest?.padroes).map((item: any, i: number) => (
                          <li key={i} className="text-sm text-amber-300/80 list-disc list-inside">
                            {typeof item === 'string' ? item : JSON.stringify(item)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Sugestões dos usuários */}
                  {asArray(digest?.sugestoes_dos_usuarios).length > 0 && (
                    <div className="bg-card border border-emerald-500/30 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-emerald-400 mb-2">💡 Sugestões dos Usuários</h3>
                      <ul className="space-y-1">
                        {asArray(digest?.sugestoes_dos_usuarios).map((item: any, i: number) => (
                          <li key={i} className="text-sm text-emerald-300/80 list-disc list-inside">
                            {typeof item === 'string' ? item : JSON.stringify(item)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Destaques positivos */}
                  {asArray(digest?.destaques_positivos).length > 0 && (
                    <div className="bg-card border border-emerald-500/30 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-emerald-400 mb-2">✅ Destaques Positivos</h3>
                      <ul className="space-y-1">
                        {asArray(digest?.destaques_positivos).map((item: any, i: number) => (
                          <li key={i} className="text-sm text-emerald-300/80 list-disc list-inside">
                            {typeof item === 'string' ? item : JSON.stringify(item)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

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
