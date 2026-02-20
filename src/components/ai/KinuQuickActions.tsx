import { useKinuAI } from "@/contexts/KinuAIContext";

interface KinuQuickActionsProps {
  disabled?: boolean;
}

export function KinuQuickActions({ disabled }: KinuQuickActionsProps) {
  const { sendMessage, tripContext } = useKinuAI();

  const actions = tripContext?.destination
    ? [
        { id: 'next',  icon: '🎯', label: 'Proximo passo?', prompt: `Qual meu proximo passo para ${tripContext.destination}?` },
        { id: 'save',  icon: '💰', label: 'Economizar',     prompt: `Como economizar em ${tripContext.destination}?` },
        { id: 'food',  icon: '🍽️', label: 'Onde comer?',   prompt: `Melhores restaurantes em ${tripContext.destination}?` },
        { id: 'tips',  icon: '💡', label: 'Dicas locais',   prompt: `Dicas que so locais sabem sobre ${tripContext.destination}?` },
      ]
    : [
        { id: 'plan',  icon: '🧭', label: 'Planejar viagem', prompt: 'Me ajude a escolher um destino de viagem!' },
        { id: 'cheap', icon: '💰', label: 'Destino barato',  prompt: 'Destinos baratos saindo do Brasil?' },
        { id: 'tips',  icon: '💡', label: 'Dicas gerais',    prompt: 'Dicas para viajar mais barato?' },
      ];

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
