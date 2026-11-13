// M22b-3 — importar_roteiro: montagem pura (sem rede, sem UI) usada pelo handler do agente e pelo cartão.
import { format, addDays } from 'date-fns';
import { agentCity, describeTravelers, nearestCatalogCities, planFromAgent, type AgentPlanParams } from '@/lib/destinationPicker';
import {
  buildImportedDraft, closedWeekdayOf, matchKey, matchPlace, IMPORT_LIMITS,
  type ImportDay, type ImportItem, type ImportResult, type ImportSummary,
} from '@/lib/importItinerary';
import { finishFlowTrip } from '@/lib/onboardingFlow';
import type { DraftTripDeps } from '@/lib/createTrip';
import type { StoredTrip } from '@/lib/tripStore';

export const AGENT_IMPORT_LIMITS = { dias: 10, itensPorDia: 8, itens: 40 } as const;

export interface ImportAgentParams extends AgentPlanParams {
  dias?: { dia?: number; itens?: { hora?: string; nome?: string; tipo?: string; periodo?: string }[] }[];
}

const ymdParts = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const ddmm = (s: unknown) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s ?? '')); return m ? `${m[3]}/${m[2]}` : '—'; };

/** Normaliza os dias do agente e corta em 10 dias / 8 por dia / 40 itens no total. */
export function normalizeImportDays(raw: unknown): { days: ImportDay[]; cut: boolean } {
  const list = Array.isArray(raw) ? raw : [];
  let cut = list.length > AGENT_IMPORT_LIMITS.dias;
  let total = 0;
  const days: ImportDay[] = [];
  for (const d of list.slice(0, AGENT_IMPORT_LIMITS.dias)) {
    if (!d || !Number.isInteger(d.dia) || !Array.isArray(d.itens)) continue;
    const valid = (d.itens as ImportItem[]).filter((i) => i && typeof i.nome === 'string' && i.nome.trim());
    if (valid.length > AGENT_IMPORT_LIMITS.itensPorDia) cut = true;
    const itens: ImportItem[] = [];
    for (const i of valid.slice(0, AGENT_IMPORT_LIMITS.itensPorDia)) {
      if (total >= AGENT_IMPORT_LIMITS.itens) { cut = true; break; }
      itens.push({ nome: i.nome.trim().slice(0, IMPORT_LIMITS.nome), hora: i.hora, tipo: i.tipo as ImportItem['tipo'], ...(i.periodo ? { periodo: i.periodo } : {}) });
      total += 1;
    }
    days.push({ dia: d.dia, itens });
  }
  return { days, cut };
}

export interface ImportCardInfo { lines: string[]; cut: boolean }

/** Texto do cartão (sem construir a viagem): mesma regra de casamento da biblioteca. */
export function importCardLines(p: ImportAgentParams): ImportCardInfo {
  const { days, cut } = normalizeImportDays(p.dias);
  const city = agentCity(String(p.destino ?? '')) ?? String(p.destino ?? '');
  const first = /^\d{4}-\d{2}-\d{2}$/.test(String(p.data_ida)) ? ymdParts(p.data_ida) : null;
  const used = new Set<string>();
  const sameDay = new Set<string>();
  let itens = 0, reconhecidos = 0, fechado = 0;
  for (const d of days) for (const it of d.itens) {
    const m = matchPlace(it.nome, city);
    const key = m.kind === 'reconhecido' ? matchKey(m.item.name) : '';
    if (key && sameDay.has(`${d.dia}|${key}`)) continue; // M1: mesmo lugar no mesmo dia = um só
    itens += 1;
    if (key) sameDay.add(`${d.dia}|${key}`);
    if (m.kind !== 'reconhecido') continue;
    if (used.has(key)) continue;
    used.add(key);
    reconhecidos += 1;
    if (first && closedWeekdayOf({ id: m.item.id }, format(addDays(first, d.dia - 1), 'yyyy-MM-dd')) !== null) fechado += 1;
  }
  const origem = typeof p.origem === 'string' && p.origem.trim() ? ` · saindo de ${p.origem.trim()}` : '';
  const lines = [
    `Importar roteiro · ${p.destino ?? '—'} · ${ddmm(p.data_ida)} → ${ddmm(p.data_volta)} · ${describeTravelers(p)}${origem}`,
    `${days.length} dias · ${itens} itens · ${reconhecidos} reconhecidos no catálogo KINU · ${itens - reconhecidos} do seu roteiro`,
  ];
  if (fechado > 0) lines.push(`${fechado} em dia fechado`);
  if (cut) lines.push(`roteiro cortado em ${AGENT_IMPORT_LIMITS.itens} itens`);
  return { lines, cut };
}

export type AgentImportOutcome =
  | { ok: true; trip: StoredTrip; resumo: ImportSummary; cut: boolean; city: string }
  | { ok: false; kind: 'fora_da_lista'; message: string }
  | { ok: false; kind: 'dados_incompletos'; message: string }
  | { ok: false; kind: 'erro'; message: string };

/** Handler puro: recusa fora da lista ANTES de qualquer casamento; erro tipado → nada criado. */
export async function buildAgentImport(p: ImportAgentParams, homeCity: unknown, deps: DraftTripDeps = {}): Promise<AgentImportOutcome> {
  const destino = String(p.destino ?? '').trim();
  if (!agentCity(destino)) {
    return {
      ok: false, kind: 'fora_da_lista',
      message: `Ainda não tenho catálogo de ${destino || 'essa cidade'}, então a importação não está disponível para ela. As mais próximas do catálogo verificado: ${nearestCatalogCities(destino).join(', ')}. Quer seguir com uma delas?`,
    };
  }
  const plan = planFromAgent(p, homeCity);
  if (!plan) return { ok: false, kind: 'dados_incompletos', message: 'Não consegui montar essa viagem — dados incompletos.' };
  const { days, cut } = normalizeImportDays(p.dias);
  const r: ImportResult = await buildImportedDraft(plan.input, days, deps);
  if ('erro' in r) return { ok: false, kind: 'erro', message: r.erro.message };
  const stored = finishFlowTrip(r.trip as unknown as StoredTrip, {
    cap: plan.cap, children: plan.children, originSource: plan.origin.source, createdVia: 'kinu',
  });
  return { ok: true, trip: stored, resumo: r.resumo, cut, city: plan.input.destinationCity };
}
