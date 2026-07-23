// Flight search Edge Function
// Engine: Travelpayouts/Aviasales Data API v3 (prices_for_dates)
// Function name/endpoint/response shape preserved for client compatibility.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TP_BASE_URL = 'https://api.travelpayouts.com/aviasales/v3/prices_for_dates';

const AIRLINE_NAMES: Record<string, string> = {
  LA: 'LATAM', G3: 'GOL', AD: 'Azul', TP: 'TAP Air Portugal',
  AF: 'Air France', EK: 'Emirates', IB: 'Iberia', LH: 'Lufthansa',
  AA: 'American Airlines', UA: 'United', DL: 'Delta', KL: 'KLM',
  BA: 'British Airways', TK: 'Turkish Airlines', QR: 'Qatar Airways',
};

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

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m.toString().padStart(2, '0')}`;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function addMinutesIso(iso: string, minutes: number): string {
  try {
    const d = new Date(iso);
    d.setMinutes(d.getMinutes() + minutes);
    return d.toISOString();
  } catch {
    return iso;
  }
}

function mapItemToOffer(it: any, idx: number, fallbackOrigin: string, fallbackDest: string, requestedDate?: string): FlightOffer {
  const carrierCode: string = it.airline || '';
  const transfers: number = Number(it.transfers ?? 0);
  const isDirect = transfers === 0;
  const durationMinutes: number = Number(it.duration_to ?? it.duration ?? 0);
  const departureAt: string = it.departure_at || '';
  const arrivalAt: string = departureAt ? addMinutesIso(departureAt, durationMinutes) : '';
  const originCode: string = (it.origin || fallbackOrigin).toUpperCase();
  const destCode: string = (it.destination || fallbackDest).toUpperCase();

  const routeString = isDirect
    ? `${originCode} → ${destCode}`
    : `${originCode} → (${transfers} conex.) → ${destCode}`;

  // Re-anchor the cached ticket onto the requested date for standard search,
  // so the itinerary generator never invents multi-day transits from neighboring
  // calendar dates in the Aviasales monthly cache.
  let segmentDepAt = departureAt;
  let segmentArrAt = arrivalAt;
  if (requestedDate && departureAt && departureAt.includes('T')) {
    const timePart = departureAt.slice(11, 16); // HH:mm
    const depISO = `${requestedDate}T${timePart}:00`;
    segmentDepAt = depISO;
    segmentArrAt = new Date(new Date(depISO).getTime() + durationMinutes * 60000).toISOString();
  }

  return {
    id: String(it.flight_number ? `${carrierCode}${it.flight_number}-${idx}` : `${carrierCode}-${idx}`),
    airline: AIRLINE_NAMES[carrierCode] || carrierCode,
    airlineCode: carrierCode,
    route: routeString,
    isDirect,
    connectionCities: [],
    duration: formatDuration(durationMinutes),
    durationMinutes,
    price: Number(it.price ?? 0),
    currency: 'BRL',
    departureTime: formatTime(departureAt),
    arrivalTime: formatTime(arrivalAt),
    departureAirport: originCode,
    arrivalAirport: destCode,
    segments: [
      {
        departure: { iataCode: originCode, at: segmentDepAt },
        arrival: { iataCode: destCode, at: segmentArrAt },
        carrierCode,
        duration: `PT${Math.floor(durationMinutes / 60)}H${durationMinutes % 60}M`,
      },
    ],
  };
}

type FetchResult = { ok: boolean; items: any[] };

async function fetchPrices(
  origin: string,
  destination: string,
  departureAt: string,
  limit: number,
): Promise<FetchResult> {
  const token = Deno.env.get('TRAVELPAYOUTS_TOKEN');
  if (!token) {
    console.error('TRAVELPAYOUTS_TOKEN not configured');
    return { ok: false, items: [] };
  }

  const url = `${TP_BASE_URL}?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&departure_at=${encodeURIComponent(departureAt)}&one_way=true&direct=false&sorting=price&currency=brl&limit=${limit}&token=${encodeURIComponent(token)}`;

  console.log(`Travelpayouts fetch: ${origin} → ${destination} @ ${departureAt} (limit ${limit})`);

  const response = await fetch(url, {
    headers: {
      'X-Access-Token': token,
      'Accept-Encoding': 'gzip, deflate',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Travelpayouts upstream error (status ${response.status}) for ${origin} → ${destination} @ ${departureAt}. Body:`, body);
    return { ok: false, items: [] };
  }

  const data = await response.json();
  const items: any[] = Array.isArray(data?.data) ? data.data : [];
  return { ok: true, items };
}

function daysBetween(a: string, b: string): number {
  try {
    const da = new Date(a.slice(0, 10)).getTime();
    const db = new Date(b.slice(0, 10)).getTime();
    return Math.abs(Math.round((da - db) / 86400000));
  } catch {
    return 9999;
  }
}

async function searchFlights(
  origin: string,
  destination: string,
  date: string,
): Promise<{ ok: boolean; offers: FlightOffer[] }> {
  // Attempt 1: exact date
  const exact = await fetchPrices(origin, destination, date, 10);
  if (!exact.ok) return { ok: false, offers: [] };

  if (exact.items.length > 0) {
    const offers = exact.items.map((it, idx) => mapItemToOffer(it, idx, origin, destination));
    return { ok: true, offers };
  }

  // Attempt 2: month window, then pick nearest to requested date
  const month = date.slice(0, 7);
  const monthly = await fetchPrices(origin, destination, month, 30);
  if (!monthly.ok) return { ok: false, offers: [] };

  if (monthly.items.length === 0) return { ok: true, offers: [] };

  const sorted = [...monthly.items].sort((a, b) => {
    const da = daysBetween(a.departure_at || '', date);
    const db = daysBetween(b.departure_at || '', date);
    if (da !== db) return da - db;
    return Number(a.price ?? 0) - Number(b.price ?? 0);
  }).slice(0, 5);

  const offers = sorted.map((it, idx) => mapItemToOffer(it, idx, origin, destination));
  return { ok: true, offers };
}

async function searchFlexibleDates(
  origin: string,
  destination: string,
  baseDate: string,
  daysRange: number = 3,
): Promise<{ ok: boolean; results: { date: string; bestPrice: number; offers: FlightOffer[] }[] }> {
  const month = baseDate.slice(0, 7);
  const monthly = await fetchPrices(origin, destination, month, 30);
  if (!monthly.ok) return { ok: false, results: [] };

  if (monthly.items.length === 0) return { ok: true, results: [] };

  // Group by YYYY-MM-DD within baseDate ± daysRange
  const groups = new Map<string, any[]>();
  for (const it of monthly.items) {
    const dep: string = it.departure_at || '';
    if (!dep) continue;
    const d = dep.slice(0, 10);
    if (daysBetween(dep, baseDate) > daysRange) continue;
    const arr = groups.get(d) || [];
    arr.push(it);
    groups.set(d, arr);
  }

  const results: { date: string; bestPrice: number; offers: FlightOffer[] }[] = [];
  for (const [date, items] of groups.entries()) {
    const offers = items
      .sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0))
      .slice(0, 3)
      .map((it, idx) => mapItemToOffer(it, idx, origin, destination));
    if (offers.length > 0) {
      const bestPrice = Math.min(...offers.map(o => o.price));
      results.push({ date, bestPrice, offers });
    }
  }

  results.sort((a, b) => a.date.localeCompare(b.date));
  return { ok: true, results };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, origin, destination, date, flexibleDays } = await req.json();

    if (!origin || !destination) {
      return new Response(
        JSON.stringify({ error: 'Origin and destination are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (action === 'flexible') {
      const { ok, results } = await searchFlexibleDates(origin, destination, date, flexibleDays || 3);
      return new Response(
        JSON.stringify({ success: ok, data: ok ? results : [], timestamp: new Date().toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!date) {
      return new Response(
        JSON.stringify({ error: 'Date is required for standard search' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { ok, offers } = await searchFlights(origin, destination, date);

    if (!ok) {
      return new Response(
        JSON.stringify({ success: false, data: [], offers: [], timestamp: new Date().toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (offers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, data: [], offers: [], timestamp: new Date().toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const lowestPrice = Math.min(...offers.map(o => o.price));
    const shortestDuration = Math.min(...offers.map(o => o.durationMinutes));
    const result = offers.map(offer => ({
      ...offer,
      isBestPrice: offer.price === lowestPrice,
      isFastest: offer.durationMinutes === shortestDuration,
    }));

    return new Response(
      JSON.stringify({ success: true, data: result, timestamp: new Date().toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Flight search error:', error);
    return new Response(
      JSON.stringify({ success: false, offers: [], data: [] }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
