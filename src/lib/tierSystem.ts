// Quality Tier System for Budget-Driven Generation
// Implements automatic tier selection and degradation based on user budget

export type QualityTier = 'luxury' | 'premium' | 'comfort' | 'economic';

export interface TierConfig {
  label: string;
  icon: string;
  flightClass: 'business' | 'economy-plus' | 'economy' | 'economy-promo';
  hotelStars: number;
  hotelBudgetPercent: number;
  activitiesType: 'premium' | 'mixed' | 'standard' | 'free-mostly';
  foodType: 'fine-dining' | 'restaurants' | 'casual' | 'street-food';
}

export const QUALITY_TIERS: Record<QualityTier, TierConfig> = {
  luxury: {
    label: 'Luxo',
    icon: '👑',
    flightClass: 'business',
    hotelStars: 5,
    hotelBudgetPercent: 0.30,
    activitiesType: 'premium',
    foodType: 'fine-dining',
  },
  premium: {
    label: 'Premium',
    icon: '✨',
    flightClass: 'economy-plus',
    hotelStars: 4,
    hotelBudgetPercent: 0.25,
    activitiesType: 'mixed',
    foodType: 'restaurants',
  },
  comfort: {
    label: 'Conforto',
    icon: '🌟',
    flightClass: 'economy',
    hotelStars: 3,
    hotelBudgetPercent: 0.20,
    activitiesType: 'standard',
    foodType: 'casual',
  },
  economic: {
    label: 'Econômico',
    icon: '💚',
    flightClass: 'economy-promo',
    hotelStars: 2,
    hotelBudgetPercent: 0.15,
    activitiesType: 'free-mostly',
    foodType: 'street-food',
  },
};

// Destination cost multipliers (São Paulo = 1.0 baseline)
export const DESTINATION_COST_INDEX: Record<string, number> = {
  'roma': 1.2,
  'paris': 1.4,
  'lisboa': 0.9,
  'barcelona': 1.1,
  'tóquio': 1.5,
  'amsterdã': 1.3,
  'nova york': 1.6,
  'bali': 0.7,
  'santorini': 1.25,
  'marrakech': 0.65,
};

// Pricing data by destination and tier
export interface DestinationPricing {
  flights: Record<QualityTier, { min: number; avg: number }>;
  hotels: Record<QualityTier, { perNight: number; stars: number; example: string }>;
  activities: Record<QualityTier, { dailyBudget: number; freeRatio: number }>;
}

export const DESTINATION_PRICING: Record<string, DestinationPricing> = {
  'roma': {
    flights: {
      economic: { min: 2800, avg: 3200 },
      comfort: { min: 3500, avg: 4000 },
      premium: { min: 4500, avg: 5500 },
      luxury: { min: 8000, avg: 12000 },
    },
    hotels: {
      economic: { perNight: 250, stars: 2, example: 'Hotel Centro Budget' },
      comfort: { perNight: 450, stars: 3, example: 'Hotel Roma Centro' },
      premium: { perNight: 750, stars: 4, example: 'Hotel Artemide' },
      luxury: { perNight: 1500, stars: 5, example: 'Hotel de Russie' },
    },
    activities: {
      economic: { dailyBudget: 50, freeRatio: 0.8 },
      comfort: { dailyBudget: 150, freeRatio: 0.4 },
      premium: { dailyBudget: 300, freeRatio: 0.2 },
      luxury: { dailyBudget: 600, freeRatio: 0 },
    },
  },
  'paris': {
    flights: {
      economic: { min: 3200, avg: 3800 },
      comfort: { min: 4200, avg: 5000 },
      premium: { min: 5500, avg: 7000 },
      luxury: { min: 10000, avg: 15000 },
    },
    hotels: {
      economic: { perNight: 350, stars: 2, example: 'Ibis Paris Centre' },
      comfort: { perNight: 550, stars: 3, example: 'Hotel Le Marais' },
      premium: { perNight: 900, stars: 4, example: 'Hotel Montalembert' },
      luxury: { perNight: 2000, stars: 5, example: 'Le Bristol Paris' },
    },
    activities: {
      economic: { dailyBudget: 60, freeRatio: 0.8 },
      comfort: { dailyBudget: 180, freeRatio: 0.4 },
      premium: { dailyBudget: 350, freeRatio: 0.2 },
      luxury: { dailyBudget: 700, freeRatio: 0 },
    },
  },
  'lisboa': {
    flights: {
      economic: { min: 2400, avg: 2800 },
      comfort: { min: 3000, avg: 3500 },
      premium: { min: 4000, avg: 5000 },
      luxury: { min: 7000, avg: 10000 },
    },
    hotels: {
      economic: { perNight: 180, stars: 2, example: 'Ibis Lisboa Centro' },
      comfort: { perNight: 350, stars: 3, example: 'Hotel Lisboa Plaza' },
      premium: { perNight: 600, stars: 4, example: 'Four Seasons Ritz' },
      luxury: { perNight: 1200, stars: 5, example: 'Olissippo Lapa Palace' },
    },
    activities: {
      economic: { dailyBudget: 40, freeRatio: 0.8 },
      comfort: { dailyBudget: 120, freeRatio: 0.4 },
      premium: { dailyBudget: 250, freeRatio: 0.2 },
      luxury: { dailyBudget: 500, freeRatio: 0 },
    },
  },
  'barcelona': {
    flights: {
      economic: { min: 2600, avg: 3000 },
      comfort: { min: 3400, avg: 4000 },
      premium: { min: 4500, avg: 5500 },
      luxury: { min: 8500, avg: 11000 },
    },
    hotels: {
      economic: { perNight: 220, stars: 2, example: 'Generator Barcelona' },
      comfort: { perNight: 400, stars: 3, example: 'Hotel Gótico' },
      premium: { perNight: 700, stars: 4, example: 'Hotel Arts' },
      luxury: { perNight: 1400, stars: 5, example: 'Mandarin Oriental' },
    },
    activities: {
      economic: { dailyBudget: 45, freeRatio: 0.8 },
      comfort: { dailyBudget: 140, freeRatio: 0.4 },
      premium: { dailyBudget: 280, freeRatio: 0.2 },
      luxury: { dailyBudget: 550, freeRatio: 0 },
    },
  },
  'tóquio': {
    flights: {
      economic: { min: 4500, avg: 5200 },
      comfort: { min: 5800, avg: 6800 },
      premium: { min: 8000, avg: 10000 },
      luxury: { min: 15000, avg: 22000 },
    },
    hotels: {
      economic: { perNight: 380, stars: 2, example: 'Tokyo Inn Budget' },
      comfort: { perNight: 600, stars: 3, example: 'Shinjuku Washington' },
      premium: { perNight: 1100, stars: 4, example: 'Park Hyatt Tokyo' },
      luxury: { perNight: 2500, stars: 5, example: 'Aman Tokyo' },
    },
    activities: {
      economic: { dailyBudget: 70, freeRatio: 0.7 },
      comfort: { dailyBudget: 200, freeRatio: 0.4 },
      premium: { dailyBudget: 400, freeRatio: 0.2 },
      luxury: { dailyBudget: 800, freeRatio: 0 },
    },
  },
  'amsterdã': {
    flights: {
      economic: { min: 3200, avg: 3700 },
      comfort: { min: 4100, avg: 4800 },
      premium: { min: 5400, avg: 6500 },
      luxury: { min: 9500, avg: 13000 },
    },
    hotels: {
      economic: { perNight: 300, stars: 2, example: 'Generator Amsterdam' },
      comfort: { perNight: 500, stars: 3, example: 'Hotel V Nesplein' },
      premium: { perNight: 850, stars: 4, example: 'Pulitzer Amsterdam' },
      luxury: { perNight: 1800, stars: 5, example: 'Waldorf Astoria' },
    },
    activities: {
      economic: { dailyBudget: 55, freeRatio: 0.75 },
      comfort: { dailyBudget: 160, freeRatio: 0.4 },
      premium: { dailyBudget: 320, freeRatio: 0.2 },
      luxury: { dailyBudget: 650, freeRatio: 0 },
    },
  },
};

// Default pricing for unknown destinations
const DEFAULT_PRICING: DestinationPricing = {
  flights: {
    economic: { min: 3000, avg: 3500 },
    comfort: { min: 4000, avg: 4800 },
    premium: { min: 5500, avg: 7000 },
    luxury: { min: 10000, avg: 14000 },
  },
  hotels: {
    economic: { perNight: 280, stars: 2, example: 'Hotel Econômico' },
    comfort: { perNight: 480, stars: 3, example: 'Hotel Conforto' },
    premium: { perNight: 800, stars: 4, example: 'Hotel Premium' },
    luxury: { perNight: 1600, stars: 5, example: 'Hotel Luxo' },
  },
  activities: {
    economic: { dailyBudget: 50, freeRatio: 0.8 },
    comfort: { dailyBudget: 150, freeRatio: 0.4 },
    premium: { dailyBudget: 300, freeRatio: 0.2 },
    luxury: { dailyBudget: 600, freeRatio: 0 },
  },
};

// Get pricing for destination (with fallback)
export const getDestinationPricing = (destination: string): DestinationPricing => {
  const normalized = destination.toLowerCase();
  return DESTINATION_PRICING[normalized] || DEFAULT_PRICING;
};

// Determine initial tier based on budget per day
export const determineTier = (budget: number, destination: string, days: number): QualityTier => {
  const dailyBudget = budget / days;
  const destMultiplier = DESTINATION_COST_INDEX[destination.toLowerCase()] || 1;
  const adjustedDaily = dailyBudget / destMultiplier;
  
  if (adjustedDaily >= 2000) return 'luxury';
  if (adjustedDaily >= 1200) return 'premium';
  if (adjustedDaily >= 700) return 'comfort';
  return 'economic';
};

// Degrade tier by one level
export const degradeTier = (currentTier: QualityTier): QualityTier => {
  const order: QualityTier[] = ['luxury', 'premium', 'comfort', 'economic'];
  const currentIndex = order.indexOf(currentTier);
  return order[Math.min(currentIndex + 1, order.length - 1)];
};

// Calculate minimum costs for a destination (to check viability)
export interface MinimumCosts {
  flight: number;
  hotel: number;
  total: number;
  tier: QualityTier;
}

export const getMinimumCosts = (destination: string, days: number): MinimumCosts => {
  const pricing = getDestinationPricing(destination);
  const nights = Math.max(1, days - 1);
  
  // Use economic tier for minimum
  const flightMin = pricing.flights.economic.min;
  const hotelMin = pricing.hotels.economic.perNight * nights;
  
  return {
    flight: flightMin,
    hotel: hotelMin,
    total: flightMin + hotelMin,
    tier: 'economic',
  };
};

// Get costs for a specific tier
export interface TierCosts {
  flight: number;
  hotelPerNight: number;
  hotelTotal: number;
  dailyActivities: number;
  dailyFood: number;
  dailyTransport: number;
  total: number;
}

export const getTierCosts = (
  destination: string, 
  days: number, 
  tier: QualityTier,
  travelers: number = 2
): TierCosts => {
  const pricing = getDestinationPricing(destination);
  const nights = Math.max(1, days - 1);
  
  const flight = pricing.flights[tier].avg * travelers;
  const hotelPerNight = pricing.hotels[tier].perNight;
  const hotelTotal = hotelPerNight * nights;
  const dailyActivities = pricing.activities[tier].dailyBudget * travelers;
  
  // Estimate food and transport based on tier
  const foodMultiplier = tier === 'luxury' ? 200 : tier === 'premium' ? 120 : tier === 'comfort' ? 80 : 50;
  const transportMultiplier = tier === 'luxury' ? 80 : tier === 'premium' ? 50 : tier === 'comfort' ? 30 : 15;
  
  const dailyFood = foodMultiplier * travelers;
  const dailyTransport = transportMultiplier * travelers;
  
  const experienceDays = Math.max(1, days - 1);
  const total = flight + hotelTotal + (dailyActivities + dailyFood + dailyTransport) * experienceDays;
  
  return {
    flight,
    hotelPerNight,
    hotelTotal,
    dailyActivities,
    dailyFood,
    dailyTransport,
    total,
  };
};

// Find valid tier combination that fits budget
export interface ValidCombination {
  tier: QualityTier;
  costs: TierCosts;
  isValid: boolean;
  margin: number;
  marginPercent: number;
}

export const findValidCombination = (
  destination: string,
  days: number,
  budget: number,
  travelers: number = 2,
  preferredTier?: QualityTier
): ValidCombination | null => {
  const tiers: QualityTier[] = ['luxury', 'premium', 'comfort', 'economic'];
  const startIndex = preferredTier ? tiers.indexOf(preferredTier) : 0;
  
  for (let i = startIndex; i < tiers.length; i++) {
    const tier = tiers[i];
    const costs = getTierCosts(destination, days, tier, travelers);
    
    if (costs.total <= budget) {
      return {
        tier,
        costs,
        isValid: true,
        margin: budget - costs.total,
        marginPercent: Math.round(((budget - costs.total) / budget) * 100),
      };
    }
  }
  
  // Even economic tier doesn't fit
  return null;
};

// Check if trip is viable (even with minimum costs)
export interface ViabilityCheck {
  isViable: boolean;
  minCosts: MinimumCosts;
  deficit: number;
  suggestions: string[];
}

export const checkViability = (
  destination: string,
  days: number,
  budget: number
): ViabilityCheck => {
  const minCosts = getMinimumCosts(destination, days);
  
  if (minCosts.total <= budget) {
    return {
      isViable: true,
      minCosts,
      deficit: 0,
      suggestions: [],
    };
  }
  
  const deficit = minCosts.total - budget;
  const suggestions: string[] = [];
  
  // Generate helpful suggestions
  const daysToReduce = Math.ceil(deficit / (minCosts.hotel / (days - 1)));
  if (daysToReduce < days - 2) {
    suggestions.push(`Reduzir ${daysToReduce} diária(s) economizaria ~R$ ${Math.round((minCosts.hotel / (days - 1)) * daysToReduce).toLocaleString()}`);
  }
  
  suggestions.push(`Aumentar orçamento para R$ ${minCosts.total.toLocaleString()} viabiliza a viagem`);
  
  // Alternative destinations that might work
  const cheaperDests = Object.entries(DESTINATION_PRICING)
    .filter(([dest]) => dest !== destination.toLowerCase())
    .map(([dest, pricing]) => ({
      dest,
      cost: pricing.flights.economic.min + pricing.hotels.economic.perNight * (days - 1),
    }))
    .filter(d => d.cost <= budget)
    .sort((a, b) => a.cost - b.cost)
    .slice(0, 2);
  
  if (cheaperDests.length > 0) {
    suggestions.push(
      `Considere ${cheaperDests.map(d => d.dest.charAt(0).toUpperCase() + d.dest.slice(1)).join(' ou ')} como alternativa`
    );
  }
  
  return {
    isViable: false,
    minCosts,
    deficit,
    suggestions,
  };
};

// Get tier badge styling
export const getTierBadgeStyle = (tier: QualityTier): { bg: string; text: string; border: string } => {
  switch (tier) {
    case 'luxury':
      return { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/30' };
    case 'premium':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/30' };
    case 'comfort':
      return { bg: 'bg-sky-500/10', text: 'text-sky-500', border: 'border-sky-500/30' };
    case 'economic':
      return { bg: 'bg-slate-400/10', text: 'text-slate-400', border: 'border-slate-400/30' };
  }
};
