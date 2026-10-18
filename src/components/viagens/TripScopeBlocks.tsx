// Blocos das abas Financeiro e Preparação que dependem do recorte da viagem (C.5a).
// Ícone · título · uma linha · ação; o detalhe fica colapsado.
import { useState } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { EnhancedExchangeRates } from '@/components/cockpit/EnhancedExchangeRates';
import { isDomesticTrip } from '@/lib/tripScope';
import type { ChecklistItem } from '@/types/trip';

type TripLike = Parameters<typeof isDomesticTrip>[0];

/** Câmbio só existe em viagem internacional — e chega fechado numa linha. */
export function CambioBlock({ trip, destinationCurrency }: { trip: TripLike; destinationCurrency: string }) {
  if (isDomesticTrip(trip)) return null;
  return (
    <EnhancedExchangeRates
      destinationCurrency={destinationCurrency}
      baseCurrency="BRL"
      budgetBRL={Number((trip as { budget?: number })?.budget) || 0}
      collapsible
    />
  );
}

const CATEGORY_ORDER = ['documentos', 'reservas', 'packing', 'pre-viagem'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  documentos: '📄 Documentos',
  reservas: '🎫 Reservas',
  packing: '🧳 Packing',
  'pre-viagem': '✈️ Pré-Viagem',
};

/** Um bloco por categoria com "2/4" na linha; abre só o primeiro incompleto. */
export function ChecklistBlocks({ items, onToggle }: { items: ChecklistItem[]; onToggle: (id: string) => void }) {
  const groups = CATEGORY_ORDER
    .map((category) => ({ category, items: items.filter((i) => i.category === category) }))
    .filter((g) => g.items.length > 0);
  const firstIncomplete = groups.find((g) => g.items.some((i) => !i.checked))?.category ?? null;
  const [openCategory, setOpenCategory] = useState<string | null>(firstIncomplete);

  return (
    <div className="space-y-2">
      {groups.map(({ category, items: groupItems }) => {
        const done = groupItems.filter((i) => i.checked).length;
        const open = openCategory === category;
        return (
          <div key={category} className="bg-[#1e293b] border border-[#334155] rounded-2xl">
            <button
              onClick={() => setOpenCategory(open ? null : category)}
              aria-expanded={open}
              className="w-full flex items-center gap-2 p-4 text-left"
            >
              <span className="font-semibold text-[#f8fafc] font-['Outfit'] flex-1">{CATEGORY_LABELS[category]}</span>
              <span className={`text-xs font-medium ${done === groupItems.length ? 'text-[#10b981]' : 'text-[#94a3b8]'}`}>
                {done}/{groupItems.length}
              </span>
              <ChevronRight size={14} className={`text-[#94a3b8] transition-transform ${open ? 'rotate-90' : ''}`} />
            </button>
            {open && (
              <div className="space-y-2 px-4 pb-4">
                {groupItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onToggle(item.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      item.checked ? 'bg-[#10b981]/10' : 'bg-[#0f172a]'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      item.checked ? 'bg-[#10b981] border-[#10b981]' : 'border-[#334155]'
                    }`}>
                      {item.checked && <Check size={14} className="text-white" />}
                    </div>
                    <span className={`text-sm font-['Plus_Jakarta_Sans'] ${
                      item.checked ? 'text-[#94a3b8] line-through' : 'text-[#f8fafc]'
                    }`}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
