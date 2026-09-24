// Aba Clã — Clã Vivo v1.1. O clã sinaliza, o KINU cura.
//
// Anônimo por desenho: nenhum nome de usuário, nenhum ranking de pessoas. Votar é assunto
// do check-in pós-viagem; aqui só se sugere e se lê o que a comunidade amou.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sparkles, ThumbsUp, MapPinPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { BottomNav } from '@/components/shared/BottomNav';
import { HintBalloon } from '@/components/onboarding/HintBalloon';
import { getActiveTrip, listTrips, subscribeTrips } from '@/lib/tripStore';
import { CURATED_CITIES } from '@/lib/curatedCities';
import { getDestinationActivities } from '@/data/destinationActivities';
import {
  claStats,
  confirmSuggestion,
  hasLivedCity,
  myConfirmations,
  mySuggestions,
  suggestionsPublic,
  CLA_CATEGORIES,
  type ClaStat,
  type ClaSuggestionPublic,
  type MySuggestion,
} from '@/lib/cla';
import { openClaSuggest } from '@/components/cla/ClaSuggestHost';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import kinuLogo from '@/assets/KINU_logo.png';

const STATUS_PILL: Record<string, { label: string; className: string }> = {
  pending: { label: 'pendente', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  accepted: { label: 'aceita', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  rejected: { label: 'recusada', className: 'bg-muted text-muted-foreground border-border' },
};

const categoryLabel = (value: string) =>
  CLA_CATEGORIES.find((c) => c.value === value)?.label ?? value;

/** A cidade curada correspondente ao destino de uma viagem, quando existe. */
function curatedCityOf(destination?: string): string | undefined {
  if (!destination) return undefined;
  const d = destination.toLowerCase();
  return CURATED_CITIES.find((c) => d.includes(c.toLowerCase()));
}

const Cla = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [city, setCity] = useState<string>(CURATED_CITIES[0]);
  const [cityTouched, setCityTouched] = useState(false);

  const [stats, setStats] = useState<Map<string, ClaStat>>(new Map());
  const [suggestions, setSuggestions] = useState<ClaSuggestionPublic[]>([]);
  const [mySugs, setMySugs] = useState<MySuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [livedHere, setLivedHere] = useState(false);

  // Cidade padrão: a da viagem ativa (ou a mais recente) quando for curada.
  useEffect(() => {
    const pick = () => {
      if (cityTouched) return;
      const fromActive = curatedCityOf(getActiveTrip()?.destination);
      const fromLast = curatedCityOf(listTrips().slice(-1)[0]?.destination);
      const next = fromActive || fromLast;
      if (next) setCity(next);
    };
    pick();
    return subscribeTrips(pick);
  }, [cityTouched]);

  const load = useCallback(async () => {
    setLoading(true);
    const [s, pub, sugs] = await Promise.all([
      claStats(city),
      suggestionsPublic(city),
      mySuggestions(),
    ]);
    setStats(s);
    setSuggestions(pub);
    setMySugs(sugs);
    setConfirmed(await myConfirmations(pub.map((p) => p.id).filter(Boolean)));
    setLivedHere(await hasLivedCity(city));
    setLoading(false);
  }, [city]);

  useEffect(() => {
    void load();
  }, [load]);

  // Indicação enviada pelo sheet global (inclusive vindo do chat) recarrega a aba.
  useEffect(() => {
    const on = () => void load();
    window.addEventListener('kinu:cla-suggested', on);
    return () => window.removeEventListener('kinu:cla-suggested', on);
  }, [load]);

  const alsoWent = async (id: string) => {
    const ok = await confirmSuggestion(id, city);
    if (ok) {
      setConfirmed((prev) => new Set(prev).add(id));
      setSuggestions((prev) => prev.map((x) => (x.id === id ? { ...x, confirmations: x.confirmations + 1 } : x)));
    }
  };

  /** id do catálogo -> nome + nota Google, para dar rosto às estatísticas. */
  const catalogById = useMemo(() => {
    const map = new Map<string, { name: string; rating?: number }>();
    for (const a of getDestinationActivities(city)) map.set(a.id, { name: a.name, rating: a.rating });
    return map;
  }, [city]);

  const loved = useMemo(
    () =>
      [...stats.values()]
        .map((s) => ({ ...s, name: catalogById.get(s.activity_id)?.name, rating: catalogById.get(s.activity_id)?.rating }))
        .filter((s) => s.ups + s.downs > 0)
        .sort((a, b) => b.ups - b.downs - (a.ups - a.downs))
        .slice(0, 10),
    [stats, catalogById]
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-36 lg:pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-3 space-y-3">
          <div className="flex items-center gap-3">
            <img src={kinuLogo} alt="KINU" className="h-8 w-8 object-contain" />
            <div>
              <h1 className="font-bold text-xl font-['Outfit'] text-foreground">Clã Vivo 🌿</h1>
              <p className="text-xs text-muted-foreground">Quem viveu, sinaliza. O KINU cura.</p>
            </div>
          </div>

          <Select
            value={city}
            onValueChange={(v) => {
              setCityTouched(true);
              setCity(v);
            }}
          >
            <SelectTrigger className="bg-card border-border h-9 text-sm">
              <SelectValue placeholder="Cidade" />
            </SelectTrigger>
            <SelectContent>
              {CURATED_CITIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <main className="px-4 space-y-6 pt-4">
        <HintBalloon
          area="cla"
          arrow="up"
          text="O Clã é a sabedoria coletiva — sugira lugares e veja o que a comunidade amou."
        />

        {/* A) CONTRIBUA COM O CATÁLOGO */}
        <section className="space-y-4">
          <div>
            <p className="text-[11px] tracking-widest text-emerald-400 font-semibold">CONTRIBUA COM O CATÁLOGO</p>
            <p className="text-xs text-muted-foreground">Conhece um lugar que o KINU ainda não tem? Indique — a curadoria decide.</p>
          </div>
          <button
            onClick={() => openClaSuggest({ city })}
            className="w-full py-4 rounded-2xl bg-emerald-500 text-background font-semibold font-['Outfit'] flex items-center justify-center gap-2"
          >
            <MapPinPlus size={18} /> Indicar um lugar ao clã
          </button>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div>
                <h2 className="font-semibold text-base text-foreground font-['Outfit'] mb-2">Indicações do clã em {city}</h2>
                {suggestions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhuma indicação para {city} ainda.</p>
                ) : (
                  <div className="space-y-2">
                    {suggestions.map((s) => {
                      const pill = STATUS_PILL[s.status] ?? STATUS_PILL.pending;
                      const canConfirm = livedHere && s.status === 'pending' && !confirmed.has(s.id);
                      return (
                        <div key={s.id} className="bg-card border border-border rounded-xl p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm text-foreground font-['Outfit'] truncate">{s.name}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${pill.className}`}>{pill.label}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {categoryLabel(s.category)}{s.neighborhood ? ` · ${s.neighborhood}` : ''}
                          </p>
                          <div className="flex items-center flex-wrap gap-2 mt-2">
                            <span className="text-[11px] text-muted-foreground">🤝 {s.confirmations} confirmaram</span>
                            {s.google_status && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                                {s.google_status === 'found' || s.google_status === 'ok' ? 'no Google' : 'sem ficha no Google'}
                              </span>
                            )}
                            {confirmed.has(s.id) && <span className="text-[11px] text-emerald-400">✓ você confirmou</span>}
                            {canConfirm && (
                              <button
                                onClick={() => void alsoWent(s.id)}
                                className="ml-auto px-3 py-1 rounded-full text-xs border bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                              >
                                Também fui
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <h2 className="font-semibold text-base text-foreground font-['Outfit'] mb-2">Suas indicações</h2>
                {mySugs.length === 0 ? (
                  <p className="text-xs text-muted-foreground/70">Você ainda não indicou nenhum lugar.</p>
                ) : (
                  <div className="space-y-2">
                    {mySugs.map((s, i) => {
                      const pill = STATUS_PILL[s.status] ?? STATUS_PILL.pending;
                      return (
                        <div key={s.id ?? `${s.city}-${s.name}-${i}`} className="bg-background border border-border rounded-xl px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm text-foreground truncate">{s.name}</p>
                              <p className="text-[11px] text-muted-foreground">{s.city} · {categoryLabel(s.category)}</p>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${pill.className}`}>{pill.label}</span>
                          </div>
                          {s.curator_note && (
                            <p className="text-[11px] text-muted-foreground mt-1 italic">KINU: {s.curator_note}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        {/* B) O QUE O CLÃ VIVEU */}
        <section className="space-y-3 pt-4 border-t border-border">
          <div>
            <p className="text-[11px] tracking-widest text-amber-400 font-semibold">O QUE O CLÃ VIVEU</p>
            <p className="text-xs text-muted-foreground">Você avalia depois de viver — no check-in da viagem.</p>
          </div>
          <h2 className="font-semibold text-base text-foreground font-['Outfit'] flex items-center gap-2">
            <Sparkles size={16} className="text-emerald-400" /> Mais amados pelo clã · {city}
          </h2>
          {loading ? null : loved.length === 0 ? (
            <p className="text-xs text-muted-foreground">Ninguém avaliou nada em {city} ainda. Pode ser você, no check-in.</p>
          ) : (
            <div className="space-y-2">
              {loved.map((item, i) => (
                <div key={item.activity_id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground font-['Outfit'] truncate">{item.name || item.activity_id}</p>
                    {item.notes > 0 && (
                      <p className="text-[10px] text-muted-foreground">{item.notes} nota{item.notes > 1 ? 's' : ''} do clã</p>
                    )}
                  </div>
                  {typeof item.rating === 'number' && item.rating > 0 && (
                    <span className="text-[11px] text-muted-foreground">Google {item.rating.toFixed(1).replace('.', ',')}</span>
                  )}
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                    Clã <ThumbsUp size={11} /> {item.ups}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Cla;
