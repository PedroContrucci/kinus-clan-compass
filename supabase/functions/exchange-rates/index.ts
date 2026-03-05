import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// In-memory cache (persists across warm invocations)
let cachedRates: Record<string, number> | null = null;
let cachedAt = 0;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

const FALLBACK_RATES: Record<string, number> = {
  USD: 0.18, EUR: 0.16, GBP: 0.14, JPY: 27.5, THB: 6.12,
  ARS: 180, CLP: 160, COP: 720, MXN: 3.1, PEN: 0.67,
  CAD: 0.25, AUD: 0.28, CHF: 0.16, NZD: 0.30,
  SEK: 1.85, DKK: 1.22, NOK: 1.90, CZK: 4.15, HUF: 65,
  PLN: 0.72, TRY: 5.8, KRW: 245, CNY: 1.30, HKD: 1.41,
  SGD: 0.24, IDR: 2830, VND: 4500, INR: 15.2, AED: 0.66,
  ILS: 0.65, ZAR: 3.28, EGP: 8.8, MAD: 1.78, UYU: 7.2,
  RUB: 16, CRC: 92,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Support both old format (action/source/currencies) and new format (base/targets)
    const base = body.base || body.source || 'BRL';
    const targets: string[] = body.targets || (body.currencies ? body.currencies.split(',') : ['USD', 'EUR', 'JPY', 'GBP']);
    const action = body.action || 'live';

    // For history action, use the paid API if available
    if (action === 'history') {
      return await handleHistory(body, base);
    }

    // Check cache
    const now = Date.now();
    if (cachedRates && (now - cachedAt) < CACHE_TTL) {
      console.log('Returning cached rates');
      const filtered: Record<string, number> = {};
      for (const t of targets) {
        filtered[t] = cachedRates[t] || FALLBACK_RATES[t] || 0;
      }
      return jsonResponse({
        success: true,
        rates: filtered,
        source: base,
        updated_at: new Date(cachedAt).toISOString(),
        cached: true,
      });
    }

    // Fetch from free API (no key needed)
    const url = `https://open.er-api.com/v6/latest/${base}`;
    console.log('Fetching fresh rates from:', url);
    const response = await fetch(url);
    const data = await response.json();

    if (data.result === 'success' && data.rates) {
      // Cache all rates
      cachedRates = data.rates;
      cachedAt = now;

      const filtered: Record<string, number> = {};
      for (const t of targets) {
        filtered[t] = data.rates[t] || FALLBACK_RATES[t] || 0;
      }

      return jsonResponse({
        success: true,
        rates: filtered,
        source: base,
        updated_at: data.time_last_update_utc || new Date().toISOString(),
        cached: false,
      });
    }

    // API failed — return fallback
    console.warn('API returned unexpected result, using fallback');
    return returnFallback(targets, base);

  } catch (error) {
    console.error('Exchange rate error:', error);
    // Return fallback on any error
    try {
      const body = await req.clone().json().catch(() => ({}));
      const targets = (body as any).targets || ['USD', 'EUR', 'JPY', 'GBP'];
      return returnFallback(targets, 'BRL');
    } catch {
      return returnFallback(['USD', 'EUR', 'JPY', 'GBP'], 'BRL');
    }
  }
});

async function handleHistory(body: any, base: string) {
  const { startDate, endDate, currencies } = body;
  const currency = (body.targets?.[0]) || (currencies ? currencies.split(',')[0] : 'USD');

  // Try paid API first
  const API_KEY = Deno.env.get('EXCHANGERATE_API_KEY');
  if (API_KEY && startDate && endDate) {
    try {
      const url = `https://api.exchangerate.host/timeframe?access_key=${API_KEY}&start_date=${startDate}&end_date=${endDate}&source=${base}&currencies=${currency}`;
      const response = await fetch(url);
      const result = await response.json();

      if (result.success && result.quotes) {
        const history: Array<{ date: string; rate: number }> = [];
        for (const [date, rates] of Object.entries(result.quotes)) {
          const rateKey = `${base}${currency}`;
          if ((rates as any)[rateKey]) {
            history.push({ date, rate: (rates as any)[rateKey] });
          }
        }
        history.sort((a, b) => a.date.localeCompare(b.date));

        const rateValues = history.map(h => h.rate);
        const min = Math.min(...rateValues);
        const max = Math.max(...rateValues);
        const avg = rateValues.reduce((a, b) => a + b, 0) / rateValues.length;
        const current = rateValues[rateValues.length - 1] || 0;
        const recentRates = rateValues.slice(-7);
        const previousRates = rateValues.slice(-14, -7);
        const recentAvg = recentRates.reduce((a, b) => a + b, 0) / recentRates.length;
        const previousAvg = previousRates.length > 0 ? previousRates.reduce((a, b) => a + b, 0) / previousRates.length : recentAvg;
        const trendPercent = ((recentAvg - previousAvg) / previousAvg) * 100;
        const trend = trendPercent > 1 ? 'up' : trendPercent < -1 ? 'down' : 'stable';

        return jsonResponse({
          success: true, source: base, currency, history,
          statistics: { min, max, avg, current, trend, trendPercent: trendPercent.toFixed(2) },
        });
      }
    } catch (e) {
      console.warn('Paid API failed for history, generating synthetic:', e);
    }
  }

  // Generate synthetic history as fallback
  const baseRate = FALLBACK_RATES[currency] || 1;
  const fallbackHistory: Array<{ date: string; rate: number }> = [];
  const start = new Date(startDate || Date.now() - 30 * 86400000);
  const end = new Date(endDate || Date.now());
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    fallbackHistory.push({
      date: d.toISOString().split('T')[0],
      rate: baseRate + (Math.random() - 0.5) * baseRate * 0.02,
    });
  }

  return jsonResponse({
    success: true, source: base, currency,
    history: fallbackHistory,
    statistics: {
      min: baseRate * 0.99, max: baseRate * 1.01, avg: baseRate,
      current: baseRate, trend: 'stable' as const, trendPercent: '0.00',
    },
    isFallback: true,
  });
}

function returnFallback(targets: string[], base: string) {
  const filtered: Record<string, number> = {};
  for (const t of targets) {
    filtered[t] = FALLBACK_RATES[t] || 0;
  }
  return jsonResponse({
    success: true,
    rates: filtered,
    source: base,
    updated_at: new Date().toISOString(),
    isFallback: true,
  });
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}
