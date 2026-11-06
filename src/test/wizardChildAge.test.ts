// Idade de criança no wizard é opcional: o seletor nasce vazio e o rascunho não pode
// quebrar por isso. Sem idade preenchida, childrenAges fica vazio e o roteiro continua
// montando; preenchida, ela chega em childrenAges na ordem (0 e 17 inclusos).
import { describe, it, expect } from 'vitest';
import { buildDraftTrip, type DraftTripInput } from '@/lib/createTrip';
import type { StoredTrip } from '@/lib/tripStore';

const input = (children: DraftTripInput['children']): DraftTripInput => ({
  originCity: 'São Paulo', originAirportCode: 'GRU',
  destinationCity: 'Fortaleza', destinationAirportCode: 'FOR',
  departureDate: new Date(2026, 10, 10, 12), returnDate: new Date(2026, 10, 15, 12),
  adults: 2, children, infants: 0, budgetTier: 'comfort', travelStyle: 'comfort', budgetAmount: 20000,
  travelInterests: ['gastronomy', 'culture'], priorities: [],
});

describe('idade de criança opcional no rascunho', () => {
  it('crianças sem idade → childrenAges vazio e roteiro ainda montado', async () => {
    const trip = await buildDraftTrip(input([
      { id: 'child-1', type: 'child' },
      { id: 'child-2', type: 'child' },
    ]));
    expect(trip.childrenAges).toEqual([]);
    expect(trip.children).toBe(2);
    expect(trip.days.length).toBeGreaterThan(0);
  });

  it('idades preenchidas → childrenAges na ordem, com 0 e 17', async () => {
    const trip = await buildDraftTrip(input([
      { id: 'child-1', type: 'child', age: 0 },
      { id: 'child-2', type: 'child', age: 17 },
    ]));
    expect(trip.childrenAges).toEqual([0, 17]);
  });
});
