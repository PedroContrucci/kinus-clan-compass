// A linha do Clã — "👍 12 · 👎 1 · 3 notas" e, para quem viveu a cidade, um toque para reagir.
//
// Anônima por desenho: nenhum nome, nenhum ranking de pessoas. Se a RPC falhar, a linha some
// em silêncio — o roteiro nunca deixa de renderizar por causa do clã.
import { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquarePlus } from 'lucide-react';
import { useClaCity } from '@/hooks/useCla';
import { react, NOTE_MAX, type ReactionKind } from '@/lib/cla';
import { SuggestPlaceSheet } from './SuggestPlaceSheet';

interface ClaLineProps {
  /** Id do catálogo (já sem o prefixo `day-N-`). */
  activityId: string;
  city: string;
  /** Mostra o "Sugerir um lugar ao clã" (rodapé do detalhe). */
  withSuggest?: boolean;
  className?: string;
}

export const ClaLine = ({ activityId, city, withSuggest = false, className = '' }: ClaLineProps) => {
  const { stats, mine, lived, setLocalReaction } = useClaCity(city);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);

  if (!activityId || !city) return null;

  const stat = stats.get(activityId);
  const current = mine.get(activityId) ?? null;

  const send = async (kind: ReactionKind, withNote?: string) => {
    if (busy) return;
    setBusy(true);
    const before = current;
    setLocalReaction(activityId, before === kind ? null : kind);
    const result = await react({ activityId, city, kind, current: before, note: withNote });
    if (!result.ok) setLocalReaction(activityId, before);
    setBusy(false);
  };

  const ups = (stat?.ups ?? 0) + (current === 'up' ? 1 : 0);
  const downs = (stat?.downs ?? 0) + (current === 'down' ? 1 : 0);
  const notes = stat?.notes ?? 0;

  return (
    <div className={`mt-2 ${className}`} onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
        <span className="text-emerald-400/80 font-medium">Clã</span>
        <span>
          👍 {ups} · 👎 {downs}
          {notes > 0 && ` · ${notes} nota${notes > 1 ? 's' : ''}`}
        </span>

        {lived ? (
          <>
            <button
              onClick={() => void send('up')}
              disabled={busy}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full border transition-colors ${
                current === 'up'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                  : 'border-border text-muted-foreground hover:border-emerald-500/40'
              }`}
            >
              <ThumbsUp size={11} />
            </button>
            <button
              onClick={() => void send('down')}
              disabled={busy}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full border transition-colors ${
                current === 'down'
                  ? 'bg-red-500/20 border-red-500/40 text-red-400'
                  : 'border-border text-muted-foreground hover:border-red-500/40'
              }`}
            >
              <ThumbsDown size={11} />
            </button>
            <button
              onClick={() => setNoteOpen((v) => !v)}
              className="flex items-center gap-1 text-muted-foreground hover:text-emerald-400 transition-colors"
            >
              <MessageSquarePlus size={11} /> deixar uma nota
            </button>
          </>
        ) : (
          <span className="text-[10px] text-muted-foreground/70">Vote depois de viver</span>
        )}
      </div>

      {lived && noteOpen && (
        <div className="mt-2 flex items-center gap-2">
          <input
            value={note}
            maxLength={NOTE_MAX}
            onChange={(e) => setNote(e.target.value)}
            placeholder="O que o clã precisa saber? (opcional)"
            className="flex-1 px-3 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground"
          />
          <button
            onClick={async () => {
              await send(current === 'down' ? 'down' : 'up', note);
              setNote('');
              setNoteOpen(false);
            }}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold"
          >
            Enviar
          </button>
        </div>
      )}

      {withSuggest && (
        <div className="mt-2">
          {lived ? (
            <button
              onClick={() => setSuggestOpen(true)}
              className="text-xs text-emerald-400 hover:underline font-medium"
            >
              + Sugerir um lugar ao clã
            </button>
          ) : (
            <p className="text-[10px] text-muted-foreground/70">
              Sugira lugares ao clã depois de viver a cidade.
            </p>
          )}
          <SuggestPlaceSheet city={city} open={suggestOpen} onClose={() => setSuggestOpen(false)} />
        </div>
      )}
    </div>
  );
};

export default ClaLine;
