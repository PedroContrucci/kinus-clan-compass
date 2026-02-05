// CompletedTripStats — Stats for completed trips

import { motion } from 'framer-motion';
import { Globe, Utensils, TrendingDown, Star } from 'lucide-react';

interface CompletedTripStatsProps {
  stats: {
    countriesVisited: number;
    restaurantsCurated: number;
    totalSaved: number;
    highlights: string[];
  };
}

export const CompletedTripStats = ({ stats }: CompletedTripStatsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-[#1E293B] border border-[#334155] rounded-2xl p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <Star className="text-amber-400" size={20} />
        <h3 className="font-semibold text-foreground font-['Outfit']">Conquistas da Viagem</h3>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Globe size={16} className="text-sky-400" />
            <span className="text-2xl font-bold text-foreground font-['Outfit']">
              {stats.countriesVisited}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">países</span>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Utensils size={16} className="text-amber-400" />
            <span className="text-2xl font-bold text-foreground font-['Outfit']">
              {stats.restaurantsCurated}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">restaurantes</span>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingDown size={16} className="text-emerald-400" />
            <span className="text-2xl font-bold text-emerald-400 font-['Outfit']">
              R${(stats.totalSaved / 1000).toFixed(1)}k
            </span>
          </div>
          <span className="text-xs text-muted-foreground">economizados</span>
        </div>
      </div>

      {stats.highlights.length > 0 && (
        <div className="border-t border-[#334155] pt-4">
          <p className="text-sm text-muted-foreground mb-2">Destaques:</p>
          <div className="flex flex-wrap gap-2">
            {stats.highlights.slice(0, 3).map((highlight, idx) => (
              <span
                key={idx}
                className="text-xs bg-[#334155] text-foreground px-2 py-1 rounded-full"
              >
                {highlight}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CompletedTripStats;
