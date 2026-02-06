// Aba Clã — Comunidade KINU reestruturada
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Filter, MapPin, Search, X } from 'lucide-react';
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
  CategoryTabs 
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
import { ScrollArea } from '@/components/ui/scroll-area';

const CATEGORIES = [
  { value: 'all', label: 'Todos', icon: '🌍' },
  { value: 'restaurant', label: 'Restaurantes', icon: '🍜' },
  { value: 'experience', label: 'Experiências', icon: '🎭' },
  { value: 'hotel', label: 'Hotéis', icon: '🏨' },
  { value: 'transport', label: 'Transporte', icon: '🚃' },
];

const Cla = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  
  // Filters
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Detail modal
  const [selectedActivity, setSelectedActivity] = useState<any>(null);

  // Fetch data
  const { data: countries, isLoading: countriesLoading } = useCountries();
  const { data: cities } = useCities(selectedCountry !== 'all' ? selectedCountry : undefined);
  
  const { data: allActivities, isLoading: activitiesLoading } = useCommunityActivities({
    countryId: selectedCountry !== 'all' ? selectedCountry : undefined,
    cityId: selectedCity !== 'all' ? selectedCity : undefined,
    category: selectedCategory !== 'all' 
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

  // Filter activities
  const filteredActivities = useMemo(() => {
    if (!allActivities) return [];
    if (!searchQuery) return allActivities;
    
    const query = searchQuery.toLowerCase();
    return allActivities.filter(a => 
      a.title.toLowerCase().includes(query) ||
      a.description?.toLowerCase().includes(query) ||
      a.city?.name_pt?.toLowerCase().includes(query) ||
      a.country?.name_pt?.toLowerCase().includes(query)
    );
  }, [allActivities, searchQuery]);

  // Get Top Picks
  const topPicks = useMemo(() => {
    return allActivities?.filter(a => a.is_top_pick) || [];
  }, [allActivities]);

  // Group top picks for carousel sections
  const topPicksByCountry = useMemo(() => {
    const groups: Record<string, any[]> = {};
    topPicks.forEach(activity => {
      const countryName = activity.country?.name_pt || 'Outros';
      if (!groups[countryName]) groups[countryName] = [];
      groups[countryName].push(activity);
    });
    return groups;
  }, [topPicks]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: filteredActivities.length };
    filteredActivities.forEach(a => {
      if (a.category) {
        counts[a.category] = (counts[a.category] || 0) + 1;
      }
    });
    return counts;
  }, [filteredActivities]);

  const categoriesWithCounts = CATEGORIES.map(cat => ({
    ...cat,
    count: categoryCounts[cat.value] || 0,
  }));

  // Get selected country name for display
  const selectedCountryName = countries?.find(c => c.id === selectedCountry)?.name_pt;

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

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
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
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-xl transition-colors ${
                showFilters ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'
              }`}
            >
              <Filter size={18} />
            </button>
          </div>

          {/* Search */}
          <div className="mt-3 relative">
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
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border"
            >
              <div className="px-4 py-3 space-y-3 bg-card/50">
                <div className="flex gap-3">
                  {/* Country Filter */}
                  <Select value={selectedCountry} onValueChange={(v) => { setSelectedCountry(v); setSelectedCity('all'); }}>
                    <SelectTrigger className="flex-1 bg-background border-border">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-muted-foreground" />
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

                  {/* City Filter - only show when country selected */}
                  {selectedCountry !== 'all' && cities && cities.length > 0 && (
                    <Select value={selectedCity} onValueChange={setSelectedCity}>
                      <SelectTrigger className="flex-1 bg-background border-border">
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
                </div>

                {/* Clear Filters */}
                {(selectedCountry !== 'all' || selectedCategory !== 'all') && (
                  <button
                    onClick={() => { setSelectedCountry('all'); setSelectedCity('all'); setSelectedCategory('all'); }}
                    className="text-xs text-primary hover:underline"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Top Picks Carousels */}
            {!searchQuery && topPicks.length > 0 && (
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

            {/* Featured Itineraries */}
            {!searchQuery && itineraries && itineraries.length > 0 && (
              <section className="px-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-lg text-foreground font-['Outfit'] flex items-center gap-2">
                    📍 Roteiros Completos
                    <span className="text-xs text-muted-foreground font-normal">({itineraries.length})</span>
                  </h2>
                </div>
                <div className="grid gap-4">
                  {itineraries.slice(0, 5).map((itinerary: any) => (
                    <ItineraryCard
                      key={itinerary.id}
                      itinerary={itinerary}
                      onClick={() => {
                        // TODO: Navigate to itinerary detail page
                        console.log('Open itinerary:', itinerary.id);
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Category Tabs */}
            <section className="px-4">
              <h2 className="font-semibold text-lg text-foreground font-['Outfit'] mb-3">
                🎯 Atividades por Categoria
              </h2>
              <CategoryTabs
                categories={categoriesWithCounts}
                selected={selectedCategory}
                onChange={setSelectedCategory}
              />
            </section>

            {/* Activities Grid */}
            <section className="px-4">
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
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-2">Nenhuma atividade encontrada</p>
                  <p className="text-sm text-muted-foreground/70">
                    Tente ajustar os filtros ou explore outras categorias
                  </p>
                </div>
              )}
            </section>
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
    transport: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800',
  };
  return defaults[category || ''] || 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800';
}

export default Cla;
