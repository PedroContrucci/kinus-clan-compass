// Activity Pricing System — Realistic BRL prices for all activity types
// This ensures no activity has R$ 0 unless explicitly marked as FREE

export type ActivityType = 
  | 'flight' 
  | 'hotel_night' 
  | 'transfer' 
  | 'museum' 
  | 'tour' 
  | 'restaurant_lunch' 
  | 'restaurant_dinner' 
  | 'free'
  | 'transport_local'
  | 'shopping';

export type PriceLevel = 'budget' | 'midrange' | 'luxury';

export interface CityPriceConfig {
  flightFromGRU: { min: number; avg: number; max: number };
  hotelPerNight: { budget: number; midrange: number; luxury: number };
  multiplier: number; // City cost multiplier (1 = average)
}

// Helper to derive a city config from a reference with a multiplier
function deriveConfig(ref: CityPriceConfig, mult: number): CityPriceConfig {
  return {
    flightFromGRU: {
      min: Math.round(ref.flightFromGRU.min * mult),
      avg: Math.round(ref.flightFromGRU.avg * mult),
      max: Math.round(ref.flightFromGRU.max * mult),
    },
    hotelPerNight: {
      budget: Math.round(ref.hotelPerNight.budget * mult),
      midrange: Math.round(ref.hotelPerNight.midrange * mult),
      luxury: Math.round(ref.hotelPerNight.luxury * mult),
    },
    multiplier: Math.round(ref.multiplier * mult * 100) / 100,
  };
}

// Base configs for reference cities
const PARIS: CityPriceConfig = {
  flightFromGRU: { min: 4000, avg: 5800, max: 10000 },
  hotelPerNight: { budget: 750, midrange: 1800, luxury: 4500 },
  multiplier: 1.25,
};
const LISBOA: CityPriceConfig = {
  flightFromGRU: { min: 2800, avg: 4200, max: 7000 },
  hotelPerNight: { budget: 500, midrange: 1100, luxury: 2800 },
  multiplier: 0.9,
};
const MADRI: CityPriceConfig = {
  flightFromGRU: { min: 3300, avg: 4800, max: 7500 },
  hotelPerNight: { budget: 500, midrange: 1200, luxury: 3000 },
  multiplier: 1.0,
};
const BERLIM: CityPriceConfig = {
  flightFromGRU: { min: 3800, avg: 5200, max: 8500 },
  hotelPerNight: { budget: 500, midrange: 1200, luxury: 3000 },
  multiplier: 1.0,
};
const ISTAMBUL: CityPriceConfig = {
  flightFromGRU: { min: 3500, avg: 5000, max: 8000 },
  hotelPerNight: { budget: 350, midrange: 900, luxury: 2500 },
  multiplier: 0.7,
};
const VIENA: CityPriceConfig = {
  flightFromGRU: { min: 4000, avg: 5500, max: 9000 },
  hotelPerNight: { budget: 600, midrange: 1400, luxury: 3500 },
  multiplier: 1.1,
};
const PRAGA: CityPriceConfig = {
  flightFromGRU: { min: 3500, avg: 4800, max: 7500 },
  hotelPerNight: { budget: 350, midrange: 800, luxury: 2200 },
  multiplier: 0.75,
};
const LONDRES: CityPriceConfig = {
  flightFromGRU: { min: 4200, avg: 6000, max: 11000 },
  hotelPerNight: { budget: 800, midrange: 2000, luxury: 4800 },
  multiplier: 1.35,
};
const NOVA_YORK: CityPriceConfig = {
  flightFromGRU: { min: 4000, avg: 6500, max: 12000 },
  hotelPerNight: { budget: 900, midrange: 2200, luxury: 5500 },
  multiplier: 1.5,
};
const BUENOS_AIRES: CityPriceConfig = {
  flightFromGRU: { min: 1200, avg: 2000, max: 3500 },
  hotelPerNight: { budget: 250, midrange: 600, luxury: 1800 },
  multiplier: 0.5,
};
const SANTIAGO_REF: CityPriceConfig = {
  flightFromGRU: { min: 1500, avg: 2500, max: 4500 },
  hotelPerNight: { budget: 300, midrange: 700, luxury: 2000 },
  multiplier: 0.6,
};
const LIMA_REF: CityPriceConfig = {
  flightFromGRU: { min: 2000, avg: 3200, max: 5500 },
  hotelPerNight: { budget: 250, midrange: 600, luxury: 1800 },
  multiplier: 0.5,
};
const BOGOTA: CityPriceConfig = {
  flightFromGRU: { min: 2000, avg: 3200, max: 5000 },
  hotelPerNight: { budget: 250, midrange: 600, luxury: 1600 },
  multiplier: 0.5,
};
const CANCUN: CityPriceConfig = {
  flightFromGRU: { min: 3000, avg: 4500, max: 7500 },
  hotelPerNight: { budget: 500, midrange: 1200, luxury: 3500 },
  multiplier: 0.9,
};
const MONTEVIDEU: CityPriceConfig = {
  flightFromGRU: { min: 1000, avg: 1800, max: 3000 },
  hotelPerNight: { budget: 300, midrange: 700, luxury: 1800 },
  multiplier: 0.55,
};
const TOQUIO: CityPriceConfig = {
  flightFromGRU: { min: 5500, avg: 8000, max: 14000 },
  hotelPerNight: { budget: 700, midrange: 1600, luxury: 4000 },
  multiplier: 1.4,
};
const BANGKOK_REF: CityPriceConfig = {
  flightFromGRU: { min: 4500, avg: 6500, max: 11000 },
  hotelPerNight: { budget: 200, midrange: 500, luxury: 1500 },
  multiplier: 0.4,
};
const DUBAI_REF: CityPriceConfig = {
  flightFromGRU: { min: 4000, avg: 5800, max: 10000 },
  hotelPerNight: { budget: 500, midrange: 1300, luxury: 4000 },
  multiplier: 1.1,
};
const SINGAPURA_REF: CityPriceConfig = {
  flightFromGRU: { min: 5000, avg: 7500, max: 13000 },
  hotelPerNight: { budget: 600, midrange: 1400, luxury: 3800 },
  multiplier: 1.2,
};
const HONG_KONG: CityPriceConfig = {
  flightFromGRU: { min: 5500, avg: 8000, max: 14000 },
  hotelPerNight: { budget: 700, midrange: 1600, luxury: 4200 },
  multiplier: 1.3,
};
const CAIRO_REF: CityPriceConfig = {
  flightFromGRU: { min: 4500, avg: 6500, max: 10000 },
  hotelPerNight: { budget: 250, midrange: 600, luxury: 2000 },
  multiplier: 0.45,
};
const CAPE_TOWN: CityPriceConfig = {
  flightFromGRU: { min: 4500, avg: 7000, max: 12000 },
  hotelPerNight: { budget: 400, midrange: 1000, luxury: 3000 },
  multiplier: 0.7,
};
const SYDNEY_REF: CityPriceConfig = {
  flightFromGRU: { min: 6000, avg: 9000, max: 16000 },
  hotelPerNight: { budget: 700, midrange: 1600, luxury: 4000 },
  multiplier: 1.3,
};
const SALVADOR: CityPriceConfig = {
  flightFromGRU: { min: 500, avg: 900, max: 1800 },
  hotelPerNight: { budget: 200, midrange: 500, luxury: 1500 },
  multiplier: 0.55,
};

// City-specific price configurations (all in BRL)
export const CITY_PRICES: Record<string, CityPriceConfig> = {
  // EUROPA — Base cities
  roma: { flightFromGRU: { min: 4000, avg: 5500, max: 9000 }, hotelPerNight: { budget: 600, midrange: 1400, luxury: 3500 }, multiplier: 1.1 },
  paris: PARIS,
  lisboa: LISBOA,
  barcelona: { flightFromGRU: { min: 3500, avg: 5000, max: 8000 }, hotelPerNight: { budget: 550, midrange: 1300, luxury: 3200 }, multiplier: 1.05 },
  londres: LONDRES,
  amsterdã: { flightFromGRU: { min: 3800, avg: 5500, max: 9000 }, hotelPerNight: { budget: 650, midrange: 1500, luxury: 3800 }, multiplier: 1.15 },
  amsterdam: { flightFromGRU: { min: 3800, avg: 5500, max: 9000 }, hotelPerNight: { budget: 650, midrange: 1500, luxury: 3800 }, multiplier: 1.15 },
  madri: MADRI,
  madrid: MADRI,
  berlim: BERLIM,
  berlin: BERLIM,
  praga: PRAGA,
  viena: VIENA,
  istambul: ISTAMBUL,
  istanbul: ISTAMBUL,
  milão: { flightFromGRU: { min: 3800, avg: 5300, max: 8500 }, hotelPerNight: { budget: 600, midrange: 1500, luxury: 3800 }, multiplier: 1.15 },
  florença: { flightFromGRU: { min: 4000, avg: 5500, max: 9000 }, hotelPerNight: { budget: 550, midrange: 1300, luxury: 3500 }, multiplier: 1.1 },
  veneza: { flightFromGRU: { min: 4000, avg: 5500, max: 9000 }, hotelPerNight: { budget: 700, midrange: 1600, luxury: 4000 }, multiplier: 1.2 },
  // EUROPA — Derived cities
  nice: deriveConfig(PARIS, 0.9),
  lyon: deriveConfig(PARIS, 0.9),
  porto: deriveConfig(LISBOA, 0.95),
  sevilha: deriveConfig(MADRI, 0.85),
  munique: deriveConfig(BERLIM, 1.1),
  santorini: deriveConfig(ISTAMBUL, 1.2),
  atenas: deriveConfig(ISTAMBUL, 1.2),
  zurique: deriveConfig(VIENA, 1.4),
  genebra: deriveConfig(VIENA, 1.4),
  dublin: deriveConfig(LONDRES, 0.9),
  dubrovnik: deriveConfig(PRAGA, 1.1),
  budapeste: deriveConfig(PRAGA, 0.9),

  // AMÉRICAS — Base cities
  'nova york': NOVA_YORK,
  'new york': NOVA_YORK,
  miami: { flightFromGRU: { min: 3000, avg: 4500, max: 8000 }, hotelPerNight: { budget: 600, midrange: 1500, luxury: 4000 }, multiplier: 1.2 },
  orlando: { flightFromGRU: { min: 2800, avg: 4200, max: 7500 }, hotelPerNight: { budget: 500, midrange: 1200, luxury: 3000 }, multiplier: 1.1 },
  'buenos aires': BUENOS_AIRES,
  santiago: SANTIAGO_REF,
  lima: LIMA_REF,
  cancún: CANCUN,
  cancun: CANCUN,
  cartagena: { flightFromGRU: { min: 2000, avg: 3500, max: 5500 }, hotelPerNight: { budget: 300, midrange: 800, luxury: 2200 }, multiplier: 0.6 },
  bogotá: BOGOTA,
  montevidéu: MONTEVIDEU,
  // AMÉRICAS — Derived cities
  'los angeles': deriveConfig(NOVA_YORK, 0.9),
  'san francisco': deriveConfig(NOVA_YORK, 0.9),
  'las vegas': deriveConfig(NOVA_YORK, 0.9),
  bariloche: deriveConfig(BUENOS_AIRES, 1.1),
  mendoza: deriveConfig(BUENOS_AIRES, 1.1),
  atacama: deriveConfig(SANTIAGO_REF, 1.2),
  cusco: deriveConfig(LIMA_REF, 1.1),
  medellín: deriveConfig(BOGOTA, 0.95),
  'cidade do méxico': deriveConfig(CANCUN, 0.9),
  'punta del este': deriveConfig(MONTEVIDEU, 1.2),
  toronto: deriveConfig(NOVA_YORK, 0.85),
  vancouver: deriveConfig(NOVA_YORK, 0.85),
  havana: deriveConfig(CANCUN, 0.7),

  // ÁSIA — Base cities
  tóquio: TOQUIO,
  tokyo: TOQUIO,
  bangkok: BANGKOK_REF,
  dubai: DUBAI_REF,
  singapura: SINGAPURA_REF,
  singapore: SINGAPURA_REF,
  'hong kong': HONG_KONG,
  seul: { flightFromGRU: { min: 5500, avg: 8000, max: 14000 }, hotelPerNight: { budget: 500, midrange: 1200, luxury: 3000 }, multiplier: 1.0 },
  seoul: { flightFromGRU: { min: 5500, avg: 8000, max: 14000 }, hotelPerNight: { budget: 500, midrange: 1200, luxury: 3000 }, multiplier: 1.0 },
  // ÁSIA — Derived cities
  osaka: deriveConfig(TOQUIO, 0.85),
  kyoto: deriveConfig(TOQUIO, 0.85),
  phuket: deriveConfig(BANGKOK_REF, 1.1),
  'abu dhabi': deriveConfig(DUBAI_REF, 0.95),
  xangai: deriveConfig(HONG_KONG, 0.8),
  pequim: deriveConfig(HONG_KONG, 0.8),
  'nova délhi': deriveConfig(BANGKOK_REF, 0.9),
  'nova delhi': deriveConfig(BANGKOK_REF, 0.9),
  hanói: deriveConfig(BANGKOK_REF, 0.8),
  'tel aviv': deriveConfig(DUBAI_REF, 1.1),
  malé: deriveConfig(SINGAPURA_REF, 1.5),

  // ORIENTE MÉDIO / ÁFRICA
  cairo: CAIRO_REF,
  marrakech: { flightFromGRU: { min: 4000, avg: 6000, max: 9500 }, hotelPerNight: { budget: 300, midrange: 800, luxury: 2500 }, multiplier: 0.5 },
  'cape town': CAPE_TOWN,
  'cidade do cabo': CAPE_TOWN,
  joanesburgo: deriveConfig(CAPE_TOWN, 0.9),
  nairóbi: deriveConfig(CAIRO_REF, 0.9),

  // OCEANIA
  sydney: SYDNEY_REF,
  melbourne: deriveConfig(SYDNEY_REF, 0.95),
  auckland: deriveConfig(SYDNEY_REF, 1.0),

  // BRASIL (doméstico)
  'rio de janeiro': { flightFromGRU: { min: 400, avg: 800, max: 1500 }, hotelPerNight: { budget: 250, midrange: 600, luxury: 2000 }, multiplier: 0.7 },
  salvador: SALVADOR,
  florianópolis: { flightFromGRU: { min: 350, avg: 700, max: 1400 }, hotelPerNight: { budget: 250, midrange: 600, luxury: 1800 }, multiplier: 0.6 },
  'são paulo': { flightFromGRU: { min: 0, avg: 0, max: 0 }, hotelPerNight: { budget: 250, midrange: 700, luxury: 2500 }, multiplier: 0.8 },
  // BRASIL — Derived cities
  recife: SALVADOR,
  natal: SALVADOR,
  'foz do iguaçu': SALVADOR,
  manaus: SALVADOR,
  gramado: SALVADOR,
  jericoacoara: SALVADOR,
};

// Base prices by activity type (in BRL)
const BASE_PRICES: Record<ActivityType, Record<PriceLevel, number>> = {
  flight: { budget: 4000, midrange: 5500, luxury: 12000 },
  hotel_night: { budget: 700, midrange: 1500, luxury: 3500 },
  transfer: { budget: 120, midrange: 220, luxury: 450 },
  museum: { budget: 60, midrange: 130, luxury: 220 },
  tour: { budget: 180, midrange: 400, luxury: 900 },
  restaurant_lunch: { budget: 90, midrange: 160, luxury: 320 },
  restaurant_dinner: { budget: 130, midrange: 280, luxury: 550 },
  transport_local: { budget: 15, midrange: 25, luxury: 50 },
  shopping: { budget: 200, midrange: 500, luxury: 1500 },
  free: { budget: 0, midrange: 0, luxury: 0 },
};

// Helper to find city in CITY_PRICES with fuzzy matching
function findCityConfig(city: string): CityPriceConfig | null {
  const lower = city.toLowerCase().trim();
  if (CITY_PRICES[lower]) return CITY_PRICES[lower];
  const firstWord = lower.split(',')[0].trim();
  if (CITY_PRICES[firstWord]) return CITY_PRICES[firstWord];
  for (const key of Object.keys(CITY_PRICES)) {
    if (lower.includes(key) || key.includes(firstWord)) {
      return CITY_PRICES[key];
    }
  }
  return null;
}

export function getActivityPrice(
  type: ActivityType,
  city?: string,
  level: PriceLevel = 'midrange'
): number {
  if (type === 'free') return 0;
  const basePrice = BASE_PRICES[type]?.[level] ?? 150;
  const cityConfig = city ? findCityConfig(city) : null;
  const multiplier = cityConfig?.multiplier ?? 1.0;
  if (type === 'flight' && cityConfig) {
    return Math.round(cityConfig.flightFromGRU[level === 'budget' ? 'min' : level === 'luxury' ? 'max' : 'avg']);
  }
  if (type === 'hotel_night' && cityConfig) {
    return Math.round(cityConfig.hotelPerNight[level]);
  }
  return Math.round(basePrice * multiplier);
}

export function determinePriceLevel(
  budget: number,
  travelers: number = 1,
  duration: number = 7,
  city?: string
): PriceLevel {
  const activeDays = Math.max(1, duration - 2);
  const budgetPerPersonPerDay = budget / Math.max(1, travelers) / Math.max(1, activeDays);
  const cityConfig = city ? findCityConfig(city) : null;
  const cityMultiplier = cityConfig?.multiplier ?? 1.0;
  const budgetThreshold = 600 * cityMultiplier;
  const luxuryThreshold = 1500 * cityMultiplier;
  if (budgetPerPersonPerDay < budgetThreshold) return 'budget';
  if (budgetPerPersonPerDay < luxuryThreshold) return 'midrange';
  return 'luxury';
}

export function mapCategoryToPricingType(
  category: string,
  activityName?: string
): ActivityType {
  const nameLower = activityName?.toLowerCase() ?? '';
  const freeKeywords = ['passeio livre', 'caminh', 'free', 'grát', 'view', 'mirante', 'foto'];
  if (freeKeywords.some(kw => nameLower.includes(kw))) return 'free';
  switch (category?.toLowerCase()) {
    case 'voo': case 'flight': return 'flight';
    case 'hotel': case 'hospedagem': case 'accommodation': return 'hotel_night';
    case 'comida': case 'food': case 'restaurante':
      if (nameLower.includes('almoço') || nameLower.includes('lunch')) return 'restaurant_lunch';
      return 'restaurant_dinner';
    case 'transporte': case 'transport':
      if (nameLower.includes('transfer') || nameLower.includes('aeroporto')) return 'transfer';
      return 'transport_local';
    case 'passeio': case 'tour': case 'experience':
      if (nameLower.includes('museu') || nameLower.includes('museum')) return 'museum';
      if (nameLower.includes('tour') || nameLower.includes('guiado')) return 'tour';
      return 'museum';
    case 'compras': case 'shopping': return 'shopping';
    default: return 'tour';
  }
}

export function applyPricesToActivities<T extends { 
  name?: string; category?: string; cost?: number; estimated_cost?: number;
}>(activities: T[], city: string, totalBudget: number): T[] {
  const priceLevel = determinePriceLevel(totalBudget);
  return activities.map(activity => {
    if ((activity.cost && activity.cost > 0) || (activity.estimated_cost && activity.estimated_cost > 0)) return activity;
    const pricingType = mapCategoryToPricingType(activity.category ?? '', activity.name);
    const price = getActivityPrice(pricingType, city, priceLevel);
    return { ...activity, cost: price, estimated_cost: price };
  });
}

export function calculateTripEstimate(
  city: string, duration: number, travelers: number, priceLevel: PriceLevel = 'midrange'
): { flights: number; hotel: number; dailyExpenses: number; total: number; perPerson: number } {
  const nights = Math.max(1, duration - 1);
  const activeDays = Math.max(1, duration - 2);
  const flightPerPerson = getActivityPrice('flight', city, priceLevel);
  const flights = flightPerPerson * travelers;
  const hotelPerNight = getActivityPrice('hotel_night', city, priceLevel);
  const hotel = hotelPerNight * nights;
  const dailyMeals = getActivityPrice('restaurant_lunch', city, priceLevel) + getActivityPrice('restaurant_dinner', city, priceLevel);
  const dailyTransport = getActivityPrice('transport_local', city, priceLevel);
  const dailyActivities = getActivityPrice('museum', city, priceLevel) + getActivityPrice('tour', city, priceLevel);
  const dailyPerPerson = dailyMeals + dailyTransport + dailyActivities;
  const dailyExpenses = dailyPerPerson * travelers * activeDays;
  const total = flights + hotel + dailyExpenses;
  const perPerson = Math.round(total / Math.max(1, travelers));
  return { flights, hotel, dailyExpenses, total, perPerson };
}

export function findBestPriceLevel(
  city: string, duration: number, travelers: number, budget: number
): { level: PriceLevel; estimate: number; usage: number } {
  const tolerance = 1.10;
  const luxuryEstimate = calculateTripEstimate(city, duration, travelers, 'luxury');
  if (luxuryEstimate.total <= budget * tolerance) {
    return { level: 'luxury', estimate: luxuryEstimate.total, usage: Math.round((luxuryEstimate.total / budget) * 100) };
  }
  const midrangeEstimate = calculateTripEstimate(city, duration, travelers, 'midrange');
  if (midrangeEstimate.total <= budget * tolerance) {
    return { level: 'midrange', estimate: midrangeEstimate.total, usage: Math.round((midrangeEstimate.total / budget) * 100) };
  }
  const budgetEstimate = calculateTripEstimate(city, duration, travelers, 'budget');
  return { level: 'budget', estimate: budgetEstimate.total, usage: Math.round((budgetEstimate.total / budget) * 100) };
}

export function randomizePrice(basePrice: number): number {
  if (basePrice === 0) return 0;
  const variance = 0.1;
  const multiplier = 1 + (Math.random() * variance * 2 - variance);
  return Math.round(basePrice * multiplier);
}
