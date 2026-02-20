import { useKinuAI } from "@/contexts/KinuAIContext";

interface KinuQuickActionsProps {
  disabled?: boolean;
}

interface QuickAction {
  id: string;
  icon: string;
  label: string;
  prompt: string;
}

const DEFAULT_ACTIONS: QuickAction[] = [
  { id: 'plan', icon: '🧭', label: 'Me ajude a planejar', prompt: 'Quero planejar uma viagem mas não sei pra onde. Me ajude!' },
  { id: 'cheap', icon: '💰', label: 'Destino barato', prompt: 'Qual destino internacional mais barato saindo do Brasil agora?' },
  { id: 'tips', icon: '🗺️', label: 'Dicas gerais', prompt: 'Me dá dicas para viajar internacional pela primeira vez.' },
];

function getContextualActions(context: { destination?: string } | null): QuickAction[] {
  if (!context?.destination) return DEFAULT_ACTIONS;
  const dest = context.destination;
  return [
    { id: 'next', icon: '🎯', label: 'Próximo passo?', prompt: `Qual deve ser meu próximo passo para a viagem para ${dest}?` },
    { id: 'save', icon: '💰', label: 'Economizar', prompt: `Como posso economizar na viagem para ${dest}?` },
    { id: 'pack', icon: '🧳', label: 'O que levar?', prompt: `O que devo levar na mala para ${dest}?` },
    { id: 'food', icon: '🍽️', label: 'Onde comer?', prompt: `Quais os melhores restaurantes em ${dest}?` },
  ];
}

export function KinuQuickActions({ disabled }: KinuQuickActionsProps) {
  const { sendMessage, tripContext } = useKinuAI();
  const actions = getContextualActions(tripContext);

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-[#334155]">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => sendMessage(action.prompt)}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#334155] hover:bg-[#475569] text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{action.icon}</span>
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}

export default KinuQuickActions;
