import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import { KinuMessage, KinuTripContext, KinuInsight, EMERGENCY_KEYWORDS, ProposedAction, ProposedActionType } from "@/types/kinuAI";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CURATED_CITIES } from "@/lib/curatedCities";
import { destinationActivities } from "@/data/destinationActivities";

export interface KinuActionHandlers {
  trocar_atividade?: (params: { dia: number; atividade_atual: string; nova_atividade: string }) => string | null;
  ajustar_horario?: (params: { dia: number; atividade: string; novo_horario: string }) => string | null;
  remover_atividade?: (params: { dia: number; atividade: string }) => string | null;
  confirmar_item?: (params: { tipo: 'voo' | 'hotel' }) => string | null;
  adicionar_atividade?: (params: { dia: number; atividade: string; horario: string }) => string | null;
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
  applyProposedAction: (messageId: string, actionIndex: number) => void;
  dismissProposedAction: (messageId: string, actionIndex: number) => void;
  registerActionHandlers: (handlers: KinuActionHandlers | null) => void;
  suggestedDestinations: string[];
  clearSuggestedDestinations: () => void;
  pendingNavigation: { destino: string; ts: number } | null;
  clearPendingNavigation: () => void;
}


const KinuAIContext = createContext<KinuAIContextType | undefined>(undefined);

export function KinuAIProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<KinuMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<KinuInsight[]>([]);
  const [tripContext, setTripContext] = useState<KinuTripContext | null>(null);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [suggestedDestinations, setSuggestedDestinations] = useState<string[]>([]);


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

      const rawActions: any[] = Array.isArray(data.proposedActions) ? data.proposedActions : [];
      const proposedActions: ProposedAction[] = rawActions
        .filter((a) => a && typeof a.type === 'string')
        .map((a) => ({
          type: a.type as ProposedActionType,
          params: (a.params && typeof a.params === 'object') ? a.params : {},
          status: 'pending' as const,
        }));

      const assistantMessage: KinuMessage = {
        id: `msg-${Date.now()}-response`,
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
        proposedActions: proposedActions.length > 0 ? proposedActions : undefined,
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

  const clearSuggestedDestinations = useCallback(() => {
    setSuggestedDestinations([]);
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

  const actionHandlersRef = useRef<KinuActionHandlers | null>(null);

  const registerActionHandlers = useCallback((handlers: KinuActionHandlers | null) => {
    actionHandlersRef.current = handlers;
  }, []);

  const setActionStatus = useCallback((messageId: string, actionIndex: number, status: 'applied' | 'dismissed') => {
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId || !m.proposedActions) return m;
      const next = m.proposedActions.map((a, i) => i === actionIndex ? { ...a, status } : a);
      return { ...m, proposedActions: next };
    }));
  }, []);

  const applyProposedAction = useCallback((messageId: string, actionIndex: number) => {
    const target = messages.find(m => m.id === messageId);
    const action = target?.proposedActions?.[actionIndex];
    if (!action || action.status && action.status !== 'pending') return;

    if (action.type === 'sugerir_destinos') {
      const cidades: string[] = Array.isArray((action.params as any)?.cidades)
        ? (action.params as any).cidades
        : [];
      const valid = cidades.filter((c) =>
        CURATED_CITIES.some((cc) => cc.toLowerCase() === String(c).toLowerCase())
      );
      if (valid.length === 0) { toast.error('Não reconheci esses destinos.'); return; }
      setSuggestedDestinations(valid);
      setActionStatus(messageId, actionIndex, 'applied');
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-ack`,
        role: 'assistant',
        content: `🗺️ Acendi ${valid.join(', ')} no mapa em dourado — vai na aba Planejar e toca na sua escolhida!`,
        timestamp: new Date(),
      }]);
      setIsOpen(false);
      return;
    }

    const handlers = actionHandlersRef.current;
    if (!handlers) {
      toast.error('Abre uma viagem para eu aplicar essa ação.');
      return;
    }

    let confirmationText: string | null = null;
    try {
      switch (action.type) {
        case 'trocar_atividade':
          confirmationText = handlers.trocar_atividade?.(action.params as any) ?? null;
          break;
        case 'ajustar_horario':
          confirmationText = handlers.ajustar_horario?.(action.params as any) ?? null;
          break;
        case 'remover_atividade':
          confirmationText = handlers.remover_atividade?.(action.params as any) ?? null;
          break;
        case 'confirmar_item':
          confirmationText = handlers.confirmar_item?.(action.params as any) ?? null;
          break;
        case 'adicionar_atividade':
          confirmationText = handlers.adicionar_atividade?.(action.params as any) ?? null;
          break;
      }
    } catch (err) {
      console.error('Erro ao aplicar ação KINU:', err);
      toast.error('Não consegui aplicar essa ação.');
      return;
    }

    if (!confirmationText) {
      toast.error('Não achei o item pra aplicar essa mudança.');
      return;
    }

    setActionStatus(messageId, actionIndex, 'applied');
    const confirmation: KinuMessage = {
      id: `msg-${Date.now()}-ack`,
      role: 'assistant',
      content: confirmationText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, confirmation]);
    setIsOpen(false);
  }, [messages, setActionStatus, setIsOpen, setSuggestedDestinations]);


  const dismissProposedAction = useCallback((messageId: string, actionIndex: number) => {
    setActionStatus(messageId, actionIndex, 'dismissed');
    const rejection: KinuMessage = {
      id: `msg-${Date.now()}-rejected`,
      role: 'assistant',
      content: '(Proposta recusada pelo usuário — nada foi alterado no roteiro.)',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, rejection]);
  }, [setActionStatus, setMessages]);

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
        applyProposedAction,
        dismissProposedAction,
        registerActionHandlers,
        suggestedDestinations,
        clearSuggestedDestinations,
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
