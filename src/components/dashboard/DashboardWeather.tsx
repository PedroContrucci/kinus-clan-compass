// DashboardWeather — Shows weather for the next active trip
import { useEffect } from 'react';
import { Cloud, Sun, CloudRain, Snowflake, CloudSun } from 'lucide-react';
import { useWeather } from '@/hooks/useWeather';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardWeatherProps {
  destination: string;
  startDate: string;
}

export const DashboardWeather = ({ destination, startDate }: DashboardWeatherProps) => {
  const { forecast, isLoading, fetchWeather } = useWeather();

  useEffect(() => {
    if (destination) {
      fetchWeather(destination);
    }
  }, [destination, fetchWeather]);

  if (isLoading) {
    return <Skeleton className="h-12 w-20" />;
  }

  if (!forecast || !forecast.days || forecast.days.length === 0) {
    return null;
  }

  // Find the closest day to the trip start
  const tripStart = new Date(startDate);
  const today = new Date();
  const daysUntil = Math.floor((tripStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // Use first available forecast day if trip is within forecast range
  const forecastDay = daysUntil < forecast.days.length ? forecast.days[Math.max(0, daysUntil)] : forecast.days[0];
  
  if (!forecastDay) return null;

  const getWeatherIcon = (condition: string) => {
    const c = condition.toLowerCase();
    if (c.includes('rain') || c.includes('chuva')) return <CloudRain size={18} className="text-sky-400" />;
    if (c.includes('cloud') || c.includes('nuvem')) return <Cloud size={18} className="text-gray-400" />;
    if (c.includes('snow') || c.includes('neve')) return <Snowflake size={18} className="text-sky-200" />;
    if (c.includes('partly') || c.includes('parcial')) return <CloudSun size={18} className="text-amber-400" />;
    return <Sun size={18} className="text-amber-400" />;
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
      {getWeatherIcon(forecastDay.description)}
      <div className="text-xs">
        <p className="font-medium text-foreground">
          {Math.round(forecastDay.temp_min)}° / {Math.round(forecastDay.temp_max)}°
        </p>
        <p className="text-muted-foreground capitalize truncate max-w-[80px]">
          {forecastDay.description}
        </p>
      </div>
    </div>
  );
};

export default DashboardWeather;
