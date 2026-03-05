// KPIStrip — Horizontal KPI bar with animated count-up numbers

import { Calendar, CheckCircle, Wallet, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCountUp } from '@/hooks/useCountUp';

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

  const animDays = useCountUp(daysLeft, 600);
  const animChecklist = useCountUp(checklistPercent, 500);
  const animPaid = useCountUp(totalBudget > 0 ? Math.round((paidAmount / totalBudget) * 100) : 0, 500);
  const animSaved = useCountUp(savedAmount / 1000, 500);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide"
    >
      {/* Countdown */}
      <div className={`flex-shrink-0 flex flex-col items-center p-3 rounded-xl bg-card border min-w-[70px] ${
        isUrgent ? 'border-amber-500/50' : 'border-border'
      }`}>
        <Calendar size={16} className={isUrgent ? 'text-amber-400 mb-1' : 'text-sky-400 mb-1'} />
        <span className={`text-lg font-bold font-['Outfit'] ${isUrgent ? 'text-amber-400 animate-pulse' : 'text-foreground'}`}>
          {daysLeft > 0 ? Math.round(animDays) : '🛫'}
        </span>
        <span className="text-xs text-muted-foreground">dias</span>
      </div>

      {/* Checklist */}
      <div className="flex-shrink-0 flex flex-col items-center p-3 rounded-xl bg-card border border-border min-w-[70px]">
        <CheckCircle size={16} className="text-emerald-400 mb-1" />
        <span className="text-lg font-bold text-foreground font-['Outfit']">{Math.round(animChecklist)}%</span>
        <span className="text-xs text-muted-foreground">pronto</span>
      </div>

      {/* Financial Health */}
      <div className="flex-shrink-0 flex flex-col items-center p-3 rounded-xl bg-card border border-border min-w-[90px]">
        <Wallet size={16} className="text-emerald-400 mb-1" />
        <span className="text-lg font-bold text-foreground font-['Outfit']">
          {Math.round(animPaid)}%
        </span>
        <span className="text-xs text-muted-foreground">pago</span>
      </div>

      {/* Savings */}
      {savedAmount > 0 && (
        <div className="flex-shrink-0 flex flex-col items-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 min-w-[90px]">
          <TrendingDown size={16} className="text-emerald-400 mb-1" />
          <span className="text-lg font-bold text-emerald-400 font-['Outfit']">
            R${animSaved.toFixed(1)}k
          </span>
          <span className="text-xs text-emerald-400/70">economizado</span>
        </div>
      )}
    </motion.div>
  );
};

export default KPIStrip;
