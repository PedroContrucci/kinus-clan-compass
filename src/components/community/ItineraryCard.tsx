// Itinerary Card Component for complete trip itineraries
import { Calendar, DollarSign, Heart, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDestinationPhoto } from '@/hooks/useUnsplash';

interface ItineraryCardProps {
  itinerary: {
    id: string;
    title: string;
    description: string | null;
    cover_image_url: string | null;
    duration_days: number | null;
    estimated_budget_brl: number | null;
    likes_count: number | null;
    copies_count: number | null;
    views_count: number | null;
    travel_style: string | null;
    tags: string[] | null;
    destination_city?: { name_pt: string } | null;
    destination_country?: { name_pt: string } | null;
  };
  onClick?: () => void;
}

const styleLabels: Record<string, { label: string; emoji: string }> = {
  cultural: { label: 'Cultural', emoji: '🏛️' },
  adventure: { label: 'Aventura', emoji: '🧗' },
  relaxed: { label: 'Relaxado', emoji: '🌴' },
  romantic: { label: 'Romântico', emoji: '💕' },
  family: { label: 'Família', emoji: '👨‍👩‍👧‍👦' },
};

export const ItineraryCard = ({ itinerary, onClick }: ItineraryCardProps) => {
  // Use Unsplash for dynamic photos
  const destination = itinerary.destination_city?.name_pt || itinerary.destination_country?.name_pt || 'travel';
  const { imageUrl, credit, fallbackGradient, fallbackEmoji } = useDestinationPhoto(destination);
  const finalImageUrl = itinerary.cover_image_url || imageUrl;

  const style = itinerary.travel_style ? styleLabels[itinerary.travel_style] : null;

  return (
    <motion.button
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-primary/10 text-left group"
    >
      {/* Cover Image with Unsplash or Fallback */}
      <div className="relative h-48 overflow-hidden">
        {finalImageUrl ? (
          <img
            src={finalImageUrl}
            alt={itinerary.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${fallbackGradient}`}>
            <span className="text-5xl opacity-60">{fallbackEmoji}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Travel Style Badge */}
        {style && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-full">
            <span>{style.emoji}</span>
            <span className="text-xs font-medium text-white">{style.label}</span>
          </div>
        )}

        {/* Duration Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-primary/90 rounded-full">
          <Calendar size={12} className="text-primary-foreground" />
          <span className="text-xs font-medium text-primary-foreground">
            {itinerary.duration_days} dias
          </span>
        </div>

        {/* Title on Image */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="font-bold text-lg text-white line-clamp-2 font-['Outfit']">
            {itinerary.title}
          </h3>
          {(itinerary.destination_city || itinerary.destination_country) && (
            <p className="text-sm text-white/80 mt-1">
              {itinerary.destination_city?.name_pt}
              {itinerary.destination_city && itinerary.destination_country && ', '}
              {itinerary.destination_country?.name_pt}
            </p>
          )}
        </div>

        {/* Unsplash Credit */}
        {credit && !itinerary.cover_image_url && (
          <a
            href={credit.photoLink}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-1 right-3 text-[8px] text-white/50 hover:text-white/80"
          >
            📷 {credit.name}
          </a>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {itinerary.description || 'Descubra este roteiro incrível da comunidade KINU.'}
        </p>

        {/* Tags */}
        {itinerary.tags && itinerary.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {itinerary.tags.slice(0, 4).map((tag, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          {/* Budget */}
          {itinerary.estimated_budget_brl && (
            <div className="flex items-center gap-1.5">
              <DollarSign size={14} className="text-primary" />
              <span className="text-sm font-semibold text-foreground font-['Outfit']">
                R$ {itinerary.estimated_budget_brl.toLocaleString('pt-BR')}
              </span>
            </div>
          )}

          {/* Social Stats */}
          <div className="flex items-center gap-3">
            {itinerary.likes_count != null && itinerary.likes_count > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Heart size={12} className="text-destructive" />
                <span className="text-xs">{itinerary.likes_count}</span>
              </div>
            )}
            {itinerary.copies_count != null && itinerary.copies_count > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Copy size={12} />
                <span className="text-xs">{itinerary.copies_count}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
};

export default ItineraryCard;
