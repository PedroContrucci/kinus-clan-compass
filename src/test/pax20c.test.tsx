import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { runItineraryEngine, type SelectedFlight } from '@/lib/itineraryEngine';
import { kinuDidLines } from '@/lib/onboardingFlow';
import { FlightPriceLines } from '@/components/cockpit/FlightPriceLines';

const fl = (d: string): SelectedFlight => ({
  date: new Date(d), source: 'estimate',
  option: { id: 'e', airline: 'A', route: 'GRU', isDirect: true, duration: '7.5h', durationMinutes: 450, price: 1000, departureTime: '10:00', arrivalTime: '15:30' },
});
const run = (travelers: number, pax?: { adults: number; children: number; infants: number }) =>
  runItineraryEngine({
    departureDate: new Date('2026-12-10T12:00:00'), returnDate: new Date('2026-12-14T12:00:00'),
    destination: 'Lisboa', origin: 'São Paulo', outboundFlight: fl('2026-12-10'), returnFlight: fl('2026-12-14'),
    budget: 30000, travelers, pax,
  });
const legs = (r: ReturnType<typeof run>) => r.days.flatMap((d) => d.activities).filter((a) => a.type === 'flight');

describe('M20c — resumo do rascunho', () => {
  it('2 adultos + 2 crianças no lugar de "4 pessoas"', () => {
    const l = kinuDidLines({ destination: 'Lisboa', travelers: 4, adults: 2, children: 2, infants: 0, budget: 20000, days: [] });
    expect(l.budget).toContain('estimativa para 2 adultos + 2 crianças,');
    expect(l.budget).not.toContain('pessoas');
  });
});

describe('M20c — hero do voo', () => {
  const base = { travelers: 4, adults: 2, children: 2, outboundFlight: { source: 'reference' }, returnFlight: { source: 'reference' } };
  it('idades 8 e 12: família + o que a tarifa conta; nunca "total"', () => {
    const { container } = render(<FlightPriceLines trip={{ ...base, childrenAges: [8, 12] }} amount={6000} confirmed={false} />);
    const t = screen.getByTestId('flight-price-basis').textContent!;
    expect(t).toContain('estimativa para 2 adultos + 2 crianças · tarifa aérea conta 3 adultos + 1 criança (12+ paga adulto)');
    expect(container.textContent?.toLowerCase()).not.toContain('total');
  });
  it('sem diferença: só a composição', () => {
    render(<FlightPriceLines trip={{ ...base, childrenAges: [8, 9] }} amount={6000} confirmed={false} />);
    const t = screen.getByTestId('flight-price-basis').textContent!;
    expect(t).toContain('estimativa para 2 adultos + 2 crianças · preço de referência');
    expect(t).not.toContain('tarifa aérea conta');
  });
});

describe('M20c — linhas de voo do roteiro', () => {
  it('1 bebê: pernas × pagantes (4), não × travelers (5)', () => {
    const r = run(5, { adults: 2, children: 2, infants: 1 });
    const ls = legs(r);
    expect(ls).toHaveLength(2);
    for (const a of ls) { expect(a.estimatedCost).toBe(4000); expect(a.location).toContain('(4 pagantes)'); }
    expect(r.breakdown.flights.amount).toBe(8000);
  });
  it('sem bebê: idêntico a antes (× travelers, "(N pax)")', () => {
    const withPax = legs(run(4, { adults: 2, children: 2, infants: 0 }));
    const without = legs(run(4));
    for (const a of [...withPax, ...without]) { expect(a.estimatedCost).toBe(4000); expect(a.location).toContain('(4 pax)'); }
  });
});
