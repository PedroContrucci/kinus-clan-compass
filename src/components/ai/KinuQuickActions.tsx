import { useKinuAI } from "@/contexts/KinuAIContext";

interface KinuQuickActionsProps {
  disabled?: boolean;
}

export function KinuQuickActions({ disabled }: KinuQuickActionsProps) {
  const { sendMessage, tripContext } = useKinuAI();

  const actions: { id: string; icon: string; label: string; prompt: string }[] = [];

  if (tripContext?.destination) {
    actions.push({ id: 'tips', icon: '💡', label: 'Dicas locais', prompt: `Dicas que só locais sabem sobre ${tripContext.destination}?` });

    if (!tripContext.flightConfirmed) {
      actions.push({ id: 'flight', icon: '✈️', label: 'Comprar voo agora?', prompt: `Devo comprar o voo para ${tripContext.destination} agora ou esperar?` });
    }
    if (!tripContext.hotelConfirmed) {
      actions.push({ id: 'hotel', icon: '🏨', label: 'Melhor região?', prompt: `Qual a melhor região para ficar em ${tripContext.destination}?` });
    }
    if (tripContext.jetLagSeverity === 'ALTO' || tripContext.jetLagSeverity === 'SEVERO') {
      actions.push({ id: 'jetlag', icon: '🧠', label: 'Dicas jet lag', prompt: `Como lidar com o fuso horário severo de ${tripContext.destination}?` });
    }
    if ((tripContext.checklistProgress || 0) < 50) {
      actions.push({ id: 'prep', icon: '📋', label: 'O que preparar?', prompt: `O que não posso esquecer de preparar para ${tripContext.destination}?` });
    }
    if (tripContext.interests?.includes('gastronomy')) {
      actions.push({ id: 'food', icon: '🍽️', label: 'Onde comer?', prompt: `Melhores restaurantes em ${tripContext.destination}, incluindo Michelin?` });
    }
    // Fallback: ensure at least 2 actions
    if (actions.length < 2) {
      actions.push({ id: 'save', icon: '💰', label: 'Economizar', prompt: `Como economizar em ${tripContext.destination}?` });
    }
  } else {
    actions.push(
      { id: 'plan', icon: '🧭', label: 'Planejar viagem', prompt: 'Me ajude a escolher um destino!' },
      { id: 'cheap', icon: '💰', label: 'Destino barato', prompt: 'Destinos baratos saindo do Brasil?' },
      { id: 'tips', icon: '💡', label: 'Dicas gerais', prompt: 'Dicas para viajar mais barato?' },
    );
  }

  const visibleActions = actions.slice(0, 4);

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-[#334155]">
      {visibleActions.map((action) => (
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
