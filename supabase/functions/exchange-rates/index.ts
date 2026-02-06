import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ExchangeRateResponse {
  success: boolean;
  quotes?: Record<string, number>;
  error?: string;
}

interface TimeframeResponse {
  success: boolean;
  quotes?: Record<string, Record<string, number>>;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const API_KEY = Deno.env.get('EXCHANGERATE_API_KEY');
    if (!API_KEY) {
      throw new Error('EXCHANGERATE_API_KEY not configured');
    }

    const { action, source = 'BRL', currencies = 'USD,EUR,JPY,GBP', startDate, endDate } = await req.json();

    let data;

    if (action === 'live') {
      // Get current exchange rates
      const url = `https://api.exchangerate.host/live?access_key=${API_KEY}&source=${source}&currencies=${currencies}`;
      const response = await fetch(url);
      const result: ExchangeRateResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch live rates');
      }

      // Convert quotes to a more usable format
      // API returns like { "BRLEUR": 0.17, "BRLUSD": 0.20 }
      const rates: Record<string, number> = {};
      if (result.quotes) {
        for (const [key, value] of Object.entries(result.quotes)) {
          // Remove source prefix (e.g., "BRLEUR" -> "EUR")
          const currency = key.replace(source, '');
          rates[currency] = value;
        }
      }

      data = {
        success: true,
        source,
        rates,
        timestamp: new Date().toISOString()
      };

    } else if (action === 'history') {
      // Get historical exchange rates
      if (!startDate || !endDate) {
        throw new Error('startDate and endDate are required for history');
      }

      const currency = currencies.split(',')[0]; // Use first currency for history
      const url = `https://api.exchangerate.host/timeframe?access_key=${API_KEY}&start_date=${startDate}&end_date=${endDate}&source=${source}&currencies=${currency}`;
      const response = await fetch(url);
      const result: TimeframeResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch historical rates');
      }

      // Convert to array format for charts
      const history: Array<{ date: string; rate: number }> = [];
      if (result.quotes) {
        for (const [date, rates] of Object.entries(result.quotes)) {
          const rateKey = `${source}${currency}`;
          if (rates[rateKey]) {
            history.push({
              date,
              rate: rates[rateKey]
            });
          }
        }
      }

      // Sort by date
      history.sort((a, b) => a.date.localeCompare(b.date));

      // Calculate statistics
      const rates = history.map(h => h.rate);
      const min = Math.min(...rates);
      const max = Math.max(...rates);
      const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
      const current = rates[rates.length - 1] || 0;

      // Calculate trend (last 7 days vs previous 7 days)
      const recentRates = rates.slice(-7);
      const previousRates = rates.slice(-14, -7);
      const recentAvg = recentRates.reduce((a, b) => a + b, 0) / recentRates.length;
      const previousAvg = previousRates.length > 0 
        ? previousRates.reduce((a, b) => a + b, 0) / previousRates.length 
        : recentAvg;
      
      const trendPercent = ((recentAvg - previousAvg) / previousAvg) * 100;
      let trend: 'up' | 'down' | 'stable';
      if (trendPercent > 1) trend = 'up';
      else if (trendPercent < -1) trend = 'down';
      else trend = 'stable';

      data = {
        success: true,
        source,
        currency,
        history,
        statistics: {
          min,
          max,
          avg,
          current,
          trend,
          trendPercent: trendPercent.toFixed(2)
        },
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error('Invalid action. Use "live" or "history"');
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Exchange rate error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
