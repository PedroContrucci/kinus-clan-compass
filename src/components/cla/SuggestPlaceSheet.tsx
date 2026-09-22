// "Sugerir um lugar ao clã" — o sinal do usuário; a curadoria é do KINU.
import { useState } from 'react';
import { toast } from 'sonner';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { CLA_CATEGORIES, SUGGESTION_NOTE_MAX, suggestPlace } from '@/lib/cla';

interface SuggestPlaceSheetProps {
  city: string;
  open: boolean;
  onClose: () => void;
  onSent?: () => void;
}

export const SuggestPlaceSheet = ({ city, open, onClose, onSent }: SuggestPlaceSheetProps) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CLA_CATEGORIES[0].value);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const valid = name.trim().length >= 3 && name.trim().length <= 80;

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    const ok = await suggestPlace({ city, name, category, note });
    setBusy(false);
    if (ok) {
      toast.success('Vai pra curadoria do KINU — se entrar no catálogo, você ganha o crédito.');
      setName('');
      setNote('');
      onSent?.();
      onClose();
    } else {
      toast.error('Não consegui registrar sua sugestão agora. Tenta de novo em instantes.');
    }
  };

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerContent className="bg-card border-border">
        <DrawerHeader>
          <DrawerTitle className="font-['Outfit'] text-foreground text-left">
            Sugerir um lugar ao clã · {city}
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-8 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Nome do lugar</label>
            <input
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Cantina do Zé"
              className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Categoria</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {CLA_CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                    category === c.value
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      : 'border-border text-muted-foreground hover:border-emerald-500/30'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Por que vale? (opcional)</label>
            <textarea
              value={note}
              maxLength={SUGGESTION_NOTE_MAX}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground"
            />
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              {note.length}/{SUGGESTION_NOTE_MAX}
            </p>
          </div>

          <button
            onClick={() => void submit()}
            disabled={!valid || busy}
            className="w-full py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-semibold font-['Outfit'] disabled:opacity-40"
          >
            {busy ? 'Enviando…' : 'Enviar ao clã'}
          </button>
          <p className="text-[11px] text-muted-foreground text-center">
            Vai pra curadoria do KINU — se entrar no catálogo, você ganha o crédito.
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default SuggestPlaceSheet;
