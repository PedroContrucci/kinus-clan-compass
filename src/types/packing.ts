export interface LuggageConfig {
  type: 'hand' | 'checked' | 'both';
  dimensions: {
    height: number;
    width: number;
    depth: number;
  };
  weightLimit: number;
}

export interface PackingItem {
  id: string;
  name: string;
  weight: number; // in kg
  quantity: number;
  checked: boolean;
  category: 'roupas' | 'calcados' | 'eletronicos' | 'higiene' | 'documentos' | 'outros';
  securityAlert?: 'HAND_LUGGAGE_ONLY' | 'CHECK_IN_ONLY' | 'LIQUID_LIMIT';
}

export interface PackingData {
  luggage: LuggageConfig;
  items: PackingItem[];
  totalWeight: number;
  status: 'ok' | 'warning' | 'overweight';
}

// Average item weights (in kg)
export const ITEM_WEIGHTS: Record<string, number> = {
  // Roupas
  camiseta: 0.15,
  camisa: 0.25,
  calca_jeans: 0.5,
  calca_leve: 0.3,
  shorts: 0.2,
  casaco_leve: 0.6,
  casaco_pesado: 1.2,
  roupa_intima: 0.05,
  meias_par: 0.05,
  pijama: 0.2,
  vestido: 0.3,
  roupa_social: 0.6,

  // Calçados
  tenis: 0.8,
  sapato_casual: 0.6,
  sapato_social: 0.7,
  chinelo: 0.2,
  bota: 1.0,

  // Eletrônicos
  celular: 0.2,
  carregador: 0.1,
  notebook: 1.5,
  tablet: 0.5,
  camera: 0.5,
  fone_ouvido: 0.25,
  power_bank: 0.4,
  adaptador: 0.1,

  // Higiene
  kit_dental: 0.2,
  shampoo_100ml: 0.12,
  shampoo_200ml: 0.22,
  perfume_100ml: 0.15,
  desodorante: 0.1,
  protetor_solar: 0.2,
  medicamentos: 0.1,

  // Outros
  passaporte: 0.05,
  carteira: 0.1,
  livro: 0.3,
  guarda_chuva: 0.3,
  necessaire: 0.2,
};

// Security rules
export const SECURITY_RULES: Record<string, { rule: string; message: string; shortMessage: string }> = {
  HAND_LUGGAGE_ONLY: {
    rule: 'HAND_LUGGAGE_ONLY',
    message: 'Obrigatório na bagagem de mão. Proibido despachar (risco de incêndio).',
    shortMessage: 'Apenas bagagem de mão!',
  },
  CHECK_IN_ONLY: {
    rule: 'CHECK_IN_ONLY',
    message: 'Deve ser despachado. Não permitido na bagagem de mão.',
    shortMessage: 'Apenas mala despachada!',
  },
  LIQUID_LIMIT: {
    rule: 'LIQUID_LIMIT',
    message: 'Acima de 100ml deve ser despachado ou trocado por travel size.',
    shortMessage: 'Limite 100ml na mão!',
  },
};

// Default packing items based on common travel needs
export const getDefaultPackingItems = (): PackingItem[] => [
  // Roupas
  { id: 'r-1', name: 'Camisetas (×5)', weight: 0.75, quantity: 1, checked: true, category: 'roupas' },
  { id: 'r-2', name: 'Calças/Jeans (×3)', weight: 1.5, quantity: 1, checked: true, category: 'roupas' },
  { id: 'r-3', name: 'Casaco leve', weight: 0.6, quantity: 1, checked: true, category: 'roupas' },
  { id: 'r-4', name: 'Roupas íntimas (×7)', weight: 0.35, quantity: 1, checked: true, category: 'roupas' },
  { id: 'r-5', name: 'Pijama (×2)', weight: 0.4, quantity: 1, checked: true, category: 'roupas' },
  { id: 'r-6', name: 'Roupa social', weight: 0.6, quantity: 1, checked: false, category: 'roupas' },

  // Calçados
  { id: 'c-1', name: 'Tênis confortável', weight: 0.8, quantity: 1, checked: true, category: 'calcados' },
  { id: 'c-2', name: 'Sapato casual', weight: 0.6, quantity: 1, checked: true, category: 'calcados' },
  { id: 'c-3', name: 'Chinelo', weight: 0.2, quantity: 1, checked: false, category: 'calcados' },
  { id: 'c-4', name: 'Sapato social', weight: 0.7, quantity: 1, checked: false, category: 'calcados' },

  // Eletrônicos
  { id: 'e-1', name: 'Celular + carregador', weight: 0.3, quantity: 1, checked: true, category: 'eletronicos' },
  { id: 'e-2', name: 'Notebook', weight: 1.5, quantity: 1, checked: true, category: 'eletronicos' },
  { id: 'e-3', name: 'Adaptador tomada', weight: 0.1, quantity: 1, checked: true, category: 'eletronicos' },
  { id: 'e-4', name: 'Câmera', weight: 0.5, quantity: 1, checked: false, category: 'eletronicos' },
  {
    id: 'e-5',
    name: 'Power bank 20.000mAh',
    weight: 0.4,
    quantity: 1,
    checked: true,
    category: 'eletronicos',
    securityAlert: 'HAND_LUGGAGE_ONLY',
  },

  // Higiene
  { id: 'h-1', name: 'Kit dental', weight: 0.2, quantity: 1, checked: true, category: 'higiene' },
  {
    id: 'h-2',
    name: 'Shampoo (200ml)',
    weight: 0.22,
    quantity: 1,
    checked: true,
    category: 'higiene',
    securityAlert: 'LIQUID_LIMIT',
  },
  { id: 'h-3', name: 'Perfume (100ml)', weight: 0.15, quantity: 1, checked: true, category: 'higiene' },
  { id: 'h-4', name: 'Protetor solar', weight: 0.2, quantity: 1, checked: true, category: 'higiene' },
  { id: 'h-5', name: 'Medicamentos pessoais', weight: 0.1, quantity: 1, checked: true, category: 'higiene' },

  // Documentos
  { id: 'd-1', name: 'Passaporte', weight: 0.05, quantity: 1, checked: true, category: 'documentos' },
  { id: 'd-2', name: 'Carteira/Docs', weight: 0.1, quantity: 1, checked: true, category: 'documentos' },
  { id: 'd-3', name: 'Seguro viagem (cópia)', weight: 0.02, quantity: 1, checked: true, category: 'documentos' },
  { id: 'd-4', name: 'Reservas impressas', weight: 0.05, quantity: 1, checked: true, category: 'documentos' },
];
