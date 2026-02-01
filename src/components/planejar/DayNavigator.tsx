import { format, addDays, isWeekend } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DayInfo {
  dayNumber: number;
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
}

export const generateDayCards = (
  startDate: Date,
  totalDays: number,
  jetLagModeEnabled: boolean,
  icons: string[],
  titles: string[]
): DayInfo[] => {
  const days: DayInfo[] = [];
  
  for (let i = 0; i < totalDays; i++) {
    const date = addDays(startDate, i);
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const fullDayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    
    days.push({
      dayNumber: i + 1,
      date,
      dateFormatted: `${dayNames[date.getDay()]} ${format(date, 'dd/MM')}`,
      shortDay: dayNames[date.getDay()],
      dayOfWeek: fullDayNames[date.getDay()],
      isWeekend: isWeekend(date),
      isJetLagDay: jetLagModeEnabled && i === 0,
      isTransitDay: i === 0,
      icon: icons[i] || '📍',
      title: titles[i] || `Dia ${i + 1}`,
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
}: DayNavigatorProps) => {
  const days = generateDayCards(startDate, totalDays, jetLagModeEnabled, icons, titles);

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-4 font-['Outfit'] text-foreground">📅 Roteiro Dia a Dia</h2>
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
        {days.map((day) => {
          const isSelected = selectedDay === day.dayNumber;
          const isJetLag = day.isJetLagDay;
          
          return (
            <button
              key={day.dayNumber}
              onClick={() => onDayChange(day.dayNumber)}
              className={cn(
                "flex-shrink-0 p-4 rounded-2xl transition-all duration-200 border min-w-[100px]",
                isSelected && !isJetLag && "bg-card border-primary ring-2 ring-primary/30",
                isSelected && isJetLag && "bg-card border-[#eab308] ring-2 ring-[#eab308]/30",
                !isSelected && "bg-card border-border hover:border-primary/50",
                day.isWeekend && !isSelected && "bg-card/80"
              )}
            >
              {/* Jet Lag Indicator */}
              {isJetLag && (
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
              
              {/* Title */}
              <div className="text-xs text-muted-foreground max-w-[80px] truncate font-['Plus_Jakarta_Sans'] mt-1">
                {day.isTransitDay && day.dayNumber === 1 ? '✈️ Chegada' : day.title}
              </div>
              
              {/* Active Indicator */}
              {isSelected && (
                <div 
                  className={cn(
                    "h-1 rounded-full mt-2 w-full",
                    isJetLag ? "bg-[#eab308]" : "bg-primary"
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
