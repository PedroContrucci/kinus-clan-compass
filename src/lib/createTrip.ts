// createTrip — shared draft trip builder used by wizard and KINU AI.
// Logic extracted verbatim from NewPlanningWizard.handleGenerateDraft + generateDays.

import { differenceInDays, addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getActivityPrice, calculateTripEstimate } from '@/lib/activityPricing';
import { getIdealHotelZone, getHotelRecommendation } from '@/lib/hotelZones';
import { getDestinationThemes, getDestinationActivities } from '@/data/destinationActivities';
import type { SuggestedActivity } from '@/data/destinationActivities';
import { getTopMichelinForCity } from '@/lib/michelinData';
import type { PriceLevel } from '@/lib/activityPricing';
import { defaultChecklist, FLIGHT_DURATION, calculateArrivalTime, calculateJetLagImpact } from '@/types/trip';
import type { SavedTrip, TripDay, TripActivity, ActivityStatus, TripFinances } from '@/types/trip';
import { findCityInfo } from '@/data/destinationCatalog';
import { BUDGET_TIERS } from '@/components/wizard/types';

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

  const tripId = `trip-${Date.now()}`;
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
  const departureTime = isLongHaul ? '23:00' : (flightHours > 6 ? '21:00' : '08:00');

  // Calculate arrival
  const { arrivalTime, arrivalDate: arrDate, nextDay } = calculateArrivalTime(
    departureTime, input.departureDate, flightHours, tzDiff
  );
  const flightArrivalDate = arrDate;
  // For very long flights (>18h), arrival might be 2 days later
  const arrivalDaysLater = flightHours > 18 ? 2 : 1;

  // Generate days
  const days = generateDays(destinationCity, duration, input.departureDate, input.returnDate, priceLevel, jetLagMode, totalTravelers, tierMultiplier, jetLagSeverity, departureTime, arrivalTime, flightHours, input.travelInterests || []);

  // Calculate finances from generated days
  const estimate = calculateTripEstimate(destinationCity, duration, totalTravelers, priceLevel);
  const toursCost = sumCostsByCategory(days, 'passeio');
  const foodCost = sumCostsByCategory(days, 'comida');
  const transportCost = sumCostsByCategory(days, 'transporte');
  const totalPlanned = Math.round((estimate.flights + estimate.hotel + toursCost + foodCost + transportCost) * tierMultiplier);
  const budgetTotal = input.budgetAmount || totalPlanned;

  const finances: TripFinances = {
    total: budgetTotal,
    confirmed: 0,
    bidding: 0,
    planned: totalPlanned,
    available: Math.max(0, budgetTotal - totalPlanned),
    categories: {
      flights: { planned: Math.round(estimate.flights * tierMultiplier), confirmed: 0, bidding: 0 },
      accommodation: { planned: Math.round(estimate.hotel * tierMultiplier), confirmed: 0, bidding: 0 },
      tours: { planned: Math.round(toursCost * tierMultiplier), confirmed: 0, bidding: 0 },
      food: { planned: Math.round(foodCost * tierMultiplier), confirmed: 0, bidding: 0 },
      transport: { planned: Math.round(transportCost * tierMultiplier), confirmed: 0, bidding: 0 },
      shopping: { planned: 0, confirmed: 0, bidding: 0 },
    },
  };

  const flightPrice = Math.round((getActivityPrice('flight', destinationCity, priceLevel) * tierMultiplier) / 2);
  const hotelNightPrice = Math.round(getActivityPrice('hotel_night', destinationCity, priceLevel) * tierMultiplier);

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
    flights: {
      outbound: {
        id: 'flight-outbound',
        airline: 'A confirmar',
        flightNumber: '---',
        origin: input.originAirportCode || 'GRU',
        destination: input.destinationAirportCode || destinationCity,
        departureDate: input.departureDate.toISOString(),
        departureTime: departureTime,
        arrivalDate: addDays(input.departureDate, arrivalDaysLater).toISOString(),
        arrivalTime: arrivalTime,
        duration: `${flightHours}h`,
        stops: input.hasDirectFlight ? 0 : 1,
        price: flightPrice,
        status: 'planned' as ActivityStatus,
      },
      return: {
        id: 'flight-return',
        airline: 'A confirmar',
        flightNumber: '---',
        origin: input.destinationAirportCode || destinationCity,
        destination: input.originAirportCode || 'GRU',
        departureDate: input.returnDate.toISOString(),
        departureTime: '14:00',
        arrivalDate: input.returnDate.toISOString(),
        arrivalTime: calculateArrivalTime('14:00', input.returnDate, flightHours, -tzDiff).arrivalTime,
        duration: `${flightHours}h`,
        stops: input.hasDirectFlight ? 0 : 1,
        price: flightPrice,
        status: 'planned' as ActivityStatus,
      },
    },
    accommodation: {
      id: 'hotel-main',
      name: hotelName,
      neighborhood: hotelRec?.neighborhood || idealZone?.neighborhood || '',
      description: hotelRec?.whyGood || idealZone?.whyGood || '',
      stars: hotelRec?.stars || (priceLevel === 'luxury' ? 5 : priceLevel === 'midrange' ? 4 : 3),
      checkIn: addDays(input.departureDate, 1).toISOString(),
      checkOut: input.returnDate.toISOString(),
      nightlyRate: hotelNightPrice,
      totalNights,
      totalPrice: hotelNightPrice * totalNights,
      status: 'planned' as ActivityStatus,
    },
    days,
    finances,
    checklist: defaultChecklist.map(item => ({ ...item })),
    createdAt: new Date().toISOString(),
  };

  return trip;
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
    'Havana': '🇨🇺', 'Cusco': '🏔️', 'Bariloche': '⛷️',
    'Santorini': '🏝️', 'Dubrovnik': '🏰', 'Veneza': '🛶',
    'Malé': '🏝️', 'Phuket': '🏖️',
  };
  return emojiMap[destination] || '✈️';
}

function sumCostsByCategory(days: TripDay[], category: string): number {
  return days.reduce((total, day) => {
    return total + day.activities
      .filter(a => a.category === category)
      .reduce((sum, a) => sum + (a.cost || 0), 0);
  }, 0);
}

function generateDays(
  city: string,
  duration: number,
  departureDate: Date,
  returnDate: Date,
  priceLevel: PriceLevel,
  jetLagMode: boolean,
  travelers: number = 1,
  tierMultiplier: number = 1.0,
  jetLagSeverity: 'BAIXO' | 'MODERADO' | 'ALTO' | 'SEVERO' = 'BAIXO',
  smartDepartureTime: string = '23:00',
  smartArrivalTime: string = '11:00',
  flightHours: number = 12,
  travelInterests: string[] = [],
): TripDay[] {
  const days: TripDay[] = [];
  // EXP (attraction) activities must NEVER repeat within a trip.
  const usedExpIds = new Set<string>();
  // Restaurants: may repeat only after pool exhausted, never consecutive days.
  const restaurantUsage: Record<'breakfast' | 'lunch' | 'dinner', { used: Set<string>; lastDay: Map<string, number> }> = {
    breakfast: { used: new Set(), lastDay: new Map() },
    lunch: { used: new Set(), lastDay: new Map() },
    dinner: { used: new Set(), lastDay: new Map() },
  };

  const themeStyleMap: Record<string, string[]> = {
    'Cultura': ['culture', 'history', 'art'],
    'Gastronomia': ['gastronomy'],
    'Passeios': ['nature', 'romantic', 'shopping'],
    'Aventura': ['adventure', 'nature'],
    'Descobertas': ['culture', 'shopping', 'art'],
  };

  type ExpPick = { activity: SuggestedActivity | null; isFreeSlot: boolean };

  function pickExp(category: 'morning' | 'afternoon' | 'night', destination: string, themeName: string): ExpPick {
    const pool = getDestinationActivities(destination);
    const targetTags = themeStyleMap[themeName] || [];
    let candidates = pool.filter(a =>
      a.category === category &&
      !usedExpIds.has(a.id) &&
      (targetTags.length === 0 || a.styleTags?.some(t => targetTags.includes(t)))
    );
    if (candidates.length === 0) {
      candidates = pool.filter(a => a.category === category && !usedExpIds.has(a.id));
    }
    if (candidates.length === 0) {
      // Pool exhausted — never recycle EXP; return a curated free-slot marker.
      const freeName = category === 'morning'
        ? 'Manhã livre — explore por conta'
        : category === 'afternoon'
          ? 'Tarde livre — explore por conta'
          : 'Fim de tarde livre — explore por conta';
      const freeActivity = {
        id: `__free__-${category}`,
        name: freeName,
        category,
        description: 'Dia para revisitar o que amou ou descobrir o bairro do hotel no seu ritmo',
        tips: ['Dia para revisitar o que amou ou descobrir o bairro do hotel no seu ritmo'],
        styleTags: [],
      } as unknown as SuggestedActivity;
      return { activity: freeActivity, isFreeSlot: true };
    }
    const picked = candidates[0];
    usedExpIds.add(picked.id);
    return { activity: picked, isFreeSlot: false };
  }

  function pickRestaurant(category: 'breakfast' | 'lunch' | 'dinner', destination: string, themeName: string, dayNum: number): SuggestedActivity | null {
    const pool = getDestinationActivities(destination);
    const targetTags = themeStyleMap[themeName] || [];
    const state = restaurantUsage[category];
    const notConsecutive = (a: SuggestedActivity) => (state.lastDay.get(a.id) ?? -99) < dayNum - 1;

    // 1) themed, unused, not consecutive
    let candidates = pool.filter(a =>
      a.category === category &&
      !state.used.has(a.id) &&
      notConsecutive(a) &&
      (targetTags.length === 0 || a.styleTags?.some(t => targetTags.includes(t)))
    );
    // 2) any unused, not consecutive
    if (candidates.length === 0) {
      candidates = pool.filter(a => a.category === category && !state.used.has(a.id) && notConsecutive(a));
    }
    // 3) pool exhausted — allow repeats but never consecutive
    if (candidates.length === 0) {
      candidates = pool.filter(a => a.category === category && notConsecutive(a));
    }
    // 4) final safety fallback
    if (candidates.length === 0) {
      candidates = pool.filter(a => a.category === category);
    }
    if (candidates.length === 0) return null;
    const picked = candidates[0];
    state.used.add(picked.id);
    state.lastDay.set(picked.id, dayNum);
    return picked;
  }

  const [depH] = smartDepartureTime.split(':').map(Number);
  const checkInH = Math.max(0, depH - (flightHours > 10 ? 3 : 2));
  const checkInTime = `${checkInH.toString().padStart(2, '0')}:00`;

  const [arrH, arrM] = smartArrivalTime.split(':').map(Number);
  const transferFinishH = arrH + 2;
  const checkInHotelH = transferFinishH + 1;

  const fmtTime = (h: number, m = 0) => `${Math.min(23, Math.max(0, h)).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

  const needsTransitDay = flightHours >= 20;

  for (let i = 0; i < duration; i++) {
    const dayNum = i + 1;
    const dayDate = addDays(departureDate, i);
    const dateStr = format(dayDate, "dd/MM (EEEE)", { locale: ptBR });

    const isArrivalDay = (!needsTransitDay && dayNum === 2) || (needsTransitDay && dayNum === 3);
    const isRecoveryDay = (needsTransitDay && dayNum === 4 && jetLagSeverity === 'SEVERO') ||
                          (!needsTransitDay && dayNum === 3 && jetLagSeverity === 'SEVERO');

    if (dayNum === 1) {
      days.push({
        day: dayNum,
        date: dateStr,
        title: 'Embarque ✈️',
        icon: '✈️',
        activities: [
          { ...makeActivity(`act-${dayNum}-1`, checkInTime, 'Check-in aeroporto', 'Apresentar documentação e despachar bagagem', '2h', 'transporte', city, 'free', priceLevel, travelers, tierMultiplier), isHeroItem: true },
          { ...makeActivity(`act-${dayNum}-2`, smartDepartureTime, `Voo ${city}`, `Voo de ida para ${city}`, `${flightHours}h`, 'voo', city, 'flight', priceLevel, travelers, tierMultiplier), isHeroItem: true },
        ],
      });
    } else if (needsTransitDay && dayNum === 2) {
      days.push({
        day: dayNum,
        date: dateStr,
        title: 'Em Trânsito ✈️',
        icon: '✈️',
        activities: [
          { ...makeActivity(`act-${dayNum}-1`, '00:00', `Voo para ${city}`,
            `Em voo — duração total: ${flightHours}h. Hidrate-se, levante a cada 2h e ajuste o relógio para o horário local.`,
            `${flightHours}h`, 'voo', city, 'free', priceLevel, travelers, tierMultiplier), isHeroItem: true },
        ],
      });
    } else if (isArrivalDay) {
      const arrivalThemes = getDestinationThemes(city);
      const arrivalTheme = arrivalThemes[0];
      const activities: TripActivity[] = [
        { ...makeActivity(`act-${dayNum}-1`, smartArrivalTime, `Chegada em ${city}`, 'Desembarque e imigração', '1h30', 'transporte', city, 'free', priceLevel, travelers, tierMultiplier), isHeroItem: true },
        makeActivity(`act-${dayNum}-2`, fmtTime(transferFinishH - 1, 30), 'Transfer para hotel', 'Transporte do aeroporto ao hotel', '1h', 'transporte', city, 'transfer', priceLevel, travelers, tierMultiplier),
        { ...makeActivity(`act-${dayNum}-3`, fmtTime(checkInHotelH), 'Check-in no hotel', 'Acomodação e descanso', '1h', 'hotel', city, 'free', priceLevel, travelers, tierMultiplier), isHeroItem: true },
      ];

      if (checkInHotelH >= 22) {
        activities.push(
          makeActivity(`act-${dayNum}-4`, fmtTime(Math.min(23, checkInHotelH + 1)), 'Room service — chegada tardia', 'Incluso na diária do hotel', '1h', 'comida', city, 'free', priceLevel, travelers, tierMultiplier, true),
        );
        days.push({ day: dayNum, date: dateStr, title: 'Chegada 🛬', icon: '🛬', activities });
      } else if (jetLagSeverity === 'SEVERO') {
        const restStartH = checkInHotelH + 1;
        const dinnerH = Math.max(19, Math.min(22, restStartH + 2));
        activities.push(
          makeActivity(`act-${dayNum}-4`, fmtTime(restStartH), 'Descanso obrigatório — fuso horário severo', `Diferença de fuso significativa. Seu corpo precisa de descanso completo.`, `${Math.max(1, dinnerH - restStartH)}h`, 'hotel', city, 'free', priceLevel, travelers, tierMultiplier, true),
          makeActivity(`act-${dayNum}-5`, fmtTime(dinnerH), 'Room service ou restaurante do hotel', 'Incluso na diária do hotel', '1h', 'comida', city, 'free', priceLevel, travelers, tierMultiplier, true),
        );
        days.push({ day: dayNum, date: dateStr, title: 'Chegada 🛬', icon: '🛬', activities });
      } else if (jetLagSeverity === 'ALTO') {
        const restStartH = checkInHotelH + 1;
        const dinnerH = Math.max(19, Math.min(22, restStartH + 3));
        activities.push(
          makeActivity(`act-${dayNum}-4`, fmtTime(restStartH), 'Descanso e adaptação ao fuso', 'Descanso no hotel para adaptação ao novo fuso horário', '3h', 'hotel', city, 'free', priceLevel, travelers, tierMultiplier, true),
          makeActivity(`act-${dayNum}-5`, fmtTime(dinnerH), `Jantar leve próximo ao hotel`, 'Refeição leve na região do hotel', '1h30', 'comida', city, 'restaurant_dinner', priceLevel, travelers, tierMultiplier, true),
        );
        days.push({ day: dayNum, date: dateStr, title: 'Chegada 🛬', icon: '🛬', activities });
      } else if (jetLagMode) {
        const actStartH = checkInHotelH + 1;
        const dinnerH = Math.max(19, Math.min(22, actStartH + 2 + 1));
        activities.push(
          makeActivity(`act-${dayNum}-4`, fmtTime(actStartH, 30), arrivalTheme.activities[0], '', '2h', 'passeio', city, 'museum', priceLevel, travelers, tierMultiplier, true),
          makeActivity(`act-${dayNum}-5`, fmtTime(dinnerH), `Jantar: ${arrivalTheme.restaurants.dinner}`, '', '1h30', 'comida', city, 'restaurant_dinner', priceLevel, travelers, tierMultiplier),
        );
        days.push({ day: dayNum, date: dateStr, title: 'Chegada 🛬', icon: '🛬', activities });
      } else {
        const actStartH = checkInHotelH + 1;
        const dinnerH = Math.max(19, Math.min(22, actStartH + 3 + 1));
        activities.push(
          makeActivity(`act-${dayNum}-4`, fmtTime(actStartH, 30), arrivalTheme.activities[0], '', '3h', 'passeio', city, 'museum', priceLevel, travelers, tierMultiplier),
          makeActivity(`act-${dayNum}-5`, fmtTime(dinnerH), `Jantar: ${arrivalTheme.restaurants.dinner}`, '', '2h', 'comida', city, 'restaurant_dinner', priceLevel, travelers, tierMultiplier),
        );
        days.push({ day: dayNum, date: dateStr, title: 'Chegada 🛬', icon: '🛬', activities });
      }
    } else if (dayNum === duration) {
      days.push({
        day: dayNum,
        date: dateStr,
        title: 'Retorno 🏠',
        icon: '🏠',
        activities: [
          makeActivity(`act-${dayNum}-1`, '08:00', 'Café da manhã', 'Incluso na diária do hotel', '1h', 'comida', city, 'free', priceLevel, travelers, tierMultiplier),
          { ...makeActivity(`act-${dayNum}-2`, '10:00', 'Check-out do hotel', 'Liberar quarto e organizar bagagem', '1h', 'hotel', city, 'free', priceLevel, travelers, tierMultiplier), isHeroItem: true },
          makeActivity(`act-${dayNum}-3`, '11:00', 'Transfer para aeroporto', 'Transporte ao aeroporto', '1h', 'transporte', city, 'transfer', priceLevel, travelers, tierMultiplier),
          { ...makeActivity(`act-${dayNum}-4`, '14:00', 'Voo de volta', 'Retorno para o Brasil', `${flightHours}h`, 'voo', city, 'flight', priceLevel, travelers, tierMultiplier), isHeroItem: true },
        ],
      });
    } else if (isRecoveryDay) {
      const themes = getDestinationThemes(city);
      const theme = themes[0];
      days.push({
        day: dayNum,
        date: dateStr,
        title: `Recuperação 🌿`,
        icon: '🌿',
        activities: [
          makeActivity(`act-${dayNum}-1`, '09:00', 'Café da manhã', 'Incluso na diária do hotel', '1h', 'comida', city, 'free', priceLevel, travelers, tierMultiplier),
          makeActivity(`act-${dayNum}-2`, '10:30', theme.activities[0], 'Atividade leve — corpo em adaptação', '2h', 'passeio', city, 'free', priceLevel, travelers, tierMultiplier, true),
          makeActivity(`act-${dayNum}-3`, '13:00', `Almoço: ${theme.restaurants.lunch}`, '', '1h30', 'comida', city, 'restaurant_lunch', priceLevel, travelers, tierMultiplier),
          makeActivity(`act-${dayNum}-4`, '15:00', 'Descanso — adaptação ao fuso', 'Intervalo de descanso recomendado pela KINU AI', '2h', 'hotel', city, 'free', priceLevel, travelers, tierMultiplier, true),
          makeActivity(`act-${dayNum}-5`, '17:30', theme.activities.length > 1 ? theme.activities[1] : 'Caminhada leve', 'Atividade leve ao pôr do sol', '1h30', 'passeio', city, 'free', priceLevel, travelers, tierMultiplier, true),
          makeActivity(`act-${dayNum}-6`, '19:30', `Jantar: ${theme.restaurants.dinner}`, '', '2h', 'comida', city, 'restaurant_dinner', priceLevel, travelers, tierMultiplier),
        ],
      });
    } else {
      const themes = getDestinationThemes(city);

      const interestToTheme: Record<string, string> = {
        'gastronomy': 'Gastronomia', 'culture': 'Cultura', 'history': 'Cultura',
        'art': 'Cultura', 'adventure': 'Aventura', 'nature': 'Aventura',
        'beach': 'Passeios', 'relaxation': 'Passeios', 'shopping': 'Passeios',
        'nightlife': 'Descobertas', 'family': 'Passeios', 'winter': 'Aventura',
      };
      const scoredThemes = themes.map(theme => {
        const matchCount = travelInterests.filter(interest => interestToTheme[interest] === theme.title).length;
        return { theme, score: matchCount };
      });
      scoredThemes.sort((a, b) => b.score - a.score);
      const orderedThemes = scoredThemes.map(s => s.theme);

      const explorationStart = needsTransitDay
        ? (jetLagSeverity === 'SEVERO' ? 5 : 4)
        : (jetLagSeverity === 'SEVERO' ? 4 : 3);

      const isArrivalRecoveryDay = (dayNum === explorationStart) &&
        (jetLagSeverity === 'MODERADO' || jetLagSeverity === 'ALTO' || jetLagSeverity === 'SEVERO');

      if (isArrivalRecoveryDay) {
        days.push({
          day: dayNum,
          date: dateStr,
          title: 'Chegada e Recuperação 🛬',
          icon: '🛬',
          activities: [
            makeActivity(`act-${dayNum}-1`, '15:00', 'Check-in no hotel', 'Acomodação e descanso após o voo', '1h', 'hotel', city, 'free', priceLevel, travelers, tierMultiplier, true),
            makeActivity(`act-${dayNum}-2`, '17:00', 'Caminhada leve no bairro', 'Conheça os arredores do hotel sem pressa, ajuda a regular o relógio biológico', '1h30', 'passeio', city, 'free', priceLevel, travelers, tierMultiplier, true),
            makeActivity(`act-${dayNum}-3`, '19:30', 'Jantar leve perto do hotel', 'Refeição leve para não sobrecarregar o corpo. Evite álcool e comida pesada.', '1h30', 'comida', city, 'restaurant_lunch', priceLevel, travelers, tierMultiplier, true),
            makeActivity(`act-${dayNum}-4`, '21:30', 'Descanso para regular o sono', 'Tente dormir no horário local mesmo se não estiver com sono. Resista o cochilo se for antes das 22h.', '0h', 'hotel', city, 'free', priceLevel, travelers, tierMultiplier, true),
          ],
        });
        continue;
      }

      let themeIndex = (dayNum - explorationStart) % orderedThemes.length;
      if (dayNum === explorationStart && travelInterests.length > 0) {
        const focusThemeName = interestToTheme[travelInterests[0]];
        const focusIdx = orderedThemes.findIndex(t => t.title === focusThemeName);
        if (focusIdx >= 0) themeIndex = focusIdx;
      }

      let theme = orderedThemes[Math.max(0, themeIndex)];

      const morning = pickExp('morning', city, theme.title);
      const afternoon = pickExp('afternoon', city, theme.title);
      const night = pickExp('night', city, theme.title);
      const lunchAct = pickRestaurant('lunch', city, theme.title, dayNum);
      const dinnerAct = pickRestaurant('dinner', city, theme.title, dayNum);

      let dinnerName = dinnerAct?.name || theme.restaurants.dinner;
      if (travelInterests.includes('gastronomy') && theme.title === 'Gastronomia') {
        const michelin = getTopMichelinForCity(city, 3);
        if (michelin.length > 0) {
          dinnerName = `${michelin[0].name} (⭐ Michelin)`;
        }
      }

      const freeDesc = 'Dia para revisitar o que amou ou descobrir o bairro do hotel no seu ritmo';

      days.push({
        day: dayNum,
        date: dateStr,
        title: `${theme.title} ${theme.icon}`,
        icon: theme.icon,
        activities: [
          makeActivity(`act-${dayNum}-1`, '08:00', 'Café da manhã', 'Incluso na diária do hotel', '1h', 'comida', city, 'free', priceLevel, travelers, tierMultiplier),
          makeActivity(`act-${dayNum}-2`, '09:30', morning.activity?.name || theme.activities[0], morning.isFreeSlot ? freeDesc : (morning.activity?.tips?.[0] || ''), '2h30', 'passeio', city, morning.isFreeSlot ? 'free' : 'museum', priceLevel, travelers, tierMultiplier),
          makeActivity(`act-${dayNum}-3`, '12:30', `Almoço: ${lunchAct?.name || theme.restaurants.lunch}`, '', '1h30', 'comida', city, 'restaurant_lunch', priceLevel, travelers, tierMultiplier),
          makeActivity(`act-${dayNum}-4`, '14:30', afternoon.activity?.name || theme.activities[1], afternoon.isFreeSlot ? freeDesc : (afternoon.activity?.tips?.[0] || ''), '2h30', 'passeio', city, afternoon.isFreeSlot ? 'free' : 'tour', priceLevel, travelers, tierMultiplier),
          makeActivity(`act-${dayNum}-5`, '17:30', night.activity?.name || theme.activities[2], night.isFreeSlot ? freeDesc : (night.activity?.tips?.[0] || ''), '1h30', 'passeio', city, night.isFreeSlot ? 'free' : 'museum', priceLevel, travelers, tierMultiplier),
          makeActivity(`act-${dayNum}-6`, '19:30', `Jantar: ${dinnerName}`, '', '2h', 'comida', city, 'restaurant_dinner', priceLevel, travelers, tierMultiplier),
        ],
      });
    }
  }
  return days;
}

function makeActivity(
  id: string, time: string, name: string, description: string,
  duration: string, category: string, city: string,
  pricingType: string, priceLevel: PriceLevel,
  travelers = 1, tierMultiplier = 1.0, jetLagFriendly = false,
): TripActivity {
  const baseCost = pricingType === 'free' ? 0 : getActivityPrice(pricingType as any, city, priceLevel);
  const sharedTypes = ['free', 'transfer'];
  const isShared = sharedTypes.includes(pricingType) || category === 'hotel';
  const cost = Math.round((isShared ? baseCost : baseCost * travelers) * tierMultiplier);
  return {
    id, time, name, description, duration, cost,
    type: category,
    status: 'planned' as ActivityStatus,
    category: category as any,
    jetLagFriendly: jetLagFriendly || undefined,
  };
}
