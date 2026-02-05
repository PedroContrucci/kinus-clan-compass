// Planning Types — KINU Travel OS

import { ClanMember } from './dashboard';

export interface PlanningInput {
  origin: string;
  destination: string;
  departureDate: Date;
  returnDate: Date;
  clan: ClanMember[];
  budget: {
    total: number;
    currency: 'BRL' | 'USD' | 'EUR';
    priority: 'flight' | 'accommodation' | 'experiences';
    distribution?: { flight: number; accommodation: number; experiences: number };
  };
}

export interface PlanningOutput {
  status: 'valid' | 'under_budget' | 'over_budget';
  allocatedBudget: number;
  usagePercent: number;
  trustZone: { min: number; max: number; isWithin: boolean };
  breakdown: {
    flight: { estimated: number; percent: number };
    accommodation: { estimated: number; percent: number };
    experiences: { estimated: number; percent: number };
    buffer: { estimated: number; percent: number };
  };
  insight?: { 
    title: string; 
    message: string; 
    suggestion: string; 
    severity: 'info' | 'warning' 
  };
}
