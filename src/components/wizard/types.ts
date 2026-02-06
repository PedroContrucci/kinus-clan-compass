// Wizard Types — Planning Wizard Data Structures

export interface WizardTraveler {
  id: string;
  type: 'adult' | 'child' | 'infant';
  age?: number;
  name?: string;
}

export type TravelInterest = 
  | 'gastronomy' | 'beach' | 'nightlife' | 'family' 
  | 'history' | 'art' | 'culture' | 'adventure' 
  | 'relaxation' | 'shopping' | 'nature' | 'winter';

export interface WizardData {
  // Step 1: Logistics
  originCity: string;
  originCityId: string | null;
  originAirportCode: string;
  destinationCity: string;
  destinationCityId: string | null;
  destinationAirportCode: string;
  destinationTimezone: string | null;
  departureDate: Date | undefined;
  returnDate: Date | undefined;
  
  // Route info
  hasDirectFlight: boolean;
  connections: string[];
  estimatedFlightDuration: number | null;
  averageFlightPrice: number | null;
  
  // Step 2: Travelers
  adults: number;
  children: WizardTraveler[];
  infants: number;
  
  // Step 3: Budget
  budgetAmount: number;
  budgetCurrency: 'BRL' | 'USD' | 'EUR';
  priorities: ('flights' | 'accommodation' | 'experiences')[];
  travelStyle: 'economic' | 'comfort' | 'luxury' | 'backpacker';
  travelInterests: TravelInterest[];
  
  // Step 4: Biology AI
  biologyAIEnabled: boolean;
  
  // Computed
  totalDays: number;
  totalNights: number;
}

export interface RouteInfo {
  hasRoute: boolean;
  hasDirect: boolean;
  needsConnection: boolean;
  connections: string[];
  estimatedDuration: number | null;
  averagePrice: number | null;
  airlines: string[];
  originAirport: { iata_code: string; name_pt: string } | null;
  destinationAirport: { iata_code: string; name_pt: string } | null;
}

export interface BudgetBreakdown {
  flights: number;
  accommodation: number;
  experiences: number;
  buffer: number;
  total: number;
  usagePercent: number;
  isWithinTrustZone: boolean;
}

export const TRAVEL_STYLES = [
  { id: 'economic', label: 'Econômico', icon: '💚', description: 'Hotéis 3★, voos econômicos' },
  { id: 'comfort', label: 'Conforto', icon: '✨', description: 'Hotéis 4★, voos confortáveis' },
  { id: 'luxury', label: 'Luxo', icon: '👑', description: 'Hotéis 5★, classe executiva' },
  { id: 'backpacker', label: 'Mochileiro', icon: '🎒', description: 'Hostels, máxima economia' },
] as const;

export const PRIORITY_OPTIONS = [
  { id: 'flights', label: 'Voos', icon: '✈️', description: 'Classe executiva, menos conexões' },
  { id: 'accommodation', label: 'Hospedagem', icon: '🏨', description: 'Hotel premium, localização' },
  { id: 'experiences', label: 'Experiências', icon: '🎭', description: 'Passeios, restaurantes' },
] as const;

export const TRAVEL_INTERESTS = [
  { id: 'gastronomy', label: 'Gastronomia', icon: '🍜' },
  { id: 'beach', label: 'Praia', icon: '🏖️' },
  { id: 'nightlife', label: 'Vida Noturna', icon: '🌙' },
  { id: 'family', label: 'Família', icon: '👨‍👩‍👧' },
  { id: 'history', label: 'História', icon: '🏛️' },
  { id: 'art', label: 'Arte', icon: '🎨' },
  { id: 'culture', label: 'Cultura', icon: '🎭' },
  { id: 'adventure', label: 'Aventura', icon: '🏔️' },
  { id: 'relaxation', label: 'Relaxamento', icon: '💆' },
  { id: 'shopping', label: 'Compras', icon: '🛍️' },
  { id: 'nature', label: 'Natureza', icon: '🌿' },
  { id: 'winter', label: 'Inverno/Neve', icon: '❄️' },
] as const;

// Budget allocation percentages based on priority order
export const BUDGET_ALLOCATION = {
  first: 0.45,  // 45% for first priority
  second: 0.35, // 35% for second priority
  third: 0.20,  // 20% for third priority
} as const;
