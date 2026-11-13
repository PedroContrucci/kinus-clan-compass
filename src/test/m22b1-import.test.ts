// M22b-1 — biblioteca de importação de roteiro. Cena fixa à mão (Paris, 2 adultos + 2 crianças), sem rede.
// Nenhum assert sobre o que o motor ESCOLHE: só sobre logística, ids, datas e o que o usuário trouxe.
import { describe, expect, it, beforeAll } from 'vitest';
import {
  applyImportedDays, buildImportedDraft, closedWeekdayOf, matchPlace, replanImportedTrip, outsideDayWindow, isLogistics, type ImportDay, type ImportResult,
} from '@/lib/importItinerary';
import type { DraftTripInput } from '@/lib/createTrip';
import { roteiroKind } from '@/lib/roteiroBlocks';
import { catalogIdOf } from '@/lib/localAchievements';
import type { SavedTrip, TripActivity } from '@/types/trip';

const noRoute = async () => null;
const input = (over: Partial<DraftTripInput> = {}): DraftTripInput => ({
  originCity: 'São Paulo', originAirportCode: 'GRU', destinationCity: 'Paris', destinationAirportCode: 'CDG',
  departureDate: new Date(2026, 11, 7), returnDate: new Date(2026, 11, 11),
  adults: 2, children: [{ id: 'c1', type: 'child', age: 8 }, { id: 'c2', type: 'child', age: 12 }], infants: 0,
  budgetTier: 'comfort', travelStyle: 'comfort', budgetAmount: 0, travelInterests: [], priorities: [],
  ...over,
});

const SCENE: ImportDay[] = [
  { dia: 1, itens: [{ nome: 'Marais', hora: '16:00', tipo: 'passeio' }, { nome: 'Breizh Café', hora: '19:30', tipo: 'refeicao' }] },
  { dia: 2, itens: [
    { nome: 'Museu do Louvre', hora: '09:00' }, { nome: 'Bouillon Chartier', hora: '12:30', tipo: 'refeicao' },
    { nome: 'Jardim das Tulherias', hora: '15:00', tipo: 'passeio' }, { nome: "Le Relais de l'Entrecôte", hora: '19:30', tipo: 'refeicao' } ] },
  { dia: 3, itens: [
    { nome: 'Torre Eiffel', hora: '10:00' }, { nome: 'Café Constant', hora: '12:30', tipo: 'refeicao' }, { nome: 'cruzeiro no Sena', hora: '15:00' } ] },
  { dia: 4, itens: [
    { nome: "Museu d'Orsay", hora: '09:30' }, { nome: "L'As du Fallafel", hora: '12:30', tipo: 'refeicao' }, { nome: 'Sainte-Chapelle', hora: '15:00' },
    { nome: 'Notre-Dame', hora: '16:30' }, { nome: 'Angelina', hora: '17:30', tipo: 'refeicao' } ] },
  { dia: 5, itens: [{ nome: 'Montmartre e Sacré-Cœur', hora: '09:00' }] },
];

const acts = (t: SavedTrip) => t.days.flatMap((d) => d.activities.map((a) => ({ day: d.day, a: a as TripActivity & Record<string, unknown> })));
const isLog = (a: { id: string; kind?: unknown }) => a.kind === 'flight' || a.kind === 'checkin' || a.kind === 'checkout' || /-slot-(flight-out|flight-back|checkin|checkout|transfer)$/.test(a.id);
const ymdOf = (d: string) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };

let res: Extract<ImportResult, { ok: true }>;
let base: SavedTrip;
let base0: SavedTrip;

beforeAll(async () => {
  const r = await buildImportedDraft(input(), SCENE, { routeLookup: noRoute });
  if ('erro' in r) throw new Error(r.erro.message);
  res = r as typeof res;
  // rascunho base com as MESMAS datas já alinhadas (partida 06/12), para comparar finanças
  const { buildDraftTrip } = await import('@/lib/createTrip');
  base = await buildDraftTrip(input({ departureDate: new Date(2026, 11, 6) }), { routeLookup: noRoute });
  base0 = base;
});

describe('M22b-1 — importar roteiro', () => {
  it('1. 15 itens: 12 reconhecidos, 3 livres (Notre-Dame com 2 candidatos)', () => {
    const { resumo } = res;
    expect(resumo.dias).toBe(5);
    expect(resumo.itens).toBe(15);
    expect(resumo.reconhecidos).toHaveLength(12);
    expect(resumo.livres.map((l) => l.nome).sort()).toEqual(['Café Constant', 'Jardim das Tulherias', 'Notre-Dame']);
    expect(resumo.livres.find((l) => l.nome === 'Notre-Dame')!.candidatos).toBe(2);
    expect(resumo.semValor).toBe(3);
    const mont = resumo.reconhecidos.find((r) => r.nomeUsuario.startsWith('Montmartre'))!;
    expect(mont.id).toBe('paris-montmartre');
    expect(resumo.reconhecidos.find((r) => r.nomeUsuario === 'Torre Eiffel')!.id).toBe('paris-tour-eiffel-top');
  });

  it('2. check-in em 07/12, voo de volta em 11/12, Louvre no dia 08/12', () => {
    const t = res.trip;
    const checkin = t.days.find((d) => d.activities.some((a) => /-slot-checkin$/.test(a.id)))!;
    const back = t.days.find((d) => d.activities.some((a) => /-slot-flight-back$/.test(a.id)))!;
    expect(ymdOf(checkin.date)).toBe('2026-12-07');
    expect(ymdOf(back.date)).toBe('2026-12-11');
    const louvre = acts(t).find((x) => catalogIdOf(x.a.id) === 'paris-louvre')!;
    expect(ymdOf(t.days.find((d) => d.day === louvre.day)!.date)).toBe('2026-12-08');
    expect(louvre.a.id).toBe(`day-${Number(louvre.day) - 1}-paris-louvre`);
    expect(louvre.a.time).toBe('09:00');
    expect(louvre.a.importedName).toBe('Museu do Louvre');
    expect((t as unknown as Record<string, unknown>).importedFrom).toBe('user');
  });

  it('3. Louvre em 08/12 (terça) aparece em emDiaFechado; closedWeekdayOf só avisa', () => {
    const ef = res.resumo.emDiaFechado;
    expect(ef).toContainEqual({ nome: 'Museu do Louvre', data: '2026-12-08', diaSemana: 'terça' });
    console.log('EM_DIA_FECHADO', JSON.stringify(ef));
    expect(closedWeekdayOf({ id: 'day-1-paris-louvre' }, '2026-12-08')).toBe(2);
    expect(closedWeekdayOf({ id: 'day-1-paris-louvre' }, '2026-12-09')).toBeNull();
    expect(closedWeekdayOf({ id: 'day-1-import-cafe' }, '2026-12-08')).toBeNull();
    // não move nem remove
    expect(acts(res.trip).some((x) => catalogIdOf(x.a.id) === 'paris-louvre')).toBe(true);
  });

  it('4. livres: cost 0, semValor, category certa; do motor só sobra logística', () => {
    const livres = acts(res.trip).filter((x) => x.a.importedFrom === 'user');
    expect(livres).toHaveLength(3);
    for (const { a } of livres) {
      expect(a.cost).toBe(0);
      expect(a.semValor).toBe(true);
      expect(a.category).toBe(a.name.includes('Café') ? 'comida' : 'passeio');
      expect(catalogIdOf(a.id)).toMatch(/^import-/);
    }
    expect(livres.find((x) => String(x.a.importedName) === 'Café Constant')!.a.category).toBe('comida');
    expect(livres.find((x) => String(x.a.importedName) === 'Jardim das Tulherias')!.a.category).toBe('passeio');
    // nenhum item do motor fora da logística: tudo que não é logística tem importedName
    for (const { a } of acts(res.trip)) if (!isLog(a)) expect(a.importedName).toBeTruthy();
    expect(acts(res.trip).filter((x) => !isLog(x.a))).toHaveLength(15);
    // A1: engineItemIds = saída COMPLETA do motor do rascunho base (não só a logística)
    const engineIds = (res.trip as unknown as Record<string, unknown>).engineItemIds as string[];
    expect(engineIds).toEqual(base0.days.flatMap((d) => d.activities.map((a) => a.id)));
    expect(engineIds.length).toBeGreaterThan(acts(res.trip).filter((x) => isLog(x.a)).length);
  });

  it('5. finanças: voo e hospedagem do rascunho base; comida + passeios = itens importados', () => {
    const f = res.trip.finances.categories;
    const b = base.finances.categories;
    expect(f.flights.planned).toBe(b.flights.planned);
    expect(f.accommodation.planned).toBe(b.accommodation.planned);
    const nonLog = acts(res.trip).filter((x) => !isLog(x.a));
    const imported = nonLog.reduce((s, x) => s + (x.a.cost || 0), 0);
    // logística com custo que o motor conta no balde de passeios (transfer): mesma conta do computeBuckets
    const logCost = acts(res.trip).filter((x) => isLog(x.a) && x.a.kind !== 'flight' && x.a.kind !== 'checkin' && x.a.kind !== 'checkout')
      .reduce((s, x) => s + (x.a.cost || 0), 0);
    expect(f.food.planned + f.tours.planned).toBe(imported + logCost);
    const meals = nonLog.filter((x) => ['breakfast', 'lunch', 'dinner'].includes(String(x.a.timeSlot))).reduce((s, x) => s + (x.a.cost || 0), 0);
    expect(f.food.planned).toBe(meals);
    expect(imported).toBeGreaterThan(0);
    console.log('FIN', JSON.stringify({ imported, logCost, food: f.food.planned, tours: f.tours.planned }));
  });

  it('6. troca de voo (replanImportedTrip): 15 importados nos mesmos dias/horas; nada além de logística e importado', () => {
    // (i) Montmartre (dia da volta, 09:00, 3h) já aparece em foraDaJanela no resumo
    expect(res.resumo.foraDaJanela.map((f) => f.nome)).toContain('Montmartre & Sacré-Cœur');
    const t = res.trip as unknown as Record<string, unknown> & SavedTrip & { outboundFlight: never; returnFlight: never };
    const r = replanImportedTrip(t as never, { outbound: t.outboundFlight, return: t.returnFlight });
    const where = (days: { day: unknown; activities: { id: string; time?: string }[] }[]) =>
      new Map(days.flatMap((d) => d.activities.map((a) => [a.id, `${d.day}@${a.time}`] as const)));
    const imported = acts(res.trip).filter((x) => !isLog(x.a));
    expect(imported).toHaveLength(15);
    const after = where(r.days as never);
    const before = where(res.trip.days as never);
    // (ii) os 15 continuam no mesmo dia e horário
    for (const { a } of imported) expect(after.get(a.id), a.id).toBe(before.get(a.id));
    const mont = r.days.flatMap((d) => d.activities).find((a) => String((a as never as Record<string, unknown>).importedName).startsWith('Montmartre')) as never as Record<string, unknown>;
    expect(mont.foraDaJanela).toBe(true);
    expect(r.unplaced.filter((u) => imported.some((x) => x.a.id === u.id))).toEqual([]);
    // (iii) nada que não seja logística ou importado
    for (const d of r.days) for (const a of d.activities) {
      expect(isLog(a as never) || !!(a as never as Record<string, unknown>).importedName, a.id).toBe(true);
    }
  });

  it('6b. passo (a): item de catálogo não importado inserido num dia é removido', () => {
    const t = JSON.parse(JSON.stringify(res.trip)) as SavedTrip & { outboundFlight: never; returnFlight: never };
    const d = t.days.find((x) => x.day === 3)!;
    d.activities.push({ id: 'day-2-paris-intruso', time: '11:00', name: 'Intruso do catálogo', description: '', duration: '1h', cost: 10, type: 'experience', category: 'passeio', status: 'planned' } as never);
    const r = replanImportedTrip(t as never, { outbound: t.outboundFlight, return: t.returnFlight });
    expect(r.days.flatMap((x) => x.activities).some((a) => a.id === 'day-2-paris-intruso')).toBe(false);
    expect(r.days.flatMap((x) => x.activities).filter((a) => !isLogistics(a as never) && !(a as never as Record<string, unknown>).importedName)).toEqual([]);
  });

  it('outsideDayWindow: janela 08:00 → partida − 3 h (intl)', () => {
    expect(outsideDayWindow('09:00', 180, '14:00', false)).toBe(true);  // 12:00 > 11:00
    expect(outsideDayWindow('08:00', 120, '14:00', false)).toBe(false); // 10:00 ≤ 11:00
    expect(outsideDayWindow('09:00', 180, '14:00', true)).toBe(false);  // doméstico: até 12:00
    expect(outsideDayWindow('09:00', 60, undefined, false)).toBe(false);
  });

  it('7. Torre Eiffel no dia 1 e no dia 3 → a segunda vira livre', async () => {
    const days: ImportDay[] = [
      { dia: 1, itens: [{ nome: 'Torre Eiffel', hora: '10:00' }] },
      { dia: 3, itens: [{ nome: 'Torre Eiffel', hora: '10:00' }] },
    ];
    const r = await buildImportedDraft(input(), days, { routeLookup: noRoute });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.resumo.reconhecidos).toHaveLength(1);
    expect(r.resumo.livres).toEqual([{ nome: 'Torre Eiffel', candidatos: 0, motivo: 'repetido' }]);
    const eiffel = acts(r.trip).filter((x) => String(x.a.importedName) === 'Torre Eiffel');
    expect(eiffel).toHaveLength(2);
    expect(new Set(eiffel.map((x) => x.a.id)).size).toBe(2);
  });

  it('8. "Transfer para Versalhes" livre não vira logística', async () => {
    const days: ImportDay[] = [{ dia: 2, itens: [
      { nome: 'Transfer para Versalhes', hora: '09:00' }, { nome: 'Café da manhã no hotel', hora: '08:00', tipo: 'refeicao' },
      { nome: 'Check-in aeroporto', hora: '10:00' }, { nome: 'Room service', hora: '22:00', tipo: 'refeicao' } ] }];
    const r = await buildImportedDraft(input(), days, { routeLookup: noRoute });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const livres = acts(r.trip).filter((x) => x.a.importedFrom === 'user');
    expect(livres).toHaveLength(4);
    for (const { a } of livres) {
      expect(['passeio', 'restaurante']).toContain(roteiroKind(a));
      expect(a.name).toBe(a.importedName); // nome idêntico ao digitado, sem caractere invisível
    }
    expect(livres.map((x) => x.a.name)).toContain('Transfer para Versalhes');
    expect(roteiroKind({ ...livres.find((x) => x.a.name === 'Transfer para Versalhes')!.a, importedFrom: undefined } as TripActivity)).toBe('logistica'); // sem a guarda do A5, seria
  });

  it('9. dia do usuário sem itens → dia só com logística (e dia da viagem sem dia do usuário também)', async () => {
    const days: ImportDay[] = [
      { dia: 1, itens: [{ nome: 'Marais', hora: '16:00' }] }, { dia: 2, itens: [] },
      { dia: 4, itens: [{ nome: 'Angelina', hora: '10:00', tipo: 'refeicao' }] },
    ];
    const r = await buildImportedDraft(input(), days, { routeLookup: noRoute });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    for (const date of ['2026-12-08', '2026-12-09']) {
      const d = r.trip.days.find((x) => ymdOf(x.date) === date)!;
      expect(d.activities.length).toBe(0);
    }
    for (const d of r.trip.days) for (const a of d.activities) expect(isLog(a as never) || (a as never as Record<string, unknown>).importedName).toBeTruthy();
  });

  it('erros tipados, sem criar nada', async () => {
    const far = await buildImportedDraft(input(), [{ dia: 9, itens: [{ nome: 'Marais' }] }], { routeLookup: noRoute });
    expect(far).toMatchObject({ ok: false, erro: { code: 'dia_fora_da_viagem' } });
    const empty = await buildImportedDraft(input(), [{ dia: 1, itens: [] }], { routeLookup: noRoute });
    expect(empty).toMatchObject({ ok: false, erro: { code: 'roteiro_vazio' } });
    const city = await buildImportedDraft(input({ destinationCity: 'Cusco' }), SCENE, { routeLookup: noRoute });
    expect(city).toMatchObject({ ok: false, erro: { code: 'cidade_sem_catalogo' } });
    const back = await buildImportedDraft(input({ returnDate: new Date(2026, 11, 10) }), [{ dia: 1, itens: [{ nome: 'Marais' }] }], { routeLookup: noRoute });
    expect(back.ok).toBe(true); // volta no dia 10 também é alinhável: o último dia do usuário é o da data_volta
  });

  it('matchPlace: igual > contido único > ambíguo > livre', () => {
    expect(matchPlace('Museu do Louvre', 'Paris')).toMatchObject({ kind: 'reconhecido', item: { id: 'paris-louvre' } });
    expect(matchPlace('Marais', 'Paris')).toMatchObject({ kind: 'reconhecido', item: { id: 'paris-marais-walk' } });
    expect(matchPlace('Notre-Dame', 'Paris')).toEqual({ kind: 'livre', candidatos: 2 });
    expect(matchPlace('Café Constant', 'Paris')).toEqual({ kind: 'livre', candidatos: 0 });
    expect(matchPlace('Sé', 'Paris')).toEqual({ kind: 'livre', candidatos: 0 }); // < 5 caracteres não "contém"
  });

  it('applyImportedDays direto: sem dia de chegada → erro', () => {
    const r = applyImportedDays({ ...base, days: [] } as SavedTrip, SCENE);
    expect(r).toMatchObject({ ok: false, erro: { code: 'datas_nao_alinham' } });
  });
});
