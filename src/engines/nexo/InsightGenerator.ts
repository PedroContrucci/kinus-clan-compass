// Motor Nexo — Gerador de Insights do Consultor

import { ConsultorInsight, TRUST_ZONE_MIN, TRUST_ZONE_MAX } from './types';

interface InsightContext {
  usagePercent: number;
  optimizationAttempted: boolean;
  optimizationSuccess: boolean;
  type: 'upgrade' | 'downgrade' | null;
  savings: number;
  totalBudget: number;
}

const INSIGHTS = {
  suboptimal: {
    couldNotUpgrade: {
      title: 'Destino com alta sazonal',
      reason: 'Os preços atuais são os melhores disponíveis para o período. Upgrades não estão disponíveis sem ultrapassar seu limite.',
      suggestion: 'Considere reservar com antecedência na próxima vez ou escolher datas fora de alta temporada.',
      severity: 'info' as const
    },
    lowUsage: {
      title: 'Dá pra otimizar mais!',
      reason: 'Seu roteiro está utilizando menos de 80% do budget. Há espaço para experiências adicionais.',
      suggestion: 'Que tal adicionar um tour gastronômico ou uma experiência cultural exclusiva?',
      severity: 'info' as const
    }
  },
  overflow: {
    couldNotDowngrade: {
      title: 'Budget precisa de ajuste',
      reason: 'Mesmo com ajustes, o roteiro não cabe no orçamento atual. Os custos fixos (voo + hotel) consomem a maior parte.',
      suggestion: 'Considere aumentar o budget em 15-20% ou reduzir o número de dias da viagem.',
      severity: 'critical' as const
    },
    slightOverflow: {
      title: 'Quase lá!',
      reason: 'O roteiro está levemente acima do budget. Pequenos ajustes podem resolver.',
      suggestion: 'Avalie trocar uma refeição premium por opções locais ou ajustar o transporte.',
      severity: 'warning' as const
    }
  },
  ideal: {
    perfectBalance: {
      title: 'Roteiro otimizado ✓',
      reason: 'Seu planejamento está na zona ideal de aproveitamento do budget.',
      suggestion: 'Continue assim! A proporção entre custos e experiências está excelente.',
      severity: 'info' as const
    }
  }
};

export const generateInsight = (context: InsightContext): ConsultorInsight | undefined => {
  const { usagePercent, optimizationAttempted, optimizationSuccess, type, savings, totalBudget } = context;
  
  // IDEAL — Dentro da Trust Zone
  if (usagePercent >= TRUST_ZONE_MIN && usagePercent <= TRUST_ZONE_MAX) {
    return INSIGHTS.ideal.perfectBalance;
  }
  
  // SUBOPTIMAL — Abaixo de 80%
  if (usagePercent < TRUST_ZONE_MIN) {
    if (optimizationAttempted && !optimizationSuccess) {
      return INSIGHTS.suboptimal.couldNotUpgrade;
    }
    return {
      ...INSIGHTS.suboptimal.lowUsage,
      suggestion: `Você tem R$ ${savings.toLocaleString()} disponíveis. ${INSIGHTS.suboptimal.lowUsage.suggestion}`
    };
  }
  
  // OVERFLOW — Acima de 100%
  if (usagePercent > TRUST_ZONE_MAX) {
    const overflowAmount = (usagePercent - 1) * totalBudget;
    const overflowPercent = ((usagePercent - 1) * 100).toFixed(0);
    
    if (optimizationAttempted && !optimizationSuccess) {
      return {
        ...INSIGHTS.overflow.couldNotDowngrade,
        reason: `O roteiro excede o budget em R$ ${overflowAmount.toLocaleString()} (${overflowPercent}%). ${INSIGHTS.overflow.couldNotDowngrade.reason}`
      };
    }
    
    if (overflowAmount < totalBudget * 0.1) {
      return INSIGHTS.overflow.slightOverflow;
    }
    
    return INSIGHTS.overflow.couldNotDowngrade;
  }
  
  return undefined;
};

export const generateJustification = (
  usagePercent: number,
  optimizations: { action: string; delta: number }[]
): string => {
  const percent = (usagePercent * 100).toFixed(0);
  
  if (optimizations.length === 0) {
    return `Roteiro em ${percent}% do budget — sem ajustes necessários.`;
  }
  
  const totalDelta = optimizations.reduce((sum, opt) => sum + Math.abs(opt.delta), 0);
  const action = optimizations[0].action === 'upgrade' ? 'adicionados' : 'economizados';
  
  return `Roteiro ajustado para ${percent}% do budget. R$ ${totalDelta.toLocaleString()} ${action} via otimização automática.`;
};
