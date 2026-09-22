export type ProposedActionType =
  | 'trocar_atividade'
  | 'ajustar_horario'
  | 'remover_atividade'
  | 'confirmar_item'
  | 'adicionar_atividade'
  | 'sugerir_destinos'
  | 'navegar_para'
  | 'criar_viagem'
  | 'verificar_ofertas';

export interface ProposedAction {
  type: ProposedActionType;
  params: Record<string, any>;
  status?: 'pending' | 'working' | 'applied' | 'dismissed';
}

export interface KinuMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isEmergency?: boolean;
  proposedActions?: ProposedAction[];
}

/** Onde a viagem está no tempo — calculado da data de hoje, nunca guardado na viagem. */
export type TripPhase = 'antes' | 'durante' | 'depois';

/** Uma parada do dia como o agente precisa ver: horário, nome, status e, quando curada, coordenada. */
export interface KinuTodayStop {
  time?: string;
  name: string;
  category?: string;
  status?: string;
  neighborhood?: string;
  lat?: number;
  lng?: number;
}

/** Atividade crua de um dia do roteiro, enviada pela tela para o contexto do agente. */
export interface KinuDayActivity {
  id?: string;
  time?: string;
  name: string;
  category?: string;
  status?: string;
  neighborhood?: string;
}

export interface KinuTripContext {
  /** Dias com atividades detalhadas — base do PLANO DE HOJE no modo DURANTE. */
  itineraryActivities?: Array<{ day: number; date: string; activities: KinuDayActivity[] }>;
  /** Calculados no envio (KinuAIContext), nunca setados pela tela. */
  tripPhase?: TripPhase;
  currentDayIndex?: number;
  todayDate?: string;
  todayPlan?: KinuTodayStop[];
  todayHotel?: { name: string; neighborhood?: string; lat?: number; lng?: number };
  destination?: string;
  country?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  budgetUsed?: number;
  travelStyle?: string;
  travelers?: number;
  activities?: string[];
  daysUntilTrip?: number;
  hotelName?: string;
  hotelNeighborhood?: string;
  jetLagSeverity?: string;
  checklistProgress?: number;
  confirmedActivities?: number;
  totalActivities?: number;
  flightConfirmed?: boolean;
  hotelConfirmed?: boolean;
  interests?: string[];
  flightDuration?: string;
  itineraryDays?: Array<{ day: number; date: string; items: string[] }>;
  activeTab?: string;
}

export interface KinuInsight {
  id: string;
  type: "weather" | "economy" | "exchange" | "cultural" | "safety" | "tip";
  title: string;
  message: string;
  priority: "low" | "medium" | "high";
  actionLabel?: string;
  onAction?: () => void;
  dismissable: boolean;
}

export interface KinuQuickAction {
  id: string;
  label: string;
  icon: string;
  prompt: string;
}

export const KINU_QUICK_ACTIONS: KinuQuickAction[] = [
  {
    id: "destination-tips",
    label: "Dicas do destino",
    icon: "🗺️",
    prompt: "Me dá um overview do destino: o que não posso perder, o que devo evitar, e dicas de locais pra comer bem gastando pouco.",
  },
  {
    id: "emergencies",
    label: "Emergências",
    icon: "🚨",
    prompt: "Quais são os telefones de emergência, hospitais e embaixada brasileira mais próximos do meu destino?",
  },
  {
    id: "save-money",
    label: "Economizar",
    icon: "💰",
    prompt: "Me dá dicas específicas de como economizar nessa viagem sem perder qualidade.",
  },
  {
    id: "weather",
    label: "Clima",
    icon: "🌤️",
    prompt: "Como vai estar o clima durante os dias da minha viagem? O que devo levar de roupa?",
  },
  {
    id: "what-now",
    label: "O que fazer agora?",
    icon: "🎯",
    prompt: "Baseado no meu roteiro, o que você sugere que eu faça agora?",
  },
];

export const EMERGENCY_KEYWORDS = [
  "emergência",
  "emergencia",
  "hospital",
  "perdi",
  "roubaram",
  "roubado",
  "socorro",
  "ajuda urgente",
  "polícia",
  "policia",
  "acidente",
  "perigo",
];
