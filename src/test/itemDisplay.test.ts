// C.4.1 itens 1 e 2 — rótulo pela natureza (não pelo slot: check-out 23:15 tem timeSlot 'morning') e duração legível.
import { describe, it, expect } from 'vitest';
import { isLogisticsItem, durationLabel } from '@/lib/itemDisplay';

describe('rótulo e duração na tela', () => {
  it('check-out 23:15, transfer 23:45, check-in e voo → "Logística"', () => {
    expect(isLogisticsItem({ id: 'day-3-slot-checkout', type: 'transport' })).toBe(true);
    expect(isLogisticsItem({ id: 'day-3-slot-transfer', type: 'transport' })).toBe(true);
    expect(isLogisticsItem({ id: 'day-0-slot-checkin', type: 'checkin' })).toBe(true);
    expect(isLogisticsItem({ id: 'day-0-slot-flight-out', type: 'flight' })).toBe(true);
    expect(isLogisticsItem({ id: 'day-1-for-museu', type: 'experience' })).toBe(false);
  });

  it('"0.5h" → "30 min", "0.75h" → "45 min", "1.5h" → "1h30", "5h" → "5h"', () => {
    expect(durationLabel('0.5h')).toBe('30 min');
    expect(durationLabel('0.75h')).toBe('45 min');
    expect(durationLabel('1.5h')).toBe('1h30');
    expect(durationLabel('5h')).toBe('5h');
  });
});
