// KinuDidCard — "O que o KINU fez": cada escolha automática do fluxo com o porquê e onde trocar.
// Some quando a viagem é ativada (só é renderizado em rascunho).
// Dentro do cockpit (C.2) recebe `panels`: hotel, voo e roteiro abrem como painel colapsável
// logo abaixo da própria linha — o card É o cockpit, e o Ativar dele é o único.

import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Rocket } from 'lucide-react';
import { HotelSwapModal } from '@/components/hotel/HotelSwapModal';
import { applyHotelSwap, type SwapTripLike } from '@/lib/hotelSwap';
import { kinuDidLines } from '@/lib/onboardingFlow';

export type KinuDidRow = 'hotel' | 'flight' | 'itinerary';

interface Props {
  trip: any;
  onActivate: () => void;
  onUpdateTrip: (updater: (t: any) => any) => void;
  /** Abre o passo Voo do DraftCockpit (card fora do cockpit, sem `panels`). */
  onOpenFlights?: () => void;
  /** Painéis por linha (cockpit): o toque em "trocar"/"ver" abre/fecha abaixo da linha. */
  panels?: Partial<Record<KinuDidRow, ReactNode>>;
  openRow?: KinuDidRow | null;
  onToggleRow?: (row: KinuDidRow) => void;
  /** Linhas extras do cockpit (análise, itens que não couberam), antes do Ativar. */
  extraRows?: ReactNode;
}

export const KinuDidCard = ({ trip, onActivate, onUpdateTrip, onOpenFlights, panels, openRow, onToggleRow, extraRows }: Props) => {
  const navigate = useNavigate();
  const [swapOpen, setSwapOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const l = kinuDidLines(trip);
  const toCockpit = () => document.getElementById('draft-cockpit')?.scrollIntoView({ behavior: 'smooth' });

  const rows: { icon: string; text: string; action: () => void; panel?: KinuDidRow; verb?: string }[] = [
    { icon: '🛫', text: l.origin, action: () => navigate('/planejar') },
    { icon: '🏨', text: l.hotel, action: () => setSwapOpen(true), panel: 'hotel', verb: 'trocar' },
    { icon: '✈️', text: l.flight, action: () => { onOpenFlights?.(); toCockpit(); }, panel: 'flight', verb: 'trocar' },
    { icon: '🗺️', text: l.itinerary, action: toCockpit, panel: 'itinerary', verb: 'ver' },
    { icon: '💰', text: l.budget, action: () => navigate('/planejar') },
  ];

  return (
    <section className="mx-4 mt-4 bg-card border border-border rounded-2xl p-4">
      <h2 className="flex items-center gap-2 text-base font-semibold text-foreground font-['Outfit']">
        <Sparkles size={16} className="text-primary" /> O que o KINU fez
      </h2>
      <ul className="mt-3 space-y-2">
        {rows.map((r) => {
          const panel = r.panel && panels?.[r.panel] !== undefined ? r.panel : undefined;
          const open = !!panel && openRow === panel;
          return (
            <li key={r.icon} className="text-sm">
              <div className="flex items-start gap-2">
                <span>{r.icon}</span>
                <span className="flex-1 text-foreground">
                  {r.icon === '💰' ? (
                    <button onClick={() => setBudgetOpen((v) => !v)} aria-expanded={budgetOpen} className="text-left">
                      {r.text} <span className="text-muted-foreground text-xs">{budgetOpen ? '▲' : '▼'}</span>
                    </button>
                  ) : r.text}
                  {r.icon === '💰' && budgetOpen && (
                    <span className="block mt-1 text-xs text-muted-foreground">{l.budgetDetail}</span>
                  )}
                </span>
                {panel ? (
                  <button onClick={() => onToggleRow?.(panel)} aria-expanded={open} aria-label={`${r.verb} ${r.icon}`}
                    className="shrink-0 text-primary text-xs underline-offset-2 hover:underline">
                    {r.verb} {open ? '▾' : '▸'}
                  </button>
                ) : (
                  <button onClick={r.action} aria-label={`trocar ${r.icon}`} className="shrink-0 text-primary text-xs underline-offset-2 hover:underline">trocar</button>
                )}
              </div>
              {open && <div className="mt-2 -mx-2 rounded-xl border border-border bg-background/60 p-2" data-panel={panel}>{panels?.[panel]}</div>}
            </li>
          );
        })}
      </ul>
      {extraRows && <div className="mt-2 space-y-2">{extraRows}</div>}
      <button onClick={onActivate}
        className="mt-4 w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-semibold font-['Outfit'] flex items-center justify-center gap-2">
        <Rocket size={16} /> Ativar
      </button>
      <HotelSwapModal
        open={swapOpen}
        onClose={() => setSwapOpen(false)}
        trip={trip as SwapTripLike}
        onSelect={(hotel) => { onUpdateTrip((t) => applyHotelSwap(t, hotel)); setSwapOpen(false); }}
      />
    </section>
  );
};

export default KinuDidCard;
