import { useEffect, useState } from 'react';
import { runSmokeMatrix, runSmokeScenario, SMOKE_SCENARIOS, summarizeSmoke, summarizeR19, type SmokeRow } from '@/lib/smokeMatrix';

const STATUS_CLASS: Record<string, string> = {
  PASS: 'text-primary',
  WARN: 'text-amber-400',
  SKIP: 'text-muted-foreground',
  FAIL: 'text-destructive',
};

/** R13–R16 (+ R19 sequência do dia, à parte) nas 63 viagens (21 cidades × 3 perfis) montadas por buildDraftTrip. */
export function PlanRulesMatrix() {
  const [rows, setRows] = useState<SmokeRow[] | null>(null);
  useEffect(() => {
    let alive = true;
    // M6c+: os cenários nomeados (SMOKE_SCENARIOS) entram como linhas iguais às da matriz.
    runSmokeMatrix().then(async (r) => {
      const extra: SmokeRow[] = [];
      for (const sc of SMOKE_SCENARIOS) extra.push(await runSmokeScenario(sc));
      if (alive) setRows([...r, ...extra]);
    });
    return () => { alive = false; };
  }, []);

  if (!rows) return <section className="text-sm text-muted-foreground">R13–R16: montando {63 + SMOKE_SCENARIOS.length} viagens…</section>;
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">R13–R16 · 63 viagens + {SMOKE_SCENARIOS.length} cenários</h2>
      <p className="font-mono text-xs" data-testid="plan-rules-summary">{summarizeSmoke(rows)}</p>
      <p className="font-mono text-xs" data-testid="plan-rules-r19">{summarizeR19(rows)}</p>
      <div className="max-h-96 overflow-auto rounded border border-border text-xs">
        <table className="w-full">
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.city}-${r.profile}`} className="border-b border-border align-top">
                <td className="p-1 whitespace-nowrap">{r.city}</td>
                <td className="p-1 whitespace-nowrap">{r.profile}</td>
                {r.error ? <td className="p-1 text-destructive" colSpan={5}>{r.error}</td> : [...r.results, ...(r.r19 ? [r.r19] : [])].map((x) => (
                  <td key={x.rule} className="p-1">
                    <span className={STATUS_CLASS[x.status]}>{x.status}</span> <span className="text-muted-foreground">{x.detail}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
