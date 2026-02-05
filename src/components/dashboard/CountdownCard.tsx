// Card de Countdown para Viagem

import { motion } from 'framer-motion';
import { Plane } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountdownCardProps {
  daysLeft: number;
  isUrgent: boolean;
  isPast: boolean;
}

export const CountdownCard = ({ daysLeft, isUrgent, isPast }: CountdownCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "bg-card border rounded-2xl p-5 shadow-md",
        isUrgent && !isPast && "border-[hsl(var(--kinu-gold))] animate-pulse",
        isPast && "border-primary",
        !isUrgent && !isPast && "border-border hover:border-primary/30"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          "p-2 rounded-xl",
          isUrgent && !isPast && "bg-[hsl(var(--kinu-gold))]/20",
          isPast && "bg-primary/20",
          !isUrgent && !isPast && "bg-primary/10"
        )}>
          <Plane size={20} className={cn(
            isUrgent && !isPast && "text-[hsl(var(--kinu-gold))]",
            isPast && "text-primary",
            !isUrgent && !isPast && "text-primary"
          )} />
        </div>
      </div>

      <div className="space-y-1">
        <span className={cn(
          "text-4xl font-bold font-['Outfit']",
          isUrgent && !isPast && "text-[hsl(var(--kinu-gold))]",
          isPast && "text-primary",
          !isUrgent && !isPast && "text-foreground"
        )}>
          {isPast ? '🎉' : daysLeft}
        </span>
        
        <p className="text-sm text-muted-foreground">
          {isPast 
            ? 'Em viagem!' 
            : daysLeft === 0 
              ? 'Hoje é o dia!' 
              : daysLeft === 1 
                ? 'dia para decolar' 
                : 'dias para decolar'}
        </p>

        {isUrgent && !isPast && (
          <p className="text-xs text-[hsl(var(--kinu-gold))] font-medium mt-2">
            ⚡ Menos de uma semana!
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default CountdownCard;
