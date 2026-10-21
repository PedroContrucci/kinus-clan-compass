// C.6 — o agente sempre sabe o que a pessoa tem na conta.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildAccountPayload,
  tripChoiceFromMessage,
  tripChipLabel,
  NO_TRIP,
} from '@/contexts/KinuAIContext';
import type { StoredTrip } from '@/lib/tripStore';
import {
  sanitizeAccount,
  accountGate,
  ACCOUNT_RULES,
  ACCOUNT_FALLBACK,
  MAX_ACCOUNT_TRIPS,
} from '../../supabase/functions/kinu-ai/account';

const trip = (over: Partial<StoredTrip>): StoredTrip => ({
  id: 'x', status: 'active', destination: 'Fortaleza', country: 'Brasil', emoji: '🏖️',
  startDate: '2026-11-10', endDate: '2026-11-15', budget: 6000, budgetType: 'total',
  travelers: 2, priorities: [], progress: 0, days: [],
  ...over,
} as StoredTrip);

const fortaleza = trip({ id: 'trip-for', accommodation: { name: 'Hotel Gran Marquise' } as never });
const lisboa = trip({ id: 'trip-lis', status: 'draft', destination: 'Lisboa', startDate: '2027-03-02', endDate: '2027-03-09' });

describe('C.6 front — account em toda chamada', () => {
  it('(a) 2 viagens, sem activeTripId', () => {
    const acc = buildAccountPayload([fortaleza, lisboa], { profileName: 'Ana' });
    expect(acc.trips.map((t) => t.destination)).toEqual(['Fortaleza', 'Lisboa']);
    expect(acc.trips[1].status).toBe('draft');
    expect(acc.trips[0].dates).toEqual({ start: '2026-11-10', end: '2026-11-15' });
    expect(acc).not.toHaveProperty('activeTripId');
    expect(acc.profile.name).toBe('Ana');
  });

  it('(b) 1 viagem → activeTripId ausente, trips[0] presente com resumo do gravado', () => {
    const acc = buildAccountPayload([fortaleza], {});
    expect(acc).not.toHaveProperty('activeTripId');
    expect(acc.trips[0].id).toBe('trip-for');
    expect(acc.trips[0].summary).toContain('Hotel Gran Marquise');
  });

  it('activeTripId só da viagem aberta ou da escolha; origem só se não assumida', () => {
    expect(buildAccountPayload([fortaleza, lisboa], { openTripId: 'trip-lis' }).activeTripId).toBe('trip-lis');
    expect(buildAccountPayload([fortaleza, lisboa], { chosenTripId: NO_TRIP }).activeTripId).toBe(NO_TRIP);
    expect(buildAccountPayload([trip({ origin: 'São Paulo', originSource: 'default' })], {}).profile.origin).toBeUndefined();
    expect(buildAccountPayload([trip({ origin: 'Recife', originSource: 'profile' })], {}).profile.origin).toBe('Recife');
  });

  it("escolha digitada: destino → id; 'geral'/'nenhuma' → NO_TRIP; ambíguo → null", () => {
    const ts = [fortaleza, lisboa];
    expect(tripChoiceFromMessage('a de lisboa', ts)).toBe('trip-lis');
    expect(tripChoiceFromMessage('Geral', ts)).toBe(NO_TRIP);
    expect(tripChoiceFromMessage('nenhuma delas', ts)).toBe(NO_TRIP);
    expect(tripChoiceFromMessage('qual é mais barata?', ts)).toBeNull();
    expect(tripChipLabel(fortaleza)).toBe('Fortaleza 10–15/nov');
  });

  it('C.10.1: viagem da conta › cidade do catálogo fora da conta → NO_TRIP › sem cidade → null', () => {
    const ts = [fortaleza, lisboa];
    expect(tripChoiceFromMessage('quero ir pra Milão', ts)).toBe(NO_TRIP);
    expect(tripChoiceFromMessage('quero ir pra milao', ts)).toBe(NO_TRIP);
    expect(tripChoiceFromMessage('qual o clima?', ts)).toBeNull();
    expect(tripChoiceFromMessage('clima em Fortaleza', ts)).toBe('trip-for');
    expect(tripChoiceFromMessage('estou num clima romântico', ts)).toBeNull();
    expect(tripChipLabel(lisboa)).toBe('Lisboa (rascunho)');
  });
});

describe('C.6 function — regra de escolha (account.ts)', () => {
  const two = sanitizeAccount(buildAccountPayload([fortaleza, lisboa], {}));

  it('(c) 2 trips sem activeTripId → lista as duas e pergunta, sem chamar o modelo', () => {
    const g = accountGate(two, { hasOpenTrip: false, isEmergency: false });
    expect(g.reply).toContain('Fortaleza · 10–15/nov · ativa');
    expect(g.reply).toContain('Lisboa · 02–09/mar · rascunho');
    expect(g.reply).toMatch(/Sobre qual delas é a pergunta\? \(ou diga 'geral' para uma pergunta sem viagem\)$/);
  });

  it("'geral' → modo genérico sem perguntar de novo; emergência sempre passa", () => {
    const geral = accountGate(sanitizeAccount({ ...buildAccountPayload([fortaleza, lisboa], {}), activeTripId: NO_TRIP }), { hasOpenTrip: false, isEmergency: false });
    expect(geral.reply).toBeUndefined();
    expect(geral.block).toContain('pergunta GERAL');
    const emerg = accountGate(two, { hasOpenTrip: false, isEmergency: true });
    expect(emerg.reply).toBeUndefined();
    expect(emerg.block).toContain('emergência');
  });

  it('1 trip → foco nomeado na 1ª frase; 0 → genérico + criar; escolhida → foco nela', () => {
    const one = accountGate(sanitizeAccount(buildAccountPayload([fortaleza], {})), { hasOpenTrip: false, isEmergency: false });
    expect(one.reply).toBeUndefined();
    expect(one.block).toContain('Sobre sua viagem a Fortaleza, 10–15/nov');
    const zero = accountGate(sanitizeAccount(buildAccountPayload([], {})), { hasOpenTrip: false, isEmergency: false });
    expect(zero.block).toContain('ofereça criar uma viagem');
    const picked = accountGate(sanitizeAccount(buildAccountPayload([fortaleza, lisboa], { chosenTripId: 'trip-lis' })), { hasOpenTrip: false, isEmergency: false });
    expect(picked.block).toContain('EM FOCO: Lisboa');
    expect(accountGate(null, { hasOpenTrip: false, isEmergency: false })).toEqual({ block: '' });
  });

  it('sanitizeAccount limita e descarta lixo', () => {
    const acc = sanitizeAccount({
      profile: { name: '<b>Ana</b>'.repeat(40) },
      trips: Array.from({ length: 20 }, (_, i) => ({ id: `t${i}`, destination: 'Roma', dates: { start: 'ontem', end: '2026-01-02' }, travelers: 999, status: 'hack' })),
      activeTripId: 'inexistente',
    })!;
    expect(acc.trips).toHaveLength(MAX_ACCOUNT_TRIPS);
    expect(acc.trips[0]).toMatchObject({ start: '', end: '2026-01-02', travelers: null, status: 'active' });
    expect(acc.profile.name).not.toMatch(/[<>]/);
    expect(acc.profile.name.length).toBeLessThanOrEqual(60);
    expect(acc.activeTripId).toBe('');
  });

  it('(d) o prompt de sistema contém a proibição e o fallback, e o index.ts o concatena', () => {
    expect(ACCOUNT_RULES).toContain('É PROIBIDO dar instrução de troubleshooting do app');
    expect(ACCOUNT_RULES).toContain('feche e reabra');
    expect(ACCOUNT_RULES).toContain('acesse o roteiro direto');
    expect(ACCOUNT_FALLBACK).toBe('Não tenho os detalhes dessa viagem carregados aqui.');
    expect(ACCOUNT_RULES).toContain(ACCOUNT_FALLBACK);
    const index = readFileSync(resolve(__dirname, '../../supabase/functions/kinu-ai/index.ts'), 'utf8');
    expect(index).toContain('import { sanitizeAccount, accountGate, ACCOUNT_RULES } from "./account.ts"');
    expect(index).toMatch(/KINU_SYSTEM_PROMPT\.replace\([^)]*\) \+ ACCOUNT_RULES/);
    expect(index).toContain('if (gate.reply)');
  });
});
