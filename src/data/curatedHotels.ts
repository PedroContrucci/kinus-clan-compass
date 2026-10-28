// GERADO por scripts/sync-hotels.ts — não edite à mão.
// Fonte: tabela `curated_hotels` (status='published') do projeto kinu-beta.
// Para atualizar: npx tsx scripts/sync-hotels.ts   (sem argumentos = TODAS as cidades)
// Gerado com 21 cidade(s) — RUN PARCIAL, cidades fora da lista foram omitidas: Bangkok, Barcelona, Buenos Aires, Cartagena, Cidade do Cabo, Dubai, Fortaleza, Gramado, Istambul, Lisboa, Londres, Marrakech, Nova York, Orlando, Paris, Porto Seguro, Rio de Janeiro, Rome, Salvador, Singapura, Tokyo

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
  'Bangkok': [
    { id: 'bkk-h-amara', name: 'Amara Bangkok', zone: 'Silom', tier: 'mid', personaTags: ['couple', 'solo'], priceRangeBRL: 'R$ 450-700', rating: 4.5, tips: ['Piscina infinita no rooftop com Silom aos pés'] },
    { id: 'bkk-h-centre-point-pratunam', name: 'Centre Point Prime Hotel Pratunam', zone: 'Pratunam', tier: 'mid', personaTags: ['family'], priceRangeBRL: 'R$ 400-650', rating: 4.4, tips: ['Suítes com cozinha — família que fica mais dias'] },
    { id: 'bkk-h-hie-siam', name: 'Holiday Inn Express Bangkok Siam', zone: 'Siam', tier: 'budget', personaTags: ['family'], priceRangeBRL: 'R$ 300-450', rating: 4.5, tips: ['Café incluso e BTS na porta — base prática para a família'] },
    { id: 'bkk-h-ibis-riverside', name: 'ibis Bangkok Riverside', zone: 'Riverside', tier: 'budget', personaTags: ['family', 'couple'], priceRangeBRL: 'R$ 250-400', rating: 4.4, tips: ['Rede confiável à beira do Chao Phraya com barco gratuito para o píer'] },
    { id: 'bkk-h-lubd-siam', name: 'Lub d Bangkok Siam', zone: 'Siam', tier: 'budget', personaTags: ['solo', 'couple'], priceRangeBRL: 'R$ 150-350', rating: 4.5, tips: ['Hostel-design a passos do BTS National Stadium e dos shoppings de Siam'] },
    { id: 'bkk-h-mandarin', name: 'Mandarin Oriental Bangkok', zone: 'Riverside', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 3.500-6.500', rating: 4.8, tips: ['A lenda de 1876 à beira do rio — serviço que virou referência mundial'] },
    { id: 'bkk-h-novotel-platinum', name: 'Novotel Bangkok Platinum Pratunam', zone: 'Pratunam', tier: 'mid', personaTags: ['family', 'couple'], priceRangeBRL: 'R$ 450-700', rating: 4.5, tips: ['Colado ao Platinum Fashion Mall — compras e street food de Pratunam'] },
    { id: 'bkk-h-peninsula', name: 'The Peninsula Bangkok', zone: 'Riverside', tier: 'upscale', personaTags: ['couple', 'family'], priceRangeBRL: 'R$ 2.500-4.500', rating: 4.7, tips: ['Todos os quartos com vista do rio e piscina de três níveis'] },
    { id: 'bkk-h-shangri-la', name: 'Shangri-La Bangkok', zone: 'Riverside', tier: 'upscale', personaTags: ['family', 'couple'], priceRangeBRL: 'R$ 1.800-3.200', rating: 4.6, tips: ['Jardins à beira do Chao Phraya e BTS Saphan Taksin ao lado'] },
  ],
  'Barcelona': [
    { id: 'bcn-h-arts', name: 'Hotel Arts Barcelona', zone: 'Barceloneta', tier: 'upscale', personaTags: ['family', 'couple'], priceRangeBRL: 'R$ 2.500-4.500', rating: 4.7, tips: ['A torre de frente pro mar com piscina e o peixe do Gehry ao lado'] },
    { id: 'bcn-h-jazz', name: 'Hotel Jazz', zone: 'Eixample', tier: 'mid', personaTags: ['family'], priceRangeBRL: 'R$ 800-1.300', rating: 4.5, tips: ['Piscina no terraço e Plaça Catalunya a 3 quadras'] },
    { id: 'bcn-h-majestic', name: 'Majestic Hotel & Spa', zone: 'Passeig de Gràcia', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 1.800-3.200', rating: 4.6, tips: ['Clássico com rooftop pra Sagrada — elegância no Passeig'] },
    { id: 'bcn-h-mimosa', name: 'H10 Casa Mimosa', zone: 'Eixample', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 1.200-2.000', rating: 4.6, tips: ['Ao lado da Pedrera com jardim e rooftop — refúgio no centro'] },
    { id: 'bcn-h-motel-one', name: 'Motel One Barcelona-Ciutadella', zone: 'Born', tier: 'budget', personaTags: ['family', 'couple'], priceRangeBRL: 'R$ 450-700', rating: 4.6, tips: ['Rede alemã impecável na porta do parque'] },
    { id: 'bcn-h-praktik-bakery', name: 'Praktik Bakery', zone: 'Eixample', tier: 'mid', personaTags: ['couple', 'solo'], priceRangeBRL: 'R$ 600-1.000', rating: 4.5, tips: ['O hotel com padaria de verdade no lobby — acorde com cheiro de croissant'] },
    { id: 'bcn-h-toc', name: 'TOC Hostel Barcelona', zone: 'Eixample', tier: 'budget', personaTags: ['solo'], priceRangeBRL: 'R$ 120-280', rating: 4.4, tips: ['Hostel-design com piscina — mochileiro com estilo'] },
    { id: 'bcn-h-yurbban', name: 'Yurbban Trafalgar', zone: 'Sant Pere', tier: 'mid', personaTags: ['couple', 'solo'], priceRangeBRL: 'R$ 700-1.100', rating: 4.6, tips: ['Rooftop com piscina e a Catedral de fundo — valor imbatível'] },
  ],
  'Buenos Aires': [
    { id: 'bue-h-alvear', name: 'Alvear Palace Hotel', zone: 'Recoleta', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 1.800-3.200', rating: 4.8, tips: ['O grande dame portenho - chá da tarde e mordomos desde 1932'] },
    { id: 'bue-h-casasur', name: 'CasaSur Palermo', zone: 'Palermo', tier: 'upscale', personaTags: ['couple', 'family'], priceRangeBRL: 'R$ 700-1.200', rating: 4.6, tips: ['Conforto contemporâneo a passos dos bosques'] },
    { id: 'bue-h-duhau', name: 'Palacio Duhau - Park Hyatt', zone: 'Recoleta', tier: 'upscale', personaTags: ['couple', 'family'], priceRangeBRL: 'R$ 1.600-2.800', rating: 4.8, tips: ['Palácio com jardins escalonados - elegância máxima'] },
    { id: 'bue-h-four-seasons', name: 'Four Seasons Buenos Aires', zone: 'Retiro', tier: 'upscale', personaTags: ['family', 'couple'], priceRangeBRL: 'R$ 1.400-2.500', rating: 4.7, tips: ['Mansão belle époque + torre moderna - piscina e kids amados'] },
    { id: 'bue-h-home', name: 'Home Hotel', zone: 'Palermo Hollywood', tier: 'mid', personaTags: ['couple'], priceRangeBRL: 'R$ 500-900', rating: 4.6, tips: ['O boutique que inventou Palermo Hollywood - jardim com piscina'] },
    { id: 'bue-h-milhouse', name: 'Milhouse Hostel Avenue', zone: 'Centro', tier: 'budget', personaTags: ['solo'], priceRangeBRL: 'R$ 90-220', rating: 4.4, tips: ['O hostel-festa clássico de BA - social ao extremo'] },
    { id: 'bue-h-mine', name: 'Mine Hotel', zone: 'Palermo Soho', tier: 'mid', personaTags: ['couple'], priceRangeBRL: 'R$ 450-800', rating: 4.5, tips: ['Boutique no coração do Soho - base perfeita de bares e feiras'] },
    { id: 'bue-h-pulitzer', name: 'Hotel Pulitzer', zone: 'Centro', tier: 'mid', personaTags: ['family', 'solo'], priceRangeBRL: 'R$ 400-700', rating: 4.5, tips: ['Design com rooftop perto da Corrientes - teatro na porta'] },
    { id: 'bue-h-sofitel-recoleta', name: 'Sofitel Buenos Aires Recoleta', zone: 'Recoleta', tier: 'upscale', personaTags: ['couple', 'family'], priceRangeBRL: 'R$ 1.200-2.200', rating: 4.6, tips: ['Francês-portenho na Recoleta, a pé da Av. Alvear e do cemitério'] },
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
  'Cidade do Cabo': [
    { id: 'cpt-h-cape-town-lodge', name: 'Cape Town Lodge Hotel', zone: 'CBD', tier: 'budget', personaTags: ['family', 'couple'], priceRangeBRL: 'R$ 300-500', rating: 4.3, tips: ['Central e sem frescura, a pé do Company Garden'] },
    { id: 'cpt-h-fire-ice', name: 'Protea Hotel Fire & Ice! Cape Town', zone: 'CBD', tier: 'mid', personaTags: ['couple', 'solo'], priceRangeBRL: 'R$ 500-800', rating: 4.4, tips: ['Descolado, com milkshakes famosos e Long Street a duas quadras'] },
    { id: 'cpt-h-mount-nelson', name: 'Belmond Mount Nelson Hotel', zone: 'Gardens', tier: 'upscale', personaTags: ['couple', 'family'], priceRangeBRL: 'R$ 2.500-5.000', rating: 4.7, tips: ['O hotel rosa de 1899 com jardins e o chá da tarde mais famoso da cidade'] },
    { id: 'cpt-h-once', name: 'Once in Cape Town', zone: 'Gardens', tier: 'budget', personaTags: ['solo', 'couple'], priceRangeBRL: 'R$ 150-350', rating: 4.5, tips: ['Hostel-boutique no sopé da Table Mountain, Kloof Street na porta'] },
    { id: 'cpt-h-one-only', name: 'One&Only Cape Town', zone: 'V&A Waterfront', tier: 'upscale', personaTags: ['couple', 'family'], priceRangeBRL: 'R$ 3.000-6.000', rating: 4.7, tips: ['Ilha privada no Waterfront com a Table Mountain emoldurada'] },
    { id: 'cpt-h-protea-sea-point', name: 'Protea Hotel by Marriott Cape Town Sea Point', zone: 'Sea Point', tier: 'budget', personaTags: ['family'], priceRangeBRL: 'R$ 350-550', rating: 4.3, tips: ['Calçadão de Sea Point e pôr do sol do Atlântico pela janela'] },
    { id: 'cpt-h-radisson-red', name: 'Radisson RED Hotel V&A Waterfront', zone: 'V&A Waterfront', tier: 'mid', personaTags: ['couple', 'solo'], priceRangeBRL: 'R$ 650-1.000', rating: 4.5, tips: ['Rooftop com piscina sobre o Waterfront — jovem e bem localizado'] },
    { id: 'cpt-h-silo', name: 'The Silo Hotel', zone: 'V&A Waterfront', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 4.000-8.000', rating: 4.8, tips: ['Janelas de vidro facetado sobre o museu Zeitz MOCAA — ícone de design'] },
    { id: 'cpt-h-winchester', name: 'The Winchester Hotel', zone: 'Sea Point', tier: 'mid', personaTags: ['couple', 'family'], priceRangeBRL: 'R$ 600-950', rating: 4.5, tips: ['Clássico de frente para o mar com pátio de jazz aos domingos'] },
  ],
  'Dubai': [
    { id: 'dxb-h-address-dt', name: 'Address Downtown', zone: 'Downtown', tier: 'upscale', personaTags: ['couple', 'family'], priceRangeBRL: 'R$ 2.000-3.500', rating: 4.7, tips: ['A fonte dançante e o Burj Khalifa na varanda'] },
    { id: 'dxb-h-anantara-palm', name: 'Anantara The Palm', zone: 'Palm Jumeirah', tier: 'resort', personaTags: ['couple'], priceRangeBRL: 'R$ 1.800-3.000', rating: 4.6, tips: ['Vilas sobre a água estilo Maldivas — lua de mel na Palm'] },
    { id: 'dxb-h-atlantis', name: 'Atlantis The Palm', zone: 'Palm Jumeirah', tier: 'resort', personaTags: ['family'], priceRangeBRL: 'R$ 2.500-5.000', rating: 4.7, tips: ['O resort-ícone com Aquaventure e aquário inclusos — férias dentro do hotel'] },
    { id: 'dxb-h-burj-arab', name: 'Burj Al Arab', zone: 'Jumeirah', tier: 'resort', personaTags: ['couple'], priceRangeBRL: 'R$ 8.000-15.000', rating: 4.8, tips: ['A vela mais famosa do mundo — mordomo, Rolls e mar privado'] },
    { id: 'dxb-h-jumeirah-beach', name: 'Jumeirah Beach Hotel', zone: 'Jumeirah', tier: 'resort', personaTags: ['family'], priceRangeBRL: 'R$ 2.200-3.800', rating: 4.6, tips: ['A onda de vidro com praia privada e Wild Wadi grátis'] },
    { id: 'dxb-h-premier-ibn', name: 'Premier Inn Ibn Battuta', zone: 'Jebel Ali', tier: 'budget', personaTags: ['family'], priceRangeBRL: 'R$ 300-500', rating: 4.4, tips: ['Base econômica no metrô — família com orçamento curto'] },
    { id: 'dxb-h-rove-dt', name: 'Rove Downtown', zone: 'Downtown', tier: 'budget', personaTags: ['family', 'solo'], priceRangeBRL: 'R$ 400-650', rating: 4.6, tips: ['O budget-esperto de Dubai — vista do Burj por preço de gente'] },
    { id: 'dxb-h-vida-dt', name: 'Vida Downtown', zone: 'Downtown', tier: 'mid', personaTags: ['couple', 'solo'], priceRangeBRL: 'R$ 800-1.300', rating: 4.5, tips: ['Boutique descolado a pé do Dubai Mall'] },
  ],
  'Fortaleza': [
    { id: 'for-h-gran-mareiro', name: 'Gran Mareiro', zone: 'Praia do Futuro', tier: 'resort', personaTags: ['family'], priceRangeBRL: 'R$ 500-900', rating: 4.5, tips: ['Pé na areia com clube de praia próprio - família feliz'] },
    { id: 'for-h-gran-marquise', name: 'Gran Marquise', zone: 'Mucuripe', tier: 'upscale', personaTags: ['family', 'couple'], priceRangeBRL: 'R$ 800-1.400', rating: 4.7, tips: ['O 5 estrelas da Beira-Mar - serviço impecável e mar na janela'] },
    { id: 'for-h-ibis-iracema', name: 'Ibis Fortaleza Praia de Iracema', zone: 'Praia de Iracema', tier: 'budget', personaTags: ['solo', 'family'], priceRangeBRL: 'R$ 200-350', rating: 4.4, tips: ['Econômico perto da noite de Iracema'] },
    { id: 'for-h-luzeiros', name: 'Hotel Luzeiros', zone: 'Meireles', tier: 'upscale', personaTags: ['family', 'couple'], priceRangeBRL: 'R$ 600-1.000', rating: 4.5, tips: ['Design frente-mar na Beira-Mar - café da manhã elogiado'] },
    { id: 'for-h-magna', name: 'Carmel Magna Praia', zone: 'Meireles', tier: 'mid', personaTags: ['family'], priceRangeBRL: 'R$ 400-650', rating: 4.4, tips: ['Frente-mar funcional na Beira-Mar'] },
    { id: 'for-h-praiano', name: 'Praiano Hotel', zone: 'Meireles', tier: 'budget', personaTags: ['family'], priceRangeBRL: 'R$ 250-400', rating: 4.3, tips: ['Na Beira-Mar por preço de pousada — simples e bem localizado'] },
    { id: 'for-h-refugio', name: 'Refúgio Hostel Fortaleza', zone: 'Praia de Iracema', tier: 'budget', personaTags: ['solo'], priceRangeBRL: 'R$ 70-180', rating: 4.6, tips: ['O hostel querido da cidade - clima de casa'] },
    { id: 'for-h-sonata-iracema', name: 'Sonata de Iracema', zone: 'Praia de Iracema', tier: 'mid', personaTags: ['couple', 'family'], priceRangeBRL: 'R$ 350-550', rating: 4.5, tips: ['Em frente ao mar na Iracema, perto dos bares e do Dragão do Mar'] },
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
  'Istambul': [
    { id: 'ist-h-agora', name: 'Agora Guesthouse', zone: 'Sultanahmet', tier: 'budget', personaTags: ['couple', 'solo'], priceRangeBRL: 'R$ 250-400', rating: 4.6, tips: ['Café no terraço de frente para o Mármara, a pé de tudo'] },
    { id: 'ist-h-amira', name: 'Hotel Amira Istanbul', zone: 'Sultanahmet', tier: 'mid', personaTags: ['couple'], priceRangeBRL: 'R$ 550-850', rating: 4.7, tips: ['Terraço com vista do Bósforo e serviço que vira elogio em toda avaliação'] },
    { id: 'ist-h-cheers', name: 'Cheers Hostel', zone: 'Sultanahmet', tier: 'budget', personaTags: ['solo'], priceRangeBRL: 'R$ 120-250', rating: 4.5, tips: ['Terraço com vista da Hagia Sophia — mochileiro no coração histórico'] },
    { id: 'ist-h-ciragan', name: 'Çırağan Palace Kempinski', zone: 'Beşiktaş', tier: 'upscale', personaTags: ['couple', 'family'], priceRangeBRL: 'R$ 3.000-7.000', rating: 4.7, tips: ['Palácio otomano à beira do Bósforo com piscina infinita sobre a água'] },
    { id: 'ist-h-four-seasons-sultanahmet', name: 'Four Seasons Hotel Istanbul at Sultanahmet', zone: 'Sultanahmet', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 3.500-6.500', rating: 4.8, tips: ['A antiga prisão neoclássica virou o hotel mais charmoso da península'] },
    { id: 'ist-h-hanedan', name: 'Hanedan Hotel', zone: 'Sultanahmet', tier: 'budget', personaTags: ['family', 'couple'], priceRangeBRL: 'R$ 250-420', rating: 4.5, tips: ['Familiar e silencioso a 5 min da Mesquita Azul'] },
    { id: 'ist-h-ottoman-imperial', name: 'Ottoman Hotel Imperial', zone: 'Sultanahmet', tier: 'mid', personaTags: ['couple', 'family'], priceRangeBRL: 'R$ 500-800', rating: 4.6, tips: ['Casarão otomano de frente para a Hagia Sophia'] },
    { id: 'ist-h-pera-palace', name: 'Pera Palace Hotel', zone: 'Beyoğlu', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 1.800-3.200', rating: 4.6, tips: ['O hotel do Expresso do Oriente e de Agatha Christie — Beyoğlu histórico'] },
    { id: 'ist-h-sirkeci-mansion', name: 'Sirkeci Mansion', zone: 'Sirkeci', tier: 'mid', personaTags: ['family', 'couple'], priceRangeBRL: 'R$ 600-950', rating: 4.7, tips: ['Piscina coberta, aulas de culinária e Topkapi a pé — o favorito das famílias'] },
  ],
  'Lisboa': [
    { id: 'lis-h-bairro-alto', name: 'Bairro Alto Hotel', zone: 'Bairro Alto', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 1.600-2.800', rating: 4.7, tips: ['Boutique histórico entre o Chiado e o Bairro Alto - rooftop pro Tejo'] },
    { id: 'lis-h-browns', name: 'Browns Central', zone: 'Baixa', tier: 'mid', personaTags: ['couple', 'solo'], priceRangeBRL: 'R$ 450-800', rating: 4.5, tips: ['Boutique acessível no miolo da Baixa'] },
    { id: 'lis-h-corpo-santo', name: 'Corpo Santo Lisbon', zone: 'Cais do Sodré', tier: 'upscale', personaTags: ['couple', 'family'], priceRangeBRL: 'R$ 800-1.400', rating: 4.7, tips: ['5 estrelas com muralha fernandina no subsolo - localização total'] },
    { id: 'lis-h-home-hostel', name: 'Home Lisbon Hostel', zone: 'Baixa', tier: 'budget', personaTags: ['solo'], priceRangeBRL: 'R$ 100-250', rating: 4.7, tips: ['Multi-premiado - o jantar da mamma é lendário entre mochileiros'] },
    { id: 'lis-h-lx-boutique', name: 'LX Boutique Hotel', zone: 'Cais do Sodré', tier: 'mid', personaTags: ['couple'], priceRangeBRL: 'R$ 650-1.000', rating: 4.5, tips: ['Boutique de frente para o Tejo, Time Out Market na esquina'] },
    { id: 'lis-h-martinhal', name: 'Martinhal Lisbon Chiado', zone: 'Chiado', tier: 'resort', personaTags: ['family'], priceRangeBRL: 'R$ 1.100-2.000', rating: 4.7, tips: ['O apart-hotel DESENHADO pra famílias - kids club no centro de Lisboa'] },
    { id: 'lis-h-memmo', name: 'Memmo Alfama', zone: 'Alfama', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 1.000-1.800', rating: 4.6, tips: ['Escondido na Alfama com piscina vermelha sobre os telhados'] },
    { id: 'lis-h-mundial', name: 'Hotel Mundial', zone: 'Baixa', tier: 'mid', personaTags: ['family'], priceRangeBRL: 'R$ 500-900', rating: 4.4, tips: ['Clássico da Baixa com rooftop pro Castelo - prático pra tudo a pé'] },
    { id: 'lis-h-my-story-rossio', name: 'My Story Hotel Rossio', zone: 'Baixa', tier: 'mid', personaTags: ['couple', 'family'], priceRangeBRL: 'R$ 600-950', rating: 4.5, tips: ['Na praça do Rossio, a pé de Alfama e Chiado'] },
    { id: 'lis-h-pestana-palace', name: 'Pestana Palace', zone: 'Alcântara', tier: 'resort', personaTags: ['couple', 'family'], priceRangeBRL: 'R$ 1.200-2.200', rating: 4.7, tips: ['Palácio nacional com jardins e piscinas - viver como rei'] },
    { id: 'lis-h-yes-hostel', name: 'Yes! Lisbon Hostel', zone: 'Baixa', tier: 'budget', personaTags: ['solo'], priceRangeBRL: 'R$ 120-250', rating: 4.7, tips: ['Um dos hostels mais premiados do mundo, no centro da Baixa'] },
  ],
  'Londres': [
    { id: 'lon-h-citizenm-bank', name: 'citizenM Bankside', zone: 'South Bank', tier: 'mid', personaTags: ['couple', 'solo'], priceRangeBRL: 'R$ 900-1.400', rating: 4.5, tips: ['Design compacto atrás da Tate Modern'] },
    { id: 'lon-h-hoxton-hol', name: 'The Hoxton Holborn', zone: 'Holborn', tier: 'mid', personaTags: ['couple', 'solo'], priceRangeBRL: 'R$ 1.100-1.800', rating: 4.5, tips: ['O boutique descolado com lobby que é point'] },
    { id: 'lon-h-park-plaza-w', name: 'Park Plaza Westminster Bridge', zone: 'Westminster', tier: 'mid', personaTags: ['family'], priceRangeBRL: 'R$ 1.100-1.800', rating: 4.5, tips: ['De frente pro Big Ben com piscina — família no epicentro'] },
    { id: 'lon-h-premier-ch', name: 'Premier Inn County Hall', zone: 'South Bank', tier: 'budget', personaTags: ['family'], priceRangeBRL: 'R$ 700-1.100', rating: 4.6, tips: ['Ao lado do London Eye por preço de rede — o segredo das famílias'] },
    { id: 'lon-h-savoy', name: 'The Savoy', zone: 'Strand', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 4.500-8.000', rating: 4.7, tips: ['A lenda art déco do Tâmisa — chá, história e mordomia'] },
    { id: 'lon-h-strand-palace', name: 'Strand Palace', zone: 'Strand', tier: 'mid', personaTags: ['family', 'couple'], priceRangeBRL: 'R$ 900-1.400', rating: 4.4, tips: ['Clássico central a pé do Covent Garden'] },
    { id: 'lon-h-zedwell', name: 'Zedwell Piccadilly', zone: 'Piccadilly', tier: 'budget', personaTags: ['solo', 'couple'], priceRangeBRL: 'R$ 600-950', rating: 4.4, tips: ['Casulos silenciosos no meio do caos do Piccadilly'] },
  ],
  'Marrakech': [
    { id: 'rak-h-equity-point', name: 'Equity Point Marrakech', zone: 'Medina', tier: 'budget', personaTags: ['solo'], priceRangeBRL: 'R$ 100-250', rating: 4.3, tips: ['Piscina no pátio e Jemaa el-Fna a 10 minutos a pé'] },
    { id: 'rak-h-four-seasons', name: 'Four Seasons Resort Marrakech', zone: 'Hivernage', tier: 'upscale', personaTags: ['family', 'couple'], priceRangeBRL: 'R$ 2.500-4.500', rating: 4.7, tips: ['Piscinas, kids club e Atlas no horizonte — o resort de família'] },
    { id: 'rak-h-jardins-koutoubia', name: 'Les Jardins de la Koutoubia', zone: 'Medina', tier: 'mid', personaTags: ['family', 'couple'], priceRangeBRL: 'R$ 900-1.600', rating: 4.6, tips: ['Hotel com três piscinas a passos da Koutoubia e da praça'] },
    { id: 'rak-h-mamounia', name: 'La Mamounia', zone: 'Hivernage', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 4.000-9.000', rating: 4.8, tips: ['O palácio de Churchill — jardins de 8 hectares e o hotel mais famoso da África'] },
    { id: 'rak-h-riad-clos-des-arts', name: 'Riad Le Clos des Arts', zone: 'Medina', tier: 'mid', personaTags: ['couple'], priceRangeBRL: 'R$ 550-900', rating: 4.8, tips: ['Riad de artista com piscina, hammam e jantar no terraço'] },
    { id: 'rak-h-riad-dar-anika', name: 'Riad Dar Anika', zone: 'Medina', tier: 'budget', personaTags: ['couple'], priceRangeBRL: 'R$ 300-500', rating: 4.7, tips: ['Riad pequeno e impecável perto da praça — o custo-benefício da medina'] },
    { id: 'rak-h-riad-kniza', name: 'Riad Kniza', zone: 'Medina', tier: 'mid', personaTags: ['couple', 'family'], priceRangeBRL: 'R$ 900-1.500', rating: 4.8, tips: ['Riad do século XVIII de uma família de antiquários — serviço de palácio'] },
    { id: 'rak-h-rodamon', name: 'Rodamon Riad Marrakech', zone: 'Medina', tier: 'budget', personaTags: ['solo', 'couple'], priceRangeBRL: 'R$ 120-280', rating: 4.5, tips: ['Riad-hostel com piscina e terraço — mochileiro dentro da medina'] },
    { id: 'rak-h-royal-mansour', name: 'Royal Mansour Marrakech', zone: 'Medina', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 8.000-15.000', rating: 4.9, tips: ['Riads privados do rei, mordomo e spa de mármore — o topo absoluto'] },
  ],
  'Nova York': [
    { id: 'ny-h-1hotel-bk', name: '1 Hotel Brooklyn Bridge', zone: 'Dumbo', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 2.200-3.800', rating: 4.6, tips: ['Eco-chique com Manhattan inteira na janela'] },
    { id: 'ny-h-arlo-mid', name: 'Arlo Midtown', zone: 'Midtown West', tier: 'mid', personaTags: ['couple', 'solo'], priceRangeBRL: 'R$ 850-1.400', rating: 4.5, tips: ['Micro-quartos bem desenhados a passos da Times Square'] },
    { id: 'ny-h-beacon', name: 'Hotel Beacon', zone: 'Upper West Side', tier: 'mid', personaTags: ['family'], priceRangeBRL: 'R$ 1.200-2.000', rating: 4.6, tips: ['Suítes com kitchenette perto do Central Park — o favorito das famílias'] },
    { id: 'ny-h-citizenm-ts', name: 'citizenM Times Square', zone: 'Times Square', tier: 'mid', personaTags: ['couple', 'solo'], priceRangeBRL: 'R$ 900-1.500', rating: 4.5, tips: ['Design compacto e rooftop — dormir no meio do show'] },
    { id: 'ny-h-moxy-chelsea', name: 'Moxy Chelsea', zone: 'Chelsea', tier: 'mid', personaTags: ['solo', 'couple'], priceRangeBRL: 'R$ 800-1.300', rating: 4.4, tips: ['Jovem, com rooftop-jardim e localização esperta'] },
    { id: 'ny-h-plaza', name: 'The Plaza', zone: 'Central Park South', tier: 'upscale', personaTags: ['couple', 'family'], priceRangeBRL: 'R$ 4.000-8.000', rating: 4.6, tips: ['O hotel-lenda de Home Alone na esquina do Central Park'] },
    { id: 'ny-h-pod51', name: 'Pod 51', zone: 'Midtown East', tier: 'budget', personaTags: ['solo'], priceRangeBRL: 'R$ 450-700', rating: 4.3, tips: ['Cabines espertas pra quem só quer dormir e explorar'] },
  ],
  'Orlando': [
    { id: 'orl-h-art-animation', name: 'Disney Art of Animation Resort', zone: 'Disney World', tier: 'resort', personaTags: ['family'], priceRangeBRL: 'R$ 1.000-1.700', rating: 4.6, tips: ['Suítes temáticas Carros/Nemo - imersão Disney com transporte grátis'] },
    { id: 'orl-h-cabana-bay', name: 'Universal Cabana Bay Beach Resort', zone: 'Universal', tier: 'resort', personaTags: ['family'], priceRangeBRL: 'R$ 800-1.400', rating: 4.6, tips: ['Retrô anos 50 com lazy river - o melhor valor da Universal (early access!)'] },
    { id: 'orl-h-drury', name: 'Drury Plaza Hotel Disney Springs', zone: 'Lake Buena Vista', tier: 'mid', personaTags: ['family'], priceRangeBRL: 'R$ 600-1.000', rating: 4.7, tips: ['Refeições e happy hour INCLUSOS - a conta fecha bonito pra família'] },
    { id: 'orl-h-floridays', name: 'Floridays Resort', zone: 'I-Drive', tier: 'mid', personaTags: ['family'], priceRangeBRL: 'R$ 500-850', rating: 4.5, tips: ['Suítes de 2-3 quartos com cozinha - família grande cabe'] },
    { id: 'orl-h-four-seasons', name: 'Four Seasons Resort Orlando', zone: 'Disney World', tier: 'resort', personaTags: ['family'], priceRangeBRL: 'R$ 3.500-6.500', rating: 4.8, tips: ['O luxo dentro da Disney - lazy river e adults pool separada'] },
    { id: 'orl-h-grand-cypress', name: 'Hyatt Regency Grand Cypress', zone: 'Lake Buena Vista', tier: 'resort', personaTags: ['family'], priceRangeBRL: 'R$ 1.200-2.000', rating: 4.6, tips: ['Piscina-caverna com tobogãs a minutos da Disney'] },
    { id: 'orl-h-shingle-creek', name: 'Rosen Shingle Creek', zone: 'Universal Blvd', tier: 'resort', personaTags: ['family'], priceRangeBRL: 'R$ 700-1.200', rating: 4.6, tips: ['Resort gigante com golfe e piscinas - espaço de sobra'] },
  ],
  'Paris': [
    { id: 'par-h-citadines-eiffel', name: 'Citadines Tour Eiffel', zone: '15e', tier: 'mid', personaTags: ['family'], priceRangeBRL: 'R$ 800-1.300', rating: 4.4, tips: ['Apart-hotel com cozinha perto da Torre - o formato que família agradece'] },
    { id: 'par-h-fabric', name: 'Hôtel Fabric', zone: 'Oberkampf', tier: 'mid', personaTags: ['couple', 'solo'], priceRangeBRL: 'R$ 700-1.100', rating: 4.6, tips: ['Antiga fábrica têxtil virada boutique industrial-chic'] },
    { id: 'par-h-generator', name: 'Generator Paris', zone: 'Canal Saint-Martin', tier: 'budget', personaTags: ['solo'], priceRangeBRL: 'R$ 150-350', rating: 4.3, tips: ['Hostel-design com rooftop pro Sacré-Coeur'] },
    { id: 'par-h-grands-boulevards', name: 'Hôtel des Grands Boulevards', zone: 'Grands Boulevards', tier: 'mid', personaTags: ['couple'], priceRangeBRL: 'R$ 900-1.500', rating: 4.5, tips: ['Boutique gastronômico com pátio - o hype certo'] },
    { id: 'par-h-novotel-halles', name: 'Novotel Paris Les Halles', zone: 'Les Halles', tier: 'mid', personaTags: ['family'], priceRangeBRL: 'R$ 900-1.400', rating: 4.5, tips: ['Central absoluto e família-friendly - metrô de tudo na porta'] },
    { id: 'par-h-pavillon-reine', name: 'Le Pavillon de la Reine', zone: 'Marais', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 2.200-3.800', rating: 4.7, tips: ['Escondido na Place des Vosges - romance absoluto no Marais'] },
    { id: 'par-h-plaza-athenee', name: 'Hôtel Plaza Athénée', zone: 'Champs-Élysées', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 5.000-9.000', rating: 4.7, tips: ['As sacadas de gerânios da Avenue Montaigne - alta-costura em hotel'] },
    { id: 'par-h-relais-christine', name: 'Relais Christine', zone: 'Saint-Germain', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 1.800-3.000', rating: 4.7, tips: ['Mansão do século XVI com jardim em Saint-Germain'] },
  ],
  'Porto Seguro': [
    { id: 'pse-h-alto-pitinga', name: 'Pousada Alto da Pitinga', zone: 'Arraial d Ajuda', tier: 'mid', personaTags: ['couple', 'family'], priceRangeBRL: 'R$ 350-600', rating: 4.6, tips: ['Pousada com clima de vila perto do Mucugê'] },
    { id: 'pse-h-arraial-eco', name: 'Arraial d\'Ajuda Eco Resort', zone: 'Arraial d Ajuda', tier: 'resort', personaTags: ['family'], priceRangeBRL: 'R$ 900-1.600', rating: 4.5, tips: ['Resort de reserva ecológica entre a balsa e a vila - praia calma'] },
    { id: 'pse-h-club-med', name: 'Club Med Trancoso', zone: 'Trancoso', tier: 'resort', personaTags: ['family'], priceRangeBRL: 'R$ 2.000-3.500', rating: 4.6, tips: ['All-inclusive à beira da falésia - kids club que salva férias'] },
    { id: 'pse-h-fasano-trancoso', name: 'Fasano Trancoso', zone: 'Trancoso', tier: 'resort', personaTags: ['couple'], priceRangeBRL: 'R$ 3.500-7.000', rating: 4.8, tips: ['Bangalôs com piscinas privadas sobre a praia de Itapororoca'] },
    { id: 'pse-h-maitei', name: 'Maitei Hotel', zone: 'Arraial d Ajuda', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 800-1.400', rating: 4.7, tips: ['Vista dos mirantes de Arraial - adults-friendly romântico'] },
    { id: 'pse-h-uxua', name: 'Uxua Casa Hotel & Spa', zone: 'Trancoso', tier: 'resort', personaTags: ['couple'], priceRangeBRL: 'R$ 3.000-6.000', rating: 4.8, tips: ['As casas do Quadrado viradas hotel-lenda - design de Wilbert Das'] },
    { id: 'pse-h-villas-trancoso', name: 'Villas de Trancoso', zone: 'Trancoso', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 1.500-2.800', rating: 4.7, tips: ['Pé na areia charmoso a caminhada do Quadrado'] },
  ],
  'Rio de Janeiro': [
    { id: 'rio-h-arena', name: 'Arena Copacabana', zone: 'Copacabana', tier: 'mid', personaTags: ['family', 'couple'], priceRangeBRL: 'R$ 500-900', rating: 4.4, tips: ['Frente-mar honesto com rooftop - custo-benefício raro na orla'] },
    { id: 'rio-h-arena-copa', name: 'Arena Copacabana Hotel', zone: 'Copacabana', tier: 'mid', personaTags: ['couple', 'family'], priceRangeBRL: 'R$ 600-950', rating: 4.5, tips: ['Rooftop com piscina de frente para a praia de Copacabana'] },
    { id: 'rio-h-copa-palace', name: 'Copacabana Palace', zone: 'Copacabana', tier: 'resort', personaTags: ['couple', 'family'], priceRangeBRL: 'R$ 3.000-6.000', rating: 4.8, tips: ['O hotel-lenda do Brasil - piscina icônica e glamour centenário'] },
    { id: 'rio-h-fairmont', name: 'Fairmont Rio Copacabana', zone: 'Copacabana', tier: 'upscale', personaTags: ['family', 'couple'], priceRangeBRL: 'R$ 1.500-2.800', rating: 4.6, tips: ['Moderno no Posto 6 - piscinas com vista e estrutura família'] },
    { id: 'rio-h-hilton-copa', name: 'Hilton Copacabana', zone: 'Copacabana', tier: 'upscale', personaTags: ['family'], priceRangeBRL: 'R$ 1.000-1.800', rating: 4.5, tips: ['Rooftop com vista total da praia - confiável pra família'] },
    { id: 'rio-h-ibis-copa', name: 'Ibis Copacabana Posto 2', zone: 'Copacabana', tier: 'budget', personaTags: ['family', 'solo'], priceRangeBRL: 'R$ 300-500', rating: 4.4, tips: ['O básico bem-feito a 2 quadras da praia'] },
    { id: 'rio-h-janeiro', name: 'Janeiro Hotel', zone: 'Leblon', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 1.800-3.200', rating: 4.6, tips: ['Boutique design com vista pro mar do Leblon - romance carioca'] },
    { id: 'rio-h-santa-teresa', name: 'Santa Teresa Hotel MGallery', zone: 'Santa Teresa', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 1.400-2.500', rating: 4.7, tips: ['Casarão colonial no alto boêmio - piscina entre árvores'] },
    { id: 'rio-h-windsor-excelsior', name: 'Windsor Excelsior Copacabana', zone: 'Copacabana', tier: 'mid', personaTags: ['family'], priceRangeBRL: 'R$ 550-900', rating: 4.5, tips: ['Rede carioca de frente para o mar, café da manhã elogiado'] },
  ],
  'Roma': [
    { id: 'rom-h-artemide', name: 'Hotel Artemide', zone: 'Via Nazionale', tier: 'upscale', personaTags: ['family', 'couple'], priceRangeBRL: 'R$ 900-1.500', rating: 4.7, tips: ['O queridinho de avaliações - rooftop e serviço acima do preço'] },
    { id: 'rom-h-de-russie', name: 'Hotel de Russie', zone: 'Popolo', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 3.000-5.500', rating: 4.7, tips: ['Jardins secretos entre o Popolo e a Spagna - refúgio de estrelas'] },
    { id: 'rom-h-nerva', name: 'Nerva Boutique Hotel', zone: 'Monti', tier: 'mid', personaTags: ['couple', 'solo'], priceRangeBRL: 'R$ 550-900', rating: 4.6, tips: ['Boutique aos pés do Fórum no charmoso Monti'] },
    { id: 'rom-h-ponte-sisto', name: 'Hotel Ponte Sisto', zone: 'Centro Storico', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 1.000-1.700', rating: 4.6, tips: ['Pátio tranquilo a uma ponte de Trastevere'] },
    { id: 'rom-h-quirinale', name: 'Hotel Quirinale', zone: 'Via Nazionale', tier: 'mid', personaTags: ['family'], priceRangeBRL: 'R$ 600-1.000', rating: 4.4, tips: ['Clássico com jardim - entrada secreta pra Ópera de Roma'] },
    { id: 'rom-h-romehello', name: 'The RomeHello', zone: 'Termini', tier: 'budget', personaTags: ['solo'], priceRangeBRL: 'R$ 120-280', rating: 4.6, tips: ['Hostel-design com propósito social - o melhor budget de Roma'] },
    { id: 'rom-h-santa-maria', name: 'Hotel Santa Maria', zone: 'Trastevere', tier: 'mid', personaTags: ['family'], priceRangeBRL: 'R$ 700-1.200', rating: 4.6, tips: ['Claustro com laranjeiras em Trastevere - térreo e tranquilo pra família'] },
    { id: 'rom-h-senato', name: 'Albergo del Senato', zone: 'Pantheon', tier: 'mid', personaTags: ['couple'], priceRangeBRL: 'R$ 800-1.300', rating: 4.6, tips: ['Janelas de frente pro Pantheon - acordar com 2 mil anos de vista'] },
  ],
  'Salvador': [
    { id: 'ssa-h-deville', name: 'Deville Prime Salvador', zone: 'Itapuã', tier: 'resort', personaTags: ['family'], priceRangeBRL: 'R$ 700-1.100', rating: 4.6, tips: ['Resort urbano pé na areia de Itapuã - piscinas e recreação'] },
    { id: 'ssa-h-fasano', name: 'Fasano Salvador', zone: 'Comércio', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 1.500-2.800', rating: 4.7, tips: ['Art déco restaurado com rooftop pra Baía - o luxo soteropolitano'] },
    { id: 'ssa-h-fera', name: 'Fera Palace Hotel', zone: 'Comércio', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 900-1.600', rating: 4.6, tips: ['O palácio de 1934 renascido - piscina de borda na proa do Centro'] },
    { id: 'ssa-h-ibis-rv', name: 'Ibis Salvador Rio Vermelho', zone: 'Rio Vermelho', tier: 'budget', personaTags: ['family', 'solo'], priceRangeBRL: 'R$ 250-400', rating: 4.4, tips: ['Base econômica no melhor bairro gastronômico'] },
    { id: 'ssa-h-laranjeiras', name: 'Laranjeiras Hostel', zone: 'Pelourinho', tier: 'budget', personaTags: ['solo'], priceRangeBRL: 'R$ 80-200', rating: 4.4, tips: ['Hostel histórico no Pelô - mochileiro com cultura na porta'] },
    { id: 'ssa-h-mercure-rv', name: 'Mercure Salvador Rio Vermelho', zone: 'Rio Vermelho', tier: 'mid', personaTags: ['family', 'couple'], priceRangeBRL: 'R$ 400-700', rating: 4.4, tips: ['No bairro do acarajé e da noite - praticidade com vista'] },
    { id: 'ssa-h-villa-bahia', name: 'Hotel Villa Bahia', zone: 'Pelourinho', tier: 'mid', personaTags: ['couple'], priceRangeBRL: 'R$ 600-1.000', rating: 4.6, tips: ['Boutique colonial no coração do Pelô - café no pátio'] },
    { id: 'ssa-h-wish', name: 'Wish Hotel da Bahia', zone: 'Campo Grande', tier: 'upscale', personaTags: ['family', 'couple'], priceRangeBRL: 'R$ 700-1.200', rating: 4.5, tips: ['O clássico histórico com piscina e obras de Carybé'] },
  ],
  'Singapura': [
    { id: 'sin-h-carlton', name: 'Carlton Hotel Singapore', zone: 'City Hall', tier: 'mid', personaTags: ['family', 'couple'], priceRangeBRL: 'R$ 800-1.300', rating: 4.5, tips: ['Ao lado do Raffles e do CHIJMES, piscina no terraço'] },
    { id: 'sin-h-fullerton', name: 'The Fullerton Hotel Singapore', zone: 'Marina Bay', tier: 'upscale', personaTags: ['couple', 'family'], priceRangeBRL: 'R$ 2.000-3.500', rating: 4.7, tips: ['O antigo prédio dos Correios na foz do rio — clássico com vista da Marina'] },
    { id: 'sin-h-hotel-g', name: 'Hotel G Singapore', zone: 'Bugis', tier: 'budget', personaTags: ['couple', 'solo'], priceRangeBRL: 'R$ 450-700', rating: 4.4, tips: ['Design compacto, café bom e metrô Bencoolen na porta'] },
    { id: 'sin-h-ibis-bencoolen', name: 'ibis Singapore on Bencoolen', zone: 'Bugis', tier: 'budget', personaTags: ['family'], priceRangeBRL: 'R$ 450-700', rating: 4.3, tips: ['Rede previsível no meio de tudo — base barata numa cidade cara'] },
    { id: 'sin-h-marina-bay-sands', name: 'Marina Bay Sands', zone: 'Marina Bay', tier: 'upscale', personaTags: ['couple', 'family'], priceRangeBRL: 'R$ 2.500-4.500', rating: 4.6, tips: ['A piscina infinita no 57º andar — o cartão-postal em que se dorme'] },
    { id: 'sin-h-park-regis', name: 'Park Regis Singapore', zone: 'Clarke Quay', tier: 'mid', personaTags: ['couple', 'solo'], priceRangeBRL: 'R$ 600-1.000', rating: 4.3, tips: ['Clarke Quay e Chinatown a pé — piscina e quartos modernos'] },
    { id: 'sin-h-pod-beach-road', name: 'The Pod @ Beach Road', zone: 'Bugis', tier: 'budget', personaTags: ['solo'], priceRangeBRL: 'R$ 200-350', rating: 4.5, tips: ['Cápsulas limpas e silenciosas a pé de Bugis e Kampong Glam'] },
    { id: 'sin-h-raffles', name: 'Raffles Singapore', zone: 'City Hall', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 5.000-9.000', rating: 4.8, tips: ['O hotel colonial de 1887 onde nasceu o Singapore Sling'] },
  ],
  'Tóquio': [
    { id: 'tok-h-asakusa-view', name: 'Asakusa View Hotel', zone: 'Asakusa', tier: 'mid', personaTags: ['family'], priceRangeBRL: 'R$ 500-900', rating: 4.4, tips: ['Vista do Senso-ji e da Skytree - a Tóquio tradicional na janela'] },
    { id: 'tok-h-gracery', name: 'Hotel Gracery Shinjuku', zone: 'Shinjuku', tier: 'mid', personaTags: ['family'], priceRangeBRL: 'R$ 600-1.000', rating: 4.4, tips: ['O hotel do Godzilla na fachada - crianças em êxtase em Kabukicho'] },
    { id: 'tok-h-hoshinoya', name: 'Hoshinoya Tokyo', zone: 'Otemachi', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 3.500-6.000', rating: 4.7, tips: ['Ryokan de luxo vertical - onsen no topo de um arranha-céu'] },
    { id: 'tok-h-mimaru-ueno', name: 'Mimaru Tokyo Ueno', zone: 'Ueno', tier: 'mid', personaTags: ['family'], priceRangeBRL: 'R$ 700-1.200', rating: 4.6, tips: ['Apart-hotel DESENHADO pra famílias - quartos amplos e cozinha (raridade no Japão)'] },
    { id: 'tok-h-park-hyatt', name: 'Park Hyatt Tokyo', zone: 'Shinjuku', tier: 'upscale', personaTags: ['couple'], priceRangeBRL: 'R$ 2.800-5.000', rating: 4.7, tips: ['O hotel de Lost in Translation - piscina no céu e o bar New York'] },
    { id: 'tok-h-shibuya-excel', name: 'Shibuya Excel Hotel Tokyu', zone: 'Shibuya', tier: 'mid', personaTags: ['family', 'couple'], priceRangeBRL: 'R$ 700-1.100', rating: 4.4, tips: ['Em cima do cruzamento de Shibuya - localização cinematográfica'] },
    { id: 'tok-h-tokyu-stay', name: 'Tokyu Stay Shinjuku', zone: 'Shinjuku', tier: 'mid', personaTags: ['solo', 'couple'], priceRangeBRL: 'R$ 450-750', rating: 4.5, tips: ['Máquina de lavar no quarto - o prático japonês perfeito'] },
    { id: 'tok-h-unplan', name: 'UNPLAN Kagurazaka', zone: 'Kagurazaka', tier: 'budget', personaTags: ['solo'], priceRangeBRL: 'R$ 130-280', rating: 4.6, tips: ['Hostel impecável no bairro-Paris de Tóquio'] },
  ],
};

/** Hotéis curados da cidade, ou null se ela ainda não tem curadoria de hotel. */
export function getCuratedHotels(city: string): CuratedHotel[] | null {
  const list = curatedHotels[city];
  return list && list.length > 0 ? list : null;
}
