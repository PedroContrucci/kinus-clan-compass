// Amadeus Flight Search Edge Function
// - OAuth2 authentication with 30-minute token cache
// - Flight search with flexible dates (±3 days)
// - Returns sorted options with "Best Price" and "Fastest" tags

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Token cache (30 minutes)
let cachedToken: { token: string; expiresAt: number } | null = null;
const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Amadeus API endpoints (test environment)
const AMADEUS_BASE_URL = 'https://test.api.amadeus.com';

interface FlightOffer {
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
  segments: Array<{
    departure: { iataCode: string; at: string };
    arrival: { iataCode: string; at: string };
    carrierCode: string;
    duration: string;
  }>;
}

// Get OAuth2 token from Amadeus
async function getAmadeusToken(): Promise<string> {
  const now = Date.now();
  
  // Return cached token if still valid
  if (cachedToken && cachedToken.expiresAt > now) {
    console.log('Using cached Amadeus token');
    return cachedToken.token;
  }

  const apiKey = Deno.env.get('AMADEUS_API_KEY');
  const apiSecret = Deno.env.get('AMADEUS_API_SECRET');

  if (!apiKey || !apiSecret) {
    throw new Error('Amadeus API credentials not configured');
  }

  console.log('Fetching new Amadeus token...');

  const response = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: apiKey,
      client_secret: apiSecret,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Amadeus auth error:', errorText);
    throw new Error(`Amadeus authentication failed: ${response.status}`);
  }

  const data = await response.json();
  
  // Cache the token
  cachedToken = {
    token: data.access_token,
    expiresAt: now + (data.expires_in * 1000) - 60000, // Expire 1 minute early for safety
  };

  console.log('Amadeus token obtained and cached');
  return cachedToken.token;
}

// Parse ISO 8601 duration to minutes
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  return hours * 60 + minutes;
}

// Format duration for display
function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m.toString().padStart(2, '0')}`;
}

// Airline name mapping
const airlineNames: Record<string, string> = {
  'LA': 'LATAM',
  'G3': 'GOL',
  'AD': 'Azul',
  'TP': 'TAP Portugal',
  'AF': 'Air France',
  'KL': 'KLM',
  'LH': 'Lufthansa',
  'BA': 'British Airways',
  'IB': 'Iberia',
  'EK': 'Emirates',
  'QR': 'Qatar Airways',
  'TK': 'Turkish Airlines',
  'AA': 'American Airlines',
  'UA': 'United Airlines',
  'DL': 'Delta',
  'JL': 'Japan Airlines',
  'NH': 'ANA',
  'ET': 'Ethiopian Airlines',
  'LY': 'El Al',
  'AV': 'Avianca',
  'CM': 'Copa Airlines',
  'AM': 'Aeromexico',
  'AC': 'Air Canada',
  'SU': 'Aeroflot',
  'UX': 'Air Europa',
  'AZ': 'ITA Airways',
  'LX': 'Swiss',
  'OS': 'Austrian',
  'SK': 'SAS',
};

// Search flights using Amadeus API
async function searchFlights(
  origin: string,
  destination: string,
  date: string,
  adults: number = 1,
  maxResults: number = 5
): Promise<FlightOffer[]> {
  const token = await getAmadeusToken();

  const params = new URLSearchParams({
    originLocationCode: origin,
    destinationLocationCode: destination,
    departureDate: date,
    adults: adults.toString(),
    currencyCode: 'BRL',
    max: maxResults.toString(),
    nonStop: 'false',
  });

  console.log(`Searching flights: ${origin} → ${destination} on ${date}`);

  const response = await fetch(
    `${AMADEUS_BASE_URL}/v2/shopping/flight-offers?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Amadeus flight search error:', errorText);
    
    // Return empty array instead of throwing for graceful degradation
    if (response.status === 400) {
      console.log('No flights found for this route/date');
      return [];
    }
    
    throw new Error(`Flight search failed: ${response.status}`);
  }

  const data = await response.json();
  const offers: FlightOffer[] = [];

  if (!data.data || data.data.length === 0) {
    return [];
  }

  for (const offer of data.data) {
    const itinerary = offer.itineraries[0];
    const segments = itinerary.segments;
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];
    
    const carrierCode = firstSegment.carrierCode;
    const isDirect = segments.length === 1;
    
    // Get connection cities for multi-segment flights
    const connectionCities: string[] = [];
    if (!isDirect) {
      for (let i = 0; i < segments.length - 1; i++) {
        connectionCities.push(segments[i].arrival.iataCode);
      }
    }

    const durationMinutes = parseDuration(itinerary.duration);
    
    // Build route string
    let routeString = `${firstSegment.departure.iataCode} → ${lastSegment.arrival.iataCode}`;
    if (!isDirect) {
      routeString = `${firstSegment.departure.iataCode} → ${connectionCities.join(' → ')} → ${lastSegment.arrival.iataCode}`;
    }

    offers.push({
      id: offer.id,
      airline: airlineNames[carrierCode] || carrierCode,
      airlineCode: carrierCode,
      route: routeString,
      isDirect,
      connectionCities,
      duration: formatDuration(durationMinutes),
      durationMinutes,
      price: parseFloat(offer.price.total),
      currency: offer.price.currency,
      departureTime: new Date(firstSegment.departure.at).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      arrivalTime: new Date(lastSegment.arrival.at).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      departureAirport: firstSegment.departure.iataCode,
      arrivalAirport: lastSegment.arrival.iataCode,
      segments: segments.map((seg: any) => ({
        departure: { iataCode: seg.departure.iataCode, at: seg.departure.at },
        arrival: { iataCode: seg.arrival.iataCode, at: seg.arrival.at },
        carrierCode: seg.carrierCode,
        duration: seg.duration,
      })),
    });
  }

  return offers;
}

// Search with flexible dates (±3 days)
async function searchFlexibleDates(
  origin: string,
  destination: string,
  baseDate: string,
  adults: number = 1,
  daysRange: number = 3
): Promise<{ date: string; bestPrice: number; offers: FlightOffer[] }[]> {
  const results: { date: string; bestPrice: number; offers: FlightOffer[] }[] = [];
  const baseDateObj = new Date(baseDate);

  // Search ±daysRange days
  for (let i = -daysRange; i <= daysRange; i++) {
    const searchDate = new Date(baseDateObj);
    searchDate.setDate(searchDate.getDate() + i);
    const dateString = searchDate.toISOString().split('T')[0];

    try {
      const offers = await searchFlights(origin, destination, dateString, adults, 3);
      
      if (offers.length > 0) {
        const bestPrice = Math.min(...offers.map(o => o.price));
        results.push({
          date: dateString,
          bestPrice,
          offers,
        });
      }
    } catch (error) {
      console.error(`Error searching ${dateString}:`, error);
      // Continue with other dates
    }
  }

  return results;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, origin, destination, date, adults, flexibleDays } = await req.json();

    if (!origin || !destination) {
      return new Response(
        JSON.stringify({ error: 'Origin and destination are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;

    if (action === 'flexible') {
      // Search flexible dates
      result = await searchFlexibleDates(
        origin,
        destination,
        date,
        adults || 1,
        flexibleDays || 3
      );
    } else {
      // Standard search
      if (!date) {
        return new Response(
          JSON.stringify({ error: 'Date is required for standard search' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const offers = await searchFlights(origin, destination, date, adults || 1, 5);
      
      // Tag best price and fastest
      if (offers.length > 0) {
        const lowestPrice = Math.min(...offers.map(o => o.price));
        const shortestDuration = Math.min(...offers.map(o => o.durationMinutes));

        result = offers.map(offer => ({
          ...offer,
          isBestPrice: offer.price === lowestPrice,
          isFastest: offer.durationMinutes === shortestDuration,
        }));
      } else {
        result = [];
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: result,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Amadeus flights error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
