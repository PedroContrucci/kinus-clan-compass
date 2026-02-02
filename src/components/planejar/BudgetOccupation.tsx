// Budget Occupation Visual Component
// Shows how well the budget is being utilized (target: 85-98%)

import { cn } from '@/lib/utils';
import { 
  BUDGET_TARGETS, 
  analyzeBudgetOccupation, 
  type BudgetOccupationResult,
  type QualityTier,
  TIER_DISTRIBUTIONS,
  getOccupationStatus
} from '@/lib/tierSystem';
import { Plane, Hotel, MapPin, Utensils, Wallet, Check, TrendingUp, AlertTriangle } from 'lucide-react';

interface BudgetOccupationProps {
  budget: number;
  costs: {
    flights: number;
    accommodation: number;
    activities: number;
    food: number;
  };
  tier: QualityTier;
  className?: string;
}

const BudgetOccupation = ({ budget, costs, tier, className }: BudgetOccupationProps) => {
  const analysis = analyzeBudgetOccupation(budget, costs);
  const tierDist = TIER_DISTRIBUTIONS[tier];
  const occupationStatus = getOccupationStatus(analysis.occupation);
  
  const getBarColor = () => {
    switch (analysis.status) {
      case 'ideal': return 'bg-gradient-to-r from-primary to-sky-500';
      case 'low': return 'bg-amber-500';
      case 'high': return 'bg-orange-500';
      case 'over': return 'bg-destructive';
    }
  };
  
  const categories = [
    { 
      key: 'flights', 
      label: 'Voos', 
      icon: Plane, 
      cost: analysis.distribution.flights.cost,
      percent: analysis.distribution.flights.percent,
      targetPercent: tierDist.flights.percent,
      description: tierDist.flights.class
    },
    { 
      key: 'accommodation', 
      label: 'Hospedagem', 
      icon: Hotel, 
      cost: analysis.distribution.accommodation.cost,
      percent: analysis.distribution.accommodation.percent,
      targetPercent: tierDist.accommodation.percent,
      description: tierDist.accommodation.stars
    },
    { 
      key: 'activities', 
      label: 'Atividades', 
      icon: MapPin, 
      cost: analysis.distribution.activities.cost,
      percent: analysis.distribution.activities.percent,
      targetPercent: tierDist.activities.percent,
      description: tierDist.activities.description
    },
    { 
      key: 'food', 
      label: 'Alimentação', 
      icon: Utensils, 
      cost: analysis.distribution.food.cost,
      percent: analysis.distribution.food.percent,
      targetPercent: tierDist.food.percent,
      description: tierDist.food.description
    },
    { 
      key: 'buffer', 
      label: 'Folga', 
      icon: Wallet, 
      cost: analysis.distribution.buffer.cost,
      percent: analysis.distribution.buffer.percent,
      targetPercent: tierDist.buffer.percent,
      description: 'Margem de segurança'
    },
  ];

  return (
    <div className={cn('bg-card rounded-2xl border border-border p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground font-['Outfit'] flex items-center gap-2">
          💰 Ocupação do Budget
        </h3>
        <span 
          className="text-sm font-medium px-2 py-1 rounded-lg"
          style={{ 
            color: occupationStatus.statusColor,
            backgroundColor: `${occupationStatus.statusColor}15`
          }}
        >
          {analysis.statusLabel}
        </span>
      </div>
      
      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-muted rounded-xl p-3">
          <span className="text-xs text-muted-foreground block mb-1">Budget</span>
          <span className="text-lg font-bold text-foreground font-['Outfit']">
            R$ {budget.toLocaleString()}
          </span>
        </div>
        <div className="bg-muted rounded-xl p-3">
          <span className="text-xs text-muted-foreground block mb-1">Utilizado</span>
          <span 
            className="text-lg font-bold font-['Outfit']"
            style={{ color: occupationStatus.statusColor }}
          >
            R$ {analysis.totalCost.toLocaleString()} ({analysis.occupationPercent}%)
          </span>
        </div>
      </div>
      
      {/* Occupation Bar with Zone Markers */}
      <div className="mb-4 relative">
        <div className="h-4 bg-muted rounded-full overflow-visible relative">
          {/* Zone markers */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-primary/50 z-10"
            style={{ left: `${BUDGET_TARGETS.minOccupation * 100}%` }}
          />
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-destructive/50 z-10"
            style={{ left: `${BUDGET_TARGETS.maxOccupation * 100}%` }}
          />
          
          {/* Ideal zone background */}
          <div 
            className="absolute h-full bg-primary/10 rounded-r"
            style={{ 
              left: `${BUDGET_TARGETS.minOccupation * 100}%`,
              width: `${(BUDGET_TARGETS.maxOccupation - BUDGET_TARGETS.minOccupation) * 100}%`
            }}
          />
          
          {/* Actual fill */}
          <div 
            className={cn('h-full transition-all duration-500 rounded-full', getBarColor())}
            style={{ width: `${Math.min(analysis.occupation * 100, 100)}%` }}
          />
        </div>
        
        {/* Zone labels */}
        <div className="flex justify-between text-xs mt-1.5">
          <span className="text-muted-foreground">0%</span>
          <span 
            className="text-primary font-medium absolute"
            style={{ left: `${(BUDGET_TARGETS.minOccupation + BUDGET_TARGETS.maxOccupation) / 2 * 100}%`, transform: 'translateX(-50%)' }}
          >
            ↑ ZONA IDEAL
          </span>
          <span className="text-muted-foreground">100%</span>
        </div>
      </div>
      
      {/* Status Message */}
      {analysis.status === 'ideal' && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 mb-4 flex items-center gap-2">
          <Check size={16} className="text-primary" />
          <span className="text-sm text-foreground">
            Sweet Spot! Máximo valor pelo seu budget.
          </span>
        </div>
      )}
      
      {analysis.status === 'low' && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-amber-500" />
          <span className="text-sm text-foreground">
            Você pode adicionar mais experiências! Saldo: R$ {analysis.remaining.toLocaleString()}
          </span>
        </div>
      )}
      
      {analysis.status === 'high' && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 mb-4 flex items-center gap-2">
          <AlertTriangle size={16} className="text-orange-500" />
          <span className="text-sm text-foreground">
            Muito próximo do limite. Considere usar o Leilão Reverso.
          </span>
        </div>
      )}
      
      {/* Distribution Breakdown */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Distribuição
        </h4>
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div key={cat.key} className="flex items-center gap-3">
              <Icon size={16} className="text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground truncate">{cat.label}</span>
                  <span className="text-sm font-medium text-foreground font-['Outfit']">
                    R$ {cat.cost.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.min(cat.percent, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {cat.percent}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Tier Info */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          📋 O que você está recebendo:
        </p>
        <ul className="mt-2 space-y-1 text-sm text-foreground">
          <li>• {tierDist.flights.description}</li>
          <li>• {tierDist.accommodation.description}</li>
          <li>• {tierDist.activities.description}</li>
          <li>• {tierDist.food.description}</li>
        </ul>
      </div>
    </div>
  );
};

export default BudgetOccupation;