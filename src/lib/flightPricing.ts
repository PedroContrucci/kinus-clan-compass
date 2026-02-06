// Flight pricing utilities with realistic estimates
// Uses database estimates when Amadeus test API returns fictional values

import { supabase } from '@/integrations/supabase/client';

export interface FlightPriceEstimate {
  origin: string;
  destination: string;
  economyMin: number;
  economyAvg: number;
  economyMax: number;
  businessAvg: number;
}

// Day of week price variation
const DAY_OF_WEEK_MULTIPLIERS: Record<number, number> = {
  0: 1.05,  // Sunday (+5%)
  1: 0.95,  // Monday (-5%)
  2: 0.90,  // Tuesday (-10% - best day)
  3: 0.92,  // Wednesday (-8%)
  4: 0.98,  // Thursday (-2%)
  5: 1.10,  // Friday (+10% - worst day)
  6: 1.08,  // Saturday (+8%)
};

// Season multipliers (month)
const SEASON_MULTIPLIERS: Record<number, number> = {
  0: 1.15,   // January (high season Brazil)
  1: 0.95,   // February
  2: 0.90,   // March (low)
  3: 0.92,   // April
  4: 0.95,   // May
  5: 1.10,   // June (European summer start)
  6: 1.20,   // July (high season)
  7: 1.15,   // August
  8: 0.95,   // September
  9: 0.90,   // October (low)
  10: 0.92,  // November
  11: 1.25,  // December (highest)
};

// Fallback estimates if not in database (by route type)
const FALLBACK_ESTIMATES: Record<string, FlightPriceEstimate> = {
  'europe': { origin: 'GRU', destination: 'EUR', economyMin: 3000, economyAvg: 5000, economyMax: 8000, businessAvg: 16000 },
  'usa': { origin: 'GRU', destination: 'USA', economyMin: 2500, economyAvg: 4500, economyMax: 7000, businessAvg: 15000 },
  'asia': { origin: 'GRU', destination: 'ASIA', economyMin: 4500, economyAvg: 7500, economyMax: 12000, businessAvg: 25000 },
  'default': { origin: 'GRU', destination: 'XXX', economyMin: 3500, economyAvg: 5500, economyMax: 8500, businessAvg: 18000 },
};

/**
 * Get flight price estimate from database or fallback
 */
export async function getFlightPriceEstimate(
  origin: string,
  destination: string
): Promise<FlightPriceEstimate> {
  try {
    const { data, error } = await supabase
      .from('flight_price_estimates')
      .select('*')
      .eq('origin_code', origin.toUpperCase())
      .eq('destination_code', destination.toUpperCase())
      .single();
    
    if (data && !error) {
      return {
        origin: data.origin_code,
        destination: data.destination_code,
        economyMin: Number(data.economy_min),
        economyAvg: Number(data.economy_avg),
        economyMax: Number(data.economy_max) || Number(data.economy_avg) * 1.5,
        businessAvg: Number(data.business_avg) || Number(data.economy_avg) * 3,
      };
    }
  } catch (e) {
    console.warn('Flight price estimate lookup failed:', e);
  }
  
  // Fallback by region
  const europeDestinations = ['CDG', 'FCO', 'LIS', 'MAD', 'BCN', 'LHR', 'AMS', 'FRA'];
  const usaDestinations = ['JFK', 'LAX', 'MIA', 'ORD', 'SFO'];
  const asiaDestinations = ['NRT', 'HND', 'ICN', 'SIN', 'HKG', 'BKK', 'DPS'];
  
  if (europeDestinations.includes(destination.toUpperCase())) {
    return FALLBACK_ESTIMATES.europe;
  }
  if (usaDestinations.includes(destination.toUpperCase())) {
    return FALLBACK_ESTIMATES.usa;
  }
  if (asiaDestinations.includes(destination.toUpperCase())) {
    return FALLBACK_ESTIMATES.asia;
  }
  
  return FALLBACK_ESTIMATES.default;
}

/**
 * Calculate realistic price for a specific date
 */
export function calculateDatePrice(
  basePrice: number,
  date: Date,
  options: { includeVariation?: boolean } = {}
): number {
  const dayOfWeek = date.getDay();
  const month = date.getMonth();
  
  let price = basePrice;
  
  // Apply day of week variation
  price *= DAY_OF_WEEK_MULTIPLIERS[dayOfWeek];
  
  // Apply season variation
  price *= SEASON_MULTIPLIERS[month];
  
  // Add random variation ±5%
  if (options.includeVariation) {
    const variation = 0.95 + Math.random() * 0.10;
    price *= variation;
  }
  
  return Math.round(price);
}

/**
 * Adjust Amadeus API price to realistic range
 * Amadeus test API returns fictional values
 */
export function normalizeAmadeusPrice(
  amadeusPrice: number,
  estimate: FlightPriceEstimate,
  date: Date
): number {
  // If Amadeus price is suspiciously low (test data), use estimate
  if (amadeusPrice < estimate.economyMin * 0.5) {
    return calculateDatePrice(estimate.economyAvg, date);
  }
  
  // If Amadeus price is in realistic range, use it with date adjustment
  if (amadeusPrice >= estimate.economyMin && amadeusPrice <= estimate.economyMax) {
    const dayMultiplier = DAY_OF_WEEK_MULTIPLIERS[date.getDay()];
    return Math.round(amadeusPrice * dayMultiplier);
  }
  
  // If too high, cap at max
  if (amadeusPrice > estimate.economyMax * 1.5) {
    return calculateDatePrice(estimate.economyMax, date);
  }
  
  return Math.round(amadeusPrice);
}

/**
 * Get price tag for a flight price
 */
export function getPriceTag(
  price: number,
  estimate: FlightPriceEstimate
): { tag: string; color: string; description: string } {
  const percentOfAvg = (price / estimate.economyAvg) * 100;
  
  if (price <= estimate.economyMin) {
    return { 
      tag: '🏆 Melhor Preço', 
      color: 'text-emerald-500 bg-emerald-500/10',
      description: 'Preço excepcional! Menor que a média histórica.'
    };
  }
  
  if (percentOfAvg <= 85) {
    return { 
      tag: '💚 Ótimo Preço', 
      color: 'text-emerald-400 bg-emerald-400/10',
      description: 'Preço abaixo da média. Boa oportunidade!'
    };
  }
  
  if (percentOfAvg <= 105) {
    return { 
      tag: '✅ Preço Justo', 
      color: 'text-primary bg-primary/10',
      description: 'Preço dentro da média esperada.'
    };
  }
  
  if (percentOfAvg <= 130) {
    return { 
      tag: '⚠️ Acima da Média', 
      color: 'text-amber-500 bg-amber-500/10',
      description: 'Preço um pouco acima da média. Considere datas flexíveis.'
    };
  }
  
  return { 
    tag: '💰 Preço Alto', 
    color: 'text-red-500 bg-red-500/10',
    description: 'Preço significativamente acima da média.'
  };
}

/**
 * Get KINU tip for flight pricing
 */
export function getFlightTip(
  price: number,
  estimate: FlightPriceEstimate,
  departureDate: Date
): string | null {
  const dayOfWeek = departureDate.getDay();
  const month = departureDate.getMonth();
  
  // Best days tip
  if (dayOfWeek === 5 || dayOfWeek === 6) {
    return `Voar na terça ou quarta pode economizar até R$ ${Math.round(price * 0.15).toLocaleString('pt-BR')}`;
  }
  
  // Season tip
  if ([6, 11, 0].includes(month)) {
    return 'Alta temporada! Se possível, considere viajar em meses de baixa (Mar-Mai ou Set-Nov).';
  }
  
  // Good price tip
  if (price <= estimate.economyMin * 1.1) {
    return 'Excelente preço! Este é um dos melhores valores para esta rota. 🎯';
  }
  
  return null;
}
