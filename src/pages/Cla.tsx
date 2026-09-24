/* eslint-disable @typescript-eslint/no-explicit-any -- tipos legados dos cards comunitários restaurados */
// Aba Clã — Comunidade KINU reestruturada com filtros robustos
import { useCallback, useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, Loader2, MapPin, MapPinPlus, Search, Star, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useCommunityActivities, 
  useCommunityItineraries, 
  useCommunityPhotos,
  useCountries,
  useCities 
} from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import { BottomNav } from '@/components/shared/BottomNav';
import { HintBalloon } from '@/components/onboarding/HintBalloon';
import { getActiveTrip, listTrips, subscribeTrips } from '@/lib/tripStore';
import { 
  TopPicksCarousel, 
  ItineraryCard, 
  ActivityCard,
  ActivityDetailModal,
  FilterChips,
  ItineraryDetailModal 
} from '@/components/community';
import kinuLogo from '@/assets/KINU_logo.png';
import { DestinationImage } from '@/components/shared/DestinationImage';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CURATED_CITIES } from '@/lib/curatedCities';
import { getDestinationActivities } from '@/data/destinationActivities';
import { getCuratedHotels, type CuratedHotel } from '@/data/curatedHotels';
import { MICHELIN_RESTAURANTS, type MichelinRestaurant } from '@/lib/michelinData';
import { HotelDetailDrawer } from '@/components/hotel/HotelDetailDrawer';
import { TIER_LABEL, PERSONA_LABEL } from '@/lib/hotelSwap';
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

// Category chips configuration
const CATEGORY_CHIPS = [
  { value: 'all', label: 'Todos', icon: '🌍' },
  { value: 'itinerary', label: 'Roteiros', icon: '📍' },
  { value: 'restaurant', label: 'Restaurantes', icon: '🍜' },
  { value: 'hotel', label: 'Hotéis', icon: '🏨' },
  { value: 'michelin', label: 'Michelin', icon: '⭐' },
  { value: 'experience', label: 'Experiências', icon: '🎭' },
  { value: 'transport', label: 'Praias', icon: '🏖️' },
  { value: 'other', label: 'Dicas', icon: '💡' },
];

// Travel styles
const TRAVEL_STYLES = [
  { value: 'all', label: 'Todos os Estilos' },
  { value: 'cultural', label: '🏛️ Cultura' },
  { value: 'adventure', label: '🧗 Aventura' },
  { value: 'gastronomy', label: '🍜 Gastronomia' },
  { value: 'relaxed', label: '🌴 Relaxamento' },
  { value: 'family', label: '👨‍👩‍👧‍👦 Família' },
];

function getClanInsight(trip: any): string {
  const dest = (trip.destination || '').toLowerCase();
  const interests = trip.travelInterests || [];
  if (dest.includes('bangkok') || dest.includes('phuket')) {
    if (interests.includes('gastronomy')) return 'O Cla avaliou restaurantes na Tailandia. Os mais bem avaliados sao street food — confira!';
    return 'A comunidade tem dicas incriveis sobre templos, mercados e praias na Tailandia. Filtre por pais!';
  }
  if (dest.includes('paris') || dest.includes('roma') || dest.includes('barcelona') || dest.includes('lisboa')) {
    return `Viajantes do Cla compartilharam roteiros detalhados para ${trip.destination}. Veja restaurantes e experiencias avaliadas!`;
  }
  return `Explore o que a comunidade diz sobre ${trip.destination}. Dicas reais de quem ja foi!`;
}

const STATUS_PILL: Record<string, { label: string; className: string }> = {
  pending: { label: 'pendente', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  accepted: { label: 'aceita', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  rejected: { label: 'recusada', className: 'bg-muted text-muted-foreground border-border' },
};

const categoryLabel = (value: string) =>
  CLA_CATEGORIES.find((category) => category.value === value)?.label ?? value;

function curatedCityOf(destination?: string): string | undefined {
  if (!destination) return undefined;
  const normalized = destination.toLowerCase();
  return CURATED_CITIES.find((candidate) => normalized.includes(candidate.toLowerCase()));
}

const Cla = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  
  // Active trip from localStorage
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [myTrips, setMyTrips] = useState<any[]>([]);
  const [city, setCity] = useState(CURATED_CITIES[0]);
  const [cityTouched, setCityTouched] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [stats, setStats] = useState<Map<string, ClaStat>>(new Map());
  const [suggestions, setSuggestions] = useState<ClaSuggestionPublic[]>([]);
  const [mySugs, setMySugs] = useState<MySuggestion[]>([]);
  const [claLoading, setClaLoading] = useState(true);
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [livedHere, setLivedHere] = useState(false);

  useEffect(() => {
    const loadTrips = () => {
      const trips = listTrips();
      setMyTrips(trips.filter((trip) => trip.days && trip.days.length > 0));
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
    const [nextStats, publicSuggestions, userSuggestions] = await Promise.all([
      claStats(city),
      suggestionsPublic(city),
      mySuggestions(),
    ]);
    setStats(nextStats);
    setSuggestions(publicSuggestions);
    setMySugs(userSuggestions);
    setConfirmed(await myConfirmations(publicSuggestions.map((suggestion) => suggestion.id).filter(Boolean)));
    setLivedHere(await hasLivedCity(city));
    setClaLoading(false);
  }, [city]);

  useEffect(() => {
    void loadCla();
  }, [loadCla]);

  useEffect(() => {
    const reload = () => void loadCla();
    window.addEventListener('kinu:cla-suggested', reload);
    return () => window.removeEventListener('kinu:cla-suggested', reload);
  }, [loadCla]);

  const alsoWent = async (id: string) => {
    const ok = await confirmSuggestion(id, city);
    if (!ok) return;
    setConfirmed((previous) => new Set(previous).add(id));
    setSuggestions((previous) => previous.map((suggestion) =>
      suggestion.id === id ? { ...suggestion, confirmations: suggestion.confirmations + 1 } : suggestion
    ));
  };

  // Filters state
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [selectedItinerary, setSelectedItinerary] = useState<any>(null);
  const [selectedHotel, setSelectedHotel] = useState<CuratedHotel | null>(null);

  // Fetch data
  const { data: countries, isLoading: countriesLoading } = useCountries();
  const { data: cities } = useCities(selectedCountry !== 'all' ? selectedCountry : undefined);
  
  const { data: allActivities, isLoading: activitiesLoading } = useCommunityActivities({
    countryId: selectedCountry !== 'all' ? selectedCountry : undefined,
    cityId: selectedCity !== 'all' ? selectedCity : undefined,
    category: selectedCategory !== 'all' && selectedCategory !== 'itinerary'
      ? selectedCategory as 'flight' | 'hotel' | 'experience' | 'restaurant' | 'transport' | 'other' 
      : undefined,
  });

  const { data: itineraries, isLoading: itinerariesLoading } = useCommunityItineraries({
    countryId: selectedCountry !== 'all' ? selectedCountry : undefined,
  });

  // Fetch photos for activities
  const activityIds = useMemo(() => allActivities?.map(a => a.id) || [], [allActivities]);
  const { data: photos } = useCommunityPhotos(activityIds);

  // Group photos by activity
  const photosByActivity = useMemo(() => {
    const map: Record<string, any[]> = {};
    photos?.forEach(photo => {
      if (photo.activity_id) {
        if (!map[photo.activity_id]) map[photo.activity_id] = [];
        map[photo.activity_id].push(photo);
      }
    });
    return map;
  }, [photos]);

  // Filter activities by search and style
  const filteredActivities = useMemo(() => {
    if (!allActivities) return [];
    let result = allActivities;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a => 
        a.title.toLowerCase().includes(query) ||
        a.description?.toLowerCase().includes(query) ||
        a.city?.name_pt?.toLowerCase().includes(query) ||
        a.country?.name_pt?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [allActivities, searchQuery]);

  // Filter itineraries
  const filteredItineraries = useMemo(() => {
    if (!itineraries) return [];
    let result = itineraries;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(i => 
        i.title.toLowerCase().includes(query) ||
        i.description?.toLowerCase().includes(query) ||
        i.destination_city?.name_pt?.toLowerCase().includes(query) ||
        i.destination_country?.name_pt?.toLowerCase().includes(query)
      );
    }
    
    if (selectedStyle !== 'all') {
      result = result.filter(i => i.travel_style === selectedStyle);
    }
    
    return result;
  }, [itineraries, searchQuery, selectedStyle]);

  // Get Top Picks
  const topPicks = useMemo(() => {
    return allActivities?.filter(a => a.is_top_pick) || [];
  }, [allActivities]);

  // Catálogo curado da cidade selecionada: hotéis e Michelin (read-only)
  const cityHotels = useMemo(() => getCuratedHotels(city) ?? [], [city]);
  const cityMichelin = useMemo(
    () => MICHELIN_RESTAURANTS[city.toLowerCase()] ?? [],
    [city]
  );

  const filteredCityHotels = useMemo(() => {
    if (!searchQuery) return cityHotels;
    const query = searchQuery.toLowerCase();
    return cityHotels.filter((hotel) =>
      hotel.name.toLowerCase().includes(query) ||
      hotel.zone.toLowerCase().includes(query) ||
      hotel.tips.some((tip) => tip.toLowerCase().includes(query))
    );
  }, [cityHotels, searchQuery]);

  const filteredCityMichelin = useMemo(() => {
    if (!searchQuery) return cityMichelin;
    const query = searchQuery.toLowerCase();
    return cityMichelin.filter((restaurant) =>
      restaurant.name.toLowerCase().includes(query) ||
      restaurant.cuisine.toLowerCase().includes(query) ||
      restaurant.neighborhood?.toLowerCase().includes(query)
    );
  }, [cityMichelin, searchQuery]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { 
      all: (filteredActivities.length || 0) + (filteredItineraries.length || 0),
      itinerary: filteredItineraries.length || 0,
      hotel: filteredCityHotels.length,
      michelin: filteredCityMichelin.length,
    };
    filteredActivities.forEach(a => {
      if (a.category) {
        counts[a.category] = (counts[a.category] || 0) + 1;
      }
    });
    return counts;
  }, [filteredActivities, filteredItineraries, filteredCityHotels, filteredCityMichelin]);

  const categoryChipsWithCounts = CATEGORY_CHIPS.map(cat => ({
    ...cat,
    count: categoryCounts[cat.value] || 0,
  }));

  // Handle country change
  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    setSelectedCity('all');
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedCountry('all');
    setSelectedCity('all');
    setSelectedCategory('all');
    setSelectedStyle('all');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedCountry !== 'all' || selectedCity !== 'all' || 
    selectedCategory !== 'all' || selectedStyle !== 'all' || searchQuery;

  const rankedCuratedActivities = useMemo(() =>
    getDestinationActivities(city)
      .map((activity) => {
        const social = stats.get(activity.id);
        const reactions = (social?.ups ?? 0) + (social?.downs ?? 0);
        return {
          id: activity.id,
          name: activity.name,
          rating: activity.rating,
          reactions,
          ups: social?.ups ?? 0,
          clanScore: (social?.ups ?? 0) - (social?.downs ?? 0),
        };
      })
      .filter((activity) => typeof activity.rating === 'number' || activity.reactions > 0)
      .sort((a, b) => {
        const aHasVoice = a.reactions >= 5;
        const bHasVoice = b.reactions >= 5;
        if (aHasVoice !== bHasVoice) return aHasVoice ? -1 : 1;
        if (aHasVoice && bHasVoice && b.clanScore !== a.clanScore) return b.clanScore - a.clanScore;
        return (b.rating ?? 0) - (a.rating ?? 0);
      })
      .slice(0, 10),
    [city, stats]
  );

  // Loading state
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

  const isLoading = activitiesLoading || itinerariesLoading;

  // Determine what content to show based on category
  const showItineraries = selectedCategory === 'all' || selectedCategory === 'itinerary';
  const showActivities = selectedCategory === 'all' || selectedCategory !== 'itinerary';

  return (
    <div className="min-h-screen bg-background pb-36 lg:pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <img src={kinuLogo} alt="KINU" className="h-8 w-8 object-contain" />
              <div>
                <h1 className="font-bold text-xl font-['Outfit'] text-foreground">
                  Clã 🌿
                </h1>
                <p className="text-xs text-muted-foreground">
                  A comunidade que viaja junto
                </p>
              </div>
            </div>
          </div>

          <Select
            value={city}
            onValueChange={(value) => {
              setCityTouched(true);
              setCity(value);
            }}
          >
            <SelectTrigger className="mb-3 h-9 border-border bg-card text-sm">
              <SelectValue placeholder="Cidade" />
            </SelectTrigger>
            <SelectContent>
              {CURATED_CITIES.map((curatedCity) => (
                <SelectItem key={curatedCity} value={curatedCity}>{curatedCity}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="mb-3 grid grid-cols-2 gap-2">
            <Button onClick={() => openClaSuggest({ city })} className="h-11">
              <MapPinPlus /> Indicar um lugar
            </Button>
            <Button variant="outline" onClick={() => setSuggestionsOpen(true)} className="h-11">
              <List /> Ver indicações
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar destinos, restaurantes, experiências..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter Dropdowns Row */}
          <div className="flex gap-2 mb-3">
            {/* Country Dropdown */}
            <Select value={selectedCountry} onValueChange={handleCountryChange}>
              <SelectTrigger className="flex-1 bg-card border-border h-9 text-sm">
                <div className="flex items-center gap-1.5">
                  <MapPin size={12} className="text-muted-foreground" />
                  <SelectValue placeholder="País" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🌍 Todos os países</SelectItem>
                {countries?.map((country) => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.name_pt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* City Dropdown - only when country selected */}
            {selectedCountry !== 'all' && cities && cities.length > 0 && (
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="flex-1 bg-card border-border h-9 text-sm">
                  <SelectValue placeholder="Cidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as cidades</SelectItem>
                  {cities.map((city: any) => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name_pt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Style Dropdown */}
            <Select value={selectedStyle} onValueChange={setSelectedStyle}>
              <SelectTrigger className="flex-1 bg-card border-border h-9 text-sm">
                <SelectValue placeholder="Estilo" />
              </SelectTrigger>
              <SelectContent>
                {TRAVEL_STYLES.map((style) => (
                  <SelectItem key={style.value} value={style.value}>
                    {style.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Chips */}
          <FilterChips
            chips={categoryChipsWithCounts}
            selected={selectedCategory}
            onChange={setSelectedCategory}
          />

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-primary hover:underline mt-2"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </header>

      {/* Agent Insight Banner */}
      {activeTrip?.destination && (
        <div className="mx-4 mt-4 p-3 bg-gradient-to-r from-sky-500/10 to-cyan-500/10 border border-sky-500/20 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">🦅</span>
            <span className="text-xs font-semibold text-sky-400 font-['Outfit']">Icaro recomenda para {activeTrip.destination}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {getClanInsight(activeTrip)}
          </p>
        </div>
      )}

      {/* Main Content */}
      <main className="space-y-6">
        <div className="px-4 pt-4">
          <HintBalloon
            area="cla"
            arrow="up"
            text="O Clã reúne roteiros e lugares vividos pela comunidade."
          />
        </div>

        {/* My Shared Itineraries */}
        {myTrips.length > 0 && (
          <section className="px-4 pt-4">
            <h2 className="font-semibold text-lg text-foreground font-['Outfit'] flex items-center gap-2 mb-3">
              📋 Meus Roteiros
            </h2>
            <div className="space-y-3">
              {myTrips.map((trip, i) => (
                <button
                  key={i}
                  onClick={() => navigate('/viagens')}
                  className="w-full bg-card border border-border rounded-xl p-3 text-left hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{trip.emoji || '✈️'}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-foreground font-['Outfit'] truncate">{trip.destination}</h3>
                      <p className="text-[10px] text-muted-foreground">
                        {trip.days?.length || 0} dias · {trip.days?.reduce((s: number, d: any) => s + (d.activities?.length || 0), 0) || 0} atividades
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">Meu roteiro</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const text = `✈️ Confira meu roteiro para ${trip.destination} — ${trip.days?.length || 0} dias de viagem!\nPlanejado com KINU Travel OS 🧭`;
                          if (navigator.share) {
                            navigator.share({ title: `Roteiro: ${trip.destination}`, text });
                          } else {
                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                          }
                        }}
                        className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                      >
                        📤 Compartilhar
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {trip.days?.flatMap((d: any) => d.activities || [])
                      .filter((a: any) => a.category === 'passeio' || a.category === 'comida')
                      .slice(0, 4)
                      .map((a: any, j: number) => (
                        <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {a.name?.replace(/^(Jantar|Almoço|Café):\s*/i, '').substring(0, 25)}
                        </span>
                      ))
                    }
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border">
                    <span className="text-[10px] text-primary font-medium">Ver roteiro completo →</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Top Roteiros Curados — always visible */}
        {!searchQuery && selectedCategory === 'all' && (
          <section className="px-4 pt-4">
            <h2 className="font-semibold text-lg text-foreground font-['Outfit'] flex items-center gap-2 mb-3">
              🏆 Top Roteiros Curados
            </h2>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2" style={{ scrollSnapType: 'x mandatory' }}>
              {[
                { city: 'Paris', country: 'França', emoji: '🇫🇷', image: 'paris+france', days: 7, highlight: 'Louvre, Notre-Dame, Gastronomia' },
                { city: 'Roma', country: 'Itália', emoji: '🇮🇹', image: 'rome+italy', days: 6, highlight: 'Coliseu, Vaticano, Trastevere' },
                { city: 'Tóquio', country: 'Japão', emoji: '🇯🇵', image: 'tokyo+japan', days: 8, highlight: 'Senso-ji, Shibuya, Tsukiji' },
                { city: 'Bangkok', country: 'Tailândia', emoji: '🇹🇭', image: 'bangkok+thailand', days: 6, highlight: 'Grand Palace, Street Food, Templos' },
                { city: 'Lisboa', country: 'Portugal', emoji: '🇵🇹', image: 'lisbon+portugal', days: 5, highlight: 'Belém, Alfama, Pastéis de Nata' },
                { city: 'Barcelona', country: 'Espanha', emoji: '🇪🇸', image: 'barcelona+spain', days: 6, highlight: 'Sagrada Família, La Rambla, Tapas' },
                { city: 'Nova York', country: 'EUA', emoji: '🇺🇸', image: 'new+york+city', days: 7, highlight: 'Central Park, Broadway, SoHo' },
                { city: 'Phuket', country: 'Tailândia', emoji: '🇹🇭', image: 'phuket+thailand', days: 7, highlight: 'Phi Phi, Patong, Old Town' },
                { city: 'Buenos Aires', country: 'Argentina', emoji: '🇦🇷', image: 'buenos+aires', days: 5, highlight: 'San Telmo, La Boca, Parrillas' },
                { city: 'Dubai', country: 'Emirados', emoji: '🇦🇪', image: 'dubai+uae', days: 5, highlight: 'Burj Khalifa, Deserto, Souks' },
              ].map((dest, i) => (
                <button
                  key={i}
                  onClick={() => navigate('/planejar')}
                  className="flex-shrink-0 w-48 bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <div className="relative h-28 overflow-hidden">
                    <DestinationImage query={dest.image} className="w-full h-full object-cover" alt={dest.city || dest.image} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2">
                      <p className="text-white font-semibold text-sm font-['Outfit']">{dest.emoji} {dest.city}</p>
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-[10px] text-muted-foreground">{dest.days} dias · {dest.country}</p>
                    <p className="text-[10px] text-foreground/70 line-clamp-1 mt-0.5">{dest.highlight}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground/60 mt-2 text-center">
              Toque em um destino para planejar seu roteiro
            </p>
          </section>
        )}

        {/* Favoritos da Comunidade — category cards */}
        {!searchQuery && selectedCategory === 'all' && (
          <section className="px-4">
            <h2 className="font-semibold text-lg text-foreground font-['Outfit'] flex items-center gap-2 mb-3">
              ⭐ Favoritos da Comunidade
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: '🍽️', label: 'Gastronomia', count: 47, example: 'Restaurantes avaliados' },
                { icon: '🏛️', label: 'Cultura', count: 32, example: 'Museus e monumentos' },
                { icon: '🏖️', label: 'Praias', count: 28, example: 'Praias paradisíacas' },
                { icon: '🏔️', label: 'Aventura', count: 19, example: 'Trilhas e experiências' },
              ].map((cat, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-3 text-center">
                  <span className="text-2xl">{cat.icon}</span>
                  <p className="text-sm font-semibold text-foreground mt-1 font-['Outfit']">{cat.label}</p>
                  <p className="text-[10px] text-muted-foreground">{cat.count} {cat.example}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : (
          <>
            {!searchQuery && selectedCategory === 'all' && (
              <section className="px-4">
                <div className="mb-3">
                  <h2 className="font-semibold text-lg text-foreground font-['Outfit']">Atividades mais bem avaliadas</h2>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    Ordenado pela nota do Google até o clã ter voz — e o clã já está votando.
                  </p>
                </div>
                {claLoading ? (
                  <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-primary" /></div>
                ) : rankedCuratedActivities.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Ainda não há avaliações para {city}.</p>
                ) : (
                  <div className="space-y-2">
                    {rankedCuratedActivities.map((activity, index) => (
                      <div key={activity.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                        <span className="w-4 text-xs text-muted-foreground">{index + 1}</span>
                        <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{activity.name}</p>
                        <div className="flex shrink-0 items-center gap-2 text-[11px]">
                          {typeof activity.rating === 'number' && activity.rating > 0 && (
                            <span className="text-muted-foreground">Google {activity.rating.toFixed(1).replace('.', ',')}</span>
                          )}
                          {activity.reactions > 0 && (
                            <span className="text-emerald-400">Clã 👍 {activity.ups}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Top Picks Carousel — only show when no search/category filter */}
            {!searchQuery && selectedCategory === 'all' && topPicks.length > 0 && (
              <section className="pt-2">
                <TopPicksCarousel
                  title="🔥 Top Picks da Comunidade"
                  emoji=""
                  items={topPicks.slice(0, 10).map(activity => ({
                    id: activity.id,
                    title: activity.title,
                    subtitle: `${activity.city?.name_pt || ''}, ${activity.country?.name_pt || ''}`,
                    image: photosByActivity[activity.id]?.[0]?.url || getDefaultImage(activity.category),
                    rating: activity.rating_average || undefined,
                  }))}
                  onItemClick={(item) => {
                    const activity = topPicks.find(a => a.id === item.id);
                    if (activity) setSelectedActivity(activity);
                  }}
                />
              </section>
            )}

            {/* Itineraries Section */}
            {showItineraries && filteredItineraries.length > 0 && (
              <section className="px-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-lg text-foreground font-['Outfit'] flex items-center gap-2">
                    📍 Roteiros do Clã
                    <span className="text-xs text-muted-foreground font-normal">({filteredItineraries.length})</span>
                  </h2>
                </div>
                <div className="grid gap-4">
                  {filteredItineraries.slice(0, selectedCategory === 'itinerary' ? 20 : 5).map((itinerary: any) => (
                    <ItineraryCard
                      key={itinerary.id}
                      itinerary={itinerary}
                      onClick={() => setSelectedItinerary(itinerary)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Activities Grid */}
            {showActivities && (
              <section className="px-4">
                {selectedCategory !== 'itinerary' && (
                  <h2 className="font-semibold text-lg text-foreground font-['Outfit'] mb-4 flex items-center gap-2">
                    🎯 {selectedCategory === 'all' ? 'Atividades' : CATEGORY_CHIPS.find(c => c.value === selectedCategory)?.label}
                    <span className="text-xs text-muted-foreground font-normal">({filteredActivities.length})</span>
                  </h2>
                )}
                
                {filteredActivities.length > 0 ? (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.03 },
                      },
                    }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  >
                    {filteredActivities.map((activity: any) => (
                      <motion.div
                        key={activity.id}
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          visible: { opacity: 1, y: 0 },
                        }}
                      >
                        <ActivityCard
                          activity={activity}
                          photo={photosByActivity[activity.id]?.[0]}
                          onClick={() => setSelectedActivity(activity)}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : selectedCategory !== 'itinerary' && !searchQuery && selectedCategory === 'all' ? null : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-2">Nenhuma atividade encontrada</p>
                    <p className="text-sm text-muted-foreground/70">
                      Tente ajustar os filtros ou explore outras categorias
                    </p>
                  </div>
                )}
              </section>
            )}
          </>
        )}

        {/* Community CTA */}
        {!searchQuery && selectedCategory === 'all' && (
          <section className="px-4 pb-6">
            <div className="bg-gradient-to-br from-primary/10 via-emerald-500/5 to-transparent border border-primary/20 rounded-2xl p-6 text-center">
              <span className="text-4xl">🌿</span>
              <h3 className="font-semibold text-lg text-foreground font-['Outfit'] mt-3">
                A sabedoria cresce com você
              </h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-sm mx-auto">
                Cada viagem planejada no KINU enriquece o Clã. 
                Confirme atividades, avalie restaurantes e ajude outros viajantes.
              </p>
              <button
                onClick={() => navigate('/planejar')}
                className="mt-4 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                🧭 Planejar Minha Viagem
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Activity Detail Modal */}
      <ActivityDetailModal
        activity={selectedActivity}
        photos={selectedActivity ? photosByActivity[selectedActivity.id] : []}
        isOpen={!!selectedActivity}
        onClose={() => setSelectedActivity(null)}
        onAddToTrip={() => setSelectedActivity(null)}
      />

      {/* Itinerary Detail Modal */}
      <ItineraryDetailModal
        itinerary={selectedItinerary}
        isOpen={!!selectedItinerary}
        onClose={() => setSelectedItinerary(null)}
        onCopyToTrip={() => setSelectedItinerary(null)}
      />

      <Sheet open={suggestionsOpen} onOpenChange={setSuggestionsOpen}>
        <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-2xl px-4 pb-8">
          <SheetHeader className="mb-5 text-left">
            <SheetTitle>Indicações do clã em {city}</SheetTitle>
            <SheetDescription>Lugares sinalizados pela comunidade e acompanhados pela curadoria.</SheetDescription>
          </SheetHeader>

          {claLoading ? (
            <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-6">
              <section className="space-y-2">
                {suggestions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhuma indicação para {city} ainda.</p>
                ) : suggestions.map((suggestion) => {
                  const pill = STATUS_PILL[suggestion.status] ?? STATUS_PILL.pending;
                  const canConfirm = livedHere && suggestion.status === 'pending' && !confirmed.has(suggestion.id);
                  return (
                    <div key={suggestion.id} className="rounded-xl border border-border bg-card p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-foreground">{suggestion.name}</p>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${pill.className}`}>{pill.label}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {categoryLabel(suggestion.category)}{suggestion.neighborhood ? ` · ${suggestion.neighborhood}` : ''}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">🤝 {suggestion.confirmations} confirmaram</span>
                        {suggestion.google_status && (
                          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                            {suggestion.google_status === 'found' || suggestion.google_status === 'ok' ? 'no Google' : 'sem ficha no Google'}
                          </span>
                        )}
                        {confirmed.has(suggestion.id) && <span className="text-[11px] text-emerald-400">✓ você confirmou</span>}
                        {canConfirm && (
                          <Button variant="outline" size="sm" className="ml-auto h-7 border-emerald-500/30 text-xs text-emerald-400" onClick={() => void alsoWent(suggestion.id)}>
                            Também fui
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </section>

              <section>
                <h3 className="mb-2 font-semibold text-foreground">Suas indicações</h3>
                {mySugs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Você ainda não indicou nenhum lugar.</p>
                ) : (
                  <div className="space-y-2">
                    {mySugs.map((suggestion, index) => {
                      const pill = STATUS_PILL[suggestion.status] ?? STATUS_PILL.pending;
                      return (
                        <div key={suggestion.id ?? `${suggestion.city}-${suggestion.name}-${index}`} className="rounded-xl border border-border bg-card px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm text-foreground">{suggestion.name}</p>
                              <p className="text-[11px] text-muted-foreground">{suggestion.city} · {categoryLabel(suggestion.category)}</p>
                            </div>
                            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${pill.className}`}>{pill.label}</span>
                          </div>
                          {suggestion.curator_note && <p className="mt-1 text-[11px] italic text-muted-foreground">KINU: {suggestion.curator_note}</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

function getDefaultImage(category: string | null): string {
  const defaults: Record<string, string> = {
    restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    hotel: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    experience: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800',
    transport: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
  };
  return defaults[category || ''] || 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800';
}

export default Cla;
