// "Indicar um lugar ao clã" — Clã Vivo v2 (modo Waze). O clã sinaliza, o KINU cura.
//
// Geolocalização: a permissão SÓ é pedida quando a pessoa toca em "Estou aqui" — ou ao
// abrir, quando o sheet vem do chip do modo durante (`preferGps`).
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { CURATED_CITIES } from '@/lib/curatedCities';
import { CITY_COORDINATES } from '@/data/cityCoordinates';
import { getDestinationActivities } from '@/data/destinationActivities';
import { getCurrentUserId } from '@/lib/session';
import {
  BEST_TIMES, CLA_CATEGORIES, PRICE_RANGES, SUGGESTION_NOTE_MAX,
  confirmSuggestion, hasLivedCity, suggestPlace, suggestionsPublic,
  type BestTime, type CoordSource, type PriceRange,
} from '@/lib/cla';
import { findDuplicate, type DuplicateMatch } from '@/lib/claDedupe';
import { CLA_DAILY_CAP, canSuggestToday, markSuggestionToday } from '@/lib/claDailyCap';
import { PinPickerMap } from './PinPickerMap';

const OTHER = '__outra__';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCity?: string;
  preferGps?: boolean;
  onSent?: () => void;
}

const chip = (on: boolean) =>
  on
    ? 'px-3 py-1.5 rounded-full text-xs border bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
    : 'px-3 py-1.5 rounded-full text-xs border border-border text-muted-foreground hover:border-emerald-500/30';

const inputCls = 'mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground';

function curatedOf(city?: string): string | undefined {
  if (!city) return undefined;
  const d = city.toLowerCase();
  return CURATED_CITIES.find((c) => d.includes(c.toLowerCase()));
}

export const IndicarLugarSheet = ({ open, onOpenChange, defaultCity, preferGps, onSent }: Props) => {
  const [pick, setPick] = useState<string>(CURATED_CITIES[0]);
  const [otherCity, setOtherCity] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CLA_CATEGORIES[0].value);
  const [neighborhood, setNeighborhood] = useState('');
  const [mode, setMode] = useState<CoordSource>('none');
  const [coord, setCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [tip, setTip] = useState('');
  const [price, setPrice] = useState<PriceRange | null>(null);
  const [bestTime, setBestTime] = useState<BestTime | null>(null);
  const [familyOk, setFamilyOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dup, setDup] = useState<DuplicateMatch | null>(null);
  const [livedHere, setLivedHere] = useState(false);

  const city = pick === OTHER ? otherCity.trim() : pick;

  const reset = () => {
    setName(''); setNeighborhood(''); setTip(''); setPrice(null); setBestTime(null);
    setFamilyOk(false); setCoord(null); setAccuracy(null); setMode('none'); setDup(null);
  };

  const locate = useCallback(() => {
    setMode('gps');
    setCoord(null);
    setAccuracy(null);
    if (!('geolocation' in navigator)) {
      toast.error('Seu aparelho não informa a localização. Marca no mapa.');
      setMode('pin');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setCoord({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAccuracy(Math.round(pos.coords.accuracy));
      },
      () => {
        setLocating(false);
        toast.error('Sem permissão de localização — marca no mapa.');
        setMode('pin');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // Ao abrir: cidade inicial e, vindo do modo durante, "Estou aqui" pré-selecionado.
  useEffect(() => {
    if (!open) return;
    const c = curatedOf(defaultCity);
    if (c) setPick(c);
    else if (defaultCity) { setPick(OTHER); setOtherCity(defaultCity); }
    if (preferGps) locate();
  }, [open, defaultCity, preferGps, locate]);

  useEffect(() => {
    setDup(null);
    if (!city) return;
    let alive = true;
    void hasLivedCity(city).then((v) => alive && setLivedHere(v));
    return () => { alive = false; };
  }, [city]);

  const center: [number, number] = (() => {
    const c = CITY_COORDINATES[city];
    return c ? [c.lat, c.lng] : coord ? [coord.lat, coord.lng] : [0, 0];
  })();

  const valid = city.length >= 2 && name.trim().length >= 3 && name.trim().length <= 80;

  const submit = async () => {
    if (!valid || busy) return;
    const userId = getCurrentUserId();
    if (!userId) { toast.error('Entre na sua conta para indicar.'); return; }
    if (!canSuggestToday(userId)) {
      toast.message(`Você já indicou ${CLA_DAILY_CAP} lugares hoje — obrigado! Volta amanhã pra mandar mais.`);
      return;
    }
    setBusy(true);
    const pending = await suggestionsPublic(city);
    const match = findDuplicate(name, getDestinationActivities(city), pending);
    if (match) { setDup(match); setBusy(false); return; }

    const ok = await suggestPlace({
      city, name, category, neighborhood,
      lat: coord?.lat ?? null, lng: coord?.lng ?? null,
      coordSource: coord ? mode : 'none',
      tip, priceRange: price, bestTime, familyOk, lived: livedHere,
    });
    setBusy(false);
    if (ok) {
      markSuggestionToday(userId);
      toast.success('Vai pra curadoria do KINU. Se entrar no catálogo, você ganha o crédito.');
      reset();
      onSent?.();
      onOpenChange(false);
    } else {
      toast.error('Não consegui registrar sua indicação agora. Tenta de novo em instantes.');
    }
  };

  const confirmDup = async () => {
    if (dup?.kind !== 'suggested') return;
    setBusy(true);
    const ok = await confirmSuggestion(dup.suggestionId, city);
    setBusy(false);
    if (ok) {
      toast.success('Confirmado — isso pesa na curadoria.');
      reset();
      onSent?.();
      onOpenChange(false);
    } else toast.error('Não consegui confirmar agora.');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto bg-card border-border">
        <SheetHeader>
          <SheetTitle className="font-['Outfit']">Indicar um lugar ao clã</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4 pb-6">
          <div>
            <label className="text-xs text-muted-foreground">Cidade</label>
            <Select value={pick} onValueChange={setPick}>
              <SelectTrigger className="mt-1 bg-background border-border h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURATED_CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                <SelectItem value={OTHER}>Outra cidade…</SelectItem>
              </SelectContent>
            </Select>
            {pick === OTHER && (
              <input value={otherCity} maxLength={60} onChange={(e) => setOtherCity(e.target.value)} placeholder="Qual cidade?" className={inputCls} />
            )}
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Nome do lugar</label>
            <input value={name} maxLength={80} onChange={(e) => { setName(e.target.value); setDup(null); }} placeholder="Ex.: Cantina do Zé" className={inputCls} />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Categoria</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {CLA_CATEGORIES.map((c) => (
                <button key={c.value} type="button" onClick={() => setCategory(c.value)} className={chip(category === c.value)}>{c.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Bairro</label>
            <input value={neighborhood} maxLength={80} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Ex.: Meireles" className={inputCls} />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Localização</label>
            <div className="mt-1 flex flex-wrap gap-2">
              <button type="button" onClick={locate} className={chip(mode === 'gps')}>📍 Estou aqui</button>
              <button type="button" onClick={() => { setMode('pin'); setCoord(null); setAccuracy(null); }} className={chip(mode === 'pin')}>🗺️ Marcar no mapa</button>
              <button type="button" onClick={() => { setMode('none'); setCoord(null); setAccuracy(null); }} className={chip(mode === 'none')}>Pular</button>
            </div>
            {mode === 'gps' && (
              <p className="text-[11px] text-muted-foreground mt-2">
                {locating ? 'Buscando sua posição…' : coord ? `Posição registrada · precisão ±${accuracy ?? '?'} m` : 'Sem posição ainda.'}
              </p>
            )}
            {mode === 'pin' && (
              <div className="mt-2 space-y-1">
                {CITY_COORDINATES[city] ? (
                  <PinPickerMap center={center} value={coord} onPick={setCoord} />
                ) : (
                  <p className="text-[11px] text-muted-foreground">Não tenho o mapa dessa cidade — use "Estou aqui" ou pule.</p>
                )}
                <p className="text-[11px] text-muted-foreground">{coord ? 'Pino marcado.' : 'Toque no mapa para marcar o lugar.'}</p>
              </div>
            )}
            {(mode === 'none' || !coord) && !locating && (
              <p className="text-[11px] text-amber-400/90 mt-2">Sem localização a curadoria demora mais.</p>
            )}
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Por que vale a pena?</label>
            <textarea value={tip} maxLength={SUGGESTION_NOTE_MAX} onChange={(e) => setTip(e.target.value)} rows={3} className={inputCls} />
            <p className="text-[10px] text-muted-foreground/70 mt-1">{tip.length}/{SUGGESTION_NOTE_MAX}</p>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Faixa de preço (por pessoa)</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {PRICE_RANGES.map((p) => (
                <button key={p.value} type="button" onClick={() => setPrice(price === p.value ? null : p.value)} className={chip(price === p.value)}>{p.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Melhor horário</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {BEST_TIMES.map((b) => (
                <button key={b.value} type="button" onClick={() => setBestTime(bestTime === b.value ? null : b.value)} className={chip(bestTime === b.value)}>{b.label}</button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm text-foreground">Bom para ir com crianças</label>
            <Switch checked={familyOk} onCheckedChange={setFamilyOk} />
          </div>

          {dup && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
              <p className="text-sm text-foreground">
                {dup.kind === 'catalog'
                  ? `"${dup.name}" já está no catálogo do KINU.`
                  : `"${dup.name}" já foi sugerido — quer confirmar?`}
              </p>
              {dup.kind === 'suggested' && (livedHere ? (
                <button type="button" onClick={() => void confirmDup()} disabled={busy} className="px-3 py-1.5 rounded-full text-xs border bg-emerald-500/20 border-emerald-500/40 text-emerald-400">
                  🤝 Também fui
                </button>
              ) : (
                <p className="text-[11px] text-muted-foreground">Confirmar é para quem já viveu a cidade — depois da viagem, você pode.</p>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => void submit()}
            disabled={!valid || busy}
            className="w-full py-3 rounded-xl bg-emerald-500 text-background text-sm font-semibold font-['Outfit'] disabled:opacity-40"
          >
            {busy ? 'Enviando…' : 'Enviar ao clã'}
          </button>
          <p className="text-[11px] text-muted-foreground text-center">
            Vai pra curadoria do KINU. Se entrar no catálogo, você ganha o crédito.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default IndicarLugarSheet;
