// M25a — importada: depois da troca de voo, janela recalculada e financeiro = soma dos itens dos dias.
// Caminho real: buildAgentImport → addTrip → listTrips → writeFlightsThrough → replanFor (como o regenerateWith). Sem rede.
import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { RoteiroDia } from '@/components/cockpit/RoteiroDia';
import { buildAgentImport, type ImportAgentParams } from '@/lib/importAgent';
import { addTrip, listTrips, updateTrip, getTrip } from '@/lib/tripStore';
import { offerToSelected, writeFlightsThrough, type ReferenceOffer } from '@/lib/flightModel';
import { replanFor } from '@/lib/importItinerary';
import { replanTrip } from '@/lib/replanItinerary';
import { planBreakdown } from '@/lib/planTotals';

const noRoute = async () => null;
const it_ = (nome: string, tipo = 'passeio', hora?: string, periodo?: string) => ({ nome, tipo, ...(hora ? { hora } : {}), ...(periodo ? { periodo } : {}) });
const PARAMS: ImportAgentParams = {
  destino: 'Paris', data_ida: '2026-12-07', data_volta: '2026-12-11', viajantes: 4, adultos: 2, criancas_idades: [8, 12], origem: 'São Paulo', orcamento_total: 30000,
  dias: [
    { dia: 1, itens: [it_('Marais'), it_('Breizh Café', 'refeicao', undefined, 'jantar')] },
    { dia: 2, itens: [it_('Museu do Louvre', 'passeio', '09:00'), it_('Bouillon Chartier', 'refeicao', undefined, 'almoco'), it_('Jardim das Tulherias', 'passeio', '15:00'), it_("Le Relais de l'Entrecôte", 'refeicao', undefined, 'jantar')] },
    { dia: 3, itens: [it_('Torre Eiffel', 'passeio', '10:00'), it_('Café Constant', 'refeicao', undefined, 'almoco'), it_('cruzeiro no Sena', 'passeio', '15:00')] },
    { dia: 4, itens: [it_("Museu d'Orsay", 'passeio', '09:30'), it_("L'As du Fallafel", 'refeicao', undefined, 'almoco'), it_('Sainte-Chapelle', 'passeio', '15:00'), it_('Notre-Dame'), it_('Angelina', 'refeicao')] },
    { dia: 5, itens: [it_('Montmartre', 'passeio', undefined, 'manha'), it_('Sacré-Cœur', 'passeio', undefined, 'manha')] },
  ],
};

type Trip = ReturnType<typeof listTrips>[number];
type A = { id: string; name: string; time: string; cost?: number } & Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
let trip: Trip;

beforeAll(async () => {
  localStorage.clear();
  const r = await buildAgentImport(PARAMS, 'São Paulo', { routeLookup: noRoute });
  if (r.ok === false) throw new Error(r.message);
  addTrip(r.trip);
  trip = listTrips().find((t) => t.id === r.trip.id)!;
});

const ymd = (d: unknown) => new Date(d as string).toISOString().slice(0, 10);
const offer = (id: string, from: string, to: string, date: string, time: string, minutes: number, price: number): ReferenceOffer => ({
  id, airline: 'JJ', route: `${from} → ${to}`, isDirect: false, duration: '', durationMinutes: minutes, price,
  departureTime: time, arrivalTime: '', departureAirport: from, arrivalAirport: to,
  segments: [{ departure: { iataCode: from, at: `${date}T${time}:00` }, arrival: { iataCode: to, at: `${date}T${time}:00` } }],
});
function legs(retTime: string, outPrice = 2654, retPrice = 4759) {
  const f = (trip as Any).flights;
  const o = offerToSelected(offer('o', 'GRU', 'CDG', ymd(f.outbound.departureDate), '18:05', 775, outPrice), { date: new Date(f.outbound.departureDate), fromCity: 'São Paulo', toCity: 'Paris' });
  const r = offerToSelected(offer('r', 'CDG', 'GRU', ymd(f.return.departureDate), retTime, 900, retPrice), { date: new Date(f.return.departureDate), fromCity: 'Paris', toCity: 'São Paulo' });
  return { outbound: { ...o, chosenBy: 'kinu' as const }, return: { ...r, chosenBy: 'kinu' as const } };
}
// Mesmo caminho do DraftCockpit.regenerateWith (preserveEdits).
function apply(t: Any, l: ReturnType<typeof legs>) {
  const w = writeFlightsThrough({ ...t }, l.outbound, l.return) as Any;
  const built = replanFor(w)(w, l);
  return { ...w, days: built.days, budget: built.budget, finances: built.finances } as Any;
}
const acts = (t: Any) => (t.days as Any[]).flatMap((d) => (d.activities as A[]).map((a) => ({ day: d.day, a })));
const mine = (t: Any) => acts(t).filter(({ a }) => a.importedName);
const sumCost = (t: Any) => mine(t).reduce((s, { a }) => s + (a.cost || 0), 0);

describe('M25a — troca de voo na importada', () => {
  // Passa pelo tripStore (gravar + ler) e desenha a linha do Montmartre como a tela faz.
  const viaStore = (t: Any) => { updateTrip(t.id, (x) => ({ ...x, days: t.days })); return getTrip(t.id) as Any; };
  const tela = (t: Any) => {
    const m = mine(t).find(({ a }) => /Montmartre/.test(a.name))!;
    const d = (t.days as Any[]).find((x) => x.day === m.day);
    cleanup();
    render(<RoteiroDia dayNumber={m.day} date={new Date(2026, 11, 11)} activities={d.activities} destination="Paris" liveLegs={null}
      expandedIds={new Set()} onToggleExpand={() => {}} onCollapseAll={() => {}} renderMap={() => <div />} routeOpen={false} onRouteToggle={() => {}} onSwap={() => {}} />);
    return screen.queryByTestId('roteiro-aviso-janela')?.textContent ?? null;
  };
  const medir = (t: Any) => {
    const m = mine(t).find(({ a }) => /Montmartre/.test(a.name))!;
    const d = (t.days as Any[]).find((x) => x.day === m.day);
    const l = (re: RegExp) => (d.activities as A[]).filter((a) => re.test(a.id)).map((a) => `${a.id.replace(/^day-\d+-/, '')}@${a.time}+${a.duration ?? ''}`);
    return { montmartre: `${m.a.time}+${m.a.duration}`, fora: m.a.foraDaJanela, motivo: m.a.janelaMotivo, logistica: l(/-slot-/) };
  };
  const montmartre = (t: Any) => mine(t).find(({ a }) => /Montmartre/.test(a.name))!.a;
  it('(i) volta 18:20: Montmartre colide com o check-out', () => {
    const t = viaStore(apply(trip, legs('18:20')));
    console.log('M25A-I', JSON.stringify(medir(t)));
    expect(montmartre(t).foraDaJanela).toBe(true);
    expect(montmartre(t).janelaMotivo).toBe('checkout');
    expect(tela(t)).toContain('Conflita com o horário do check-out');
  });
  it('(ii) volta 11:00: não cabe antes do voo', () => {
    const t = viaStore(apply(trip, legs('11:00')));
    console.log('M25A-II', JSON.stringify(medir(t)));
    expect(montmartre(t).foraDaJanela).toBe(true);
    expect(montmartre(t).janelaMotivo).toBe('voo');
    expect(tela(t)).toContain('Não cabe antes do voo de volta');
  });
  it('(ii-b) de 11:00 para 18:20 o motivo muda de voo para checkout', () => {
    const t1 = viaStore(apply(trip, legs('11:00')));
    expect(montmartre(t1).janelaMotivo).toBe('voo');
    const t2 = viaStore(apply(t1, legs('18:20')));
    expect(montmartre(t2).foraDaJanela).toBe(true);
    expect(montmartre(t2).janelaMotivo).toBe('checkout');
  });
  it('(vii) logo após a importação (voo estimado), Montmartre 10:00 → voo', () => {
    const m = montmartre(trip as Any);
    console.log('M25A-VII', JSON.stringify({ time: m.time, fora: m.foraDaJanela, motivo: m.janelaMotivo }));
    expect(m.foraDaJanela).toBe(true);
    expect(m.janelaMotivo).toBe('voo');
  });
  it('(vi) Montmartre 08:30 explícito + volta 18:20: sem aviso', async () => {
    localStorage.clear();
    const p = { ...PARAMS, dias: PARAMS.dias.map((d) => d.dia === 5 ? { ...d, itens: [it_('Montmartre', 'passeio', '08:30'), it_('Sacré-Cœur', 'passeio', undefined, 'manha')] } : d) };
    const r = await buildAgentImport(p, 'São Paulo', { routeLookup: noRoute });
    if (r.ok === false) throw new Error(r.message);
    addTrip(r.trip);
    const base = listTrips().find((x) => x.id === r.trip.id)! as Any;
    trip = base;
    const t = viaStore(apply(base, legs('18:20')));
    const m = montmartre(t);
    console.log('M25A-VI', JSON.stringify({ time: m.time, fora: m.foraDaJanela, motivo: m.janelaMotivo }));
    expect(m.foraDaJanela).toBeUndefined();
    expect(m.janelaMotivo).toBeUndefined();
  });
  it('(iii) voo 2.654 + 4.759 × 4 pagantes = 29.652; comida+passeios = soma dos itens (igual a antes)', () => {
    const before = planBreakdown(trip as Any);
    const t = apply(trip, legs('18:20'));
    const after = planBreakdown(t);
    expect(after.flights).toBe(29652);
    expect(after.food + after.tours).toBe(before.food + before.tours);
    expect(after.hotel).toBe(before.hotel);
    expect(after.total).toBe(after.flights + after.hotel + after.food + after.tours);
    expect(after.total).toBe(29652 + before.hotel + before.food + before.tours);
    expect(t.budget).toBe(30000); // teto do usuário intacto
  });
  it('(iv) os itens do usuário seguem nos mesmos dias e horários, com selos', () => {
    const before = mine(trip);
    const after = mine(apply(trip, legs('18:20')));
    expect(before.length).toBeGreaterThan(10);
    const key = (x: { day: unknown; a: A }) => `${x.day}|${x.a.id}|${x.a.time}`;
    expect(after.map(key).sort()).toEqual(before.map(key).sort());
    expect(after.every(({ a }) => typeof a.importedName === 'string')).toBe(true);
    expect(after.filter(({ a }) => a.importedFrom === 'user').length).toBe(before.filter(({ a }) => a.importedFrom === 'user').length);
  });
  it('soma dos custos dos itens dos dias = alimentação + passeios (menos transfer do motor)', () => {
    const t = apply(trip, legs('18:20'));
    const b = planBreakdown(t);
    expect(b.food + b.tours).toBeGreaterThanOrEqual(sumCost(t));
  });
  it('(v) não importada: replanFor = replanTrip, finanças e dias idênticos', () => {
    const { importedFrom: _i, ...plain } = trip as Any;
    const l = legs('18:20');
    const w = writeFlightsThrough({ ...plain }, l.outbound, l.return) as Any;
    const a = replanFor(w)(w, l);
    const b = replanTrip(w, l);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
