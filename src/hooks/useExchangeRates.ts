import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ExchangeRate {
  currency: string;
  rate: number;
}

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

const CACHE_KEY = 'kinu_exchange_rates_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

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
    lastUpdated: null
  });

  const getCache = useCallback((): CacheData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: CacheData = JSON.parse(cached);
        const now = Date.now();
        // Check if cache is still valid and for same currency
        if (now - parsed.timestamp < CACHE_DURATION && parsed.currency === targetCurrency) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading cache:', e);
    }
    return null;
  }, [targetCurrency]);

  const setCache = useCallback((rates: Record<string, number>, history: HistoryPoint[], statistics: Statistics | null) => {
    try {
      const cacheData: CacheData = {
        rates,
        history,
        statistics,
        timestamp: Date.now(),
        currency: targetCurrency
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (e) {
      console.error('Error setting cache:', e);
    }
  }, [targetCurrency]);

  const fetchRates = useCallback(async (forceRefresh: boolean = false) => {
    // Check cache first
    if (!forceRefresh) {
      const cached = getCache();
      if (cached) {
        setData({
          rates: cached.rates,
          history: cached.history,
          statistics: cached.statistics,
          loading: false,
          error: null,
          lastUpdated: new Date(cached.timestamp)
        });
        return;
      }
    }

    setData(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Calculate date range for last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const formatDate = (d: Date) => d.toISOString().split('T')[0];

      // Fetch live rates and history in parallel
      const [liveResponse, historyResponse] = await Promise.all([
        supabase.functions.invoke('exchange-rates', {
          body: {
            action: 'live',
            source: 'BRL',
            currencies: `${targetCurrency},USD,EUR,JPY,GBP`
          }
        }),
        supabase.functions.invoke('exchange-rates', {
          body: {
            action: 'history',
            source: 'BRL',
            currencies: targetCurrency,
            startDate: formatDate(startDate),
            endDate: formatDate(endDate)
          }
        })
      ]);

      if (liveResponse.error) {
        throw new Error(liveResponse.error.message);
      }
      if (historyResponse.error) {
        throw new Error(historyResponse.error.message);
      }

      const liveData = liveResponse.data;
      const historyData = historyResponse.data;

      if (!liveData.success) {
        throw new Error(liveData.error || 'Failed to fetch live rates');
      }

      const rates = liveData.rates || {};
      const history = historyData.history || [];
      const statistics = historyData.statistics || null;

      // Update cache
      setCache(rates, history, statistics);

      setData({
        rates,
        history,
        statistics,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });

    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar cotações'
      }));
    }
  }, [targetCurrency, getCache, setCache]);

  const refresh = useCallback(() => {
    fetchRates(true);
  }, [fetchRates]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  // Convert BRL to target currency
  const convert = useCallback((amountBRL: number): number => {
    const rate = data.rates[targetCurrency];
    if (!rate) return 0;
    return amountBRL * rate;
  }, [data.rates, targetCurrency]);

  // Convert target currency to BRL
  const convertToBRL = useCallback((amount: number): number => {
    const rate = data.rates[targetCurrency];
    if (!rate) return 0;
    return amount / rate;
  }, [data.rates, targetCurrency]);

  // Get KINU insight based on statistics
  const getInsight = useCallback((): { message: string; type: 'positive' | 'negative' | 'neutral' } => {
    if (!data.statistics) {
      return { message: 'Carregando análise...', type: 'neutral' };
    }

    const { current, avg, trend, trendPercent } = data.statistics;
    const percentFromAvg = ((current - avg) / avg) * 100;

    if (percentFromAvg < -2) {
      return {
        message: `Ótimo momento para comprar! A cotação está ${Math.abs(percentFromAvg).toFixed(1)}% abaixo da média dos últimos 30 dias.`,
        type: 'positive'
      };
    } else if (percentFromAvg > 2 && trend === 'down') {
      return {
        message: `Aguarde um pouco. A cotação está acima da média, mas há tendência de queda (${Math.abs(parseFloat(trendPercent)).toFixed(1)}% na última semana).`,
        type: 'neutral'
      };
    } else if (trend === 'up') {
      return {
        message: `Atenção: tendência de alta de ${parseFloat(trendPercent).toFixed(1)}% na última semana. Considere comprar agora para evitar preços maiores.`,
        type: 'negative'
      };
    } else {
      return {
        message: 'Cotação estável. Bom momento para planejar sua compra de moeda estrangeira.',
        type: 'neutral'
      };
    }
  }, [data.statistics]);

  return {
    ...data,
    refresh,
    convert,
    convertToBRL,
    getInsight,
    targetCurrency
  };
}
