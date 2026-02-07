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

// City-specific price configurations (all in BRL)
export const CITY_PRICES: Record<string, CityPriceConfig> = {
  roma: {
    flightFromGRU: { min: 4000, avg: 5500, max: 9000 },
    hotelPerNight: { budget: 600, midrange: 1400, luxury: 3500 },
    multiplier: 1.1,
  },
  paris: {
    flightFromGRU: { min: 4000, avg: 5800, max: 10000 },
    hotelPerNight: { budget: 750, midrange: 1800, luxury: 4500 },
    multiplier: 1.25,
  },
  lisboa: {
    flightFromGRU: { min: 2800, avg: 4200, max: 7000 },
    hotelPerNight: { budget: 500, midrange: 1100, luxury: 2800 },
    multiplier: 0.9,
  },
  barcelona: {
    flightFromGRU: { min: 3500, avg: 5000, max: 8000 },
    hotelPerNight: { budget: 550, midrange: 1300, luxury: 3200 },
    multiplier: 1.05,
  },
  tóquio: {
    flightFromGRU: { min: 5500, avg: 8000, max: 14000 },
    hotelPerNight: { budget: 700, midrange: 1600, luxury: 4000 },
    multiplier: 1.4,
  },
  'nova york': {
    flightFromGRU: { min: 4000, avg: 6500, max: 12000 },
    hotelPerNight: { budget: 900, midrange: 2200, luxury: 5500 },
    multiplier: 1.5,
  },
  londres: {
    flightFromGRU: { min: 4200, avg: 6000, max: 11000 },
    hotelPerNight: { budget: 800, midrange: 2000, luxury: 4800 },
    multiplier: 1.35,
  },
  amsterdã: {
    flightFromGRU: { min: 3800, avg: 5500, max: 9000 },
    hotelPerNight: { budget: 650, midrange: 1500, luxury: 3800 },
    multiplier: 1.15,
  },
  madri: {
    flightFromGRU: { min: 3300, avg: 4800, max: 7500 },
    hotelPerNight: { budget: 500, midrange: 1200, luxury: 3000 },
    multiplier: 1.0,
  },
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

/**
 * Get the price for an activity based on type, city and level
 */
export function getActivityPrice(
  type: ActivityType,
  city?: string,
  level: PriceLevel = 'midrange'
): number {
  // Free activities are always free
  if (type === 'free') return 0;
  
  const basePrice = BASE_PRICES[type]?.[level] ?? 150;
  
  // Apply city multiplier if available
  const cityKey = city?.toLowerCase();
  const cityConfig = cityKey ? CITY_PRICES[cityKey] : null;
  const multiplier = cityConfig?.multiplier ?? 1.0;
  
  // For flights and hotels, use city-specific prices
  if (type === 'flight' && cityConfig) {
    return Math.round(cityConfig.flightFromGRU[level === 'budget' ? 'min' : level === 'luxury' ? 'max' : 'avg']);
  }
  
  if (type === 'hotel_night' && cityConfig) {
    return Math.round(cityConfig.hotelPerNight[level]);
  }
  
  return Math.round(basePrice * multiplier);
}

/**
 * Determine price level based on total budget
 */
export function determinePriceLevel(budget: number): PriceLevel {
  if (budget < 50000) return 'budget';
  if (budget < 100000) return 'midrange';
  return 'luxury';
}

/**
 * Map activity category/type to our pricing types
 */
export function mapCategoryToPricingType(
  category: string,
  activityName?: string
): ActivityType {
  const nameLower = activityName?.toLowerCase() ?? '';
  
  // Check for free activities
  const freeKeywords = ['passeio livre', 'caminh', 'free', 'grát', 'view', 'mirante', 'foto'];
  if (freeKeywords.some(kw => nameLower.includes(kw))) {
    return 'free';
  }
  
  switch (category?.toLowerCase()) {
    case 'voo':
    case 'flight':
      return 'flight';
    case 'hotel':
    case 'hospedagem':
    case 'accommodation':
      return 'hotel_night';
    case 'comida':
    case 'food':
    case 'restaurante':
      if (nameLower.includes('almoço') || nameLower.includes('lunch')) {
        return 'restaurant_lunch';
      }
      return 'restaurant_dinner';
    case 'transporte':
    case 'transport':
      if (nameLower.includes('transfer') || nameLower.includes('aeroporto')) {
        return 'transfer';
      }
      return 'transport_local';
    case 'passeio':
    case 'tour':
    case 'experience':
      if (nameLower.includes('museu') || nameLower.includes('museum')) {
        return 'museum';
      }
      if (nameLower.includes('tour') || nameLower.includes('guiado')) {
        return 'tour';
      }
      return 'museum'; // Default attractions to museum pricing
    case 'compras':
    case 'shopping':
      return 'shopping';
    default:
      return 'tour';
  }
}

/**
 * Apply prices to activities in a trip
 */
export function applyPricesToActivities<T extends { 
  name?: string; 
  category?: string; 
  cost?: number;
  estimated_cost?: number;
}>(
  activities: T[],
  city: string,
  totalBudget: number
): T[] {
  const priceLevel = determinePriceLevel(totalBudget);
  
  return activities.map(activity => {
    // Skip if already has a valid cost
    if ((activity.cost && activity.cost > 0) || (activity.estimated_cost && activity.estimated_cost > 0)) {
      return activity;
    }
    
    const pricingType = mapCategoryToPricingType(
      activity.category ?? '',
      activity.name
    );
    
    const price = getActivityPrice(pricingType, city, priceLevel);
    
    return {
      ...activity,
      cost: price,
      estimated_cost: price,
    };
  });
}

/**
 * Calculate total estimated cost for a trip
 */
export function calculateTripEstimate(
  city: string,
  duration: number,
  travelers: number,
  priceLevel: PriceLevel = 'midrange'
): {
  flights: number;
  hotel: number;
  dailyExpenses: number;
  total: number;
} {
  const nights = Math.max(1, duration - 1);
  
  // Flight cost (round trip per person)
  const flightPerPerson = getActivityPrice('flight', city, priceLevel);
  const flights = flightPerPerson * travelers;
  
  // Hotel cost (per night, assuming shared rooms)
  const hotelPerNight = getActivityPrice('hotel_night', city, priceLevel);
  const hotel = hotelPerNight * nights;
  
  // Daily expenses per person (meals + transport + activities)
  const dailyMeals = getActivityPrice('restaurant_lunch', city, priceLevel) + 
                     getActivityPrice('restaurant_dinner', city, priceLevel);
  const dailyTransport = getActivityPrice('transport_local', city, priceLevel);
  const dailyActivities = getActivityPrice('museum', city, priceLevel);
  
  const dailyPerPerson = dailyMeals + dailyTransport + dailyActivities;
  const dailyExpenses = dailyPerPerson * travelers * (duration - 1); // Exclude travel days
  
  return {
    flights,
    hotel,
    dailyExpenses,
    total: flights + hotel + dailyExpenses,
  };
}

/**
 * Add randomization to make prices feel more natural (±10%)
 */
export function randomizePrice(basePrice: number): number {
  if (basePrice === 0) return 0;
  const variance = 0.1; // 10%
  const multiplier = 1 + (Math.random() * variance * 2 - variance);
  return Math.round(basePrice * multiplier);
}
