export type TripStatus = 'draft' | 'active' | 'ongoing' | 'completed';
export type ActivityStatus = 'planned' | 'bidding' | 'confirmed' | 'cancelled';
export type ActivityCategory = 'voo' | 'hotel' | 'passeio' | 'comida' | 'transporte' | 'compras';

export interface TimezoneInfo {
  origin: string;
  destination: string;
  diff: number; // hours difference
}

export interface Offer {
  id: string;
  provider: string;
  price: number;
  originalPrice?: number;
  details: string;
  rating?: number;
  reviewCount?: number;
  features?: string[];
  link: string;
}

export interface AuctionData {
  targetPrice: number;
  estimatedPrice: number;
  offers: Offer[];
  acceptedOffer?: Offer;
  startedAt?: string;
}

export interface FlightCard {
  id: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: number;
  status: ActivityStatus;
  confirmationLink?: string;
}

export interface HotelCard {
  id: string;
  name: string;
  stars: number;
  checkIn: string;
  checkOut: string;
  nightlyRate: number;
  totalNights: number;
  totalPrice: number;
  status: ActivityStatus;
  confirmationLink?: string;
}

export interface TripActivity {
  id: string;
  time: string;
  name: string;
  description: string;
  duration: string;
  cost: number;
  type: string;
  status: ActivityStatus;
  paidAmount?: number;
  confirmationLink?: string;
  category?: ActivityCategory;
  jetLagFriendly?: boolean;
  auction?: AuctionData;
}

export interface TripDay {
  day: number;
  date?: string;
  title: string;
  icon: string;
  activities: TripActivity[];
}

export interface CategoryBudget {
  planned: number;
  confirmed: number;
  bidding: number;
}

export interface TripFinances {
  total: number;
  confirmed: number;
  bidding: number;
  planned: number;
  available: number;
  categories: {
    flights: CategoryBudget;
    accommodation: CategoryBudget;
    tours: CategoryBudget;
    food: CategoryBudget;
    transport: CategoryBudget;
    shopping: CategoryBudget;
  };
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  category: 'documentos' | 'reservas' | 'packing' | 'pre-viagem';
}

export interface SavedTrip {
  id: string;
  status: TripStatus;
  destination: string;
  country: string;
  emoji: string;
  startDate: string;
  endDate: string;
  budget: number;
  budgetType: string;
  travelers: number;
  priorities: string[];
  progress: number;
  timezone?: TimezoneInfo;
  jetLagMode?: boolean;
  flights?: {
    outbound?: FlightCard;
    return?: FlightCard;
  };
  accommodation?: HotelCard;
  days: TripDay[];
  finances: TripFinances;
  checklist: ChecklistItem[];
  createdAt: string;
}

export interface TripData {
  destination: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  travelers: number;
  travelType: string;
  budgetAmount: number;
  budgetType: string;
  priorities: string[];
}

// Timezone database (simplified)
export const timezoneOffsets: Record<string, number> = {
  'Brasil': -3,
  'São Paulo': -3,
  'Paris': 1,
  'França': 1,
  'Tóquio': 9,
  'Japão': 9,
  'Lisboa': 0,
  'Portugal': 0,
  'Barcelona': 1,
  'Espanha': 1,
  'Roma': 1,
  'Itália': 1,
  'Bali': 8,
  'Indonésia': 8,
  'Nova York': -5,
  'EUA': -5,
  'Santorini': 2,
  'Grécia': 2,
  'Amsterdã': 1,
  'Holanda': 1,
  'Marrakech': 1,
  'Marrocos': 1,
  'Londres': 0,
  'Inglaterra': 0,
  'Dubai': 4,
  'Emirados': 4,
  'Sydney': 10,
  'Austrália': 10,
  'Bangkok': 7,
  'Tailândia': 7,
};

export const calculateTimezone = (origin: string, destination: string): TimezoneInfo => {
  const originOffset = timezoneOffsets[origin] ?? -3; // Default to Brazil
  const destOffset = timezoneOffsets[destination] ?? 0;
  const diff = destOffset - originOffset;
  
  return {
    origin,
    destination,
    diff,
  };
};

export const shouldActivateJetLagMode = (timezoneDiff: number): boolean => {
  return Math.abs(timezoneDiff) >= 5;
};

export const defaultChecklist: ChecklistItem[] = [
  // Documentos
  { id: 'doc-1', label: 'Passaporte válido', checked: false, category: 'documentos' },
  { id: 'doc-2', label: 'Visto (se necessário)', checked: false, category: 'documentos' },
  { id: 'doc-3', label: 'Seguro viagem', checked: false, category: 'documentos' },
  { id: 'doc-4', label: 'Cópias de documentos', checked: false, category: 'documentos' },
  // Reservas
  { id: 'res-1', label: 'Voo confirmado', checked: false, category: 'reservas' },
  { id: 'res-2', label: 'Hotel reservado', checked: false, category: 'reservas' },
  { id: 'res-3', label: 'Passeios agendados', checked: false, category: 'reservas' },
  { id: 'res-4', label: 'Transfer aeroporto', checked: false, category: 'reservas' },
  // Packing
  { id: 'pack-1', label: 'Roupas adequadas ao clima', checked: false, category: 'packing' },
  { id: 'pack-2', label: 'Medicamentos pessoais', checked: false, category: 'packing' },
  { id: 'pack-3', label: 'Carregadores e adaptadores', checked: false, category: 'packing' },
  { id: 'pack-4', label: 'Itens de higiene', checked: false, category: 'packing' },
  // Pré-viagem
  { id: 'pre-1', label: 'Vacinas em dia', checked: false, category: 'pre-viagem' },
  { id: 'pre-2', label: 'Câmbio/cartão internacional', checked: false, category: 'pre-viagem' },
  { id: 'pre-3', label: 'Chip internacional ou roaming', checked: false, category: 'pre-viagem' },
  { id: 'pre-4', label: 'Avisar banco sobre viagem', checked: false, category: 'pre-viagem' },
];

export const defaultFinances: TripFinances = {
  total: 0,
  confirmed: 0,
  bidding: 0,
  planned: 0,
  available: 0,
  categories: {
    flights: { planned: 0, confirmed: 0, bidding: 0 },
    accommodation: { planned: 0, confirmed: 0, bidding: 0 },
    tours: { planned: 0, confirmed: 0, bidding: 0 },
    food: { planned: 0, confirmed: 0, bidding: 0 },
    transport: { planned: 0, confirmed: 0, bidding: 0 },
    shopping: { planned: 0, confirmed: 0, bidding: 0 },
  },
};

// Contextual tips based on situation
export const contextualTips = {
  jetLag: [
    "Ei! Seu corpo vai precisar de um tempo pra se adaptar. Preparei um dia leve pra você — nada de museu pesado hoje, ok? Amanhã você ataca com tudo! 🌿",
    "Eu sei que dá vontade de sair correndo pra conhecer tudo, mas confia: descansa hoje. O destino vai estar lá amanhã, e você vai aproveitar muito mais. 🌿",
  ],
  auction: [
    "Essa atividade costuma ter boas ofertas 2-3 semanas antes. Quer que eu te avise quando os preços caírem?",
    "Vi que esse passeio tem promoções frequentes. Vale a pena monitorar!",
  ],
  budget: [
    "Tá sobrando uma grana na reserva. Que tal um jantar especial no último dia?",
    "Boa gestão! Você está no caminho certo com o orçamento.",
  ],
  confirmation: [
    "Boa! Item confirmado. Agora foca no próximo — vi que os preços podem subir faltando 30 dias.",
    "Fechou! Um item a menos pra se preocupar. Bora pro próximo! 💪",
  ],
};
