// Motor Nexo — Tipos de Governança de Budget

export interface NexoBudgetInput {
  totalBudget: number;
  currency: 'BRL' | 'USD' | 'EUR';
  itineraryItems: ItineraryItem[];
}

export interface ItineraryItem {
  id: string;
  name: string;
  category: 'flight' | 'hotel' | 'activity' | 'food' | 'transport' | 'shopping';
  cost: number;
  tier?: 'standard' | 'comfort' | 'premium';
}

export interface NexoBudgetOutput {
  status: 'IDEAL' | 'SUBOPTIMAL' | 'OVERFLOW' | 'JUSTIFIED';
  usedBudget: number;
  usagePercent: number;
  savings: number;
  trustZone: TrustZone;
  insight?: ConsultorInsight;
  optimizations?: Optimization[];
}

export interface TrustZone {
  min: number;
  max: number;
  current: number;
}

export interface Optimization {
  itemId: string;
  action: 'upgrade' | 'downgrade';
  from: string;
  to: string;
  delta: number;
}

export interface ConsultorInsight {
  title: string;
  reason: string;
  suggestion: string;
  severity: 'info' | 'warning' | 'critical';
}

// Constants
export const TRUST_ZONE_MIN = 0.80;
export const TRUST_ZONE_MAX = 1.00;
