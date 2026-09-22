// "Sugira ao clã" — o sinal do usuário; a curadoria é do KINU.
//
// Aberto a qualquer usuário logado: quem ainda não viveu a cidade também pode sugerir,
// o sinal só vai marcado com `lived: false` para a curadoria pesar.
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CURATED_CITIES } from '@/lib/curatedCities';
import { CLA_CATEGORIES, SUGGESTION_NOTE_MAX, hasLivedCity, suggestPlace } from '@/lib/cla';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const OTHER = '__outra__';

interface Props {
  /** Cidade inicial (a selecionada na aba). */
  defaultCity?: string;
  onSent?: () => void;
}

export const SuggestClaForm = ({ defaultCity, onSent }: Props) => {
  const [pick, setPick] = useState<string>(defaultCity && CURATED_CITIES.includes(defaultCity) ? defaultCity : CURATED_CITIES[0]);
  const [otherCity, setOtherCity] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CLA_CATEGORIES[0].value);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (defaultCity && CURATED_CITIES.includes(defaultCity)) setPick(defaultCity);
  }, [defaultCity]);

  const city = pick === OTHER ? otherCity.trim() : pick;
  const valid = city.length >= 2 && name.trim().length >= 3 && name.trim().length <= 80;

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    const lived = await hasLivedCity(city);
    const ok = await suggestPlace({ city, name, category, note, lived });
    setBusy(false);
    if (ok) {
      toast.success('Vai pra curadoria do KINU — se entrar no catálogo, você ganha o crédito.');
      setName('');
      setNote('');
      onSent?.();
    } else {
      toast.error('Não consegui registrar sua sugestão agora. Tenta de novo em instantes.');
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-muted-foreground">Cidade</label>
        <Select value={pick} onValueChange={setPick}>
          <SelectTrigger className="mt-1 bg-background border-border h-9 text-sm">
            <SelectValue placeholder="Cidade" />
          </SelectTrigger>
          <SelectContent>
            {CURATED_CITIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
            <SelectItem value={OTHER}>Outra cidade…</SelectItem>
          </SelectContent>
        </Select>
        {pick === OTHER && (
          <input
            value={otherCity}
            maxLength={60}
            onChange={(e) => setOtherCity(e.target.value)}
            placeholder="Qual cidade?"
            className="mt-2 w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground"
          />
        )}
      </div>

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
        <p className="text-[10px] text-muted-foreground/70 mt-1">{note.length}/{SUGGESTION_NOTE_MAX}</p>
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
  );
};

export default SuggestClaForm;
