// GERADO por scripts/sync-hotels.ts — não edite à mão.
// Fonte: tabela `curated_hotels` (status='published') do projeto kinu-beta.
// Para atualizar: npx tsx scripts/sync-hotels.ts   (sem argumentos = TODAS as cidades)
// Gerado com 16 cidade(s): Barcelona, Buenos Aires, Cartagena, Dubai, Fortaleza, Gramado, Lisboa, Londres, Nova York, Orlando, Paris, Porto Seguro, Rio de Janeiro, Rome, Salvador, Tokyo

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
  'Barcelona': [
    { id: 'bcn-h-arts', name: 'Hotel Arts Barcelona', zone: 'Barceloneta', tier: 'upscale', personaTags: ['family', 'couple'], priceRangeBRL: 'R$ 2.500-4.500', rating: 4.7, tips: ['A torre de frente pro mar com piscina e o peixe do Gehry ao lado'] },
    { id: 'bcn-h-majestic', name: 'Majestic Hotel & Spa', zone: 'Passeig de Gràcia', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 1.800-3.200', rating: 4.6, tips: ['Clássico com rooftop pra Sagrada — elegância no Passeig'] },
    { id: 'bcn-h-yurbban', name: 'Yurbban Trafalgar', zone: 'Sant Pere', tier: 'mid', personaTags: ['couple', 'solo'], priceRangeBRL: 'R$ 700-1.100', rating: 4.6, tips: ['Rooftop com piscina e a Catedral de fundo — valor imbatível'] },
  ],
  'Buenos Aires': [
    { id: 'bue-h-alvear', name: 'Alvear Palace Hotel', zone: 'Recoleta', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 1.800-3.200', rating: 4.8, tips: ['O grande dame portenho - chá da tarde e mordomos desde 1932'] },
    { id: 'bue-h-duhau', name: 'Palacio Duhau - Park Hyatt', zone: 'Recoleta', tier: 'upscale', personaTags: ['couple', 'family'], priceRangeBRL: 'R$ 1.600-2.800', rating: 4.8, tips: ['Palácio com jardins escalonados - elegância máxima'] },
    { id: 'bue-h-four-seasons', name: 'Four Seasons Buenos Aires', zone: 'Retiro', tier: 'upscale', personaTags: ['family', 'couple'], priceRangeBRL: 'R$ 1.400-2.500', rating: 4.7, tips: ['Mansão belle époque + torre moderna - piscina e kids amados'] },
    { id: 'bue-h-home', name: 'Home Hotel', zone: 'Palermo Hollywood', tier: 'mid', personaTags: ['couple'], priceRangeBRL: 'R$ 500-900', rating: 4.6, tips: ['O boutique que inventou Palermo Hollywood - jardim com piscina'] },
  ],
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
  'Dubai': [
    { id: 'dxb-h-address-dt', name: 'Address Downtown', zone: 'Downtown', tier: 'upscale', personaTags: ['couple', 'family'], priceRangeBRL: 'R$ 2.000-3.500', rating: 4.7, tips: ['A fonte dançante e o Burj Khalifa na varanda'] },
    { id: 'dxb-h-atlantis', name: 'Atlantis The Palm', zone: 'Palm Jumeirah', tier: 'resort', personaTags: ['family'], priceRangeBRL: 'R$ 2.500-5.000', rating: 4.7, tips: ['O resort-ícone com Aquaventure e aquário inclusos — férias dentro do hotel'] },
    { id: 'dxb-h-burj-arab', name: 'Burj Al Arab', zone: 'Jumeirah', tier: 'resort', personaTags: ['couple'], priceRangeBRL: 'R$ 8.000-15.000', rating: 4.8, tips: ['A vela mais famosa do mundo — mordomo, Rolls e mar privado'] },
    { id: 'dxb-h-jumeirah-beach', name: 'Jumeirah Beach Hotel', zone: 'Jumeirah', tier: 'resort', personaTags: ['family'], priceRangeBRL: 'R$ 2.200-3.800', rating: 4.6, tips: ['A onda de vidro com praia privada e Wild Wadi grátis'] },
    { id: 'dxb-h-rove-dt', name: 'Rove Downtown', zone: 'Downtown', tier: 'budget', personaTags: ['family', 'solo'], priceRangeBRL: 'R$ 400-650', rating: 4.6, tips: ['O budget-esperto de Dubai — vista do Burj por preço de gente'] },
  ],
  'Fortaleza': [
    { id: 'for-h-gran-marquise', name: 'Gran Marquise', zone: 'Mucuripe', tier: 'upscale', personaTags: ['family', 'couple'], priceRangeBRL: 'R$ 800-1.400', rating: 4.7, tips: ['O 5 estrelas da Beira-Mar - serviço impecável e mar na janela'] },
    { id: 'for-h-vila-gale', name: 'Vila Galé Fortaleza', zone: 'Praia do Futuro', tier: 'resort', personaTags: ['family'], priceRangeBRL: 'R$ 700-1.200', rating: 4.5, tips: ['Resort pé na areia da Praia do Futuro - piscinas e all-inclusive opcional'] },
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
  'Lisboa': [
    { id: 'lis-h-bairro-alto', name: 'Bairro Alto Hotel', zone: 'Bairro Alto', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 1.600-2.800', rating: 4.7, tips: ['Boutique histórico entre o Chiado e o Bairro Alto - rooftop pro Tejo'] },
    { id: 'lis-h-martinhal', name: 'Martinhal Lisbon Chiado', zone: 'Chiado', tier: 'resort', personaTags: ['family'], priceRangeBRL: 'R$ 1.100-2.000', rating: 4.7, tips: ['O apart-hotel DESENHADO pra famílias - kids club no centro de Lisboa'] },
    { id: 'lis-h-memmo', name: 'Memmo Alfama', zone: 'Alfama', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 1.000-1.800', rating: 4.6, tips: ['Escondido na Alfama com piscina vermelha sobre os telhados'] },
    { id: 'lis-h-pestana-palace', name: 'Pestana Palace', zone: 'Alcântara', tier: 'resort', personaTags: ['couple', 'family'], priceRangeBRL: 'R$ 1.200-2.200', rating: 4.7, tips: ['Palácio nacional com jardins e piscinas - viver como rei'] },
  ],
  'Londres': [
    { id: 'lon-h-premier-ch', name: 'Premier Inn County Hall', zone: 'South Bank', tier: 'budget', personaTags: ['family'], priceRangeBRL: 'R$ 700-1.100', rating: 4.6, tips: ['Ao lado do London Eye por preço de rede — o segredo das famílias'] },
    { id: 'lon-h-savoy', name: 'The Savoy', zone: 'Strand', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 4.500-8.000', rating: 4.7, tips: ['A lenda art déco do Tâmisa — chá, história e mordomia'] },
  ],
  'Nova York': [
    { id: 'ny-h-1hotel-bk', name: '1 Hotel Brooklyn Bridge', zone: 'Dumbo', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 2.200-3.800', rating: 4.6, tips: ['Eco-chique com Manhattan inteira na janela'] },
    { id: 'ny-h-beacon', name: 'Hotel Beacon', zone: 'Upper West Side', tier: 'mid', personaTags: ['family'], priceRangeBRL: 'R$ 1.200-2.000', rating: 4.6, tips: ['Suítes com kitchenette perto do Central Park — o favorito das famílias'] },
    { id: 'ny-h-plaza', name: 'The Plaza', zone: 'Central Park South', tier: 'upscale', personaTags: ['couple', 'family'], priceRangeBRL: 'R$ 4.000-8.000', rating: 4.6, tips: ['O hotel-lenda de Home Alone na esquina do Central Park'] },
  ],
  'Orlando': [
    { id: 'orl-h-art-animation', name: 'Disney Art of Animation Resort', zone: 'Disney World', tier: 'resort', personaTags: ['family'], priceRangeBRL: 'R$ 1.000-1.700', rating: 4.6, tips: ['Suítes temáticas Carros/Nemo - imersão Disney com transporte grátis'] },
    { id: 'orl-h-cabana-bay', name: 'Universal Cabana Bay Beach Resort', zone: 'Universal', tier: 'resort', personaTags: ['family'], priceRangeBRL: 'R$ 800-1.400', rating: 4.6, tips: ['Retrô anos 50 com lazy river - o melhor valor da Universal (early access!)'] },
    { id: 'orl-h-drury', name: 'Drury Plaza Hotel Disney Springs', zone: 'Lake Buena Vista', tier: 'mid', personaTags: ['family'], priceRangeBRL: 'R$ 600-1.000', rating: 4.7, tips: ['Refeições e happy hour INCLUSOS - a conta fecha bonito pra família'] },
    { id: 'orl-h-four-seasons', name: 'Four Seasons Resort Orlando', zone: 'Disney World', tier: 'resort', personaTags: ['family'], priceRangeBRL: 'R$ 3.500-6.500', rating: 4.8, tips: ['O luxo dentro da Disney - lazy river e adults pool separada'] },
    { id: 'orl-h-grand-cypress', name: 'Hyatt Regency Grand Cypress', zone: 'Lake Buena Vista', tier: 'resort', personaTags: ['family'], priceRangeBRL: 'R$ 1.200-2.000', rating: 4.6, tips: ['Piscina-caverna com tobogãs a minutos da Disney'] },
  ],
  'Paris': [
    { id: 'par-h-citadines-eiffel', name: 'Citadines Tour Eiffel', zone: '15e', tier: 'mid', personaTags: ['family'], priceRangeBRL: 'R$ 800-1.300', rating: 4.4, tips: ['Apart-hotel com cozinha perto da Torre - o formato que família agradece'] },
    { id: 'par-h-pavillon-reine', name: 'Le Pavillon de la Reine', zone: 'Marais', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 2.200-3.800', rating: 4.7, tips: ['Escondido na Place des Vosges - romance absoluto no Marais'] },
    { id: 'par-h-plaza-athenee', name: 'Hôtel Plaza Athénée', zone: 'Champs-Élysées', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 5.000-9.000', rating: 4.7, tips: ['As sacadas de gerânios da Avenue Montaigne - alta-costura em hotel'] },
  ],
  'Porto Seguro': [
    { id: 'pse-h-arraial-eco', name: 'Arraial d\'Ajuda Eco Resort', zone: 'Arraial d Ajuda', tier: 'resort', personaTags: ['family'], priceRangeBRL: 'R$ 900-1.600', rating: 4.5, tips: ['Resort de reserva ecológica entre a balsa e a vila - praia calma'] },
    { id: 'pse-h-club-med', name: 'Club Med Trancoso', zone: 'Trancoso', tier: 'resort', personaTags: ['family'], priceRangeBRL: 'R$ 2.000-3.500', rating: 4.6, tips: ['All-inclusive à beira da falésia - kids club que salva férias'] },
    { id: 'pse-h-fasano-trancoso', name: 'Fasano Trancoso', zone: 'Trancoso', tier: 'resort', personaTags: ['couple'], priceRangeBRL: 'R$ 3.500-7.000', rating: 4.8, tips: ['Bangalôs com piscinas privadas sobre a praia de Itapororoca'] },
    { id: 'pse-h-uxua', name: 'Uxua Casa Hotel & Spa', zone: 'Trancoso', tier: 'resort', personaTags: ['couple'], priceRangeBRL: 'R$ 3.000-6.000', rating: 4.8, tips: ['As casas do Quadrado viradas hotel-lenda - design de Wilbert Das'] },
  ],
  'Rio de Janeiro': [
    { id: 'rio-h-copa-palace', name: 'Copacabana Palace', zone: 'Copacabana', tier: 'resort', personaTags: ['couple', 'family'], priceRangeBRL: 'R$ 3.000-6.000', rating: 4.8, tips: ['O hotel-lenda do Brasil - piscina icônica e glamour centenário'] },
    { id: 'rio-h-fairmont', name: 'Fairmont Rio Copacabana', zone: 'Copacabana', tier: 'upscale', personaTags: ['family', 'couple'], priceRangeBRL: 'R$ 1.500-2.800', rating: 4.6, tips: ['Moderno no Posto 6 - piscinas com vista e estrutura família'] },
    { id: 'rio-h-janeiro', name: 'Janeiro Hotel', zone: 'Leblon', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 1.800-3.200', rating: 4.6, tips: ['Boutique design com vista pro mar do Leblon - romance carioca'] },
    { id: 'rio-h-santa-teresa', name: 'Santa Teresa Hotel MGallery', zone: 'Santa Teresa', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 1.400-2.500', rating: 4.7, tips: ['Casarão colonial no alto boêmio - piscina entre árvores'] },
  ],
  'Roma': [
    { id: 'rom-h-artemide', name: 'Hotel Artemide', zone: 'Via Nazionale', tier: 'upscale', personaTags: ['family', 'couple'], priceRangeBRL: 'R$ 900-1.500', rating: 4.7, tips: ['O queridinho de avaliações - rooftop e serviço acima do preço'] },
    { id: 'rom-h-de-russie', name: 'Hotel de Russie', zone: 'Popolo', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 3.000-5.500', rating: 4.7, tips: ['Jardins secretos entre o Popolo e a Spagna - refúgio de estrelas'] },
    { id: 'rom-h-santa-maria', name: 'Hotel Santa Maria', zone: 'Trastevere', tier: 'mid', personaTags: ['family'], priceRangeBRL: 'R$ 700-1.200', rating: 4.6, tips: ['Claustro com laranjeiras em Trastevere - térreo e tranquilo pra família'] },
  ],
  'Salvador': [
    { id: 'ssa-h-deville', name: 'Deville Prime Salvador', zone: 'Itapuã', tier: 'resort', personaTags: ['family'], priceRangeBRL: 'R$ 700-1.100', rating: 4.6, tips: ['Resort urbano pé na areia de Itapuã - piscinas e recreação'] },
    { id: 'ssa-h-fasano', name: 'Fasano Salvador', zone: 'Comércio', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 1.500-2.800', rating: 4.7, tips: ['Art déco restaurado com rooftop pra Baía - o luxo soteropolitano'] },
    { id: 'ssa-h-fera', name: 'Fera Palace Hotel', zone: 'Comércio', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 900-1.600', rating: 4.6, tips: ['O palácio de 1934 renascido - piscina de borda na proa do Centro'] },
  ],
  'Tóquio': [
    { id: 'tok-h-hoshinoya', name: 'Hoshinoya Tokyo', zone: 'Otemachi', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 3.500-6.000', rating: 4.7, tips: ['Ryokan de luxo vertical - onsen no topo de um arranha-céu'] },
    { id: 'tok-h-mimaru-ueno', name: 'Mimaru Tokyo Ueno', zone: 'Ueno', tier: 'mid', personaTags: ['family'], priceRangeBRL: 'R$ 700-1.200', rating: 4.6, tips: ['Apart-hotel DESENHADO pra famílias - quartos amplos e cozinha (raridade no Japão)'] },
    { id: 'tok-h-park-hyatt', name: 'Park Hyatt Tokyo', zone: 'Shinjuku', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 2.800-5.000', rating: 4.7, tips: ['O hotel de Lost in Translation - piscina no céu e o bar New York'] },
  ],
};

/** Hotéis curados da cidade, ou null se ela ainda não tem curadoria de hotel. */
export function getCuratedHotels(city: string): CuratedHotel[] | null {
  const list = curatedHotels[city];
  return list && list.length > 0 ? list : null;
}
