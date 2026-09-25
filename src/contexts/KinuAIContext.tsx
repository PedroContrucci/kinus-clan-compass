import { tipsForAgent } from '@/lib/claTips';
import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";
import { KinuMessage, KinuTripContext, KinuInsight, EMERGENCY_KEYWORDS, ProposedAction, ProposedActionType, TripPhase, KinuTodayStop } from "@/types/kinuAI";
import { curatedCoordOf, resolveHotelCoord } from "@/lib/routeCoords";
import { trackEvent } from "@/lib/kinuEvents";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CURATED_CITIES } from "@/lib/curatedCities";
import { destinationActivities } from "@/data/destinationActivities";
import { getCuratedHotels } from "@/data/curatedHotels";
import { findCityInfo } from "@/data/destinationCatalog";
import { kinuAuthHeaders } from "@/lib/kinuAuthHeader";
import { buildDraftTrip } from "@/lib/createTrip";
import { addTrip, type StoredTrip } from "@/lib/tripStore";
import { trackTripCreated } from "@/lib/tripEvents";
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
  return data.activities.slice(0, 80).map((a) => ({
    name: a.name,
    category: a.category,
    neighborhood: a.neighborhood,
    costBRL: a.estimatedCostBRL,
    tip: (a.tips ?? []).slice(0, 2).join(' · '),
  }));
}

/** Hotéis curados da cidade no formato enviado ao agente. null = cidade sem curadoria de hotel. */
function buildCuratedHotels(city: string) {
  const hotels = getCuratedHotels(city);
  if (!hotels) return null;
  return hotels.map((h) => ({
    name: h.name,
    zone: h.zone,
    tier: h.tier,
    personaTags: h.personaTags,
    priceRangeBRL: h.priceRangeBRL,
    tips: h.tips.slice(0, 2),
  }));
}

/** A data de hoje em ISO local (não UTC — a virada do dia é a do usuário, não a de Greenwich). */
function isoToday(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** A fase é derivada da data, nunca guardada: antes < início ≤ durante ≤ fim < depois. */
export function computeTripPhase(
  startDate?: string,
  endDate?: string,
  today: string = isoToday()
): TripPhase | undefined {
  const start = (startDate ?? '').slice(0, 10);
  const end = (endDate ?? '').slice(0, 10);
  if (!start || !end) return undefined;
  if (today < start) return 'antes';
  if (today > end) return 'depois';
  return 'durante';
}

function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(`${fromIso}T00:00:00`);
  const b = new Date(`${toIso}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/**
 * O recorte "durante": fase, dia corrente (0-based), plano de hoje e hotel.
 * Coordenada só quando curada (casamento por id, como no mapa) — nunca geocoding aqui.
 */
export function buildDuranteContext(ctx: KinuTripContext | null, today: string = isoToday()) {
  if (!ctx) return null;
  const phase = computeTripPhase(ctx.startDate, ctx.endDate, today);
  if (!phase) return null;
  if (phase !== 'durante') return { tripPhase: phase } as Partial<KinuTripContext>;

  const currentDayIndex = Math.max(0, daysBetween(String(ctx.startDate).slice(0, 10), today));
  const day = (ctx.itineraryActivities ?? []).find((d) => d.day === currentDayIndex + 1);
  const todayPlan: KinuTodayStop[] = (day?.activities ?? []).slice(0, 20).map((a) => {
    const coord = curatedCoordOf(a.id);
    return {
      time: a.time,
      name: a.name,
      category: a.category,
      status: a.status,
      neighborhood: a.neighborhood,
      ...(coord ? { lat: coord.lat, lng: coord.lng } : {}),
    };
  });

  let todayHotel: KinuTripContext['todayHotel'];
  if (ctx.hotelName) {
    const coord = resolveHotelCoord(undefined, ctx.hotelName, ctx.destination);
    todayHotel = {
      name: ctx.hotelName,
      neighborhood: ctx.hotelNeighborhood,
      ...(coord ? { lat: coord.lat, lng: coord.lng } : {}),
    };
  }

  return { tripPhase: phase, currentDayIndex, todayDate: today, todayPlan, todayHotel } as Partial<KinuTripContext>;
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
  setWizardPrefill: (prefill: { destino: string; data_ida: string; data_volta: string; viajantes: number } | null) => void;
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

  // Cidade curada "pegajosa": última cidade detectada na conversa. Mensagens de
  // follow-up ("e pra jantar?") não repetem o nome da cidade — sem isso o catálogo
  // deixava de ser injetado e o agente perdia a fonte da verdade no meio do papo.
  const stickyCuratedCityRef = useRef<string | null>(null);


  // Abertura do chat com a viagem acontecendo: um evento por dia por viagem.
  // A guarda vive no localStorage porque o fato é "já contei hoje", não estado de tela.
  useEffect(() => {
    if (!isOpen || !tripContext) return;
    const durante = buildDuranteContext(tripContext);
    if (!durante || durante.tripPhase !== 'durante') return;
    const tripId = tripContext.tripId ?? tripContext.destination ?? 'sem-id';
    const key = `kinu_durante_opened:${tripId}:${durante.todayDate}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
    } catch { /* storage indisponível: melhor contar duas vezes que quebrar o chat */ }
    trackEvent('kinu_ai.durante_opened', { trip_id: tripId, day: durante.currentDayIndex });
  }, [isOpen, tripContext]);

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

      // Detecção explícita (mensagem) ou viagem ativa têm prioridade e sobrescrevem a
      // pegajosa; só caímos nela quando não há nem uma nem outra.
      const hasActiveTrip = Boolean(tripContext?.destination);
      const detectedCity = detectCuratedCity(content, tripContext?.destination);
      if (detectedCity) {
        stickyCuratedCityRef.current = detectedCity;
      } else if (hasActiveTrip) {
        // Viagem ativa para destino fora do catálogo: injetar a cidade antiga seria pior
        // que não injetar nada.
        stickyCuratedCityRef.current = null;
      }
      const curatedCity = detectedCity ?? (hasActiveTrip ? null : stickyCuratedCityRef.current);
      const curatedCatalog = curatedCity ? buildCuratedCatalog(curatedCity) : null;
      const curatedHotelList = curatedCity ? buildCuratedHotels(curatedCity) : null;
      // Dicas vivas do clã: cidade detectada ou da viagem ativa. Cache por sessão; nunca lança.
      const tipsCity = curatedCity ?? detectCuratedCity(tripContext?.destination ?? '', tripContext?.destination);
      const claTips = tipsCity ? (await tipsForAgent(tipsCity)).slice(0, 40) : [];

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
        // Arco 5.d: identidade em modo sombra. Anônimo devolve {} e nada muda.
        headers: await kinuAuthHeaders(),
        body: {
          message: content,
          // O recorte "durante" é calculado no envio: fase, dia corrente e plano de hoje.
          context: tripContext ? { ...tripContext, ...(buildDuranteContext(tripContext) ?? {}) } : tripContext,
          history,
          isEmergency,
          curatedCityNames: CURATED_CITIES,
          curatedCatalog: curatedCatalog
            ? { city: curatedCity, items: curatedCatalog, hotels: curatedHotelList ?? undefined }
            : undefined,
          itineraryDays,
          claTips: claTips.length > 0 ? claTips : undefined,
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
    stickyCuratedCityRef.current = null;
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

          const stored = trip as StoredTrip;
          stored.createdVia = 'kinu';
          stored.childrenCount = 0; // o chat não pergunta por crianças (`children: []` acima)

          // Funil único: read-modify-write contra o storage + notifica os assinantes.
          // Os dois campos são setados ANTES e sobrevivem — StoredTrip preserva campos extras.
          addTrip(stored);
          trackTripCreated(stored, 'kinu_ai');

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
        setWizardPrefill,
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
