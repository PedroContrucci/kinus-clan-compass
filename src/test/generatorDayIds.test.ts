import { describe, it, expect } from 'vitest';
import { buildDraftTrip } from '@/lib/createTrip';
import { getDestinationActivities } from '@/data/destinationActivities';
import { catalogIdOf } from '@/lib/localAchievements';

const CASES: [string, string, string[]][] = [
  ['Roma', 'FCO', ['culture', 'gastronomy']],
  ['Fortaleza', 'FOR', ['nature']],
  ['Cartagena', 'CTG', []],
];

describe('buildDraftTrip (motor único) — ids no namespace day-N-', () => {
  for (const [city, code, interests] of CASES) {
    it(`${city}: catálogo resolve, slot não resolve, sem duplicatas`, async () => {
      const trip = await buildDraftTrip({
        originCity: 'São Paulo', originAirportCode: 'GRU',
        destinationCity: city, destinationAirportCode: code,
        departureDate: new Date('2026-11-10T12:00:00'), returnDate: new Date('2026-11-17T12:00:00'),
        adults: 2, children: [], infants: 0,
        budgetTier: 'comfort', travelStyle: 'comfort', budgetAmount: 20000,
        travelInterests: interests, priorities: [],
      });
      const catalog = new Set(getDestinationActivities(city).map((a) => a.id));
      const all = trip.days.flatMap((d) => d.activities.map((a) => a.id));
      expect(new Set(all).size).toBe(all.length);
      let catalogHits = 0;
      for (const id of all) {
        if (id.startsWith('__free__')) continue;
        expect(id).toMatch(/^day-\d+-/);
        const cid = catalogIdOf(id);
        if (cid.startsWith('slot-') || cid.startsWith('michelin-')) expect(catalog.has(cid)).toBe(false);
        else { expect(catalog.has(cid)).toBe(true); catalogHits++; }
      }
      expect(catalogHits).toBeGreaterThan(0);
    });
  }
});
