import { describe, it, expect } from 'vitest';
import { flightChoiceLine, flightAppliedNotice } from '@/lib/flightRanking';
import { kinuDidLines } from '@/lib/onboardingFlow';
import type { SelectedFlight } from '@/lib/itineraryEngine';

const leg = (price: number, over: Partial<SelectedFlight> = {}): SelectedFlight => ({
  date: new Date('2026-12-10'), source: 'reference', chosenBy: 'kinu', kinuPick: { offers: 3, averagePrice: 3000, mode: 'kinu' },
  option: { id: `x${price}`, airline: 'LATAM', route: 'GRU → LIS', isDirect: false, duration: '10h', durationMinutes: 600, price, departureTime: '20:00', arrivalTime: '11:00' },
  ...over,
} as unknown as SelectedFlight);

const trip = (over: Record<string, unknown> = {}) => ({
  destination: 'Lisboa', travelers: 4, adults: 2, children: 2, infants: 0, budget: 30000, budgetType: 'comfort', budgetSource: 'user',
  startDate: '2026-12-10T12:00:00', endDate: '2026-12-15T12:00:00', days: [],
  outboundFlight: leg(2654), returnFlight: leg(4759),
  finances: { categories: { flights: { planned: 29652 } } },
  ...over,
});

describe('M25b — rótulos do voo e do teto', () => {
  it('painel: ida + volta por pessoa e o total de flights.planned', () => {
    const l = kinuDidLines(trip()).flight;
    expect(l).toContain('ida + volta R$ 7.413/pessoa · R$ 29.652 para 4 pagantes');
    expect(l).not.toContain('(com estimativa)');
  });
  it('perna estimada: "(com estimativa)" depois do valor por pessoa', () => {
    const l = kinuDidLines(trip({ returnFlight: leg(4759, { source: 'estimate' }) })).flight;
    expect(l).toContain('R$ 7.413/pessoa (com estimativa) · R$ 29.652');
  });
  it('rótulo por perna', () => {
    expect(flightChoiceLine(leg(2654))).toContain('R$ 2.654/pessoa (ida)');
  });
  it('aviso ao aplicar o voo: importada mantém o roteiro; não importada, texto atual', () => {
    expect(flightAppliedNotice(true)).toEqual({ title: 'Voo do KINU aplicado', description: 'Seu roteiro foi mantido; só os horários do voo mudaram.' });
    expect(flightAppliedNotice(false)).toEqual({ title: 'Voo do KINU aplicado ✈️', description: 'Roteiro refeito com os horários do voo.' });
  });
  it('teto informado', () => {
    expect(kinuDidLines(trip()).budget).toMatch(/^Teto informado: R\$ 30\.000 · 2 adultos \+ 2 crianças, 5 noites, perfil Conforto/);
  });
  it('sem teto informado: texto atual', () => {
    expect(kinuDidLines(trip({ budgetSource: 'estimate' })).budget).toMatch(/^R\$ 30\.000 — estimativa para 2 adultos \+ 2 crianças, 5 noites, perfil Conforto/);
  });
});
