// Enhanced Activity Card Component with photos
import { Star, MapPin, Clock, DollarSign, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface ActivityCardProps {
  activity: {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    estimated_cost_brl: number | null;
    cost_level: string | null;
    rating_average: number | null;
    rating_count: number | null;
    duration_minutes: number | null;
    is_top_pick: boolean | null;
    best_time_to_visit: string | null;
    tips: string[] | null;
    city?: { name_pt: string } | null;
    country?: { name_pt: string } | null;
  };
  photo?: {
    url: string;
    thumbnail_url: string | null;
    caption: string | null;
  } | null;
  onClick?: () => void;
  variant?: 'default' | 'compact';
}

const categoryEmojis: Record<string, string> = {
  restaurant: '🍜',
  hotel: '🏨',
  experience: '🎭',
  transport: '🚃',
  flight: '✈️',
  other: '📍',
};

const defaultImages: Record<string, string> = {
  restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
  hotel: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
  experience: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800',
  transport: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800',
  default: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800',
};

export const ActivityCard = ({ activity, photo, onClick, variant = 'default' }: ActivityCardProps) => {
  const imageUrl = photo?.url || defaultImages[activity.category || 'default'] || defaultImages.default;
  const emoji = categoryEmojis[activity.category || 'other'] || '📍';

  if (variant === 'compact') {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:border-primary/30 transition-all text-left w-full"
      >
        {/* Mini Image */}
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
          <img src={imageUrl} alt={activity.title} className="w-full h-full object-cover" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {activity.is_top_pick && (
              <Sparkles size={12} className="text-primary flex-shrink-0" />
            )}
            <h4 className="font-medium text-foreground text-sm line-clamp-1">{activity.title}</h4>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {activity.city?.name_pt}, {activity.country?.name_pt}
          </p>
        </div>

        {/* Rating */}
        {activity.rating_average && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <Star size={12} className="text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-medium text-foreground">{activity.rating_average.toFixed(1)}</span>
          </div>
        )}
      </motion.button>
    );
  }

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 text-left w-full group"
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={imageUrl}
          alt={activity.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Top badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          {activity.is_top_pick ? (
            <div className="flex items-center gap-1 px-2 py-1 bg-primary/90 rounded-full">
              <Sparkles size={10} className="text-primary-foreground" />
              <span className="text-[10px] font-medium text-primary-foreground">Top Pick</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full">
              <span>{emoji}</span>
              <span className="text-[10px] font-medium text-white capitalize">
                {getCategoryLabel(activity.category || '')}
              </span>
            </div>
          )}

          {activity.rating_average && (
            <div className="flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full">
              <Star size={10} className="text-yellow-400 fill-yellow-400" />
              <span className="text-[10px] font-medium text-white">{activity.rating_average.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Cost badge */}
        {activity.estimated_cost_brl && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full">
            <span className="text-xs font-medium text-white">
              R$ {activity.estimated_cost_brl.toLocaleString('pt-BR')}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h4 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {activity.title}
        </h4>

        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin size={10} />
          {activity.city?.name_pt || 'Local'}, {activity.country?.name_pt}
        </p>

        {activity.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {activity.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          {activity.duration_minutes && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock size={10} />
              {formatDuration(activity.duration_minutes)}
            </div>
          )}

          {activity.cost_level && (
            <span className="text-xs text-muted-foreground capitalize">
              {getCostLabel(activity.cost_level)}
            </span>
          )}

          {activity.tips && activity.tips.length > 0 && (
            <span className="text-xs text-primary">
              💡 {activity.tips.length} dica{activity.tips.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
};

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

function getCostLabel(level: string): string {
  const labels: Record<string, string> = {
    budget: '💵 Econômico',
    moderate: '💵💵 Moderado',
    expensive: '💵💵💵 Caro',
    luxury: '💎 Luxo',
  };
  return labels[level] || level;
}

function formatDuration(minutes: number): string {
  if (minutes >= 1440) {
    const days = Math.floor(minutes / 1440);
    return `${days} dia${days > 1 ? 's' : ''}`;
  }
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}m` : `${hours}h`;
  }
  return `${minutes}min`;
}

export default ActivityCard;
