import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface DayOverview {
  dayNumber: number;
  date: Date;
  icon: string;
  title: string;
  totalCost: number;
  isTransit: boolean;
}

interface TripTimelineProps {
  startDate: Date;
  days: DayOverview[];
  totalBudget: number;
  totalSpent: number;
}

export const TripTimeline = ({
  startDate,
  days,
  totalBudget,
  totalSpent,
}: TripTimelineProps) => {
  const remaining = totalBudget - totalSpent;
  const percentUsed = Math.round((totalSpent / totalBudget) * 100);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 mb-6">
      <h3 className="font-semibold text-foreground font-['Outfit'] mb-4 flex items-center gap-2">
        📅 Timeline da Viagem
      </h3>
      
      {/* Days Grid */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {days.map((day) => (
          <div
            key={day.dayNumber}
            className={cn(
              "flex-shrink-0 flex flex-col items-center p-2 rounded-xl min-w-[60px]",
              day.isTransit ? "bg-muted/50" : "bg-muted/30"
            )}
          >
            <span className="text-xs text-muted-foreground mb-1">
              {format(day.date, 'EEE')}
            </span>
            <span className="text-sm font-medium text-foreground mb-1">
              {format(day.date, 'dd')}
            </span>
            <span className="text-lg mb-1">{day.icon}</span>
            <span className="text-[10px] text-muted-foreground truncate max-w-[50px]">
              {day.title}
            </span>
            <span className="text-[10px] text-foreground font-medium mt-1">
              R${(day.totalCost / 1000).toFixed(1)}k
            </span>
          </div>
        ))}
      </div>
      
      {/* Total Summary */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Total estimado:</span>
          <span className="font-bold text-foreground font-['Outfit']">
            R$ {totalSpent.toLocaleString()} / R$ {totalBudget.toLocaleString()}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-500",
              percentUsed <= 80 ? "bg-primary" : 
              percentUsed <= 95 ? "bg-[#eab308]" : "bg-destructive"
            )}
            style={{ width: `${Math.min(percentUsed, 100)}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between mt-2 text-sm">
          <span className={cn(
            "font-medium",
            remaining >= 0 ? "text-primary" : "text-destructive"
          )}>
            {remaining >= 0 ? '💚' : '🔴'} Folga: R$ {remaining.toLocaleString()}
          </span>
          <span className="text-muted-foreground">
            ({percentUsed}%)
          </span>
        </div>
      </div>
    </div>
  );
};

export default TripTimeline;
