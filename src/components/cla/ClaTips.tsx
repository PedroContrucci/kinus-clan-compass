import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import {
  TIP_KINDS, TIP_MAX, TIP_MIN, freshnessLine, leaveTip, voteTip,
  type ClaTip, type TipKind, type TipScope, type TipVote,
} from '@/lib/claTips';

export interface TipDraft {
  scope: TipScope;
  activityId?: string | null;
  kind: TipKind;
  text: string;
  supersedesId?: string | null;
}

export function ClaTipSheet({ open, city, places, draft, onClose, onSaved }: {
  open: boolean;
  city: string;
  places: { id: string; name: string }[];
  draft: TipDraft | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [scope, setScope] = useState<TipScope>('city');
  const [placeId, setPlaceId] = useState<string>('');
  const [kind, setKind] = useState<TipKind>('geral');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setScope(draft?.scope ?? 'city');
    setPlaceId(draft?.activityId ?? '');
    setKind(draft?.kind ?? 'geral');
    setText(draft?.text ?? '');
  }, [open, draft]);

  const len = text.trim().length;
  const valid = len >= TIP_MIN && len <= TIP_MAX && (scope === 'city' || !!placeId);

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    const ok = await leaveTip({ city, scope, activityId: scope === 'place' ? placeId : null, kind, text, supersedesId: draft?.supersedesId ?? null });
    setSaving(false);
    if (!ok) { toast.error('Não deu para salvar a dica agora.'); return; }
    toast.success(draft?.supersedesId ? 'Nova versão publicada no clã' : 'Dica publicada no clã');
    onSaved();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-2xl px-4 pb-8">
        <SheetHeader className="mb-4 text-left">
          <SheetTitle>{draft?.supersedesId ? 'O que mudou?' : 'Deixar uma dica'}</SheetTitle>
          <SheetDescription>Anônima para o clã de {city}.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={scope === 'city' ? 'default' : 'outline'} onClick={() => setScope('city')}>Cidade</Button>
            <Button type="button" variant={scope === 'place' ? 'default' : 'outline'} onClick={() => setScope('place')}>Um lugar</Button>
          </div>
          {scope === 'place' && (
            <Select value={placeId} onValueChange={setPlaceId}>
              <SelectTrigger className="border-border bg-card"><SelectValue placeholder="Escolha o lugar" /></SelectTrigger>
              <SelectContent>{places.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <div className="flex flex-wrap gap-2">
            {TIP_KINDS.map((k) => (
              <Button key={k.value} type="button" size="sm" variant={kind === k.value ? 'default' : 'outline'} className="h-8 rounded-full text-xs" onClick={() => setKind(k.value)}>{k.label}</Button>
            ))}
          </div>
          <div>
            <Textarea value={text} maxLength={TIP_MAX} onChange={(e) => setText(e.target.value)} placeholder="Ex.: leve dinheiro trocado, a barraca não aceita cartão." className="min-h-[96px] border-border bg-card" />
            <p className="mt-1 text-right text-[11px] text-muted-foreground">{len}/{TIP_MAX}{len > 0 && len < TIP_MIN ? ` · mínimo ${TIP_MIN}` : ''}</p>
          </div>
          <Button className="w-full" disabled={!valid || saving} onClick={() => void save()}>{saving ? 'Salvando…' : 'Publicar dica'}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ClaTipCard({ tip, placeName, myVote, onVoted, onChanged }: {
  tip: ClaTip;
  placeName?: string;
  myVote?: TipVote | null;
  onVoted: (tipId: string, vote: TipVote | null, prev: TipVote | null) => void;
  onChanged: (tip: ClaTip) => void;
}) {
  const kindLabel = TIP_KINDS.find((k) => k.value === tip.kind)?.label ?? tip.kind;
  const disputed = tip.disputes > tip.confirmations;
  const confirm = async () => {
    const prev = myVote ?? null;
    const r = await voteTip(tip.id, 'confirm', prev);
    if (r.ok) onVoted(tip.id, r.vote, prev);
  };
  return (
    <article className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{kindLabel}</span>
        <span className="text-muted-foreground">{tip.scope === 'place' && placeName ? `📍 ${placeName}` : '🏙️ Cidade'}</span>
        {disputed && <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-amber-400">pode ter mudado</span>}
      </div>
      <p className="text-sm leading-relaxed text-foreground">{tip.text}</p>
      <p className="mt-2 text-[11px] text-muted-foreground">{freshnessLine(tip.confirmations, tip.last_confirmed_at)}</p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant={myVote === 'confirm' ? 'default' : 'outline'} className="h-8 text-xs" aria-pressed={myVote === 'confirm'} onClick={() => void confirm()}>👍 Ainda vale</Button>
        <Button size="sm" variant={myVote === 'outdated' ? 'default' : 'outline'} className="h-8 text-xs" onClick={() => onChanged(tip)}>👎 Mudou</Button>
      </div>
    </article>
  );
}
