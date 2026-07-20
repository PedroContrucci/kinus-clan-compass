import { motion } from "framer-motion";
import { KinuMessage, ProposedAction } from "@/types/kinuAI";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useKinuAI } from "@/contexts/KinuAIContext";

interface KinuAIMessageProps {
  message: KinuMessage;
}

function describeAction(action: ProposedAction): string {
  const p = action.params || {};
  switch (action.type) {
    case 'trocar_atividade':
      return `Trocar ${p.atividade_atual ?? 'atividade'} por ${p.nova_atividade ?? '—'} no dia ${p.dia ?? '?'}`;
    case 'ajustar_horario':
      return `Ajustar ${p.atividade ?? 'atividade'} para às ${p.novo_horario ?? '--:--'} no dia ${p.dia ?? '?'}`;
    case 'remover_atividade':
      return `Remover ${p.atividade ?? 'atividade'} do dia ${p.dia ?? '?'}`;
    case 'confirmar_item':
      return `Confirmar ${p.tipo === 'hotel' ? 'o hotel' : 'o voo'} da viagem`;
    case 'adicionar_atividade':
      return `Adicionar ${p.atividade ?? '—'} às ${p.horario ?? '--:--'} no dia ${p.dia ?? '?'}`;
    case 'sugerir_destinos':
      return `🗺️ Acender ${(p.cidades ?? []).join(', ')} no mapa`;
    case 'navegar_para': {
      const labels: Record<string, string> = { painel: 'Painel', roteiro: 'Roteiro', financeiro: 'Financeiro', preparacao: 'Preparação', planejar: 'Planejar' };
      return `Abrir ${labels[p.destino] ?? p.destino ?? '—'}`;
    }
    case 'criar_viagem':
      return `✈️ Planejar ${p.destino ?? '—'} · ${p.data_ida ?? '—'} → ${p.data_volta ?? '—'} · ${p.viajantes ?? '?'} viajante(s)`;
    default:
      return 'Ação proposta';
  }
}

export function KinuAIMessage({ message }: KinuAIMessageProps) {
  const isUser = message.role === "user";
  const { applyProposedAction, dismissProposedAction } = useKinuAI();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-[#334155] text-foreground rounded-br-sm"
            : message.isEmergency
            ? "bg-red-500/10 border-l-4 border-red-500 text-foreground rounded-bl-sm"
            : "bg-[#0f172a] border-l-4 border-emerald-500 text-foreground rounded-bl-sm"
        }`}
      >
        {!isUser && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">🌿</span>
            <span className="text-xs font-medium text-emerald-400">KINU</span>
          </div>
        )}

        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {message.content}
        </p>

        {!isUser && message.proposedActions && message.proposedActions.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.proposedActions.map((action, idx) => {
              const status = action.status ?? 'pending';
              return (
                <div
                  key={`${message.id}-act-${idx}`}
                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2"
                >
                  <p className="text-xs text-foreground leading-snug">
                    <span className="mr-1">🤖</span>
                    {describeAction(action)}
                  </p>
                  {status === 'pending' && (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => applyProposedAction(message.id, idx)}
                        className="px-3 py-1 text-[11px] font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                      >
                        {action.type === 'sugerir_destinos' ? '✓ Ver no mapa' : action.type === 'navegar_para' ? 'Abrir' : action.type === 'criar_viagem' ? 'Começar planejamento' : '✓ Aplicar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => dismissProposedAction(message.id, idx)}
                        className="px-3 py-1 text-[11px] font-semibold rounded-lg bg-[#334155] text-muted-foreground hover:text-foreground hover:bg-[#3f4c62] transition-colors"
                      >
                        ✗ Recusar
                      </button>
                    </div>
                  )}
                  {status === 'applied' && (
                    <p className="mt-2 text-[10px] text-emerald-400">Aplicada ✓</p>
                  )}
                  {status === 'dismissed' && (
                    <p className="mt-2 text-[10px] text-muted-foreground">Recusada</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground mt-1 text-right">
          {format(message.timestamp, "HH:mm", { locale: ptBR })}
        </p>
      </div>
    </motion.div>
  );
}

export default KinuAIMessage;
