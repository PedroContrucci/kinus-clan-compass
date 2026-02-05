// BudgetEngine — Trust Zone (80-100%) validation

import type { PlanningInput, PlanningOutput } from '@/types/planning';

const TRUST_ZONE = { min: 0.80, max: 1.00 };

// Base cost estimates per destination (simplified for MVP)
const DESTINATION_COSTS: Record<string, { flight: number; hotelPerNight: number; activitiesPerDay: number }> = {
  'Paris': { flight: 8000, hotelPerNight: 800, activitiesPerDay: 400 },
  'Tóquio': { flight: 12000, hotelPerNight: 600, activitiesPerDay: 500 },
  'Roma': { flight: 7000, hotelPerNight: 700, activitiesPerDay: 350 },
  'Lisboa': { flight: 5000, hotelPerNight: 500, activitiesPerDay: 300 },
  'Barcelona': { flight: 6000, hotelPerNight: 600, activitiesPerDay: 350 },
  'Nova York': { flight: 5500, hotelPerNight: 1200, activitiesPerDay: 600 },
  'Londres': { flight: 7500, hotelPerNight: 1000, activitiesPerDay: 500 },
  'Bali': { flight: 10000, hotelPerNight: 400, activitiesPerDay: 250 },
  'default': { flight: 7000, hotelPerNight: 600, activitiesPerDay: 350 },
};

// Priority multipliers
const PRIORITY_MULTIPLIERS = {
  flight: { flight: 1.2, accommodation: 0.95, experiences: 0.95 },
  accommodation: { flight: 0.95, accommodation: 1.2, experiences: 0.95 },
  experiences: { flight: 0.95, accommodation: 0.95, experiences: 1.2 },
};

export function calculateBudget(input: PlanningInput): PlanningOutput {
  const { destination, departureDate, returnDate, clan, budget } = input;
  
  // Calculate trip duration
  const days = Math.ceil((returnDate.getTime() - departureDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const nights = days - 1;
  
  // Get destination costs or default
  const costs = DESTINATION_COSTS[destination] || DESTINATION_COSTS['default'];
  
  // Calculate travelers (children under 2 are free for flights)
  const payingFlyers = clan.filter(m => m.type === 'adult' || (m.age && m.age >= 2)).length;
  const totalTravelers = clan.length;
  
  // Base estimates
  const baseFlightCost = costs.flight * payingFlyers;
  const baseAccommodationCost = costs.hotelPerNight * nights * Math.ceil(totalTravelers / 2);
  const baseExperiencesCost = costs.activitiesPerDay * days * totalTravelers;
  
  // Apply priority multipliers
  const multipliers = PRIORITY_MULTIPLIERS[budget.priority];
  const flightEstimate = Math.round(baseFlightCost * multipliers.flight);
  const accommodationEstimate = Math.round(baseAccommodationCost * multipliers.accommodation);
  const experiencesEstimate = Math.round(baseExperiencesCost * multipliers.experiences);
  
  // Buffer (10% of total)
  const subtotal = flightEstimate + accommodationEstimate + experiencesEstimate;
  const bufferEstimate = Math.round(subtotal * 0.10);
  
  const allocatedBudget = subtotal + bufferEstimate;
  const usagePercent = allocatedBudget / budget.total;
  
  // Check Trust Zone
  const isWithin = usagePercent >= TRUST_ZONE.min && usagePercent <= TRUST_ZONE.max;
  
  // Generate insight based on status
  let insight: PlanningOutput['insight'];
  let status: PlanningOutput['status'];
  
  if (usagePercent < TRUST_ZONE.min) {
    status = 'under_budget';
    insight = {
      title: 'Sobrou margem!',
      message: `Seu roteiro usa apenas ${Math.round(usagePercent * 100)}% do budget.`,
      suggestion: 'Que tal subir a categoria do hotel ou adicionar uma experiência premium?',
      severity: 'info',
    };
  } else if (usagePercent > TRUST_ZONE.max) {
    status = 'over_budget';
    insight = {
      title: 'Budget apertado',
      message: `O roteiro ideal custa ${Math.round((usagePercent - 1) * 100)}% a mais.`,
      suggestion: 'Considere reduzir 1 noite ou trocar o hotel de luxo por conforto.',
      severity: 'warning',
    };
  } else {
    status = 'valid';
  }
  
  return {
    status,
    allocatedBudget,
    usagePercent,
    trustZone: {
      min: budget.total * TRUST_ZONE.min,
      max: budget.total * TRUST_ZONE.max,
      isWithin,
    },
    breakdown: {
      flight: {
        estimated: flightEstimate,
        percent: Math.round((flightEstimate / allocatedBudget) * 100),
      },
      accommodation: {
        estimated: accommodationEstimate,
        percent: Math.round((accommodationEstimate / allocatedBudget) * 100),
      },
      experiences: {
        estimated: experiencesEstimate,
        percent: Math.round((experiencesEstimate / allocatedBudget) * 100),
      },
      buffer: {
        estimated: bufferEstimate,
        percent: Math.round((bufferEstimate / allocatedBudget) * 100),
      },
    },
    insight,
  };
}

export default calculateBudget;
