import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Trash2 } from "lucide-react";
import { useKinuAI } from "@/contexts/KinuAIContext";
import { KinuAIMessage } from "./KinuAIMessage";
import { KinuQuickActions } from "./KinuQuickActions";
import { KinuEmergencyActions } from "./KinuEmergencyActions";
import { KinuTypingIndicator } from "./KinuTypingIndicator";

export function KinuAIChat() {
  const {
    isOpen,
    setIsOpen,
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    isEmergencyMode,
    tripContext,
  } = useKinuAI();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput("");
    await sendMessage(message);
  };

  const welcomeMessage = tripContext?.destination
    ? `E aí! 👋 Vi que você tá planejando ir pra ${tripContext.destination}. Posso te ajudar com dicas, economizar grana, ou qualquer dúvida sobre a viagem!`
    : "E aí! 👋 Sou o KINU, seu irmão de viagem. Me conta: pra onde você tá indo? Posso te ajudar com dicas, emergências, ou qualquer coisa que precisar!";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Chat Panel */}
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed bottom-0 left-0 right-0 z-50 max-h-[75vh] bg-[#1E293B] rounded-t-3xl border-t ${
              isEmergencyMode ? "border-red-500/50" : "border-emerald-500/30"
            } flex flex-col overflow-hidden`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b ${
              isEmergencyMode ? "border-red-500/30" : "border-[#334155]"
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">🌿</span>
                <div>
                  <h3 className="font-semibold text-foreground font-['Outfit'] text-sm">
                    KINU AI
                  </h3>
                  <p className="text-[10px] text-muted-foreground">
                    Seu irmão experiente de viagem
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <button
                    onClick={clearMessages}
                    className="p-2 hover:bg-[#334155] rounded-lg transition-colors"
                    title="Limpar conversa"
                  >
                    <Trash2 size={16} className="text-muted-foreground" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-[#334155] rounded-lg transition-colors"
                >
                  <X size={18} className="text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Quick Actions or Emergency Actions */}
            {isEmergencyMode ? (
              <KinuEmergencyActions disabled={isLoading} />
            ) : (
              <KinuQuickActions disabled={isLoading} />
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-[#0f172a] border-l-4 border-emerald-500 rounded-2xl rounded-bl-sm px-4 py-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">🌿</span>
                    <span className="text-xs font-medium text-emerald-400">KINU</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {welcomeMessage}
                  </p>
                </motion.div>
              ) : (
                messages.map((message) => (
                  <KinuAIMessage key={message.id} message={message} />
                ))
              )}
              
              {isLoading && <KinuTypingIndicator />}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="p-4 border-t border-[#334155] bg-[#1E293B]"
            >
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isEmergencyMode ? "Descreva o que aconteceu..." : "Pergunte qualquer coisa..."}
                  disabled={isLoading}
                  className={`flex-1 bg-[#0f172a] border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 disabled:opacity-50 ${
                    isEmergencyMode
                      ? "border-red-500/30 focus:ring-red-500/50"
                      : "border-[#334155] focus:ring-emerald-500/50"
                  }`}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={`p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isEmergencyMode
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-emerald-500 hover:bg-emerald-600 text-white"
                  }`}
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default KinuAIChat;
