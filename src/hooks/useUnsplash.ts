import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  description: string | null;
  user: {
    name: string;
    username: string;
    links: {
      html: string;
    };
  };
  links: {
    html: string;
  };
  width: number;
  height: number;
  color: string;
}

interface UseUnsplashOptions {
  perPage?: number;
  orientation?: 'landscape' | 'portrait' | 'squarish';
  enabled?: boolean;
}

// Client-side cache to reduce duplicate requests
const clientCache = new Map<string, { photos: UnsplashPhoto[]; timestamp: number }>();
const CLIENT_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes client-side

// Category-specific fallback gradients
const fallbackGradients: Record<string, string> = {
  restaurant: 'from-orange-500/80 to-red-600/80',
  hotel: 'from-blue-500/80 to-indigo-600/80',
  experience: 'from-purple-500/80 to-pink-600/80',
  transport: 'from-gray-500/80 to-slate-600/80',
  beach: 'from-cyan-400/80 to-blue-500/80',
  mountain: 'from-green-600/80 to-emerald-700/80',
  city: 'from-slate-600/80 to-gray-700/80',
  culture: 'from-amber-500/80 to-orange-600/80',
  default: 'from-primary/80 to-primary/60',
};

// Category emojis for fallback
const categoryEmojis: Record<string, string> = {
  restaurant: '🍽️',
  hotel: '🏨',
  experience: '🎭',
  transport: '🚃',
  beach: '🏖️',
  mountain: '⛰️',
  city: '🏙️',
  culture: '🏛️',
  flight: '✈️',
  default: '📍',
};

export function useUnsplash(query: string, options: UseUnsplashOptions = {}) {
  const { perPage = 5, orientation = 'landscape', enabled = true } = options;
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = useCallback(async () => {
    // Skip if no query or disabled - silently fail
    if (!query?.trim() || !enabled) {
      setPhotos([]);
      return;
    }

    const cacheKey = `${query.toLowerCase()}-${perPage}-${orientation}`;
    
    // Check client cache first
    const cached = clientCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CLIENT_CACHE_TTL_MS) {
      setPhotos(cached.photos);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use fetch with query params - direct call to edge function

      // Use query params approach
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unsplash?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=${orientation}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch photos: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      const fetchedPhotos = result.photos || [];
      setPhotos(fetchedPhotos);
      
      // Update client cache
      clientCache.set(cacheKey, { photos: fetchedPhotos, timestamp: Date.now() });
    } catch (err) {
      console.error('Unsplash fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch photos');
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, [query, perPage, orientation, enabled]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  return { photos, loading, error, refetch: fetchPhotos };
}

// Get a single photo for a destination/category
// Destination-specific photo keywords for better Unsplash results
const DESTINATION_PHOTO_HINTS: Record<string, string> = {
  'paris': 'Paris Eiffel Tower skyline',
  'roma': 'Rome Colosseum historic',
  'londres': 'London Big Ben Thames',
  'nova york': 'New York Manhattan skyline',
  'tóquio': 'Tokyo Shibuya neon city',
  'tokyo': 'Tokyo Shibuya neon city',
  'barcelona': 'Barcelona Sagrada Familia architecture',
  'lisboa': 'Lisbon Alfama tram colorful',
  'amsterdã': 'Amsterdam canals bicycles',
  'amsterdam': 'Amsterdam canals bicycles',
  'madri': 'Madrid Plaza Mayor historic',
  'madrid': 'Madrid Plaza Mayor historic',
  'buenos aires': 'Buenos Aires La Boca colorful',
  'santiago': 'Santiago Chile Andes mountains',
  'cusco': 'Cusco Peru Machu Picchu ruins',
  'cancún': 'Cancun Mexico turquoise beach',
  'cancun': 'Cancun Mexico turquoise beach',
  'miami': 'Miami Beach art deco ocean',
  'orlando': 'Orlando Florida theme park',
  'dubai': 'Dubai Burj Khalifa skyline',
  'bangkok': 'Bangkok Thailand temple golden',
  'berlim': 'Berlin Brandenburg Gate',
  'berlin': 'Berlin Brandenburg Gate',
  'praga': 'Prague Charles Bridge old town',
  'viena': 'Vienna Schoenbrunn palace',
  'istambul': 'Istanbul Blue Mosque Bosphorus',
  'istanbul': 'Istanbul Blue Mosque Bosphorus',
  'cairo': 'Cairo Egypt pyramids Giza',
  'marrakech': 'Marrakech Morocco medina colorful',
  'cape town': 'Cape Town Table Mountain coast',
  'sydney': 'Sydney Opera House harbour',
  'rio de janeiro': 'Rio de Janeiro Christ Redeemer Sugarloaf',
  'salvador': 'Salvador Bahia Pelourinho colorful',
  'são paulo': 'São Paulo Paulista Avenue urban',
  'florianópolis': 'Florianopolis Brazil beach island',
  'cartagena': 'Cartagena Colombia walled city colorful',
  'montevidéu': 'Montevideo Uruguay Rambla coast',
  'lima': 'Lima Peru Miraflores coast',
  'bogotá': 'Bogota Colombia Candelaria historic',
  'singapura': 'Singapore Marina Bay skyline',
  'singapore': 'Singapore Marina Bay skyline',
  'hong kong': 'Hong Kong Victoria Peak skyline',
  'seul': 'Seoul South Korea Bukchon hanok',
  'seoul': 'Seoul South Korea Bukchon hanok',
};

export function useDestinationPhoto(destination: string, category?: string) {
  // Build a specific search query using destination hints
  const destKey = destination?.trim().toLowerCase() || '';
  const hint = DESTINATION_PHOTO_HINTS[destKey];
  const searchQuery = destination?.trim() 
    ? (hint || `${destination} landmark travel`) 
    : '';
    
  const { photos, loading, error } = useUnsplash(searchQuery, { 
    perPage: 1, 
    enabled: !!destination?.trim() 
  });

  const photo = photos[0] || null;
  const fallbackGradient = fallbackGradients[category || 'default'] || fallbackGradients.default;
  const fallbackEmoji = categoryEmojis[category || 'default'] || categoryEmojis.default;

  return {
    photo,
    loading,
    error,
    imageUrl: photo?.urls.regular || null,
    thumbnailUrl: photo?.urls.small || null,
    credit: photo ? {
      name: photo.user.name,
      username: photo.user.username,
      link: photo.user.links.html,
      photoLink: photo.links.html,
    } : null,
    fallbackGradient,
    fallbackEmoji,
    backgroundColor: photo?.color || '#1e293b',
  };
}

// Get category photo - improved to use specific query
export function useCategoryPhoto(category: string, searchQuery?: string) {
  // Use provided search query or fallback to category
  const query = searchQuery?.trim() || category;
  const { photos, loading, error } = useUnsplash(query, { perPage: 1, enabled: !!query });

  const photo = photos[0] || null;
  const fallbackGradient = fallbackGradients[category] || fallbackGradients.default;
  const fallbackEmoji = categoryEmojis[category] || categoryEmojis.default;

  return {
    photo,
    loading,
    error,
    imageUrl: photo?.urls.regular || null,
    thumbnailUrl: photo?.urls.small || null,
    credit: photo ? {
      name: photo.user.name,
      username: photo.user.username,
      link: photo.user.links.html,
      photoLink: photo.links.html,
    } : null,
    fallbackGradient,
    fallbackEmoji,
  };
}

// Utility to get fallback styles
export function getFallbackStyles(category?: string) {
  return {
    gradient: fallbackGradients[category || 'default'] || fallbackGradients.default,
    emoji: categoryEmojis[category || 'default'] || categoryEmojis.default,
  };
}

// Photo credit component helper
export function formatPhotoCredit(credit: { name: string; link: string } | null): string {
  if (!credit) return '';
  return `Foto: ${credit.name} / Unsplash`;
}
