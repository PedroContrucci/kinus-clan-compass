import { describe, it, expect } from 'vitest';
import { runItineraryEngine, type JetLagSeverity, type SelectedFlight } from '@/lib/itineraryEngine';
import { tiersOf } from '@/lib/itineraryValidator';
import { catalogIdOf } from '@/lib/localAchievements';
import { getDestinationActivities } from '@/data/destinationActivities';

// M6 / C.20 — tier como critério, noite só com interesse, compras fora do slot de passeio.
const flight = (d: string, dep: string): SelectedFlight => ({
  date: new Date(d), source: 'estimate',
  option: { id: 'e', airline: 'A confirmar', route: 'GRU', isDirect: true, duration: '7.5h', durationMinutes: 450, price: 2000, departureTime: dep, arrivalTime: '15:30' },
});
const run = (city: string, interests: string[], sev: JetLagSeverity = 'MODERADO') => runItineraryEngine({
  departureDate: new Date('2026-11-10T12:00:00'), returnDate: new Date('2026-11-17T12:00:00'),
  destination: city, origin: 'São Paulo',
  outboundFlight: flight('2026-11-10T12:00:00', '08:00'), returnFlight: flight('2026-11-17T12:00:00', '21:00'),
  budget: 20000, travelers: 2, interests, jetLagSeverity: sev, priceLevel: 'midrange',
});
const CITIES = ['Porto', 'Paris', 'Lisboa', 'Londres', 'Tóquio', 'Orlando'];
const mins = (t: string) => { const m = /^(\d+):(\d+)/.exec(t); return m ? +m[1] * 60 + +m[2] : -1; };

describe('M6 — tiers, noite, compras', () => {
  it('Paris 10→15/12 (voo 23:00/14:00): Torre Eiffel (ícone) entra num dia de exploração', () => {
    const r = runItineraryEngine({
      departureDate: new Date('2026-12-10T12:00:00'), returnDate: new Date('2026-12-15T12:00:00'),
      destination: 'Paris', origin: 'São Paulo',
      outboundFlight: flight('2026-12-10T12:00:00', '23:00'), returnFlight: flight('2026-12-15T12:00:00', '14:00'),
      budget: 20000, travelers: 2, interests: ['gastronomia', 'cultura'], jetLagSeverity: 'MODERADO', priceLevel: 'midrange',
    });
    const ids = r.days.filter((d) => d.label === 'Exploração').flatMap((d) => d.activities.map((a) => catalogIdOf(a.id)));
    expect(ids).toContain('paris-tour-eiffel-top');
  });

  for (const city of CITIES) {
    it(`${city}: ≥ 1 ícone no roteiro quando algum ícone cabe num dia`, () => {
      const tiers = tiersOf(city);
      const byId = new Map(getDestinationActivities(city).map((a) => [a.id, a]));
      // Ícone de dia inteiro (ex.: Magic Kingdom, 10 h) não cabe com almoço e jantar na janela — R17 aceita a ausência.
      const fitting = Object.keys(tiers).filter((id) => tiers[id] === 'icon' && (byId.get(id)?.durationHours ?? 99) <= 6);
      const days = run(city, ['gastronomy', 'culture']).days;
      const ids = days.flatMap((d) => d.activities.map((a) => catalogIdOf(a.id)));
      if (fitting.length) expect(ids.some((id) => tiers[id] === 'icon')).toBe(true);
    });

    it(`${city}: perfil família sem vida noturna não tem noite nem item ≥ 21:00`, () => {
      const days = run(city, ['beach', 'family']).days;
      for (const d of days) for (const a of d.activities) {
        if (['flight', 'transfer', 'checkin', 'checkout', 'hotel'].includes(a.type as string)) continue;
        if (['breakfast', 'lunch', 'dinner'].includes(a.timeSlot) || a.name.startsWith('Descanso') || a.name.startsWith('Caminhada leve')) continue;
        expect(a.type).not.toBe('night');
        expect(mins(a.time)).toBeLessThan(21 * 60);
      }
    });

    it(`${city}: sem interesse de compras, nenhum slot de passeio é compras (salvo ícone/essencial)`, () => {
      const tiers = tiersOf(city);
      const byId = new Map(getDestinationActivities(city).map((a) => [a.id, a]));
      const days = run(city, ['gastronomy', 'culture']).days;
      for (const d of days) for (const a of d.activities) {
        if (!['morning', 'afternoon', 'night'].includes(a.timeSlot)) continue;
        const id = catalogIdOf(a.id);
        const act = byId.get(id);
        if (!act || !(act.styleTags ?? []).includes('shopping')) continue;
        expect(['icon', 'essential']).toContain(tiers[id]);
      }
    });
  }

  it('com interesse em vida noturna a noite continua entrando', () => {
    const days = run('Londres', ['nightlife', 'culture']).days;
    expect(days.some((d) => d.activities.some((a) => a.timeSlot === 'night'))).toBe(true);
  });
});
