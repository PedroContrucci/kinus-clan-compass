// TripCardWithPhoto — Trip card with Unsplash background
import { motion } from 'framer-motion';
import { Calendar, ArrowRight, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';
import { useDestinationPhoto } from '@/hooks/useUnsplash';
import { DashboardWeather } from './DashboardWeather';

interface TripCardWithPhotoProps {
  trip: {
    id: string;
    destination: string;
    emoji: string;
    startDate: string;
    endDate: string;
    budget: number;
    budgetUsed: number;
    progress: number;
    status: string;
  };
  onClick: () => void;
}

export const TripCardWithPhoto = ({ trip, onClick }: TripCardWithPhotoProps) => {
  const { imageUrl, credit, loading, fallbackGradient, fallbackEmoji } = useDestinationPhoto(trip.destination);
  
  const daysUntil = differenceInDays(new Date(trip.startDate), new Date());
  const isUrgent = daysUntil > 0 && daysUntil < 7;
  const budgetPercent = trip.budget > 0 ? Math.round((trip.budgetUsed / trip.budget) * 100) : 0;

  return (
    <motion.button
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full rounded-2xl overflow-hidden text-left hover:shadow-lg transition-all relative group"
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={trip.destination}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className={`w-full h-full ${fallbackGradient}`} />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{trip.emoji}</span>
            <div>
              <h3 className="font-bold text-white font-['Outfit'] drop-shadow-lg">{trip.destination}</h3>
              <p className="text-sm text-white/80 flex items-center gap-1 drop-shadow">
                <Calendar size={12} />
                {format(new Date(trip.startDate), 'dd/MM', { locale: ptBR })} - 
                {format(new Date(trip.endDate), 'dd/MM', { locale: ptBR })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DashboardWeather destination={trip.destination} startDate={trip.startDate} />
            <ArrowRight size={20} className="text-white/80" />
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-3 gap-3">
          {/* Countdown */}
          <div className={`bg-black/40 backdrop-blur-sm rounded-xl p-3 text-center ${isUrgent ? 'ring-2 ring-red-500/50' : ''}`}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock size={14} className={isUrgent ? 'text-red-400' : 'text-white/70'} />
            </div>
            <p className={`text-xl font-bold font-['Outfit'] ${isUrgent ? 'text-red-400' : 'text-white'}`}>
              {daysUntil > 0 ? daysUntil : 0}
            </p>
            <p className="text-[10px] text-white/70">dias restam</p>
          </div>

          {/* Checklist Progress */}
          <div className="bg-black/40 backdrop-blur-sm rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle2 size={14} className="text-emerald-400" />
            </div>
            <p className="text-xl font-bold text-white font-['Outfit']">{trip.progress}%</p>
            <p className="text-[10px] text-white/70">pronto</p>
          </div>

          {/* Budget */}
          <div className="bg-black/40 backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp size={14} className="text-primary" />
            </div>
            <p className="text-sm font-bold text-white font-['Outfit'] text-center">
              R$ {((trip.budgetUsed || 0) / 1000).toFixed(1)}k
            </p>
            <Progress value={budgetPercent} className="h-1.5 mt-1" />
            <p className="text-[10px] text-white/70 text-center mt-1">
              de R$ {((trip.budget || 0) / 1000).toFixed(0)}k
            </p>
          </div>
        </div>

        {/* Photo Credit */}
        {credit && (
          <p className="text-[9px] text-white/40 mt-2 text-right">
            📷 {credit.name} / Unsplash
          </p>
        )}
      </div>
    </motion.button>
  );
};

export default TripCardWithPhoto;
