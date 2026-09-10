// TripCheckinDrawer — "o que vocês viveram", em 30 segundos.
//
// Mesma casca dos outros drawers do app (vaul, via components/ui/drawer). Somente leitura
// quando a viagem já tem `checkinAt`.
import { useMemo, useState } from 'react';
import { Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import type { StoredTrip } from '@/lib/tripStore';
import {
  livableDays,
  submitCheckin,
  checkinAtOf,
  NOTE_MAX,
} from '@/lib/tripCheckin';

interface Props {
  trip: StoredTrip;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (trip: StoredTrip) => void;
}

export const TripCheckinDrawer = ({ trip, open, onOpenChange, onSaved }: Props) => {
  const days = useMemo(() => livableDays(trip), [trip]);
  const savedAt = checkinAtOf(trip);
  const readOnly = Boolean(savedAt);

  const livedSaved: string[] = Array.isArray((trip as { livedIds?: unknown }).livedIds)
    ? ((trip as { livedIds?: string[] }).livedIds as string[])
    : [];

  const [lived, setLived] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    days.forEach((d) => d.activities.forEach((a) => {
      initial[a.id] = readOnly ? livedSaved.includes(a.id) : a.status === 'confirmed';
    }));
    return initial;
  });
  const [note, setNote] = useState<string>(String((trip as { checkinNote?: string }).checkinNote || ''));
  const [saving, setSaving] = useState(false);

  const all = days.flatMap((d) => d.activities);
  const livedList = all.filter((a) => lived[a.id]);

  const handleSubmit = () => {
    if (readOnly || saving) return;
    setSaving(true);
    const stored = submitCheckin(trip.id, {
      livedIds: livedList.map((a) => a.id),
      livedNames: livedList.map((a) => a.name),
      skipped: all.length - livedList.length,
      note,
    });
    setSaving(false);
    if (stored) onSaved?.(stored);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-[#0f172a] border-[#334155] max-h-[90vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-['Outfit'] text-[#f8fafc]">
            {readOnly ? 'O que vocês viveram' : 'Como foi a viagem?'}
          </DrawerTitle>
          <p className="text-xs text-[#94a3b8]">
            {readOnly && savedAt
              ? `Registrada em ${format(new Date(savedAt), "dd 'de' MMMM", { locale: ptBR })}`
              : 'Marque o que aconteceu de verdade. Leva 30 segundos.'}
          </p>
        </DrawerHeader>

        <div className="px-4 pb-6 overflow-y-auto space-y-5">
          {days.length === 0 && (
            <p className="text-sm text-[#94a3b8]">Esta viagem não tem atividades para registrar.</p>
          )}

          {days.map((d) => (
            <div key={d.day} className="space-y-2">
              <p className="text-[11px] uppercase tracking-wide text-[#64748b] font-medium">
                Dia {d.day} · {d.title}
              </p>
              {d.activities.map((a) => {
                const on = Boolean(lived[a.id]);
                return (
                  <button
                    key={a.id}
                    type="button"
                    disabled={readOnly}
                    onClick={() => setLived((prev) => ({ ...prev, [a.id]: !prev[a.id] }))}
                    className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                      on
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'border-[#334155] bg-[#1e293b] opacity-70'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                        on ? 'bg-emerald-500 text-[#0f172a]' : 'bg-[#334155] text-[#64748b]'
                      }`}
                    >
                      {on ? <Check size={13} /> : <X size={13} />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-[#f8fafc] truncate">{a.name}</span>
                      <span className="block text-[11px] text-[#94a3b8]">
                        {a.time} · {on ? 'vivemos' : 'não rolou'}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ))}

          <div className="space-y-1.5">
            <label className="text-xs text-[#94a3b8]">Algo que o roteiro não previu?</label>
            <input
              value={note}
              readOnly={readOnly}
              maxLength={NOTE_MAX}
              onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
              placeholder="Opcional"
              className="w-full rounded-xl bg-[#1e293b] border border-[#334155] px-3 py-2.5 text-sm text-[#f8fafc] placeholder:text-[#64748b] focus:outline-none focus:border-emerald-500/60"
            />
            {!readOnly && (
              <p className="text-[10px] text-[#64748b] text-right">{note.length}/{NOTE_MAX}</p>
            )}
          </div>

          {!readOnly && (
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-3 rounded-xl text-sm text-[#94a3b8] border border-[#334155]"
              >
                Agora não
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold font-['Outfit'] bg-gradient-to-r from-[#10b981] to-[#0ea5e9] text-white"
              >
                Registrar viagem
              </button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default TripCheckinDrawer;
