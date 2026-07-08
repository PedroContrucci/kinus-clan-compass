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
}

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

function buildGoogleHotelsLink(
  city: string,
  startDate: Date,
  endDate: Date,
  hotelName?: string
): OfferLink | null {
  const checkin = format(startDate, 'yyyy-MM-dd');
  const checkout = format(endDate, 'yyyy-MM-dd');
  const query = hotelName ? `${hotelName} ${city}` : city;

  return {
    partner: 'Google Hotels',
    description: hotelName ? 'Ver este hotel · busca pronta' : 'Comparar hotéis · busca pronta',
    url: `https://www.google.com/travel/hotels/${encodeURIComponent(city)}?q=${encodeURIComponent(query)}&checkin=${checkin}&checkout=${checkout}`,
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

function buildViatorLink(city: string, activityName?: string): OfferLink | null {
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

      if (!city || !start || !end) return [];

      const booking = buildBookingLink(city, start, end, travelers, hotelName);
      if (booking) links.push(booking);

      const googleHotels = buildGoogleHotelsLink(city, start, end, hotelName);
      if (googleHotels) links.push(googleHotels);

      if (hotelName) {
        const generic = buildBookingLink(city, start, end, travelers, undefined, true);
        if (generic) links.push(generic);
      }
      break;
    }

    case 'activity': {
      const city = params.city?.trim();
      const activityName = params.activityName?.trim();
      if (!city) return [];

      const klook = buildKlookLink();
      if (klook) links.push(klook);

      const viator = buildViatorLink(city, activityName);
      if (viator) links.push(viator);
      break;
    }
  }

  return links.slice(0, 3);
}
