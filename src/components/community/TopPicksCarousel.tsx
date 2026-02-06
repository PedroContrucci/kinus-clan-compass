// Top Picks Carousel Component for Clã page
import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Star, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopPickItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  rating?: number;
  count?: number;
}

interface TopPicksCarouselProps {
  title: string;
  emoji: string;
  items: TopPickItem[];
  onItemClick?: (item: TopPickItem) => void;
}

export const TopPicksCarousel = ({ title, emoji, items, onItemClick }: TopPicksCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 280;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <h3 className="font-semibold text-lg text-foreground font-['Outfit']">{title}</h3>
          <span className="text-xs text-muted-foreground">({items.length})</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-full bg-card border border-border hover:bg-accent transition-colors"
          >
            <ChevronLeft size={16} className="text-muted-foreground" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-full bg-card border border-border hover:bg-accent transition-colors"
          >
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide px-4 pb-2"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {items.map((item, index) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onItemClick?.(item)}
            className="flex-shrink-0 w-64 rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 group"
            style={{ scrollSnapAlign: 'start' }}
          >
            {/* Image */}
            <div className="relative h-36 overflow-hidden">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Badge */}
              <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-primary/90 rounded-full">
                <Sparkles size={10} className="text-primary-foreground" />
                <span className="text-[10px] font-medium text-primary-foreground">Top Pick</span>
              </div>

              {/* Rating */}
              {item.rating && (
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full">
                  <Star size={10} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-[10px] font-medium text-white">{item.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-3 text-left">
              <h4 className="font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                {item.title}
              </h4>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin size={10} />
                {item.subtitle}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default TopPicksCarousel;
