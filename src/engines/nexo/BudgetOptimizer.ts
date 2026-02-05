// Motor Nexo — Otimizador de Budget

import { 
  ItineraryItem, 
  Optimization, 
  TRUST_ZONE_MIN, 
  TRUST_ZONE_MAX 
} from './types';

const TIER_MULTIPLIERS = {
  standard: 1.0,
  comfort: 1.4,
  premium: 2.0
};

const TIER_ORDER: Array<'standard' | 'comfort' | 'premium'> = ['standard', 'comfort', 'premium'];

export interface OptimizationResult {
  success: boolean;
  optimizations: Optimization[];
  newTotal: number;
  newUsagePercent: number;
}

export const tryUpgrade = (
  items: ItineraryItem[], 
  totalBudget: number, 
  currentTotal: number
): OptimizationResult => {
  const targetMin = totalBudget * TRUST_ZONE_MIN;
  const optimizations: Optimization[] = [];
  let newTotal = currentTotal;
  
  // Ordenar por custo (menor primeiro) para upgrades mais impactantes
  const upgradeableItems = items
    .filter(item => 
      (item.category === 'hotel' || item.category === 'activity') &&
      item.tier !== 'premium'
    )
    .sort((a, b) => b.cost - a.cost);
  
  for (const item of upgradeableItems) {
    if (newTotal >= targetMin) break;
    
    const currentTier = item.tier || 'standard';
    const currentTierIndex = TIER_ORDER.indexOf(currentTier);
    
    if (currentTierIndex < TIER_ORDER.length - 1) {
      const nextTier = TIER_ORDER[currentTierIndex + 1];
      const multiplierDiff = TIER_MULTIPLIERS[nextTier] / TIER_MULTIPLIERS[currentTier];
      const newCost = item.cost * multiplierDiff;
      const delta = newCost - item.cost;
      
      // Verificar se não estoura
      if (newTotal + delta <= totalBudget * TRUST_ZONE_MAX) {
        optimizations.push({
          itemId: item.id,
          action: 'upgrade',
          from: currentTier,
          to: nextTier,
          delta
        });
        newTotal += delta;
      }
    }
  }
  
  return {
    success: newTotal >= targetMin,
    optimizations,
    newTotal,
    newUsagePercent: newTotal / totalBudget
  };
};

export const tryDowngrade = (
  items: ItineraryItem[], 
  totalBudget: number, 
  currentTotal: number
): OptimizationResult => {
  const targetMax = totalBudget * TRUST_ZONE_MAX;
  const optimizations: Optimization[] = [];
  let newTotal = currentTotal;
  
  // Ordenar por custo (maior primeiro) para downgrades mais efetivos
  const downgradeableItems = items
    .filter(item => 
      (item.category === 'hotel' || item.category === 'activity') &&
      item.tier !== 'standard'
    )
    .sort((a, b) => b.cost - a.cost);
  
  for (const item of downgradeableItems) {
    if (newTotal <= targetMax) break;
    
    const currentTier = item.tier || 'comfort';
    const currentTierIndex = TIER_ORDER.indexOf(currentTier);
    
    if (currentTierIndex > 0) {
      const prevTier = TIER_ORDER[currentTierIndex - 1];
      const multiplierDiff = TIER_MULTIPLIERS[prevTier] / TIER_MULTIPLIERS[currentTier];
      const newCost = item.cost * multiplierDiff;
      const delta = item.cost - newCost;
      
      optimizations.push({
        itemId: item.id,
        action: 'downgrade',
        from: currentTier,
        to: prevTier,
        delta: -delta
      });
      newTotal -= delta;
    }
  }
  
  return {
    success: newTotal <= targetMax,
    optimizations,
    newTotal,
    newUsagePercent: newTotal / totalBudget
  };
};

export const optimize = (
  items: ItineraryItem[],
  totalBudget: number,
  currentTotal: number,
  type: 'upgrade' | 'downgrade'
): OptimizationResult => {
  if (type === 'upgrade') {
    return tryUpgrade(items, totalBudget, currentTotal);
  }
  return tryDowngrade(items, totalBudget, currentTotal);
};
