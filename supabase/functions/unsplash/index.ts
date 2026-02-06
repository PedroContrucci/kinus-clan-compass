import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// In-memory cache with 24h TTL
const cache = new Map<string, { data: UnsplashPhoto[]; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface UnsplashPhoto {
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

interface UnsplashResponse {
  results: UnsplashPhoto[];
  total: number;
  total_pages: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const UNSPLASH_ACCESS_KEY = Deno.env.get('UNSPLASH_ACCESS_KEY');
    if (!UNSPLASH_ACCESS_KEY) {
      throw new Error('UNSPLASH_ACCESS_KEY is not configured');
    }

    const url = new URL(req.url);
    const query = url.searchParams.get('query');
    const perPage = url.searchParams.get('per_page') || '5';
    const orientation = url.searchParams.get('orientation') || 'landscape';

    if (!query) {
      // Return empty photos array instead of error - frontend will use fallback
      return new Response(
        JSON.stringify({ 
          photos: [], 
          total: 0, 
          cached: false,
          fallback: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create cache key
    const cacheKey = `${query.toLowerCase()}-${perPage}-${orientation}`;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
      console.log(`Cache hit for: ${cacheKey}`);
      return new Response(
        JSON.stringify({ photos: cached.data, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch from Unsplash
    console.log(`Fetching from Unsplash: ${query}`);
    const unsplashUrl = new URL('https://api.unsplash.com/search/photos');
    unsplashUrl.searchParams.set('query', query);
    unsplashUrl.searchParams.set('per_page', perPage);
    unsplashUrl.searchParams.set('orientation', orientation);

    const response = await fetch(unsplashUrl.toString(), {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Unsplash API error:', response.status, errorText);
      
      // Handle rate limiting gracefully - return empty photos with fallback flag
      if (response.status === 403 || response.status === 429) {
        console.log('Rate limited - returning fallback');
        return new Response(
          JSON.stringify({ 
            photos: [], 
            total: 0, 
            cached: false,
            fallback: true,
            error: 'rate_limited'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data: UnsplashResponse = await response.json();

    // Extract relevant photo data
    const photos: UnsplashPhoto[] = data.results.map((photo) => ({
      id: photo.id,
      urls: photo.urls,
      alt_description: photo.alt_description,
      description: photo.description,
      user: {
        name: photo.user.name,
        username: photo.user.username,
        links: {
          html: photo.user.links.html,
        },
      },
      links: {
        html: photo.links.html,
      },
      width: photo.width,
      height: photo.height,
      color: photo.color,
    }));

    // Update cache
    cache.set(cacheKey, { data: photos, timestamp: Date.now() });

    return new Response(
      JSON.stringify({ photos, total: data.total, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching photos:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
