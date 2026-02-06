// ItineraryDayWeather — Weather indicator for each day in the itinerary
import { useEffect } from 'react';
import { Cloud, Sun, CloudRain, Snowflake, CloudSun, Wind, Droplets } from 'lucide-react';
import { useWeather } from '@/hooks/useWeather';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { differenceInDays } from 'date-fns';

interface ItineraryDayWeatherProps {
  destination: string;
  date: Date;
  compact?: boolean;
}

export const ItineraryDayWeather = ({ destination, date, compact = false }: ItineraryDayWeatherProps) => {
  const { forecast, isLoading, fetchWeather } = useWeather();

  useEffect(() => {
    if (destination) {
      fetchWeather(destination);
    }
  }, [destination, fetchWeather]);

  if (isLoading || !forecast?.days) {
    return compact ? null : (
      <div className="w-8 h-8 bg-muted rounded-lg animate-pulse" />
    );
  }

  const today = new Date();
  const dayIndex = differenceInDays(date, today);

  // Only show if within forecast range
  if (dayIndex < 0 || dayIndex >= forecast.days.length) {
    return null;
  }

  const dayForecast = forecast.days[dayIndex];
  if (!dayForecast) return null;

  const getWeatherIcon = (condition: string, size: number = 16) => {
    const c = condition.toLowerCase();
    if (c.includes('rain') || c.includes('chuva')) return <CloudRain size={size} className="text-sky-400" />;
    if (c.includes('cloud') || c.includes('nuvem')) return <Cloud size={size} className="text-gray-400" />;
    if (c.includes('snow') || c.includes('neve')) return <Snowflake size={size} className="text-sky-200" />;
    if (c.includes('partly') || c.includes('parcial')) return <CloudSun size={size} className="text-amber-400" />;
    return <Sun size={size} className="text-amber-400" />;
  };

  const getWeatherEmoji = (condition: string) => {
    const c = condition.toLowerCase();
    if (c.includes('rain') || c.includes('chuva')) return '🌧️';
    if (c.includes('cloud') || c.includes('nuvem')) return '☁️';
    if (c.includes('snow') || c.includes('neve')) return '❄️';
    if (c.includes('storm') || c.includes('tempest')) return '⛈️';
    if (c.includes('partly') || c.includes('parcial')) return '⛅';
    return '☀️';
  };

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help">
            {getWeatherEmoji(dayForecast.description)}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px]">
          <div className="text-xs">
            <p className="font-medium capitalize">{dayForecast.description}</p>
            <p className="text-muted-foreground">
              {Math.round(dayForecast.temp_min)}° - {Math.round(dayForecast.temp_max)}°C
            </p>
            {dayForecast.rain_probability > 0 && (
              <p className="flex items-center gap-1 text-sky-400 mt-1">
                <Droplets size={10} />
                {dayForecast.rain_probability}% chuva
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded-lg cursor-help">
          {getWeatherIcon(dayForecast.description)}
          <span className="text-xs font-medium text-foreground">
            {Math.round(dayForecast.temp_max)}°
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px]">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {getWeatherIcon(dayForecast.description, 20)}
            <p className="font-medium capitalize">{dayForecast.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Sun size={12} className="text-amber-400" />
              <span>Máx: {Math.round(dayForecast.temp_max)}°C</span>
            </div>
            <div className="flex items-center gap-1">
              <Cloud size={12} className="text-sky-300" />
              <span>Mín: {Math.round(dayForecast.temp_min)}°C</span>
            </div>
            <div className="flex items-center gap-1">
              <Droplets size={12} className="text-sky-400" />
              <span>{dayForecast.rain_probability}% chuva</span>
            </div>
            <div className="flex items-center gap-1">
              <Wind size={12} className="text-gray-400" />
              <span>--</span>
            </div>
          </div>
          {dayForecast.rain_probability >= 60 && (
            <p className="text-xs text-amber-400 pt-1 border-t border-border">
              ⚠️ Alta chance de chuva - considere atividades indoor
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default ItineraryDayWeather;
