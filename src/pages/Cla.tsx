// Aba Clã — Comunidade KINU reestruturada com filtros robustos
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, MapPin, Search, X, Sparkles } from 'lucide-react';
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
import { 
  TopPicksCarousel, 
  ItineraryCard, 
  ActivityCard, 
  ActivityDetailModal,
  FilterChips,
  ItineraryDetailModal 
} from '@/components/community';
import kinuLogo from '@/assets/KINU_logo.png';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

// Category chips configuration
const CATEGORY_CHIPS = [
  { value: 'all', label: 'Todos', icon: '🌍' },
  { value: 'itinerary', label: 'Roteiros', icon: '📍' },
  { value: 'restaurant', label: 'Restaurantes', icon: '🍜' },
  { value: 'hotel', label: 'Hotéis', icon: '🏨' },
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

const Cla = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  
  // Active trip from localStorage
  const [activeTrip, setActiveTrip] = useState<any>(null);

  useEffect(() => {
    try {
      const trips = JSON.parse(localStorage.getItem('kinu_trips') || '[]');
      const upcoming = trips.filter((t: any) => t.status === 'active' && t.startDate && new Date(t.startDate) > new Date());
      if (upcoming.length > 0) setActiveTrip(upcoming[0]);
      else if (trips.length > 0) setActiveTrip(trips[trips.length - 1]);
    } catch { /* ignore */ }
  }, []);

  // Filters state
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [selectedItinerary, setSelectedItinerary] = useState<any>(null);

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

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { 
      all: (filteredActivities.length || 0) + (filteredItineraries.length || 0),
      itinerary: filteredItineraries.length || 0,
    };
    filteredActivities.forEach(a => {
      if (a.category) {
        counts[a.category] = (counts[a.category] || 0) + 1;
      }
    });
    return counts;
  }, [filteredActivities, filteredItineraries]);

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
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <img src={kinuLogo} alt="KINU" className="h-8 w-8 object-contain" />
              <div>
                <h1 className="font-bold text-xl font-['Outfit'] text-foreground">
                  Sabedoria do Clã 🌿
                </h1>
                <p className="text-xs text-muted-foreground">
                  Dicas reais de viajantes experientes
                </p>
              </div>
            </div>
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
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Top Picks Carousel — only show when no search/category filter */}
            {!searchQuery && selectedCategory === 'all' && topPicks.length > 0 && (
              <section className="pt-6">
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
                    📍 Roteiros Completos
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
                ) : selectedCategory !== 'itinerary' && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-2">Nenhuma atividade encontrada</p>
                    <p className="text-sm text-muted-foreground/70">
                      Tente ajustar os filtros ou explore outras categorias
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Empty state when both are empty */}
            {filteredActivities.length === 0 && filteredItineraries.length === 0 && !isLoading && (
              <div className="text-center py-20 px-4">
                <Sparkles size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground mb-2">Nenhum resultado encontrado</p>
                <p className="text-sm text-muted-foreground/70">
                  Tente ajustar os filtros ou explore outras categorias
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 text-primary hover:underline text-sm"
                  >
                    Limpar todos os filtros
                  </button>
                )}
              </div>
            )}
          </>
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
