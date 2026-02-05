// Motor Nexo — Validador de Budget

import { 
  NexoBudgetInput, 
  NexoBudgetOutput, 
  TrustZone,
  TRUST_ZONE_MIN,
  TRUST_ZONE_MAX
} from './types';

export interface ValidationResult {
  usedBudget: number;
  usagePercent: number;
  savings: number;
  trustZone: TrustZone;
  needsOptimization: boolean;
  optimizationType: 'upgrade' | 'downgrade' | null;
}

export const validateBudget = (input: NexoBudgetInput): ValidationResult => {
  const { totalBudget, itineraryItems } = input;
  
  // Calcular custo total
  const usedBudget = itineraryItems.reduce((sum, item) => sum + item.cost, 0);
  
  // Calcular porcentagem de uso
  const usagePercent = totalBudget > 0 ? usedBudget / totalBudget : 0;
  
  // Calcular economia potencial
  const savings = totalBudget - usedBudget;
  
  // Definir Trust Zone
  const trustZone: TrustZone = {
    min: totalBudget * TRUST_ZONE_MIN,
    max: totalBudget * TRUST_ZONE_MAX,
    current: usedBudget
  };
  
  // Determinar se precisa otimização
  let needsOptimization = false;
  let optimizationType: 'upgrade' | 'downgrade' | null = null;
  
  if (usagePercent < TRUST_ZONE_MIN) {
    // Subutilizado — tentar upgrade
    needsOptimization = true;
    optimizationType = 'upgrade';
  } else if (usagePercent > TRUST_ZONE_MAX) {
    // Estouro — tentar downgrade
    needsOptimization = true;
    optimizationType = 'downgrade';
  }
  
  return {
    usedBudget,
    usagePercent,
    savings,
    trustZone,
    needsOptimization,
    optimizationType
  };
};

export const getInitialStatus = (usagePercent: number): NexoBudgetOutput['status'] => {
  if (usagePercent >= TRUST_ZONE_MIN && usagePercent <= TRUST_ZONE_MAX) {
    return 'IDEAL';
  }
  if (usagePercent < TRUST_ZONE_MIN) {
    return 'SUBOPTIMAL';
  }
  return 'OVERFLOW';
};
