// PlanDoors — C.10: as duas portas do "➕ Planejar nova viagem" (e da aba Início sem viagem).
// 🧭 pela interface = o fluxo curto; 💬 com o KINU AI = o chat em modo "planejar". Mesmo rascunho.

import { ArrowLeft } from 'lucide-react';

interface Props {
  onInterface: () => void;
  onAgent: () => void;
  /** Com viagens na conta, volta para a lista do Início. */
  onBack?: () => void;
}

const LINE = 'w-full flex items-center justify-between min-h-[44px] px-3 rounded-xl border border-border bg-card text-sm text-foreground hover:border-primary/40';

export const PlanDoors = ({ onInterface, onAgent, onBack }: Props) => (
  <main className="px-4 pt-8 max-w-2xl mx-auto" data-testid="plan-doors">
    {onBack && (
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground mb-4 min-h-[44px]">
        <ArrowLeft size={16} /> Minhas viagens
      </button>
    )}
    <h1 className="text-3xl font-bold text-foreground font-['Outfit']">Planejar nova viagem</h1>
    <p className="text-muted-foreground mt-1">Do jeito que preferir — o rascunho sai igual.</p>
    <ul className="mt-5 space-y-2">
      <li>
        <button onClick={onAgent} className={LINE}>
          <span className="min-w-0">
            <span className="block">💬 Conversar com o KINU AI</span>
            <span className="block text-xs font-normal text-muted-foreground">
              Diga só a ideia. Ele pergunta o que falta e monta o rascunho.
            </span>
          </span>
          <span className="text-primary">▸</span>
        </button>
      </li>
      <li>
        <button onClick={onInterface} className={LINE}>
          <span className="min-w-0">
            <span className="block">🧭 Escolher na tela</span>
            <span className="block text-xs font-normal text-muted-foreground">
              Continente, país, cidade, datas: você monta passo a passo.
            </span>
          </span>
          <span className="text-primary">▸</span>
        </button>
      </li>
    </ul>
  </main>
);

export default PlanDoors;
