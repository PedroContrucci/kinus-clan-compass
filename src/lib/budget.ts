// Budget allocation and management utilities for Hard Budget system

export interface BudgetAllocation {
  fixedCosts: {
    flights: number;
    accommodation: number;
  };
  variableCosts: {
    activities: number;
    food: number;
    transport: number;
    buffer: number;
  };
  dailyBudget: {
    activities: number;
    food: number;
    transport: number;
    total: number;
  };
  totalAllocated: number;
}

export interface BudgetState {
  total: number;
  allocated: BudgetAllocation;
  spent: {
    flights: number;
    accommodation: number;
    activities: number;
    food: number;
    transport: number;
  };
  available: number;
  isOverBudget: boolean;
  overflowAmount: number;
  overflowPercentage: number;
}

export interface CostCategory {
  category: 'economic' | 'normal' | 'premium' | 'luxury';
  color: string;
  label: string;
  icon: string;
  bgColor: string;
}

// Allocate budget according to hierarchy
export const allocateBudget = (userBudget: number, tripDays: number): BudgetAllocation => {
  // 1. FIXED COSTS FIRST (60% total)
  const fixedCosts = {
    flights: userBudget * 0.35,        // 35% for flights
    accommodation: userBudget * 0.25,  // 25% for hotel
  };
  
  // 2. REMAINING FOR EXPERIENCES (40%)
  const remainingBudget = userBudget - fixedCosts.flights - fixedCosts.accommodation;
  
  // 3. VARIABLE COSTS DISTRIBUTION
  const variableCosts = {
    activities: remainingBudget * 0.40,   // 40% of remaining
    food: remainingBudget * 0.35,         // 35% of remaining
    transport: remainingBudget * 0.15,    // 15% of remaining
    buffer: remainingBudget * 0.10,       // 10% reserve
  };
  
  // 4. DAILY BUDGET (experience days, not including transit)
  const experienceDays = Math.max(1, tripDays - 1); // Exclude transit day
  const dailyBudget = {
    activities: variableCosts.activities / experienceDays,
    food: variableCosts.food / experienceDays,
    transport: variableCosts.transport / experienceDays,
    total: (variableCosts.activities + variableCosts.food + variableCosts.transport) / experienceDays,
  };
  
  return { fixedCosts, variableCosts, dailyBudget, totalAllocated: userBudget };
};

// Check if total cost exceeds budget
export const checkBudgetOverflow = (currentTotal: number, budget: number) => {
  if (currentTotal > budget) {
    const excess = currentTotal - budget;
    const percentage = Math.round((excess / budget) * 100);
    
    return {
      isOverBudget: true,
      excess,
      percentage,
      severity: percentage > 20 ? 'critical' : 'warning',
    };
  }
  return { isOverBudget: false, excess: 0, percentage: 0, severity: null };
};

// Get cost category based on activity cost vs daily budget
export const getCostCategory = (activityCost: number, dailyBudget: number): CostCategory => {
  if (dailyBudget <= 0) {
    return { 
      category: 'normal', 
      color: 'hsl(var(--primary))',
      bgColor: 'bg-primary/20',
      label: 'Normal',
      icon: '✅'
    };
  }
  
  const percentage = (activityCost / dailyBudget) * 100;
  
  if (percentage <= 15) {
    return { 
      category: 'economic', 
      color: 'hsl(var(--primary))',
      bgColor: 'bg-primary/20',
      label: 'Econômico',
      icon: '💚'
    };
  }
  if (percentage <= 30) {
    return { 
      category: 'normal', 
      color: 'hsl(var(--primary))',
      bgColor: 'bg-primary/20',
      label: 'Normal',
      icon: '✅'
    };
  }
  if (percentage <= 50) {
    return { 
      category: 'premium', 
      color: '#eab308',
      bgColor: 'bg-[#eab308]/20',
      label: 'Premium',
      icon: '⭐'
    };
  }
  return { 
    category: 'luxury', 
    color: '#eab308',
    bgColor: 'bg-[#eab308]/20',
    label: 'Luxo',
    icon: '👑'
  };
};

// Free/low-cost activities by destination
export const FREE_ACTIVITIES: Record<string, { name: string; cost: number; type: string }[]> = {
  'roma': [
    { name: 'Fontana di Trevi', cost: 0, type: 'photo' },
    { name: 'Panteão (entrada gratuita)', cost: 0, type: 'culture' },
    { name: 'Piazza Navona', cost: 0, type: 'walk' },
    { name: 'Escadaria Espanhola', cost: 0, type: 'photo' },
    { name: 'Jardins de Villa Borghese', cost: 0, type: 'nature' },
    { name: 'Bairro Trastevere a pé', cost: 0, type: 'walk' },
    { name: 'Campo de Fiori (mercado)', cost: 0, type: 'culture' },
    { name: 'Basílica Santa Maria Maggiore', cost: 0, type: 'culture' },
    { name: 'Ponte Sant\'Angelo', cost: 0, type: 'photo' },
    { name: 'Bairro Judeu', cost: 0, type: 'walk' },
  ],
  'paris': [
    { name: 'Sacré-Cœur e Montmartre', cost: 0, type: 'culture' },
    { name: 'Jardim de Luxemburgo', cost: 0, type: 'nature' },
    { name: 'Notre-Dame (exterior)', cost: 0, type: 'photo' },
    { name: 'Champs-Élysées a pé', cost: 0, type: 'walk' },
    { name: 'Museu Carnavalet', cost: 0, type: 'culture' },
    { name: 'Jardin des Tuileries', cost: 0, type: 'nature' },
  ],
  'lisboa': [
    { name: 'Miradouro da Senhora do Monte', cost: 0, type: 'photo' },
    { name: 'Baixa e Rossio a pé', cost: 0, type: 'walk' },
    { name: 'Alfama e Castelo (externa)', cost: 0, type: 'walk' },
    { name: 'Parque das Nações', cost: 0, type: 'nature' },
  ],
  'barcelona': [
    { name: 'La Rambla e Boqueria', cost: 0, type: 'walk' },
    { name: 'Praia de Barceloneta', cost: 0, type: 'nature' },
    { name: 'Bairro Gótico a pé', cost: 0, type: 'walk' },
    { name: 'Park Güell (área gratuita)', cost: 0, type: 'nature' },
  ],
};

// Calculate budget state from current spending
export const calculateBudgetState = (
  totalBudget: number,
  tripDays: number,
  spentAmounts: {
    flights: number;
    accommodation: number;
    activities: number;
    food: number;
    transport: number;
  }
): BudgetState => {
  const allocated = allocateBudget(totalBudget, tripDays);
  const totalSpent = Object.values(spentAmounts).reduce((sum, val) => sum + val, 0);
  const overflow = checkBudgetOverflow(totalSpent, totalBudget);
  
  return {
    total: totalBudget,
    allocated,
    spent: spentAmounts,
    available: totalBudget - totalSpent,
    isOverBudget: overflow.isOverBudget,
    overflowAmount: overflow.excess,
    overflowPercentage: overflow.percentage,
  };
};

// Spending breakdown analysis for reduction strategy
export interface SpendingBreakdown {
  flights: { cost: number; percent: number; isHighest: boolean };
  accommodation: { cost: number; percent: number; nightlyCost: number; nights: number; isHighest: boolean };
  activities: { cost: number; percent: number; mostExpensive: { name: string; cost: number }[]; isHighest: boolean };
  food: { cost: number; percent: number; isHighest: boolean };
  transport: { cost: number; percent: number; isHighest: boolean };
}

export const analyzeSpending = (
  costs: {
    flights: number;
    accommodation: number;
    accommodationNights: number;
    activities: { name: string; cost: number }[];
    food: number;
    transport: number;
  }
): SpendingBreakdown => {
  const activitiesCost = costs.activities.reduce((sum, a) => sum + a.cost, 0);
  const total = costs.flights + costs.accommodation + activitiesCost + costs.food + costs.transport;
  
  const breakdown: SpendingBreakdown = {
    flights: {
      cost: costs.flights,
      percent: Math.round((costs.flights / total) * 100),
      isHighest: false
    },
    accommodation: {
      cost: costs.accommodation,
      percent: Math.round((costs.accommodation / total) * 100),
      nightlyCost: Math.round(costs.accommodation / costs.accommodationNights),
      nights: costs.accommodationNights,
      isHighest: false
    },
    activities: {
      cost: activitiesCost,
      percent: Math.round((activitiesCost / total) * 100),
      mostExpensive: [...costs.activities]
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 3),
      isHighest: false
    },
    food: {
      cost: costs.food,
      percent: Math.round((costs.food / total) * 100),
      isHighest: false
    },
    transport: {
      cost: costs.transport,
      percent: Math.round((costs.transport / total) * 100),
      isHighest: false
    }
  };
  
  // Find highest spending category
  const entries = Object.entries(breakdown) as [keyof SpendingBreakdown, typeof breakdown[keyof SpendingBreakdown]][];
  let maxKey: keyof SpendingBreakdown = 'flights';
  let maxCost = 0;
  
  for (const [key, val] of entries) {
    if (val.cost > maxCost) {
      maxCost = val.cost;
      maxKey = key;
    }
  }
  
  breakdown[maxKey].isHighest = true;
  
  return breakdown;
};

// Generate reduction suggestions
export interface ReductionSuggestion {
  id: string;
  type: 'reduce_days' | 'change_hotel' | 'auction_activities' | 'economic_version';
  title: string;
  description: string;
  savings: number;
  newTotal: number;
  stillOver: boolean;
  details?: {
    from?: string;
    to?: string;
    items?: { name: string; currentCost: number; targetCost: number }[];
  };
}

export const generateReductionSuggestions = (
  userBudget: number,
  totalCost: number,
  breakdown: SpendingBreakdown,
  days: number
): ReductionSuggestion[] => {
  const suggestions: ReductionSuggestion[] = [];
  const overflow = totalCost - userBudget;
  
  // Strategy 1: Reduce days
  const daysToReduce = Math.min(2, Math.max(1, Math.ceil(overflow / (totalCost / days))));
  const savingsFromDays = Math.round((breakdown.accommodation.cost / days) * daysToReduce + 
    (breakdown.food.cost / days) * daysToReduce);
  
  suggestions.push({
    id: 'reduce_days',
    type: 'reduce_days',
    title: `OPÇÃO 1: REDUZIR DIÁRIAS`,
    description: `Reduzir de ${days} para ${days - daysToReduce} noites`,
    savings: savingsFromDays,
    newTotal: totalCost - savingsFromDays,
    stillOver: totalCost - savingsFromDays > userBudget,
  });
  
  // Strategy 2: Change hotel (if accommodation is significant)
  if (breakdown.accommodation.percent >= 20) {
    const cheaperNightlyCost = Math.round(breakdown.accommodation.nightlyCost * 0.65);
    const hotelSavings = (breakdown.accommodation.nightlyCost - cheaperNightlyCost) * breakdown.accommodation.nights;
    
    suggestions.push({
      id: 'change_hotel',
      type: 'change_hotel',
      title: 'OPÇÃO 2: TROCAR HOTEL',
      description: `Trocar Hotel 4★ por Hotel 3★`,
      savings: hotelSavings,
      newTotal: totalCost - hotelSavings,
      stillOver: totalCost - hotelSavings > userBudget,
      details: {
        from: `Hotel 4★ R$ ${breakdown.accommodation.nightlyCost}/noite`,
        to: `Hotel 3★ R$ ${cheaperNightlyCost}/noite`,
      }
    });
  }
  
  // Strategy 3: Auction top 3 expensive activities
  if (breakdown.activities.mostExpensive.length > 0) {
    const auctionItems = breakdown.activities.mostExpensive.map(act => ({
      name: act.name,
      currentCost: act.cost,
      targetCost: Math.round(act.cost * 0.7), // Target 30% reduction
    }));
    
    const potentialSavings = auctionItems.reduce((sum, item) => sum + (item.currentCost - item.targetCost), 0);
    
    suggestions.push({
      id: 'auction_activities',
      type: 'auction_activities',
      title: 'OPÇÃO 3: ATAQUE DE LEILÃO',
      description: 'Ativar leilão nas 3 atividades mais caras',
      savings: potentialSavings,
      newTotal: totalCost - potentialSavings,
      stillOver: totalCost - potentialSavings > userBudget,
      details: {
        items: auctionItems
      }
    });
  }
  
  return suggestions;
};

// Validate if itinerary can be generated within budget
export interface BudgetValidation {
  isValid: boolean;
  totalCost: number;
  userBudget: number;
  overflow: number;
  overflowPercent: number;
  breakdown?: SpendingBreakdown;
  suggestions?: ReductionSuggestion[];
  // Zero-Overhead: Flag if only FIXED costs exceed budget (impossible scenario)
  fixedCostsExceedBudget?: boolean;
  fixedCostsTotal?: number;
}

export const validateBudget = (
  userBudget: number,
  costs: {
    flights: number;
    accommodation: number;
    accommodationNights: number;
    activities: { name: string; cost: number }[];
    food: number;
    transport: number;
  }
): BudgetValidation => {
  const activitiesCost = costs.activities.reduce((sum, a) => sum + a.cost, 0);
  const totalCost = costs.flights + costs.accommodation + activitiesCost + costs.food + costs.transport;
  
  // ZERO-OVERHEAD: First check if FIXED costs alone exceed budget
  // This is the ONLY scenario where reduction strategy should appear
  const fixedCostsTotal = costs.flights + costs.accommodation;
  
  if (fixedCostsTotal >= userBudget) {
    // IMPOSSIBLE: Even without any activities, flights + hotel exceed budget
    const breakdown = analyzeSpending(costs);
    const suggestions = generateReductionSuggestions(userBudget, totalCost, breakdown, costs.accommodationNights);
    
    return {
      isValid: false,
      totalCost,
      userBudget,
      overflow: totalCost - userBudget,
      overflowPercent: Math.round(((totalCost - userBudget) / userBudget) * 100),
      breakdown,
      suggestions,
      fixedCostsExceedBudget: true,
      fixedCostsTotal,
    };
  }
  
  // ZERO-OVERHEAD: If fixed costs fit, activities MUST fit within remaining budget
  // The generator should NEVER produce activities that exceed remaining budget
  // But if it does, mark as invalid for debugging
  if (totalCost > userBudget) {
    // This should NOT happen with proper generation
    console.warn('[Budget] Zero-Overhead violation: Total exceeds budget but fixed costs fit');
    const breakdown = analyzeSpending(costs);
    const suggestions = generateReductionSuggestions(userBudget, totalCost, breakdown, costs.accommodationNights);
    
    return {
      isValid: false,
      totalCost,
      userBudget,
      overflow: totalCost - userBudget,
      overflowPercent: Math.round(((totalCost - userBudget) / userBudget) * 100),
      breakdown,
      suggestions,
      fixedCostsExceedBudget: false,
      fixedCostsTotal,
    };
  }
  
  return {
    isValid: true,
    totalCost,
    userBudget,
    overflow: 0,
    overflowPercent: 0,
    fixedCostsExceedBudget: false,
    fixedCostsTotal,
  };
};

// ZERO-OVERHEAD: Calculate remaining budget for activities after fixed costs
export const calculateRemainingBudget = (
  userBudget: number,
  flightsCost: number,
  accommodationCost: number
): { remaining: number; dailyLimit: number; canProceed: boolean } => {
  const fixedCosts = flightsCost + accommodationCost;
  const remaining = userBudget - fixedCosts;
  
  if (remaining <= 0) {
    return {
      remaining: 0,
      dailyLimit: 0,
      canProceed: false,
    };
  }
  
  return {
    remaining,
    dailyLimit: remaining, // Will be divided by days in the generator
    canProceed: true,
  };
};

// ZERO-OVERHEAD: Select activities that fit within daily budget
export const selectActivitiesWithinBudget = (
  availableActivities: { name: string; cost: number; type: string; priority?: number }[],
  dailyBudget: number,
  maxActivities: number = 5
): { selected: typeof availableActivities; totalCost: number } => {
  const selected: typeof availableActivities = [];
  let totalCost = 0;
  
  // Sort by priority (higher first), then cost (lower first for efficiency)
  const sorted = [...availableActivities].sort((a, b) => {
    const priorityDiff = (b.priority || 0) - (a.priority || 0);
    if (priorityDiff !== 0) return priorityDiff;
    return a.cost - b.cost;
  });
  
  for (const activity of sorted) {
    // Free activities always fit
    if (activity.cost === 0) {
      selected.push(activity);
      continue;
    }
    
    // Check if adding this activity stays within budget
    if (totalCost + activity.cost <= dailyBudget && selected.length < maxActivities) {
      selected.push(activity);
      totalCost += activity.cost;
    }
  }
  
  return { selected, totalCost };
};
