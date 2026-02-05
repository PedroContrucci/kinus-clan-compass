// KPIStrip — Horizontal KPI bar for TripCockpit

import { Calendar, CheckCircle, Wallet, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface KPIStripProps {
  daysLeft: number;
  checklistPercent: number;
  paidAmount: number;
  totalBudget: number;
  savedAmount: number;
}

export const KPIStrip = ({
  daysLeft,
  checklistPercent,
  paidAmount,
  totalBudget,
  savedAmount,
}: KPIStripProps) => {
  const isUrgent = daysLeft > 0 && daysLeft < 7;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide"
    >
      {/* Countdown */}
      <div className={`flex-shrink-0 flex flex-col items-center p-3 rounded-xl bg-[#1E293B] border min-w-[70px] ${
        isUrgent ? 'border-amber-500/50' : 'border-[#334155]'
      }`}>
        <Calendar size={16} className={isUrgent ? 'text-amber-400 mb-1' : 'text-sky-400 mb-1'} />
        <span className={`text-lg font-bold font-['Outfit'] ${isUrgent ? 'text-amber-400 animate-pulse' : 'text-foreground'}`}>
          {daysLeft > 0 ? daysLeft : '🛫'}
        </span>
        <span className="text-xs text-muted-foreground">dias</span>
      </div>

      {/* Checklist */}
      <div className="flex-shrink-0 flex flex-col items-center p-3 rounded-xl bg-[#1E293B] border border-[#334155] min-w-[70px]">
        <CheckCircle size={16} className="text-emerald-400 mb-1" />
        <span className="text-lg font-bold text-foreground font-['Outfit']">{checklistPercent}%</span>
        <span className="text-xs text-muted-foreground">pronto</span>
      </div>

      {/* Financial Health */}
      <div className="flex-shrink-0 flex flex-col items-center p-3 rounded-xl bg-[#1E293B] border border-[#334155] min-w-[90px]">
        <Wallet size={16} className="text-emerald-400 mb-1" />
        <span className="text-lg font-bold text-foreground font-['Outfit']">
          {Math.round((paidAmount / totalBudget) * 100)}%
        </span>
        <span className="text-xs text-muted-foreground">pago</span>
      </div>

      {/* Savings */}
      {savedAmount > 0 && (
        <div className="flex-shrink-0 flex flex-col items-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 min-w-[90px]">
          <TrendingDown size={16} className="text-emerald-400 mb-1" />
          <span className="text-lg font-bold text-emerald-400 font-['Outfit']">
            R${(savedAmount / 1000).toFixed(1)}k
          </span>
          <span className="text-xs text-emerald-400/70">economizado</span>
        </div>
      )}
    </motion.div>
  );
};

export default KPIStrip;
