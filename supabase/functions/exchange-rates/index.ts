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
      console.error('EXCHANGERATE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Serviço de câmbio temporariamente indisponível' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, source = 'BRL', currencies = 'USD,EUR,JPY,GBP', startDate, endDate } = await req.json();

    let data;

    if (action === 'live') {
      // Get current exchange rates
      const url = `https://api.exchangerate.host/live?access_key=${API_KEY}&source=${source}&currencies=${currencies}`;
      const response = await fetch(url);
      const result: ExchangeRateResponse = await response.json();

      if (!result.success) {
        const errorMsg = typeof result.error === 'string' ? result.error : JSON.stringify(result.error);
        // Check if rate limited - return fallback data
        if (errorMsg.includes('rate_limit') || errorMsg.includes('106')) {
          console.warn('Rate limit hit, returning fallback data');
          data = {
            success: true,
            source,
            rates: { EUR: 0.16, USD: 0.19, JPY: 29.5, GBP: 0.14 }, // Fallback rates
            timestamp: new Date().toISOString(),
            isFallback: true
          };
        } else {
          throw new Error(errorMsg || 'Failed to fetch live rates');
        }
      } else {
        // Convert quotes to a more usable format
        const rates: Record<string, number> = {};
        if (result.quotes) {
          for (const [key, value] of Object.entries(result.quotes)) {
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
      }

    } else if (action === 'history') {
      // Get historical exchange rates
      if (!startDate || !endDate) {
        throw new Error('startDate and endDate are required for history');
      }

      const currency = currencies.split(',')[0];
      const url = `https://api.exchangerate.host/timeframe?access_key=${API_KEY}&start_date=${startDate}&end_date=${endDate}&source=${source}&currencies=${currency}`;
      const response = await fetch(url);
      const result: TimeframeResponse = await response.json();

      if (!result.success) {
        const errorMsg = typeof result.error === 'string' ? result.error : JSON.stringify(result.error);
        // Check if rate limited - return fallback data
        if (errorMsg.includes('rate_limit') || errorMsg.includes('106')) {
          console.warn('Rate limit hit, returning fallback history');
          // Generate synthetic 30-day history
          const fallbackHistory: Array<{ date: string; rate: number }> = [];
          const baseRate = 0.16;
          const start = new Date(startDate);
          const end = new Date(endDate);
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            fallbackHistory.push({
              date: d.toISOString().split('T')[0],
              rate: baseRate + (Math.random() - 0.5) * 0.01
            });
          }
          
          data = {
            success: true,
            source,
            currency,
            history: fallbackHistory,
            statistics: {
              min: baseRate - 0.005,
              max: baseRate + 0.005,
              avg: baseRate,
              current: baseRate,
              trend: 'stable' as const,
              trendPercent: '0.00'
            },
            timestamp: new Date().toISOString(),
            isFallback: true
          };
        } else {
          throw new Error(errorMsg || 'Failed to fetch historical rates');
        }
      } else {
        // Convert to array format for charts
        const history: Array<{ date: string; rate: number }> = [];
        if (result.quotes) {
          for (const [date, rates] of Object.entries(result.quotes)) {
            const rateKey = `${source}${currency}`;
            if (rates[rateKey]) {
              history.push({ date, rate: rates[rateKey] });
            }
          }
        }

        history.sort((a, b) => a.date.localeCompare(b.date));

        const rates = history.map(h => h.rate);
        const min = Math.min(...rates);
        const max = Math.max(...rates);
        const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
        const current = rates[rates.length - 1] || 0;

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
          statistics: { min, max, avg, current, trend, trendPercent: trendPercent.toFixed(2) },
          timestamp: new Date().toISOString()
        };
      }
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
        error: 'Erro ao buscar taxas de câmbio. Tente novamente.' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
