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
