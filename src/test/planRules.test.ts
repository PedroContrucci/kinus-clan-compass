import { describe, it, expect } from 'vitest';
import { runSmokeCase, runSmokeMatrix, summarizeSmoke, SMOKE_PROFILES, type SmokeProfile } from '@/lib/smokeMatrix';

const route = async () => null; // sem rede: preço genérico de tier
const FROM = new Date(2026, 10, 10);
const p = (id: string) => SMOKE_PROFILES.find((x) => x.id === id) as SmokeProfile;
const CASES: [string, SmokeProfile][] = [
  ['Fortaleza', p('gastro-cultura')],
  ['Cartagena', p('gastro-cultura')],
  ['Lisboa', p('gastro-cultura')],
  ['Tóquio', p('gastro-cultura')],
  ['Gramado', p('praia-familia')],
  ['Rio de Janeiro', p('cultura-aventura')],
];
const RULES = ['R13 PRIORIDADE', 'R14 MICHELIN', 'R15 GEO', 'R16 TEMPO'];

function assertStructured(row: Awaited<ReturnType<typeof runSmokeCase>>) {
  expect(row.error).toBeUndefined();
  expect(row.results.map((r) => r.rule)).toEqual(RULES);
  for (const r of row.results) {
    expect(['PASS', 'WARN', 'SKIP']).toContain(r.status);
    expect(typeof r.detail).toBe('string');
    expect(r.detail.length).toBeGreaterThan(0);
  }
}

describe('R13–R16 — resultado estruturado (não exige PASS)', () => {
  for (const [city, prof] of CASES) {
    it(`${city} · ${prof.label}`, async () => {
      assertStructured(await runSmokeCase(city, prof, FROM, { routeLookup: route }));
    });
  }

  it('Gramado ignora praia (interestsFor) — R13 mede só o que a cidade oferece', async () => {
    const row = await runSmokeCase('Gramado', p('praia-familia'), FROM, { routeLookup: route });
    expect(row.interestsUsed).not.toContain('beach');
  });

  it.runIf(process.env.SMOKE_FULL === '1')('matriz completa 63', async () => {
    const rows = await runSmokeMatrix({ routeLookup: route }, FROM);
    expect(rows).toHaveLength(63);
    rows.forEach(assertStructured);
    console.log('SMOKE SUMMARY:', summarizeSmoke(rows));
  }, 120_000);
});
