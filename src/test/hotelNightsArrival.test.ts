/* eslint-disable @typescript-eslint/no-explicit-any */
// M28a — noites de hotel = dias entre check-in (chegada) e check-out; a noite do voo não é de hotel.
import { describe, it, expect } from 'vitest';
import { addDays, startOfDay, differenceInCalendarDays } from 'date-fns';
import { buildDraftTrip } from '@/lib/createTrip';
import { buildFlowInput } from '@/lib/onboardingFlow';
import { buildImportedDraft } from '@/lib/importItinerary';
import { buildItineraryForTrip } from '@/lib/draftItinerary';
import { CURATED_CITIES } from '@/lib/curatedCities';
import { SMOKE_PROFILES, SMOKE_SCENARIOS, SMOKE_NIGHTS } from '@/lib/smokeMatrix';
import type { SelectedFlight } from '@/lib/itineraryEngine';

const fam = (city: string, from: Date, to: Date) =>
  buildFlowInput({ city, origin: 'São Paulo', from, to, adults: 2, children: 2, tier: 'comfort', childrenAges: [8, 12], interests: [] });
const nightsBetween = (a: any) => differenceInCalendarDays(new Date(a.checkOut), new Date(a.checkIn));
const ymd = (v: unknown) => String(v).slice(0, 10);
const LOG: string[] = [];
const log = (s: string) => { LOG.push(s); console.log('[M28]', s); };
const line = (tag: string, t: any) => {
  const a = t.accommodation;
  log(`${tag}: ida ${ymd(t.startDate)} ${t.flights?.outbound?.departureTime}→${t.flights?.outbound?.arrivalTime}; checkIn ${ymd(a.checkIn)} checkOut ${ymd(a.checkOut)} noites=${a.totalNights} diária=${a.nightlyRate} total=${a.totalPrice}`);
};

describe('M28a — noites × chegada no dia seguinte', () => {
  it('Lisboa 10→15/01/2027: 4 noites; Paris 06→11/12: 4; Rio 10→13/12: 3', async () => {
    const lis: any = await buildDraftTrip(fam('Lisboa', new Date(2027, 0, 10, 12), new Date(2027, 0, 15, 12)));
    const par: any = await buildDraftTrip(fam('Paris', new Date(2026, 11, 6, 12), new Date(2026, 11, 11, 12)));
    const rio: any = await buildDraftTrip(fam('Rio de Janeiro', new Date(2026, 11, 10, 12), new Date(2026, 11, 13, 12)));
    line('Lisboa gerada', lis); line('Paris gerada', par); line('Rio gerada', rio);
    expect(lis.accommodation.totalNights).toBe(4);
    expect(lis.accommodation.totalPrice).toBe(lis.accommodation.nightlyRate * 4);
    expect(par.accommodation.totalNights).toBe(4);
    expect(rio.accommodation.totalNights).toBe(3);
    expect(lis.finances.categories.accommodation.planned).toBe(lis.accommodation.totalPrice);
  });

  it('Tóquio 28/12→03/01: noites = check-out − check-in', async () => {
    const t: any = await buildDraftTrip(fam('Tóquio', new Date(2026, 11, 28, 12), new Date(2027, 0, 3, 12)));
    line('Tóquio gerada', t);
    expect(t.accommodation.totalNights).toBe(nightsBetween(t.accommodation));
    expect(t.accommodation.totalNights).toBe(4);
  });

  it('Lisboa com volta de madrugada (02:30): check-out na véspera, uma noite a menos (3)', async () => {
    const trip: any = await buildDraftTrip(fam('Lisboa', new Date(2027, 0, 10, 12), new Date(2027, 0, 15, 12)));
    const built = buildItineraryForTrip(trip, {
      outbound: trip.outboundFlight as SelectedFlight,
      return: { ...trip.returnFlight, option: { ...trip.returnFlight.option, departureTime: '02:30' } } as SelectedFlight,
    });
    const a: any = built.accommodation;
    log(`Lisboa volta 02:30: checkIn ${ymd(a.checkIn)} checkOut ${ymd(a.checkOut)} noites=${a.totalNights} total=${a.totalPrice}`);
    expect(a.totalNights).toBe(3);
    expect(a.totalNights).toBe(nightsBetween(a));
    expect(a.totalPrice).toBe(a.nightlyRate * 3);
  });

  it('importada de Lisboa = gerada (mesmas noites e total)', async () => {
    const gen: any = await buildDraftTrip(fam('Lisboa', new Date(2027, 0, 10, 12), new Date(2027, 0, 15, 12)));
    const days = Array.from({ length: 5 }, (_, i) => ({ dia: i + 1, itens: i === 1 ? [{ nome: 'Museu Nacional' }] : [] }));
    const r: any = await buildImportedDraft(fam('Lisboa', new Date(2027, 0, 11, 12), new Date(2027, 0, 15, 12)), days);
    expect(r.ok).toBe(true);
    line('Lisboa importada', r.trip);
    expect(r.trip.accommodation.totalNights).toBe(gen.accommodation.totalNights);
    expect(r.trip.accommodation.totalPrice).toBe(gen.accommodation.totalPrice);
  });

  it('propriedade: 28 cidades × 3 perfis — totalNights = dias(checkIn→checkOut) ≥ 1; Financeiro = acc.totalPrice', async () => {
    const from = addDays(startOfDay(new Date()), 30);
    let n = 0;
    const changed: string[] = [];
    for (const city of CURATED_CITIES) for (const p of SMOKE_PROFILES) {
      const t: any = await buildDraftTrip(buildFlowInput({ city, origin: 'São Paulo', from, to: addDays(from, SMOKE_NIGHTS), adults: 2, children: 0, tier: p.tier }));
      const a = t.accommodation; n++;
      if (p.id === 'gastro-cultura') {
        const off = differenceInCalendarDays(new Date(a.checkIn), new Date(t.startDate));
        changed.push(`${city}:${a.totalNights}n(ida+${off})`);
        if (city === 'Porto Seguro') log(`Porto Seguro: ida ${t.flights.outbound.departureTime}→${t.flights.outbound.arrivalTime} (chegada ${ymd(t.flights.outbound.arrivalDate)}), checkIn ${ymd(a.checkIn)}, noites ${a.totalNights}, startDate ${ymd(t.startDate)}`);
      }
      expect(a.totalNights, `${city}/${p.id}`).toBe(nightsBetween(a));
      expect(a.totalNights, `${city}/${p.id}`).toBeGreaterThanOrEqual(1);
      expect(t.finances.categories.accommodation.planned, `${city}/${p.id}`).toBe(a.totalPrice);
    }
    log(`matriz ${n} viagens (7 noites no pedido): ${changed.join(' ')}`);
    expect(n).toBe(CURATED_CITIES.length * SMOKE_PROFILES.length);
  }, 180000);

  it('SMOKE_SCENARIOS: noites medidas', async () => {
    for (const sc of SMOKE_SCENARIOS) {
      const t: any = await buildDraftTrip(buildFlowInput({ city: sc.city, origin: 'São Paulo', from: sc.from, to: addDays(sc.from, sc.nights), adults: sc.adults, children: sc.children, tier: sc.tier, childrenAges: sc.childrenAges }));
      log(`cena ${sc.id}: noites=${t.accommodation.totalNights} total=${t.accommodation.totalPrice}`);
      expect(t.accommodation.totalNights).toBe(nightsBetween(t.accommodation));
    }
  }, 60000);
});
