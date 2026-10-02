// createTrip — shared draft trip builder used by wizard and KINU AI.
// Logic extracted verbatim from NewPlanningWizard.handleGenerateDraft + generateDays.

import { differenceInDays, differenceInCalendarDays, addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getActivityPrice, calculateTripEstimate } from '@/lib/activityPricing';
import { getIdealHotelZone, getHotelRecommendation } from '@/lib/hotelZones';
import { pickCuratedHotelForTrip, nightlyRateFor, curatedAccommodationFields } from '@/lib/hotelSwap';
import { getDestinationThemes, getDestinationActivities } from '@/data/destinationActivities';
import type { SuggestedActivity } from '@/data/destinationActivities';
import { getTopMichelinForCity } from '@/lib/michelinData';
import { createPlaceUsageTracker, pickReusableByGap } from '@/lib/placeIdentity';
import type { PriceLevel } from '@/lib/activityPricing';
import { defaultChecklist, FLIGHT_DURATION, calculateArrivalTime, calculateJetLagImpact } from '@/types/trip';
import type { SavedTrip, TripDay, TripActivity, ActivityStatus, TripFinances } from '@/types/trip';
import { findCityInfo } from '@/data/destinationCatalog';
import { BUDGET_TIERS } from '@/components/wizard/types';
import { newTripId } from '@/lib/tripStore';
import { buildPlannedFlights, plannedFlightToSelected } from '@/lib/flightModel';
import { buildItineraryForTrip, financesFromBuckets } from '@/lib/draftItinerary';

export interface DraftTripInput {
  originCity: string;
  originAirportCode?: string;
  destinationCity: string;
  destinationAirportCode?: string;
  destinationTimezoneId?: string;
  destinationTimezone?: string | null;
  selectedCountry?: string;
  hasDirectFlight?: boolean;
  departureDate: Date;
  returnDate: Date;
  adults: number;
  children: unknown[];
  infants: number;
  budgetTier: string;
  travelStyle: string;
  budgetAmount: number;
  travelInterests?: string[];
  priorities: string[];
  biologyAIEnabled?: boolean;
}

export async function buildDraftTrip(input: DraftTripInput): Promise<SavedTrip> {
  if (!input.departureDate || !input.returnDate) throw new Error('Datas não definidas');

  const tripId = newTripId();
  const destinationCity = input.destinationCity;
  const duration = differenceInDays(input.returnDate, input.departureDate) + 1;
  const totalNights = Math.max(1, duration - 1);
  const totalTravelers = input.adults + input.children.length + input.infants;

  // Map budget tier to price level
  const tier = BUDGET_TIERS.find(t => t.id === input.budgetTier)!;
  const priceLevel: PriceLevel = tier.priceLevel;
  const tierMultiplier = tier.multiplier;

  const tzDiff = getTimezoneDiff(destinationCity);
  const jetLagImpact = calculateJetLagImpact(tzDiff);
  const jetLagMode = input.biologyAIEnabled || jetLagImpact.level !== 'BAIXO';
  const jetLagSeverity = jetLagImpact.level;

  // Calculate flight duration
  const flightHours = getFlightDuration(input.originCity || 'São Paulo', destinationCity, tzDiff);
  const isLongHaul = flightHours > 10;
  // O que faz um voo ser noturno é a DIREÇÃO, não só a duração. A regra antiga
  // (`> 6h => 21:00`) foi calibrada no transatlântico para leste — GRU→Lisboa sai
  // à noite mesmo — e por tabela mandava para a madrugada tudo que passasse de 6h,
  // inclusive as 7,5h de GRU→Cartagena, que na vida real é voo de dia. tzDiff >= 3
  // separa Europa/África/Ásia das Américas, que ficam no diurno.
  const isEastboundOvernight = tzDiff >= 3;
  const departureTime = isLongHaul ? '23:00' : (flightHours > 6 && isEastboundOvernight ? '21:00' : '08:00');

  // Calculate arrival
  const { arrivalTime, arrivalDate: arrDate } = calculateArrivalTime(
    departureTime, input.departureDate, flightHours, tzDiff
  );
  // Dia de chegada = diferença de CALENDÁRIO entre a chegada calculada e a partida.
  // Vale 0 quando o voo não cruza a meia-noite — o caso que o antigo
  // `flightHours > 18 ? 2 : 1` tornava inexprimível, e que punha voo diurno curto
  // (GRU→Cartagena 08:00) chegando no D2 com a hora do D1. A resposta já vinha
  // pronta de calculateArrivalTime; só não estava ligada.
  // Clamp [0,3]: protege contra fuso extremo e duração absurda vinda da tabela.
  const arrivalDaysLater = Math.max(0, Math.min(3,
    differenceInCalendarDays(arrDate, input.departureDate)));

  // O hotel da viagem sai da CURADORIA quando a cidade tem um curado do tier pedido
  // (33 das 84 células cidade×tier, medido). Antes deste ponto o gerador lia só
  // HOTEL_RECOMMENDATIONS e servia `Novotel Cartagena` com 10 curados ao lado — o
  // produto mentindo sobre a pílula "Escolhido pelo KINU".
  //
  // `budgetTier` vem do INPUT de propósito: o SavedTrip guarda `budgetType:
  // travelStyle`, que não é tier — dívida anotada no relatório, junto das de
  // src/types/.
  const curatedHotel = pickCuratedHotelForTrip(destinationCity, {
    budgetTier: input.budgetTier,
    travelers: totalTravelers,
    travelInterests: input.travelInterests || [],
  });

  // A diária do curado é o PONTO MÉDIO da faixa (a curadoria tem faixa, não número);
  // sem curado, a estimativa de sempre.
  const baseHotelNightPrice = Math.round(getActivityPrice('hotel_night', destinationCity, priceLevel) * tierMultiplier);
  const hotelNightPrice = curatedHotel ? nightlyRateFor(curatedHotel, baseHotelNightPrice) : baseHotelNightPrice;
  const budgetTotal = input.budgetAmount || 0;


  const flightPrice = Math.round((getActivityPrice('flight', destinationCity, priceLevel) * tierMultiplier) / 2);

  const cityInfo = findCityInfo(destinationCity);

  const idealZone = getIdealHotelZone(destinationCity, input.travelInterests || []);
  const hotelRec = getHotelRecommendation(destinationCity, input.budgetTier, input.travelInterests || []);

  const hotelName = hotelRec
    ? `${hotelRec.name} — ${hotelRec.neighborhood}, ${destinationCity}`
    : idealZone
      ? `Hotel em ${idealZone.neighborhood}, ${destinationCity}`
      : `Hotel em ${destinationCity}`;

  const trip: SavedTrip = {
    id: tripId,
    status: 'draft',
    destination: destinationCity,
    origin: input.originCity,
    originAirportCode: input.originAirportCode || 'GRU',
    destinationAirportCode: input.destinationAirportCode || '',
    country: cityInfo?.country.country || input.selectedCountry || getCountryForCity(destinationCity),
    emoji: getDestinationEmoji(destinationCity),
    startDate: input.departureDate.toISOString(),
    endDate: input.returnDate.toISOString(),
    budget: budgetTotal,
    budgetType: input.travelStyle,
    travelers: totalTravelers,
    priorities: input.priorities,
    progress: 0,
    timezone: {
      origin: 'America/Sao_Paulo',
      destination: input.destinationTimezoneId || input.destinationTimezone || 'Europe/Rome',
      diff: tzDiff,
    },
    jetLagMode,
    jetLagSeverity: jetLagImpact.level,
    jetLagDescription: jetLagImpact.description,
    travelInterests: input.travelInterests || [],
    flights: buildPlannedFlights({
      originCode: input.originAirportCode || 'GRU',
      destinationCode: input.destinationAirportCode || destinationCity,
      departureDate: input.departureDate,
      returnDate: input.returnDate,
      departureTime,
      arrivalTime,
      arrivalDaysLater,
      flightHours,
      tzDiff,
      hasDirectFlight: input.hasDirectFlight,
      legPrice: flightPrice,
    }) as SavedTrip['flights'],
    // Hotel curado quando existe (nome puro, zona, tip e curatedHotelId vêm do mesmo
    // helper que a troca do usuário usa); senão o bloco de sempre. `curatedHotelId`
    // entra por fora do tipo, como `mealPlan` já entrava (recon §4.6).
    accommodation: {
      id: 'hotel-main',
      // `chosenBy: 'kinu'` nos DOIS caminhos: curado ou HOTEL_RECOMMENDATIONS, quem
      // escolheu foi o app. É o que autoriza o bloco do roteiro a dizer "Escolhido
      // porque" sem mentir — e a NÃO dizer isso depois que o usuário trocar.
      ...(curatedHotel
        ? curatedAccommodationFields(
            curatedHotel,
            {
              description: hotelRec?.whyGood || idealZone?.whyGood || '',
              stars: hotelRec?.stars,
            },
            'kinu',
          )
        : {
            name: hotelName,
            neighborhood: hotelRec?.neighborhood || idealZone?.neighborhood || '',
            description: hotelRec?.whyGood || idealZone?.whyGood || '',
            stars: hotelRec?.stars || (priceLevel === 'luxury' ? 5 : priceLevel === 'midrange' ? 4 : 3),
            chosenBy: 'kinu' as const,
          }),
      checkIn: addDays(input.departureDate, arrivalDaysLater).toISOString(),
      checkOut: input.returnDate.toISOString(),
      nightlyRate: hotelNightPrice,
      totalNights,
      totalPrice: hotelNightPrice * totalNights,
      status: 'planned' as ActivityStatus,
    } as SavedTrip['accommodation'],
    days: [],
    finances: financesFromBuckets({ flightsPlanned: 0, hotelPlanned: 0, foodPlanned: 0, toursPlanned: 0, totalPlanned: 0 }, budgetTotal),
    checklist: defaultChecklist.map(item => ({ ...item })),
    createdAt: new Date().toISOString(),
  };

  // O rascunho É o roteiro: voos planejados → SelectedFlight (estimativa) → motor único.
  const outboundFlight = plannedFlightToSelected(trip.flights.outbound, input.departureDate);
  const returnFlight = plannedFlightToSelected(trip.flights.return, input.returnDate);
  const built = buildItineraryForTrip(trip, { outbound: outboundFlight, return: returnFlight }, { priceLevel });

  return {
    ...trip,
    budget: built.budget,
    days: built.days,
    finances: built.finances,
    outboundFlight,
    returnFlight,
    flightsSelected: false,
    priceLevel,
    engineItemIds: built.engineItemIds,
  } as SavedTrip;
}

// ─── Helper Functions ───

function getFlightDuration(origin: string, destination: string, tzDiff?: number): number {
  const key1 = `São Paulo-${destination}`;
  const key2 = `Brasil-${destination}`;
  if (FLIGHT_DURATION[key1]) return FLIGHT_DURATION[key1];
  if (FLIGHT_DURATION[key2]) return FLIGHT_DURATION[key2];
  const key3 = `${origin}-${destination}`;
  if (FLIGHT_DURATION[key3]) return FLIGHT_DURATION[key3];

  const absDiff = Math.abs(tzDiff ?? 4);
  if (absDiff <= 2) return 4;
  if (absDiff <= 5) return 11;
  if (absDiff <= 8) return 15;
  if (absDiff <= 12) return 22;
  return 24;
}

function getTimezoneDiff(city: string): number {
  const cityInfo = findCityInfo(city);
  if (!cityInfo) return 4;

  const destTz = cityInfo.city.timezone;
  const spTz = 'America/Sao_Paulo';

  try {
    const now = new Date();
    const destTime = new Date(now.toLocaleString('en-US', { timeZone: destTz }));
    const spTime = new Date(now.toLocaleString('en-US', { timeZone: spTz }));
    const diffMs = destTime.getTime() - spTime.getTime();
    return Math.round(diffMs / (1000 * 60 * 60));
  } catch {
    return 4;
  }
}

function getCountryForCity(city: string): string {
  const info = findCityInfo(city);
  return info?.country.country ?? '';
}

function getDestinationEmoji(destination: string): string {
  const emojiMap: Record<string, string> = {
    'Tóquio': '🏯', 'Kyoto': '⛩️', 'Osaka': '🏯',
    'Paris': '🗼', 'Roma': '🏛️', 'Lisboa': '🚃',
    'Bangkok': '🛕', 'Barcelona': '🏖️', 'Nova York': '🗽',
    'Londres': '🎡', 'Dubai': '🏙️', 'Singapura': '🌆',
    'Sydney': '🦘', 'Buenos Aires': '💃', 'Cancún': '🏖️',
    'Miami': '🌴', 'Amsterdã': '🌷', 'Berlim': '🏗️',
    'Praga': '🏰', 'Istambul': '🕌', 'Cairo': '🏺',
    'Marrakech': '🕌', 'Seul': '🏯', 'Auckland': '🗻',
    'Rio de Janeiro': '🏖️', 'Salvador': '🎭', 'Florianópolis': '🏖️',
    'Cartagena': '🏰',
    'Havana': '🇨🇺', 'Cusco': '🏔️', 'Bariloche': '⛷️',
    'Santorini': '🏝️', 'Dubrovnik': '🏰', 'Veneza': '🛶',
    'Malé': '🏝️', 'Phuket': '🏖️',
  };
  return emojiMap[destination] || '✈️';
}
