import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WeatherDay {
  date: string;
  temp_min: number;
  temp_max: number;
  description: string;
  icon: string;
  rain_probability: number;
  condition: "sunny" | "partly_cloudy" | "cloudy" | "rainy" | "snowy" | "stormy";
}

export interface WeatherForecast {
  city: string;
  country: string;
  days: WeatherDay[];
  cached_at: string;
}

interface UseWeatherResult {
  forecast: WeatherForecast | null;
  isLoading: boolean;
  error: string | null;
  fetchWeather: (city: string, country?: string) => Promise<WeatherForecast | null>;
  getRainAlert: (startDate: Date, activities: { dayNumber: number; category: string; name: string }[]) => RainAlert | null;
}

export interface RainAlert {
  dayNumber: number;
  date: string;
  activityName: string;
  rainProbability: number;
  message: string;
}

export function useWeather(): UseWeatherResult {
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async (city: string, country?: string): Promise<WeatherForecast | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("weather", {
        body: { city, country },
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      setForecast(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao buscar previsão";
      setError(message);
      console.error("Weather fetch error:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getRainAlert = useCallback((
    startDate: Date,
    activities: { dayNumber: number; category: string; name: string }[]
  ): RainAlert | null => {
    if (!forecast?.days) return null;

    // Categories that are outdoor activities
    const outdoorCategories = ["experience", "transport"];
    const outdoorKeywords = ["parque", "jardim", "praia", "tour", "walking", "passeio", "outdoor"];

    for (const activity of activities) {
      // Check if it's an outdoor activity
      const isOutdoor = outdoorCategories.includes(activity.category) ||
        outdoorKeywords.some(kw => activity.name.toLowerCase().includes(kw));

      if (!isOutdoor) continue;

      // Calculate the date for this activity
      const activityDate = new Date(startDate);
      activityDate.setDate(activityDate.getDate() + activity.dayNumber - 1);
      const dateStr = activityDate.toISOString().split("T")[0];

      // Find weather for this date
      const dayWeather = forecast.days.find(d => d.date === dateStr);
      
      if (dayWeather && dayWeather.rain_probability >= 60) {
        return {
          dayNumber: activity.dayNumber,
          date: dateStr,
          activityName: activity.name,
          rainProbability: dayWeather.rain_probability,
          message: `🌧️ Dia ${activity.dayNumber} tem ${dayWeather.rain_probability}% de chance de chuva. Quer que eu sugira atividades indoor para "${activity.name}"?`,
        };
      }
    }

    return null;
  }, [forecast]);

  return {
    forecast,
    isLoading,
    error,
    fetchWeather,
    getRainAlert,
  };
}

export function getWeatherEmoji(condition: WeatherDay["condition"]): string {
  switch (condition) {
    case "sunny": return "☀️";
    case "partly_cloudy": return "⛅";
    case "cloudy": return "☁️";
    case "rainy": return "🌧️";
    case "snowy": return "❄️";
    case "stormy": return "⛈️";
    default: return "🌤️";
  }
}
