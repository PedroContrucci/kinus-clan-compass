import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { kinuBeta } from '@/integrations/kinu-beta/client';
import { cn } from '@/lib/utils';

type Key = 'total' | 'hoteis' | 'familia' | 'gastro' | 'cultura' | 'arte' | 'praia' | 'natureza' | 'noite' | 'compras' | 'romantico' | 'aventura' | 'relax' | 'bate_volta' | 'cafe' | 'almoco' | 'jantar' | 'passeios' | 'cat_noite';
type CatRow = { city: string } & Record<Key, number>;
type Col = { key: Key; label: string };
type Band = 'red' | 'amber' | 'green' | 'na';

const WIZARD: Col[] = [
  { key: 'familia', label: 'Família' }, { key: 'gastro', label: 'Gastronomia' }, { key: 'cultura', label: 'Cultura' }, { key: 'praia', label: 'Praia' },
  { key: 'natureza', label: 'Natureza' }, { key: 'noite', label: 'Noite' }, { key: 'compras', label: 'Compras' }, { key: 'romantico', label: 'Romântico' },
];
const SECONDARY: Col[] = [{ key: 'arte', label: 'Arte' }, { key: 'aventura', label: 'Aventura' }, { key: 'relax', label: 'Relax' }, { key: 'bate_volta', label: 'Bate-volta' }];
const MOMENTO: Col[] = [{ key: 'cafe', label: 'Café' }, { key: 'almoco', label: 'Almoço' }, { key: 'jantar', label: 'Jantar' }, { key: 'passeios', label: 'Passeios' }, { key: 'cat_noite', label: 'Noite' }];

const NO_BEACH = new Set(['Bangkok', 'Buenos Aires', 'Gramado', 'Londres', 'Marrakech', 'Orlando', 'Paris', 'Tokyo']);

// [red abaixo de, green a partir de]
const LIMITS: Partial<Record<Key, [number, number]>> = { cafe: [4, 6], almoco: [4, 6], jantar: [4, 6], cat_noite: [4, 6], passeios: [16, 24] };

export function bandOf(row: CatRow, key: Key): Band {
  if (key === 'praia' && NO_BEACH.has(row.city)) return 'na';
  const [red, green] = LIMITS[key] ?? [5, 8];
  const value = Number(row[key]) || 0;
  return value < red ? 'red' : value < green ? 'amber' : 'green';
}

const bandClass: Record<Band, string> = {
  red: 'bg-destructive/20 text-destructive',
  amber: 'bg-[hsl(var(--kinu-gold))]/20 text-[hsl(var(--kinu-gold))]',
  green: 'bg-primary/20 text-primary',
  na: 'text-muted-foreground',
};

const cardClass = 'min-w-0 rounded-xl border border-border bg-card';
const rowClass = 'h-auto min-h-[44px] w-full justify-start gap-2 rounded-xl px-3 py-3 text-left hover:bg-muted/30 sm:px-4';

function Block({ title, summary, initialOpen = false, children }: { title: string; summary: string; initialOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(initialOpen);
  return <Collapsible open={open} onOpenChange={setOpen} className={cardClass}>
    <CollapsibleTrigger asChild>
      <Button variant="ghost" className={rowClass} aria-label={title}>
        <span className="shrink-0 font-['Outfit'] font-semibold">{title}</span>
        <span className="min-w-0 truncate text-xs font-normal text-muted-foreground" title={summary}>{summary}</span>
        <ChevronDown aria-hidden="true" className={cn('ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none', open && 'rotate-180')} />
      </Button>
    </CollapsibleTrigger>
    <CollapsibleContent><div className="border-t border-border px-3 py-3 sm:px-4">{children}</div></CollapsibleContent>
  </Collapsible>;
}

const holesIn = (row: CatRow, cols: Col[]) => cols.filter(c => bandOf(row, c.key) === 'red').length;

function HeatTable({ rows, cols }: { rows: CatRow[]; cols: Col[] }) {
  const [sort, setSort] = useState<{ key: Key | 'buracos' | 'city'; dir: 'desc' | 'asc' }>({ key: 'total', dir: 'desc' });
  const sorted = useMemo(() => {
    const val = (r: CatRow) => sort.key === 'buracos' ? holesIn(r, cols) : sort.key === 'city' ? 0 : Number(r[sort.key]) || 0;
    return [...rows].sort((a, b) => {
      if (sort.key === 'city') return sort.dir === 'asc' ? a.city.localeCompare(b.city) : b.city.localeCompare(a.city);
      return sort.dir === 'desc' ? val(b) - val(a) : val(a) - val(b);
    });
  }, [rows, cols, sort]);
  const click = (key: typeof sort.key) => setSort(s => s.key === key ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: 'desc' });
  const header = (key: typeof sort.key, label: string, sticky = false) => <th key={key} scope="col" aria-sort={sort.key === key ? (sort.dir === 'desc' ? 'descending' : 'ascending') : 'none'} className={cn('whitespace-nowrap p-0 font-medium', sticky && 'sticky left-0 z-10 bg-card')}>
    <button type="button" onClick={() => click(key)} className={cn('min-h-[36px] px-2 text-left hover:text-foreground', sort.key === key && 'text-foreground')}>{label}{sort.key === key ? (sort.dir === 'desc' ? ' ↓' : ' ↑') : ''}</button>
  </th>;
  return <div className="overflow-x-auto"><table className="w-full border-separate border-spacing-0.5 text-xs">
    <thead className="text-muted-foreground"><tr>{header('city', 'Cidade', true)}{header('total', 'Total')}{cols.map(c => header(c.key, c.label))}{header('buracos', 'Buracos')}</tr></thead>
    <tbody>
      {sorted.map(r => <tr key={r.city}>
        <th scope="row" className="sticky left-0 z-10 whitespace-nowrap bg-card px-2 py-1.5 text-left font-medium">{r.city}</th>
        <td className="px-2 py-1.5 tabular-nums">{r.total}</td>
        {cols.map(c => { const b = bandOf(r, c.key); return <td key={c.key} className={cn('rounded px-2 py-1.5 text-center tabular-nums', bandClass[b])}>{b === 'na' ? '—' : r[c.key]}</td>; })}
        <td className="px-2 py-1.5 text-center tabular-nums">{holesIn(r, cols)}</td>
      </tr>)}
      <tr className="text-muted-foreground">
        <th scope="row" className="sticky left-0 z-10 whitespace-nowrap bg-card px-2 py-1.5 text-left font-medium">Buracos por coluna</th>
        <td />
        {cols.map(c => <td key={c.key} className="px-2 py-1.5 text-center tabular-nums">{rows.filter(r => bandOf(r, c.key) === 'red').length}</td>)}
        <td className="px-2 py-1.5 text-center tabular-nums">{rows.reduce((s, r) => s + holesIn(r, cols), 0)}</td>
      </tr>
    </tbody>
  </table></div>;
}

export default function CatalogoTab() {
  const [rows, setRows] = useState<CatRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void (async () => {
      const { data, error } = await (kinuBeta.rpc as unknown as (fn: string) => Promise<{ data: unknown; error: unknown }>)('onda_catalogo');
      if (!active) return;
      if (error) { setError('Não foi possível carregar o catálogo. Tente novamente.'); return; }
      setRows(((data ?? []) as CatRow[]).map(r => ({ ...r, city: String(r.city) })));
    })();
    return () => { active = false; };
  }, []);

  if (error) return <p role="alert" className="text-sm text-destructive">{error}</p>;
  if (!rows) return <div className="flex justify-center py-12" role="status" aria-label="Carregando catálogo"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const sum = (k: Key) => rows.reduce((s, r) => s + (Number(r[k]) || 0), 0);
  const mainCells = rows.flatMap(r => WIZARD.map(c => bandOf(r, c.key))).filter(b => b !== 'na');
  const holes = mainCells.filter(b => b === 'red').length;
  const covered = mainCells.length ? Math.round(mainCells.filter(b => b === 'green').length / mainCells.length * 100) : 0;
  const tiles = [['Atividades', sum('total')], ['Hotéis', sum('hoteis')], ['Destinos', rows.length], ['Buracos', holes], ['Cobertos ≥ 8', `${covered}%`]] as const;

  const byInterest = WIZARD.map(c => ({ label: c.label, cities: rows.filter(r => bandOf(r, c.key) === 'red').map(r => `${r.city} (${r[c.key]})`) })).filter(x => x.cities.length).sort((a, b) => b.cities.length - a.cities.length);
  const byCity = rows.map(r => ({ label: r.city, cities: WIZARD.filter(c => bandOf(r, c.key) === 'red').map(c => `${c.label} (${r[c.key]})`) })).filter(x => x.cities.length).sort((a, b) => b.cities.length - a.cities.length);
  const list = (items: typeof byInterest) => items.length ? <ul className="space-y-1">{items.map(i => <li key={i.label} className="text-xs"><span className="font-semibold">{i.label} · {i.cities.length}:</span> <span className="text-muted-foreground">{i.cities.join(', ')}</span></li>)}</ul> : <p className="text-xs text-muted-foreground">Nenhum buraco.</p>;

  return <div className="space-y-3">
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {tiles.map(([label, value]) => <div key={label} className={cn(cardClass, 'px-3 py-2')}><p className="truncate text-xs text-muted-foreground">{label}</p><p className="font-['Outfit'] text-xl font-semibold tabular-nums">{value}</p></div>)}
    </div>
    <p className="text-xs text-muted-foreground"><span className="text-destructive">vermelho</span> = buraco (&lt; 5) · <span className="text-[hsl(var(--kinu-gold))]">âmbar</span> = fino (5–7, o app já oferece) · <span className="text-primary">verde</span> = coberto (≥ 8) · — = não se aplica</p>
    <Block title="Interesses do wizard" summary={`${holes} buracos`} initialOpen><HeatTable rows={rows} cols={WIZARD} /></Block>
    <Block title="Buracos" summary={`${byInterest.length} interesses · ${byCity.length} cidades`}>
      <div className="space-y-3"><div><p className="mb-1 text-xs font-medium text-muted-foreground">Por interesse</p>{list(byInterest)}</div><div><p className="mb-1 text-xs font-medium text-muted-foreground">Por cidade</p>{list(byCity)}</div></div>
    </Block>
    <Block title="Secundários" summary={SECONDARY.map(c => c.label).join(' · ')}><HeatTable rows={rows} cols={SECONDARY} /></Block>
    <Block title="Momento do dia" summary={MOMENTO.map(c => c.label).join(' · ')}><HeatTable rows={rows} cols={MOMENTO} /></Block>
  </div>;
}
