import { format } from 'date-fns';

export type OfferCategory = 'flight' | 'hotel' | 'activity';

export interface OfferLink {
  partner: string;
  description: string;
  url: string;
  isAffiliate: boolean;
}

export interface OfferParams {
  category: OfferCategory;
  originCode?: string;
  destinationCode?: string;
  city?: string;
  hotelName?: string;
  activityName?: string;
  startDate?: Date;
  endDate?: Date;
  travelers?: number;
  /** Specific date (yyyy-MM-dd) of the day the activity is scheduled — used for activity-level links */
  activityDate?: string;
}
const CIVITATIS_CITY_SLUGS: Record<string, string> = {
  'Paris': 'paris',
  'Roma': 'roma',
  'Lisboa': 'lisboa',
  'Londres': 'londres',
  'Barcelona': 'barcelona',
  'Nova York': 'nueva-york',
  'Buenos Aires': 'buenos-aires',
  'Cartagena': 'cartagena-de-indias',
  'Dubai': 'dubai',
  'Istambul': 'estambul',
  'Bangkok': 'bangkok',
  'Marrakech': 'marrakech',
  'Singapura': 'singapur',
  'Cidade do Cabo': 'ciudad-del-cabo',
  'Tóquio': 'tokio',
  'Orlando': 'orlando',
  'Fortaleza': 'fortaleza',
  'Rio de Janeiro': 'rio-de-janeiro',
  'Salvador': 'salvador-de-bahia',
  'Gramado': 'gramado',
  'Porto Seguro': 'porto-seguro',
};

const TRAVELPAYOUTS_MARKER = '742814';

function buildKiwiLink(
  origin: string,
  dest: string,
  startDate: Date,
  endDate: Date
): OfferLink | null {
  const departure = format(startDate, 'yyyy-MM-dd');
  const returnDate = format(endDate, 'yyyy-MM-dd');
  const kiwiUrl = `https://www.kiwi.com/deep?from=${origin.toUpperCase()}&to=${dest.toUpperCase()}&departure=${departure}&return=${returnDate}`;
  const encodedKiwiUrl = encodeURIComponent(kiwiUrl);

  return {
    partner: 'Kiwi',
    description: 'Busca pré-preenchida · parceiro KINU',
    url: `https://c111.travelpayouts.com/click?shmarker=${TRAVELPAYOUTS_MARKER}&promo_id=3791&source_type=customlink&type=click&custom_url=${encodedKiwiUrl}`,
    isAffiliate: true,
  };
}

function buildGoogleFlightsLink(
  origin: string,
  dest: string,
  startDate: Date,
  endDate: Date
): OfferLink | null {
  const start = format(startDate, 'yyyy-MM-dd');
  const end = format(endDate, 'yyyy-MM-dd');

  return {
    partner: 'Google Flights',
    description: 'Comparar voos · busca pronta',
    url: `https://www.google.com/travel/flights?q=Flights%20from%20${origin.toUpperCase()}%20to%20${dest.toUpperCase()}%20on%20${start}%20through%20${end}`,
    isAffiliate: false,
  };
}

function buildSkyscannerLink(
  origin: string,
  dest: string,
  startDate: Date,
  endDate: Date,
  travelers: number
): OfferLink | null {
  const start = format(startDate, 'yyMMdd');
  const end = format(endDate, 'yyMMdd');

  return {
    partner: 'Skyscanner',
    description: 'Comparar preços · agregador',
    url: `https://www.skyscanner.com.br/transport/flights/${origin.toLowerCase()}/${dest.toLowerCase()}/${start}/${end}/?adults=${travelers}`,
    isAffiliate: false,
  };
}

function buildDecolarLink(
  origin: string,
  dest: string,
  startDate: Date,
  endDate: Date,
  travelers: number
): OfferLink | null {
  return {
    partner: 'Decolar',
    description: 'Agregador brasileiro · busca pronta',
    url: `https://www.decolar.com/shop/flights/results/roundtrip/${origin.toUpperCase()}/${dest.toUpperCase()}/${format(startDate, 'yyyy-MM-dd')}/${format(endDate, 'yyyy-MM-dd')}/${travelers}/0/0`,
    isAffiliate: false,
  };
}

function buildBookingLink(
  city: string,
  startDate: Date,
  endDate: Date,
  travelers: number,
  hotelName?: string,
  isSecondary = false
): OfferLink | null {
  const checkin = format(startDate, 'yyyy-MM-dd');
  const checkout = format(endDate, 'yyyy-MM-dd');
  const query = hotelName ? `${hotelName} ${city}` : city;
  const description = isSecondary
    ? `Ver outros hotéis em ${city}`
    : hotelName
      ? 'Ver este hotel · busca pronta'
      : 'Reservar hospedagem · busca pronta';

  return {
    partner: 'Booking',
    description,
    url: `https://www.booking.com/searchresults.pt-br.html?ss=${encodeURIComponent(query)}&checkin=${checkin}&checkout=${checkout}&group_adults=${travelers}`,
    isAffiliate: false,
  };
}

function buildGoogleHotelsLink(city: string): OfferLink | null {
  if (!city) return null;

  return {
    partner: 'Google Hotels',
    description: 'Comparar hotéis · ajuste as datas no site',
    url: `https://www.google.com/travel/search?q=${encodeURIComponent('hotels in ' + city)}`,
    isAffiliate: false,
  };
}

function buildKlookLink(): OfferLink | null {
  return {
    partner: 'Klook',
    description: 'Tours e ingressos · parceiro KINU',
    url: 'https://klook.tpx.lv/xJuVbQrk',
    isAffiliate: true,
  };
}

function buildViatorLink(city: string, activityName?: string, _date?: Date): OfferLink | null {
  // Viator search does not accept a reliable date param — keep text search.
  // Ensure both activityName and city are present in the query when available.
  const text = activityName
    ? `${activityName} ${city || ''}`.trim()
    : city;
  const description = activityName
    ? 'Reservar esta atividade · busca pronta'
    : 'Passeios e atividades · busca pronta';

  return {
    partner: 'Viator',
    description,
    url: `https://www.viator.com/searchResults/all?text=${encodeURIComponent(text)}`,
    isAffiliate: false,
  };
}

function buildAirbnbLink(
  city: string,
  startDate?: Date,
  endDate?: Date,
  travelers?: number
): OfferLink | null {
  if (!city) return null;

  let url = `https://www.airbnb.com.br/s/${encodeURIComponent(city)}/homes`;

  if (startDate && endDate) {
    const checkin = format(startDate, 'yyyy-MM-dd');
    const checkout = format(endDate, 'yyyy-MM-dd');
    const adults = Math.max(1, travelers || 1);
    url = `${url}?checkin=${checkin}&checkout=${checkout}&adults=${adults}`;
  }

  return {
    partner: 'Airbnb',
    description: 'Estadias e apartamentos',
    url,
    isAffiliate: false,
  };
}

function buildGetYourGuideLink(
  city: string,
  activityName?: string,
  startDate?: Date,
  endDate?: Date
): OfferLink | null {
  if (!city) return null;
  const text = activityName ? `${activityName} ${city}` : city;

  let url = `https://www.getyourguide.com/s/?q=${encodeURIComponent(text)}`;

  if (startDate && endDate) {
    const dateFrom = startDate.toISOString().slice(0, 10);
    const dateTo = endDate.toISOString().slice(0, 10);
    url = `${url}&date_from=${dateFrom}&date_to=${dateTo}`;
  }

  return {
    partner: 'GetYourGuide',
    description: 'Passeios e ingressos',
    url,
    isAffiliate: false,
  };
}

function buildCivitatisLink(city: string): OfferLink | null {
  if (!city) return null;
  const slug = CIVITATIS_CITY_SLUGS[city];
  if (!slug) return null;

  return {
    partner: 'Civitatis',
    description: 'Tours em português',
    url: `https://www.civitatis.com/br/${slug}/`,
    isAffiliate: false,
  };
}

export function buildOfferLinks(params: OfferParams): OfferLink[] {
  const { category, travelers = 1 } = params;
  const links: OfferLink[] = [];

  switch (category) {
    case 'flight': {
      const origin = params.originCode?.trim();
      const dest = params.destinationCode?.trim();
      const start = params.startDate;
      const end = params.endDate;

      if (!origin || !dest || !start || !end) return [];

      const kiwi = buildKiwiLink(origin, dest, start, end);
      if (kiwi) links.push(kiwi);

      const decolar = buildDecolarLink(origin, dest, start, end, travelers);
      if (decolar) links.push(decolar);

      const google = buildGoogleFlightsLink(origin, dest, start, end);
      if (google) links.push(google);

      const skyscanner = buildSkyscannerLink(origin, dest, start, end, travelers);
      if (skyscanner) links.push(skyscanner);
      break;
    }

    case 'hotel': {
      const city = params.city?.trim();
      const hotelName = params.hotelName?.trim();
      const start = params.startDate;
      const end = params.endDate;

      if (!city) return [];

      if (start && end) {
        // Hotel-specific link when we know the property; otherwise the generic city search. Never both.
        const booking = hotelName
          ? buildBookingLink(city, start, end, travelers, hotelName)
          : buildBookingLink(city, start, end, travelers, undefined, true);
        if (booking) links.push(booking);
      }

      const googleHotels = buildGoogleHotelsLink(city);
      if (googleHotels) links.push(googleHotels);

      const airbnb = buildAirbnbLink(city, start, end, travelers);
      if (airbnb) links.push(airbnb);
      break;
    }

    case 'activity': {
      const city = params.city?.trim();
      const activityName = params.activityName?.trim();
      if (!city) return [];

      // Prefer the specific activity day; fall back to trip start/end for category-level links
      const activityDay = params.activityDate ? new Date(params.activityDate) : undefined;
      const gygStart = activityDay || params.startDate;
      const gygEnd = activityDay || params.endDate;

      const klook = buildKlookLink();
      if (klook) links.push(klook);

      const viator = buildViatorLink(city, activityName, activityDay);
      if (viator) links.push(viator);

      const getYourGuide = buildGetYourGuideLink(city, activityName, gygStart, gygEnd);
      if (getYourGuide) links.push(getYourGuide);

      const civitatis = buildCivitatisLink(city);
      if (civitatis) links.push(civitatis);
      break;
    }
  }

  return links.slice(0, 5);
}

// C.8 — "Onde fechar ▸": o KINU decide e leva ao provedor com rota, datas e pax na URL.
// Só padrões de URL conhecidos; provedor que não aceita data na URL não entra (Google Hotels,
// Civitatis, home de cia aérea). `partner` = afiliado ativo (o KINU ganha comissão).

export interface CloseLink {
  provider: string;
  label: 'parceiro KINU' | 'link direto' | 'site oficial';
  url: string;
  partner: boolean;
}

export const CLOSE_DISCLOSURE =
  'O KINU não vende passagens nem reservas: ele monta a rota e te leva ao provedor com as datas certas. Parceiro KINU = o KINU ganha uma comissão sem custo pra você.';

export type CloseKind = 'voo' | 'hotel' | 'passeio';

export interface CloseCtx {
  /** voo: IATA */
  origin?: string;
  destination?: string;
  /** hotel/passeio */
  city?: string;
  hotelName?: string;
  name?: string;
  /** passeio: modo e URL do catálogo (`CURATED_BOOKING`) */
  mode?: string | null;
  bookingUrl?: string;
  /** voo: ida/volta · hotel: check-in/out · passeio: dia (start) */
  start?: Date;
  end?: Date;
  pax?: number;
  /** voo: companhia da oferta escolhida */
  airline?: string;
}

const ymd = (d: Date) => format(d, 'yyyy-MM-dd');
const validDate = (d?: Date): d is Date => d instanceof Date && !Number.isNaN(d.getTime());
const direct = (provider: string, url: string): CloseLink => ({ provider, label: 'link direto', url, partner: false });

/** Cias com deep link datado conhecido. Azul/GOL/TAP ficam fora até termos o padrão (nunca a home). */
function airlineLink(airline: string | undefined, o: string, d: string, s: Date, e: Date, pax: number): CloseLink | null {
  const a = (airline || '').toLowerCase();
  if (/\blatam\b/.test(a)) {
    const iso = (x: Date) => `${ymd(x)}T12:00:00.000Z`;
    return direct('LATAM', `https://www.latamairlines.com/br/pt/oferta-voos?origin=${o}&destination=${d}&outbound=${encodeURIComponent(iso(s))}&inbound=${encodeURIComponent(iso(e))}&adt=${pax}&chd=0&inf=0&trip=RT&cabin=Economy`);
  }
  return null;
}

export function buildCloseLinks(kind: CloseKind, ctx: CloseCtx): CloseLink[] {
  const pax = Math.max(1, Math.round(Number(ctx.pax) || 1));
  const { start, end } = ctx;

  if (kind === 'voo') {
    const o = ctx.origin?.trim().toUpperCase();
    const d = ctx.destination?.trim().toUpperCase();
    if (!o || !d || !/^[A-Z]{3}$/.test(o) || !/^[A-Z]{3}$/.test(d) || !validDate(start) || !validDate(end)) return [];
    const kiwi = `https://www.kiwi.com/deep?from=${o}&to=${d}&departure=${ymd(start)}&return=${ymd(end)}&adults=${pax}`;
    const links: CloseLink[] = [
      {
        provider: 'Kiwi', label: 'parceiro KINU', partner: true,
        url: `https://c111.travelpayouts.com/click?shmarker=${TRAVELPAYOUTS_MARKER}&promo_id=3791&source_type=customlink&type=click&custom_url=${encodeURIComponent(kiwi)}`,
      },
      // C.9 (0a): Google Flights saiu — a URL por texto não leva data/pax no celular.
      direct('Decolar', `https://www.decolar.com/shop/flights/results/roundtrip/${o}/${d}/${ymd(start)}/${ymd(end)}/${pax}/0/0`),
      direct('Skyscanner', `https://www.skyscanner.com.br/transport/flights/${o.toLowerCase()}/${d.toLowerCase()}/${format(start, 'yyMMdd')}/${format(end, 'yyMMdd')}/?adults=${pax}`),
    ];
    const cia = airlineLink(ctx.airline, o, d, start, end, pax);
    if (cia) links.push(cia);
    return links;
  }

  if (kind === 'hotel') {
    const city = ctx.city?.trim();
    if (!city || !validDate(start) || !validDate(end)) return [];
    const hotel = ctx.hotelName?.trim();
    const q = hotel ? `${hotel} ${city}` : city;
    return [
      direct('Booking', `https://www.booking.com/searchresults.pt-br.html?ss=${encodeURIComponent(q)}&checkin=${ymd(start)}&checkout=${ymd(end)}&group_adults=${pax}&no_rooms=1`),
      direct('Hoteis.com', `https://www.hoteis.com/Hotel-Search?destination=${encodeURIComponent(q)}&startDate=${ymd(start)}&endDate=${ymd(end)}&adults=${pax}`),
      direct('Airbnb', `https://www.airbnb.com.br/s/${encodeURIComponent(city)}/homes?checkin=${ymd(start)}&checkout=${ymd(end)}&adults=${pax}`),
    ];
  }

  // passeio: só o que se reserva online — walk_in/included/phone/null não ganham link.
  if (ctx.mode !== 'online' && ctx.mode !== 'partner') return [];
  const city = ctx.city?.trim();
  const name = ctx.name?.trim();
  const links: CloseLink[] = [];
  if (ctx.bookingUrl) {
    links.push({
      provider: 'Site oficial', url: ctx.bookingUrl,
      label: ctx.mode === 'partner' ? 'parceiro KINU' : 'site oficial', partner: ctx.mode === 'partner',
    });
  }
  if (city && name) {
    const q = encodeURIComponent(`${name} ${city}`);
    links.push(direct('Klook', `https://www.klook.com/pt-BR/search/result/?query=${q}`));
    const day = validDate(start) ? `&date_from=${ymd(start)}&date_to=${ymd(start)}` : '';
    links.push(direct('GetYourGuide', `https://www.getyourguide.com/s/?q=${q}${day}`));
  }
  return links;
}
