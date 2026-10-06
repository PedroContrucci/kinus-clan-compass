import { useEffect, useState } from 'react';
import { runSmokeMatrix, summarizeSmoke, type SmokeRow } from '@/lib/smokeMatrix';

const STATUS_CLASS: Record<string, string> = {
  PASS: 'text-primary',
  WARN: 'text-amber-400',
  SKIP: 'text-muted-foreground',
};

/** R13–R16 nas 63 viagens (21 cidades × 3 perfis) montadas por buildDraftTrip. */
export function PlanRulesMatrix() {
  const [rows, setRows] = useState<SmokeRow[] | null>(null);
  useEffect(() => {
    let alive = true;
    runSmokeMatrix().then((r) => { if (alive) setRows(r); });
    return () => { alive = false; };
  }, []);

  if (!rows) return <section className="text-sm text-muted-foreground">R13–R16: montando 63 viagens…</section>;
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">R13–R16 · 63 viagens</h2>
      <p className="font-mono text-xs" data-testid="plan-rules-summary">{summarizeSmoke(rows)}</p>
      <div className="max-h-96 overflow-auto rounded border border-border text-xs">
        <table className="w-full">
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.city}-${r.profile}`} className="border-b border-border align-top">
                <td className="p-1 whitespace-nowrap">{r.city}</td>
                <td className="p-1 whitespace-nowrap">{r.profile}</td>
                {r.error ? <td className="p-1 text-destructive" colSpan={4}>{r.error}</td> : r.results.map((x) => (
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
