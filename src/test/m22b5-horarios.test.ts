// M22b-5 — horário das refeições, ordem do usuário, um lugar por item. Caminho real: buildAgentImport → addTrip → listTrips.
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildAgentImport, type ImportAgentParams } from '@/lib/importAgent';
import { addTrip, listTrips } from '@/lib/tripStore';

const noRoute = async () => null;
const it_ = (nome: string, tipo = 'passeio', hora?: string, periodo?: string) => ({ nome, tipo, ...(hora ? { hora } : {}), ...(periodo ? { periodo } : {}) });
const PARAMS: ImportAgentParams = {
  destino: 'Paris', data_ida: '2026-12-07', data_volta: '2026-12-11', viajantes: 4, adultos: 2, criancas_idades: [8, 12], origem: 'São Paulo',
  dias: [
    { dia: 1, itens: [it_('Marais'), it_('Breizh Café', 'refeicao', undefined, 'jantar')] },
    { dia: 2, itens: [it_('Museu do Louvre', 'passeio', '09:00'), it_('Bouillon Chartier', 'refeicao', undefined, 'almoco'), it_('Jardim das Tulherias', 'passeio', '15:00'), it_("Le Relais de l'Entrecôte", 'refeicao', undefined, 'jantar')] },
    { dia: 3, itens: [it_('Torre Eiffel', 'passeio', '10:00'), it_('Café Constant', 'refeicao', undefined, 'almoco'), it_('cruzeiro no Sena', 'passeio', '15:00')] },
    { dia: 4, itens: [it_("Museu d'Orsay", 'passeio', '09:30'), it_("L'As du Fallafel", 'refeicao', undefined, 'almoco'), it_('Sainte-Chapelle', 'passeio', '15:00'), it_('Notre-Dame'), it_('Angelina', 'refeicao')] },
    { dia: 5, itens: [it_('Montmartre', 'passeio', undefined, 'manha'), it_('Sacré-Cœur', 'passeio', undefined, 'manha')] },
  ],
};

type Trip = ReturnType<typeof listTrips>[number];
let trip: Trip;
let out: Awaited<ReturnType<typeof buildAgentImport>> & { ok: true };
const mins = (t: unknown) => Number(String(t).slice(0, 2)) * 60 + Number(String(t).slice(3, 5));

beforeAll(async () => {
  localStorage.clear();
  const r = await buildAgentImport(PARAMS, 'São Paulo', { routeLookup: noRoute });
  if (r.ok === false) throw new Error(r.message);
  out = r;
  addTrip(r.trip);
  trip = listTrips().find((t) => t.id === r.trip.id)!;
});

type A = { id: string; name: string; time: string } & Record<string, unknown>;
const acts = (i: number) => (trip.days[i + 1].activities as unknown as A[]);
const user = (i: number) => acts(i).filter((a) => a.importedName);
const at = (i: number, frag: string) => user(i).find((a) => String(a.name).includes(frag))!;

describe('M22b-5 — horários da importação', () => {
  it('1. dia 1: Marais depois do check-in; Breizh às 20:00', () => {
    const ci = acts(0).find((a) => /-slot-checkin$/.test(a.id))!;
    expect(mins(at(0, 'Marais').time)).toBeGreaterThan(mins(ci.time));
    expect(at(0, 'Breizh').time).toBe('20:00');
  });
  it('2. dia 2 e nenhum par no mesmo horário', () => {
    expect(at(1, 'Louvre').time).toBe('09:00');
    const ch = mins(at(1, 'Chartier').time);
    expect(ch).toBeGreaterThan(540 + 60); // depois do fim do Louvre (duração ≥ 1h)
    expect(ch).toBeLessThan(15 * 60);
    expect(at(1, 'Tulherias').time).toBe('15:00');
    expect(at(1, 'Relais').time).toBe('20:00');
    trip.days.slice(1).forEach((_, i) => {
      const t = user(i).map((a) => a.time);
      expect(new Set(t).size).toBe(t.length);
    });
  });
  it('3. dia 4: ordem e horas crescentes; Angelina depois das 16:00', () => {
    const u = user(3);
    const order = ['Orsay', 'Fallafel', 'Sainte-Chapelle', 'Notre-Dame', 'Angelina'];
    expect(u.map((a) => order.findIndex((o) => String(a.name).includes(o)))).toEqual([0, 1, 2, 3, 4]);
    const t = u.map((a) => mins(a.time));
    expect([...t].sort((a, b) => a - b)).toEqual(t);
    expect(new Set(t).size).toBe(5);
    expect(t[4]).toBeGreaterThan(16 * 60);
  });
  it('4. dia 5: um item só (Montmartre & Sacré-Cœur), 10:00, foraDaJanela', () => {
    const u = user(4);
    expect(u).toHaveLength(1);
    expect(u[0].name).toBe('Montmartre & Sacré-Cœur');
    expect(u[0].time).toBe('10:00');
    expect(u[0].foraDaJanela).toBe(true);
  });
  it('5. contagem', () => {
    expect(out.resumo.itens).toBe(15);
    expect(out.resumo.reconhecidos).toHaveLength(12);
    expect(out.resumo.livres.map((l) => l.nome).sort()).toEqual(['Café Constant', 'Jardim das Tulherias', 'Notre-Dame']);
    expect(out.resumo.emDiaFechado.map((x) => x.nome).join()).toContain('Louvre');
  });
  it('6. kinu-ai/index.ts: periodo, regra 10b (h)–(k), 13 e 16 intactas', () => {
    const src = readFileSync('supabase/functions/kinu-ai/index.ts', 'utf8');
    expect(src).toContain('periodo: { type: "string", enum: ["cafe_da_manha", "manha", "almoco", "tarde", "jantar", "noite"]');
    for (const m of ['(h) UM lugar por item', '(i) nome é SÓ o nome próprio', '(j) hora só quando', '(k) Os itens de cada dia vão na ORDEM']) expect(src).toContain(m);
    expect(src).toContain('13. ORÇAMENTO SEM NÚMERO DE MEMÓRIA');
    expect(src).toContain('16. DECISÃO DE ORÇAMENTO');
  });
});
