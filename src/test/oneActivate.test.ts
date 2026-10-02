// Caminho único de ativação: card e cockpit chamam activateDraft, que ativa o gravado e nunca gera dias.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

vi.mock('@/integrations/kinu-beta/client', () => ({
  kinuBeta: {
    from: () => ({ insert: async () => ({ data: null, error: { code: '42501', message: 'denied' } }) }),
    auth: { getSession: async () => ({ data: { session: null }, error: null }) },
  },
}));

import { buildDraftTrip, type DraftTripInput } from '@/lib/createTrip';
import { addTrip, getTrip, type StoredTrip } from '@/lib/tripStore';
import { activateDraft, ACTIVATION_MESSAGES } from '@/lib/activateDraft';
import { readEvents } from '@/lib/kinuEvents';

const CITIES: [string, string][] = [['Cartagena', 'CTG'], ['Lisboa', 'LIS'], ['Tóquio', 'HND'], ['Fortaleza', 'FOR']];
const input = (city: string, code: string): DraftTripInput => ({
  originCity: 'São Paulo', originAirportCode: 'GRU', destinationCity: city, destinationAirportCode: code,
  departureDate: new Date(2026, 10, 10, 12), returnDate: new Date(2026, 10, 17, 12),
  adults: 2, children: [], infants: 0, budgetTier: 'comfort', travelStyle: 'comfort', budgetAmount: 20000,
  travelInterests: ['gastronomy', 'culture'], priorities: [],
});

const stored = async (city: string, code: string, id: string): Promise<StoredTrip> => {
  const trip = await buildDraftTrip(input(city, code));
  return addTrip({ ...trip, id } as StoredTrip);
};
const src = (rel: string) => readFileSync(resolve(process.cwd(), 'src', rel), 'utf8');

beforeEach(() => localStorage.clear());

describe('ativação única', () => {
  it('(a) card e cockpit chamam a mesma função e resultam em viagens idênticas', async () => {
    const viagens = src('pages/Viagens.tsx');
    expect(viagens).toContain('onActivate={() => handleActivateDraft(selectedTrip.id)}');
    expect(viagens).toContain('onActivate={handleActivateDraft}');
    expect(src('components/cockpit/DraftCockpit.tsx')).toContain('onActivate(trip.id)');

    await stored('Cartagena', 'CTG', 'a-card');
    await stored('Cartagena', 'CTG', 'a-cockpit');
    const card = activateDraft('a-card');
    const cockpit = activateDraft('a-cockpit');
    expect(card.ok && cockpit.ok).toBe(true);
    expect(getTrip('a-card')!.days).toEqual(getTrip('a-cockpit')!.days);
    expect(getTrip('a-card')!.finances).toEqual(getTrip('a-cockpit')!.finances);
  });

  for (const [city, code] of CITIES) {
    it(`(b) ${city}: ativar não muda dias, finanças nem voos`, async () => {
      const before = await stored(city, code, `b-${code}`);
      const r = activateDraft(before.id);
      expect(r.ok).toBe(true);
      const after = getTrip(before.id)!;
      expect(after.status).toBe('active');
      expect(after.days).toEqual(before.days);
      expect(after.finances).toEqual(before.finances);
      expect(after.outboundFlight).toEqual(before.outboundFlight);
      expect(after.accommodation).toEqual(before.accommodation);
    });
  }

  it('(c) rascunho sem dias é recusado apontando "Regerar roteiro"', async () => {
    const t = await stored('Lisboa', 'LIS', 'c-1');
    addTrip({ ...t, id: 'c-2', days: [] } as StoredTrip);
    const r = activateDraft('c-2');
    expect(r).toEqual({ ok: false, reason: 'no_days', message: ACTIVATION_MESSAGES.no_days });
    expect(ACTIVATION_MESSAGES.no_days).toContain('Regerar roteiro');
    expect(getTrip('c-2')!.status).toBe('draft');
    expect(getTrip('c-2')!.days).toEqual([]);
  });

  it('(c2) sem voo de ida e volta é recusado — o cockpit não inventa voo', async () => {
    const t = await stored('Lisboa', 'LIS', 'c-3');
    addTrip({ ...t, id: 'c-4', outboundFlight: undefined } as StoredTrip);
    const r = activateDraft('c-4');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain('Escolha os voos de ida e volta');
    expect(src('components/cockpit/DraftCockpit.tsx')).not.toContain('buildPlaceholderFlight');
  });

  it('(d) o evento de ativação sai uma vez', async () => {
    await stored('Fortaleza', 'FOR', 'd-1');
    activateDraft('d-1');
    activateDraft('d-1'); // já ativa: recusada, sem nova emissão
    const n = readEvents().filter((e) => e.name === 'trip.activated' && e.props.trip_id === 'd-1').length;
    expect(n).toBe(1);
  });
});
