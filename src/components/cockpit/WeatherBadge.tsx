// WeatherBadge — Compact inline weather pill for trip destination
import { useEffect, useMemo } from 'react';
import { useWeather, getWeatherEmoji } from '@/hooks/useWeather';
import { differenceInDays } from 'date-fns';

interface WeatherBadgeProps {
  destination: string;
  startDate?: string;
}

export const WeatherBadge = ({ destination, startDate }: WeatherBadgeProps) => {
  const { forecast, isLoading, fetchWeather } = useWeather();

  useEffect(() => {
    if (destination) fetchWeather(destination);
  }, [destination, fetchWeather]);

  const content = useMemo(() => {
    if (!startDate) return null;

    const tripStart = new Date(startDate);
    const daysUntil = differenceInDays(tripStart, new Date());

    // If within 7 days, try real forecast
    if (daysUntil >= 0 && daysUntil < 7 && forecast?.days?.length) {
      const dayData = forecast.days[Math.min(daysUntil, forecast.days.length - 1)];
      if (dayData) {
        const emoji = getWeatherEmoji(dayData.condition);
        return `${emoji} ${Math.round(dayData.temp_max)}°C — ${dayData.description}`;
      }
    }

    return 'Previsão disponível a partir de 7 dias antes da viagem';
  }, [forecast, startDate]);

  if (isLoading) {
    return <div className="h-5 w-32 bg-muted/50 rounded-full animate-pulse" />;
  }

  if (!content) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground border border-border/50">
      {content}
    </span>
  );
};

export default WeatherBadge;
