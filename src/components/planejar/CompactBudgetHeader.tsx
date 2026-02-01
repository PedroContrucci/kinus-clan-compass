import { cn } from '@/lib/utils';

interface CompactBudgetHeaderProps {
  totalSpent: number;
  totalBudget: number;
  isOverBudget: boolean;
  overflowPercent?: number;
}

export const CompactBudgetHeader = ({
  totalSpent,
  totalBudget,
  isOverBudget,
  overflowPercent = 0,
}: CompactBudgetHeaderProps) => {
  const percentUsed = Math.min(Math.round((totalSpent / totalBudget) * 100), 100);
  const available = totalBudget - totalSpent;

  return (
    <div 
      className={cn(
        "sticky top-16 z-30 bg-card/95 backdrop-blur-md border rounded-xl p-3 mb-4",
        isOverBudget ? "border-[#eab308]" : "border-border"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold font-['Outfit'] text-foreground">
            💰 R$ {totalSpent.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </span>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground font-['Outfit']">
            R$ {totalBudget.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </span>
        </div>
        
        {isOverBudget ? (
          <span className="text-[#eab308] font-semibold text-sm">
            ⚠️ +{overflowPercent}%
          </span>
        ) : (
          <span className="text-primary font-medium text-sm">
            💚 OK
          </span>
        )}
      </div>
      
      {/* Progress Bar */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all duration-500",
            isOverBudget 
              ? "bg-[#eab308]" 
              : percentUsed > 80 
                ? "bg-[#eab308]" 
                : "bg-primary"
          )}
          style={{ width: `${Math.min(percentUsed, 100)}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between mt-2 text-xs">
        <span className="text-muted-foreground">{percentUsed}% utilizado</span>
        {isOverBudget ? (
          <span className="text-[#eab308]">
            Excesso: R$ {Math.abs(available).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} (personalizado por você)
          </span>
        ) : (
          <span className="text-muted-foreground">
            Disponível: R$ {available.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </span>
        )}
      </div>
    </div>
  );
};

export default CompactBudgetHeader;
