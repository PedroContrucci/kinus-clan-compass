import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import { KinuMessage, KinuTripContext, KinuInsight, EMERGENCY_KEYWORDS, ProposedAction, ProposedActionType } from "@/types/kinuAI";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CURATED_CITIES } from "@/lib/curatedCities";
import { destinationActivities } from "@/data/destinationActivities";

export interface KinuActionHandlers {
  trocar_atividade: (params: { dia: number; atividade_atual: string; nova_atividade: string }) => string | null;
  ajustar_horario: (params: { dia: number; atividade: string; novo_horario: string }) => string | null;
  remover_atividade: (params: { dia: number; atividade: string }) => string | null;
  confirmar_item: (params: { tipo: 'voo' | 'hotel' }) => string | null;
}

function buildCuratedCatalog(city: string) {
  const data = destinationActivities[city];
  if (!data) return null;
  return data.activities.slice(0, 35).map((a) => ({
    name: a.name,
    category: a.category,
    neighborhood: a.neighborhood,
    costBRL: a.estimatedCostBRL,
    tip: a.tips?.[0] ?? "",
  }));
}

function detectCuratedCity(message: string, activeDestination?: string): string | null {
  if (activeDestination && CURATED_CITIES.some((c) => c.toLowerCase() === activeDestination.toLowerCase())) {
    const match = CURATED_CITIES.find((c) => c.toLowerCase() === activeDestination.toLowerCase());
    if (match) return match;
  }
  const lower = message.toLowerCase();
  return CURATED_CITIES.find((c) => lower.includes(c.toLowerCase())) ?? null;
}

interface KinuAIContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  messages: KinuMessage[];
  isLoading: boolean;
  insights: KinuInsight[];
  tripContext: KinuTripContext | null;
  setTripContext: (context: KinuTripContext | null) => void;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  dismissInsight: (id: string) => void;
  addInsight: (insight: KinuInsight) => void;
  isEmergencyMode: boolean;
}

const KinuAIContext = createContext<KinuAIContextType | undefined>(undefined);

export function KinuAIProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<KinuMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<KinuInsight[]>([]);
  const [tripContext, setTripContext] = useState<KinuTripContext | null>(null);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);

  const checkForEmergency = useCallback((text: string): boolean => {
    const lowerText = text.toLowerCase();
    return EMERGENCY_KEYWORDS.some(keyword => lowerText.includes(keyword));
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const isEmergency = checkForEmergency(content);
    
    if (isEmergency) {
      setIsEmergencyMode(true);
    }

    const userMessage: KinuMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
      isEmergency,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const curatedCity = detectCuratedCity(content, tripContext?.destination);
      const curatedCatalog = curatedCity ? buildCuratedCatalog(curatedCity) : null;

      // Build compact itineraryDays, cap total payload ~4000 chars
      let itineraryDays: Array<{ day: number; date: string; items: string[] }> | undefined;
      const rawDays = tripContext?.itineraryDays;
      if (rawDays && rawDays.length > 0) {
        const capped = rawDays.slice(0, 12).map((d) => ({
          day: d.day,
          date: d.date || '',
          items: (d.items || []).slice(0, 8).map((s) => String(s).slice(0, 80)),
        }));
        let total = 0;
        const MAX = 4000;
        const out: typeof capped = [];
        let truncated = false;
        for (const d of capped) {
          const kept: string[] = [];
          for (const it of d.items) {
            const cost = it.length + 2;
            if (total + cost > MAX) { truncated = true; break; }
            kept.push(it);
            total += cost;
          }
          if (truncated && kept.length < d.items.length) kept.push('…');
          out.push({ day: d.day, date: d.date, items: kept });
          if (truncated) break;
        }
        itineraryDays = out;
      }

      const { data, error } = await supabase.functions.invoke("kinu-ai", {
        body: {
          message: content,
          context: tripContext,
          history,
          isEmergency,
          curatedCityNames: CURATED_CITIES,
          curatedCatalog: curatedCatalog
            ? { city: curatedCity, items: curatedCatalog }
            : undefined,
          itineraryDays,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: KinuMessage = {
        id: `msg-${Date.now()}-response`,
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message to KINU:", error);
      
      const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
      const isApiKeyError = errorMsg.includes("ANTHROPIC_API_KEY") || errorMsg.includes("401");
      const isRateLimit = errorMsg.includes("429") || errorMsg.includes("Muitas requisições");
      
      let friendlyMessage: string;
      if (isApiKeyError) {
        friendlyMessage = "Estou com um problema de conexão com meu cérebro (API key). Avisa o Pedro que ele resolve rapidinho! 🔧";
      } else if (isRateLimit) {
        friendlyMessage = "Calma aí, muita gente falando comigo ao mesmo tempo! Tenta de novo em uns 30 segundos? 😅";
      } else {
        friendlyMessage = "Ops, tive um problema aqui. Pode tentar de novo? Se persistir, tenta recarregar a página. 🙏";
      }
      
      toast.error("Erro ao enviar mensagem");
      
      const errorMessage: KinuMessage = {
        id: `msg-${Date.now()}-error`,
        role: "assistant",
        content: friendlyMessage,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, tripContext, checkForEmergency]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setIsEmergencyMode(false);
  }, []);

  const dismissInsight = useCallback((id: string) => {
    setInsights(prev => prev.filter(insight => insight.id !== id));
  }, []);

  const addInsight = useCallback((insight: KinuInsight) => {
    setInsights(prev => {
      // Avoid duplicates
      if (prev.some(i => i.id === insight.id)) return prev;
      return [...prev, insight];
    });
  }, []);

  return (
    <KinuAIContext.Provider
      value={{
        isOpen,
        setIsOpen,
        messages,
        isLoading,
        insights,
        tripContext,
        setTripContext,
        sendMessage,
        clearMessages,
        dismissInsight,
        addInsight,
        isEmergencyMode,
      }}
    >
      {children}
    </KinuAIContext.Provider>
  );
}

export function useKinuAI() {
  const context = useContext(KinuAIContext);
  if (context === undefined) {
    throw new Error("useKinuAI must be used within a KinuAIProvider");
  }
  return context;
}
