import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Mapping of popular destinations to Viator destination IDs
const DESTINATION_MAP: Record<string, number> = {
  // EUROPA
  'paris': 479,
  'roma': 511,
  'rome': 511,
  'londres': 737,
  'london': 737,
  'barcelona': 562,
  'amsterdam': 525,
  'amsterdã': 525,
  'madrid': 564,
  'madri': 564,
  'lisboa': 538,
  'lisbon': 538,
  'berlim': 531,
  'berlin': 531,
  'praga': 529,
  'prague': 529,
  'viena': 454,
  'vienna': 454,
  'istambul': 585,
  'istanbul': 585,
  'milão': 512,
  'milan': 512,
  'florença': 519,
  'florence': 519,
  'veneza': 522,
  'venice': 522,
  'dublin': 597,
  'atenas': 496,
  'athens': 496,
  'edimburgo': 739,
  'edinburgh': 739,
  
  // AMÉRICAS
  'nova york': 687,
  'new york': 687,
  'miami': 662,
  'orlando': 661,
  'los angeles': 684,
  'las vegas': 684,
  'san francisco': 651,
  'buenos aires': 900,
  'santiago': 931,
  'lima': 949,
  'cancún': 631,
  'cancun': 631,
  'cartagena': 5387,
  'bogotá': 10043,
  'cusco': 946,
  'rio de janeiro': 878,
  'salvador': 5268,
  'são paulo': 5264,
  
  // ÁSIA
  'tóquio': 334,
  'tokyo': 334,
  'bangkok': 349,
  'singapura': 376,
  'singapore': 376,
  'hong kong': 35,
  'seul': 973,
  'seoul': 973,
  'bali': 347,
  'dubai': 828,
  'kyoto': 332,
  
  // OCEANIA
  'sydney': 357,
  
  // ÁFRICA
  'cairo': 782,
  'marrakech': 826,
  'cape town': 318,
};

function findDestinationId(destination: string): number | null {
  const lower = destination.toLowerCase().trim();
  
  if (DESTINATION_MAP[lower]) return DESTINATION_MAP[lower];
  
  const firstWord = lower.split(',')[0].trim();
  if (DESTINATION_MAP[firstWord]) return DESTINATION_MAP[firstWord];
  
  for (const [key, id] of Object.entries(DESTINATION_MAP)) {
    if (lower.includes(key) || key.includes(firstWord)) {
      return id;
    }
  }
  
  return null;
}

function getTagsForType(activityType: string): number[] {
  switch (activityType.toLowerCase()) {
    case 'food':
    case 'restaurante':
    case 'comida':
      return [11926];
    case 'culture':
    case 'museu':
    case 'museum':
      return [11924];
    case 'tour':
    case 'passeio':
      return [11900];
    case 'transport':
    case 'transfer':
      return [11944];
    case 'nightlife':
      return [11940];
    case 'shopping':
      return [11936];
    default:
      return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const VIATOR_API_KEY = Deno.env.get("VIATOR_API_KEY");
    const VIATOR_PARTNER_ID = Deno.env.get("VIATOR_PARTNER_ID") || "P00288912";
    
    if (!VIATOR_API_KEY) {
      console.warn("VIATOR_API_KEY not configured — returning simulated results");
      return new Response(
        JSON.stringify({ 
          products: [],
          simulated: true,
          message: "Viator API key not configured yet. Add VIATOR_API_KEY to secrets." 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { destination, activityName, activityType, currency = "BRL", count = 5 } = await req.json();
    
    if (!destination) {
      throw new Error("Destination is required");
    }

    const destId = findDestinationId(destination);
    
    if (!destId) {
      console.warn(`Destination not found in map: ${destination}`);
      return new Response(
        JSON.stringify({ 
          products: [], 
          message: `Destination "${destination}" not found in Viator catalogue.` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const searchBody: any = {
      filtering: {
        destination: destId,
      },
      sorting: {
        sort: "TRAVELER_RATING",
        order: "DESCENDING",
      },
      pagination: {
        start: 1,
        count: Math.min(count, 10),
      },
      currency: currency,
    };

    const tags = getTagsForType(activityType || '');
    if (tags.length > 0) {
      searchBody.filtering.tags = tags;
    }

    const viatorResponse = await fetch("https://api.viator.com/partner/products/search", {
      method: "POST",
      headers: {
        "Accept-Language": "pt-BR",
        "Content-Type": "application/json",
        "Accept": "application/json;version=2.0",
        "exp-api-key": VIATOR_API_KEY,
      },
      body: JSON.stringify(searchBody),
    });

    if (!viatorResponse.ok) {
      const errorText = await viatorResponse.text();
      console.error("Viator API error:", viatorResponse.status, errorText);
      throw new Error(`Viator API error: ${viatorResponse.status}`);
    }

    const viatorData = await viatorResponse.json();
    
    const products = (viatorData.products || []).map((product: any) => ({
      id: product.productCode,
      title: product.title,
      description: product.description || '',
      image: product.images?.[0]?.variants?.find((v: any) => v.width >= 400)?.url 
        || product.images?.[0]?.variants?.[0]?.url 
        || null,
      rating: product.reviews?.combinedAverageRating || 0,
      reviewCount: product.reviews?.totalReviews || 0,
      price: product.pricing?.summary?.fromPrice || 0,
      currency: product.pricing?.currency || currency,
      duration: product.duration?.fixedDurationInMinutes 
        ? `${Math.round(product.duration.fixedDurationInMinutes / 60)}h` 
        : product.duration?.variableDurationFromMinutes
          ? `${Math.round(product.duration.variableDurationFromMinutes / 60)}-${Math.round((product.duration.variableDurationToMinutes || product.duration.variableDurationFromMinutes) / 60)}h`
          : null,
      freeCancellation: product.flags?.includes("FREE_CANCELLATION") || false,
      bookingUrl: product.productUrl || `https://www.viator.com/tours/${product.productCode}?mcid=42383&pid=${VIATOR_PARTNER_ID}&medium=api&api_version=2.0`,
      provider: 'viator',
    }));

    return new Response(
      JSON.stringify({ 
        products, 
        totalCount: viatorData.totalCount || products.length,
        destination: destination,
        destId: destId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("viator-search error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro ao buscar ofertas",
        products: [],
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
