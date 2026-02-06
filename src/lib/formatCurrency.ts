// Currency formatting utilities with NaN protection

/**
 * Safely format a number as BRL currency
 * Returns placeholder if value is NaN, undefined, or null
 */
export function formatBRL(value: number | null | undefined, placeholder: string = 'R$ --'): string {
  if (value === null || value === undefined || isNaN(value)) {
    return placeholder;
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Safely format a number with locale
 * Returns placeholder if value is NaN, undefined, or null
 */
export function formatNumber(value: number | null | undefined, placeholder: string = '--'): string {
  if (value === null || value === undefined || isNaN(value)) {
    return placeholder;
  }
  
  return value.toLocaleString('pt-BR');
}

/**
 * Safely format a percentage
 * Returns placeholder if value is NaN, undefined, or null
 */
export function formatPercent(value: number | null | undefined, placeholder: string = '--%'): string {
  if (value === null || value === undefined || isNaN(value)) {
    return placeholder;
  }
  
  return `${Math.round(value)}%`;
}

/**
 * Safely format a number as currency with any code
 */
export function formatCurrency(
  value: number | null | undefined, 
  currency: string = 'BRL',
  placeholder: string = '--'
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return placeholder;
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Calculate percentage safely
 */
export function safePercent(part: number | null | undefined, total: number | null | undefined): number {
  if (!part || !total || total === 0) return 0;
  const result = (part / total) * 100;
  return isNaN(result) ? 0 : result;
}

/**
 * Safe division that returns 0 instead of NaN/Infinity
 */
export function safeDivide(numerator: number, denominator: number, fallback: number = 0): number {
  if (denominator === 0 || isNaN(numerator) || isNaN(denominator)) {
    return fallback;
  }
  const result = numerator / denominator;
  return isNaN(result) || !isFinite(result) ? fallback : result;
}
