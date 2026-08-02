// GERADO por scripts/sync-hotels.ts — não edite à mão.
// Fonte: tabela `curated_hotels` (status='published') do projeto kinu-beta.
// Para atualizar: npx tsx scripts/sync-hotels.ts Cartagena Gramado

export interface CuratedHotel {
  id: string;
  name: string;
  /** Bairro/região dentro da cidade (ex.: 'Centro Histórico'). */
  zone: string;
  /** Faixa do hotel: 'budget' | 'mid' | 'upscale' | 'resort'. */
  tier: string;
  /** Personas atendidas: 'family' | 'couple' | 'solo'. */
  personaTags: string[];
  /** Faixa de diária já formatada (ex.: 'R$ 700-1.200'). */
  priceRangeBRL: string;
  rating: number;
  tips: string[];
}

/** Hotéis curados por cidade. Chave = nome da cidade como em CURATED_CITIES. */
export const curatedHotels: Record<string, CuratedHotel[]> = {
  'Cartagena': [
    { id: 'ctg-h-ananda', name: 'Ananda Hotel Boutique', zone: 'Centro Histórico', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 1.200-2.000', rating: 4.6, tips: ['Boutique colonial com piscina no pátio — romance sem preço Sofitel'] },
    { id: 'ctg-h-caribe', name: 'Hotel Caribe by Faranda', zone: 'Bocagrande', tier: 'resort', personaTags: ['family'], priceRangeBRL: 'R$ 700-1.200', rating: 4.4, tips: ['O resort clássico de Bocagrande — piscinas gigantes e jardim com bicho-preguiça', 'Melhor custo-família da cidade; praia em frente'] },
    { id: 'ctg-h-casa-lola', name: 'Casa Lola Luxury Collection', zone: 'Getsemaní', tier: 'mid', personaTags: ['couple', 'solo'], priceRangeBRL: 'R$ 600-1.000', rating: 4.5, tips: ['Design colorido no coração de Getsemaní — pra quem quer a vibe do bairro'] },
    { id: 'ctg-h-charleston', name: 'Charleston Santa Teresa', zone: 'Centro Histórico', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 1.800-3.000', rating: 4.6, tips: ['Rooftop com a melhor vista da cidade murada — lua de mel clássica'] },
    { id: 'ctg-h-estelar', name: 'Estelar Cartagena de Indias', zone: 'Bocagrande', tier: 'mid', personaTags: ['family'], priceRangeBRL: 'R$ 500-800', rating: 4.5, tips: ['Custo-benefício família com piscina no rooftop e praia perto'] },
    { id: 'ctg-h-hyatt', name: 'Hyatt Regency Cartagena', zone: 'Bocagrande', tier: 'upscale', personaTags: ['family', 'couple'], priceRangeBRL: 'R$ 900-1.500', rating: 4.6, tips: ['Torre moderna com piscina de borda infinita — conforto internacional'] },
    { id: 'ctg-h-life-good', name: 'Life is Good Hostel', zone: 'Getsemaní', tier: 'budget', personaTags: ['solo'], priceRangeBRL: 'R$ 80-200', rating: 4.5, tips: ['O hostel querido de Getsemaní — social, seguro e na rua certa'] },
    { id: 'ctg-h-radisson', name: 'Radisson Cartagena Ocean Pavillion', zone: 'La Boquilla', tier: 'resort', personaTags: ['family'], priceRangeBRL: 'R$ 800-1.300', rating: 4.5, tips: ['Resort pé na areia fora do burburinho — piscinas enormes pras crianças', 'Longe do Centro: carro/app pra passeios'] },
    { id: 'ctg-h-san-agustin', name: 'Casa San Agustín', zone: 'Centro Histórico', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 2.200-3.800', rating: 4.7, tips: ['Boutique de charme absoluto — aquário privê e serviço impecável'] },
    { id: 'ctg-h-sofitel', name: 'Sofitel Legend Santa Clara', zone: 'Centro Histórico', tier: 'resort', personaTags: ['family', 'couple'], priceRangeBRL: 'R$ 2.500-4.500', rating: 4.7, tips: ['Convento do século XVII virado lenda — piscina, tucanos no pátio e história', 'Família E casal cabem: kids adorados, spa idem'] },
  ],
  'Gramado': [
    { id: 'gra-h-bavaria', name: 'Bavária Sport Hotel', zone: 'Centro', tier: 'mid', personaTags: ['family'], priceRangeBRL: 'R$ 600-1.000', rating: 4.6, tips: ['Família com piscina térmica e salão de jogos sem preço de resort'] },
    { id: 'gra-h-casa-montanha', name: 'Hotel Casa da Montanha', zone: 'Centro', tier: 'upscale', personaTags: ['couple', 'family'], priceRangeBRL: 'R$ 1.300-2.300', rating: 4.7, tips: ['Clima alpino no centro — lareira, vinho quente na recepção e serviço afiado'] },
    { id: 'gra-h-gramado-hostel', name: 'Gramado Hostel', zone: 'Piratini', tier: 'budget', personaTags: ['solo'], priceRangeBRL: 'R$ 90-180', rating: 4.4, tips: ['A opção mochileira da serra — quartos compartilhados e cozinha equipada', 'A 1,5 km do centro — leve isso na conta do deslocamento'] },
    { id: 'gra-h-jardim-secreto', name: 'Jardim Secreto Pousada', zone: 'Planalto', tier: 'mid', personaTags: ['couple'], priceRangeBRL: 'R$ 500-800', rating: 4.7, tips: ['Charme escondido com hidro e lareira — casal em conta'] },
    { id: 'gra-h-laghetto-golden', name: 'Laghetto Golden', zone: 'Centro', tier: 'mid', personaTags: ['family', 'couple'], priceRangeBRL: 'R$ 700-1.100', rating: 4.6, tips: ['Rooftop com borda infinita aquecida — o cartão-postal da rede no centro'] },
    { id: 'gra-h-ritta', name: 'Hotel Ritta Höppner', zone: 'Mini Mundo', tier: 'upscale', personaTags: ['family', 'couple'], priceRangeBRL: 'R$ 1.500-2.500', rating: 4.8, tips: ['Os chalés-jardim icônicos ao lado do Mini Mundo — capricho alemão lendário', 'Reserve MUITO antes: lotação eterna'] },
    { id: 'gra-h-saint-andrews', name: 'Hotel Saint Andrews', zone: 'Lago Negro', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 3.500-6.000', rating: 4.8, tips: ['O Relais & Châteaux da serra — mordomia, adega e exclusividade absoluta', 'Adults-oriented: a lua de mel de Gramado'] },
    { id: 'gra-h-st-hubertus', name: 'Estalagem St. Hubertus', zone: 'Lago Negro', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 1.400-2.400', rating: 4.8, tips: ['Vista pro Lago Negro e café da manhã premiado — romance puro', 'Somente adultos: casais agradecem'] },
    { id: 'gra-h-vovo-carolina', name: 'Pousada Vovó Carolina', zone: 'Centro', tier: 'budget', personaTags: ['family', 'couple'], priceRangeBRL: 'R$ 350-550', rating: 4.6, tips: ['A pousada de dono presente — café caseiro e preço honesto no centro'] },
    { id: 'gra-h-wish-serrano', name: 'Wish Serrano Resort', zone: 'Centro', tier: 'resort', personaTags: ['family'], priceRangeBRL: 'R$ 1.200-2.200', rating: 4.6, tips: ['O resort família de Gramado — piscina térmica coberta e recreação infantil', 'A 5 min a pé da Rua Coberta'] },
  ],
};

/** Hotéis curados da cidade, ou null se ela ainda não tem curadoria de hotel. */
export function getCuratedHotels(city: string): CuratedHotel[] | null {
  const list = curatedHotels[city];
  return list && list.length > 0 ? list : null;
}
