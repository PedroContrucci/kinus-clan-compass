// Aba Clã — Clã Vivo v1. O clã sinaliza, o KINU cura.
//
// Anônimo por desenho: nenhum nome de usuário, nenhum ranking de pessoas. Só o que a
// comunidade amou, o que sugeriu e o que VOCÊ contribuiu.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sparkles, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { BottomNav } from '@/components/shared/BottomNav';
import { HintBalloon } from '@/components/onboarding/HintBalloon';
import { getActiveTrip, listTrips, subscribeTrips } from '@/lib/tripStore';
import { CURATED_CITIES } from '@/lib/curatedCities';
import { getDestinationActivities } from '@/data/destinationActivities';
import {
  claStats,
  hasLivedCity,
  myReactions,
  mySuggestions,
  suggestionsPublic,
  CLA_CATEGORIES,
  type ClaStat,
  type ClaSuggestionPublic,
  type MyReaction,
  type MySuggestion,
} from '@/lib/cla';
import { SuggestPlaceSheet } from '@/components/cla/SuggestPlaceSheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import kinuLogo from '@/assets/KINU_logo.png';

const STATUS_PILL: Record<string, { label: string; className: string }> = {
  pending: { label: 'em curadoria', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  accepted: { label: 'no catálogo', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  rejected: { label: 'não entrou', className: 'bg-muted text-muted-foreground border-border' },
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
  const [reactions, setReactions] = useState<MyReaction[]>([]);
  const [mySugs, setMySugs] = useState<MySuggestion[]>([]);
  const [lived, setLived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

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
    const [s, pub, mine, sugs, liv] = await Promise.all([
      claStats(city),
      suggestionsPublic(city),
      myReactions(city),
      mySuggestions(city),
      hasLivedCity(city),
    ]);
    setStats(s);
    setSuggestions(pub);
    setReactions(mine);
    setMySugs(sugs);
    setLived(liv);
    setLoading(false);
  }, [city]);

  useEffect(() => {
    void load();
  }, [load]);

  /** id do catálogo -> nome, para dar rosto às estatísticas. */
  const namesById = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of getDestinationActivities(city)) map.set(a.id, a.name);
    return map;
  }, [city]);

  const loved = useMemo(
    () =>
      [...stats.values()]
        .map((s) => ({ ...s, name: namesById.get(s.activity_id) }))
        .filter((s) => s.ups + s.downs > 0)
        .sort((a, b) => b.ups - b.downs - (a.ups - a.downs))
        .slice(0, 10),
    [stats, namesById]
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
              <p className="text-xs text-muted-foreground">
                Quem viveu, sinaliza. O KINU cura.
              </p>
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
          text="O Clã é a sabedoria coletiva — vote e sugira depois de viver a cidade."
        />

        {/* Sugerir */}
        <section className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm text-foreground font-['Outfit'] font-semibold mb-1">
            Conhece um lugar em {city}?
          </p>
          {lived ? (
            <>
              <p className="text-xs text-muted-foreground mb-3">
                Vai pra curadoria do KINU — se entrar no catálogo, você ganha o crédito.
              </p>
              <button
                onClick={() => setSheetOpen(true)}
                className="w-full py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-semibold font-['Outfit']"
              >
                + Sugerir um lugar ao clã
              </button>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Vote e sugira depois de viver {city}.
            </p>
          )}
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Mais amados */}
            <section>
              <h2 className="font-semibold text-lg text-foreground font-['Outfit'] flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-emerald-400" /> Mais amados pelo clã
              </h2>
              {loved.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Ninguém sinalizou nada em {city} ainda. Pode ser você o primeiro.
                </p>
              ) : (
                <div className="space-y-2">
                  {loved.map((item, i) => (
                    <div
                      key={item.activity_id}
                      className="flex items-center gap-3 bg-card border border-border rounded-xl p-3"
                    >
                      <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground font-['Outfit'] truncate">
                          {item.name || item.activity_id}
                        </p>
                        {item.notes > 0 && (
                          <p className="text-[10px] text-muted-foreground">
                            {item.notes} nota{item.notes > 1 ? 's' : ''} do clã
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <ThumbsUp size={11} /> {item.ups}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <ThumbsDown size={11} /> {item.downs}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Sugestões do clã */}
            <section>
              <h2 className="font-semibold text-lg text-foreground font-['Outfit'] mb-3">
                💡 Sugestões do clã
              </h2>
              {suggestions.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhuma sugestão para {city} ainda.
                </p>
              ) : (
                <div className="space-y-2">
                  {suggestions.map((s, i) => {
                    const pill = STATUS_PILL[s.status] ?? STATUS_PILL.pending;
                    return (
                      <div key={`${s.name}-${i}`} className="bg-card border border-border rounded-xl p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-foreground font-['Outfit'] truncate">{s.name}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${pill.className}`}>
                            {pill.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {categoryLabel(s.category)} · {s.apoios ?? 0} apoio{(s.apoios ?? 0) === 1 ? '' : 's'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Suas contribuições */}
            <section>
              <h2 className="font-semibold text-lg text-foreground font-['Outfit'] mb-3">
                🌱 Suas contribuições
              </h2>
              {reactions.length === 0 && mySugs.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Você ainda não contribuiu em {city}.
                </p>
              ) : (
                <div className="space-y-2">
                  {reactions.map((r) => (
                    <div
                      key={r.activity_id}
                      className="flex items-center gap-2 bg-card border border-border rounded-xl p-3"
                    >
                      <span>{r.kind === 'up' ? '👍' : '👎'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">
                          {namesById.get(r.activity_id) || r.activity_id}
                        </p>
                        {r.note && <p className="text-[11px] text-muted-foreground truncate">“{r.note}”</p>}
                      </div>
                    </div>
                  ))}
                  {mySugs.map((s, i) => {
                    const pill = STATUS_PILL[s.status] ?? STATUS_PILL.pending;
                    return (
                      <div key={`${s.name}-${i}`} className="bg-card border border-border rounded-xl p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-foreground truncate">💡 {s.name}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${pill.className}`}>
                            {pill.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{categoryLabel(s.category)}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <SuggestPlaceSheet
        city={city}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSent={() => void load()}
      />

      <BottomNav />
    </div>
  );
};

export default Cla;
