// Card Expansível de Insight do Consultor

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { ConsultorInsight } from '@/engines/nexo/types';
import { cn } from '@/lib/utils';

interface ConsultorInsightCardProps {
  insight: ConsultorInsight;
  defaultExpanded?: boolean;
}

export const ConsultorInsightCard = ({ 
  insight, 
  defaultExpanded = false 
}: ConsultorInsightCardProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  const getSeverityConfig = () => {
    switch (insight.severity) {
      case 'critical':
        return {
          icon: AlertCircle,
          bgColor: 'bg-destructive/10',
          borderColor: 'border-destructive/30 hover:border-destructive/50',
          iconColor: 'text-destructive',
          headerBg: 'bg-destructive/5'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-[hsl(var(--kinu-gold))]/10',
          borderColor: 'border-[hsl(var(--kinu-gold))]/30 hover:border-[hsl(var(--kinu-gold))]/50',
          iconColor: 'text-[hsl(var(--kinu-gold))]',
          headerBg: 'bg-[hsl(var(--kinu-gold))]/5'
        };
      case 'info':
      default:
        return {
          icon: Info,
          bgColor: 'bg-primary/10',
          borderColor: 'border-primary/30 hover:border-primary/50',
          iconColor: 'text-primary',
          headerBg: 'bg-primary/5'
        };
    }
  };
  
  const config = getSeverityConfig();
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className={cn(
        "bg-card border rounded-2xl overflow-hidden shadow-md transition-colors",
        config.borderColor
      )}
    >
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center gap-3 p-4 text-left transition-colors",
          config.headerBg
        )}
      >
        <div className={cn("p-2 rounded-xl", config.bgColor)}>
          <Icon size={20} className={config.iconColor} />
        </div>
        
        <div className="flex-1">
          <h4 className="font-semibold text-foreground font-['Outfit']">
            {insight.title}
          </h4>
        </div>
        
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={20} className="text-muted-foreground" />
        </motion.div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Reason */}
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Por quê?
                </span>
                <p className="text-sm text-foreground mt-1">
                  {insight.reason}
                </p>
              </div>
              
              {/* Suggestion */}
              <div className={cn("p-3 rounded-xl", config.bgColor)}>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  💡 Sugestão
                </span>
                <p className="text-sm text-foreground mt-1 font-medium">
                  {insight.suggestion}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ConsultorInsightCard;
