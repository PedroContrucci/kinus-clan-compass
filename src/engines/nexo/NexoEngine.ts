// Motor Nexo — Orquestrador Principal

import { 
  NexoBudgetInput, 
  NexoBudgetOutput,
  TRUST_ZONE_MIN,
  TRUST_ZONE_MAX
} from './types';
import { validateBudget, getInitialStatus } from './BudgetValidator';
import { optimize, OptimizationResult } from './BudgetOptimizer';
import { generateInsight } from './InsightGenerator';

export const runNexoEngine = (input: NexoBudgetInput): NexoBudgetOutput => {
  // ═══════════════════════════════════════════════════════
  // FASE 1: VALIDAÇÃO INICIAL
  // ═══════════════════════════════════════════════════════
  
  const validation = validateBudget(input);
  const initialStatus = getInitialStatus(validation.usagePercent);
  
  // Se já está ideal, retorna direto
  if (initialStatus === 'IDEAL') {
    const insight = generateInsight({
      usagePercent: validation.usagePercent,
      optimizationAttempted: false,
      optimizationSuccess: false,
      type: null,
      savings: validation.savings,
      totalBudget: input.totalBudget
    });
    
    return {
      status: 'IDEAL',
      usedBudget: validation.usedBudget,
      usagePercent: validation.usagePercent,
      savings: validation.savings,
      trustZone: validation.trustZone,
      insight
    };
  }
  
  // ═══════════════════════════════════════════════════════
  // FASE 2: TENTATIVA DE OTIMIZAÇÃO
  // ═══════════════════════════════════════════════════════
  
  let optimizationResult: OptimizationResult | null = null;
  
  if (validation.needsOptimization && validation.optimizationType) {
    optimizationResult = optimize(
      input.itineraryItems,
      input.totalBudget,
      validation.usedBudget,
      validation.optimizationType
    );
  }
  
  // ═══════════════════════════════════════════════════════
  // FASE 3: GERAR INSIGHT
  // ═══════════════════════════════════════════════════════
  
  const insight = generateInsight({
    usagePercent: optimizationResult?.newUsagePercent ?? validation.usagePercent,
    optimizationAttempted: !!optimizationResult,
    optimizationSuccess: optimizationResult?.success ?? false,
    type: validation.optimizationType,
    savings: validation.savings,
    totalBudget: input.totalBudget
  });
  
  // ═══════════════════════════════════════════════════════
  // FASE 4: DETERMINAR STATUS FINAL
  // ═══════════════════════════════════════════════════════
  
  let finalStatus: NexoBudgetOutput['status'];
  let finalUsedBudget = validation.usedBudget;
  let finalUsagePercent = validation.usagePercent;
  
  if (optimizationResult?.success) {
    // Otimização bem-sucedida
    finalStatus = 'IDEAL';
    finalUsedBudget = optimizationResult.newTotal;
    finalUsagePercent = optimizationResult.newUsagePercent;
  } else if (optimizationResult && !optimizationResult.success) {
    // Tentou otimizar mas não conseguiu caber na Trust Zone
    finalStatus = 'JUSTIFIED';
    // Ainda assim aplica as otimizações parciais
    finalUsedBudget = optimizationResult.newTotal;
    finalUsagePercent = optimizationResult.newUsagePercent;
  } else {
    // Não tentou otimizar ou não precisava
    finalStatus = initialStatus;
  }
  
  // ═══════════════════════════════════════════════════════
  // FASE 5: RETORNAR OUTPUT
  // ═══════════════════════════════════════════════════════
  
  return {
    status: finalStatus,
    usedBudget: finalUsedBudget,
    usagePercent: finalUsagePercent,
    savings: input.totalBudget - finalUsedBudget,
    trustZone: {
      min: input.totalBudget * TRUST_ZONE_MIN,
      max: input.totalBudget * TRUST_ZONE_MAX,
      current: finalUsedBudget
    },
    insight,
    optimizations: optimizationResult?.optimizations
  };
};

export default runNexoEngine;
