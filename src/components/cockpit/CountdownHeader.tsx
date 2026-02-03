import { useMemo } from 'react';
import { differenceInDays, differenceInHours, differenceInMinutes, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CountdownHeaderProps {
  destination: string;
  country: string;
  emoji: string;
  departureDate: string;
  departureTime?: string;
}

const CountdownHeader = ({ destination, country, emoji, departureDate, departureTime = '22:30' }: CountdownHeaderProps) => {
  const countdown = useMemo(() => {
    const departure = new Date(departureDate);
    const now = new Date();
    
    const totalDays = differenceInDays(departure, now);
    const totalHours = differenceInHours(departure, now) % 24;
    const totalMinutes = differenceInMinutes(departure, now) % 60;
    
    const isPast = departure < now;
    
    return {
      days: Math.max(0, totalDays),
      hours: Math.max(0, totalHours),
      minutes: Math.max(0, totalMinutes),
      isPast,
      formatted: format(departure, "EEE dd/MM 'às' HH:mm", { locale: ptBR }),
    };
  }, [departureDate]);

  return (
    <div className="bg-gradient-to-br from-card to-background rounded-2xl p-6 border border-border">
      <h1 className="text-2xl font-bold text-foreground font-['Outfit'] mb-4">
        {emoji} {destination}, {country}
      </h1>
      
      <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 text-center">
        <span className="text-sm text-muted-foreground">⏱️ FALTAM</span>
        
        <div className="flex items-center justify-center gap-2 my-3 text-foreground font-['Outfit']">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold">{countdown.days}</span>
            <span className="text-xs text-muted-foreground">dias</span>
          </div>
          <span className="text-2xl text-muted-foreground">•</span>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold">{countdown.hours}</span>
            <span className="text-xs text-muted-foreground">horas</span>
          </div>
          <span className="text-2xl text-muted-foreground">•</span>
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold">{countdown.minutes}</span>
            <span className="text-xs text-muted-foreground">min</span>
          </div>
        </div>
        
        <span className="text-sm text-muted-foreground">
          📅 Partida: {countdown.formatted}
        </span>
      </div>
    </div>
  );
};

export default CountdownHeader;
