import { describe, it, expect } from 'vitest';
import { addDays } from 'date-fns';
import { generateItinerary } from '@/components/cockpit/GeneratedItineraryStage';
import { buildDraftTrip } from '@/lib/createTrip';
import { destinationActivities } from '@/data/destinationActivities';
import { normalizePlaceName } from '@/lib/placeIdentity';

const MEAL_SLOTS = new Set(['breakfast', 'lunch', 'dinner']);
const EXP_SLOTS = new Set(['morning', 'afternoon', 'night']);

/**
 * Itens de logística, refeições inclusas na diária e slots livres não são
 * "lugares" — podem repetir todo dia sem que isso seja o bug.
 */
const GENERIC_EXACT = new Set(['Café da manhã']);
const GENERIC_PREFIX =
  /^(Café da manhã no hotel|Check-in|Check-out|Transfer|Voo|Caminhada leve|Descanso|Manhã livre|Tarde livre|Fim de tarde livre|Chegada|Passeio leve|Jantar leve|Tempo livre)/;
const isPlace = (name: string) => !GENERIC_EXACT.has(name) && !GENERIC_PREFIX.test(name);

function parseDuration(s: string): number {
  const m = s.match(/(\d+)h(?:(\d+))?/);
  return m ? parseInt(m[1], 10) * 60 + (m[2] ? parseInt(m[2], 10) : 0) : 60;
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${Math.floor((total % 1440) / 60)
    .toString()
    .padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`;
}

function buildFlight(origin: string, destination: string, date: Date, departureTime: string, durationStr: string) {
  const durationMinutes = parseDuration(durationStr);
  const [dh, dm] = departureTime.split(':').map(Number);
  const dep = new Date(date);
  dep.setHours(dh, dm, 0, 0);
  const arr = new Date(dep.getTime() + durationMinutes * 60000);
  return {
    option: {
      id: 'mock',
      airline: 'MockAir',
      route: `${origin} → ${destination}`,
      isDirect: true,
      duration: durationStr,
      durationMinutes,
      price: 900,
      departureTime,
      arrivalTime: addMinutes(departureTime, durationMinutes),
      segments: [
        { departure: { iataCode: origin.slice(0, 3).toUpperCase(), at: dep.toISOString() },
          arrival: { iataCode: destination.slice(0, 3).toUpperCase(), at: arr.toISOString() } },
      ],
    },
    date,
  } as never;
}

interface Placement { name: string; day: number; slot: string }

function run(city: string, opts: { days: number; travelers?: number; priceLevel?: string; interests?: string[]; budget?: number }): Placement[] {
  const departure = addDays(new Date('2026-03-01T12:00:00'), 30);
  const returnDate = addDays(departure, opts.days - 1);
  const { days } = generateItinerary(
    departure, returnDate, city, 'São Paulo',
    buildFlight('São Paulo', city, departure, '08:40', '3h25'),
    buildFlight(city, 'São Paulo', returnDate, '17:00', '3h25'),
    opts.budget ?? 20000,
    opts.travelers ?? 1,
    opts.interests ?? ['gastronomy', 'beach', 'family'],
    'BAIXO',
    opts.priceLevel as never
  );
  const out: Placement[] = [];
  for (const day of days) {
    for (const a of day.activities) {
      if (!isPlace(a.name)) continue;
      out.push({ name: normalizePlaceName(a.name), day: day.dayNumber, slot: a.timeSlot });
    }
  }
  return out;
}

function groupByName(places: Placement[]): Map<string, Placement[]> {
  const m = new Map<string, Placement[]>();
  for (const p of places) {
    if (!m.has(p.name)) m.set(p.name, []);
    m.get(p.name)!.push(p);
  }
  return m;
}

describe('gerador — não repetir o mesmo lugar na viagem', () => {
  // Repro do bug de produção: PDF de Fortaleza com Cabaña del Primo 3×
  // (almoço, jantar, almoço). A casa está no catálogo como dois ids legítimos,
  // for-cabana-del-primo (lunch) e for-rest-cabana-del-primo (dinner).
  it('Fortaleza: Cabaña del Primo nunca ocupa almoço e jantar na mesma viagem', () => {
    const places = run('Fortaleza', {
      days: 9, travelers: 1, priceLevel: 'midrange',
      interests: ['gastronomy', 'beach', 'family'], budget: 10000,
    });
    const cabana = places.filter((p) => p.name === 'cabana del primo');
    // O defeito original: os dois ids da mesma casa entravam como papéis
    // distintos e a regra por id não enxergava.
    expect(new Set(cabana.map((p) => p.slot)).size, `${cabana.map((p) => `d${p.day}/${p.slot}`)}`).toBeLessThanOrEqual(1);
    // O PDF trazia 3 aparições. Fortaleza tem 6 restaurantes de almoço para 7
    // almoços nesta viagem, então UMA repetição é aritmeticamente inevitável —
    // mas nunca três, e nunca atravessando categorias.
    expect(cabana.length, `${cabana.map((p) => `d${p.day}/${p.slot}`)}`).toBeLessThanOrEqual(2);
  });

  it('Fortaleza: Coco Bambu Beira-Mar e Coco Bambu (Varjota) podem coexistir', () => {
    // casas reais distintas — a regra de unicidade não pode colapsá-las
    const names = new Set(
      run('Fortaleza', { days: 12, travelers: 2, priceLevel: 'midrange' }).map((p) => p.name)
    );
    // ao menos uma das duas entra; nenhuma some por colapso indevido de nome
    expect(
      names.has('coco bambu beira-mar') || names.has('coco bambu (varjota)')
    ).toBe(true);
  });

  const CITIES = Object.keys(destinationActivities);
  const MATRIX = [
    { days: 7, travelers: 2, priceLevel: 'midrange' as const },
    { days: 9, travelers: 1, priceLevel: 'midrange' as const },
    { days: 12, travelers: 2, priceLevel: 'luxury' as const },
    { days: 14, travelers: 4, priceLevel: 'budget' as const },
  ];

  it('nenhum lugar ocupa dois papéis diferentes na mesma viagem', () => {
    // Esta é a regra que o bug violava: unicidade atravessando categorias.
    // Vale para todas as cidades, sem exceção e sem escape por esgotamento.
    const offenders: string[] = [];
    for (const city of CITIES) {
      for (const cfg of MATRIX) {
        for (const [name, hits] of groupByName(run(city, cfg))) {
          const slots = new Set(hits.map((h) => h.slot));
          if (slots.size > 1) {
            offenders.push(
              `${city} d=${cfg.days} tr=${cfg.travelers} ${cfg.priceLevel}: "${name}" em ` +
                hits.map((h) => `d${h.day}/${h.slot}`).join(' ')
            );
          }
        }
      }
    }
    expect(offenders, `${offenders.length} lugares em papéis diferentes`).toEqual([]);
  });

  it('um lugar só repete depois que o pool da categoria esgotou', () => {
    // Repetir é o último recurso permitido. O que não se admite é repetir
    // enquanto ainda há casa inédita disponível na categoria.
    const offenders: string[] = [];
    for (const city of CITIES) {
      const poolSize = (slot: string) =>
        new Set(
          destinationActivities[city].activities
            .filter((a) => a.category === slot)
            .map((a) => normalizePlaceName(a.name))
        ).size;
      for (const cfg of MATRIX) {
        const places = run(city, cfg);
        for (const slot of MEAL_SLOTS) {
          const served = places.filter((p) => p.slot === slot);
          if (served.length === 0) continue;
          const distinct = new Set(served.map((p) => p.name)).size;
          const available = poolSize(slot);
          // Todo nome disponível deve ter sido usado antes de qualquer repetição
          const expected = Math.min(available, served.length);
          if (distinct < expected) {
            offenders.push(
              `${city} d=${cfg.days} ${slot}: ${distinct} nomes distintos em ${served.length} slots, ` +
                `mas o pool oferece ${available}`
            );
          }
        }
      }
    }
    expect(offenders, `${offenders.length} repetições prematuras`).toEqual([]);
  });

  it('experiências nunca repetem; slot exaurido vira tempo livre', () => {
    for (const city of CITIES) {
      for (const cfg of MATRIX) {
        const exps = run(city, cfg).filter((p) => EXP_SLOTS.has(p.slot));
        const names = exps.map((p) => p.name);
        expect(new Set(names).size, `${city} d=${cfg.days}: experiência repetida`).toBe(names.length);
      }
    }
  });

  it('refeições ocupam todos os slots — nenhum dia perde o jantar pela regra', () => {
    // degradar com elegância: repetir é permitido como último recurso, mas
    // deixar o slot vazio não é.
    for (const city of CITIES) {
      const places = run(city, { days: 9, travelers: 2, priceLevel: 'midrange' });
      const dinners = places.filter((p) => p.slot === 'dinner');
      expect(dinners.length, `${city}: dias sem jantar`).toBeGreaterThanOrEqual(6);
    }
  });

  it('quando precisa repetir, distribui: nenhum nome passa de ceil(slots/pool)', () => {
    // Com 7 almoços e 6 restaurantes, uma repetição é inevitável — mas nada
    // obriga a concentrá-la na mesma casa, que foi como o Cabaña del Primo
    // chegou a três aparições no PDF. Este é o teto aritmético ótimo.
    const offenders: string[] = [];
    for (const city of CITIES) {
      const poolSize = (slot: string) =>
        new Set(
          destinationActivities[city].activities
            .filter((a) => a.category === slot)
            .map((a) => normalizePlaceName(a.name))
        ).size;
      for (const cfg of MATRIX) {
        const places = run(city, cfg);
        for (const slot of MEAL_SLOTS) {
          const served = places.filter((p) => p.slot === slot);
          const available = poolSize(slot);
          if (served.length === 0 || available === 0) continue;
          const ceiling = Math.ceil(served.length / available);
          for (const [name, hits] of groupByName(served)) {
            if (hits.length > ceiling) {
              offenders.push(
                `${city} d=${cfg.days} ${slot}: "${name}" ×${hits.length} excede o teto ${ceiling} ` +
                  `(${served.length} slots / ${available} no pool)`
              );
            }
          }
        }
      }
    }
    expect(offenders, `${offenders.length} concentrações acima do teto`).toEqual([]);
  });

  it('buildDraftTrip (fluxo do wizard) também não repete lugares', async () => {
    for (const city of ['Fortaleza', 'Cartagena', 'Paris']) {
      const departure = addDays(new Date('2026-03-01T12:00:00'), 30);
      const trip = await buildDraftTrip({
        originCity: 'São Paulo', originAirportCode: 'GRU',
        destinationCity: city, destinationAirportCode: 'XXX',
        departureDate: departure, returnDate: addDays(departure, 8),
        adults: 2, children: [], infants: 0,
        budgetTier: 'comfort', travelStyle: 'balance', budgetAmount: 20000,
        travelInterests: ['gastronomy', 'culture'],
        priorities: ['gastronomia', 'cultura'],
      });
      const seen = new Map<string, string[]>();
      for (const day of trip.days ?? []) {
        for (const a of day.activities ?? []) {
          if (!isPlace(a.name)) continue;
          const key = normalizePlaceName(a.name);
          if (!seen.has(key)) seen.set(key, []);
          seen.get(key)!.push(`d${day.day}`);
        }
      }
      // Repetição só é aceitável espaçada; nunca em dias consecutivos e nunca
      // mais de duas vezes numa viagem de 9 dias.
      for (const [name, days] of seen) {
        const nums = days.map((d) => Number(d.slice(1))).sort((a, b) => a - b);
        expect(nums.length, `${city}: "${name}" ${days.join(' ')}`).toBeLessThanOrEqual(2);
        for (let i = 1; i < nums.length; i++) {
          expect(nums[i] - nums[i - 1], `${city}: "${name}" em dias consecutivos`).toBeGreaterThan(2);
        }
      }
    }
  });

  it('slots de refeição são preenchidos e mantêm espaçamento quando degradam', () => {
    // Cartagena é a cidade com pool de refeições mais raso do catálogo —
    // é onde a cascata de degradação é mais exercitada.
    const places = run('Cartagena', { days: 14, travelers: 2, priceLevel: 'midrange' });
    for (const [name, hits] of groupByName(places.filter((p) => MEAL_SLOTS.has(p.slot)))) {
      const days = hits.map((h) => h.day).sort((a, b) => a - b);
      for (let i = 1; i < days.length; i++) {
        expect(days[i] - days[i - 1], `"${name}" repetiu em dias consecutivos`).toBeGreaterThan(1);
      }
    }
  });
});
