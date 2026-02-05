// TripCard — Card de viagem com KPIs inline

import { motion } from 'framer-motion';
import { Calendar, CheckCircle, Wallet, ChevronRight } from 'lucide-react';
import { differenceInDays } from 'date-fns';

interface TripCardProps {
  trip: {
    id: string;
    destination: string;
    emoji: string;
    country: string;
    startDate: string;
    endDate: string;
    budget: number;
    finances: {
      total: number;
      confirmed: number;
    };
    progress: number;
    status: 'draft' | 'active' | 'ongoing' | 'completed';
  };
  onClick: () => void;
}

export const TripCard = ({ trip, onClick }: TripCardProps) => {
  const daysUntil = trip.startDate 
    ? differenceInDays(new Date(trip.startDate), new Date())
    : 0;
  
  const isUrgent = daysUntil > 0 && daysUntil < 7;
  const isPast = daysUntil <= 0;
  
  const budgetPercent = trip.finances 
    ? Math.round((trip.finances.confirmed / trip.finances.total) * 100)
    : 0;

  const getStatusBadge = () => {
    switch (trip.status) {
      case 'draft':
        return { label: 'Rascunho', bg: 'bg-slate-500/20', text: 'text-slate-400' };
      case 'active':
        return { label: 'Planejando', bg: 'bg-sky-500/20', text: 'text-sky-400' };
      case 'ongoing':
        return { label: 'Em Viagem', bg: 'bg-emerald-500/20', text: 'text-emerald-400' };
      case 'completed':
        return { label: 'Concluída', bg: 'bg-violet-500/20', text: 'text-violet-400' };
      default:
        return { label: 'Rascunho', bg: 'bg-slate-500/20', text: 'text-slate-400' };
    }
  };

  const status = getStatusBadge();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className="bg-[#1E293B] border border-[#334155] rounded-2xl p-5 shadow-md hover:border-[#10B981]/30 transition-all cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{trip.emoji}</span>
          <div>
            <h3 className="font-semibold text-lg text-foreground font-['Outfit']">
              {trip.destination}
            </h3>
            <p className="text-sm text-muted-foreground">{trip.country}</p>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
          {status.label}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="flex items-center gap-4 mb-4">
        {/* Countdown */}
        <div className={`flex items-center gap-1.5 ${isUrgent ? 'text-amber-400 animate-pulse' : isPast ? 'text-muted-foreground' : 'text-foreground'}`}>
          <Calendar size={14} />
          <span className="text-sm font-medium">
            {isPast ? 'Partiu!' : `${daysUntil} dias`}
          </span>
        </div>

        {/* Checklist */}
        <div className="flex items-center gap-1.5 text-emerald-400">
          <CheckCircle size={14} />
          <span className="text-sm font-medium">{trip.progress || 0}%</span>
        </div>

        {/* Budget */}
        <div className="flex items-center gap-1.5 text-foreground">
          <Wallet size={14} />
          <span className="text-sm font-medium">
            R${((trip.finances?.confirmed || 0) / 1000).toFixed(1)}k/{(trip.budget / 1000).toFixed(0)}k
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 bg-[#334155] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${budgetPercent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-emerald-500 to-amber-400"
        />
      </div>

      {/* Arrow */}
      <div className="flex justify-end mt-3">
        <ChevronRight size={20} className="text-muted-foreground" />
      </div>
    </motion.div>
  );
};

export default TripCard;
