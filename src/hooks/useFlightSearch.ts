// Hook for searching flights via Amadeus API
// - Standard search with best price/fastest tags
// - Flexible dates search (±3 days)
// - Sorting by price or duration

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface FlightOffer {
  id: string;
  airline: string;
  airlineCode: string;
  route: string;
  isDirect: boolean;
  connectionCities: string[];
  duration: string;
  durationMinutes: number;
  price: number;
  currency: string;
  departureTime: string;
  arrivalTime: string;
  departureAirport: string;
  arrivalAirport: string;
  isBestPrice?: boolean;
  isFastest?: boolean;
}

export interface FlexibleDateResult {
  date: string;
  bestPrice: number;
  offers: FlightOffer[];
}

export type SortOption = 'price' | 'duration' | 'departure';

// Search flights for a specific date
export function useFlightSearch(
  origin: string,
  destination: string,
  date: string,
  adults: number = 1,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['flights', origin, destination, date, adults],
    queryFn: async (): Promise<FlightOffer[]> => {
      if (!origin || !destination || !date) {
        return [];
      }

      const { data, error } = await supabase.functions.invoke('amadeus-flights', {
        body: {
          action: 'search',
          origin,
          destination,
          date,
          adults,
        },
      });

      if (error) {
        console.error('Flight search error:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Flight search failed');
      }

      return data.data || [];
    },
    enabled: enabled && !!origin && !!destination && !!date,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

// Search flights with flexible dates (±3 days)
export function useFlexibleFlightSearch(
  origin: string,
  destination: string,
  baseDate: string,
  adults: number = 1,
  daysRange: number = 3,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['flexible-flights', origin, destination, baseDate, adults, daysRange],
    queryFn: async (): Promise<FlexibleDateResult[]> => {
      if (!origin || !destination || !baseDate) {
        return [];
      }

      const { data, error } = await supabase.functions.invoke('amadeus-flights', {
        body: {
          action: 'flexible',
          origin,
          destination,
          date: baseDate,
          adults,
          flexibleDays: daysRange,
        },
      });

      if (error) {
        console.error('Flexible flight search error:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Flexible flight search failed');
      }

      return data.data || [];
    },
    enabled: enabled && !!origin && !!destination && !!baseDate,
    staleTime: 10 * 60 * 1000, // 10 minutes (flexible search is more expensive)
    retry: 1,
  });
}

// Utility hook for sorting flights
export function useSortedFlights(flights: FlightOffer[], sortBy: SortOption): FlightOffer[] {
  return [...flights].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.price - b.price;
      case 'duration':
        return a.durationMinutes - b.durationMinutes;
      case 'departure':
        return a.departureTime.localeCompare(b.departureTime);
      default:
        return 0;
    }
  });
}

// Hook for manual flight search with loading state
export function useFlightSearchManual() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchFlights = useCallback(async (
    origin: string,
    destination: string,
    date: string,
    adults: number = 1
  ): Promise<FlightOffer[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('amadeus-flights', {
        body: {
          action: 'search',
          origin,
          destination,
          date,
          adults,
        },
      });

      if (invokeError) {
        throw invokeError;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Flight search failed');
      }

      return data.data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchFlexible = useCallback(async (
    origin: string,
    destination: string,
    baseDate: string,
    adults: number = 1,
    daysRange: number = 3
  ): Promise<FlexibleDateResult[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('amadeus-flights', {
        body: {
          action: 'flexible',
          origin,
          destination,
          date: baseDate,
          adults,
          flexibleDays: daysRange,
        },
      });

      if (invokeError) {
        throw invokeError;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Flexible flight search failed');
      }

      return data.data || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    searchFlights,
    searchFlexible,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}

// Helper to format price
export function formatFlightPrice(price: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// Helper to get savings percentage
export function calculateSavings(originalPrice: number, currentPrice: number): number {
  if (originalPrice <= currentPrice) return 0;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}
