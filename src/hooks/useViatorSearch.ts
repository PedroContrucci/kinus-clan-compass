import { useState, useCallback } from 'react';

export interface ViatorProduct {
  id: string;
  title: string;
  description: string;
  image: string | null;
  rating: number;
  reviewCount: number;
  price: number;
  currency: string;
  duration: string | null;
  freeCancellation: boolean;
  bookingUrl: string;
  provider: 'viator';
}

interface ViatorSearchResult {
  products: ViatorProduct[];
  totalCount: number;
  destination: string;
  simulated?: boolean;
  message?: string;
}

export function useViatorSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ViatorProduct[]>([]);

  const search = useCallback(async (params: {
    destination: string;
    activityName?: string;
    activityType?: string;
    currency?: string;
    count?: number;
  }): Promise<ViatorProduct[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/viator-search`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            destination: params.destination,
            activityName: params.activityName || '',
            activityType: params.activityType || '',
            currency: params.currency || 'BRL',
            count: params.count || 5,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch Viator products: ${response.status}`);
      }

      const data: ViatorSearchResult = await response.json();

      if (data.simulated) {
        console.warn('Viator API not configured:', data.message);
      }

      setResults(data.products || []);
      return data.products || [];
    } catch (err) {
      console.error('Viator search error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar ofertas');
      setResults([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { search, results, loading, error };
}
