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

// ── Curated day themes per destination (used by NewPlanningWizard) ──

export interface DestinationTheme {
  title: string;
  icon: string;
  activities: [string, string, string];
  restaurants: { lunch: string; dinner: string };
}

const CURATED_THEMES: Record<string, DestinationTheme[]> = {
  'milao': [
    { title: 'Cultura', icon: '🏛️', activities: ['Duomo di Milano + Terraço', 'Pinacoteca di Brera', 'Teatro alla Scala (visita guiada)'], restaurants: { lunch: 'Luini (panzerotti)', dinner: 'Trattoria Milanese' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Mercato Centrale Milano', 'Tour gastronômico em Navigli', 'Eataly Milano Smeraldo'], restaurants: { lunch: 'Taglio (cortes artesanais)', dinner: 'Osteria del Binari' } },
    { title: 'Passeios', icon: '🚶', activities: ['Galleria Vittorio Emanuele II', 'Castelo Sforzesco + Parque Sempione', 'Bairro Brera (galerias e cafés)'], restaurants: { lunch: 'Princi Bakery', dinner: 'Carlo e Camilla in Segheria' } },
    { title: 'Descobertas', icon: '🎭', activities: ['Fondazione Prada', 'Bairro Isola (street art + design)', 'Navigli ao pôr do sol'], restaurants: { lunch: 'Pavé (brunch)', dinner: 'Langosteria (frutos do mar)' } },
    { title: 'Aventura', icon: '⭐', activities: ['Bate-volta Lago di Como (Bellagio)', 'Villa Carlotta + jardins', 'Passeio de barco pelo lago'], restaurants: { lunch: 'Ristorante Bilacus (Bellagio)', dinner: 'Antica Osteria Cavallini' } },
  ],
  'paris': [
    { title: 'Cultura', icon: '🏛️', activities: ['Museu do Louvre (ala Denon)', "Museu d'Orsay (impressionistas)", 'Jardins des Tuileries'], restaurants: { lunch: 'Café Marly (vista Louvre)', dinner: 'Le Bouillon Chartier' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Rue Cler (mercado de rua)', 'Aula de croissant', 'Tour de queijos em Saint-Germain'], restaurants: { lunch: 'Breizh Café (crepes)', dinner: 'Le Comptoir du Panthéon' } },
    { title: 'Passeios', icon: '🚶', activities: ['Montmartre + Sacré-Cœur', 'Le Marais (Praça des Vosges)', 'Cruzeiro pelo Sena ao pôr do sol'], restaurants: { lunch: "L'As du Fallafel", dinner: 'Pink Mamma' } },
    { title: 'Descobertas', icon: '🎭', activities: ['Sainte-Chapelle (vitrais)', 'Canal Saint-Martin', 'Rooftop do Galeries Lafayette'], restaurants: { lunch: 'Café de Flore', dinner: 'Chez Janou' } },
    { title: 'Aventura', icon: '⭐', activities: ['Palácio de Versalhes', 'Jardins de Versalhes (bicicleta)', 'Grand/Petit Trianon'], restaurants: { lunch: 'La Petite Venise (Versalhes)', dinner: 'Le Train Bleu' } },
  ],
  'roma': [
    { title: 'Cultura', icon: '🏛️', activities: ['Coliseu + Fórum Romano + Palatino', 'Museus do Vaticano + Capela Sistina', 'Basílica de São Pedro'], restaurants: { lunch: 'Roscioli', dinner: 'Da Enzo al 29 (Trastevere)' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Tour gastronômico em Testaccio', 'Mercato di Campo de Fiori', 'Aula de pasta artesanal'], restaurants: { lunch: 'Supplizio (supplì)', dinner: 'Armando al Pantheon' } },
    { title: 'Passeios', icon: '🚶', activities: ['Fontana di Trevi + Piazza Navona', 'Panteão + Piazza della Rotonda', 'Trastevere (ruelas + mirante Gianicolo)'], restaurants: { lunch: 'Antico Forno Roscioli', dinner: 'Tonnarello' } },
    { title: 'Descobertas', icon: '🎭', activities: ['Galleria Borghese', 'Villa Borghese (jardins)', 'Via Appia Antica (catacumbas)'], restaurants: { lunch: 'Pizzarium (Bonci)', dinner: 'Trattoria Da Teo' } },
    { title: 'Aventura', icon: '⭐', activities: ["Bate-volta a Tivoli (Villa d'Este)", 'Jardins da Villa Adriana', 'Fontes renascentistas'], restaurants: { lunch: 'Sibilla (Tivoli)', dinner: 'Felice a Testaccio' } },
  ],
  'bangkok': [
    { title: 'Cultura', icon: '🏛️', activities: ['Grand Palace + Wat Phra Kaew', 'Wat Pho (Buda Reclinado)', 'Wat Arun (Templo do Amanhecer)'], restaurants: { lunch: 'Thipsamai (pad thai)', dinner: 'Supanniga Eating Room' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Chinatown (Yaowarat Road)', 'Or Tor Kor Market', 'Aula de culinária tailandesa'], restaurants: { lunch: 'Jay Fai (street Michelin)', dinner: 'Gaggan Anand' } },
    { title: 'Passeios', icon: '🚶', activities: ['Chatuchak Weekend Market', 'Jim Thompson House', 'Lumpini Park ao entardecer'], restaurants: { lunch: 'Som Tam Nua', dinner: 'Bo.lan (thai moderno)' } },
    { title: 'Descobertas', icon: '🎭', activities: ['Charoen Krung (galerias de arte)', 'ICONSIAM (floating market)', 'Sky Bar (rooftop)'], restaurants: { lunch: 'Nai Mong Hoi Tod', dinner: 'Sirocco (rooftop)' } },
    { title: 'Aventura', icon: '⭐', activities: ['Mercado flutuante Damnoen Saduak', 'Mercado ferroviário Maeklong', 'Ayutthaya (ruínas UNESCO)'], restaurants: { lunch: 'Restaurante local em Ayutthaya', dinner: 'Vertigo (Banyan Tree)' } },
  ],
  'toquio': [
    { title: 'Cultura', icon: '🏛️', activities: ['Senso-ji + Nakamise-dori (Asakusa)', 'Meiji Jingu (Harajuku)', 'Museu Nacional de Tóquio'], restaurants: { lunch: 'Fuunji Ramen (Shinjuku)', dinner: 'Gonpachi' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Tsukiji Outer Market', 'Tour de ramen em Shinjuku', 'Depachika (food hall subterrâneo)'], restaurants: { lunch: 'Sushi Dai (Toyosu)', dinner: 'Narisawa (Michelin)' } },
    { title: 'Passeios', icon: '🚶', activities: ['Shibuya Crossing + Hachiko', 'Harajuku (Takeshita-dori)', 'Shinjuku Gyoen (jardim)'], restaurants: { lunch: 'Ichiran Ramen', dinner: 'Uobei (sushi conveyor)' } },
    { title: 'Descobertas', icon: '🎭', activities: ['TeamLab Borderless', 'Akihabara (eletrônicos + anime)', 'Ginza Six (arte + compras)'], restaurants: { lunch: 'CoCo Ichibanya (curry)', dinner: 'Afuri (yuzu ramen)' } },
    { title: 'Aventura', icon: '⭐', activities: ['Bate-volta Kamakura (Grande Buda)', 'Enoshima Island', 'Praia de Shonan'], restaurants: { lunch: 'Bills Kamakura', dinner: 'Torikizoku (yakitori)' } },
  ],
  'londres': [
    { title: 'Cultura', icon: '🏛️', activities: ['British Museum', 'Tower of London + Joias da Coroa', 'National Gallery'], restaurants: { lunch: 'Dishoom (indiano)', dinner: 'Flat Iron (steak)' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Borough Market', 'Brick Lane (curry mile)', 'Afternoon tea no Sketch'], restaurants: { lunch: 'Padella (pasta fresca)', dinner: 'Hawksmoor' } },
    { title: 'Passeios', icon: '🚶', activities: ['Westminster + Big Ben + Abadia', 'Buckingham Palace (troca da guarda)', 'South Bank (Tate Modern)'], restaurants: { lunch: 'The Breakfast Club', dinner: 'Duck & Waffle (vista)' } },
    { title: 'Descobertas', icon: '🎭', activities: ['Notting Hill + Portobello Market', 'Camden Town + canal', 'Sky Garden (rooftop gratuito)'], restaurants: { lunch: 'Ottolenghi', dinner: 'Bao' } },
    { title: 'Aventura', icon: '⭐', activities: ['Bate-volta Stonehenge + Bath', 'Banhos romanos de Bath', 'Royal Crescent'], restaurants: { lunch: "Sally Lunn's (Bath)", dinner: 'The Ivy' } },
  ],
  'lisboa': [
    { title: 'Cultura', icon: '🏛️', activities: ['Mosteiro dos Jerônimos', 'Torre de Belém', 'Castelo de São Jorge'], restaurants: { lunch: 'Pastéis de Belém', dinner: 'Cervejaria Ramiro' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Mercado da Ribeira (Time Out Market)', 'Tour de pastéis de nata', 'Ginjinha (licor de ginja)'], restaurants: { lunch: 'A Cevicheria', dinner: 'Taberna da Rua das Flores' } },
    { title: 'Passeios', icon: '🚶', activities: ['Alfama + bonde 28', 'Miradouro da Graça + Portas do Sol', 'Bairro Alto ao entardecer'], restaurants: { lunch: 'Café A Brasileira', dinner: 'A Baíuca (fado ao vivo)' } },
    { title: 'Descobertas', icon: '🎭', activities: ['LX Factory (arte + design)', 'Museu Nacional do Azulejo', 'Parque das Nações (Oceanário)'], restaurants: { lunch: 'Landeau Chocolate', dinner: 'Belcanto (Michelin)' } },
    { title: 'Aventura', icon: '⭐', activities: ['Bate-volta Sintra (Palácio da Pena)', 'Quinta da Regaleira', 'Cabo da Roca'], restaurants: { lunch: 'Piriquita (Sintra)', dinner: 'Solar dos Presuntos' } },
  ],
  'barcelona': [
    { title: 'Cultura', icon: '🏛️', activities: ['Sagrada Família', 'Casa Batlló + Casa Milà', 'Museu Picasso'], restaurants: { lunch: 'Cervecería Catalana', dinner: 'Can Paixano' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['La Boqueria (mercado)', 'Tour de tapas no El Born', 'Aula de paella'], restaurants: { lunch: 'Cal Pep (frutos do mar)', dinner: 'Tickets (Albert Adrià)' } },
    { title: 'Passeios', icon: '🚶', activities: ['Park Güell', 'Las Ramblas + Barrio Gótico', 'Barceloneta (praia + chiringuitos)'], restaurants: { lunch: 'La Pepita (tapas)', dinner: 'Els Quatre Gats' } },
    { title: 'Descobertas', icon: '🎭', activities: ['El Raval (MACBA + galerias)', 'Bunkers del Carmel (melhor vista)', 'Palau de la Música'], restaurants: { lunch: 'Federal Café', dinner: 'Bar Mut' } },
    { title: 'Aventura', icon: '⭐', activities: ['Montserrat (mosteiro + trilha)', 'Teleférico + Montjuïc', 'Fundação Joan Miró'], restaurants: { lunch: 'Restaurante Montserrat', dinner: 'El Nacional' } },
  ],
  'dubai': [
    { title: 'Cultura', icon: '🏛️', activities: ['Burj Khalifa (observatório)', 'Dubai Museum (Al Fahidi)', 'Jumeirah Mosque'], restaurants: { lunch: 'Arabian Tea House', dinner: 'Al Mallah (shawarma)' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Souk de Especiarias + Ouro', 'Dubai Creek (abra ride)', 'Aula de culinária árabe'], restaurants: { lunch: 'Ravi Restaurant', dinner: 'Pierchic' } },
    { title: 'Passeios', icon: '🚶', activities: ['Dubai Mall + Aquário', 'Palm Jumeirah + Atlantis', 'JBR Beach Walk'], restaurants: { lunch: 'The Maine (JBR)', dinner: 'At.mosphere (Burj Khalifa)' } },
    { title: 'Aventura', icon: '⭐', activities: ['Safari no deserto (4x4)', 'Sandboarding nas dunas', 'Jantar beduíno sob as estrelas'], restaurants: { lunch: 'Pícnic no deserto', dinner: 'Acampamento beduíno' } },
  ],
  'nova york': [
    { title: 'Cultura', icon: '🏛️', activities: ['MET Museum', 'MoMA', 'Central Park (Bethesda → Bow Bridge)'], restaurants: { lunch: 'The Halal Guys', dinner: "Joe's Pizza" } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Chelsea Market', 'Smorgasburg (Brooklyn)', 'Tour de pizza em Manhattan'], restaurants: { lunch: 'Los Tacos No. 1', dinner: 'Peter Luger (steak)' } },
    { title: 'Passeios', icon: '🚶', activities: ['High Line + Hudson Yards', 'Brooklyn Bridge + DUMBO', 'Times Square + Broadway'], restaurants: { lunch: 'Shake Shack', dinner: "Katz's Delicatessen" } },
    { title: 'Descobertas', icon: '🎭', activities: ['Top of the Rock (vista)', 'SoHo + Greenwich Village', 'Little Italy + Chinatown'], restaurants: { lunch: 'Prince Street Pizza', dinner: 'Carbone' } },
    { title: 'Aventura', icon: '⭐', activities: ['Estátua da Liberdade + Ellis Island', 'Governors Island (bike)', 'Coney Island'], restaurants: { lunch: "Nathan's (Coney Island)", dinner: 'Balthazar' } },
  ],
  'buenos aires': [
    { title: 'Cultura', icon: '🏛️', activities: ['Teatro Colón (visita guiada)', 'MALBA', 'Cemitério da Recoleta'], restaurants: { lunch: 'El Sanjuanino (empanadas)', dinner: 'Don Julio (parrilla)' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Mercado de San Telmo', 'Tour de asado', 'Fábrica de alfajores'], restaurants: { lunch: 'La Cabrera', dinner: 'Chila (Michelin)' } },
    { title: 'Passeios', icon: '🚶', activities: ['San Telmo (feira de domingo)', 'La Boca (Caminito)', 'Palermo Soho (galerias + cafés)'], restaurants: { lunch: 'El Federal', dinner: 'Proper (Palermo)' } },
    { title: 'Aventura', icon: '⭐', activities: ['Bate-volta Tigre (delta do Paraná)', 'Passeio de barco pelos canais', 'Puerto de Frutos'], restaurants: { lunch: 'Il Nuovo María del Luján', dinner: 'Elena (Four Seasons)' } },
  ],
  'amsterdam': [
    { title: 'Cultura', icon: '🏛️', activities: ['Rijksmuseum', 'Museu Van Gogh', 'Casa de Anne Frank'], restaurants: { lunch: 'The Pancake Bakery', dinner: 'De Kas' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Albert Cuyp Market', 'Heineken Experience', 'Food tour em Jordaan'], restaurants: { lunch: 'Foodhallen', dinner: 'Restaurant Blauw' } },
    { title: 'Passeios', icon: '🚶', activities: ['Passeio de barco pelos canais', 'Vondelpark', 'Jordaan (galerias + cafés)'], restaurants: { lunch: 'Café Winkel 43', dinner: 'Restaurant Moeders' } },
    { title: 'Aventura', icon: '⭐', activities: ['Bate-volta Zaanse Schans (moinhos)', 'Mercado de queijos em Edam', 'Bike pelo interior holandês'], restaurants: { lunch: 'Panqueca holandesa', dinner: 'Pont 13' } },
  ],
  'phuket': [
    { title: 'Cultura', icon: '🏛️', activities: ['Wat Chalong', 'Big Buddha (colina Nakkerd)', 'Old Phuket Town'], restaurants: { lunch: 'Raya Restaurant', dinner: 'Suay Restaurant' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Chillva Night Market', 'Banzaan Fresh Market', 'Aula de culinária tailandesa'], restaurants: { lunch: 'One Chun (mee hokkien)', dinner: 'The Supper Club' } },
    { title: 'Passeios', icon: '🚶', activities: ['Patong Beach + Bangla Road', 'Promthep Cape (pôr do sol)', 'Kata Beach (snorkeling)'], restaurants: { lunch: 'Beach bar em Kata', dinner: 'Baan Rim Pa' } },
    { title: 'Aventura', icon: '⭐', activities: ['Phi Phi Islands (lancha)', 'Maya Bay + snorkeling', 'Phang Nga Bay (canoa)'], restaurants: { lunch: 'Restaurante flutuante', dinner: 'Kan Eang @ Pier' } },
  ],
  'bali': [
    { title: 'Cultura', icon: '🏛️', activities: ['Tirta Empul (purificação)', 'Tegallalang Rice Terraces', 'Ubud Monkey Forest'], restaurants: { lunch: 'Locavore', dinner: 'Mozaic (Michelin)' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Ubud Market', 'Aula de culinária balinesa', 'Jimbaran seafood ao pôr do sol'], restaurants: { lunch: 'Warung Babi Guling Ibu Oka', dinner: 'Sardine' } },
    { title: 'Passeios', icon: '🚶', activities: ['Tanah Lot (templo no mar)', 'Seminyak Beach Walk', 'Uluwatu Temple (dança Kecak)'], restaurants: { lunch: 'La Brisa', dinner: 'Potato Head (sunset)' } },
    { title: 'Aventura', icon: '⭐', activities: ['Trekking Monte Batur (nascer do sol)', 'Nusa Penida (Kelingking Beach)', 'Snorkeling em Manta Point'], restaurants: { lunch: 'Pícnic no Monte Batur', dinner: 'Swept Away' } },
  ],
  'cairo': [
    { title: 'Cultura', icon: '🏛️', activities: ['Pirâmides de Gizé + Esfinge', 'Museu Egípcio', 'Cidadela de Saladino'], restaurants: { lunch: 'Felfela', dinner: 'Abou El Sid' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Khan el-Khalili (bazar)', 'Tour de street food no Cairo', 'Mesquita de Muhammad Ali'], restaurants: { lunch: 'Naguib Mahfouz Café', dinner: 'Sequoia (Nilo)' } },
    { title: 'Passeios', icon: '🚶', activities: ['Cairo Islâmico (mesquitas)', 'Passeio de felucca no Nilo', 'Torre do Cairo'], restaurants: { lunch: 'Zooba', dinner: 'Andrea' } },
    { title: 'Aventura', icon: '⭐', activities: ['Bate-volta Memphis + Saqqara', 'Pirâmide de Djoser', 'Passeio de camelo no deserto'], restaurants: { lunch: 'Restaurante em Saqqara', dinner: 'Koshary Abou Tarek' } },
  ],
  'cancun': [
    { title: 'Cultura', icon: '🏛️', activities: ['Chichén Itzá', 'Cenote Ik Kil', 'Museu Subaquático MUSA'], restaurants: { lunch: 'Hacienda Chichén', dinner: 'Puerto Madero' } },
    { title: 'Passeios', icon: '🚶', activities: ['Isla Mujeres (ferry)', 'Zona Hoteleira (praias)', 'Xcaret (parque ecológico)'], restaurants: { lunch: 'Beach bar em Isla Mujeres', dinner: 'La Habichuela' } },
    { title: 'Aventura', icon: '⭐', activities: ['Snorkeling no recife', 'Cenote Dos Ojos', 'Tulum (ruínas à beira-mar)'], restaurants: { lunch: 'Restaurante em Tulum', dinner: "Harry's Prime" } },
  ],
  'miami': [
    { title: 'Cultura', icon: '🏛️', activities: ['Art Deco Walking Tour', 'Pérez Art Museum', 'Vizcaya Museum'], restaurants: { lunch: 'Versailles (cubano)', dinner: "Cecconi's" } },
    { title: 'Passeios', icon: '🚶', activities: ['South Beach (Ocean Drive)', 'Key Biscayne', 'Coconut Grove + Coral Gables'], restaurants: { lunch: 'Greenstreet Cafe', dinner: "Joe's Stone Crab" } },
    { title: 'Aventura', icon: '⭐', activities: ['Bate-volta Everglades (airboat)', 'Snorkeling em Key Largo', 'Baía de Biscayne (barco)'], restaurants: { lunch: "Alabama Jack's", dinner: 'Juvia (rooftop)' } },
  ],
  'singapura': [
    { title: 'Cultura', icon: '🏛️', activities: ['Marina Bay Sands (SkyPark)', 'Gardens by the Bay + Supertrees', 'ArtScience Museum'], restaurants: { lunch: 'Hawker Chan (Michelin)', dinner: 'Jumbo Seafood' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Chinatown Complex', 'Little India (Tekka Centre)', 'Kampong Glam (Haji Lane)'], restaurants: { lunch: 'Tian Tian (chicken rice)', dinner: 'Burnt Ends (Michelin)' } },
    { title: 'Passeios', icon: '🚶', activities: ['Orchard Road (compras)', 'Sentosa Island', 'Clarke Quay + Singapore River'], restaurants: { lunch: 'PS. Cafe', dinner: 'Lau Pa Sat (satay)' } },
    { title: 'Aventura', icon: '⭐', activities: ['Night Safari', 'Southern Ridges (trilha)', 'Pulau Ubin (bike)'], restaurants: { lunch: 'Pícnic em Pulau Ubin', dinner: 'Ce La Vi (rooftop)' } },
  ],
};

const GENERIC_THEMES: DestinationTheme[] = [
  { title: 'Cultura', icon: '🏛️', activities: ['Museu principal', 'Tour histórico guiado', 'Monumento icônico'], restaurants: { lunch: 'Restaurante típico local', dinner: 'Restaurante recomendado' } },
  { title: 'Gastronomia', icon: '🍽️', activities: ['Tour gastronômico', 'Mercado local', 'Experiência culinária'], restaurants: { lunch: 'Street food local', dinner: 'Restaurante tradicional' } },
  { title: 'Passeios', icon: '🚶', activities: ['Bairro histórico', 'Parque ou jardim', 'Vista panorâmica'], restaurants: { lunch: 'Café local', dinner: 'Restaurante com vista' } },
  { title: 'Descobertas', icon: '🎭', activities: ['Galeria de arte', 'Bairro alternativo', 'Experiência local'], restaurants: { lunch: 'Brunch artesanal', dinner: 'Restaurante inovador' } },
  { title: 'Aventura', icon: '⭐', activities: ['Excursão aos arredores', 'Atividade ao ar livre', 'Experiência única'], restaurants: { lunch: 'Restaurante no caminho', dinner: 'Restaurante de despedida' } },
];

function normalizeCity(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

export function getDestinationThemes(city: string): DestinationTheme[] {
  const key = normalizeCity(city);
  for (const [k, v] of Object.entries(CURATED_THEMES)) {
    const nk = normalizeCity(k);
    if (key === nk || key.includes(nk) || nk.includes(key)) return v;
  }
  return GENERIC_THEMES;
}
