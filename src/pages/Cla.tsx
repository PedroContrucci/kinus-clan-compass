import { useCallback, useEffect, useMemo, useState } from 'react';
import { List, Loader2, MapPinPlus, Search, Star, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/shared/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { getDestinationActivities, type SuggestedActivity } from '@/data/destinationActivities';
import { getCuratedHotels, type CuratedHotel } from '@/data/curatedHotels';
import { destinations, type Destination } from '@/data/destinations';
import { MICHELIN_RESTAURANTS, type MichelinRestaurant } from '@/lib/michelinData';
import { CURATED_CITIES } from '@/lib/curatedCities';
import { getActiveTrip, listTrips, subscribeTrips } from '@/lib/tripStore';
import { useAuth } from '@/hooks/useAuth';
import { HotelDetailDrawer } from '@/components/hotel/HotelDetailDrawer';
import { ActivityDetailDrawer } from '@/components/cockpit/ActivityDetailDrawer';
import { AddToTripSheet, type AddTarget } from '@/components/cla/AddToTripSheet';
import { ClaLazyImage } from '@/components/cla/ClaLazyImage';
import { MichelinDetailDrawer } from '@/components/cla/MichelinDetailDrawer';
import { openClaSuggest } from '@/components/cla/ClaSuggestHost';
import kinuLogo from '@/assets/KINU_logo.png';
import { TIER_LABEL } from '@/lib/hotelSwap';
import {
  CLA_CATEGORIES,
  claStats,
  confirmSuggestion,
  hasLivedCity,
  myConfirmations,
  mySuggestions,
  sharedTripsPublic,
  suggestionsPublic,
  type ClaStat,
  type ClaSuggestionPublic,
  type MySuggestion,
  type SharedTripPublic,
} from '@/lib/cla';
import type { TripActivity } from '@/types/trip';
import { CURATED_COORDS } from '@/data/generated/coords';
import { PRIORITY_CHIPS, matchesPriority } from '@/lib/claChips';
import { myTipVotes, tipsPublic, type ClaTip, type TipVote } from '@/lib/claTips';
import { ClaTipCard, ClaTipSheet, type TipDraft } from '@/components/cla/ClaTips';

type CategoryKey = string; // 'all' | 'itinerary' | 'hotel' | 'tips' | id de prioridade do wizard
type CatalogCard =
  | { kind: 'activity'; activity: SuggestedActivity }
  | { kind: 'hotel'; hotel: CuratedHotel }
  | { kind: 'michelin'; restaurant: MichelinRestaurant };

function mapsLink(id: string, name: string, city: string): string {
  const c = CURATED_COORDS[id];
  const q = c ? `${c.lat},${c.lng}` : `${name}, ${city}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

const TRAVEL_STYLES = [
  { value: 'all', label: 'Todos os Estilos' },
  { value: 'culture', label: '🏛️ Cultura' },
  { value: 'adventure', label: '🧗 Aventura' },
  { value: 'gastronomy', label: '🍜 Gastronomia' },
  { value: 'relaxed', label: '🌴 Relaxamento' },
  { value: 'family', label: '👨‍👩‍👧‍👦 Família' },
];

const CITY_INSIGHTS: Record<string, string> = {
  Fortaleza: 'Praia do Futuro combina barracas estruturadas com um dia inteiro à beira-mar.',
  Paris: 'Agrupe os bairros por dia: Marais e Île de la Cité funcionam muito bem juntos.',
  Roma: 'Reserve o primeiro horário para Coliseu e Vaticano e deixe as praças para o fim do dia.',
  Lisboa: 'Alfama pede caminhada; Belém funciona melhor como bloco separado do roteiro.',
  Barcelona: 'Combine o modernismo de Gaudí por região para reduzir deslocamentos.',
  Tóquio: 'Monte cada dia por linha de metrô e bairro para evitar cruzar a cidade sem necessidade.',
  'Rio de Janeiro': 'Praia, mirante e bairro próximo no mesmo dia deixam o roteiro mais leve.',
};

const STATUS_PILL: Record<string, { label: string; className: string }> = {
  pending: { label: 'pendente', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  accepted: { label: 'aceita', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  rejected: { label: 'recusada', className: 'bg-muted text-muted-foreground border-border' },
};

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const isFood = (activity: SuggestedActivity) => ['breakfast', 'lunch', 'dinner'].includes(activity.category);
const isBeach = (activity: SuggestedActivity) => activity.styleTags.some((tag) => ['beach', 'praia'].includes(normalize(tag)));
const matchesStyle = (activity: SuggestedActivity, style: string) => {
  if (style === 'all') return true;
  const aliases: Record<string, string[]> = { relaxed: ['relaxed', 'relax', 'relaxation', 'nature'] };
  return (aliases[style] || [style]).some((tag) => activity.styleTags.map(normalize).includes(tag));
};
const categoryOf = (activity: SuggestedActivity) => isFood(activity) ? 'restaurant' : isBeach(activity) ? 'beach' : 'experience';
const brl = (value: number) => value > 0 ? `R$ ${value.toLocaleString('pt-BR')}` : 'Grátis';
const rating = (value: number) => value.toFixed(1).replace('.', ',');
const categoryLabel = (value: string) => CLA_CATEGORIES.find((item) => item.value === value)?.label ?? value;

function curatedCityOf(destination?: string): string | undefined {
  if (!destination) return undefined;
  const target = normalize(destination).split(',')[0];
  return CURATED_CITIES.find((candidate) => target === normalize(candidate));
}

function asTripActivity(activity: SuggestedActivity): TripActivity {
  return {
    id: activity.id,
    time: activity.bestTime || '',
    name: activity.name,
    description: activity.tips.join(' '),
    duration: `${activity.durationHours}h`,
    cost: activity.estimatedCostBRL,
    type: isFood(activity) ? 'food' : 'culture',
    status: 'planned',
  };
}

function cityItinerary(city: string): Destination | undefined {
  const key = normalize(city);
  return destinations.find((destination) => normalize(destination.name) === key);
}

function scoreFor(id: string, google: number, stats: Map<string, ClaStat>) {
  const social = stats.get(id);
  const reactions = (social?.ups ?? 0) + (social?.downs ?? 0);
  return { reactions, ups: social?.ups ?? 0, clan: (social?.ups ?? 0) - (social?.downs ?? 0), google };
}

function sortByVoice<T>(items: T[], getScore: (item: T) => ReturnType<typeof scoreFor>): T[] {
  return [...items].sort((left, right) => {
    const a = getScore(left);
    const b = getScore(right);
    const aVoice = a.reactions >= 5;
    const bVoice = b.reactions >= 5;
    if (aVoice !== bVoice) return aVoice ? -1 : 1;
    if (aVoice && bVoice && a.clan !== b.clan) return b.clan - a.clan;
    return b.google - a.google;
  });
}

const Cla = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [activeTrip, setActiveTrip] = useState<ReturnType<typeof getActiveTrip>>(null);
  const [city, setCity] = useState(CURATED_CITIES[0]);
  const [cityTouched, setCityTouched] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
  const [selectedStyle, setSelectedStyle] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [topOnly, setTopOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const [stats, setStats] = useState<Map<string, ClaStat>>(new Map());
  const [sharedTrips, setSharedTrips] = useState<SharedTripPublic[]>([]);
  const [claLoading, setClaLoading] = useState(true);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<ClaSuggestionPublic[]>([]);
  const [mySugs, setMySugs] = useState<MySuggestion[]>([]);
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [livedHere, setLivedHere] = useState(false);
  const [openShared, setOpenShared] = useState<number | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<SuggestedActivity | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<CuratedHotel | null>(null);
  const [selectedMichelin, setSelectedMichelin] = useState<MichelinRestaurant | null>(null);
  const [selectedItinerary, setSelectedItinerary] = useState<Destination | null>(null);
  const [onlyMichelin, setOnlyMichelin] = useState(false);
  const [clanTips, setClanTips] = useState<ClaTip[]>([]);
  const [tipVotes, setTipVotes] = useState<Map<string, TipVote>>(new Map());
  const [tipDraft, setTipDraft] = useState<TipDraft | null>(null);
  const [tipSheetOpen, setTipSheetOpen] = useState(false);
  const [addTarget, setAddTarget] = useState<AddTarget | null>(null);

  useEffect(() => {
    const loadTrips = () => {
      const trips = listTrips();
      const current = getActiveTrip();
      setActiveTrip(current);
      if (!cityTouched) {
        const next = curatedCityOf(current?.destination) || curatedCityOf(trips.slice(-1)[0]?.destination);
        if (next) setCity(next);
      }
    };
    loadTrips();
    return subscribeTrips(loadTrips);
  }, [cityTouched]);

  const loadCla = useCallback(async () => {
    setClaLoading(true);
    const [nextStats, publicSuggestions, userSuggestions, publicTrips] = await Promise.all([
      claStats(city), suggestionsPublic(city), mySuggestions(), sharedTripsPublic(city),
    ]);
    setStats(nextStats);
    setSuggestions(publicSuggestions);
    setMySugs(userSuggestions);
    setSharedTrips(publicTrips.filter((trip) => normalize(trip.city) === normalize(city)));
    setConfirmed(await myConfirmations(publicSuggestions.map((suggestion) => suggestion.id).filter(Boolean)));
    setLivedHere(await hasLivedCity(city));
    setOpenShared(null);
    setClaLoading(false);
  }, [city]);

  const loadTips = useCallback(async () => {
    const tips = await tipsPublic(city);
    setClanTips(tips);
    setTipVotes(await myTipVotes(tips.map((t) => t.id)));
  }, [city]);

  useEffect(() => { void loadCla(); }, [loadCla]);
  useEffect(() => { void loadTips(); }, [loadTips]);
  useEffect(() => {
    const reload = () => void loadCla();
    window.addEventListener('kinu:cla-suggested', reload);
    return () => window.removeEventListener('kinu:cla-suggested', reload);
  }, [loadCla]);
  useEffect(() => { setVisibleCount(12); }, [city, selectedCategory, selectedStyle, searchQuery, topOnly, onlyMichelin]);
  useEffect(() => { setOnlyMichelin(false); }, [city, selectedCategory]);

  const cityData = useMemo(() => {
    const activities = getDestinationActivities(city);
    const hotels = getCuratedHotels(city) ?? [];
    const michelin = MICHELIN_RESTAURANTS[normalize(city)] ?? [];
    const kinuItinerary = cityItinerary(city);
    return { activities, hotels, michelin, kinuItinerary };
  }, [city]);

  const filtered = useMemo(() => {
    const query = normalize(searchQuery);
    const activityMatch = (activity: SuggestedActivity) => matchesStyle(activity, selectedStyle) && (!query || [activity.name, activity.neighborhood, ...activity.tips].some((value) => normalize(value).includes(query)));
    const hotelMatch = (hotel: CuratedHotel) => selectedStyle === 'all' && (!query || [hotel.name, hotel.zone, hotel.tier, hotel.priceRangeBRL, ...hotel.tips].some((value) => normalize(value).includes(query)));
    const michelinMatch = (restaurant: MichelinRestaurant) => selectedStyle === 'all' && (!query || [restaurant.name, restaurant.cuisine, restaurant.neighborhood || '', restaurant.priceRange].some((value) => normalize(value).includes(query)));
    const itineraryMatch = (itinerary?: Destination) => itinerary && selectedStyle === 'all' && (!query || [itinerary.name, itinerary.country, itinerary.highlight, ...itinerary.tags].some((value) => normalize(value).includes(query)));
    const shared = selectedStyle === 'all' ? sharedTrips.filter((trip) => !query || normalize(trip.title || `Roteiro de ${trip.days} dias em ${trip.city}`).includes(query) || trip.itinerary.some((day) => day.items.some((item) => normalize(item.name).includes(query)))) : [];
    return {
      activities: sortByVoice(cityData.activities.filter(activityMatch), (a) => scoreFor(a.id, a.rating, stats)),
      hotels: sortByVoice(cityData.hotels.filter(hotelMatch), (h) => scoreFor(h.id, h.rating, stats)),
      michelin: cityData.michelin.filter(michelinMatch).sort((a, b) => b.stars - a.stars),
      kinuItinerary: itineraryMatch(cityData.kinuItinerary) ? cityData.kinuItinerary : undefined,
      sharedTrips: shared,
      tips: clanTips.filter((t) => !query || normalize(t.text).includes(query)),
    };
  }, [cityData, searchQuery, selectedStyle, sharedTrips, stats, clanTips]);

  /** Chips de prioridade visíveis: escondidos quando a cidade não tem nenhum lugar. */
  const priorityChips = useMemo(() => PRIORITY_CHIPS.filter((chip) =>
    cityData.activities.some((a) => matchesPriority(a, chip.id)) || (chip.id === 'gastronomy' && cityData.michelin.length > 0)
  ), [cityData]);

  const chips = useMemo(() => [
    { value: 'all', label: 'Todos' },
    { value: 'itinerary', label: 'Roteiros' },
    { value: 'hotel', label: '🏨 Hotéis' },
    ...priorityChips.map((c) => ({ value: c.id, label: c.label })),
    { value: 'tips', label: '🤝 Dicas do clã' },
  ], [priorityChips]);

  const priorityLists = useMemo(() => {
    const out: Record<string, SuggestedActivity[]> = {};
    for (const chip of priorityChips) out[chip.id] = filtered.activities.filter((a) => matchesPriority(a, chip.id));
    return out;
  }, [filtered, priorityChips]);

  const counts: Record<string, number> = useMemo(() => {
    const itineraryCount = (filtered.kinuItinerary ? 1 : 0) + filtered.sharedTrips.length;
    const out: Record<string, number> = {
      all: filtered.activities.length + filtered.hotels.length + filtered.michelin.length + itineraryCount + filtered.tips.length,
      itinerary: itineraryCount,
      hotel: filtered.hotels.length,
      tips: filtered.tips.length,
    };
    for (const [id, list] of Object.entries(priorityLists)) out[id] = list.length;
    // Gastronomia conta o que exibe: com "Só Michelin" a lista é a Michelin.
    if ('gastronomy' in out && onlyMichelin) out.gastronomy = filtered.michelin.length;
    return out;
  }, [filtered, priorityLists, onlyMichelin]);

  const cards = useMemo<CatalogCard[]>(() => {
    const limit = <T,>(items: T[]) => topOnly ? items.slice(0, 5) : items;
    if (selectedCategory === 'itinerary' || selectedCategory === 'tips') return [];
    if (selectedCategory === 'hotel') return limit(filtered.hotels).map((hotel) => ({ kind: 'hotel', hotel }));
    if (selectedCategory === 'gastronomy' && onlyMichelin) return limit(filtered.michelin).map((restaurant) => ({ kind: 'michelin', restaurant }));
    if (selectedCategory !== 'all') return limit(priorityLists[selectedCategory] ?? []).map((activity) => ({ kind: 'activity', activity }));
    const all: CatalogCard[] = [
      ...filtered.activities.map((activity) => ({ kind: 'activity' as const, activity })),
      ...filtered.hotels.map((hotel) => ({ kind: 'hotel' as const, hotel })),
      ...filtered.michelin.map((restaurant) => ({ kind: 'michelin' as const, restaurant })),
    ];
    return topOnly ? all.sort((left, right) => {
      const a = cardSocialScore(left, stats);
      const b = cardSocialScore(right, stats);
      const aVoice = a.reactions >= 5;
      const bVoice = b.reactions >= 5;
      if (aVoice !== bVoice) return aVoice ? -1 : 1;
      if (aVoice && bVoice && a.clan !== b.clan) return b.clan - a.clan;
      return b.google - a.google;
    }).slice(0, 5) : all;
  }, [filtered, priorityLists, selectedCategory, stats, topOnly, onlyMichelin]);

  useEffect(() => { if (!chips.some((c) => c.value === selectedCategory)) setSelectedCategory('all'); }, [chips, selectedCategory]);

  const visibleCards = cards.slice(0, visibleCount);
  const showRoteiros = selectedCategory === 'itinerary' || selectedCategory === 'all';
  const showTips = selectedCategory === 'tips';
  const insight = CITY_INSIGHTS[city];
  const placeNames = useMemo(() => new Map(cityData.activities.map((a) => [a.id, a.name])), [cityData]);
  const placeOptions = useMemo(() => cityData.activities.map((a) => ({ id: a.id, name: a.name })).sort((a, b) => a.name.localeCompare(b.name)), [cityData]);
  const drawerTips = selectedActivity ? clanTips.filter((t) => t.scope === 'place' && t.activity_id === selectedActivity.id) : [];

  const onTipVoted = (tipId: string, vote: TipVote | null, prev: TipVote | null) => {
    setTipVotes((m) => { const n = new Map(m); if (vote) n.set(tipId, vote); else n.delete(tipId); return n; });
    setClanTips((list) => list.map((t) => {
      if (t.id !== tipId) return t;
      const delta = (vote === 'confirm' ? 1 : 0) - (prev === 'confirm' ? 1 : 0);
      return { ...t, confirmations: Math.max(0, t.confirmations + delta), last_confirmed_at: vote === 'confirm' ? new Date().toISOString() : t.last_confirmed_at };
    }));
  };
  const openNewTip = () => { setTipDraft(null); setTipSheetOpen(true); };
  const openChangedTip = (tip: ClaTip) => { setTipDraft({ scope: tip.scope, activityId: tip.activity_id, kind: tip.kind, text: tip.text, supersedesId: tip.id }); setTipSheetOpen(true); };

  const alsoWent = async (id: string) => {
    const ok = await confirmSuggestion(id, city);
    if (!ok) return;
    setConfirmed((previous) => new Set(previous).add(id));
    setSuggestions((previous) => previous.map((suggestion) => suggestion.id === id ? { ...suggestion, confirmations: suggestion.confirmations + 1 } : suggestion));
  };

  if (authLoading) return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 size={32} className="animate-spin text-primary" /></div>;
  if (!user) { navigate('/'); return null; }

  return (
    <div className="min-h-screen bg-background pb-36 lg:pb-24">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-lg">
        <div className="px-4 py-3">
          <div className="mb-3 flex items-center gap-3">
            <img src={kinuLogo} alt="KINU" className="h-8 w-8 object-contain" />
            <div><h1 className="font-['Outfit'] text-xl font-bold text-foreground">Clã 🌿</h1><p className="text-xs text-muted-foreground">A comunidade que viaja junto</p></div>
          </div>
          <Select value={city} onValueChange={(value) => { setCityTouched(true); setCity(value); }}>
            <SelectTrigger className="mb-3 h-9 border-border bg-card text-sm"><SelectValue placeholder="Cidade" /></SelectTrigger>
            <SelectContent>{CURATED_CITIES.map((curatedCity) => <SelectItem key={curatedCity} value={curatedCity}>{curatedCity}</SelectItem>)}</SelectContent>
          </Select>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <Button onClick={() => openClaSuggest({ city })} className="h-11"><MapPinPlus /> Indicar um lugar</Button>
            <Button variant="outline" onClick={() => setSuggestionsOpen(true)} className="h-11"><List /> Ver indicações</Button>
          </div>
          <div className="mb-3 flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar destinos, restaurantes, experiências..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="border-border bg-card pl-10" />
              {searchQuery && <button type="button" aria-label="Limpar busca" onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={16} /></button>}
            </div>
            <Select value={selectedStyle} onValueChange={setSelectedStyle}>
              <SelectTrigger className="h-10 w-[130px] shrink-0 border-border bg-card text-sm"><SelectValue placeholder="Estilo" /></SelectTrigger>
              <SelectContent>{TRAVEL_STYLES.map((style) => <SelectItem key={style.value} value={style.value}>{style.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Categorias do catálogo">
            {CATEGORY_CHIPS.map((chip) => (
              <Button key={chip.value} type="button" size="sm" variant={selectedCategory === chip.value ? 'default' : 'outline'} className="h-8 rounded-full px-3 text-xs" onClick={() => setSelectedCategory(chip.value)}>
                {chip.label} <span className="opacity-70">{counts[chip.value]}</span>
              </Button>
            ))}
            <Button type="button" size="sm" variant={topOnly ? 'default' : 'outline'} className="h-8 rounded-full px-3 text-xs" aria-pressed={topOnly} onClick={() => setTopOnly((current) => !current)}>⭐ Top</Button>
          </div>
          {(selectedCategory !== 'all' || selectedStyle !== 'all' || searchQuery || topOnly) && <button type="button" onClick={() => { setSelectedCategory('all'); setSelectedStyle('all'); setSearchQuery(''); setTopOnly(false); }} className="mt-2 text-xs text-primary hover:underline">Limpar filtros</button>}
        </div>
      </header>

      <main className="space-y-6 px-4 pt-4">
        {insight && <div className="flex items-start gap-2 border-b border-border pb-4"><span>🦅</span><p className="text-xs leading-relaxed text-muted-foreground"><strong className="text-sky-400">Ícaro recomenda para {city}:</strong> {insight}</p></div>}

        {claLoading ? <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div> : (
          <>
            {showRoteiros && (
              <section className="space-y-5">
                <div>
                  <h2 className="mb-3 font-['Outfit'] text-lg font-semibold text-foreground">Roteiros do KINU</h2>
                  {filtered.kinuItinerary ? <ItineraryCard itinerary={filtered.kinuItinerary} city={city} onOpen={() => setSelectedItinerary(filtered.kinuItinerary || null)} /> : <p className="text-sm text-muted-foreground">O KINU ainda não publicou um roteiro completo para {city}.</p>}
                </div>
                <div>
                  <h2 className="mb-3 font-['Outfit'] text-lg font-semibold text-foreground">Roteiros do Clã</h2>
                  {filtered.sharedTrips.length === 0 ? <p className="text-sm text-muted-foreground">Ninguém do clã compartilhou um roteiro de {city} ainda.</p> : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {(topOnly ? filtered.sharedTrips.slice(0, filtered.kinuItinerary ? 4 : 5) : filtered.sharedTrips).map((trip, index) => <SharedTripCard key={trip.id || index} trip={trip} open={openShared === index} onToggle={() => setOpenShared(openShared === index ? null : index)} catalog={cityData.activities} onAdd={setAddTarget} />)}
                    </div>
                  )}
                </div>
              </section>
            )}

            {selectedCategory === 'gastronomy' && (
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" variant={onlyMichelin ? 'default' : 'outline'} className="h-8 rounded-full px-3 text-xs" aria-pressed={onlyMichelin} onClick={() => setOnlyMichelin((v) => !v)}>⭐ Só Michelin</Button>
              </div>
            )}

            {showTips && (
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-['Outfit'] text-lg font-semibold text-foreground">Dicas do clã em {city}</h2>
                  <Button size="sm" onClick={openNewTip}>Deixar uma dica</Button>
                </div>
                {filtered.tips.length === 0 ? <p className="text-sm text-muted-foreground">Ninguém deixou dica de {city} ainda — seja o primeiro.</p> : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {(topOnly ? [...filtered.tips].sort((a, b) => b.confirmations - a.confirmations).slice(0, 5) : filtered.tips).map((tip) => <ClaTipCard key={tip.id} tip={tip} placeName={tip.activity_id ? placeNames.get(tip.activity_id) : undefined} myVote={tipVotes.get(tip.id) ?? null} onVoted={onTipVoted} onChanged={openChangedTip} />)}
                  </div>
                )}
              </section>
            )}

            {selectedCategory === 'gastronomy' && onlyMichelin && filtered.michelin.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">{city} ainda não tem casas com selo Michelin</p> : null}
            {!showTips && selectedCategory !== 'itinerary' && visibleCards.length === 0 && !(selectedCategory === 'gastronomy' && onlyMichelin) ? <p className="py-10 text-center text-sm text-muted-foreground">Nenhum item encontrado em {city}.</p> : null}

            {!showTips && selectedCategory !== 'itinerary' && visibleCards.length > 0 && (
              <section>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {visibleCards.map((card) => <CatalogCardView key={cardKey(card)} card={card} city={city} stats={stats} onActivity={setSelectedActivity} onHotel={setSelectedHotel} onMichelin={setSelectedMichelin} onAdd={setAddTarget} />)}
                </div>
                {visibleCount < cards.length && <div className="mt-6 flex justify-center"><Button variant="outline" onClick={() => setVisibleCount((count) => count + 12)}>Ver mais</Button></div>}
              </section>
            )}
          </>
        )}
      </main>

      <Sheet open={suggestionsOpen} onOpenChange={setSuggestionsOpen}>
        <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-2xl px-4 pb-8">
          <SheetHeader className="mb-5 text-left"><SheetTitle>Indicações do clã em {city}</SheetTitle><SheetDescription>Lugares sinalizados pela comunidade e acompanhados pela curadoria.</SheetDescription></SheetHeader>
          {claLoading ? <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-primary" /></div> : <div className="space-y-6">
            <section className="space-y-2">
              {suggestions.length === 0 ? <p className="text-xs text-muted-foreground">Nenhuma indicação para {city} ainda.</p> : suggestions.map((suggestion) => {
                const pill = STATUS_PILL[suggestion.status] ?? STATUS_PILL.pending;
                const canConfirm = livedHere && suggestion.status === 'pending' && !confirmed.has(suggestion.id);
                return <div key={suggestion.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-medium text-foreground">{suggestion.name}</p><span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${pill.className}`}>{pill.label}</span></div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{categoryLabel(suggestion.category)}{suggestion.neighborhood ? ` · ${suggestion.neighborhood}` : ''}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2"><span className="text-[11px] text-muted-foreground">🤝 {suggestion.confirmations} confirmaram</span>{suggestion.google_status && <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">{suggestion.google_status === 'found' || suggestion.google_status === 'ok' ? 'no Google' : 'sem ficha no Google'}</span>}{confirmed.has(suggestion.id) && <span className="text-[11px] text-emerald-400">✓ você confirmou</span>}{canConfirm && <Button variant="outline" size="sm" className="ml-auto h-7 border-emerald-500/30 text-xs text-emerald-400" onClick={() => void alsoWent(suggestion.id)}>Também fui</Button>}</div>
                </div>;
              })}
            </section>
            <section><h3 className="mb-2 font-semibold text-foreground">Suas indicações</h3>{mySugs.length === 0 ? <p className="text-xs text-muted-foreground">Você ainda não indicou nenhum lugar.</p> : <div className="space-y-2">{mySugs.map((suggestion, index) => { const pill = STATUS_PILL[suggestion.status] ?? STATUS_PILL.pending; return <div key={suggestion.id ?? `${suggestion.city}-${suggestion.name}-${index}`} className="rounded-xl border border-border bg-card px-3 py-2"><div className="flex items-center justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm text-foreground">{suggestion.name}</p><p className="text-[11px] text-muted-foreground">{suggestion.city} · {categoryLabel(suggestion.category)}</p></div><span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${pill.className}`}>{pill.label}</span></div>{suggestion.curator_note && <p className="mt-1 text-[11px] italic text-muted-foreground">KINU: {suggestion.curator_note}</p>}</div>; })}</div>}</section>
          </div>}
        </SheetContent>
      </Sheet>

      <ActivityDetailDrawer activity={selectedActivity ? asTripActivity(selectedActivity) : null} destination={city} open={!!selectedActivity} onClose={() => setSelectedActivity(null)} catalogImageQuery={selectedActivity?.name} onAddToTrip={selectedActivity ? () => { setAddTarget({ kind: 'activity', activity: selectedActivity }); setSelectedActivity(null); } : undefined} />
      <HotelDetailDrawer open={!!selectedHotel} onClose={() => setSelectedHotel(null)} hotel={selectedHotel} city={city} showPhoto onSelect={(hotel) => { setAddTarget({ kind: 'hotel', hotel }); setSelectedHotel(null); }} />
      <MichelinDetailDrawer open={!!selectedMichelin} onClose={() => setSelectedMichelin(null)} restaurant={selectedMichelin} />
      <ItineraryDrawer itinerary={selectedItinerary} onClose={() => setSelectedItinerary(null)} />
      <AddToTripSheet target={addTarget} city={city} onClose={() => setAddTarget(null)} />
      <BottomNav />
    </div>
  );
};

function cardRating(card: CatalogCard): number {
  if (card.kind === 'activity') return card.activity.rating;
  if (card.kind === 'hotel') return card.hotel.rating;
  if (card.kind === 'michelin') return card.restaurant.stars;
  return card.activity.rating;
}

function cardSocialScore(card: CatalogCard, stats: Map<string, ClaStat>) {
  if (card.kind === 'activity') return scoreFor(card.activity.id, card.activity.rating, stats);
  if (card.kind === 'hotel') return scoreFor(card.hotel.id, card.hotel.rating, stats);
  if (card.kind === 'tip') return scoreFor(card.activity.id, card.activity.rating, stats);
  return { reactions: 0, ups: 0, clan: 0, google: cardRating(card) };
}

function cardKey(card: CatalogCard): string {
  if (card.kind === 'activity') return `activity:${card.activity.id}`;
  if (card.kind === 'hotel') return `hotel:${card.hotel.id}`;
  if (card.kind === 'michelin') return `michelin:${card.restaurant.name}`;
  return card.id;
}

function CatalogCardView({ card, city, stats, onActivity, onHotel, onMichelin, onAdd }: { card: CatalogCard; city: string; stats: Map<string, ClaStat>; onActivity: (activity: SuggestedActivity) => void; onHotel: (hotel: CuratedHotel) => void; onMichelin: (restaurant: MichelinRestaurant) => void; onAdd: (target: AddTarget) => void }) {
  if (card.kind === 'activity') {
    const social = scoreFor(card.activity.id, card.activity.rating, stats);
    const cardCategory = categoryOf(card.activity);
    const tone = cardCategory === 'restaurant' ? 'food' : cardCategory === 'beach' ? 'beach' : 'culture';
    return <article className="overflow-hidden rounded-lg border border-border bg-card"><button type="button" onClick={() => onActivity(card.activity)} className="block w-full text-left"><ClaLazyImage name={card.activity.name} city={city} tone={tone} className="aspect-[16/9] overflow-hidden" /><div className="space-y-2 p-4"><h3 className="font-['Outfit'] font-semibold text-foreground">{card.activity.name}</h3><p className="text-xs text-muted-foreground">{card.activity.neighborhood}</p><div className="flex flex-wrap gap-2 text-[11px]"><span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">{cardCategory === 'restaurant' ? 'Restaurante' : cardCategory === 'beach' ? 'Praia' : 'Experiência'}</span><span className="text-muted-foreground">Google {rating(card.activity.rating)}</span>{social.ups > 0 && <span className="text-emerald-400">Clã 👍 {social.ups}</span>}<span className="text-foreground">{brl(card.activity.estimatedCostBRL)}</span></div></div></button><div className="border-t border-border px-4 py-3"><Button variant="ghost" size="sm" className="h-8 px-0 text-xs text-primary" onClick={() => onAdd({ kind: 'activity', activity: card.activity })}>➕ Adicionar à minha viagem</Button></div></article>;
  }
  if (card.kind === 'hotel') {
    const social = scoreFor(card.hotel.id, card.hotel.rating, stats);
    return <article className="overflow-hidden rounded-lg border border-border bg-card"><button type="button" onClick={() => onHotel(card.hotel)} className="block w-full text-left"><ClaLazyImage name={card.hotel.name} city={city} tone="hotel" className="aspect-[16/9] overflow-hidden" /><div className="space-y-2 p-4"><h3 className="font-['Outfit'] font-semibold text-foreground">{card.hotel.name}</h3><p className="text-xs text-muted-foreground">{card.hotel.zone} · {TIER_LABEL[card.hotel.tier] ?? card.hotel.tier}</p><div className="flex flex-wrap gap-2 text-[11px]"><span className="text-muted-foreground">Google {rating(card.hotel.rating)}</span>{social.ups > 0 && <span className="text-emerald-400">Clã 👍 {social.ups}</span>}<span className="text-foreground">{card.hotel.priceRangeBRL}</span></div></div></button><div className="border-t border-border px-4 py-3"><Button variant="ghost" size="sm" className="h-8 px-0 text-xs text-primary" onClick={() => onAdd({ kind: 'hotel', hotel: card.hotel })}>Usar este hotel</Button></div></article>;
  }
  if (card.kind === 'michelin') {
    return <button type="button" onClick={() => onMichelin(card.restaurant)} className="overflow-hidden rounded-lg border border-border bg-card text-left transition-colors hover:border-primary/40"><ClaLazyImage name={card.restaurant.name} city={city} tone="food" className="aspect-[16/9] overflow-hidden" /><div className="space-y-2 p-4"><h3 className="font-['Outfit'] font-semibold text-foreground">{card.restaurant.name}</h3><p className="text-xs text-muted-foreground">{card.restaurant.neighborhood || 'Bairro não informado'} · {card.restaurant.cuisine}</p><div className="flex gap-2 text-[11px] text-amber-400"><span>{'⭐'.repeat(card.restaurant.stars)} Michelin</span><span className="text-muted-foreground">{card.restaurant.priceRange}</span></div></div></button>;
  }
  const social = scoreFor(card.activity.id, card.activity.rating, stats);
  return <article className="overflow-hidden rounded-lg border border-border bg-card"><button type="button" onClick={() => onActivity(card.activity)} className="block w-full text-left"><ClaLazyImage name={card.activity.name} city={city} tone="tip" className="aspect-[16/9] overflow-hidden" /><div className="space-y-2 p-4"><p className="text-xs font-medium text-primary">Dica de {card.activity.name}</p><h3 className="font-['Outfit'] text-sm font-semibold leading-relaxed text-foreground">{card.tip}</h3><p className="text-xs text-muted-foreground">{card.activity.neighborhood}</p><div className="flex gap-2 text-[11px]"><span className="text-muted-foreground">Google {rating(card.activity.rating)}</span>{social.ups > 0 && <span className="text-emerald-400">Clã 👍 {social.ups}</span>}</div></div></button></article>;
}

function ItineraryCard({ itinerary, city, onOpen }: { itinerary: Destination; city: string; onOpen: () => void }) {
  return <button type="button" onClick={onOpen} className="grid w-full overflow-hidden rounded-lg border border-border bg-card text-left md:grid-cols-[220px_1fr]"><ClaLazyImage name={`${city} roteiro`} city={city} className="aspect-[16/9] overflow-hidden md:aspect-auto" /><div className="p-4"><h3 className="font-['Outfit'] font-semibold text-foreground">Roteiro de {itinerary.duration} dias em {city}</h3><p className="mt-1 text-xs text-muted-foreground">{itinerary.highlight}</p><p className="mt-3 text-xs text-primary">Ver roteiro</p></div></button>;
}

function SharedTripCard({ trip, open, onToggle, catalog, onAdd }: { trip: SharedTripPublic; open: boolean; onToggle: () => void; catalog: SuggestedActivity[]; onAdd: (target: AddTarget) => void }) {
  const byId = new Map(catalog.map((activity) => [activity.id, activity]));
  return <article className="rounded-lg border border-border bg-card p-4"><h3 className="font-['Outfit'] font-semibold text-foreground">{trip.title || `Roteiro de ${trip.days} dias em ${trip.city}`}</h3><p className="mt-1 text-xs text-muted-foreground">{trip.days} dias · {trip.travelers} {trip.travelers === 1 ? 'viajante' : 'viajantes'}{trip.children > 0 ? ` · ${trip.children} ${trip.children === 1 ? 'criança' : 'crianças'}` : ''} · {trip.lived_ids.length} lugares vividos</p><Button variant="ghost" size="sm" className="mt-2 h-8 px-0 text-xs text-primary" onClick={onToggle}>{open ? 'Fechar roteiro' : 'Ver roteiro'}</Button>{open && <div className="mt-2 space-y-3 border-t border-border pt-3">{trip.itinerary.map((day) => <div key={day.day}><p className="text-xs font-semibold text-foreground">Dia {day.day}</p>{day.items.map((item) => { const activity = byId.get(item.id); return <div key={`${day.day}-${item.id}`} className="flex items-start justify-between gap-2 py-1"><span className="text-xs text-muted-foreground">{trip.lived_ids.includes(item.id) ? '✓ ' : ''}{item.name}</span>{activity && <button type="button" onClick={() => onAdd({ kind: 'activity', activity })} className="shrink-0 text-[10px] text-primary">➕ Adicionar</button>}</div>; })}</div>)}</div>}</article>;
}

function ItineraryDrawer({ itinerary, onClose }: { itinerary: Destination | null; onClose: () => void }) {
  return <Drawer open={!!itinerary} onOpenChange={(open) => { if (!open) onClose(); }}><DrawerContent className="max-h-[85vh] border-border bg-card"><DrawerHeader><DrawerTitle>{itinerary ? `Roteiro do KINU · ${itinerary.name}` : 'Roteiro do KINU'}</DrawerTitle></DrawerHeader>{itinerary && <div className="space-y-4 overflow-y-auto px-4 pb-6">{itinerary.itinerary.map((day) => <section key={day.day}><h3 className="font-['Outfit'] text-sm font-semibold text-foreground">Dia {day.day} · {day.title}</h3><div className="mt-2 space-y-2">{day.activities.map((activity, index) => <div key={`${day.day}-${activity.time}-${index}`} className="border-l-2 border-primary/30 pl-3"><p className="text-sm text-foreground">{activity.time} · {activity.name}</p><p className="text-xs text-muted-foreground">{activity.description}</p></div>)}</div></section>)}</div>}</DrawerContent></Drawer>;
}

export default Cla;