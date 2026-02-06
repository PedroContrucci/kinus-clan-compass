import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory cache (resets on cold start, but good for hot instances)
const cache = new Map<string, { data: WeatherForecast; expiry: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface WeatherDay {
  date: string;
  temp_min: number;
  temp_max: number;
  description: string;
  icon: string;
  rain_probability: number;
  condition: "sunny" | "partly_cloudy" | "cloudy" | "rainy" | "snowy" | "stormy";
}

interface WeatherForecast {
  city: string;
  country: string;
  days: WeatherDay[];
  cached_at: string;
}

function mapCondition(weatherId: number): WeatherDay["condition"] {
  // OpenWeatherMap weather condition codes: https://openweathermap.org/weather-conditions
  if (weatherId >= 200 && weatherId < 300) return "stormy"; // Thunderstorm
  if (weatherId >= 300 && weatherId < 400) return "rainy"; // Drizzle
  if (weatherId >= 500 && weatherId < 600) return "rainy"; // Rain
  if (weatherId >= 600 && weatherId < 700) return "snowy"; // Snow
  if (weatherId >= 700 && weatherId < 800) return "cloudy"; // Atmosphere (fog, mist)
  if (weatherId === 800) return "sunny"; // Clear
  if (weatherId === 801 || weatherId === 802) return "partly_cloudy"; // Few/scattered clouds
  if (weatherId >= 803) return "cloudy"; // Broken/overcast clouds
  return "partly_cloudy";
}

function getWeatherIcon(condition: WeatherDay["condition"]): string {
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENWEATHER_API_KEY = Deno.env.get("OPENWEATHER_API_KEY");
    
    if (!OPENWEATHER_API_KEY) {
      throw new Error("OPENWEATHER_API_KEY não está configurada");
    }

    const { city, country } = await req.json();
    
    if (!city) {
      throw new Error("Cidade é obrigatória");
    }

    const cacheKey = `${city}-${country || ""}`.toLowerCase();
    
    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      console.log(`Returning cached weather for ${cacheKey}`);
      return new Response(
        JSON.stringify(cached.data),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build query
    const query = country ? `${city},${country}` : city;
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(query)}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=pt_br`;

    console.log(`Fetching weather for: ${query}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenWeatherMap error:", response.status, errorText);
      
      if (response.status === 404) {
        throw new Error(`Cidade "${city}" não encontrada`);
      }
      if (response.status === 401) {
        throw new Error("API key inválida");
      }
      throw new Error(`Erro ao buscar previsão: ${response.status}`);
    }

    const data = await response.json();
    
    // OpenWeatherMap forecast returns 3-hour intervals for 5 days
    // Group by date and calculate daily summaries
    const dailyData = new Map<string, {
      temps: number[];
      descriptions: string[];
      icons: string[];
      conditions: number[];
      rainProbs: number[];
    }>();

    for (const item of data.list) {
      const date = item.dt_txt.split(" ")[0]; // "2024-01-15"
      
      if (!dailyData.has(date)) {
        dailyData.set(date, {
          temps: [],
          descriptions: [],
          icons: [],
          conditions: [],
          rainProbs: [],
        });
      }
      
      const day = dailyData.get(date)!;
      day.temps.push(item.main.temp);
      day.descriptions.push(item.weather[0].description);
      day.icons.push(item.weather[0].icon);
      day.conditions.push(item.weather[0].id);
      day.rainProbs.push(item.pop * 100); // probability of precipitation (0-1 -> 0-100%)
    }

    // Build forecast days (limit to 7)
    const days: WeatherDay[] = [];
    const sortedDates = Array.from(dailyData.keys()).sort().slice(0, 7);
    
    for (const date of sortedDates) {
      const dayData = dailyData.get(date)!;
      const temps = dayData.temps;
      const maxRainProb = Math.max(...dayData.rainProbs);
      
      // Most common condition
      const conditionCounts = new Map<number, number>();
      for (const cond of dayData.conditions) {
        conditionCounts.set(cond, (conditionCounts.get(cond) || 0) + 1);
      }
      const dominantCondition = Array.from(conditionCounts.entries())
        .sort((a, b) => b[1] - a[1])[0][0];
      
      const condition = mapCondition(dominantCondition);
      
      days.push({
        date,
        temp_min: Math.round(Math.min(...temps)),
        temp_max: Math.round(Math.max(...temps)),
        description: dayData.descriptions[Math.floor(dayData.descriptions.length / 2)], // Mid-day description
        icon: getWeatherIcon(condition),
        rain_probability: Math.round(maxRainProb),
        condition,
      });
    }

    const forecast: WeatherForecast = {
      city: data.city.name,
      country: data.city.country,
      days,
      cached_at: new Date().toISOString(),
    };

    // Store in cache
    cache.set(cacheKey, {
      data: forecast,
      expiry: Date.now() + CACHE_TTL_MS,
    });

    return new Response(
      JSON.stringify(forecast),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("weather error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido ao buscar previsão" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
