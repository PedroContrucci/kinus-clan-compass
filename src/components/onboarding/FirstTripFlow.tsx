// FirstTripFlow — onboarding v2: continente → país → cidade (C.10) → 3 campos → rascunho.
// Um toque escolhe o destino; um botão monta a viagem pelo mesmo buildDraftTrip do assistente.

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Minus, Plus, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { pickerCities, pickerCountries, pickerRegions, searchDestinations } from '@/lib/destinationPicker';
import type { RegionName } from '@/data/destinationCatalog';
import { interestsFor } from '@/lib/interestsFor';
import { buildDraftTrip } from '@/lib/createTrip';
import { addTrip, type StoredTrip } from '@/lib/tripStore';
import { trackTripCreated } from '@/lib/tripEvents';
import { trackEvent } from '@/lib/kinuEvents';
import { toast } from '@/hooks/use-toast';
import {
  FLOW_TIERS, type FlowTierId, buildFlowInput, defaultDates, finishFlowTrip, resolveOrigin, returnForDeparture,
} from '@/lib/onboardingFlow';

interface Props {
  userId: string;
  homeCity?: unknown;
  /** C.7: vindo do Clã, abre direto nos campos da cidade. */
  initialCity?: string | null;
  /** C.7: com viagens na conta, volta para a lista do Início. */
  onBack?: () => void;
  /** C.10: rótulo do voltar (sem viagem, volta para as duas portas). */
  backLabel?: string;
}

export const FirstTripFlow = ({ userId, homeCity, initialCity, onBack, backLabel }: Props) => {
  const navigate = useNavigate();
  const [city, setCity] = useState<string | null>(initialCity ?? null);
  const [interests, setInterests] = useState<string[]>([]);
  const [cap, setCap] = useState('');
  const offered = useMemo(() => (city ? interestsFor(city) : []), [city]);
  const toggleInterest = (id: string) =>
    setInterests((cur) => (cur.includes(id) ? cur.filter((i) => i !== id) : [...cur, id]));
  const initial = useMemo(() => defaultDates(), []);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  // C.8 (D5): volta tocada pelo usuário mantém a duração quando a ida muda; senão ida + 5.
  const [toEdited, setToEdited] = useState(false);
  const changeFrom = (d: Date) => {
    setTo(returnForDeparture(d, { from, to, toEdited }));
    setFrom(d);
  };
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [tier, setTier] = useState<FlowTierId>('comfort');
  const [busy, setBusy] = useState(false);

  useEffect(() => { trackEvent('onboarding.welcome_shown', { flow: 'v2' }, userId); }, [userId]);

  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<RegionName | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const regions = useMemo(() => pickerRegions(), []);
  const hits = useMemo(() => searchDestinations(query), [query]);

  const pick = (c: string) => {
    setCity(c);
    setInterests([]);
    trackEvent('onboarding.destination_picked', { city: c }, userId);
  };

  const build = async () => {
    if (!city || busy) return;
    setBusy(true);
    try {
      const origin = resolveOrigin(homeCity);
      const capValue = Number(cap.replace(/\D/g, '')) || 0;
      const trip = await buildDraftTrip(buildFlowInput({ city, origin: origin.city, from, to, adults, children, tier, interests, cap: capValue }));
      const stored = finishFlowTrip(trip as StoredTrip, { cap: capValue, children, originSource: origin.source, createdVia: 'onboarding' });
      addTrip(stored);
      trackTripCreated(stored, 'wizard');
      trackEvent('onboarding.trip_built', { city, tier }, userId);
      navigate(`/inicio?trip=${stored.id}`);
    } catch (e) {
      console.error('[onboarding] buildDraftTrip falhou', e);
      toast({ title: 'Não deu para montar agora', description: 'Tente de novo em instantes.' });
      setBusy(false);
    }
  };

  const toDate = (v: string) => new Date(`${v}T12:00:00`);
  const iso = (d: Date) => format(d, 'yyyy-MM-dd');

  return (
    <div className="min-h-screen bg-background px-4 pt-8 pb-36">
      <AnimatePresence mode="wait">
        {!city ? (
          <motion.section key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -40 }}>
            {onBack && (
              <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground mb-4 min-h-[44px]">
                <ArrowLeft size={16} /> {backLabel ?? 'Minhas viagens'}
              </button>
            )}
            <h1 className="text-3xl font-bold text-foreground font-['Outfit']">Para onde vamos?</h1>
            <p className="text-muted-foreground mt-1">Continente, país e cidade. ✓ curado = verificado um a um.</p>
            <div className="relative mt-5">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar cidade ou país…"
                aria-label="Buscar destino"
                className="w-full min-h-[44px] pl-9 pr-3 rounded-xl border border-border bg-card text-sm text-foreground"
              />
            </div>
            {query.trim() ? (
              hits.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">Nenhum destino encontrado para “{query}”.</p>
              ) : (
                <ul className="mt-4 space-y-2" data-testid="picker-hits">
                  {hits.map((h) => (
                    <li key={h.name}>
                      {cityLine(h.name, h.curated, pick, `${h.flag} ${h.country}`)}
                    </li>
                  ))}
                </ul>
              )
            ) : (
              <>
                <div className="mt-4 flex flex-wrap gap-2" data-testid="picker-regions">
                  {regions.map((r) => (
                    <button key={r.id} onClick={() => { setRegion(r.id); setCountry(null); }}
                      className={`min-h-[44px] px-3 rounded-full border text-sm ${region === r.id ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground'}`}>
                      {r.emoji} {r.id}
                    </button>
                  ))}
                </div>
                {region && !country && (
                  <ul className="mt-4 space-y-2" data-testid="picker-countries">
                    {pickerCountries(region).map((c) => (
                      <li key={c.country}>
                        <button onClick={() => setCountry(c.country)}
                          className="w-full flex items-center justify-between min-h-[44px] px-3 rounded-xl border border-border bg-card text-sm text-foreground">
                          <span>{c.flag} {c.country}</span>
                          <span className="text-muted-foreground">{c.cities.length} {c.cities.length === 1 ? 'cidade' : 'cidades'} ▸</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {region && country && (
                  <>
                    <button onClick={() => setCountry(null)} className="mt-4 flex items-center gap-1 text-sm text-muted-foreground min-h-[44px]">
                      <ArrowLeft size={16} /> {region} › {country}
                    </button>
                    <ul className="mt-2 space-y-2" data-testid="picker-cities">
                      {pickerCities(region, country).map((c) => (
                        <li key={c.name}>
                          {cityLine(c.name, c.curated, pick)}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </motion.section>
        ) : (
          <motion.section key="fields" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="max-w-md mx-auto">
            <button onClick={() => setCity(null)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
              <ArrowLeft size={16} /> Trocar destino
            </button>
            <h1 className="text-3xl font-bold text-foreground font-['Outfit']">{city}</h1>
            <p className="text-muted-foreground mt-1">Já deixamos tudo preenchido. Ajuste se quiser.</p>

            <div className="mt-6 space-y-5">
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Datas</p>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={iso(from)} onChange={(e) => e.target.value && changeFrom(toDate(e.target.value))}
                    className="bg-card border border-border rounded-xl px-3 py-2 text-foreground" aria-label="Ida" />
                  <input type="date" value={iso(to)} min={iso(from)} onChange={(e) => {
                      if (!e.target.value) return;
                      const d = toDate(e.target.value);
                      setTo(d < from ? from : d);
                      setToEdited(true);
                    }}
                    className="bg-card border border-border rounded-xl px-3 py-2 text-foreground" aria-label="Volta" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(from, "d 'de' MMM", { locale: ptBR })} → {format(to, "d 'de' MMM", { locale: ptBR })}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">Viajantes</p>
                {([['Adultos', adults, setAdults, 1], ['Crianças', children, setChildren, 0]] as const).map(([label, val, set, min]) => (
                  <div key={label} className="flex items-center justify-between bg-card border border-border rounded-xl px-3 py-2 mb-2">
                    <span className="text-foreground">{label}</span>
                    <span className="flex items-center gap-3">
                      <button aria-label={`Menos ${label}`} onClick={() => set(Math.max(min, val - 1))} className="p-1 rounded-lg bg-muted"><Minus size={14} /></button>
                      <span className="w-4 text-center text-foreground">{val}</span>
                      <button aria-label={`Mais ${label}`} onClick={() => set(Math.min(9, val + 1))} className="p-1 rounded-lg bg-muted"><Plus size={14} /></button>
                    </span>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-2">Orçamento</p>
                <div className="flex gap-2">
                  {FLOW_TIERS.map((t) => (
                    <button key={t.id} onClick={() => setTier(t.id)}
                      className={tier === t.id
                        ? 'flex-1 py-2 rounded-xl border border-primary bg-primary/15 text-foreground text-sm'
                        : 'flex-1 py-2 rounded-xl border border-border bg-card text-muted-foreground text-sm'}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {offered.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Prioridades <span className="text-muted-foreground font-normal">(opcional)</span></p>
                  <div className="flex flex-wrap gap-2">
                    {offered.map((c) => (
                      <button key={c.id} onClick={() => toggleInterest(c.id)} aria-pressed={interests.includes(c.id)}
                        className={interests.includes(c.id)
                          ? 'px-3 py-1.5 rounded-full border border-primary bg-primary/15 text-foreground text-sm'
                          : 'px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground text-sm'}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-foreground mb-2">Teto <span className="text-muted-foreground font-normal">(opcional)</span></p>
                <input inputMode="numeric" value={cap} onChange={(e) => setCap(e.target.value)} placeholder="R$ — sem teto, o KINU estima"
                  aria-label="Teto do orçamento"
                  className="w-full bg-card border border-border rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground" />
              </div>

              <button onClick={build} disabled={busy}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-xl font-semibold font-['Outfit'] flex items-center justify-center gap-2 disabled:opacity-70">
                {busy && <Loader2 size={18} className="animate-spin" />} Montar minha viagem
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FirstTripFlow;

// Linha de cidade do seletor (render helper, não componente).
const cityLine = (name: string, curated: boolean, onPick: (c: string) => void, sub?: string) => (
  <button onClick={() => onPick(name)}
    className="w-full flex items-center justify-between min-h-[44px] px-3 rounded-xl border border-border bg-card text-sm text-foreground text-left">
    <span>
      {name}
      {sub && <span className="ml-2 text-muted-foreground">{sub}</span>}
    </span>
    <span className="flex items-center gap-2">
      {curated && <span className="text-xs text-emerald-500">✓ curado</span>}
      <span className="text-primary">▸</span>
    </span>
  </button>
);
