export interface TripActivity {
  id: string;
  time: string;
  name: string;
  description: string;
  duration: string;
  cost: number;
  type: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  paidAmount?: number;
  confirmationLink?: string;
  category?: 'voo' | 'hotel' | 'passeio' | 'comida' | 'transporte' | 'outro';
}

export interface TripDay {
  day: number;
  title: string;
  icon: string;
  activities: TripActivity[];
}

export interface TripFinances {
  confirmed: number;
  pending: number;
  available: number;
  byCategory: {
    voos: number;
    hoteis: number;
    passeios: number;
    comida: number;
    outros: number;
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
  destination: string;
  country: string;
  emoji: string;
  startDate: string;
  endDate: string;
  budget: number;
  budgetType: string;
  travelers: number;
  priorities: string[];
  status: 'planning' | 'booked' | 'traveling' | 'completed';
  progress: number;
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
