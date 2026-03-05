import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HistoryPoint {
  date: string;
  rate: number;
}

interface Statistics {
  min: number;
  max: number;
  avg: number;
  current: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: string;
}

interface ExchangeRatesData {
  rates: Record<string, number>;
  history: HistoryPoint[];
  statistics: Statistics | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const CACHE_KEY = 'kinu_exchange_rates_v2';
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

const FALLBACK_RATES: Record<string, number> = {
  USD: 0.18, EUR: 0.16, GBP: 0.14, JPY: 27.5, THB: 6.12,
  ARS: 180, CLP: 160, COP: 720, MXN: 3.1, PEN: 0.67,
  CAD: 0.25, AUD: 0.28, CHF: 0.16, NZD: 0.30,
  SEK: 1.85, DKK: 1.22, NOK: 1.90, CZK: 4.15, HUF: 65,
  PLN: 0.72, TRY: 5.8, KRW: 245, CNY: 1.30, HKD: 1.41,
  SGD: 0.24, IDR: 2830, VND: 4500, INR: 15.2, AED: 0.66,
  ILS: 0.65, ZAR: 3.28, EGP: 8.8, MAD: 1.78, UYU: 7.2,
};

interface CacheData {
  rates: Record<string, number>;
  history: HistoryPoint[];
  statistics: Statistics | null;
  timestamp: number;
  currency: string;
}

export function useExchangeRates(targetCurrency: string = 'EUR') {
  const [data, setData] = useState<ExchangeRatesData>({
    rates: {},
    history: [],
    statistics: null,
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const getCache = useCallback((): CacheData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: CacheData = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_DURATION && parsed.currency === targetCurrency) {
          return parsed;
        }
      }
    } catch {}
    return null;
  }, [targetCurrency]);

  const setCache = useCallback((rates: Record<string, number>, history: HistoryPoint[], statistics: Statistics | null) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        rates, history, statistics,
        timestamp: Date.now(),
        currency: targetCurrency,
      }));
    } catch {}
  }, [targetCurrency]);

  const fetchRates = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = getCache();
      if (cached) {
        setData({
          rates: cached.rates,
          history: cached.history,
          statistics: cached.statistics,
          loading: false,
          error: null,
          lastUpdated: new Date(cached.timestamp),
        });
        return;
      }
    }

    setData(prev => ({ ...prev, loading: true, error: null }));

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const fmt = (d: Date) => d.toISOString().split('T')[0];

      const [liveRes, histRes] = await Promise.all([
        supabase.functions.invoke('exchange-rates', {
          body: {
            base: 'BRL',
            targets: [targetCurrency, 'USD', 'EUR', 'JPY', 'GBP'],
          },
        }),
        supabase.functions.invoke('exchange-rates', {
          body: {
            action: 'history',
            base: 'BRL',
            targets: [targetCurrency],
            currencies: targetCurrency,
            startDate: fmt(startDate),
            endDate: fmt(endDate),
          },
        }),
      ]);

      if (liveRes.error) throw new Error(liveRes.error.message);

      const liveData = liveRes.data;
      const histData = histRes.data;

      if (!liveData?.success) throw new Error(liveData?.error || 'Failed to fetch rates');

      const rates = liveData.rates || {};
      const history = histData?.history || [];
      const statistics = histData?.statistics || null;

      setCache(rates, history, statistics);

      setData({
        rates,
        history,
        statistics,
        loading: false,
        error: null,
        lastUpdated: new Date(liveData.updated_at || Date.now()),
      });
    } catch (error) {
      console.error('Exchange rates error:', error);
      // Use fallback rates
      const fallback: Record<string, number> = {};
      for (const c of [targetCurrency, 'USD', 'EUR', 'JPY', 'GBP']) {
        fallback[c] = FALLBACK_RATES[c] || 1;
      }
      setData(prev => ({
        ...prev,
        rates: Object.keys(prev.rates).length > 0 ? prev.rates : fallback,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar cotações',
      }));
    }
  }, [targetCurrency, getCache, setCache]);

  const refresh = useCallback(() => fetchRates(true), [fetchRates]);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  const convert = useCallback((amountBRL: number): number => {
    const rate = data.rates[targetCurrency];
    return rate ? amountBRL * rate : 0;
  }, [data.rates, targetCurrency]);

  const convertToBRL = useCallback((amount: number): number => {
    const rate = data.rates[targetCurrency];
    return rate ? amount / rate : 0;
  }, [data.rates, targetCurrency]);

  const getInsight = useCallback((): { message: string; type: 'positive' | 'negative' | 'neutral' } => {
    if (!data.statistics) return { message: 'Carregando análise...', type: 'neutral' };
    const { current, avg, trend, trendPercent } = data.statistics;
    const pctFromAvg = ((current - avg) / avg) * 100;

    if (pctFromAvg < -2) {
      return { message: `Ótimo momento para comprar! Cotação ${Math.abs(pctFromAvg).toFixed(1)}% abaixo da média.`, type: 'positive' };
    } else if (pctFromAvg > 2 && trend === 'down') {
      return { message: `Aguarde — cotação acima da média mas com tendência de queda (${Math.abs(parseFloat(trendPercent)).toFixed(1)}%).`, type: 'neutral' };
    } else if (trend === 'up') {
      return { message: `Atenção: alta de ${parseFloat(trendPercent).toFixed(1)}% na semana. Considere comprar agora.`, type: 'negative' };
    }
    return { message: 'Cotação estável. Bom momento para planejar.', type: 'neutral' };
  }, [data.statistics]);

  // Formatted "updated ago" string
  const updatedAgo = useMemo(() => {
    if (!data.lastUpdated) return '';
    const diffMs = Date.now() - data.lastUpdated.getTime();
    const hours = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    if (hours > 0) return `Atualizado há ${hours}h${mins > 0 ? `${mins}min` : ''}`;
    if (mins > 0) return `Atualizado há ${mins}min`;
    return 'Atualizado agora';
  }, [data.lastUpdated]);

  return {
    ...data,
    refresh,
    convert,
    convertToBRL,
    getInsight,
    targetCurrency,
    updatedAgo,
  };
}
