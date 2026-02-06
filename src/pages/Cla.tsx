// Aba Clã — Comunidade com dados do Supabase

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, Clock, DollarSign, Sparkles, Plus, Loader2, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCommunityActivities, useCountries } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import { BottomNav } from '@/components/shared/BottomNav';
import kinuLogo from '@/assets/KINU_logo.png';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'all', label: 'Todos', icon: '🌍' },
  { value: 'experience', label: 'Experiências', icon: '🎭' },
  { value: 'restaurant', label: 'Gastronomia', icon: '🍜' },
  { value: 'hotel', label: 'Hospedagem', icon: '🏨' },
  { value: 'transport', label: 'Transporte', icon: '🚃' },
];

const Cla = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showTopPicks, setShowTopPicks] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);

  // Fetch data
  const { data: countries, isLoading: countriesLoading } = useCountries();
  const { data: activities, isLoading: activitiesLoading } = useCommunityActivities({
    countryId: selectedCountry !== 'all' ? selectedCountry : undefined,
    category: selectedCategory !== 'all' 
      ? selectedCategory as 'flight' | 'hotel' | 'experience' | 'restaurant' | 'transport' | 'other' 
      : undefined,
    isTopPick: showTopPicks ? true : undefined,
  });

  const handleAddToTrip = (activity: any) => {
    // For now, save to localStorage. Later integrate with trip planning
    const savedActivities = JSON.parse(localStorage.getItem('kinu_saved_activities') || '[]');
    if (!savedActivities.find((a: any) => a.id === activity.id)) {
      savedActivities.push(activity);
      localStorage.setItem('kinu_saved_activities', JSON.stringify(savedActivities));
      toast.success('Adicionado à sua lista!', {
        description: 'Você pode incluir esta atividade no seu próximo roteiro.',
      });
    } else {
      toast.info('Já está na sua lista!');
    }
    setSelectedActivity(null);
  };

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
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <img src={kinuLogo} alt="KINU" className="h-8 w-8 object-contain" />
          <div>
            <h1 className="font-bold text-xl font-['Outfit'] text-foreground">
              Sabedoria do Clã 🌿
            </h1>
            <p className="text-sm text-muted-foreground">
              Dicas reais de viajantes experientes
            </p>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="px-4 py-4 space-y-3 border-b border-border">
        {/* Country Filter */}
        <div className="flex gap-3">
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="flex-1 bg-card border-border">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-muted-foreground" />
                <SelectValue placeholder="Todos os países" />
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

          <button
            onClick={() => setShowTopPicks(!showTopPicks)}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-colors ${
              showTopPicks 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-card border border-border text-foreground'
            }`}
          >
            <Sparkles size={16} />
            <span className="text-sm font-medium">Top Picks</span>
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all text-sm flex items-center gap-2 ${
                selectedCategory === cat.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Activities Grid */}
      <main className="px-4 py-6">
        {activitiesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : activities && activities.length > 0 ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.05 },
              },
            }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {activities.map((activity: any) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onClick={() => setSelectedActivity(activity)}
              />
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
      </main>

      {/* Activity Detail Modal */}
      <Dialog open={!!selectedActivity} onOpenChange={() => setSelectedActivity(null)}>
        <DialogContent className="bg-card border-border max-w-lg">
          {selectedActivity && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    {selectedActivity.is_top_pick && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary rounded-full text-xs mb-2">
                        <Sparkles size={12} />
                        Top Pick
                      </span>
                    )}
                    <DialogTitle className="text-xl font-bold text-foreground">
                      {selectedActivity.title}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedActivity.city?.name_pt}, {selectedActivity.country?.name_pt}
                    </p>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Description */}
                <p className="text-foreground">{selectedActivity.description}</p>

                {/* Details */}
                <div className="grid grid-cols-3 gap-4 py-3 border-y border-border">
                  {selectedActivity.estimated_cost_brl && (
                    <div className="text-center">
                      <DollarSign size={18} className="mx-auto text-primary mb-1" />
                      <p className="text-sm font-medium text-foreground">
                        R$ {selectedActivity.estimated_cost_brl.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-muted-foreground">Custo médio</p>
                    </div>
                  )}
                  {selectedActivity.duration_minutes && (
                    <div className="text-center">
                      <Clock size={18} className="mx-auto text-accent mb-1" />
                      <p className="text-sm font-medium text-foreground">
                        {Math.floor(selectedActivity.duration_minutes / 60)}h
                        {selectedActivity.duration_minutes % 60 > 0 && ` ${selectedActivity.duration_minutes % 60}m`}
                      </p>
                      <p className="text-xs text-muted-foreground">Duração</p>
                    </div>
                  )}
                  {selectedActivity.rating_average && (
                    <div className="text-center">
                      <Star size={18} className="mx-auto text-yellow-500 mb-1 fill-yellow-500" />
                      <p className="text-sm font-medium text-foreground">
                        {selectedActivity.rating_average.toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ({selectedActivity.rating_count || 0} avaliações)
                      </p>
                    </div>
                  )}
                </div>

                {/* Tips */}
                {selectedActivity.tips && selectedActivity.tips.length > 0 && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">💡 Dicas do Clã</h4>
                    <ul className="space-y-2">
                      {selectedActivity.tips.map((tip: string, idx: number) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Best time to visit */}
                {selectedActivity.best_time_to_visit && (
                  <p className="text-sm text-muted-foreground">
                    ⏰ Melhor horário: <span className="text-foreground">{selectedActivity.best_time_to_visit}</span>
                  </p>
                )}

                {/* Action Button */}
                <button
                  onClick={() => handleAddToTrip(selectedActivity)}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors"
                >
                  <Plus size={18} />
                  Adicionar à Viagem
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

// Activity Card Component
const ActivityCard = ({ 
  activity, 
  onClick 
}: { 
  activity: any; 
  onClick: () => void;
}) => (
  <motion.button
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    }}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="bg-card border border-border rounded-2xl p-4 text-left transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
  >
    {/* Header */}
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        {activity.is_top_pick && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/20 text-primary rounded-full text-xs mb-2">
            <Sparkles size={10} />
            Top Pick
          </span>
        )}
        <h3 className="font-semibold text-foreground line-clamp-2">{activity.title}</h3>
      </div>
      {activity.rating_average && (
        <div className="flex items-center gap-1 ml-2">
          <Star size={14} className="text-yellow-500 fill-yellow-500" />
          <span className="text-sm text-foreground">{activity.rating_average.toFixed(1)}</span>
        </div>
      )}
    </div>

    {/* Location */}
    <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
      <MapPin size={12} />
      {activity.city?.name_pt || activity.location_name}, {activity.country?.name_pt}
    </p>

    {/* Description */}
    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
      {activity.description}
    </p>

    {/* Footer */}
    <div className="flex items-center justify-between pt-3 border-t border-border">
      {activity.estimated_cost_brl && (
        <span className="text-sm text-foreground font-medium">
          R$ {activity.estimated_cost_brl.toLocaleString('pt-BR')}
        </span>
      )}
      {activity.cost_level && (
        <span className="text-xs text-muted-foreground capitalize">
          {activity.cost_level}
        </span>
      )}
      {activity.category && (
        <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
          {getCategoryLabel(activity.category)}
        </span>
      )}
    </div>
  </motion.button>
);

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    experience: 'Experiência',
    restaurant: 'Gastronomia',
    hotel: 'Hospedagem',
    transport: 'Transporte',
    flight: 'Voo',
    other: 'Outro',
  };
  return labels[category] || category;
}

export default Cla;
