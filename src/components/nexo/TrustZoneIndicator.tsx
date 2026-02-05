// Componente Visual da Trust Zone (80-100%)

import { motion } from 'framer-motion';
import { NexoBudgetOutput, TRUST_ZONE_MIN, TRUST_ZONE_MAX } from '@/engines/nexo/types';
import { cn } from '@/lib/utils';

interface TrustZoneIndicatorProps {
  data: NexoBudgetOutput;
  compact?: boolean;
}

export const TrustZoneIndicator = ({ data, compact = false }: TrustZoneIndicatorProps) => {
  const { usagePercent, status, trustZone, usedBudget } = data;
  
  // Calcular posição do marcador (0-100 na escala visual)
  // A barra mostra 0% a 120%, com zona ideal entre 80-100%
  const markerPosition = Math.min(Math.max(usagePercent * 100, 0), 120) / 1.2;
  
  // Cores baseadas no status
  const getStatusColor = () => {
    switch (status) {
      case 'IDEAL':
        return 'bg-primary'; // Esmeralda
      case 'SUBOPTIMAL':
        return 'bg-[hsl(var(--kinu-gold))]'; // Ouro
      case 'OVERFLOW':
        return 'bg-destructive'; // Vermelho
      case 'JUSTIFIED':
        return 'bg-[hsl(var(--kinu-gold))]'; // Ouro
      default:
        return 'bg-muted';
    }
  };
  
  const getStatusLabel = () => {
    switch (status) {
      case 'IDEAL':
        return 'Roteiro Otimizado ✓';
      case 'SUBOPTIMAL':
        return 'Pode otimizar mais';
      case 'OVERFLOW':
        return 'Acima do budget';
      case 'JUSTIFIED':
        return 'Ajuste justificado';
      default:
        return '';
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-card rounded-full overflow-hidden relative">
          {/* Zona Ideal Highlight */}
          <div 
            className="absolute h-full bg-primary/20"
            style={{ 
              left: `${(TRUST_ZONE_MIN * 100) / 1.2}%`, 
              width: `${((TRUST_ZONE_MAX - TRUST_ZONE_MIN) * 100) / 1.2}%` 
            }}
          />
          {/* Preenchimento atual */}
          <motion.div
            className={cn("h-full", getStatusColor())}
            initial={{ width: 0 }}
            animate={{ width: `${markerPosition}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {(usagePercent * 100).toFixed(0)}%
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card border border-border rounded-2xl p-5 shadow-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground font-['Outfit']">
          💰 Trust Zone
        </h3>
        <motion.span
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium",
            status === 'IDEAL' && "bg-primary/20 text-primary",
            status === 'SUBOPTIMAL' && "bg-[hsl(var(--kinu-gold))]/20 text-[hsl(var(--kinu-gold))]",
            status === 'OVERFLOW' && "bg-destructive/20 text-destructive",
            status === 'JUSTIFIED' && "bg-[hsl(var(--kinu-gold))]/20 text-[hsl(var(--kinu-gold))]"
          )}
        >
          {getStatusLabel()}
        </motion.span>
      </div>

      {/* Barra Visual */}
      <div className="relative h-4 bg-background rounded-full overflow-hidden mb-3">
        {/* Zona Ideal Background (80-100%) */}
        <div 
          className="absolute h-full bg-gradient-to-r from-primary/30 to-primary/10"
          style={{ 
            left: `${(TRUST_ZONE_MIN * 100) / 1.2}%`, 
            width: `${((TRUST_ZONE_MAX - TRUST_ZONE_MIN) * 100) / 1.2}%` 
          }}
        />
        
        {/* Marcadores de zona */}
        <div 
          className="absolute h-full w-0.5 bg-primary/50"
          style={{ left: `${(TRUST_ZONE_MIN * 100) / 1.2}%` }}
        />
        <div 
          className="absolute h-full w-0.5 bg-destructive/50"
          style={{ left: `${(TRUST_ZONE_MAX * 100) / 1.2}%` }}
        />
        
        {/* Preenchimento animado */}
        <motion.div
          className={cn(
            "h-full rounded-full",
            status === 'IDEAL' && "bg-gradient-to-r from-primary to-accent",
            status === 'SUBOPTIMAL' && "bg-[hsl(var(--kinu-gold))]",
            status === 'OVERFLOW' && "bg-destructive",
            status === 'JUSTIFIED' && "bg-[hsl(var(--kinu-gold))]"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${markerPosition}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        
        {/* Marcador de posição */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-foreground rounded-full border-2 border-background shadow-lg"
          initial={{ left: 0 }}
          animate={{ left: `calc(${markerPosition}% - 6px)` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs text-muted-foreground mb-4">
        <span>0%</span>
        <span className="text-primary font-medium">80%</span>
        <span className="text-primary font-medium">100%</span>
        <span className="text-destructive">120%</span>
      </div>

      {/* Valores */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-2xl font-bold text-foreground font-['Outfit']">
            {(usagePercent * 100).toFixed(0)}%
          </span>
          <span className="text-sm text-muted-foreground ml-2">
            do budget utilizado
          </span>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">
            R$ {usedBudget.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground">
            de R$ {trustZone.max.toLocaleString()}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TrustZoneIndicator;
