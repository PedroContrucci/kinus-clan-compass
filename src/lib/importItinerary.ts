// importItinerary (M22b-1) — o roteiro que o usuário trouxe vira os DIAS do rascunho. Puro (sem React,
// sem rede). O KINU continua escolhendo voo e hotel pelo caminho normal (buildDraftTrip); aqui só se
// troca o miolo dos dias: do motor fica a logística, o resto é do usuário.
//
// Nada de itineraryEngine/itineraryValidator/placeIdentity/createTrip/draftItinerary/replanItinerary é
// alterado: só importados. Campos novos entram por fora do tipo (importedFrom, importedName, semValor).
import { addDays, format } from 'date-fns';
import { getDestinationActivities, type SuggestedActivity } from '@/data/destinationActivities';
import { normalizePlaceName } from '@/lib/placeIdentity';
import { computeBuckets, convertToItineraryActivity, type BudgetBreakdown, type ItineraryActivity } from '@/lib/itineraryEngine';
import { opensOn, weekdayOf, lastDayWindowHours, durationMinutesOf, defaultMinutesOf, type PlanDayItem } from '@/lib/itineraryValidator';
import { financesFromBuckets, itineraryToTripDays, tripDaysToItinerary } from '@/lib/draftItinerary';
import { followPlanEnvelope } from '@/lib/planTotals';
import { catalogIdOf } from '@/lib/localAchievements';
import { isCityCurated } from '@/lib/curatedCities';
import { paxOf } from '@/lib/pax';
import { replanTrip, retimeConfirmedLegs, type UnplacedEdit } from '@/lib/replanItinerary';
import { buildDraftTrip, type DraftTripDeps, type DraftTripInput } from '@/lib/createTrip';
import type { SelectedFlight } from '@/lib/itineraryEngine';
import type { SavedTrip, TripActivity, TripDay } from '@/types/trip';

// ── Entrada (o que o agente entrega) ─────────────────────────────────────────────────────────────

export type ImportItemKind = 'refeicao' | 'passeio' | 'outro';
export interface ImportItem { nome: string; hora?: string; tipo?: ImportItemKind }
/** `dia` é 1-based: o dia 1 é o da chegada ao destino (datas do roteiro = datas NO DESTINO). */
export interface ImportDay { dia: number; itens: ImportItem[] }

/** Tetos de sanidade da biblioteca (o schema da ferramenta é mais apertado, na M22b-2). */
export const IMPORT_LIMITS = { dias: 14, itensPorDia: 20, nome: 80 } as const;

// ── Saída ────────────────────────────────────────────────────────────────────────────────────────

export interface ImportSummary {
  dias: number;
  itens: number;
  reconhecidos: { nomeUsuario: string; nomeCatalogo: string; id: string }[];
  livres: { nome: string; candidatos: number; motivo?: 'repetido' }[];
  semValor: number;
  emDiaFechado: { nome: string; data: string; diaSemana: string }[];
  foraDaJanela: { nome: string; data: string; motivo: string }[];
}

export type ImportErrorCode =
  | 'roteiro_vazio' | 'cidade_sem_catalogo' | 'datas_invalidas' | 'datas_nao_alinham' | 'dia_fora_da_viagem';
export interface ImportError { code: ImportErrorCode; message: string }

export type ImportResult =
  | { ok: true; trip: SavedTrip; resumo: ImportSummary }
  | { ok: false; erro: ImportError };

const fail = (code: ImportErrorCode, message: string): { ok: false; erro: ImportError } => ({ ok: false, erro: { code, message } });

// ── Casamento com o catálogo (D2) ────────────────────────────────────────────────────────────────

/**
 * Chave de comparação = normalizePlaceName + conectivo "e/&/and/y/et" unificado (assim "Montmartre e
 * Sacré-Cœur" casa com "Montmartre & Sacré-Cœur"). Simétrica: vale para os dois lados.
 */
export function matchKey(name: string): string {
  return normalizePlaceName(name).replace(/\s+(?:&|e|and|y|et)\s+/g, ' & ');
}

const MIN_CONTAIN = 5;

export type PlaceMatch =
  | { kind: 'reconhecido'; item: SuggestedActivity }
  | { kind: 'livre'; candidatos: number };

/**
 * (1) chave igual → reconhecido; (2) senão, a chave de um lado (≥ 5 caracteres) contida na do outro em
 * UM único item da cidade → reconhecido; (3) nenhum candidato → livre; 2 ou mais → livre com candidatos.
 */
export function matchPlace(nome: string, cidade: string): PlaceMatch {
  const key = matchKey(nome);
  if (!key) return { kind: 'livre', candidatos: 0 };
  const catalog = getDestinationActivities(cidade).map((item) => ({ item, key: matchKey(item.name) }));
  const exact = catalog.find((c) => c.key === key);
  if (exact) return { kind: 'reconhecido', item: exact.item };
  const near = catalog.filter((c) => (
    (key.length >= MIN_CONTAIN && c.key.includes(key)) || (c.key.length >= MIN_CONTAIN && key.includes(c.key))
  ));
  if (near.length === 1) return { kind: 'reconhecido', item: near[0].item };
  return { kind: 'livre', candidatos: near.length };
}

// ── D6: dia fechado (só avisa) ───────────────────────────────────────────────────────────────────

/** Dia da semana (0=dom…6=sáb) em que o item do catálogo NÃO abre na data; null = abre / sem dado. */
export function closedWeekdayOf(activity: { id: string }, dateISO: string): number | null {
  const wd = weekdayOf(dateISO);
  if (wd < 0) return null;
  return opensOn(catalogIdOf(activity.id), wd) ? null : wd;
}

export const WEEKDAY_NAME = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

// ── A3: janela do dia do voo de volta (só avisa) ─────────────────────────────────────────────────

const MOTIVO_JANELA = 'passa da janela do dia do voo de volta';
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

/**
 * O item (hora + duração) cabe na janela do dia do voo de volta? Mesma janela do motor:
 * 08:00 até (partida − 3 h intl / − 2 h doméstico), por `lastDayWindowHours`. Sem hora de partida
 * conhecida → false (nada a avisar). Só o dia da volta: o motor não exporta a janela do dia de chegada.
 */
export function outsideDayWindow(time: string, durationMin: number, returnDepartureTime: string | undefined, domestic: boolean): boolean {
  if (!returnDepartureTime || !/^\d{1,2}:\d{2}/.test(time)) return false;
  const end = (8 + lastDayWindowHours(returnDepartureTime, domestic)) * 60;
  return toMin(time) + Math.max(0, durationMin) > end;
}

// ── Montagem ─────────────────────────────────────────────────────────────────────────────────────

type DayActivity = TripActivity & Record<string, unknown>;

export const isLogistics = (a: { id?: unknown; kind?: unknown }): boolean =>
  a.kind === 'flight' || a.kind === 'checkin' || a.kind === 'checkout'
  || /-slot-(flight-out|flight-back|checkin|checkout|transfer)$/.test(String(a.id ?? ''));

const ymd = (d: Date | string) => format(new Date(d), 'yyyy-MM-dd');
const parseYmd = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

const cleanName = (raw: unknown): string =>
  Array.from(String(raw ?? '')).map((ch) => (ch.charCodeAt(0) < 32 ? ' ' : ch)).join('').replace(/\s+/g, ' ').trim().slice(0, IMPORT_LIMITS.nome);

/** "9:00" / "09h30" → "09:00"; qualquer outra coisa → null. */
function cleanTime(raw: unknown): string | null {
  const m = String(raw ?? '').trim().match(/^(\d{1,2})[:h](\d{2})$/i);
  if (!m) return null;
  const h = Number(m[1]), min = Number(m[2]);
  return h <= 23 && min <= 59 ? `${String(h).padStart(2, '0')}:${m[2]}` : null;
}

type Slot = 'breakfast' | 'lunch' | 'dinner' | 'morning' | 'afternoon' | 'night';

/** Menor regra possível: o slot sai da HORA do usuário, dentro da classe do item (refeição ou passeio). */
function slotFor(meal: boolean, time: string): Slot {
  const h = Number(time.slice(0, 2));
  if (meal) return h < 10 ? 'breakfast' : h < 16 ? 'lunch' : 'dinner';
  return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'night';
}

/** Sem hora informada: o horário padrão do catálogo da casa (tripItineraryOps.defaultTimeFor), por classe. */
const DEFAULT_TIME: Record<'meal' | 'tour', string> = { meal: '12:30', tour: '10:00' };
const CATALOG_DEFAULT_TIME: Record<string, string> = { breakfast: '08:00', lunch: '12:30', dinner: '20:00', morning: '10:00', afternoon: '15:00', night: '21:00' };

const byTime = (a: { time?: string }, b: { time?: string }) => (a.time || '99:99').localeCompare(b.time || '99:99');

const slugOf = (name: string) => matchKey(name).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item';

const engineIdsOf = (base: SavedTrip, baseDays: TripDay[]): string[] => {
  const ids = (base as unknown as { engineItemIds?: unknown }).engineItemIds;
  return Array.isArray(ids) ? ids.map(String) : baseDays.flatMap((d) => d.activities.map((a) => a.id));
};

/**
 * Troca o miolo dos dias de um rascunho JÁ alinhado (dia 1 do usuário = dia do check-in). Devolve erro
 * tipado, sem criar nada, se algum dia do usuário não existir na viagem.
 */
export function applyImportedDays(base: SavedTrip, userDays: ImportDay[]): ImportResult {
  const city = base.destination;
  const baseDays = JSON.parse(JSON.stringify(base.days ?? [])) as TripDay[];
  const arrivalIdx = baseDays.findIndex((d) => d.activities.some((a) => /-slot-checkin$/.test(a.id)));
  if (arrivalIdx < 0) return fail('datas_nao_alinham', 'A viagem não tem dia de chegada com check-in.');
  const dateOf = new Map(baseDays.map((d, i) => [i, ymd(d.date)] as const));
  const firstDate = parseYmd(dateOf.get(arrivalIdx)!);

  const backIdx = baseDays.findIndex((d) => d.activities.some((a) => /-slot-flight-back$/.test(a.id)));
  const retFlight = (base as unknown as { returnFlight?: { option?: { departureTime?: string }; international?: boolean } }).returnFlight;
  const retDep = retFlight?.option?.departureTime;
  const retDomestic = retFlight?.international === false;
  const warnWindow = (out: DayActivity, nome: string, idx: number, date: string) => {
    if (idx !== backIdx) return;
    const dur = durationMinutesOf(out.duration);
    const mins = dur > 0 ? dur : defaultMinutesOf({ name: out.name, type: out.type, timeSlot: out.timeSlot } as PlanDayItem);
    if (!outsideDayWindow(String(out.time), mins, retDep, retDomestic)) return;
    out.foraDaJanela = true;
    resumo.foraDaJanela.push({ nome, data: date, motivo: MOTIVO_JANELA });
  };

  const travelers = Math.max(1, Number(base.travelers) || 1);
  const pax = paxOf(base);

  // Do motor fica só a logística; o resto sai (D5/D7).
  const days: TripDay[] = baseDays.map((d) => ({ ...d, activities: d.activities.filter((a) => isLogistics(a)) }));

  const resumo: ImportSummary = { dias: 0, itens: 0, reconhecidos: [], livres: [], semValor: 0, emDiaFechado: [], foraDaJanela: [] };
  const usedPlaces = new Set<string>();
  const usedIds = new Set<string>();

  const sorted = [...userDays].sort((a, b) => a.dia - b.dia);
  for (const ud of sorted) {
    const date = ymd(addDays(firstDate, ud.dia - 1));
    const idx = baseDays.findIndex((_, i) => dateOf.get(i) === date);
    if (idx < 0) return fail('dia_fora_da_viagem', `O dia ${ud.dia} do roteiro (${date}) cai fora da viagem.`);
    const day = days[idx];
    const n = Number(day.day) - 1; // `day-<n>-…`: n = dayNumber − 1, como o motor grava
    resumo.dias += 1;

    for (const raw of ud.itens.slice(0, IMPORT_LIMITS.itensPorDia)) {
      const nome = cleanName(raw?.nome);
      if (!nome) continue;
      resumo.itens += 1;
      const hora = cleanTime(raw.hora);
      const match = matchPlace(nome, city);
      const placeKey = match.kind === 'reconhecido' ? matchKey(match.item.name) : '';

      if (match.kind === 'reconhecido' && !usedPlaces.has(placeKey)) {
        usedPlaces.add(placeKey);
        const cat = match.item;
        const meal = cat.category === 'breakfast' || cat.category === 'lunch' || cat.category === 'dinner';
        const time = hora ?? CATALOG_DEFAULT_TIME[cat.category] ?? DEFAULT_TIME.tour;
        const slot = slotFor(meal, time);
        const act: ItineraryActivity = convertToItineraryActivity(cat, n, slot, time, travelers, pax);
        act.type = meal ? (slot as ItineraryActivity['type']) : slot === 'night' ? 'night' : 'experience';
        const [item] = itineraryToTripDays([{ dayNumber: Number(day.day), date: new Date(day.date), label: '', activities: [act], totalCost: act.estimatedCost }])[0].activities;
        const out: DayActivity = { ...item, status: 'planned', importedName: nome };
        day.activities.push(out);
        usedIds.add(out.id);
        resumo.reconhecidos.push({ nomeUsuario: nome, nomeCatalogo: cat.name, id: cat.id });
        const wd = closedWeekdayOf(out, date);
        if (wd !== null) resumo.emDiaFechado.push({ nome: cat.name, data: date, diaSemana: WEEKDAY_NAME[wd] });
        warnWindow(out, cat.name, idx, date);
        continue;
      }

      // Livre: sem casamento, ambíguo, ou segundo item do usuário no mesmo lugar do catálogo.
      const meal = raw.tipo === 'refeicao';
      const time = hora ?? DEFAULT_TIME[meal ? 'meal' : 'tour'];
      const slot = slotFor(meal, time);
      const category = meal ? 'comida' : 'passeio';
      const base_id = `day-${n}-import-${slugOf(nome)}`;
      let id = base_id;
      for (let k = 2; usedIds.has(id); k++) id = `${base_id}-${k}`;
      usedIds.add(id);
      const out: DayActivity = {
        id, time, name: nome, description: '', duration: '', cost: 0,
        type: category, category, status: 'planned',
        timeSlot: slot, kind: meal ? slot : slot === 'night' ? 'night' : 'experience',
        importedFrom: 'user', importedName: nome, semValor: true,
      };
      day.activities.push(out);
      warnWindow(out, nome, idx, date);
      resumo.semValor += 1;
      resumo.livres.push({
        nome,
        candidatos: match.kind === 'livre' ? match.candidatos : 0,
        ...(match.kind === 'reconhecido' ? { motivo: 'repetido' as const } : {}),
      });
    }
  }
  days.forEach((d) => d.activities.sort(byTime));

  // D8: voo e hospedagem como já gravados; comida/passeios pelo MESMO computeBuckets do motor sobre os
  // dias finais (o transfer do motor, que tem custo, continua contado onde o Roteiro o conta).
  const cats = (base.finances?.categories ?? {}) as Record<string, { planned?: number } | undefined>;
  const flightsPlanned = Math.round(Number(cats.flights?.planned) || 0);
  const hotelPlanned = Math.round(Number(cats.accommodation?.planned) || 0);
  const breakdown = { flights: { amount: flightsPlanned }, hotel: { amount: hotelPlanned } } as BudgetBreakdown;
  const buckets = computeBuckets(tripDaysToItinerary(days, new Date(base.startDate), travelers), breakdown, hotelPlanned || undefined);
  const finances = financesFromBuckets(buckets, Number(base.budget) || 0, base.finances);
  const followed = followPlanEnvelope({ ...base, finances } as Record<string, unknown> & { budget?: number; finances: typeof finances });

  const trip = {
    ...base,
    days,
    finances: followed.finances,
    budget: Number(followed.budget) || finances.total,
    // D7 (A1): a saída COMPLETA do motor do rascunho base — assim a troca de voo não reenche os dias.
    engineItemIds: engineIdsOf(base, baseDays),
    importedFrom: 'user',
  } as SavedTrip;
  return { ok: true, trip, resumo };
}

/**
 * Rascunho pelo caminho normal (buildDraftTrip) + dias do usuário. `input.departureDate` é a data do dia
 * 1 do usuário NO DESTINO e `input.returnDate` a do último dia (voo de volta). Se o check-in cair depois
 * do dia 1, remonta com a partida antecipada na diferença (até 2 remontagens); se não alinhar → erro.
 */
export async function buildImportedDraft(input: DraftTripInput, userDays: ImportDay[], deps: DraftTripDeps = {}): Promise<ImportResult> {
  if (!isCityCurated(input.destinationCity)) {
    return fail('cidade_sem_catalogo', `${input.destinationCity} não tem catálogo curado no KINU.`);
  }
  const clean = (Array.isArray(userDays) ? userDays : [])
    .filter((d) => d && Number.isInteger(d.dia) && d.dia >= 1 && d.dia <= IMPORT_LIMITS.dias && Array.isArray(d.itens))
    .map((d) => ({ dia: d.dia, itens: d.itens.filter((i) => i && cleanName(i.nome)) }));
  if (!clean.some((d) => d.itens.length > 0)) return fail('roteiro_vazio', 'O roteiro não trouxe nenhum item.');
  if (!(input.departureDate instanceof Date) || !(input.returnDate instanceof Date) || isNaN(+input.departureDate) || isNaN(+input.returnDate)) {
    return fail('datas_invalidas', 'Datas inválidas.');
  }

  const day1 = ymd(input.departureDate);
  const lastDate = ymd(input.returnDate);
  let departure = input.departureDate;
  for (let attempt = 0; attempt <= 2; attempt++) {
    const trip = await buildDraftTrip({ ...input, departureDate: departure }, deps);
    const checkin = trip.days.find((d) => d.activities.some((a) => /-slot-checkin$/.test(a.id)));
    const back = trip.days.find((d) => d.activities.some((a) => /-slot-flight-back$/.test(a.id)));
    if (!checkin || !back) return fail('datas_nao_alinham', 'Não consegui localizar chegada e volta na viagem.');
    const late = Math.round((+parseYmd(ymd(checkin.date)) - +parseYmd(day1)) / 86_400_000);
    if (late === 0) {
      if (ymd(back.date) !== lastDate) return fail('datas_nao_alinham', 'O voo de volta não cai no último dia do roteiro.');
      return applyImportedDays(trip, clean);
    }
    if (late < 0 || attempt === 2) return fail('datas_nao_alinham', 'Não consegui alinhar a chegada com o dia 1 do roteiro.');
    departure = addDays(departure, -late);
  }
  return fail('datas_nao_alinham', 'Não consegui alinhar as datas.');
}

/** Item livre importado? (rótulo "Do seu roteiro"). */
export const isImportedFree = (a: { importedFrom?: unknown } | null | undefined): boolean => a?.importedFrom === 'user';

// ── A2: troca de voo sem tirar item do usuário ───────────────────────────────────────────────────

const isImported = (a: object): boolean => {
  const x = a as { importedName?: unknown; importedFrom?: unknown };
  return !!x.importedName || x.importedFrom === 'user';
};

/**
 * Mesma assinatura de replanTrip. Depois dele: (a) sai todo item que não é logística nem importado
 * (o motor pode escolher item fora de engineItemIds); (b) todo item importado que replanTrip pôs em
 * `unplaced` (ou perdeu) volta ao dia e à hora originais com `foraDaJanela: true`. O KINU nunca tira
 * item do usuário; avisa. O `unplaced` devolvido não contém item importado.
 */
export function replanImportedTrip(trip: Parameters<typeof replanTrip>[0], flights: { outbound: SelectedFlight; return: SelectedFlight }): ReturnType<typeof replanTrip> {
  const r = replanTrip(trip, flights);
  const fixed = restoreImported((trip.days ?? []) as TripDay[], r.days as TripDay[], r.unplaced);
  return { ...r, days: fixed.days as unknown as typeof r.days, unplaced: fixed.unplaced };
}

/** Decisão pura: que função de replanejamento vale para esta viagem (troca de voo). */
export const replanFor = (trip: { importedFrom?: unknown }) => (trip.importedFrom === 'user' ? replanImportedTrip : replanTrip);

/** Viagem importada precisa de confirmação antes de "Regerar roteiro" (apaga todos os dias). */
export const needsRegenerateConfirm = (trip: { importedFrom?: unknown }): boolean => trip.importedFrom === 'user';

/**
 * Troca de hora de voo confirmado (Viagens): `retimeConfirmedLegs` replaneja com `replanTrip` (arquivo
 * intocável); para viagem importada, o resultado é corrigido aqui com a mesma restauração de replanImportedTrip.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function retimeLegsFor<T extends Record<string, any>>(trip: T, before: Parameters<typeof retimeConfirmedLegs>[1]): ReturnType<typeof retimeConfirmedLegs<T>> {
  const res = retimeConfirmedLegs(trip, before);
  if (trip.importedFrom !== 'user' || !res.replanned) return res;
  const fixed = restoreImported((trip.days ?? []) as TripDay[], (res.trip.days ?? []) as TripDay[], res.unplaced);
  return { ...res, trip: { ...res.trip, days: fixed.days, unplacedEdits: fixed.unplaced }, unplaced: fixed.unplaced };
}

function restoreImported(originalDays: TripDay[], newDays: TripDay[], unplaced: UnplacedEdit[]): { days: TripDay[]; unplaced: UnplacedEdit[] } {
  type Act = TripActivity & Record<string, unknown>;
  const original = new Map<string, { day: number; a: Act }>();
  for (const d of originalDays) {
    for (const a of d.activities as Act[]) if (isImported(a)) original.set(a.id, { day: Number(d.day), a });
  }
  const unplacedIds = new Set(unplaced.map((u) => u.id));
  const days = newDays.map((d) => ({
    ...d,
    activities: (d.activities as Act[])
      .filter((a) => isLogistics(a) || isImported(a))
      .map((a) => {
        const o = original.get(a.id);
        return o && isImported(a) && o.a.time !== a.time ? { ...a, time: o.a.time } : a;
      }),
  }));
  const present = new Set(days.flatMap((d) => d.activities.map((a) => a.id)));
  for (const [id, { day, a }] of original) {
    if (present.has(id)) continue;
    const d = days.find((x) => Number(x.day) === day);
    if (!d) continue;
    d.activities.push({ ...a, ...(unplacedIds.has(id) ? { foraDaJanela: true } : {}) } as Act);
    d.activities.sort(byTime);
  }
  for (const d of days) d.activities.sort(byTime);
  return { days: days as TripDay[], unplaced: unplaced.filter((u) => !original.has(u.id)) };
}
