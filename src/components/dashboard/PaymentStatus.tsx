// Card de Status de Pagamentos

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentStatusProps {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  biddingAmount: number;
  paidPercent: number;
}

export const PaymentStatus = ({
  totalAmount,
  paidAmount,
  pendingAmount,
  biddingAmount,
  paidPercent
}: PaymentStatusProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const paidWidth = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
  const biddingWidth = totalAmount > 0 ? (biddingAmount / totalAmount) * 100 : 0;
  const pendingWidth = totalAmount > 0 ? (pendingAmount / totalAmount) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-card border border-border rounded-2xl p-5 shadow-md hover:border-primary/30 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-xl bg-primary/10">
          <Wallet size={20} className="text-primary" />
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-muted rounded-lg transition-colors"
        >
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={16} className="text-muted-foreground" />
          </motion.div>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-3 bg-muted rounded-full overflow-hidden flex mb-3">
        <motion.div
          className="bg-primary h-full"
          initial={{ width: 0 }}
          animate={{ width: `${paidWidth}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        <motion.div
          className="bg-[hsl(var(--kinu-gold))] h-full"
          initial={{ width: 0 }}
          animate={{ width: `${biddingWidth}%` }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        />
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-muted-foreground">
            R$ {paidAmount.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[hsl(var(--kinu-gold))]" />
          <span className="text-muted-foreground">
            R$ {biddingAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Expanded breakdown */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 pt-3 border-t border-border overflow-hidden"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-foreground">Confirmado</span>
                </div>
                <span className="font-medium text-primary">
                  R$ {paidAmount.toLocaleString()}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[hsl(var(--kinu-gold))]" />
                  <span className="text-foreground">Em Leilão</span>
                </div>
                <span className="font-medium text-[hsl(var(--kinu-gold))]">
                  R$ {biddingAmount.toLocaleString()}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                  <span className="text-foreground">Pendente</span>
                </div>
                <span className="font-medium text-muted-foreground">
                  R$ {pendingAmount.toLocaleString()}
                </span>
              </div>

              <div className="pt-2 mt-2 border-t border-border flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Total</span>
                <span className="text-sm font-bold text-foreground font-['Outfit']">
                  R$ {totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PaymentStatus;
