import { describe, it, expect } from 'vitest';
import { runItineraryEngine, LUNCH_ON_SITE_TIP, engineHotelCoord, type SelectedFlight } from '@/lib/itineraryEngine';
import { runSmokeScenario, SMOKE_SCENARIOS } from '@/lib/smokeMatrix';
import { haversineKm, maxHopKmFor } from '@/lib/itineraryValidator';
import { curatedCoordOf } from '@/lib/routeCoords';
import { getActivityPrice } from '@/lib/activityPricing';
import { getHotelRecommendation } from '@/lib/hotelZones';

// M6c+ — refeição pela qualidade (com gastronomia) / proximidade (sem); almoço do bate-volta na âncora.
const flight = (d: string, dep: string): SelectedFlight => ({
  date: new Date(d), source: 'estimate',
  option: { id: 'e', airline: 'A confirmar', route: 'GRU', isDirect: true, duration: '', durationMinutes: 210, price: 2000, departureTime: dep, arrivalTime: '15:30' },
});
function run(city: string, dep: string, ret: string, interests: string[], pax?: { adults: number; children: number; infants: number }) {
  const travelers = pax ? pax.adults + pax.children : 2;
  return runItineraryEngine({
    departureDate: new Date(`${dep}T12:00:00`), returnDate: new Date(`${ret}T12:00:00`), destination: city, origin: 'São Paulo',
    outboundFlight: flight(`${dep}T12:00:00`, '08:00'), returnFlight: flight(`${ret}T12:00:00`, '21:00'),
    budget: 40000, travelers, interests, jetLagSeverity: 'BAIXO', priceLevel: 'midrange',
    hotel: { nightlyRate: getActivityPrice('hotel_night', city, 'midrange') },
    ...(pax ? { pax } : {}),
  });
}

type Day = ReturnType<typeof run>['days'][number];
const mins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
/** Refeições de catálogo de dias de exploração (sem bate-volta), com a parada anterior que tem coordenada. */
function meals(days: Day[], interests: string[]) {
  // Mesma coordenada de hotel que o motor usa (sem hotel escolhido: a recomendação da faixa).
  const hotel = engineHotelCoord('Paris', getHotelRecommendation('Paris', 'midrange', interests)?.name);
  const out: { kind: 'lunch' | 'dinner'; id: string; km: number; tips: string[]; hotelKm: number | null }[] = [];
  for (const d of days.filter((x) => x.label === 'Exploração')) {
    if (d.activities.some((a) => /bate-volta|day-trip/i.test(a.name))) continue;
    const seq = [...d.activities].sort((a, b) => mins(a.time) - mins(b.time));
    seq.forEach((a, k) => {
      if (a.timeSlot !== 'lunch' && a.timeSlot !== 'dinner') return;
      const c = curatedCoordOf(a.id.replace(/^day-\d+-/, ''));
      const prev = seq.slice(0, k).reverse().map((x) => curatedCoordOf(x.id.replace(/^day-\d+-/, ''))).find((x) => !!x);
      if (!c || !prev) return;
      out.push({ kind: a.timeSlot, id: a.id, km: haversineKm(prev, c), tips: a.tips ?? [], hotelKm: hotel ? haversineKm(hotel, c) : null });
    });
  }
  return out;
}

describe('M6c+ — Paris 10–15/12', () => {
  const gastro = run('Paris', '2026-12-10', '2026-12-15', ['gastronomy', 'culture']);
  const familia = run('Paris', '2026-12-10', '2026-12-15', ['culture', 'family'], { adults: 2, children: 2, infants: 0 });

  it('gastronomia: refeição a mais de 1,5 km da parada anterior traz "~N min de deslocamento"', () => {
    const far = meals(gastro.days, ['gastronomy', 'culture']).filter((m) => m.km > 1.5);
    for (const m of far) expect(m.tips.some((t) => /~\d+ min de deslocamento/.test(t)) || m.tips.some((t) => /Perto do hotel|Jantar mais próximo/.test(t))).toBe(true);
  });

  it('sem gastronomia: almoço ≤ 1,5 km do passeio; jantar ≤ 2 km da parada ou do hotel; senão a dica diz a distância', () => {
    for (const m of meals(familia.days, ['culture', 'family'])) {
      const band = m.kind === 'lunch' ? 1.5 : 2;
      const ok = m.km <= band || (m.kind === 'dinner' && m.hotelKm !== null && m.hotelKm <= 2);
      if (!ok) expect(m.tips.some((t) => /A \d+,\d km/.test(t) || /Jantar mais próximo|Perto do hotel/.test(t))).toBe(true);
    }
  });

  it('nenhum salto de refeição passa do limite da cidade (guarda do R15)', () => {
    for (const [r, ints] of [[gastro, ['gastronomy', 'culture']], [familia, ['culture', 'family']]] as const) for (const m of meals(r.days, [...ints])) expect(m.km).toBeLessThanOrEqual(maxHopKmFor('Paris') + 0.01);
  });
});

describe('M6c+ — bate-volta sem par de almoço', () => {
  it('toda âncora de bate-volta diz onde almoçar, sem custo inventado', () => {
    let seen = 0;
    const cases: [string, string, string, string[]][] = [
      ['Paris', '2026-11-10', '2026-11-17', ['culture', 'family']],
      ['Fortaleza', '2026-11-10', '2026-11-17', ['beach', 'family']],
      ['Paris', '2026-12-10', '2026-12-17', ['gastronomy', 'culture']],
    ];
    for (const [city, dep, ret, interests] of cases) {
      const r = run(city, dep, ret, interests);
      for (const d of r.days) {
        const anchor = d.activities.find((a) => /day-trip|bate-volta/i.test(a.name));
        if (!anchor) continue;
        seen++;
        expect((anchor.tips ?? []).some((t) => t.startsWith(LUNCH_ON_SITE_TIP))).toBe(true);
        expect(d.activities.filter((a) => a.timeSlot === 'lunch' && /-slot-/.test(a.id) && a.estimatedCost > 0)).toEqual([]);
      }
    }
    expect(seen).toBeGreaterThan(0);
  });
});

describe('M6c+ — cenários de smoke', () => {
  it('Paris gastrô e Paris família sem gastronomia: R15 sem WARN', async () => {
    const paris = SMOKE_SCENARIOS.filter((s) => s.city === 'Paris');
    expect(paris.map((s) => s.id)).toEqual(['Paris gastrô 2 adultos 10–15/12', 'Paris família sem gastronomia 2+2 10–15/12']);
    for (const sc of paris) {
      const row = await runSmokeScenario(sc, { routeLookup: async () => null });
      expect(row.error).toBeUndefined();
      expect(row.results.find((x) => x.rule === 'R15 GEO')?.status).not.toBe('WARN');
    }
  });
});
