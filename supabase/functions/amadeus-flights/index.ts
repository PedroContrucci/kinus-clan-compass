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

async function searchFlights(
  origin: string,
  destination: string,
  date: string,
  _adults: number = 1,
  maxResults: number = 5,
): Promise<FlightOffer[]> {
  const token = Deno.env.get('TRAVELPAYOUTS_TOKEN');
  if (!token) {
    console.error('TRAVELPAYOUTS_TOKEN not configured');
    return [];
  }

  const url = `${TP_BASE_URL}?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&departure_at=${encodeURIComponent(date)}&one_way=true&direct=false&sorting=price&currency=brl&limit=${maxResults}&token=${encodeURIComponent(token)}`;

  console.log(`Searching flights (Travelpayouts): ${origin} → ${destination} on ${date}`);

  const response = await fetch(url, {
    headers: {
      'X-Access-Token': token,
      'Accept-Encoding': 'gzip, deflate',
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Travelpayouts upstream error (status ${response.status}) for ${origin} → ${destination} on ${date}. Body:`, body);
    return [];
  }

  const data = await response.json();
  const items: any[] = Array.isArray(data?.data) ? data.data : [];

  if (items.length === 0) {
    return [];
  }

  const offers: FlightOffer[] = items.map((it, idx) => {
    const carrierCode: string = it.airline || '';
    const transfers: number = Number(it.transfers ?? 0);
    const isDirect = transfers === 0;
    const durationMinutes: number = Number(it.duration_to ?? it.duration ?? 0);
    const departureAt: string = it.departure_at || '';
    const arrivalAt: string = departureAt ? addMinutesIso(departureAt, durationMinutes) : '';
    const originCode: string = (it.origin || origin).toUpperCase();
    const destCode: string = (it.destination || destination).toUpperCase();

    const routeString = isDirect
      ? `${originCode} → ${destCode}`
      : `${originCode} → (${transfers} conex.) → ${destCode}`;

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
          departure: { iataCode: originCode, at: departureAt },
          arrival: { iataCode: destCode, at: arrivalAt },
          carrierCode,
          duration: `PT${Math.floor(durationMinutes / 60)}H${durationMinutes % 60}M`,
        },
      ],
    };
  });

  return offers;
}

async function searchFlexibleDates(
  origin: string,
  destination: string,
  baseDate: string,
  adults: number = 1,
  daysRange: number = 3,
): Promise<{ date: string; bestPrice: number; offers: FlightOffer[] }[]> {
  const results: { date: string; bestPrice: number; offers: FlightOffer[] }[] = [];
  const baseDateObj = new Date(baseDate);

  for (let i = -daysRange; i <= daysRange; i++) {
    const searchDate = new Date(baseDateObj);
    searchDate.setDate(searchDate.getDate() + i);
    const dateString = searchDate.toISOString().split('T')[0];

    try {
      const offers = await searchFlights(origin, destination, dateString, adults, 3);
      if (offers.length > 0) {
        const bestPrice = Math.min(...offers.map(o => o.price));
        results.push({ date: dateString, bestPrice, offers });
      }
    } catch (error) {
      console.error(`Error searching ${dateString}:`, error);
    }
  }

  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, origin, destination, date, adults, flexibleDays } = await req.json();

    if (!origin || !destination) {
      return new Response(
        JSON.stringify({ error: 'Origin and destination are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (action === 'flexible') {
      const result = await searchFlexibleDates(origin, destination, date, adults || 1, flexibleDays || 3);
      return new Response(
        JSON.stringify({ success: true, data: result, timestamp: new Date().toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!date) {
      return new Response(
        JSON.stringify({ error: 'Date is required for standard search' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const offers = await searchFlights(origin, destination, date, adults || 1, 5);

    if (offers.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          data: [],
          offers: [],
          message: 'Nenhum voo encontrado para esta data',
          timestamp: new Date().toISOString(),
        }),
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
