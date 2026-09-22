// TripCheckinDrawer — "o que vocês viveram", em 30 segundos.
//
// Aqui — e só aqui — o clã vota: cada atividade marcada como vivida pode receber
// 👍/👎 e uma nota curta, que viram linhas em `cla_reactions`. No fim, uma nota de
// 1 a 5 estrelas sobre planejar com o KINU. Nada disso bloqueia o check-in.
import { useMemo, useState } from 'react';
import { Check, X, ThumbsUp, ThumbsDown, Star } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { supabase } from '@/integrations/supabase/client';
import { catalogIdOf } from '@/lib/localAchievements';
import { submitCheckinReactions, type CheckinReaction, type ReactionKind } from '@/lib/cla';
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

/** Feedback do check-in — mesma tabela e formato do botão de feedback do app. */
async function sendCheckinFeedback(rating: number, comment: string, destination: string) {
  if (!rating) return;
  try {
    const { error } = await supabase.from('beta_feedback').insert({
      tester_name: localStorage.getItem('kinu_tester_name') || 'anônimo',
      rating,
      category: 'checkin',
      message: comment.trim() || `Check-in de ${destination || 'viagem'} — ${rating}/5`,
      page: '/viagens#checkin',
      user_agent: navigator.userAgent,
      screen_size: `${window.innerWidth}x${window.innerHeight}`,
      app_version: 'v0.1.0',
    });
    if (error) console.error('checkin: feedback insert failed', error);
  } catch (err) {
    console.error('checkin: feedback insert failed', err);
  }
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
  const [reactions, setReactions] = useState<Record<string, ReactionKind>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [note, setNote] = useState<string>(String((trip as { checkinNote?: string }).checkinNote || ''));
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
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

    if (stored) {
      // Fire-and-forget: o check-in já está gravado; clã e feedback nunca o seguram.
      const items: CheckinReaction[] = livedList
        .filter((a) => reactions[a.id])
        .map((a) => ({
          activityId: catalogIdOf(a.id),
          kind: reactions[a.id],
          note: notes[a.id],
        }));
      void submitCheckinReactions(String(trip.destination || ''), items);
      void sendCheckinFeedback(rating, comment, String(trip.destination || ''));
      onSaved?.(stored);
    }
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
                const kind = reactions[a.id];
                return (
                  <div key={a.id} className="space-y-1.5">
                    <button
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

                    {!readOnly && on && (
                      <div className="pl-8 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setReactions((p) => {
                                const next = { ...p };
                                if (next[a.id] === 'up') delete next[a.id];
                                else next[a.id] = 'up';
                                return next;
                              })
                            }
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] transition-colors ${
                              kind === 'up'
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                : 'border-[#334155] text-[#94a3b8]'
                            }`}
                          >
                            <ThumbsUp size={11} /> vale
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setReactions((p) => {
                                const next = { ...p };
                                if (next[a.id] === 'down') delete next[a.id];
                                else next[a.id] = 'down';
                                return next;
                              })
                            }
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] transition-colors ${
                              kind === 'down'
                                ? 'bg-red-500/20 border-red-500/40 text-red-400'
                                : 'border-[#334155] text-[#94a3b8]'
                            }`}
                          >
                            <ThumbsDown size={11} /> não vale
                          </button>
                        </div>
                        {kind && (
                          <input
                            value={notes[a.id] || ''}
                            maxLength={NOTE_MAX}
                            onChange={(e) =>
                              setNotes((p) => ({ ...p, [a.id]: e.target.value.slice(0, NOTE_MAX) }))
                            }
                            placeholder="Uma dica pro clã (opcional)"
                            className="w-full rounded-lg bg-[#1e293b] border border-[#334155] px-3 py-2 text-xs text-[#f8fafc] placeholder:text-[#64748b] focus:outline-none focus:border-emerald-500/60"
                          />
                        )}
                      </div>
                    )}
                  </div>
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
            <div className="space-y-2 rounded-xl border border-[#334155] bg-[#1e293b] p-3">
              <p className="text-sm text-[#f8fafc] font-['Outfit'] font-medium">
                Como foi planejar com o KINU?
              </p>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
                    onClick={() => setRating((cur) => (cur === n ? 0 : n))}
                    className="p-1"
                  >
                    <Star
                      size={22}
                      className={n <= rating ? 'text-amber-400 fill-amber-400' : 'text-[#475569]'}
                    />
                  </button>
                ))}
              </div>
              <input
                value={comment}
                maxLength={280}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Comentário (opcional)"
                className="w-full rounded-lg bg-[#0f172a] border border-[#334155] px-3 py-2 text-xs text-[#f8fafc] placeholder:text-[#64748b] focus:outline-none focus:border-emerald-500/60"
              />
            </div>
          )}

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
