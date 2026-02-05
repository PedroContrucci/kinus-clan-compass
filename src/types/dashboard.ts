// Dashboard Types — KINU Travel OS

export interface Trip {
  id: string;
  name: string;
  destination: string;
  departureDate: Date;
  returnDate: Date;
  status: 'draft' | 'active' | 'completed';
  budget: { total: number; used: number; currency: 'BRL' | 'USD' | 'EUR' };
  checklist: { total: number; completed: number };
  payments: { total: number; paid: number };
  clan: ClanMember[];
  stats?: CompletedTripStats;
}

export interface CompletedTripStats {
  countriesVisited: number;
  restaurantsCurated: number;
  totalSaved: number;
  highlights: string[];
}

export interface ClanMember {
  id: string;
  name: string;
  type: 'adult' | 'child';
  age?: number; // obrigatório se child — age < 2 = custo zero em voos
}
