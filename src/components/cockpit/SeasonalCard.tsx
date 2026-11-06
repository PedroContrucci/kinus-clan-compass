// M18a — Card colapsável "Nesta época" no Painel. Fechado por padrão; sem dado = não renderiza.
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { seasonalForTrip, monthName } from '@/lib/seasonal';

const Lista = ({ title, items }: { title: string; items: string[] }) =>
  items.length === 0 ? null : (
    <div className="mt-2">
      <p className="text-xs font-semibold text-foreground">{title}</p>
      <ul className="mt-1 space-y-1 text-xs text-muted-foreground list-disc pl-4">
        {items.map((t) => <li key={t}>{t}</li>)}
      </ul>
    </div>
  );

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SeasonalCard = ({ trip }: { trip: any }) => {
  const [open, setOpen] = useState(false);
  const notes = seasonalForTrip(trip ?? {});
  if (notes.length === 0) return null;
  return (
    <Collapsible open={open} onOpenChange={setOpen} data-testid="painel-seasonal">
      <CollapsibleTrigger className="w-full flex items-center justify-between py-3 px-4 bg-card border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors">
        <span className="flex items-center gap-2"><span>🗓️</span><span>Nesta época</span></span>
        <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 bg-card border border-border rounded-2xl p-4 space-y-4">
        {notes.map((n) => (
          <section key={n.month} data-testid={`painel-seasonal-${n.month}`}>
            {notes.length > 1 && <h4 className="text-sm font-semibold text-foreground font-['Outfit'] capitalize">{monthName(n.month)}</h4>}
            <p className="text-xs text-muted-foreground mt-1">{n.climate}</p>
            <Lista title="Fechamentos" items={n.closures} />
            <Lista title="Acontece" items={n.events} />
            <Lista title="Dicas" items={n.tips} />
          </section>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};
