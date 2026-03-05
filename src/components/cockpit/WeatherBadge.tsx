// WeatherBadge — Compact inline weather pill for trip destination
import { useEffect, useMemo } from 'react';
import { useWeather, getWeatherEmoji } from '@/hooks/useWeather';
import { differenceInDays, format } from 'date-fns';

interface WeatherBadgeProps {
  destination: string;
  startDate?: string;
}

// Seasonal averages for destinations without live forecast
const SEASONAL_AVERAGES: Record<string, Record<string, { temp: string; emoji: string }>> = {
  paris: { '12': { temp: '3-8°C', emoji: '❄️' }, '01': { temp: '2-7°C', emoji: '❄️' }, '02': { temp: '3-9°C', emoji: '❄️' }, '03': { temp: '5-12°C', emoji: '🌤️' }, '04': { temp: '7-16°C', emoji: '🌤️' }, '05': { temp: '11-20°C', emoji: '☀️' }, '06': { temp: '14-23°C', emoji: '☀️' }, '07': { temp: '16-25°C', emoji: '☀️' }, '08': { temp: '16-25°C', emoji: '☀️' }, '09': { temp: '13-21°C', emoji: '🌤️' }, '10': { temp: '9-16°C', emoji: '🌧️' }, '11': { temp: '5-10°C', emoji: '🌧️' } },
  tokyo: { '12': { temp: '3-12°C', emoji: '❄️' }, '01': { temp: '1-10°C', emoji: '❄️' }, '02': { temp: '2-11°C', emoji: '❄️' }, '03': { temp: '5-15°C', emoji: '🌸' }, '04': { temp: '10-20°C', emoji: '🌸' }, '05': { temp: '15-25°C', emoji: '☀️' }, '06': { temp: '19-27°C', emoji: '🌧️' }, '07': { temp: '23-31°C', emoji: '☀️' }, '08': { temp: '24-32°C', emoji: '☀️' }, '09': { temp: '20-28°C', emoji: '🌤️' }, '10': { temp: '14-22°C', emoji: '🌤️' }, '11': { temp: '8-17°C', emoji: '🌤️' } },
  dubai: { '12': { temp: '15-26°C', emoji: '☀️' }, '01': { temp: '14-24°C', emoji: '☀️' }, '02': { temp: '15-26°C', emoji: '☀️' }, '03': { temp: '18-29°C', emoji: '☀️' }, '04': { temp: '21-34°C', emoji: '☀️' }, '05': { temp: '25-39°C', emoji: '🌡️' }, '06': { temp: '28-41°C', emoji: '🌡️' }, '07': { temp: '30-42°C', emoji: '🌡️' }, '08': { temp: '30-42°C', emoji: '🌡️' }, '09': { temp: '27-39°C', emoji: '☀️' }, '10': { temp: '23-35°C', emoji: '☀️' }, '11': { temp: '19-31°C', emoji: '☀️' } },
};

function getSeasonalFallback(destination: string, month: string): { temp: string; emoji: string } | null {
  const key = destination.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [city, months] of Object.entries(SEASONAL_AVERAGES)) {
    if (key.includes(city)) return months[month] || null;
  }
  return null;
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

    // Fallback: seasonal average
    const monthStr = format(tripStart, 'MM');
    const monthName = format(tripStart, 'MMMM');
    const seasonal = getSeasonalFallback(destination, monthStr);
    if (seasonal) {
      return `${seasonal.emoji} ${monthName} em ${destination}: ${seasonal.temp}`;
    }

    return null;
  }, [forecast, startDate, destination]);

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
