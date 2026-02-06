import { KINU_QUICK_ACTIONS } from "@/types/kinuAI";
import { useKinuAI } from "@/contexts/KinuAIContext";

interface KinuQuickActionsProps {
  disabled?: boolean;
}

export function KinuQuickActions({ disabled }: KinuQuickActionsProps) {
  const { sendMessage } = useKinuAI();

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-[#334155]">
      {KINU_QUICK_ACTIONS.map((action) => (
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
