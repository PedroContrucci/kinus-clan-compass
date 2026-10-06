import { describe, it, expect } from 'vitest';
import { CURATED_CITIES } from '@/lib/curatedCities';
import { getDestinationActivities } from '@/data/destinationActivities';
import { matchesPriority } from '@/lib/claChips';
import { interestsFor, interestCounts, splitInterests, hasCatalog, MIN_INTEREST_ITEMS } from '@/lib/interestsFor';
import { kinuDidLines } from '@/lib/onboardingFlow';

const ids = (city: string) => interestsFor(city).map((c) => c.id);

describe('interestsFor', () => {
  it('21 cidades: todo chip oferecido tem ≥5 itens do catálogo', () => {
    for (const city of CURATED_CITIES) {
      const acts = getDestinationActivities(city);
      for (const id of ids(city)) {
        expect(acts.filter((a) => matchesPriority(a, id)).length, `${city}/${id}`).toBeGreaterThanOrEqual(MIN_INTEREST_ITEMS);
      }
      for (const [id, n] of Object.entries(interestCounts(city))) {
        if (n < MIN_INTEREST_ITEMS) expect(ids(city), `${city}/${id}`).not.toContain(id);
      }
    }
  });

  it('Gramado sem praia; Fortaleza com praia', () => {
    expect(ids('Gramado')).not.toContain('beach');
    expect(ids('Fortaleza')).toContain('beach');
  });

  it('cidade sem catálogo não tem chips', () => {
    expect(hasCatalog('Xqzlândia')).toBe(false);
    expect(interestsFor('Xqzlândia')).toEqual([]);
    expect(interestsFor('')).toEqual([]);
  });

  it('cidade do catálogo amplo (fora das 21) também é calculada', () => {
    // Qualquer cidade com tema curado tem pelo menos Gastronomia.
    expect(hasCatalog('Paris')).toBe(true);
  });

  it('splitInterests separa usados e ignorados', () => {
    expect(splitInterests('Gramado', ['beach', 'gastronomy'])).toEqual({ used: ['gastronomy'], ignored: ['beach'] });
  });

  it('card explica interesse sem catálogo', () => {
    const trip = { destination: 'Gramado', travelInterests: ['beach', 'gastronomy'], days: [], travelers: 2, budget: 0 };
    expect(kinuDidLines(trip).itinerary).toContain('montei por Gastronomia — Praia não tem catálogo em Gramado');
  });

  // Quando a curadoria levar Rio/Cartagena a ≥5 itens de praia, este teste passa a falhar: hora de removê-lo.
  it.todo('Rio de Janeiro e Cartagena ganham Praia quando o catálogo chegar a 5 itens');
  it('Rio e Cartagena ainda sem Praia (catálogo abaixo de 5) — falha quando os dados chegarem', () => {
    expect(ids('Rio de Janeiro')).not.toContain('beach');
    expect(ids('Cartagena')).not.toContain('beach');
  });
});
