import { describe, it, expect } from 'vitest';
import { validateDaySequence, type PlanDay, type PlanRulesContext } from '@/lib/itineraryValidator';
import { runSmokeMatrix, summarizeR19 } from '@/lib/smokeMatrix';

// Ids sintéticos (fora do catálogo): duração vem do campo `duration`, sem coords.
const ctx = (over: Partial<PlanRulesContext> = {}): PlanRulesContext => ({
  destination: 'Fortaleza', interests: [], domestic: true, returnDepartureTime: '14:00', ...over,
});
const day = (n: number, activities: PlanDay['activities']): PlanDay => ({ day: n, date: '2026-11-12', title: 'Exploração', activities });
const mid = (acts: PlanDay['activities']) => [day(1, []), day(2, acts), day(3, [])];

describe('R19 — sequência do dia', () => {
  it('item de 5 h às 10:00 com almoço às 13:00 → FAIL de sobreposição, causa (a)', () => {
    const r = validateDaySequence(mid([
      { id: 'x-praia', name: 'Dia de praia', time: '10:00', duration: '5h', timeSlot: 'morning' },
      { id: 'x-almoco', name: 'Almoço', time: '13:00', duration: '1.5h', timeSlot: 'lunch' },
    ]), ctx());
    const d2 = r.days[1];
    expect(d2.status).toBe('FAIL');
    expect(d2.issues[0]).toMatchObject({ kind: 'overlap', cause: 'a' });
    expect(d2.issues[0].text).toBe('Fortaleza D2: Dia de praia 10:00–15:00 × Almoço 13:00');
    expect(r.status).toBe('FAIL');
  });

  it('sequência limpa → PASS', () => {
    const r = validateDaySequence(mid([
      { id: 'x-cafe', name: 'Café', time: '08:00', duration: '1h', timeSlot: 'breakfast' },
      { id: 'x-museu', name: 'Museu', time: '10:00', duration: '2h', timeSlot: 'morning' },
      { id: 'x-almoco', name: 'Almoço', time: '13:00', duration: '1.5h', timeSlot: 'lunch' },
      { id: 'x-jantar', name: 'Jantar', time: '19:30', timeSlot: 'dinner' },
    ]), ctx());
    expect(r.days[1]).toMatchObject({ status: 'PASS', issues: [] });
    expect(r.status).toBe('PASS');
  });

  it('café às 00:00 → FAIL pelo R19b, mesmo com volta de madrugada', () => {
    const r = validateDaySequence([day(1, []), day(2, [
      { id: 'x-cafe', name: 'Café da manhã no hotel', time: '00:00', duration: '1h', timeSlot: 'breakfast' },
    ])], ctx({ returnDepartureTime: '02:30' }));
    expect(r.days[1].issues).toEqual([expect.objectContaining({ kind: 'madrugada', cause: 'b', status: 'FAIL' })]);
  });

  it('transfer 00:30 com voo de volta 02:30 → PASS pelo R19b (madrugada legítima)', () => {
    const r = validateDaySequence([day(1, []), day(2, [
      { id: 'day-1-slot-transfer', name: 'Transfer para Aeroporto', time: '00:30', duration: '1h', timeSlot: 'afternoon', type: 'transporte' },
      { id: 'day-1-slot-flight-back', name: 'Voo de Volta', time: '02:30', duration: '3.2h', timeSlot: 'flight', type: 'voo' },
    ])], ctx({ returnDepartureTime: '02:30' }));
    expect(r.days[1]).toMatchObject({ status: 'PASS', issues: [] });
  });

  // C.4 D4: check-out e transfer são derivados do voo (R10/R11) — isentos sempre; café não.
  it('check-out 05:15 e transfer 05:45 com volta 08:30 → PASS; café 05:00 no mesmo dia segue FAIL', () => {
    const acts: PlanDay['activities'] = [
      { id: 'day-1-slot-checkout', name: 'Check-out do hotel', time: '05:15', duration: '0.5h', timeSlot: 'morning', type: 'transport' },
      { id: 'day-1-slot-transfer', name: 'Transfer para Aeroporto', time: '05:45', duration: '0.75h', timeSlot: 'afternoon', type: 'transport' },
      { id: 'day-1-slot-flight-back', name: 'Voo de Volta', time: '08:30', duration: '3.2h', timeSlot: 'flight', type: 'voo' },
    ];
    expect(validateDaySequence([day(1, []), day(2, acts)], ctx({ returnDepartureTime: '08:30' })).days[1]).toMatchObject({ status: 'PASS', issues: [] });
    const withCafe = [{ id: 'x-cafe', name: 'Café', time: '04:00', duration: '0.5h', timeSlot: 'breakfast' }, ...acts];
    const r = validateDaySequence([day(1, []), day(2, withCafe)], ctx({ returnDepartureTime: '08:30' }));
    expect(r.days[1].issues).toEqual([expect.objectContaining({ kind: 'madrugada', cause: 'b' })]);
  });

  // Aceite do C.4: R19 FAIL = 0 nas 63 viagens. SMOKE_RETURN=02:30 roda a rodada de madrugada.
  it.runIf(process.env.SMOKE_FULL === '1')(`smoke 63 — R19 sem FAIL (volta ${process.env.SMOKE_RETURN || 'padrão'})`, async () => {
    const rows = await runSmokeMatrix({ routeLookup: async () => null }, new Date(2026, 10, 10), { returnDeparture: process.env.SMOKE_RETURN || undefined });
    console.log('R19 SUMMARY:', summarizeR19(rows));
    const fails = rows.flatMap((r) => r.r19?.days.flatMap((d) => d.issues.filter((i) => i.status === 'FAIL').map((i) => i.text)) ?? []);
    expect(fails).toEqual([]);
  }, 180_000);
});
