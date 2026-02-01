import { format, addDays, isWeekend } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Brain, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DayInfo {
  dayNumber: number;
  displayNumber: number; // The number shown to user (0 for transit, 1+ for experience days)
  date: Date;
  dateFormatted: string;
  shortDay: string;
  dayOfWeek: string;
  isWeekend: boolean;
  isJetLagDay: boolean;
  isTransitDay: boolean;
  icon: string;
  title: string;
}

interface DayNavigatorProps {
  startDate: Date;
  totalDays: number;
  selectedDay: number;
  onDayChange: (day: number) => void;
  jetLagModeEnabled: boolean;
  icons: string[];
  titles: string[];
  hasTransitDay?: boolean; // If true, first day is transit (departure day)
}

export const generateDayCards = (
  startDate: Date,
  totalDays: number,
  jetLagModeEnabled: boolean,
  icons: string[],
  titles: string[],
  hasTransitDay: boolean = true
): DayInfo[] => {
  const days: DayInfo[] = [];
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const fullDayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  
  for (let i = 0; i < totalDays; i++) {
    const date = addDays(startDate, i);
    const isTransit = hasTransitDay && i === 0;
    
    // Display number: transit day shows as "Partida", day 1 is the first experience day
    const displayNumber = hasTransitDay ? i : i + 1;
    
    days.push({
      dayNumber: i + 1, // Internal index (1-based)
      displayNumber,
      date,
      dateFormatted: `${dayNames[date.getDay()]} ${format(date, 'dd/MM')}`,
      shortDay: dayNames[date.getDay()],
      dayOfWeek: fullDayNames[date.getDay()],
      isWeekend: isWeekend(date),
      isJetLagDay: jetLagModeEnabled && !isTransit && displayNumber === 1, // Day 1 (first experience day) gets jet lag mode
      isTransitDay: isTransit,
      icon: isTransit ? '✈️' : (icons[hasTransitDay ? i - 1 : i] || '📍'),
      title: isTransit ? 'Partida' : (titles[hasTransitDay ? i - 1 : i] || `Dia ${displayNumber}`),
    });
  }
  
  return days;
};

export const DayNavigator = ({
  startDate,
  totalDays,
  selectedDay,
  onDayChange,
  jetLagModeEnabled,
  icons,
  titles,
  hasTransitDay = true,
}: DayNavigatorProps) => {
  const days = generateDayCards(startDate, totalDays, jetLagModeEnabled, icons, titles, hasTransitDay);

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-4 font-['Outfit'] text-foreground">📅 Roteiro Dia a Dia</h2>
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
        {days.map((day) => {
          const isSelected = selectedDay === day.dayNumber;
          const isJetLag = day.isJetLagDay;
          const isTransit = day.isTransitDay;
          
          return (
            <button
              key={day.dayNumber}
              onClick={() => onDayChange(day.dayNumber)}
              className={cn(
                "flex-shrink-0 p-4 rounded-2xl transition-all duration-200 border min-w-[100px]",
                isSelected && !isJetLag && !isTransit && "bg-card border-primary ring-2 ring-primary/30",
                isSelected && isJetLag && "bg-card border-[#eab308] ring-2 ring-[#eab308]/30",
                isSelected && isTransit && "bg-card border-[#0ea5e9] ring-2 ring-[#0ea5e9]/30",
                !isSelected && "bg-card border-border hover:border-primary/50",
                day.isWeekend && !isSelected && "bg-card/80"
              )}
            >
              {/* Transit Indicator */}
              {isTransit && (
                <div className="flex items-center justify-center mb-1">
                  <Plane size={14} className="text-[#0ea5e9]" />
                </div>
              )}
              
              {/* Jet Lag Indicator */}
              {isJetLag && !isTransit && (
                <div className="flex items-center justify-center mb-1">
                  <Brain size={14} className="text-[#eab308]" />
                </div>
              )}
              
              <div className="text-2xl mb-1">{day.icon}</div>
              
              {/* Real Date Display */}
              <div className="font-semibold text-foreground font-['Outfit'] text-sm">
                {day.shortDay}
              </div>
              <div className="text-lg font-bold text-foreground font-['Outfit']">
                {format(day.date, 'dd/MM')}
              </div>
              
              {/* Title - Transit shows "Partida", Day 1 shows "Chegada" */}
              <div className="text-xs text-muted-foreground max-w-[80px] truncate font-['Plus_Jakarta_Sans'] mt-1">
                {isTransit 
                  ? 'Partida' 
                  : day.displayNumber === 1 
                    ? '✈️ Chegada' 
                    : day.title
                }
              </div>
              
              {/* Active Indicator */}
              {isSelected && (
                <div 
                  className={cn(
                    "h-1 rounded-full mt-2 w-full",
                    isTransit ? "bg-[#0ea5e9]" : isJetLag ? "bg-[#eab308]" : "bg-primary"
                  )} 
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DayNavigator;
