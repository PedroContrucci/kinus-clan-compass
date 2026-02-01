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

export interface FlightTimeData {
  departureTime: string; // HH:MM format
  returnTime: string;    // HH:MM format
}

export interface TripData {
  destination: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  departureTime: string;
  returnTime: string;
  travelers: number;
  travelType: string;
  budgetAmount: number;
  budgetType: string;
  priorities: string[];
  jetLagModeEnabled: boolean;
}

// Activity intensity levels
export type ActivityIntensity = 'light' | 'moderate' | 'intense' | 'very_intense';

export interface ActivityImage {
  url: string;
  alt: string;
}

// Activity images database
export const ACTIVITY_IMAGES: Record<string, ActivityImage> = {
  // Paris
  'torre-eiffel': { url: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce65f4?w=800&q=80', alt: 'Torre Eiffel' },
  'louvre': { url: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80', alt: 'Museu do Louvre' },
  'montmartre': { url: 'https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=800&q=80', alt: 'Montmartre' },
  'sena-cruzeiro': { url: 'https://images.unsplash.com/photo-1478391679764-b2d8b3cd1e94?w=800&q=80', alt: 'Cruzeiro no Sena' },
  'notre-dame': { url: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&q=80', alt: 'Notre Dame' },
  'versailles': { url: 'https://images.unsplash.com/photo-1551410224-699683e15636?w=800&q=80', alt: 'Palácio de Versailles' },
  'cafe-paris': { url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80', alt: 'Café Parisiense' },
  'marais': { url: 'https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=800&q=80', alt: 'Le Marais' },
  'aeroporto-cdg': { url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80', alt: 'Aeroporto CDG' },
  'hotel': { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80', alt: 'Hotel' },
  'taxi': { url: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80', alt: 'Táxi' },
  'restaurante': { url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', alt: 'Restaurante' },
  // Tóquio
  'shibuya': { url: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&q=80', alt: 'Shibuya Crossing' },
  'senso-ji': { url: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80', alt: 'Templo Senso-ji' },
  'meiji': { url: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80', alt: 'Santuário Meiji' },
  // Lisboa
  'belem': { url: 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800&q=80', alt: 'Torre de Belém' },
  'alfama': { url: 'https://images.unsplash.com/photo-1569959220744-ff553533f492?w=800&q=80', alt: 'Alfama' },
  // Default
  'default': { url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80', alt: 'Destino' },
};

// Flight duration estimates in hours (origin-destination)
export const FLIGHT_DURATION: Record<string, number> = {
  'São Paulo-Paris': 11.5,
  'São Paulo-Tóquio': 24,
  'São Paulo-Nova York': 10,
  'São Paulo-Lisboa': 9,
  'São Paulo-Dubai': 14,
  'São Paulo-Londres': 11,
  'São Paulo-Roma': 12,
  'São Paulo-Barcelona': 11,
  'São Paulo-Amsterdã': 12,
  'São Paulo-Sydney': 20,
  'São Paulo-Bali': 22,
  'São Paulo-Marrakech': 12,
  'São Paulo-Santorini': 14,
  'Brasil-Paris': 11.5,
  'Brasil-Tóquio': 24,
  'Brasil-Nova York': 10,
  'Brasil-Lisboa': 9,
  'Brasil-Roma': 12,
  'Brasil-Bali': 22,
};

// Calculate jet lag impact level
export const calculateJetLagImpact = (timezoneDiff: number): {
  level: 'BAIXO' | 'MODERADO' | 'ALTO' | 'SEVERO';
  color: string;
  bgColor: string;
  description: string;
} => {
  const diff = Math.abs(timezoneDiff);
  if (diff <= 2) {
    return {
      level: 'BAIXO',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      description: 'Impacto mínimo no corpo. Roteiro normal liberado!',
    };
  }
  if (diff <= 5) {
    return {
      level: 'MODERADO',
      color: '#eab308',
      bgColor: 'rgba(234, 179, 8, 0.1)',
      description: 'Seu corpo vai precisar de adaptação. Dia 1 será leve.',
    };
  }
  if (diff <= 8) {
    return {
      level: 'ALTO',
      color: '#f97316',
      bgColor: 'rgba(249, 115, 22, 0.1)',
      description: 'Impacto significativo. Recomendamos roteiro muito leve no Dia 1.',
    };
  }
  return {
    level: 'SEVERO',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    description: 'Impacto severo. Dia 1 focado em descanso e adaptação.',
  };
};

// Calculate arrival time considering timezone
export const calculateArrivalTime = (
  departureTime: string,
  departureDate: Date,
  flightDuration: number,
  timezoneDiff: number
): { arrivalTime: string; arrivalDate: Date; nextDay: boolean } => {
  const [hours, minutes] = departureTime.split(':').map(Number);
  const departure = new Date(departureDate);
  departure.setHours(hours, minutes, 0, 0);
  
  // Add flight duration
  const arrivalLocal = new Date(departure.getTime() + flightDuration * 60 * 60 * 1000);
  
  // Add timezone difference
  arrivalLocal.setHours(arrivalLocal.getHours() + timezoneDiff);
  
  const arrivalHours = arrivalLocal.getHours().toString().padStart(2, '0');
  const arrivalMinutes = arrivalLocal.getMinutes().toString().padStart(2, '0');
  
  const nextDay = arrivalLocal.getDate() !== departure.getDate();
  
  return {
    arrivalTime: `${arrivalHours}:${arrivalMinutes}`,
    arrivalDate: arrivalLocal,
    nextDay,
  };
};

// Get intensity badge styling
export const getIntensityBadge = (intensity: ActivityIntensity): {
  icon: string;
  label: string;
  bgColor: string;
  textColor: string;
} => {
  switch (intensity) {
    case 'light':
      return { icon: '🧘', label: 'Leve', bgColor: 'bg-emerald-500/20', textColor: 'text-emerald-400' };
    case 'moderate':
      return { icon: '🚶', label: 'Moderada', bgColor: 'bg-blue-500/20', textColor: 'text-blue-400' };
    case 'intense':
      return { icon: '🏃', label: 'Intensa', bgColor: 'bg-orange-500/20', textColor: 'text-orange-400' };
    case 'very_intense':
      return { icon: '⚡', label: 'Muito Intensa', bgColor: 'bg-red-500/20', textColor: 'text-red-400' };
    default:
      return { icon: '🚶', label: 'Moderada', bgColor: 'bg-blue-500/20', textColor: 'text-blue-400' };
  }
};

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
