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
import { kinuAuthHeaders } from "@/lib/kinuAuthHeader";
import { buildDraftTrip } from "@/lib/createTrip";
import { addTrip, listTrips, type StoredTrip } from "@/lib/tripStore";
import { finishFlowTrip, kinuDidLines } from "@/lib/onboardingFlow";
import { agentCity, nearestCatalogCities, planFromAgent } from "@/lib/destinationPicker";
import { readCachedPrefs } from "@/lib/onboarding";
import { razaoLines, razaoTotals } from "@/lib/razaoLines";
import { trackTripCreated } from "@/lib/tripEvents";
import { getAllCities } from "@/data/destinationCatalog";

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

// ---------------------------------------------------------------------------
// C.6 — o agente sempre sabe o que a pessoa tem na conta. Tudo derivado do gravado.
// ---------------------------------------------------------------------------

/** Sentinela da sessão do chat: o usuário pediu pergunta "geral" (espelha NO_TRIP da function). */
export const NO_TRIP = 'none';

export interface KinuAccountTrip {
  id: string;
  destination: string;
  dates: { start: string; end: string };
  status: 'active' | 'draft';
  travelers: number;
  budget: number;
  summary: string;
}

export interface KinuAccount {
  profile: { name?: string; origin?: string };
  trips: KinuAccountTrip[];
  activeTripId?: string;
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** "10–15/nov" · "28/out–03/nov" — mesmo formato do dateRangeLabel da function. */
function dateRangeLabel(start: string, end: string): string {
  const [, sm, sd] = (start ?? '').slice(0, 10).split('-');
  const [, em, ed] = (end ?? '').slice(0, 10).split('-');
  if (!sd || !ed) return '';
  return sm === em ? `${sd}–${ed}/${MONTHS[Number(em) - 1]}` : `${sd}/${MONTHS[Number(sm) - 1]}–${ed}/${MONTHS[Number(em) - 1]}`;
}

/** Chip/ack: "Fortaleza 10–15/nov" · "Lisboa (rascunho)". */
export function tripChipLabel(trip: { destination: string; status?: string; startDate?: string; endDate?: string }): string {
  if (trip.status === 'draft') return `${trip.destination} (rascunho)`;
  const range = dateRangeLabel(trip.startDate ?? '', trip.endDate ?? '');
  return range ? `${trip.destination} ${range}` : trip.destination;
}

/** Voo escolhido · hotel · N dias · Planejado — só linhas que o app já mostra. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function tripSummary(trip: any): string {
  const parts: string[] = [];
  try { parts.push(kinuDidLines(trip).flight); } catch { /* viagem torta: sem linha de voo */ }
  if (trip.accommodation?.name) parts.push(`Hotel ${trip.accommodation.name}`);
  const days = Array.isArray(trip.days) ? trip.days.length : 0;
  if (days) parts.push(`${days} dias`);
  try {
    const planned = razaoTotals(razaoLines(trip)).planned;
    if (planned > 0) parts.push(`Planejado R$ ${Math.round(planned).toLocaleString('pt-BR')}`);
  } catch { /* idem */ }
  return parts.join(' · ');
}

/** Viagens que a conta mostra ao agente: ativas e rascunhos (concluídas ficam fora). */
export function accountTripsOf(trips: StoredTrip[]): StoredTrip[] {
  return trips.filter((t) => t && t.destination && (t.status === 'draft' || t.status === 'active' || t.status === 'ongoing'));
}

/** Origem padrão só quando NÃO foi assumida (originSource !== 'default'). */
function profileOrigin(trips: StoredTrip[]): string | undefined {
  const t = trips.find((x) => x.origin && x.originSource && x.originSource !== 'default');
  return t?.origin;
}

/**
 * O `account` de toda chamada. activeTripId só se o chat foi aberto de dentro de uma
 * viagem ou se o usuário escolheu na conversa — NUNCA deduzido de "só tem uma".
 */
export function buildAccountPayload(
  allTrips: StoredTrip[],
  opts: { profileName?: string; openTripId?: string; chosenTripId?: string | null },
): KinuAccount {
  const trips = accountTripsOf(allTrips).slice(0, 8);
  const activeTripId = opts.openTripId || opts.chosenTripId || undefined;
  return {
    profile: {
      ...(opts.profileName ? { name: opts.profileName } : {}),
      ...(profileOrigin(allTrips) ? { origin: profileOrigin(allTrips) } : {}),
    },
    trips: trips.map((t) => ({
      id: t.id,
      destination: t.destination,
      dates: { start: String(t.startDate ?? '').slice(0, 10), end: String(t.endDate ?? '').slice(0, 10) },
      status: t.status === 'draft' ? 'draft' : 'active',
      travelers: Number(t.travelers) || 1,
      budget: Number(t.budget) || 0,
      summary: tripSummary(t),
    })),
    ...(activeTripId ? { activeTripId } : {}),
  };
}

const normTxt = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/**
 * Resposta digitada à pergunta "qual viagem?": 'geral'/'nenhuma' → NO_TRIP; cita o destino
 * de exatamente uma viagem → o id dela; senão null (o gate pergunta de novo).
 */
export function tripChoiceFromMessage(message: string, trips: { id: string; destination: string }[]): string | null {
  const m = normTxt(message);
  if (/\b(geral|nenhuma)\b/.test(m)) return NO_TRIP;
  const hits = trips.filter((t) => m.includes(normTxt(t.destination)));
  if (hits.length === 1) return hits[0].id;
  if (hits.length > 1) return null;
  // C.10.1: cita uma cidade do catálogo que não é destino de nenhuma viagem → planejar algo novo.
  const tripDest = trips.map((t) => normTxt(t.destination));
  const cited = getAllCities().some(({ name }) => {
    const c = normTxt(name);
    const esc = c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z0-9])${esc}($|[^a-z0-9])`).test(m) && !tripDest.some((d) => d.includes(c));
  });
  return cited ? NO_TRIP : null;
}

/** Nome do perfil: mesma cascata do useAuth (name → full_name → nome). */
async function profileName(): Promise<string | undefined> {
  try {
    const { data } = await supabase.auth.getSession();
    const meta = (data.session?.user?.user_metadata ?? {}) as Record<string, unknown>;
    return [meta.name, meta.full_name, meta.nome]
      .map((v) => (typeof v === 'string' ? v.trim() : ''))
      .find((v) => v.length > 0);
  } catch {
    return undefined;
  }
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
  /** C.10: abre o chat no modo "planejar" (mensagem de abertura do assistente). */
  openPlanning: () => void;
  /** C.6: viagens da conta (ativas + rascunhos) — os chips do chat global. */
  accountTrips: StoredTrip[];
  /** C.6: escolha da sessão do chat (id ou NO_TRIP). */
  chosenTripId: string | null;
  chooseTrip: (id: string) => void;
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

  // C.6: viagem escolhida NA CONVERSA (chip ou resposta digitada). Vive na sessão do chat.
  const [chosenTripId, setChosenTripId] = useState<string | null>(null);
  const [accountTrips, setAccountTrips] = useState<StoredTrip[]>([]);
  useEffect(() => {
    if (isOpen) setAccountTrips(accountTripsOf(listTrips()));
  }, [isOpen]);

  const chooseTrip = useCallback((id: string) => {
    setChosenTripId(id);
    const trip = id === NO_TRIP ? null : accountTripsOf(listTrips()).find((t) => t.id === id);
    const content = trip
      ? `Beleza — sobre sua viagem a ${tripChipLabel(trip)}. O que você quer saber?`
      : 'Beleza — pergunta geral, sem viagem. O que você quer saber?';
    setMessages((prev) => [...prev, { id: `msg-${Date.now()}-choice`, role: 'assistant', content, timestamp: new Date() }]);
  }, []);


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

      // C.6: o estado da conta vai em TODA chamada. Com 2+ viagens e nenhuma escolhida,
      // a resposta digitada à pergunta "qual?" vira a escolha da sessão.
      const allTrips = listTrips();
      const visible = accountTripsOf(allTrips);
      // C.7 (0b): os chips seguem a conta de agora (viagem criada com o chat aberto entra).
      setAccountTrips(visible);
      let chosen = chosenTripId;
      if (!tripContext?.tripId && !chosen && visible.length >= 2) {
        chosen = tripChoiceFromMessage(content, visible);
        if (chosen) setChosenTripId(chosen);
      }
      const account = buildAccountPayload(allTrips, {
        profileName: await profileName(),
        openTripId: tripContext?.tripId,
        chosenTripId: chosen,
      });
      // Viagem escolhida (não aberta) alimenta o catálogo/dicas como se fosse a ativa.
      const chosenTrip = !tripContext?.destination && chosen && chosen !== NO_TRIP
        ? visible.find((t) => t.id === chosen)
        : undefined;
      const focusDestination = tripContext?.destination ?? chosenTrip?.destination;

      // Detecção explícita (mensagem) ou viagem ativa têm prioridade e sobrescrevem a
      // pegajosa; só caímos nela quando não há nem uma nem outra.
      const hasActiveTrip = Boolean(focusDestination);
      const detectedCity = detectCuratedCity(content, focusDestination);
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
      const tipsCity = curatedCity ?? detectCuratedCity(focusDestination ?? '', focusDestination);
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
          account,
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
        friendlyMessage = "Estou com um problema de conexão com meu cérebro. Avisa o Pedro que ele resolve rapidinho! 🔧";
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
  }, [messages, tripContext, checkForEmergency, chosenTripId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setIsEmergencyMode(false);
    stickyCuratedCityRef.current = null;
    setChosenTripId(null);
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

  // C.10: porta "Planejar com o KINU AI". A abertura é fala DO ASSISTENTE, local (sem chamar a
  // function); nada é atribuído ao usuário. O agente pergunta só o que faltar e emite criar_viagem.
  const openPlanning = useCallback(() => {
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}-planejar`,
      role: 'assistant',
      content: 'Bora planejar! 🧭 Para onde você quer ir? Se já souber, me conta também as datas e quem vai.',
      timestamp: new Date(),
    }]);
    // C.10.1: planejar nova viagem é sempre "geral" — o gate "qual viagem?" não entra.
    setChosenTripId(NO_TRIP);
    setIsOpen(true);
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
      const destino = String(p.destino ?? '').trim();
      // C.10: destino fora da lista do agente → recusa honesta com as mais próximas do catálogo (sem toast).
      if (destino && !agentCity(destino)) {
        setActionStatus(messageId, actionIndex, 'dismissed');
        setMessages(prev => [...prev, {
          id: `msg-${Date.now()}-fora`,
          role: 'assistant',
          content: `Ainda não cubro ${destino} por aqui. As mais próximas do catálogo verificado: ${nearestCatalogCities(destino).join(', ')}. Quer seguir com uma delas?`,
          timestamp: new Date(),
        }]);
        return;
      }
      // O MESMO DraftTripInput do fluxo curto (buildFlowInput); origem = home_city do perfil.
      const plan = planFromAgent(p, (readCachedPrefs() as Record<string, unknown>).home_city);
      if (!plan) {
        toast.error('Não consegui montar essa viagem — dados incompletos.');
        return;
      }
      const cityMatch = plan.input.destinationCity;
      const adults = plan.input.adults;
      const data_ida = String(p.data_ida);
      const data_volta = String(p.data_volta);
      setActionStatus(messageId, actionIndex, 'applied');

      (async () => {
        try {
          const trip = await buildDraftTrip(plan.input);
          const stored = finishFlowTrip(trip as StoredTrip, {
            cap: plan.cap, children: 0, originSource: plan.origin.source, createdVia: 'kinu',
          });

          // Funil único: read-modify-write contra o storage + notifica os assinantes.
          addTrip(stored);
          trackTripCreated(stored, 'kinu_ai');

          // A viagem abre no rascunho → card "O que o KINU fez".
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
        openPlanning,
        accountTrips,
        chosenTripId,
        chooseTrip,
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
