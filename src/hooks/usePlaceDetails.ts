import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PlaceDetails {
  found: boolean;
  id?: string;
  name?: string;
  address?: string;
  rating?: number;
  totalRatings?: number;
  priceLevel?: string;
  openNow?: boolean;
  hours?: string[];
  photoUrl?: string | null;
  mapsUrl?: string;
  summary?: string;
  type?: string;
  reviews?: { author: string; rating: number; text: string; time: string }[];
}

// In-memory cache to avoid repeated API calls
const placeCache = new Map<string, PlaceDetails>();

export function usePlaceDetails() {
  const [loading, setLoading] = useState(false);

  const searchPlace = useCallback(async (query: string, destination: string): Promise<PlaceDetails | null> => {
    const cacheKey = `${query}|${destination}`;
    if (placeCache.has(cacheKey)) return placeCache.get(cacheKey)!;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-places', {
        body: { action: 'search', query, destination },
      });
      if (error) throw error;
      if (data) {
        placeCache.set(cacheKey, data);
        return data;
      }
      return null;
    } catch (err) {
      console.error('Places search error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { searchPlace, loading };
}
