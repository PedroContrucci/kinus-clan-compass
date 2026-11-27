/* eslint-disable @typescript-eslint/no-explicit-any */
// M28b — links de reserva de hotel levam check-in/out da hospedagem (chegada), não as datas do voo.
import { describe, it, expect } from 'vitest';
import { buildDraftTrip } from '@/lib/createTrip';
import { buildFlowInput } from '@/lib/onboardingFlow';
import { buildOfferLinks, hotelStayDates } from '@/lib/offersLinks';
import { razaoLines } from '@/lib/razaoLines';

const lisboa = () => buildDraftTrip(buildFlowInput({
  city: 'Lisboa', origin: 'São Paulo', from: new Date(2027, 0, 10, 12), to: new Date(2027, 0, 15, 12),
  adults: 2, children: 2, tier: 'comfort', childrenAges: [8, 12], interests: [],
}));

describe('M28b — datas dos links de hotel', () => {
  it('Lisboa: Booking leva checkin=2027-01-11 e checkout=2027-01-15 (Financeiro e hero)', async () => {
    const t: any = await lisboa();
    const hotel = razaoLines(t).find((l) => l.kind === 'hotel')!;
    const booking = hotel.closeLinks!.find((l) => l.provider === 'Booking')!;
    console.log('[M28b] Financeiro Booking:', booking.url);
    expect(booking.url).toContain('checkin=2027-01-11');
    expect(booking.url).toContain('checkout=2027-01-15');

    const stay = hotelStayDates(t.accommodation, new Date(t.startDate), new Date(t.endDate));
    const hero = buildOfferLinks({ category: 'hotel', city: 'Lisboa', startDate: stay.start, endDate: stay.end, travelers: 4, hotelName: t.accommodation.name })
      .find((l) => l.partner === 'Booking')!;
    console.log('[M28b] hero Booking:', hero.url);
    expect(hero.url).toContain('checkin=2027-01-11');
    expect(hero.url).toContain('checkout=2027-01-15');
  });

  it('sem acc.checkIn: mantém as datas de hoje (10/01 → 15/01)', async () => {
    const t: any = await lisboa();
    const old = { ...t, accommodation: { ...t.accommodation, checkIn: undefined } };
    const booking = razaoLines(old).find((l) => l.kind === 'hotel')!.closeLinks!.find((l) => l.provider === 'Booking')!;
    expect(booking.url).toContain('checkin=2027-01-10');
    expect(booking.url).toContain('checkout=2027-01-15');
    const fb = hotelStayDates({}, new Date(2027, 0, 10), new Date(2027, 0, 15));
    expect(fb.start).toEqual(new Date(2027, 0, 10));
  });

  it('voo não muda: Kiwi segue com a data da partida', () => {
    const k = buildOfferLinks({ category: 'flight', originCode: 'GRU', destinationCode: 'LIS', startDate: new Date(2027, 0, 10, 12), endDate: new Date(2027, 0, 15, 12), travelers: 4 });
    expect(k.some((l) => /2027-01-10|10\/01\/2027|100127|1001/.test(decodeURIComponent(l.url)))).toBe(true);
  });
});
