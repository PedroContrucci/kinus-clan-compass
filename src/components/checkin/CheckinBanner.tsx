// CheckinBanner — o convite suave do pós-viagem. Nunca bloqueia nada.
import { useState } from 'react';
import { Check } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { StoredTrip } from '@/lib/tripStore';
import {
  needsCheckin,
  checkinAtOf,
  isCheckinDismissed,
  dismissCheckin,
} from '@/lib/tripCheckin';

interface Props {
  trip: StoredTrip;
  /** Abre a tela de check-in (ou a leitura, quando já registrada). */
  onOpen: () => void;
  /** O card da lista mostra só o convite — nada de "✓ registrada". */
  compact?: boolean;
}

export const CheckinBanner = ({ trip, onOpen, compact = false }: Props) => {
  const [, force] = useState(0);
  const savedAt = checkinAtOf(trip);

  if (savedAt) {
    if (compact) return null;
    return (
      <button
        type="button"
        onClick={onOpen}
        className="w-full flex items-center gap-2 rounded-xl border border-[#334155] bg-[#1e293b] px-3 py-2 mb-3 text-left"
      >
        <Check size={14} className="text-emerald-400 shrink-0" />
        <span className="text-xs text-[#94a3b8] flex-1">
          Viagem registrada em {format(new Date(savedAt), "dd 'de' MMM", { locale: ptBR })}
        </span>
        <span className="text-xs text-emerald-400 font-medium">ver o que vivemos</span>
      </button>
    );
  }

  if (!needsCheckin(trip) || isCheckinDismissed(trip.id)) return null;

  return (
    <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2.5 mb-3">
      <p className="text-sm text-[#f8fafc] font-['Outfit'] font-medium">Como foi a viagem?</p>
      <p className="text-xs text-[#94a3b8] mt-0.5">Conte o que vocês viveram (30 segundos).</p>
      <div className="flex items-center gap-2 mt-2">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-[#0f172a]"
        >
          Contar agora
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); dismissCheckin(trip.id); force((n) => n + 1); }}
          className="px-3 py-1.5 rounded-lg text-xs text-[#94a3b8]"
        >
          Depois
        </button>
      </div>
    </div>
  );
};

export default CheckinBanner;
