// EnhancedDayTimeline — Shows real dates and themed day titles

import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plane } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TripDay } from '@/types/trip';

interface EnhancedDayTimelineProps {
  days: TripDay[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
  tripStartDate: string;
}

// Get themed title based on day type
const getDayTheme = (dayIndex: number, totalDays: number): { title: string; icon: string } => {
  // Day 1 = Departure day
  if (dayIndex === 0) {
    return { title: 'Embarque', icon: '✈️' };
  }
  // Day 2 = Arrival day
  if (dayIndex === 1) {
    return { title: 'Chegada', icon: '🛬' };
  }
  // Last day = Return
  if (dayIndex === totalDays - 1) {
    return { title: 'Retorno', icon: '🏠' };
  }
  
  // Exploration days with variety
  const themes = [
    { title: 'Exploração', icon: '🗺️' },
    { title: 'Descobertas', icon: '🎭' },
    { title: 'Gastronomia', icon: '🍽️' },
    { title: 'Passeios', icon: '🚶' },
    { title: 'Cultura', icon: '🏛️' },
    { title: 'Aventura', icon: '⭐' },
  ];
  
  return themes[(dayIndex - 2) % themes.length];
};

export const EnhancedDayTimeline = ({
  days,
  selectedDay,
  onSelectDay,
  tripStartDate,
}: EnhancedDayTimelineProps) => {
  const startDate = new Date(tripStartDate);
  
  return (
    <div className="mb-6">
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
        {days.map((day, index) => {
          const currentDate = addDays(startDate, index);
          const dayTheme = getDayTheme(index, days.length);
          const isSelected = selectedDay === day.day;
          const isFirst = index === 0;
          const isLast = index === days.length - 1;
          
          return (
            <button
              key={day.day}
              onClick={() => onSelectDay(day.day)}
              className={cn(
                "flex-shrink-0 p-3 rounded-2xl transition-all duration-200 border min-w-[90px]",
                isSelected
                  ? "bg-card border-primary ring-2 ring-primary/30"
                  : "bg-card border-border hover:border-primary/50",
                (isFirst || isLast) && "bg-primary/5"
              )}
            >
              {/* Day number badge */}
              <div className="flex items-center justify-between mb-2">
                <span className={cn(
                  "text-xs font-medium px-1.5 py-0.5 rounded",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  D{day.day}
                </span>
                {(isFirst || isLast) && (
                  <Plane size={12} className={cn(
                    "text-primary",
                    isLast && "rotate-45"
                  )} />
                )}
              </div>
              
              {/* Date */}
              <div className="text-sm font-semibold text-foreground font-['Outfit']">
                {format(currentDate, "dd/MMM", { locale: ptBR })}
              </div>
              
              {/* Day of week */}
              <div className="text-xs text-muted-foreground capitalize">
                {format(currentDate, "EEE", { locale: ptBR })}
              </div>
              
              {/* Icon + Theme */}
              <div className="mt-2 flex items-center gap-1">
                <span className="text-lg">{dayTheme.icon}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[50px]">
                  {dayTheme.title}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EnhancedDayTimeline;
