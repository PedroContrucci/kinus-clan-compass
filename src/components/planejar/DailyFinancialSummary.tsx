import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpenseItem {
  icon: string;
  name: string;
  amount: number;
  category: 'attraction' | 'food' | 'transport' | 'accommodation' | 'shopping';
}

interface DailyFinancialSummaryProps {
  date: Date;
  expenses: ExpenseItem[];
  averageDailySpend: number;
  tip?: string;
}

const categoryIcons = {
  attraction: '🏛️',
  food: '🍽️',
  transport: '🚇',
  accommodation: '🏨',
  shopping: '🛍️',
};

export const DailyFinancialSummary = ({
  date,
  expenses,
  averageDailySpend,
  tip,
}: DailyFinancialSummaryProps) => {
  const totalDay = expenses.reduce((sum, e) => sum + e.amount, 0);
  const difference = totalDay - averageDailySpend;
  const percentDiff = averageDailySpend > 0 ? Math.round((difference / averageDailySpend) * 100) : 0;
  
  const getTrendIcon = () => {
    if (difference > 0) return <TrendingUp size={14} className="text-[#eab308]" />;
    if (difference < 0) return <TrendingDown size={14} className="text-primary" />;
    return <Minus size={14} className="text-muted-foreground" />;
  };
  
  const getTrendColor = () => {
    if (difference > 0) return 'text-[#eab308]';
    if (difference < 0) return 'text-primary';
    return 'text-muted-foreground';
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-foreground font-['Outfit'] flex items-center gap-2">
          💰 Resumo — {format(date, 'EEE dd/MM')}
        </h4>
      </div>
      
      {/* Expense List */}
      <div className="space-y-2 mb-4">
        {expenses.map((expense, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>{expense.icon || categoryIcons[expense.category]}</span>
              <span className="truncate max-w-[180px]">{expense.name}</span>
            </div>
            <span className="text-foreground font-medium">
              R$ {expense.amount.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
      
      {/* Divider */}
      <div className="border-t border-border my-3" />
      
      {/* Total */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium text-foreground">Total do dia:</span>
        <span className="text-lg font-bold text-foreground font-['Outfit']">
          R$ {totalDay.toLocaleString()}
        </span>
      </div>
      
      {/* Comparison to Average */}
      <div className="flex items-center gap-2 text-sm">
        {getTrendIcon()}
        <span className="text-muted-foreground">📊 vs Média:</span>
        <span className={cn("font-medium", getTrendColor())}>
          {difference >= 0 ? '+' : ''}R$ {difference.toLocaleString()} 
          {percentDiff !== 0 && ` (${difference >= 0 ? '+' : ''}${percentDiff}%)`}
        </span>
      </div>
      
      {/* Tip */}
      {tip && (
        <div className="mt-3 text-sm text-muted-foreground italic">
          💡 "{tip}"
        </div>
      )}
    </div>
  );
};

export default DailyFinancialSummary;
