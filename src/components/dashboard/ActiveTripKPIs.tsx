// ActiveTripKPIs — Badge strip with key metrics

import { Calendar, CheckCircle, Wallet, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface ActiveTripKPIsProps {
  daysLeft: number;
  checklistPercent: number;
  paidAmount: number;
  totalBudget: number;
  savedAmount?: number;
}

export const ActiveTripKPIs = ({
  daysLeft,
  checklistPercent,
  paidAmount,
  totalBudget,
  savedAmount = 0,
}: ActiveTripKPIsProps) => {
  const isUrgent = daysLeft > 0 && daysLeft < 7;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide"
    >
      {/* Countdown */}
      <div className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1E293B] border ${
        isUrgent ? 'border-amber-500/50' : 'border-[#334155]'
      }`}>
        <Calendar size={16} className={isUrgent ? 'text-amber-400' : 'text-sky-400'} />
        <span className={`text-sm font-medium ${isUrgent ? 'text-amber-400 animate-pulse' : 'text-foreground'}`}>
          {daysLeft > 0 ? `${daysLeft} dias` : 'Partiu!'}
        </span>
      </div>

      {/* Checklist */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1E293B] border border-[#334155]">
        <CheckCircle size={16} className="text-emerald-400" />
        <span className="text-sm font-medium text-foreground">{checklistPercent}% ✓</span>
      </div>

      {/* Financial Health */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1E293B] border border-[#334155]">
        <Wallet size={16} className="text-emerald-400" />
        <span className="text-sm font-medium text-foreground">
          R${(paidAmount / 1000).toFixed(1)}k/{(totalBudget / 1000).toFixed(0)}k
        </span>
      </div>

      {/* Savings */}
      {savedAmount > 0 && (
        <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <TrendingDown size={16} className="text-emerald-400" />
          <span className="text-sm font-medium text-emerald-400">
            R${savedAmount.toLocaleString()} economizados
          </span>
        </div>
      )}
    </motion.div>
  );
};

export default ActiveTripKPIs;
