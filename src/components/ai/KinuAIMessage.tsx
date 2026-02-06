import { motion } from "framer-motion";
import { KinuMessage } from "@/types/kinuAI";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface KinuAIMessageProps {
  message: KinuMessage;
}

export function KinuAIMessage({ message }: KinuAIMessageProps) {
  const isUser = message.role === "user";

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
        
        <p className="text-[10px] text-muted-foreground mt-1 text-right">
          {format(message.timestamp, "HH:mm", { locale: ptBR })}
        </p>
      </div>
    </motion.div>
  );
}

export default KinuAIMessage;
