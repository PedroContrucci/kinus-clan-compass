import { useMemo } from 'react';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, AlertTriangle, Wallet, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { allocateBudget, checkBudgetOverflow, getCostCategory } from '@/lib/budget';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BudgetTrackerProps {
  totalBudget: number;
  tripDays: number;
  currentDaySpent: number;
  totalSpent: number;
  currentDate: Date;
  dayNumber: number;
}

export const BudgetTracker = ({
  totalBudget,
  tripDays,
  currentDaySpent,
  totalSpent,
  currentDate,
  dayNumber,
}: BudgetTrackerProps) => {
  const allocation = useMemo(() => allocateBudget(totalBudget, tripDays), [totalBudget, tripDays]);
  const overflow = useMemo(() => checkBudgetOverflow(totalSpent, totalBudget), [totalSpent, totalBudget]);
  
  const dailyBudget = allocation.dailyBudget.total;
  const dailyRemaining = dailyBudget - currentDaySpent;
  const dailyPercentUsed = dailyBudget > 0 ? Math.round((currentDaySpent / dailyBudget) * 100) : 0;
  
  const totalRemaining = totalBudget - totalSpent;
  const totalPercentUsed = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  return (
    <div className="space-y-4 mb-6">
      {/* Daily Budget Card */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Wallet size={18} className="text-primary" />
          <h4 className="font-semibold text-foreground font-['Outfit']">
            💳 Saldo do Dia — {format(currentDate, 'EEE dd/MM')}
          </h4>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Orçamento diário:</span>
            <span className="font-semibold text-foreground font-['Outfit']">
              R$ {dailyBudget.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Gasto até agora:</span>
            <span className="font-medium text-foreground">
              R$ {currentDaySpent.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </span>
          </div>
          
          {/* Daily Progress Bar */}
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-500",
                dailyPercentUsed <= 80 ? "bg-primary" : 
                dailyPercentUsed <= 100 ? "bg-[#eab308]" : "bg-destructive"
              )}
              style={{ width: `${Math.min(dailyPercentUsed, 100)}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <span className={cn(
              "font-semibold font-['Outfit']",
              dailyRemaining >= 0 ? "text-primary" : "text-destructive"
            )}>
              {dailyRemaining >= 0 ? '💚' : '🔴'} Disponível: R$ {dailyRemaining.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </span>
            <span className="text-muted-foreground text-sm">
              ({dailyPercentUsed}%)
            </span>
          </div>
        </div>
        
        {/* Total Trip Summary */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">📊 Viagem Total:</span>
            <span className="font-semibold text-foreground font-['Outfit']">
              R$ {totalSpent.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} / R$ {totalBudget.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} ({totalPercentUsed}%)
            </span>
          </div>
        </div>
      </div>
      
      {/* Budget Overflow Alert */}
      {overflow.isOverBudget && (
        <div 
          className={cn(
            "border rounded-2xl p-4 animate-pulse",
            overflow.severity === 'critical' 
              ? "bg-destructive/10 border-destructive" 
              : "bg-[#eab308]/10 border-[#eab308]"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className={overflow.severity === 'critical' ? "text-destructive" : "text-[#eab308]"} />
            <span className="font-semibold text-foreground font-['Outfit']">
              ⚠️ ORÇAMENTO EXCEDIDO
            </span>
          </div>
          
          <div className="space-y-1 text-sm mb-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">💰 Orçamento Planejado:</span>
              <span className="text-foreground font-medium">R$ {totalBudget.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">📊 Total Atual:</span>
              <span className="text-foreground font-medium">R$ {totalSpent.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">🔴 Excesso:</span>
              <span className="text-destructive font-semibold">
                R$ {overflow.excess.toLocaleString('pt-BR')} (+{overflow.percentage}%)
              </span>
            </div>
          </div>
          
          <p className="text-foreground text-sm italic">
            💡 "Seu desejo excedeu o limite em {overflow.percentage}%. 
            Tudo bem personalizar, mas fica de olho! 
            Quer que eu sugira onde economizar?" 🌿
          </p>
          
          <div className="flex gap-2 mt-3">
            <button className="flex-1 py-2 px-3 bg-primary/20 text-primary rounded-xl text-sm font-medium hover:bg-primary/30 transition-colors">
              Ver Sugestões de Economia
            </button>
            <button className="flex-1 py-2 px-3 bg-muted text-muted-foreground rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors">
              Manter Assim
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Cost Badge component for activity cards
interface CostBadgeProps {
  cost: number;
  dailyBudget: number;
  showDetails?: boolean;
}

export const CostBadge = ({ cost, dailyBudget, showDetails = false }: CostBadgeProps) => {
  const category = getCostCategory(cost, dailyBudget);
  const percentOfDaily = dailyBudget > 0 ? Math.round((cost / dailyBudget) * 100) : 0;
  
  return (
    <div className="flex items-center gap-2">
      <span 
        className={cn(
          "px-2 py-0.5 rounded-full text-xs font-medium",
          category.bgColor
        )}
        style={{ color: category.color }}
      >
        {category.icon} {category.label}
      </span>
      {showDetails && percentOfDaily > 50 && (
        <span className="text-xs text-muted-foreground">
          ({percentOfDaily}% do dia)
        </span>
      )}
    </div>
  );
};

// Budget Allocation Display
interface BudgetAllocationDisplayProps {
  totalBudget: number;
  tripDays: number;
  destination: string;
}

export const BudgetAllocationDisplay = ({ totalBudget, tripDays, destination }: BudgetAllocationDisplayProps) => {
  const allocation = useMemo(() => allocateBudget(totalBudget, tripDays), [totalBudget, tripDays]);
  const experienceDays = Math.max(1, tripDays - 1);
  
  return (
    <div className="bg-card border border-border rounded-2xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">💰</span>
        <h4 className="font-semibold text-foreground font-['Outfit']">
          Alocação de Orçamento — {destination} {tripDays} dias
        </h4>
      </div>
      
      {/* Fixed Costs */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Custos Fixos (60%)</p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">✈️ Voos (35%)</span>
            <span className="text-foreground font-medium font-['Outfit']">
              R$ {allocation.fixedCosts.flights.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">🏨 Hotel (25%)</span>
            <span className="text-foreground font-medium font-['Outfit']">
              R$ {allocation.fixedCosts.accommodation.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>
      
      {/* Variable Costs */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Custos Variáveis (40%)</p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <div className="flex flex-col">
              <span className="text-muted-foreground">🎯 Atividades (16%)</span>
              <span className="text-xs text-muted-foreground">
                → R$ {allocation.dailyBudget.activities.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/dia
              </span>
            </div>
            <span className="text-foreground font-medium font-['Outfit']">
              R$ {allocation.variableCosts.activities.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <div className="flex flex-col">
              <span className="text-muted-foreground">🍽️ Alimentação (14%)</span>
              <span className="text-xs text-muted-foreground">
                → R$ {allocation.dailyBudget.food.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/dia
              </span>
            </div>
            <span className="text-foreground font-medium font-['Outfit']">
              R$ {allocation.variableCosts.food.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <div className="flex flex-col">
              <span className="text-muted-foreground">🚕 Transporte (6%)</span>
              <span className="text-xs text-muted-foreground">
                → R$ {allocation.dailyBudget.transport.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/dia
              </span>
            </div>
            <span className="text-foreground font-medium font-['Outfit']">
              R$ {allocation.variableCosts.transport.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">💚 Reserva (4%)</span>
            <span className="text-foreground font-medium font-['Outfit']">
              R$ {allocation.variableCosts.buffer.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>
      
      {/* Total */}
      <div className="pt-3 border-t border-border">
        <div className="flex justify-between">
          <span className="font-semibold text-foreground">TOTAL ALOCADO:</span>
          <span className="font-bold text-foreground font-['Outfit'] text-lg">
            R$ {allocation.totalAllocated.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BudgetTracker;
