import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { KinuMessage, KinuTripContext, KinuInsight, EMERGENCY_KEYWORDS } from "@/types/kinuAI";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CURATED_CITIES } from "@/lib/curatedCities";
import { destinationActivities } from "@/data/destinationActivities";

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
