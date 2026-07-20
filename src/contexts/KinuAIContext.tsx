import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";
import { KinuMessage, KinuTripContext, KinuInsight, EMERGENCY_KEYWORDS, ProposedAction, ProposedActionType } from "@/types/kinuAI";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CURATED_CITIES } from "@/lib/curatedCities";
import { destinationActivities } from "@/data/destinationActivities";
import { findCityInfo } from "@/data/destinationCatalog";
import { buildDraftTrip } from "@/lib/createTrip";
import { TRAVEL_INTERESTS, PRIORITY_OPTIONS } from "@/components/wizard/types";

export interface KinuActionHandlers {
  trocar_atividade?: (params: { dia: number; atividade_atual: string; nova_atividade: string }) => string | null | Promise<string | null>;
  ajustar_horario?: (params: { dia: number; atividade: string; novo_horario: string }) => string | null | Promise<string | null>;
  remover_atividade?: (params: { dia: number; atividade: string }) => string | null | Promise<string | null>;
  confirmar_item?: (params: { tipo: 'voo' | 'hotel' }) => string | null | Promise<string | null>;
  adicionar_atividade?: (params: { dia: number; atividade: string; horario: string }) => string | null | Promise<string | null>;
  verificar_ofertas?: (params: Record<string, never>) => string | null | Promise<string | null>;
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
  pendingNavigation: { destino: string; ts: number; tripId?: string } | null;
  clearPendingNavigation: () => void;
  wizardPrefill: { destino: string; data_ida: string; data_volta: string; viajantes: number } | null;
  clearWizardPrefill: () => void;
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
  const [pendingNavigation, setPendingNavigation] = useState<{ destino: string; ts: number; tripId?: string } | null>(null);
  const [wizardPrefill, setWizardPrefill] = useState<{ destino: string; data_ida: string; data_volta: string; viajantes: number } | null>(null);


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

  const clearPendingNavigation = useCallback(() => {
    setPendingNavigation(null);
  }, []);

  const clearWizardPrefill = useCallback(() => {
    setWizardPrefill(null);
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

  const setActionStatus = useCallback((messageId: string, actionIndex: number, status: 'pending' | 'working' | 'applied' | 'dismissed') => {
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId || !m.proposedActions) return m;
      const next = m.proposedActions.map((a, i) => i === actionIndex ? { ...a, status } : a);
      return { ...m, proposedActions: next };
    }));
  }, []);

  const applyProposedAction = useCallback(async (messageId: string, actionIndex: number) => {
    const target = messages.find(m => m.id === messageId);
    const action = target?.proposedActions?.[actionIndex];
    if (!action || action.status && action.status !== 'pending') return;

    if (action.type === 'navegar_para') {
      const destino = String((action.params as any)?.destino ?? '').toLowerCase();
      const valid = ['painel', 'roteiro', 'financeiro', 'preparacao', 'planejar'];
      if (!valid.includes(destino)) { toast.error('Destino de navegação inválido.'); return; }
      setPendingNavigation({ destino, ts: Date.now() });
      setActionStatus(messageId, actionIndex, 'applied');
      setIsOpen(false);
      return;
    }

    if (action.type === 'criar_viagem') {
      const p = (action.params as any) ?? {};
      const destino = String(p.destino ?? '');
      const data_ida = String(p.data_ida ?? '');
      const data_volta = String(p.data_volta ?? '');
      const viajantes = Number(p.viajantes);
      const estilo = String(p.estilo ?? '').toLowerCase();
      const interessesRaw: string[] = Array.isArray(p.interesses) ? p.interesses.map(String) : [];
      const prioridadesRaw: string[] = Array.isArray(p.prioridades) ? p.prioridades.map(String) : [];
      const orcamentoTotal = Number(p.orcamento_total);
      const cityMatch = CURATED_CITIES.find((c) => c.toLowerCase() === destino.toLowerCase());
      const dateRe = /^\d{4}-\d{2}-\d{2}$/;
      if (!cityMatch || !dateRe.test(data_ida) || !dateRe.test(data_volta) || !Number.isFinite(viajantes) || viajantes < 1) {
        toast.error('Não consegui montar essa viagem — dados incompletos.');
        return;
      }
      const adults = Math.max(1, Math.floor(viajantes));
      const parseDate = (s: string) => {
        const [y, m, d] = s.split('-').map(Number);
        return new Date(y, (m || 1) - 1, d || 1);
      };
      const departureDate = parseDate(data_ida);
      const returnDate = parseDate(data_volta);

      // Map estilo → wizard tier
      let budgetTier: 'backpacker' | 'economic' | 'comfort' | 'luxury' = 'comfort';
      if (estilo.includes('econom')) budgetTier = 'economic';
      else if (estilo.includes('premium') || estilo.includes('luxo') || estilo.includes('luxury')) budgetTier = 'luxury';

      // Fuzzy matching helper (normalized, lowercase, accent-insensitive)
      const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      const fuzzyMatch = <T extends { id: string; label: string }>(inputs: string[], options: readonly T[]): string[] => {
        const result: string[] = [];
        for (const raw of inputs) {
          const n = norm(raw);
          if (!n) continue;
          for (const opt of options) {
            const nid = norm(opt.id);
            const nlabel = norm(opt.label);
            if (nid.includes(n) || n.includes(nid) || nlabel.includes(n) || n.includes(nlabel)) {
              if (!result.includes(opt.id)) result.push(opt.id);
            }
          }
        }
        return result;
      };

      const travelInterests = fuzzyMatch(interessesRaw, TRAVEL_INTERESTS as any);
      const priorities = fuzzyMatch(prioridadesRaw, PRIORITY_OPTIONS as any);
      const budgetAmount = Number.isFinite(orcamentoTotal) && orcamentoTotal > 0 ? orcamentoTotal : 0;

      const info = findCityInfo(cityMatch);
      setActionStatus(messageId, actionIndex, 'applied');

      (async () => {
        try {
          const trip = await buildDraftTrip({
            originCity: 'São Paulo',
            originAirportCode: 'GRU',
            destinationCity: cityMatch,
            destinationAirportCode: info?.city.airports?.[0],
            destinationTimezoneId: info?.city.timezone,
            destinationTimezone: info?.city.timezone,
            selectedCountry: info?.country.country,
            hasDirectFlight: false,
            departureDate,
            returnDate,
            adults,
            children: [],
            infants: 0,
            budgetTier,
            travelStyle: budgetTier,
            budgetAmount,
            travelInterests,
            priorities,
            biologyAIEnabled: true,
          });

          (trip as any).createdVia = 'kinu';

          const existingTrips = JSON.parse(localStorage.getItem('kinu_trips') || '[]');
          existingTrips.push(trip);
          localStorage.setItem('kinu_trips', JSON.stringify(existingTrips));

          setPendingNavigation({ destino: 'painel', ts: Date.now(), tripId: trip.id });
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}-ack`,
            role: 'assistant',
            content: `✈️ Rascunho de ${cityMatch} criado — revisa o roteiro e ativa quando estiver do seu jeito!`,
            timestamp: new Date(),
          }]);
          setIsOpen(false);
        } catch (err) {
          console.error('[criar_viagem] buildDraftTrip failed, falling back to wizard prefill', err);
          setWizardPrefill({ destino: cityMatch, data_ida, data_volta, viajantes: adults });
          setMessages(prev => [...prev, {
            id: `msg-${Date.now()}-ack`,
            role: 'assistant',
            content: '🧭 Preparei o wizard com tudo que conversamos — revisa e confirma!',
            timestamp: new Date(),
          }]);
          setIsOpen(false);
        }
      })();
      return;
    }


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

    setActionStatus(messageId, actionIndex, 'working');
    let confirmationText: string | null = null;
    try {
      switch (action.type) {
        case 'trocar_atividade':
          confirmationText = (await handlers.trocar_atividade?.(action.params as any)) ?? null;
          break;
        case 'ajustar_horario':
          confirmationText = (await handlers.ajustar_horario?.(action.params as any)) ?? null;
          break;
        case 'remover_atividade':
          confirmationText = (await handlers.remover_atividade?.(action.params as any)) ?? null;
          break;
        case 'confirmar_item':
          confirmationText = (await handlers.confirmar_item?.(action.params as any)) ?? null;
          break;
        case 'adicionar_atividade':
          confirmationText = (await handlers.adicionar_atividade?.(action.params as any)) ?? null;
          break;
        case 'verificar_ofertas':
          confirmationText = (await handlers.verificar_ofertas?.(action.params as any)) ?? null;
          break;
      }
    } catch (err) {
      console.error('Erro ao aplicar ação KINU:', err);
      toast.error('Não consegui aplicar essa ação.');
      setActionStatus(messageId, actionIndex, 'pending');
      return;
    }

    if (!confirmationText) {
      toast.error('Não achei o item pra aplicar essa mudança.');
      setActionStatus(messageId, actionIndex, 'pending');
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
        pendingNavigation,
        clearPendingNavigation,
        wizardPrefill,
        clearWizardPrefill,
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
