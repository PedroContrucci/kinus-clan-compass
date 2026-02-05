// Card de Economia via Leilão

import { motion } from 'framer-motion';
import { TrendingDown, Gavel } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuctionSavingsProps {
  totalSaved: number;
  percentSaved: number;
  auctionCount: number;
}

export const AuctionSavings = ({ 
  totalSaved, 
  percentSaved, 
  auctionCount 
}: AuctionSavingsProps) => {
  const hasSavings = totalSaved > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className={cn(
        "bg-card border rounded-2xl p-5 shadow-md transition-colors",
        hasSavings 
          ? "border-primary/30 hover:border-primary/50" 
          : "border-border hover:border-primary/30"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          "p-2 rounded-xl",
          hasSavings ? "bg-primary/20" : "bg-muted"
        )}>
          <Gavel size={20} className={hasSavings ? "text-primary" : "text-muted-foreground"} />
        </div>
        
        {hasSavings && (
          <div className="flex items-center gap-1 text-primary text-xs font-medium">
            <TrendingDown size={14} />
            <span>{percentSaved}%</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        {hasSavings ? (
          <>
            <span className="text-3xl font-bold text-primary font-['Outfit']">
              R$ {totalSaved.toLocaleString()}
            </span>
            <p className="text-sm text-muted-foreground">
              economizado em leilões
            </p>
            <p className="text-xs text-primary/80 mt-2">
              🎉 {auctionCount} {auctionCount === 1 ? 'leilão fechado' : 'leilões fechados'}
            </p>
          </>
        ) : (
          <>
            <span className="text-xl font-medium text-muted-foreground font-['Outfit']">
              R$ 0
            </span>
            <p className="text-sm text-muted-foreground">
              economizado em leilões
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              💡 Ative leilões para economizar
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default AuctionSavings;
