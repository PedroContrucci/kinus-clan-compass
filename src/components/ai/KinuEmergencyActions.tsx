import { useKinuAI } from "@/contexts/KinuAIContext";
import { AlertTriangle, Building2, FileX, Shield } from "lucide-react";

interface KinuEmergencyActionsProps {
  disabled?: boolean;
}

const EMERGENCY_ACTIONS = [
  {
    id: "hospital",
    label: "Preciso de hospital",
    icon: Building2,
    prompt: "EMERGÊNCIA: Preciso de ajuda médica. Onde fica o hospital mais próximo e qual o número de emergência?",
  },
  {
    id: "document",
    label: "Perdi documento",
    icon: FileX,
    prompt: "EMERGÊNCIA: Perdi meu passaporte/documentos. O que faço agora? Onde fica a embaixada ou consulado?",
  },
  {
    id: "robbery",
    label: "Fui roubado",
    icon: Shield,
    prompt: "EMERGÊNCIA: Fui roubado. O que devo fazer? Como registro ocorrência? Preciso de ajuda.",
  },
];

export function KinuEmergencyActions({ disabled }: KinuEmergencyActionsProps) {
  const { sendMessage } = useKinuAI();

  return (
    <div className="px-4 py-3 bg-red-500/10 border-y border-red-500/30">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={16} className="text-red-400" />
        <span className="text-sm font-medium text-red-400">Modo Emergência</span>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {EMERGENCY_ACTIONS.map((action) => (
          <button
            key={action.id}
            onClick={() => sendMessage(action.prompt)}
            disabled={disabled}
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 transition-colors disabled:opacity-50"
          >
            <action.icon size={24} className="text-red-400" />
            <span className="text-xs text-center text-red-200 font-medium">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default KinuEmergencyActions;
