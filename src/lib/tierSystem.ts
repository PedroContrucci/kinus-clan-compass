// Quality Tier System for Budget-Driven Generation
// Implements automatic tier selection, degradation, and MANDATORY 85-98% occupation

export type QualityTier = 'luxury' | 'premium' | 'comfort' | 'economic';

// ═══════════════════════════════════════════════════════════
// BUDGET OCCUPATION TARGETS - CRITICAL THRESHOLDS
// ═══════════════════════════════════════════════════════════
export const BUDGET_TARGETS = {
  minOccupation: 0.85,   // OBRIGATÓRIO: Mínimo 85% do budget
  idealOccupation: 0.92, // Ideal: 92%
  maxOccupation: 0.98,   // Máximo: 98% (deixa 2% de folga)
  maxUpgradeRounds: 5,   // Máximo de rodadas de upgrade
};

// ═══════════════════════════════════════════════════════════
// OCCUPATION STATUS TYPES
// ═══════════════════════════════════════════════════════════
export type OccupationStatus = 'low' | 'ideal' | 'high' | 'over';

export interface OccupationResult {
  occupation: number;
  occupationPercent: number;
  status: OccupationStatus;
  statusLabel: string;
  statusColor: string;
}

export const getOccupationStatus = (occupation: number): OccupationResult => {
  const percent = Math.round(occupation * 100);
  
  if (occupation < BUDGET_TARGETS.minOccupation) {
    return { 
      occupation, 
      occupationPercent: percent, 
      status: 'low', 
      statusLabel: 'Subutilizado',
      statusColor: '#eab308' 
    };
  }
  if (occupation <= BUDGET_TARGETS.maxOccupation) {
    return { 
      occupation, 
      occupationPercent: percent, 
      status: 'ideal', 
      statusLabel: 'Sweet Spot ✓',
      statusColor: '#10b981' 
    };
  }
  if (occupation <= 1) {
    return { 
      occupation, 
      occupationPercent: percent, 
      status: 'high', 
      statusLabel: 'No limite',
      statusColor: '#f97316' 
    };
  }
  return { 
    occupation, 
    occupationPercent: percent, 
    status: 'over', 
    statusLabel: 'Excedido',
    statusColor: '#ef4444' 
  };
};

// ═══════════════════════════════════════════════════════════
// TIER DISTRIBUTIONS (percentages by category)
// ═══════════════════════════════════════════════════════════
export interface TierDistribution {
  flights: { percent: number; class: string; description: string };
  accommodation: { percent: number; stars: string; description: string };
  activities: { percent: number; type: string; description: string };
  food: { percent: number; type: string; description: string };
  buffer: { percent: number; description: string };
}

export const TIER_DISTRIBUTIONS: Record<QualityTier, TierDistribution> = {
  // ECONÔMICO: Até R$ 50.000
  economic: {
    flights: { percent: 30, class: 'Econômica', description: 'Voos econômicos diretos' },
    accommodation: { percent: 25, stars: '3★', description: 'Hotéis 3 estrelas bem localizados' },
    activities: { percent: 20, type: 'mixed', description: 'Mix de pagas e gratuitas' },
    food: { percent: 10, type: 'casual', description: 'Trattorias e restaurantes locais' },
    buffer: { percent: 15, description: 'Margem de segurança' },
  },
  
  // CONFORTO: R$ 50.000 a R$ 100.000
  comfort: {
    flights: { percent: 25, class: 'Econômica Premium', description: 'Assentos com mais espaço' },
    accommodation: { percent: 35, stars: '4-5★', description: 'Hotéis 4-5 estrelas no Centro Histórico' },
    activities: { percent: 22, type: 'premium', description: 'Tours privados no Vaticano e Coliseu' },
    food: { percent: 10, type: 'upscale', description: 'Jantares em Rooftops e Trattorias premiadas' },
    buffer: { percent: 8, description: 'Margem para câmbio e extras' },
  },
  
  // PREMIUM: R$ 80.000 a R$ 150.000
  premium: {
    flights: { percent: 22, class: 'Executiva', description: 'Classe executiva em voos longos' },
    accommodation: { percent: 35, stars: '5★', description: 'Hotéis 5 estrelas de luxo' },
    activities: { percent: 28, type: 'exclusive', description: 'Experiências VIP e privativas' },
    food: { percent: 10, type: 'fine-dining', description: 'Restaurantes estrelados e experiências gastronômicas' },
    buffer: { percent: 5, description: 'Margem mínima' },
  },
  
  // ELITE/LUXURY: R$ 100.000+
  luxury: {
    flights: { percent: 20, class: 'Primeira Classe', description: 'Primeira classe ou jato privado' },
    accommodation: { percent: 35, stars: '5★ Luxo', description: 'Suítes em palácios e resorts exclusivos' },
    activities: { percent: 30, type: 'exclusive', description: 'Acesso privativo após horário, experiências sob medida' },
    food: { percent: 10, type: 'michelin', description: 'Michelin e chefs privados' },
    buffer: { percent: 5, description: 'Margem mínima' },
  },
};

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
    hotelBudgetPercent: 0.35,
    activitiesType: 'premium',
    foodType: 'fine-dining',
  },
  premium: {
    label: 'Premium',
    icon: '✨',
    flightClass: 'economy-plus',
    hotelStars: 5,
    hotelBudgetPercent: 0.34,
    activitiesType: 'premium',
    foodType: 'restaurants',
  },
  comfort: {
    label: 'Conforto',
    icon: '🌟',
    flightClass: 'economy',
    hotelStars: 4,
    hotelBudgetPercent: 0.33,
    activitiesType: 'mixed',
    foodType: 'casual',
  },
  economic: {
    label: 'Econômico',
    icon: '💚',
    flightClass: 'economy-promo',
    hotelStars: 3,
    hotelBudgetPercent: 0.25,
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

// Determine initial tier based on TOTAL budget (aligned with wizard tiers)
// Economic: ≤R$ 50.000, Comfort: R$ 50.001-100.000, Elite: >R$ 100.000
export const determineTier = (budget: number, destination: string, days: number): QualityTier => {
  // Primary tier based on total budget (aligned with wizard)
  if (budget > 100000) return 'luxury';
  if (budget > 50000) return 'premium';
  
  // For budgets ≤ 50k, check per-day to decide between comfort and economic
  const dailyBudget = budget / days;
  const destMultiplier = DESTINATION_COST_INDEX[destination.toLowerCase()] || 1;
  const adjustedDaily = dailyBudget / destMultiplier;
  
  // Within economic tier (≤50k), use daily budget to pick comfort or economic level
  if (adjustedDaily >= 1500) return 'comfort';
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

// ═══════════════════════════════════════════════════════════
// BUDGET DISTRIBUTION CALCULATION
// ═══════════════════════════════════════════════════════════

export interface BudgetDistribution {
  flights: number;
  flightsPercent: number;
  flightsClass: string;
  
  accommodation: number;
  accommodationPercent: number;
  accommodationStars: string;
  perNight: number;
  
  activities: number;
  activitiesPercent: number;
  activitiesType: string;
  perDayActivities: number;
  
  food: number;
  foodPercent: number;
  foodType: string;
  perDayFood: number;
  
  buffer: number;
  bufferPercent: number;
  
  targetTotal: number;
}

export const calculateIdealDistribution = (
  budget: number, 
  tier: QualityTier, 
  days: number
): BudgetDistribution => {
  const dist = TIER_DISTRIBUTIONS[tier];
  const nights = Math.max(1, days - 1);
  
  return {
    flights: Math.round(budget * (dist.flights.percent / 100)),
    flightsPercent: dist.flights.percent,
    flightsClass: dist.flights.class,
    
    accommodation: Math.round(budget * (dist.accommodation.percent / 100)),
    accommodationPercent: dist.accommodation.percent,
    accommodationStars: dist.accommodation.stars,
    perNight: Math.round((budget * (dist.accommodation.percent / 100)) / nights),
    
    activities: Math.round(budget * (dist.activities.percent / 100)),
    activitiesPercent: dist.activities.percent,
    activitiesType: dist.activities.type,
    perDayActivities: Math.round((budget * (dist.activities.percent / 100)) / days),
    
    food: Math.round(budget * (dist.food.percent / 100)),
    foodPercent: dist.food.percent,
    foodType: dist.food.type,
    perDayFood: Math.round((budget * (dist.food.percent / 100)) / days),
    
    buffer: Math.round(budget * (dist.buffer.percent / 100)),
    bufferPercent: dist.buffer.percent,
    
    targetTotal: Math.round(budget * BUDGET_TARGETS.idealOccupation),
  };
};

// ═══════════════════════════════════════════════════════════
// BUDGET OCCUPATION ANALYSIS
// ═══════════════════════════════════════════════════════════

export interface BudgetOccupationResult {
  budget: number;
  totalCost: number;
  occupation: number;
  occupationPercent: string;
  remaining: number;
  status: 'low' | 'ideal' | 'high' | 'over';
  statusLabel: string;
  distribution: {
    flights: { cost: number; percent: number };
    accommodation: { cost: number; percent: number };
    activities: { cost: number; percent: number };
    food: { cost: number; percent: number };
    buffer: { cost: number; percent: number };
  };
  needsUpgrade: boolean;
  upgradeAmount: number;
}

export const analyzeBudgetOccupation = (
  budget: number,
  costs: {
    flights: number;
    accommodation: number;
    activities: number;
    food: number;
  }
): BudgetOccupationResult => {
  const totalCost = costs.flights + costs.accommodation + costs.activities + costs.food;
  const occupation = totalCost / budget;
  const remaining = budget - totalCost;
  
  let status: BudgetOccupationResult['status'];
  let statusLabel: string;
  
  if (occupation > 1) {
    status = 'over';
    statusLabel = 'Acima do budget';
  } else if (occupation >= BUDGET_TARGETS.minOccupation && occupation <= BUDGET_TARGETS.maxOccupation) {
    status = 'ideal';
    statusLabel = 'Sweet Spot!';
  } else if (occupation > BUDGET_TARGETS.maxOccupation) {
    status = 'high';
    statusLabel = 'Muito próximo do limite';
  } else {
    status = 'low';
    statusLabel = 'Pode aproveitar mais';
  }
  
  const needsUpgrade = occupation < BUDGET_TARGETS.minOccupation;
  const upgradeAmount = needsUpgrade 
    ? Math.round(budget * BUDGET_TARGETS.idealOccupation - totalCost)
    : 0;
  
  return {
    budget,
    totalCost,
    occupation,
    occupationPercent: (occupation * 100).toFixed(1),
    remaining,
    status,
    statusLabel,
    distribution: {
      flights: { cost: costs.flights, percent: Math.round((costs.flights / budget) * 100) },
      accommodation: { cost: costs.accommodation, percent: Math.round((costs.accommodation / budget) * 100) },
      activities: { cost: costs.activities, percent: Math.round((costs.activities / budget) * 100) },
      food: { cost: costs.food, percent: Math.round((costs.food / budget) * 100) },
      buffer: { cost: remaining, percent: Math.round((remaining / budget) * 100) },
    },
    needsUpgrade,
    upgradeAmount,
  };
};

// ═══════════════════════════════════════════════════════════
// PREMIUM EXPERIENCES FOR UPGRADES
// ═══════════════════════════════════════════════════════════

export interface PremiumExperience {
  id: string;
  name: string;
  cost: number;
  duration: string;
  description: string;
  tier: 'comfort' | 'premium' | 'luxury';
}

export const PREMIUM_EXPERIENCES: Record<string, Record<'comfort' | 'luxury', PremiumExperience[]>> = {
  'roma': {
    comfort: [
      { id: 'roma-vat-private', name: 'Tour Privado Vaticano (sem filas)', cost: 1800, duration: '4h', description: 'Guia exclusivo pelo Vaticano', tier: 'comfort' },
      { id: 'roma-col-private', name: 'Tour Privado Coliseu + Fórum', cost: 1500, duration: '3h', description: 'Acesso especial ao underground', tier: 'comfort' },
      { id: 'roma-cooking', name: 'Aula de Culinária Romana', cost: 800, duration: '3h', description: 'Aprenda a fazer pasta e tiramisù', tier: 'comfort' },
      { id: 'roma-wine', name: 'Tour Vinícolas Frascati', cost: 1200, duration: '5h', description: 'Degustação em vinícolas locais', tier: 'comfort' },
      { id: 'roma-rooftop', name: 'Jantar no Rooftop com Vista', cost: 600, duration: '2h', description: 'Vista panorâmica de Roma', tier: 'comfort' },
    ],
    luxury: [
      { id: 'roma-vat-afterhours', name: 'Vaticano Fora de Horário (exclusivo)', cost: 4500, duration: '3h', description: 'Acesso exclusivo após fechamento', tier: 'luxury' },
      { id: 'roma-pergola', name: 'Jantar no La Pergola (3★ Michelin)', cost: 2500, duration: '3h', description: 'Experiência gastronômica única', tier: 'luxury' },
      { id: 'roma-ferrari', name: 'Tour de Ferrari pela Toscana', cost: 5000, duration: '8h', description: 'Dirija uma Ferrari pelas colinas', tier: 'luxury' },
      { id: 'roma-col-vip', name: 'Experiência VIP Coliseu Underground', cost: 2000, duration: '2h', description: 'Áreas normalmente fechadas', tier: 'luxury' },
      { id: 'roma-chef', name: 'Chef Privado no seu Hotel', cost: 1500, duration: '3h', description: 'Menu personalizado no quarto', tier: 'luxury' },
    ],
  },
  'paris': {
    comfort: [
      { id: 'paris-louvre-private', name: 'Tour Privado Louvre', cost: 2000, duration: '3h', description: 'Guia especializado em arte', tier: 'comfort' },
      { id: 'paris-versailles', name: 'Versailles Sem Filas + Jardins', cost: 1600, duration: '6h', description: 'Transporte e guia inclusos', tier: 'comfort' },
      { id: 'paris-macarons', name: 'Workshop de Macarons', cost: 700, duration: '2h', description: 'Com chef pâtissier', tier: 'comfort' },
      { id: 'paris-sena', name: 'Cruzeiro Gourmet no Sena', cost: 900, duration: '2h', description: 'Jantar com vista da Torre Eiffel', tier: 'comfort' },
    ],
    luxury: [
      { id: 'paris-eiffel-private', name: 'Torre Eiffel Acesso VIP + Jantar', cost: 3500, duration: '4h', description: 'Mesa reservada no Jules Verne', tier: 'luxury' },
      { id: 'paris-opera', name: 'Camarote Privado na Ópera', cost: 2800, duration: '3h', description: 'Palais Garnier, champagne incluso', tier: 'luxury' },
      { id: 'paris-champagne', name: 'Tour Champagne de Helicóptero', cost: 6000, duration: '6h', description: 'Voo + degustação em Reims', tier: 'luxury' },
    ],
  },
};

// Get available premium experiences for a destination and tier
export const getPremiumExperiences = (
  destination: string, 
  tier: QualityTier
): PremiumExperience[] => {
  const destExperiences = PREMIUM_EXPERIENCES[destination.toLowerCase()];
  if (!destExperiences) return [];
  
  if (tier === 'luxury' || tier === 'premium') {
    return [...(destExperiences.luxury || []), ...(destExperiences.comfort || [])];
  }
  if (tier === 'comfort') {
    return destExperiences.comfort || [];
  }
  return [];
};

// ═══════════════════════════════════════════════════════════
// AUTOMATIC UPGRADE LOGIC WITH RECURSIVE LOOP
// ═══════════════════════════════════════════════════════════

export interface UpgradeAction {
  type: 'hotel' | 'activity' | 'food' | 'flight';
  from: string;
  to: string;
  costIncrease: number;
}

export interface UpgradeRoundResult {
  round: number;
  upgradesApplied: UpgradeAction[];
  totalAdded: number;
  newOccupation: number;
  reachedTarget: boolean;
}

export interface UpgradeResult {
  upgraded: boolean;
  originalTotal: number;
  newTotal: number;
  upgrades: UpgradeAction[];
  rounds: UpgradeRoundResult[];
  newOccupation: number;
  reachedTarget: boolean;
}

// Hotel tiers for upgrades
export const HOTEL_TIERS = [
  { stars: 3, tier: 'standard', multiplier: 1.0 },
  { stars: 4, tier: 'superior', multiplier: 1.6 },
  { stars: 4, tier: 'premium', multiplier: 2.0 },
  { stars: 5, tier: 'luxury', multiplier: 2.8 },
  { stars: 5, tier: 'palace', multiplier: 4.0 },
];

// Perform a single upgrade round
export const performUpgradeRound = (
  currentCosts: {
    flights: number;
    accommodation: number;
    activities: number;
    food: number;
  },
  budget: number,
  targetIncrease: number,
  tier: QualityTier,
  destination: string,
  days: number,
  roundNumber: number,
  previousUpgrades: UpgradeAction[]
): UpgradeRoundResult => {
  const upgrades: UpgradeAction[] = [];
  let spent = 0;
  const nights = Math.max(1, days - 1);
  
  // Check what's already been upgraded
  const hotelAlreadyUpgraded = previousUpgrades.some(u => u.type === 'hotel');
  const activityCount = previousUpgrades.filter(u => u.type === 'activity').length;
  const foodAlreadyUpgraded = previousUpgrades.some(u => u.type === 'food');
  const flightAlreadyUpgraded = previousUpgrades.some(u => u.type === 'flight');
  
  // UPGRADE 1: HOTEL (highest impact)
  if (!hotelAlreadyUpgraded && spent < targetIncrease && tier !== 'economic') {
    const currentPerNight = currentCosts.accommodation / nights;
    const upgradeMultiplier = tier === 'luxury' ? 1.6 : tier === 'premium' ? 1.4 : 1.3;
    const newPerNight = currentPerNight * upgradeMultiplier;
    const hotelIncrease = (newPerNight - currentPerNight) * nights;
    
    if (hotelIncrease > 0 && hotelIncrease <= targetIncrease - spent) {
      upgrades.push({
        type: 'hotel',
        from: `${tier === 'comfort' ? '3-4★' : '4★'} Standard`,
        to: `${tier === 'luxury' ? '5★ Palace' : tier === 'premium' ? '5★ Luxury' : '4-5★ Superior'}`,
        costIncrease: Math.round(hotelIncrease),
      });
      spent += hotelIncrease;
      console.log(`  🏨 Hotel upgrade: +R$ ${Math.round(hotelIncrease)}`);
    }
  }
  
  // UPGRADE 2: PREMIUM EXPERIENCES
  if (spent < targetIncrease && activityCount < 3) {
    const experiences = getPremiumExperiences(destination, tier);
    const availableExperiences = experiences.filter(
      exp => !previousUpgrades.some(u => u.to === exp.name)
    );
    
    for (const exp of availableExperiences) {
      if (spent >= targetIncrease) break;
      if (activityCount + upgrades.filter(u => u.type === 'activity').length >= 3) break;
      
      if (exp.cost <= targetIncrease - spent) {
        upgrades.push({
          type: 'activity',
          from: 'Tour padrão',
          to: exp.name,
          costIncrease: exp.cost,
        });
        spent += exp.cost;
        console.log(`  🎯 +${exp.name}: +R$ ${exp.cost}`);
      }
    }
  }
  
  // UPGRADE 3: MEALS
  if (!foodAlreadyUpgraded && spent < targetIncrease && tier !== 'economic') {
    const mealUpgrade = Math.min(targetIncrease - spent, days * 150);
    if (mealUpgrade >= 300) {
      upgrades.push({
        type: 'food',
        from: tier === 'comfort' ? 'Trattorias locais' : 'Restaurantes casuais',
        to: tier === 'luxury' ? 'Michelin & Rooftops' : 'Restaurantes premiados',
        costIncrease: Math.round(mealUpgrade),
      });
      spent += mealUpgrade;
      console.log(`  🍽️ Meals upgrade: +R$ ${Math.round(mealUpgrade)}`);
    }
  }
  
  // UPGRADE 4: FLIGHT (for Elite tier)
  if (!flightAlreadyUpgraded && spent < targetIncrease && (tier === 'luxury' || tier === 'premium')) {
    const flightUpgrade = Math.min(targetIncrease - spent, currentCosts.flights * 0.5);
    if (flightUpgrade >= 2000) {
      upgrades.push({
        type: 'flight',
        from: tier === 'luxury' ? 'Executiva' : 'Econômica Premium',
        to: tier === 'luxury' ? 'Primeira Classe' : 'Executiva',
        costIncrease: Math.round(flightUpgrade),
      });
      spent += flightUpgrade;
      console.log(`  ✈️ Flight upgrade: +R$ ${Math.round(flightUpgrade)}`);
    }
  }
  
  const currentTotal = currentCosts.flights + currentCosts.accommodation + 
                       currentCosts.activities + currentCosts.food +
                       previousUpgrades.reduce((sum, u) => sum + u.costIncrease, 0);
  const newTotal = currentTotal + spent;
  const newOccupation = newTotal / budget;
  
  return {
    round: roundNumber,
    upgradesApplied: upgrades,
    totalAdded: spent,
    newOccupation,
    reachedTarget: newOccupation >= BUDGET_TARGETS.minOccupation,
  };
};

// MAIN: Recursive upgrade loop until 85% occupation
export const calculateUpgrades = (
  currentCosts: {
    flights: number;
    accommodation: number;
    activities: number;
    food: number;
  },
  budget: number,
  tier: QualityTier,
  destination: string,
  days: number
): UpgradeResult => {
  const initialOccupation = analyzeBudgetOccupation(budget, currentCosts);
  
  console.log(`
═══════════════════════════════════════════════════════
🎯 OCUPAÇÃO BUDGET ENGINE
Budget: R$ ${budget.toLocaleString()}
Ocupação inicial: ${initialOccupation.occupationPercent}%
Target: ${BUDGET_TARGETS.minOccupation * 100}% - ${BUDGET_TARGETS.maxOccupation * 100}%
═══════════════════════════════════════════════════════
  `);
  
  if (!initialOccupation.needsUpgrade) {
    console.log('✅ Ocupação já está no Sweet Spot!');
    return {
      upgraded: false,
      originalTotal: initialOccupation.totalCost,
      newTotal: initialOccupation.totalCost,
      upgrades: [],
      rounds: [],
      newOccupation: initialOccupation.occupation,
      reachedTarget: true,
    };
  }
  
  // Start upgrade loop
  let allUpgrades: UpgradeAction[] = [];
  const rounds: UpgradeRoundResult[] = [];
  let currentOccupation = initialOccupation.occupation;
  
  for (let round = 1; round <= BUDGET_TARGETS.maxUpgradeRounds; round++) {
    const currentTotal = initialOccupation.totalCost + 
                         allUpgrades.reduce((sum, u) => sum + u.costIncrease, 0);
    const targetIncrease = (budget * BUDGET_TARGETS.idealOccupation) - currentTotal;
    
    if (targetIncrease <= 0 || currentOccupation >= BUDGET_TARGETS.minOccupation) {
      console.log(`✅ Target reached after ${round - 1} rounds`);
      break;
    }
    
    console.log(`\n⬆️ Upgrade Round ${round} — Ocupação: ${(currentOccupation * 100).toFixed(1)}%`);
    console.log(`   Target increase: R$ ${targetIncrease.toLocaleString()}`);
    
    const roundResult = performUpgradeRound(
      currentCosts,
      budget,
      targetIncrease,
      tier,
      destination,
      days,
      round,
      allUpgrades
    );
    
    rounds.push(roundResult);
    allUpgrades = [...allUpgrades, ...roundResult.upgradesApplied];
    currentOccupation = roundResult.newOccupation;
    
    if (roundResult.upgradesApplied.length === 0) {
      console.log('⚠️ No more upgrades available');
      break;
    }
    
    if (roundResult.reachedTarget) {
      console.log(`\n✅ SWEET SPOT ACHIEVED: ${(currentOccupation * 100).toFixed(1)}%`);
      break;
    }
  }
  
  const totalAdded = allUpgrades.reduce((sum, u) => sum + u.costIncrease, 0);
  const newTotal = initialOccupation.totalCost + totalAdded;
  
  console.log(`
═══════════════════════════════════════════════════════
📊 RESULTADO FINAL
Original: R$ ${initialOccupation.totalCost.toLocaleString()} (${initialOccupation.occupationPercent}%)
Upgrades: +R$ ${totalAdded.toLocaleString()}
Final: R$ ${newTotal.toLocaleString()} (${(currentOccupation * 100).toFixed(1)}%)
Rodadas: ${rounds.length}
═══════════════════════════════════════════════════════
  `);
  
  return {
    upgraded: allUpgrades.length > 0,
    originalTotal: initialOccupation.totalCost,
    newTotal,
    upgrades: allUpgrades,
    rounds,
    newOccupation: currentOccupation,
    reachedTarget: currentOccupation >= BUDGET_TARGETS.minOccupation,
  };
};

// ═══════════════════════════════════════════════════════════
// SUCCESS CHANCE CALCULATION (for auction)
// ═══════════════════════════════════════════════════════════

export interface SuccessChance {
  percent: number;
  label: string;
  color: string;
}

export const calculateSuccessChance = (
  offerPrice: number, 
  targetPrice: number, 
  originalPrice: number
): SuccessChance => {
  const discount = (originalPrice - offerPrice) / originalPrice;
  
  if (discount <= 0.10) return { percent: 95, label: 'Muito Alta', color: '#10b981' };
  if (discount <= 0.20) return { percent: 75, label: 'Alta', color: '#22c55e' };
  if (discount <= 0.30) return { percent: 50, label: 'Média', color: '#eab308' };
  if (discount <= 0.40) return { percent: 25, label: 'Baixa', color: '#f97316' };
  return { percent: 10, label: 'Muito Baixa', color: '#ef4444' };
};
