import { useState } from 'react';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import type { TripActivity } from '@/types/trip';
import { razaoBreakdown, razaoDesembolso, razaoTotals, type RazaoLine } from '@/lib/razaoLines';
import { formatTileBRL } from '@/lib/tripScope';
import { roteiroBooking } from '@/lib/roteiroBlocks';
import { BookingAction } from '@/components/cockpit/RoteiroDia';

// C.5c — "📒 Compromissos": o livro-razão da viagem. Apresentação pura: as linhas vêm de
// razaoLines (nenhum valor calculado aqui) e as ações chamam handlers que já existem em
// Viagens.tsx (sheet de confirmar do TripPanel, OffersModal, confirmModal, aba Roteiro).

const brl = (n: number) => `R$ ${n.toLocaleString('pt-BR')}`;

interface FinanceiroRazaoProps {
  lines: RazaoLine[];
  onConfirm: (tipo: 'voo' | 'hotel') => void;
  onHotelOffers: () => void;
  onOpenDay: (dayNumber: number) => void;
  /** ☐ → o mesmo confirmModal do Roteiro. */
  onCheck: (activity: TripActivity, dayIndex: number, actIndex: number) => void;
}

const StatusMark = ({ status }: { status: RazaoLine['status'] }) =>
  status === 'confirmed' ? (
    <span className="text-[#10b981] text-xs font-semibold flex-shrink-0">✓ confirmado</span>
  ) : status === 'pending' ? (
    <span className="text-[#94a3b8] text-xs flex-shrink-0">○ a confirmar</span>
  ) : (
    <span className="text-[#64748b] text-xs flex-shrink-0">—</span>
  );

export const FinanceiroRazao = ({ lines, onConfirm, onHotelOffers, onOpenDay, onCheck }: FinanceiroRazaoProps) => {
  const [openDays, setOpenDays] = useState<Set<string>>(() => new Set());
  if (lines.length === 0) return null;
  const toggleDay = (id: string) => setOpenDays((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const btn = 'px-3 py-1.5 rounded-lg text-xs transition-colors';

  return (
    <section className="bg-[#1e293b] border border-[#334155] rounded-xl p-3">
      <h3 className="text-sm font-semibold text-[#f8fafc] font-['Outfit'] mb-2">📒 Compromissos</h3>
      <div className="divide-y divide-[#334155]">
        {lines.map((line) => {
          const day = line.day;
          const open = day ? openDays.has(line.id) : false;
          return (
            <div key={line.id} data-razao-line={line.kind} className="py-2">
              {day ? (
                <button
                  type="button"
                  onClick={() => toggleDay(line.id)}
                  aria-expanded={open}
                  className="w-full flex items-center gap-2 text-left text-sm"
                >
                  <span className="w-6 text-center flex-shrink-0">{line.icon}</span>
                  <span className="flex-1 min-w-0 truncate text-[#f8fafc] font-['Outfit']">
                    {line.title} · {day.items.length} {day.items.length === 1 ? 'item' : 'itens'} · {brl(line.value)}
                    {day.checkableCount > 0 && (
                      <span className={line.status === 'confirmed' ? 'text-[#10b981]' : 'text-[#94a3b8]'}>
                        {' '}· {day.confirmedCount}/{day.checkableCount} confirmados
                      </span>
                    )}
                  </span>
                  {open ? <ChevronDown size={16} className="text-[#94a3b8]" /> : <ChevronRight size={16} className="text-[#94a3b8]" />}
                </button>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-6 text-center flex-shrink-0">{line.icon}</span>
                  <span className="flex-1 min-w-0 truncate text-[#f8fafc] font-['Outfit']">{line.title}</span>
                  <span className={`tabular-nums font-semibold flex-shrink-0 ${line.status === 'confirmed' ? 'text-[#10b981]' : 'text-[#f8fafc]'}`}>{brl(line.value)}</span>
                </div>
              )}

              {!day && (
                <div className="flex items-center gap-2 pl-8 mt-0.5">
                  <span className="flex-1 min-w-0 truncate text-xs text-[#64748b]">{line.origin}</span>
                  <StatusMark status={line.status} />
                </div>
              )}

              {line.actions.length > 0 && (!day || open) && (
                <div className="flex gap-2 flex-wrap pl-8 mt-2">
                  {line.actions.includes('confirmar') && line.confirmTipo && (
                    <button type="button" onClick={() => onConfirm(line.confirmTipo!)} className={`${btn} bg-[#10b981] text-white hover:bg-[#10b981]/80 flex items-center gap-1`}>
                      <Check size={12} /> Confirmar
                    </button>
                  )}
                  {line.actions.includes('parceiro') && line.partnerUrl && (
                    <a href={line.partnerUrl} target="_blank" rel="noopener noreferrer" className={`${btn} bg-[#0f172a] border border-[#334155] text-[#f8fafc] hover:border-[#10b981]/50`}>
                      Reservar com parceiro ▸
                    </a>
                  )}
                  {line.actions.includes('ofertas') && (
                    <button type="button" onClick={onHotelOffers} className={`${btn} bg-[#0f172a] border border-[#334155] text-[#f8fafc] hover:border-[#10b981]/50`}>
                      Buscar ofertas ▸
                    </button>
                  )}
                  {line.actions.includes('roteiro') && day && (
                    <button type="button" onClick={() => onOpenDay(day.dayNumber)} className={`${btn} text-[#0ea5e9] hover:underline`}>
                      ver no Roteiro ▸
                    </button>
                  )}
                </div>
              )}

              {day && open && (
                <div className="pl-8 mt-2 space-y-1">
                  <p className="text-xs text-[#64748b]">{line.origin}</p>
                  {day.items.map((it) => (
                    <div key={it.activity.id} className="flex items-center gap-2 text-sm">
                      {it.checkable ? (
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={it.confirmed}
                          aria-label={it.confirmed ? `${it.activity.name}: confirmado` : `Confirmar ${it.activity.name}`}
                          disabled={it.confirmed}
                          onClick={() => onCheck(it.activity, day.dayIndex, it.actIndex)}
                          className={`w-5 h-5 flex-shrink-0 rounded border flex items-center justify-center ${
                            it.confirmed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[#475569] hover:border-[#10b981]'
                          }`}
                        >
                          {it.confirmed && <Check size={12} />}
                        </button>
                      ) : (
                        <span className="w-5 flex-shrink-0 text-center text-xs" aria-label="Logística">🚕</span>
                      )}
                      <span className="flex-1 min-w-0 truncate text-[#cbd5e1]">{it.activity.name}</span>
                      {/* C.5d: só o botão (Ligar/Reservar); o texto de como fechar fica no Roteiro. */}
                      <BookingAction booking={roteiroBooking(it.activity)} className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] flex-shrink-0" />
                      <span className={`tabular-nums text-xs flex-shrink-0 ${it.confirmed ? 'text-[#10b981]' : 'text-[#94a3b8]'}`}>
                        {it.value > 0 ? (it.confirmed ? `✓ ${brl(it.value)}` : `~${brl(it.value)}`) : it.confirmed ? '✓' : 'Grátis'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

type TileKey = 'orcamento' | 'planejado' | 'confirmado' | 'disponivel';

interface FinanceiroTilesProps {
  budget: number;
  lines: RazaoLine[];
  /** Orçamento → o Dialog de edição que já existe em Viagens.tsx. */
  onEditBudget: () => void;
}

/** C.5d — os 4 tiles como botões; Planejado/Confirmado/Disponível abrem a quebra (um por vez). */
export const FinanceiroTiles = ({ budget, lines, onEditBudget }: FinanceiroTilesProps) => {
  const [open, setOpen] = useState<TileKey | null>(null);
  const { planned, confirmed } = razaoTotals(lines);
  const available = budget - planned - confirmed;
  const reserve = lines.find((l) => l.kind === 'reserva')?.value ?? 0;
  const toggle = (k: TileKey) => setOpen((cur) => (cur === k ? null : k));
  const tiles: { key: TileKey; label: string; value: number; color: string }[] = [
    { key: 'orcamento', label: 'Orçamento', value: budget, color: 'text-[#f8fafc]' },
    { key: 'planejado', label: 'Planejado (a confirmar)', value: planned, color: 'text-[#eab308]' },
    { key: 'confirmado', label: 'Confirmado', value: confirmed, color: 'text-[#10b981]' },
    { key: 'disponivel', label: 'Disponível', value: available, color: available >= 0 ? 'text-[#0ea5e9]' : 'text-red-500' },
  ];
  const breakdown = open === 'planejado' || open === 'confirmado'
    ? razaoBreakdown(lines, open === 'planejado' ? 'planned' : 'confirmed')
    : null;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <button
            key={t.key}
            type="button"
            data-tile={t.key}
            onClick={() => (t.key === 'orcamento' ? onEditBudget() : toggle(t.key))}
            aria-expanded={t.key === 'orcamento' ? undefined : open === t.key}
            aria-label={t.key === 'orcamento' ? 'Editar orçamento' : undefined}
            className={`bg-[#1e293b] border rounded-xl p-3 text-center transition-colors hover:border-[#475569] ${open === t.key ? 'border-[#64748b]' : 'border-[#334155]'}`}
          >
            <p className="text-xs text-[#94a3b8]">{t.label}{t.key === 'orcamento' ? ' ✎' : ''}</p>
            <p className={`text-lg font-bold font-['Outfit'] ${t.color}`}>{formatTileBRL(t.value)}</p>
          </button>
        ))}
      </div>
      {breakdown && (
        <div data-tile-detail={open} className="bg-[#1e293b] border border-[#334155] rounded-xl p-3 space-y-1">
          {breakdown.map((b) => (
            <div key={b.key} className="flex items-center justify-between text-sm">
              <span className="text-[#cbd5e1]">{b.label}</span>
              <span className="tabular-nums text-[#f8fafc]">{brl(b.value)}</span>
            </div>
          ))}
        </div>
      )}
      {open === 'disponivel' && (
        <div data-tile-detail="disponivel" className="bg-[#1e293b] border border-[#334155] rounded-xl p-3 flex items-center justify-between text-sm">
          <span className="text-[#cbd5e1]">Reserva 15% · fora do plano</span>
          <span className="tabular-nums text-[#f8fafc]">{brl(reserve)}</span>
        </div>
      )}
    </div>
  );
};

/** C.5d — "📅 Quando o dinheiro sai": o que está a confirmar, agrupado por marco. Colapsado. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const QuandoDinheiroSai = ({ trip, lines }: { trip: any; lines: RazaoLine[] }) => {
  const [open, setOpen] = useState(false);
  const marcos = razaoDesembolso(trip, lines);
  if (marcos.length === 0) return null;
  return (
    <section className="bg-[#1e293b] border border-[#334155] rounded-xl p-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 text-left text-sm font-semibold text-[#f8fafc] font-['Outfit']"
      >
        <span className="flex-1">📅 Quando o dinheiro sai</span>
        {open ? <ChevronDown size={16} className="text-[#94a3b8]" /> : <ChevronRight size={16} className="text-[#94a3b8]" />}
      </button>
      {open && (
        <div className="mt-2 divide-y divide-[#334155]">
          {marcos.map((m) => (
            <div key={m.id} data-desembolso={m.id} className="flex items-center gap-2 py-1.5 text-sm">
              <span className={`flex-1 min-w-0 truncate ${m.outOfPlan ? 'text-[#64748b]' : 'text-[#cbd5e1]'}`}>{m.label}</span>
              <span className={`tabular-nums flex-shrink-0 ${m.outOfPlan ? 'text-[#64748b]' : 'text-[#f8fafc]'}`}>
                {brl(m.value)}{m.outOfPlan ? ' (não planejado)' : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default FinanceiroRazao;
