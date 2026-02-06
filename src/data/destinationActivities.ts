// Database of suggested activities by destination
// Used by the itinerary generator to create realistic daily schedules

export interface SuggestedActivity {
  id: string;
  name: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'morning' | 'afternoon' | 'night';
  neighborhood: string;
  rating: number;
  estimatedCostBRL: number;
  durationHours: number;
  tips: string[];
  styleTags: string[];
  bestTime?: string;
}

export interface DestinationData {
  cityName: string;
  cityCode: string;
  activities: SuggestedActivity[];
}

// Paris activities
const parisActivities: SuggestedActivity[] = [
  // BREAKFAST
  {
    id: 'paris-cafe-flore',
    name: 'Café de Flore',
    category: 'breakfast',
    neighborhood: 'Saint-Germain-des-Prés',
    rating: 4.5,
    estimatedCostBRL: 120,
    durationHours: 1,
    tips: ['Peça o croissant aux amandes - é divino!', 'Chegue antes das 9h para pegar mesa externa'],
    styleTags: ['gastronomy', 'culture', 'romantic'],
  },
  {
    id: 'paris-deux-magots',
    name: 'Les Deux Magots',
    category: 'breakfast',
    neighborhood: 'Saint-Germain-des-Prés',
    rating: 4.4,
    estimatedCostBRL: 130,
    durationHours: 1,
    tips: ['Sartre e Simone frequentavam aqui', 'O chocolate quente é famoso'],
    styleTags: ['gastronomy', 'culture', 'history'],
  },
  {
    id: 'paris-laduree',
    name: 'Ladurée',
    category: 'breakfast',
    neighborhood: 'Champs-Élysées',
    rating: 4.6,
    estimatedCostBRL: 100,
    durationHours: 1,
    tips: ['Macarons famosos no mundo todo', 'Ótimo para fotos instagramáveis'],
    styleTags: ['gastronomy', 'shopping'],
  },
  {
    id: 'paris-cafe-kitsune',
    name: 'Café Kitsuné',
    category: 'breakfast',
    neighborhood: 'Palais Royal',
    rating: 4.3,
    estimatedCostBRL: 90,
    durationHours: 1,
    tips: ['Hipster e moderno', 'Ótimo café especial'],
    styleTags: ['gastronomy', 'shopping'],
  },
  {
    id: 'paris-angelina',
    name: 'Angelina',
    category: 'breakfast',
    neighborhood: 'Tuileries',
    rating: 4.5,
    estimatedCostBRL: 110,
    durationHours: 1,
    tips: ['Chocolate quente mais famoso de Paris', 'Monte-Blanc é a sobremesa clássica'],
    styleTags: ['gastronomy', 'romantic'],
  },

  // LUNCH
  {
    id: 'paris-petit-cler',
    name: 'Le Petit Cler',
    category: 'lunch',
    neighborhood: '7º Arrondissement',
    rating: 4.4,
    estimatedCostBRL: 180,
    durationHours: 1.5,
    tips: ['Peça o menu du jour - melhor custo-benefício', 'Bistrô tradicional parisiense'],
    styleTags: ['gastronomy', 'budget'],
  },
  {
    id: 'paris-pink-mamma',
    name: 'Pink Mamma',
    category: 'lunch',
    neighborhood: '10º Arrondissement',
    rating: 4.6,
    estimatedCostBRL: 150,
    durationHours: 1.5,
    tips: ['Italiano instagramável', 'Chegue cedo para evitar fila de 1h'],
    styleTags: ['gastronomy', 'romantic'],
  },
  {
    id: 'paris-falafel',
    name: "L'As du Fallafel",
    category: 'lunch',
    neighborhood: 'Le Marais',
    rating: 4.7,
    estimatedCostBRL: 60,
    durationHours: 0.5,
    tips: ['Melhor falafel de Paris', 'Fila enorme mas vale a pena'],
    styleTags: ['gastronomy', 'budget'],
  },
  {
    id: 'paris-bouillon-pigalle',
    name: 'Bouillon Pigalle',
    category: 'lunch',
    neighborhood: 'Pigalle',
    rating: 4.4,
    estimatedCostBRL: 100,
    durationHours: 1,
    tips: ['Comida francesa tradicional e barata', 'Ambiente anos 1900'],
    styleTags: ['gastronomy', 'budget', 'history'],
  },
  {
    id: 'paris-breizh-cafe',
    name: 'Breizh Café',
    category: 'lunch',
    neighborhood: 'Le Marais',
    rating: 4.5,
    estimatedCostBRL: 90,
    durationHours: 1,
    tips: ['Melhores crêpes de Paris', 'Ingredientes orgânicos da Bretanha'],
    styleTags: ['gastronomy', 'family'],
  },

  // DINNER
  {
    id: 'paris-chartier',
    name: 'Le Bouillon Chartier',
    category: 'dinner',
    neighborhood: 'Grands Boulevards',
    rating: 4.3,
    estimatedCostBRL: 200,
    durationHours: 1.5,
    tips: ['Desde 1896 - ambiente histórico', 'Não aceita reserva - chegue 18:30 para evitar fila'],
    styleTags: ['gastronomy', 'history', 'budget'],
  },
  {
    id: 'paris-chez-janou',
    name: 'Chez Janou',
    category: 'dinner',
    neighborhood: 'Le Marais',
    rating: 4.5,
    estimatedCostBRL: 250,
    durationHours: 2,
    tips: ['Provençal autêntico', 'Mousse de chocolate infinito - literalmente!'],
    styleTags: ['gastronomy', 'romantic'],
  },
  {
    id: 'paris-relais-entrecote',
    name: "Le Relais de l'Entrecôte",
    category: 'dinner',
    neighborhood: 'Saint-Germain',
    rating: 4.4,
    estimatedCostBRL: 220,
    durationHours: 1.5,
    tips: ['Só serve um prato: entrecôte com molho secreto', 'Não aceita reserva'],
    styleTags: ['gastronomy'],
  },
  {
    id: 'paris-septime',
    name: 'Septime',
    category: 'dinner',
    neighborhood: '11º Arrondissement',
    rating: 4.7,
    estimatedCostBRL: 350,
    durationHours: 2.5,
    tips: ['Estrela Michelin acessível', 'Reserve com 3 semanas de antecedência'],
    styleTags: ['gastronomy', 'romantic'],
  },
  {
    id: 'paris-comptoir',
    name: 'Le Comptoir du Panthéon',
    category: 'dinner',
    neighborhood: 'Quartier Latin',
    rating: 4.2,
    estimatedCostBRL: 180,
    durationHours: 1.5,
    tips: ['Vista linda do Panthéon', 'Ótimo para jantar romântico'],
    styleTags: ['gastronomy', 'romantic', 'culture'],
  },

  // MORNING ATTRACTIONS
  {
    id: 'paris-louvre',
    name: 'Museu do Louvre',
    category: 'morning',
    neighborhood: '1º Arrondissement',
    rating: 4.8,
    estimatedCostBRL: 80,
    durationHours: 4,
    tips: ['Reserve ingresso online para evitar fila de 2h', 'Vá direto para Mona Lisa e depois explore'],
    styleTags: ['culture', 'history', 'art'],
  },
  {
    id: 'paris-orsay',
    name: "Museu d'Orsay",
    category: 'morning',
    neighborhood: '7º Arrondissement',
    rating: 4.7,
    estimatedCostBRL: 70,
    durationHours: 3,
    tips: ['Impressionistas no 5º andar', 'Relógio gigante rende foto icônica'],
    styleTags: ['culture', 'art'],
  },
  {
    id: 'paris-montmartre',
    name: 'Montmartre & Sacré-Cœur',
    category: 'morning',
    neighborhood: '18º Arrondissement',
    rating: 4.6,
    estimatedCostBRL: 0,
    durationHours: 3,
    tips: ['Comece cedo para evitar multidões', 'Suba pelo funicular ou escadas'],
    styleTags: ['culture', 'history', 'romantic'],
  },
  {
    id: 'paris-versailles',
    name: 'Palácio de Versailles',
    category: 'morning',
    neighborhood: 'Versailles (40min de trem)',
    rating: 4.8,
    estimatedCostBRL: 120,
    durationHours: 6,
    tips: ['Reserve um dia inteiro', 'Jardins são gratuitos fora da alta temporada'],
    styleTags: ['culture', 'history', 'art'],
  },
  {
    id: 'paris-notre-dame',
    name: 'Île de la Cité & Notre-Dame',
    category: 'morning',
    neighborhood: 'Île de la Cité',
    rating: 4.5,
    estimatedCostBRL: 0,
    durationHours: 2,
    tips: ['Catedral em reconstrução após incêndio', 'Sainte-Chapelle é imperdível ao lado'],
    styleTags: ['culture', 'history'],
  },

  // AFTERNOON ACTIVITIES
  {
    id: 'paris-marais-walk',
    name: 'Passeio pelo Marais',
    category: 'afternoon',
    neighborhood: 'Le Marais',
    rating: 4.6,
    estimatedCostBRL: 0,
    durationHours: 3,
    tips: ['Melhor bairro para flanar', 'Pare na Place des Vosges para descansar'],
    styleTags: ['culture', 'shopping', 'romantic'],
  },
  {
    id: 'paris-luxembourg',
    name: 'Jardins de Luxembourg',
    category: 'afternoon',
    neighborhood: '6º Arrondissement',
    rating: 4.7,
    estimatedCostBRL: 0,
    durationHours: 2,
    tips: ['Leve um livro e relaxe', 'Crianças podem alugar barquinhos no lago'],
    styleTags: ['nature', 'family', 'relax'],
  },
  {
    id: 'paris-galeries-lafayette',
    name: 'Galeries Lafayette',
    category: 'afternoon',
    neighborhood: 'Opéra',
    rating: 4.4,
    estimatedCostBRL: 0,
    durationHours: 3,
    tips: ['Vá ao terraço para vista grátis de Paris', 'Cúpula art nouveau é linda'],
    styleTags: ['shopping'],
  },
  {
    id: 'paris-sena-cruzeiro',
    name: 'Cruzeiro no Sena',
    category: 'afternoon',
    neighborhood: 'Torre Eiffel',
    rating: 4.5,
    estimatedCostBRL: 80,
    durationHours: 1,
    tips: ['Melhor ao pôr do sol', 'Veja todos os monumentos do rio'],
    styleTags: ['romantic', 'family'],
  },
  {
    id: 'paris-champs-elysees',
    name: 'Champs-Élysées & Arco do Triunfo',
    category: 'afternoon',
    neighborhood: '8º Arrondissement',
    rating: 4.4,
    estimatedCostBRL: 65,
    durationHours: 2,
    tips: ['Suba no Arco do Triunfo no pôr do sol', 'Vista 360° de Paris'],
    styleTags: ['culture', 'shopping'],
  },

  // NIGHT ACTIVITIES
  {
    id: 'paris-eiffel-night',
    name: 'Torre Eiffel Iluminada',
    category: 'night',
    neighborhood: 'Champ de Mars',
    rating: 4.9,
    estimatedCostBRL: 0,
    durationHours: 1.5,
    tips: ['Pisca a cada hora cheia até meia-noite', 'Melhor vista do Trocadéro'],
    styleTags: ['romantic', 'culture'],
  },
  {
    id: 'paris-moulin-rouge',
    name: 'Moulin Rouge (show)',
    category: 'night',
    neighborhood: 'Pigalle',
    rating: 4.6,
    estimatedCostBRL: 400,
    durationHours: 2,
    tips: ['Reserve com semanas de antecedência', 'Show icônico desde 1889'],
    styleTags: ['nightlife', 'culture'],
  },
  {
    id: 'paris-jazz-club',
    name: 'Jazz em Saint-Germain',
    category: 'night',
    neighborhood: 'Saint-Germain',
    rating: 4.4,
    estimatedCostBRL: 50,
    durationHours: 2,
    tips: ['Caveau de la Huchette é o mais famoso', 'Shows começam às 22h'],
    styleTags: ['nightlife', 'culture'],
  },
  {
    id: 'paris-sena-night',
    name: 'Passeio Noturno pelo Sena',
    category: 'night',
    neighborhood: 'Batobus',
    rating: 4.8,
    estimatedCostBRL: 150,
    durationHours: 1.5,
    tips: ['Paris iluminada do rio', 'Romântico! Torre Eiffel pisca à meia-noite'],
    styleTags: ['romantic'],
  },
  {
    id: 'paris-opera-garnier',
    name: 'Ópera Garnier (visita noturna)',
    category: 'night',
    neighborhood: 'Opéra',
    rating: 4.7,
    estimatedCostBRL: 120,
    durationHours: 1.5,
    tips: ['Arquitetura deslumbrante', 'Inspirou O Fantasma da Ópera'],
    styleTags: ['culture', 'art', 'romantic'],
  },
];

// Tokyo activities
const tokyoActivities: SuggestedActivity[] = [
  // BREAKFAST
  {
    id: 'tokyo-tsukiji-market',
    name: 'Tsukiji Outer Market',
    category: 'breakfast',
    neighborhood: 'Tsukiji',
    rating: 4.7,
    estimatedCostBRL: 80,
    durationHours: 1.5,
    tips: ['Chegue às 7h para pegar fresquinho', 'Tamagoyaki (omelete) é imperdível'],
    styleTags: ['gastronomy', 'culture'],
  },
  {
    id: 'tokyo-konbini',
    name: 'Café da manhã no Konbini',
    category: 'breakfast',
    neighborhood: 'Qualquer bairro',
    rating: 4.2,
    estimatedCostBRL: 30,
    durationHours: 0.5,
    tips: ['7-Eleven, Lawson ou FamilyMart', 'Onigiri e café são deliciosos'],
    styleTags: ['budget'],
  },
  {
    id: 'tokyo-bills',
    name: 'Bills (Pancakes)',
    category: 'breakfast',
    neighborhood: 'Omotesando',
    rating: 4.6,
    estimatedCostBRL: 120,
    durationHours: 1,
    tips: ['Ricotta pancakes mundialmente famosos', 'Fila de 30min nos fins de semana'],
    styleTags: ['gastronomy'],
  },

  // LUNCH
  {
    id: 'tokyo-ichiran',
    name: 'Ichiran Ramen',
    category: 'lunch',
    neighborhood: 'Shibuya',
    rating: 4.5,
    estimatedCostBRL: 70,
    durationHours: 0.5,
    tips: ['Cabines individuais para focar no ramen', 'Peça chashu extra'],
    styleTags: ['gastronomy'],
  },
  {
    id: 'tokyo-sushi-dai',
    name: 'Sushi Dai',
    category: 'lunch',
    neighborhood: 'Toyosu Market',
    rating: 4.9,
    estimatedCostBRL: 200,
    durationHours: 1.5,
    tips: ['Fila de 3h mas vale a pena', 'Omakase é a melhor escolha'],
    styleTags: ['gastronomy'],
  },
  {
    id: 'tokyo-tempura-kondo',
    name: 'Tempura Kondo',
    category: 'lunch',
    neighborhood: 'Ginza',
    rating: 4.8,
    estimatedCostBRL: 350,
    durationHours: 1.5,
    tips: ['Melhor tempura de Tóquio', 'Reserve com antecedência'],
    styleTags: ['gastronomy'],
  },

  // DINNER
  {
    id: 'tokyo-gonpachi',
    name: 'Gonpachi (Kill Bill)',
    category: 'dinner',
    neighborhood: 'Roppongi',
    rating: 4.4,
    estimatedCostBRL: 250,
    durationHours: 2,
    tips: ['Cenário do filme Kill Bill', 'Yakitori e soba são excelentes'],
    styleTags: ['gastronomy', 'culture'],
  },
  {
    id: 'tokyo-izakaya',
    name: 'Izakaya em Yurakucho',
    category: 'dinner',
    neighborhood: 'Yurakucho',
    rating: 4.5,
    estimatedCostBRL: 150,
    durationHours: 2,
    tips: ['Debaixo dos trilhos do trem', 'Atmosfera autêntica de salaryman'],
    styleTags: ['gastronomy', 'nightlife'],
  },
  {
    id: 'tokyo-robot-restaurant',
    name: 'Robot Restaurant',
    category: 'dinner',
    neighborhood: 'Shinjuku',
    rating: 4.0,
    estimatedCostBRL: 350,
    durationHours: 2,
    tips: ['Show bizarro e divertido', 'Comida é secundária ao espetáculo'],
    styleTags: ['nightlife', 'culture'],
  },

  // MORNING
  {
    id: 'tokyo-senso-ji',
    name: 'Templo Senso-ji',
    category: 'morning',
    neighborhood: 'Asakusa',
    rating: 4.7,
    estimatedCostBRL: 0,
    durationHours: 2,
    tips: ['Chegue antes das 8h para fotos sem multidão', 'Nakamise-dori tem souvenirs tradicionais'],
    styleTags: ['culture', 'history'],
  },
  {
    id: 'tokyo-meiji-shrine',
    name: 'Meiji Jingu',
    category: 'morning',
    neighborhood: 'Harajuku',
    rating: 4.8,
    estimatedCostBRL: 0,
    durationHours: 1.5,
    tips: ['Floresta no coração de Tóquio', 'Às vezes há casamentos tradicionais'],
    styleTags: ['culture', 'nature'],
  },
  {
    id: 'tokyo-teamlab',
    name: 'teamLab Borderless',
    category: 'morning',
    neighborhood: 'Odaiba',
    rating: 4.9,
    estimatedCostBRL: 150,
    durationHours: 3,
    tips: ['Reserve ingresso com 2 semanas de antecedência', 'Use roupas claras para fotos'],
    styleTags: ['art', 'culture'],
  },

  // AFTERNOON
  {
    id: 'tokyo-harajuku',
    name: 'Harajuku & Takeshita Street',
    category: 'afternoon',
    neighborhood: 'Harajuku',
    rating: 4.5,
    estimatedCostBRL: 0,
    durationHours: 2.5,
    tips: ['Moda kawaii e cultura jovem', 'Crepe de Harajuku é tradição'],
    styleTags: ['shopping', 'culture'],
  },
  {
    id: 'tokyo-shibuya-crossing',
    name: 'Shibuya Crossing',
    category: 'afternoon',
    neighborhood: 'Shibuya',
    rating: 4.6,
    estimatedCostBRL: 0,
    durationHours: 1,
    tips: ['Atravessamento mais movimentado do mundo', 'Starbucks no 2º andar tem melhor vista'],
    styleTags: ['culture'],
  },
  {
    id: 'tokyo-akihabara',
    name: 'Akihabara Electric Town',
    category: 'afternoon',
    neighborhood: 'Akihabara',
    rating: 4.4,
    estimatedCostBRL: 0,
    durationHours: 3,
    tips: ['Paraíso de eletrônicos e anime', 'Maid cafés são experiência única'],
    styleTags: ['shopping', 'culture'],
  },

  // NIGHT
  {
    id: 'tokyo-shinjuku-night',
    name: 'Golden Gai (Shinjuku)',
    category: 'night',
    neighborhood: 'Shinjuku',
    rating: 4.6,
    estimatedCostBRL: 100,
    durationHours: 2.5,
    tips: ['Vielas com bares minúsculos', 'Cada bar tem tema diferente'],
    styleTags: ['nightlife'],
  },
  {
    id: 'tokyo-shibuya-sky',
    name: 'Shibuya Sky (mirante)',
    category: 'night',
    neighborhood: 'Shibuya',
    rating: 4.8,
    estimatedCostBRL: 100,
    durationHours: 1.5,
    tips: ['Vista 360° de Tóquio à noite', 'Reserve horário do pôr do sol'],
    styleTags: ['romantic'],
  },
  {
    id: 'tokyo-karaoke',
    name: 'Karaoke em Shibuya',
    category: 'night',
    neighborhood: 'Shibuya',
    rating: 4.4,
    estimatedCostBRL: 80,
    durationHours: 2,
    tips: ['Big Echo ou Karaoke Kan', 'Salas privativas - sem vergonha!'],
    styleTags: ['nightlife', 'family'],
  },
];

// Lisboa activities
const lisboaActivities: SuggestedActivity[] = [
  // BREAKFAST
  {
    id: 'lisboa-pasteis-belem',
    name: 'Pastéis de Belém',
    category: 'breakfast',
    neighborhood: 'Belém',
    rating: 4.8,
    estimatedCostBRL: 40,
    durationHours: 0.5,
    tips: ['Os pastéis originais desde 1837', 'Chegue cedo para evitar fila'],
    styleTags: ['gastronomy', 'history'],
  },
  {
    id: 'lisboa-cafe-brasileira',
    name: 'A Brasileira',
    category: 'breakfast',
    neighborhood: 'Chiado',
    rating: 4.3,
    estimatedCostBRL: 35,
    durationHours: 0.5,
    tips: ['Fernando Pessoa frequentava', 'Tire foto com a estátua dele'],
    styleTags: ['gastronomy', 'culture', 'history'],
  },

  // LUNCH
  {
    id: 'lisboa-time-out-market',
    name: 'Time Out Market',
    category: 'lunch',
    neighborhood: 'Cais do Sodré',
    rating: 4.5,
    estimatedCostBRL: 80,
    durationHours: 1.5,
    tips: ['Food hall com os melhores chefs', 'Experimente o polvo'],
    styleTags: ['gastronomy'],
  },
  {
    id: 'lisboa-cervejaria-ramiro',
    name: 'Cervejaria Ramiro',
    category: 'lunch',
    neighborhood: 'Intendente',
    rating: 4.7,
    estimatedCostBRL: 200,
    durationHours: 2,
    tips: ['Melhor marisco de Lisboa', 'Termine com prego no pão'],
    styleTags: ['gastronomy'],
  },

  // DINNER
  {
    id: 'lisboa-belcanto',
    name: 'Belcanto',
    category: 'dinner',
    neighborhood: 'Chiado',
    rating: 4.9,
    estimatedCostBRL: 500,
    durationHours: 2.5,
    tips: ['2 estrelas Michelin', 'Reserve com 1 mês de antecedência'],
    styleTags: ['gastronomy', 'romantic'],
  },
  {
    id: 'lisboa-tasca-chico',
    name: 'Tasca do Chico',
    category: 'dinner',
    neighborhood: 'Bairro Alto',
    rating: 4.6,
    estimatedCostBRL: 120,
    durationHours: 2,
    tips: ['Fado autêntico toda noite', 'Chegue às 20h para garantir lugar'],
    styleTags: ['gastronomy', 'culture', 'nightlife'],
  },

  // MORNING
  {
    id: 'lisboa-belem',
    name: 'Torre de Belém & Mosteiro dos Jerónimos',
    category: 'morning',
    neighborhood: 'Belém',
    rating: 4.7,
    estimatedCostBRL: 60,
    durationHours: 3,
    tips: ['Patrimônio UNESCO', 'Combine com pastéis de Belém'],
    styleTags: ['culture', 'history'],
  },
  {
    id: 'lisboa-alfama',
    name: 'Caminhada por Alfama',
    category: 'morning',
    neighborhood: 'Alfama',
    rating: 4.6,
    estimatedCostBRL: 0,
    durationHours: 2.5,
    tips: ['Bairro mais antigo de Lisboa', 'Perder-se é parte da experiência'],
    styleTags: ['culture', 'history'],
  },

  // AFTERNOON
  {
    id: 'lisboa-tram-28',
    name: 'Elétrico 28',
    category: 'afternoon',
    neighborhood: 'Centro',
    rating: 4.5,
    estimatedCostBRL: 20,
    durationHours: 1,
    tips: ['Bonde histórico pelos principais pontos', 'Cuidado com carteiristas'],
    styleTags: ['culture'],
  },
  {
    id: 'lisboa-lx-factory',
    name: 'LX Factory',
    category: 'afternoon',
    neighborhood: 'Alcântara',
    rating: 4.4,
    estimatedCostBRL: 0,
    durationHours: 2,
    tips: ['Fábrica convertida em polo criativo', 'Ler Devagar é livraria imperdível'],
    styleTags: ['culture', 'shopping'],
  },

  // NIGHT
  {
    id: 'lisboa-bairro-alto',
    name: 'Noite no Bairro Alto',
    category: 'night',
    neighborhood: 'Bairro Alto',
    rating: 4.5,
    estimatedCostBRL: 80,
    durationHours: 3,
    tips: ['Bares e vida noturna', 'Beba nas ruas como os locais'],
    styleTags: ['nightlife'],
  },
  {
    id: 'lisboa-fado',
    name: 'Show de Fado',
    category: 'night',
    neighborhood: 'Alfama ou Mouraria',
    rating: 4.7,
    estimatedCostBRL: 100,
    durationHours: 2,
    tips: ['Música tradicional portuguesa', 'Clube de Fado é excelente opção'],
    styleTags: ['culture', 'nightlife'],
  },
];

// Rome activities
const romeActivities: SuggestedActivity[] = [
  // BREAKFAST
  {
    id: 'rome-sant-eustachio',
    name: "Sant'Eustachio Il Caffè",
    category: 'breakfast',
    neighborhood: 'Centro Storico',
    rating: 4.6,
    estimatedCostBRL: 30,
    durationHours: 0.5,
    tips: ['Melhor café de Roma', 'Gran Caffè já vem adoçado'],
    styleTags: ['gastronomy'],
  },
  {
    id: 'rome-roscioli',
    name: 'Roscioli Caffè',
    category: 'breakfast',
    neighborhood: 'Campo de Fiori',
    rating: 4.5,
    estimatedCostBRL: 50,
    durationHours: 0.5,
    tips: ['Cornetto recheado divino', 'Padaria premiada'],
    styleTags: ['gastronomy'],
  },

  // LUNCH
  {
    id: 'rome-da-enzo',
    name: "Da Enzo al 29",
    category: 'lunch',
    neighborhood: 'Trastevere',
    rating: 4.7,
    estimatedCostBRL: 120,
    durationHours: 1.5,
    tips: ['Cacio e pepe memorável', 'Fila enorme - chegue às 12:30'],
    styleTags: ['gastronomy'],
  },
  {
    id: 'rome-armando',
    name: 'Armando al Pantheon',
    category: 'lunch',
    neighborhood: 'Pantheon',
    rating: 4.6,
    estimatedCostBRL: 150,
    durationHours: 1.5,
    tips: ['Tradicional desde 1961', 'Reserve com antecedência'],
    styleTags: ['gastronomy', 'history'],
  },

  // DINNER
  {
    id: 'rome-roscioli-salumeria',
    name: 'Roscioli Salumeria',
    category: 'dinner',
    neighborhood: 'Centro Storico',
    rating: 4.8,
    estimatedCostBRL: 200,
    durationHours: 2,
    tips: ['Carbonara perfeita', 'Seleção de queijos e vinhos excelente'],
    styleTags: ['gastronomy', 'romantic'],
  },
  {
    id: 'rome-trastevere',
    name: 'Jantar em Trastevere',
    category: 'dinner',
    neighborhood: 'Trastevere',
    rating: 4.5,
    estimatedCostBRL: 180,
    durationHours: 2,
    tips: ['Bairro mais charmoso para jantar', 'Escolha qualquer trattoria com locais'],
    styleTags: ['gastronomy', 'romantic'],
  },

  // MORNING
  {
    id: 'rome-colosseum',
    name: 'Coliseu & Fórum Romano',
    category: 'morning',
    neighborhood: 'Centro',
    rating: 4.9,
    estimatedCostBRL: 100,
    durationHours: 4,
    tips: ['Reserve ingresso skip-the-line', 'Chegue às 8:30 para menos calor'],
    styleTags: ['culture', 'history'],
  },
  {
    id: 'rome-vatican',
    name: 'Vaticano & Capela Sistina',
    category: 'morning',
    neighborhood: 'Vaticano',
    rating: 4.9,
    estimatedCostBRL: 120,
    durationHours: 4,
    tips: ['Reserve early morning entry', 'Sexta à noite tem menos gente'],
    styleTags: ['culture', 'history', 'art'],
  },

  // AFTERNOON
  {
    id: 'rome-trevi',
    name: 'Fontana di Trevi & Centro',
    category: 'afternoon',
    neighborhood: 'Centro Storico',
    rating: 4.7,
    estimatedCostBRL: 0,
    durationHours: 2,
    tips: ['Jogue moeda de costas para voltar', 'Vá à noite para menos gente'],
    styleTags: ['culture', 'romantic'],
  },
  {
    id: 'rome-villa-borghese',
    name: 'Villa Borghese',
    category: 'afternoon',
    neighborhood: 'Pinciano',
    rating: 4.6,
    estimatedCostBRL: 80,
    durationHours: 3,
    tips: ['Parque lindo para descansar', 'Galeria Borghese precisa reserva'],
    styleTags: ['nature', 'art', 'family'],
  },

  // NIGHT
  {
    id: 'rome-trastevere-night',
    name: 'Noite em Trastevere',
    category: 'night',
    neighborhood: 'Trastevere',
    rating: 4.6,
    estimatedCostBRL: 60,
    durationHours: 2,
    tips: ['Bares e vida noturna local', 'Piazza Santa Maria é o point'],
    styleTags: ['nightlife'],
  },
  {
    id: 'rome-gelato',
    name: 'Gelato noturno em Piazza Navona',
    category: 'night',
    neighborhood: 'Centro Storico',
    rating: 4.4,
    estimatedCostBRL: 40,
    durationHours: 1,
    tips: ['Giolitti ou Frigidarium são excelentes', 'Evite gelaterias muito coloridas'],
    styleTags: ['gastronomy', 'romantic'],
  },
];

// Export all destination data
export const destinationActivities: Record<string, DestinationData> = {
  'Paris': {
    cityName: 'Paris',
    cityCode: 'CDG',
    activities: parisActivities,
  },
  'Tóquio': {
    cityName: 'Tóquio',
    cityCode: 'NRT',
    activities: tokyoActivities,
  },
  'Tokyo': {
    cityName: 'Tokyo',
    cityCode: 'NRT',
    activities: tokyoActivities,
  },
  'Lisboa': {
    cityName: 'Lisboa',
    cityCode: 'LIS',
    activities: lisboaActivities,
  },
  'Roma': {
    cityName: 'Roma',
    cityCode: 'FCO',
    activities: romeActivities,
  },
  'Rome': {
    cityName: 'Rome',
    cityCode: 'FCO',
    activities: romeActivities,
  },
};

// Get activities for a destination, with fallback to Paris
export function getDestinationActivities(destination: string): SuggestedActivity[] {
  const data = destinationActivities[destination];
  if (data) {
    return data.activities;
  }
  // Fallback to generic activities based on Paris structure
  return parisActivities;
}

// Filter activities by category
export function getActivitiesByCategory(
  destination: string,
  category: SuggestedActivity['category']
): SuggestedActivity[] {
  const activities = getDestinationActivities(destination);
  return activities.filter(a => a.category === category);
}

// Filter activities by style tags
export function getActivitiesByStyle(
  destination: string,
  styleTags: string[]
): SuggestedActivity[] {
  const activities = getDestinationActivities(destination);
  if (styleTags.length === 0) return activities;
  
  return activities.filter(activity => 
    styleTags.some(tag => activity.styleTags.includes(tag.toLowerCase()))
  );
}

// Get a random activity from category, optionally filtered by style
export function getRandomActivity(
  destination: string,
  category: SuggestedActivity['category'],
  styleTags: string[] = [],
  excludeIds: string[] = []
): SuggestedActivity | null {
  let activities = getActivitiesByCategory(destination, category)
    .filter(a => !excludeIds.includes(a.id));
  
  if (styleTags.length > 0) {
    const styledActivities = activities.filter(a =>
      styleTags.some(tag => a.styleTags.includes(tag.toLowerCase()))
    );
    if (styledActivities.length > 0) {
      activities = styledActivities;
    }
  }
  
  if (activities.length === 0) return null;
  return activities[Math.floor(Math.random() * activities.length)];
}
