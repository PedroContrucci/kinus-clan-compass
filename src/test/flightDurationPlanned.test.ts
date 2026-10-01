import { describe, it, expect } from 'vitest';
import { plannedFlightToSelected } from '@/components/cockpit/DraftCockpit';

const baseFlight = {
  id: 'flight-planned-1',
  origin: 'GRU',
  destination: 'CTG',
  departureTime: '23:00',
  arrivalTime: '11:30',
  departureDate: '2026-11-10',
  arrivalDate: '2026-11-11',
  duration: '7.5h',
  price: 1200,
  airline: 'A confirmar',
  stops: 0,
};

const minutesOf = (duration: string): number =>
  plannedFlightToSelected({ ...baseFlight, duration }, new Date('2026-11-10')).option.durationMinutes;

describe('plannedFlightToSelected duration parse', () => {
  it('"7.5h" → 450 minutos (não 300, nem 0)', () => {
    expect(minutesOf('7.5h')).toBe(450);
  });
  it('"3h" → 180 minutos', () => {
    expect(minutesOf('3h')).toBe(180);
  });
  it('"11.25h" → 675 minutos', () => {
    expect(minutesOf('11.25h')).toBe(675);
  });
  it('duração ausente → 0', () => {
    expect(minutesOf('')).toBe(0);
  });
  it('string sem "h" → 0', () => {
    expect(minutesOf('450 minutos')).toBe(0);
  });
});
