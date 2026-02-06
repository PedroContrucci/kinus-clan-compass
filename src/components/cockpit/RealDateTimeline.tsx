// RealDateTimeline — Shows real dates with proper day logic
// Day 0 = Departure (transit), Day 1 = Arrival, Day N = Return

import { format, addDays, isWeekend } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plane, Brain, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TripDay } from '@/types/trip';

interface RealDateTimelineProps {
  days: TripDay[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
  tripStartDate: string; // Departure date
  jetLagModeEnabled?: boolean;
}

interface DayDisplayInfo {
  dayNumber: number;
  date: Date;
  dateFormatted: string;
  weekDay: string;
  isWeekend: boolean;
  type: 'departure' | 'arrival' | 'experience' | 'return';
  icon: string;
  title: string;
  isJetLagDay: boolean;
}

// Generate day display info with correct logic
const generateDayInfo = (
  days: TripDay[],
  startDate: Date,
  jetLagModeEnabled: boolean
): DayDisplayInfo[] => {
  const totalDays = days.length;
  
  return days.map((day, index) => {
    const date = addDays(startDate, index);
    const isFirst = index === 0;
    const isSecond = index === 1;
    const isLast = index === totalDays - 1;
    
    // Determine day type
    let type: DayDisplayInfo['type'] = 'experience';
    let icon = '🗺️';
    let title = day.title || 'Exploração';
    let isJetLagDay = false;
    
    if (isFirst) {
      type = 'departure';
      icon = '✈️';
      title = 'Embarque';
    } else if (isSecond) {
      type = 'arrival';
      icon = '🛬';
      title = 'Chegada';
      isJetLagDay = jetLagModeEnabled;
    } else if (isLast) {
      type = 'return';
      icon = '🏠';
      title = 'Retorno';
    } else {
      // Exploration days with variety
      const themes = [
        { icon: '🏛️', title: 'Cultura' },
        { icon: '🍽️', title: 'Gastronomia' },
        { icon: '🚶', title: 'Passeios' },
        { icon: '🎭', title: 'Descobertas' },
        { icon: '⭐', title: 'Aventura' },
        { icon: '📸', title: 'Fotos' },
      ];
      const theme = themes[(index - 2) % themes.length];
      icon = theme.icon;
      title = day.title || theme.title;
    }
    
    return {
      dayNumber: day.day,
      date,
      dateFormatted: format(date, "dd/MMM", { locale: ptBR }),
      weekDay: format(date, "EEE", { locale: ptBR }),
      isWeekend: isWeekend(date),
      type,
      icon,
      title,
      isJetLagDay,
    };
  });
};

export const RealDateTimeline = ({
  days,
  selectedDay,
  onSelectDay,
  tripStartDate,
  jetLagModeEnabled = false,
}: RealDateTimelineProps) => {
  const startDate = tripStartDate ? new Date(tripStartDate) : new Date();
  const safeDays = days || [];
  
  if (safeDays.length === 0) {
    return (
      <div className="mb-6 p-4 text-center text-muted-foreground">
        Nenhum dia disponível
      </div>
    );
  }
  
  const dayInfos = generateDayInfo(safeDays, startDate, jetLagModeEnabled);
  
  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
        📅 Roteiro dia a dia
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
        {dayInfos.map((info) => {
          const isSelected = selectedDay === info.dayNumber;
          const isDeparture = info.type === 'departure';
          const isArrival = info.type === 'arrival';
          const isReturn = info.type === 'return';
          const isTransit = isDeparture || isReturn;
          
          return (
            <button
              key={info.dayNumber}
              onClick={() => onSelectDay(info.dayNumber)}
              className={cn(
                "flex-shrink-0 p-3 rounded-2xl transition-all duration-200 border min-w-[100px] text-left",
                // Selected states
                isSelected && !isTransit && !info.isJetLagDay && "bg-card border-primary ring-2 ring-primary/30",
                isSelected && isTransit && "bg-card border-sky-500 ring-2 ring-sky-500/30",
                isSelected && info.isJetLagDay && "bg-card border-amber-500 ring-2 ring-amber-500/30",
                // Default state
                !isSelected && "bg-card border-border hover:border-primary/50",
                // Transit background
                isTransit && !isSelected && "bg-sky-500/5",
                // Weekend indicator
                info.isWeekend && !isSelected && "bg-muted/50"
              )}
            >
              {/* Transit/JetLag Indicator */}
              <div className="flex items-center justify-between mb-1 h-4">
                {isDeparture && <Plane size={12} className="text-sky-500" />}
                {isReturn && <Plane size={12} className="text-sky-500 rotate-45" />}
                {info.isJetLagDay && !isTransit && <Brain size={12} className="text-amber-500" />}
                {!isTransit && !info.isJetLagDay && (
                  info.isWeekend ? <Sun size={12} className="text-orange-400" /> : null
                )}
                <span className={cn(
                  "text-[10px] font-medium px-1.5 py-0.5 rounded ml-auto",
                  isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  D{info.dayNumber}
                </span>
              </div>
              
              {/* Icon */}
              <div className="text-xl mb-1">{info.icon}</div>
              
              {/* Real Date - Main display */}
              <div className="text-base font-bold text-foreground font-['Outfit']">
                {info.dateFormatted}
              </div>
              
              {/* Day of week */}
              <div className="text-xs text-muted-foreground capitalize mb-1">
                {info.weekDay}
              </div>
              
              {/* Title */}
              <div className={cn(
                "text-[10px] font-medium truncate max-w-[80px]",
                isTransit ? "text-sky-500" : info.isJetLagDay ? "text-amber-500" : "text-muted-foreground"
              )}>
                {info.title}
              </div>
              
              {/* Active Indicator */}
              {isSelected && (
                <div 
                  className={cn(
                    "h-1 rounded-full mt-2 w-full",
                    isTransit ? "bg-sky-500" : info.isJetLagDay ? "bg-amber-500" : "bg-primary"
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

export default RealDateTimeline;
