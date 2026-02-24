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
  'abudhabi': [
    { title: 'Cultura', icon: '🏛️', activities: ['Mesquita Sheikh Zayed', 'Louvre Abu Dhabi', 'Qasr Al Hosn'], restaurants: { lunch: 'Al Fanar Restaurant', dinner: 'Hakkasan' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Souk de especiarias', 'Tour gastronômico no Al Mina', 'Mercado de datas'], restaurants: { lunch: 'Shawarma Al Hallab', dinner: 'Zuma' } },
    { title: 'Passeios', icon: '🚶', activities: ['Corniche Beach Walk', 'Yas Island', 'Mangrove National Park'], restaurants: { lunch: 'Emirates Palace Le Café', dinner: 'Li Beirut' } },
    { title: 'Aventura', icon: '⭐', activities: ['Ferrari World', 'Safari no deserto Liwa', 'Kayak nos mangues'], restaurants: { lunch: 'Pícnic no deserto', dinner: 'Al Dhafra' } },
  ],
  'atacama': [
    { title: 'Cultura', icon: '🏛️', activities: ['Pueblo de San Pedro de Atacama', 'Igreja de San Pedro', 'Museu Arqueológico R.P. Gustavo Le Paige'], restaurants: { lunch: 'Adobe Restaurante', dinner: 'Baltinache' } },
    { title: 'Passeios', icon: '🚶', activities: ['Valle de la Luna', 'Valle de la Muerte', 'Laguna Cejar (flutuação)'], restaurants: { lunch: 'Café Tierra Todo Natural', dinner: 'Ayllu' } },
    { title: 'Aventura', icon: '⭐', activities: ['Geysers del Tatio (nascer do sol)', 'Salar de Atacama', 'Lagunas altiplânicas Miscanti e Miñiques'], restaurants: { lunch: 'Pícnic no deserto', dinner: 'La Casona' } },
    { title: 'Descobertas', icon: '🎭', activities: ['Observação de estrelas (ALMA)', 'Termas de Puritama', 'Cerro Toco'], restaurants: { lunch: 'Restaurante Sol Inti', dinner: 'Ckunna' } },
  ],
  'atenas': [
    { title: 'Cultura', icon: '🏛️', activities: ['Acrópole + Partenon', 'Museu da Acrópole', 'Ágora Antiga'], restaurants: { lunch: 'Tzitzikas kai Mermigas', dinner: 'Funky Gourmet' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Mercado Central de Atenas', 'Tour de street food em Monastiraki', 'Aula de culinária grega'], restaurants: { lunch: 'O Thanasis (kebab)', dinner: 'Spondi (Michelin)' } },
    { title: 'Passeios', icon: '🚶', activities: ['Plaka (bairro histórico)', 'Monastiraki (feira)', 'Monte Licabeto (pôr do sol)'], restaurants: { lunch: 'Café Avyssinia', dinner: 'Hytra' } },
    { title: 'Aventura', icon: '⭐', activities: ['Bate-volta Cabo Sunião (Templo de Poseidon)', 'Ilha de Aegina (ferry)', 'Riviera Ateniense'], restaurants: { lunch: 'Taverna em Sunião', dinner: 'Varoulko Seaside' } },
  ],
  'auckland': [
    { title: 'Cultura', icon: '🏛️', activities: ['Auckland War Memorial Museum', 'Auckland Art Gallery', 'Viaduto Harbour'], restaurants: { lunch: 'Depot Eatery', dinner: 'Sidart' } },
    { title: 'Passeios', icon: '🚶', activities: ['Sky Tower', 'Waiheke Island (vinícolas)', 'Mission Bay Beach'], restaurants: { lunch: 'Mudbrick Vineyard (Waiheke)', dinner: 'The French Café' } },
    { title: 'Aventura', icon: '⭐', activities: ['Rangitoto Island (trilha)', 'Bungee jump Auckland Bridge', 'Piha Beach (surf)'], restaurants: { lunch: 'Piha Café', dinner: 'Cassia' } },
    { title: 'Descobertas', icon: '🎭', activities: ['Ponsonby (cafés + lojas)', 'K Road (arte urbana)', 'One Tree Hill'], restaurants: { lunch: 'Ponsonby Road Bistro', dinner: 'Clooney' } },
  ],
  'bariloche': [
    { title: 'Cultura', icon: '🏛️', activities: ['Centro Cívico', 'Museo de la Patagonia', 'Catedral de Bariloche'], restaurants: { lunch: 'El Boliche de Alberto', dinner: 'Cassis' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Rua do Chocolate (Rapa Nui + Mamushka)', 'Cervejaria artesanal Berlina', 'Ahumadero Familia Weiss'], restaurants: { lunch: 'Cervecería Blest', dinner: 'Butterfly' } },
    { title: 'Passeios', icon: '🚶', activities: ['Circuito Chico', 'Cerro Campanario (mirante)', 'Isla Victoria + Bosque de Arrayanes'], restaurants: { lunch: 'La Marca', dinner: 'Alto el Fuego' } },
    { title: 'Aventura', icon: '⭐', activities: ['Cerro Catedral (esqui/trekking)', 'Rafting no Río Manso', 'Travessia de Lagos Andinos'], restaurants: { lunch: 'Refugio de montanha', dinner: 'Kandahar' } },
  ],
  'berlim': [
    { title: 'Cultura', icon: '🏛️', activities: ['Portão de Brandemburgo + Reichstag', 'Ilha dos Museus (Pergamon)', 'Memorial do Holocausto'], restaurants: { lunch: 'Curry 36 (currywurst)', dinner: 'Nobelhart & Schmutzig' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Markthalle Neun', 'KaDeWe food hall', 'Tour de street food em Kreuzberg'], restaurants: { lunch: 'Mustafas Gemüse Kebap', dinner: 'Coda (Michelin)' } },
    { title: 'Passeios', icon: '🚶', activities: ['East Side Gallery (Muro)', 'Tiergarten', 'Checkpoint Charlie + Topografia do Terror'], restaurants: { lunch: 'Burgermeister', dinner: 'Lode & Stijn' } },
    { title: 'Descobertas', icon: '🎭', activities: ['Kreuzberg (arte urbana)', 'Tempelhof (antigo aeroporto)', 'Teufelsberg (estação espiã)'], restaurants: { lunch: 'Café Strauss', dinner: 'Barra Berlin' } },
    { title: 'Aventura', icon: '⭐', activities: ['Bate-volta Potsdam (Sanssouci)', 'Palácio de Sans-Souci', 'Bairro Holandês (Potsdam)'], restaurants: { lunch: 'Drachenhaus (Potsdam)', dinner: 'Facil' } },
  ],
  'bogota': [
    { title: 'Cultura', icon: '🏛️', activities: ['Museo del Oro', 'Museo Botero', 'La Candelaria (bairro histórico)'], restaurants: { lunch: 'La Puerta Falsa (tamales)', dinner: 'Leo (Michelin)' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Paloquemao Market', 'Tour de arepas + chocolate', 'Usaquén (feira gastronômica)'], restaurants: { lunch: 'Andrés Carne de Res', dinner: 'Criterion' } },
    { title: 'Passeios', icon: '🚶', activities: ['Cerro Monserrate (teleférico)', 'Usaquén (domingos)', 'Parque Simón Bolívar'], restaurants: { lunch: 'Mini-mal', dinner: 'El Cielo' } },
    { title: 'Aventura', icon: '⭐', activities: ['Bate-volta Zipaquirá (Catedral de Sal)', 'Laguna de Guatavita', 'Suesca (escalada)'], restaurants: { lunch: 'Restaurante em Zipaquirá', dinner: 'Harry Sasson' } },
  ],
  'budapeste': [
    { title: 'Cultura', icon: '🏛️', activities: ['Parlamento Húngaro', 'Castelo de Buda + Bastião dos Pescadores', 'Ópera Estatal'], restaurants: { lunch: 'Központ (húngaro moderno)', dinner: 'Costes (Michelin)' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Great Market Hall', 'Tour de comida judaica em Erzsébetváros', 'Degustação de palinka'], restaurants: { lunch: 'Bors Gasztrobár', dinner: 'Onyx' } },
    { title: 'Passeios', icon: '🚶', activities: ['Ponte das Correntes (Széchenyi)', 'Margit Island', 'Ruin bars (Szimpla Kert)'], restaurants: { lunch: 'Kiosk Budapest', dinner: 'Mazel Tov' } },
    { title: 'Aventura', icon: '⭐', activities: ['Széchenyi Thermal Baths', 'Gellért Spa', 'Cruzeiro noturno pelo Danúbio'], restaurants: { lunch: 'Café Gerbeaud', dinner: 'Stand Restaurant' } },
  ],
  'cartagena': [
    { title: 'Cultura', icon: '🏛️', activities: ['Cidade Murada (Centro Histórico)', 'Castillo San Felipe', 'Palácio da Inquisição'], restaurants: { lunch: 'La Cevichería', dinner: 'Carmen' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Mercado de Bazurto', 'Tour de frutas exóticas', 'Aula de ceviche'], restaurants: { lunch: 'La Cocina de Pepina', dinner: 'Alma' } },
    { title: 'Passeios', icon: '🚶', activities: ['Getsemaní (arte de rua)', 'Café del Mar (pôr do sol)', 'Convento de la Popa'], restaurants: { lunch: 'Interno (restaurante social)', dinner: 'El Boliche (ceviches)' } },
    { title: 'Aventura', icon: '⭐', activities: ['Islas del Rosario (snorkeling)', 'Playa Blanca (Barú)', 'Volcán del Totumo (banho de lama)'], restaurants: { lunch: 'Restaurante em Barú', dinner: 'La Vitrola' } },
  ],
  'cidadedocabo': [
    { title: 'Cultura', icon: '🏛️', activities: ['Robben Island (Mandela)', 'Zeitz MOCAA', 'Bo-Kaap (bairro colorido)'], restaurants: { lunch: 'Bo-Kaap Kombuis', dinner: 'The Test Kitchen' } },
    { title: 'Passeios', icon: '🚶', activities: ['Table Mountain (teleférico)', 'V&A Waterfront', "Chapman's Peak Drive"], restaurants: { lunch: 'Harbour House', dinner: 'La Colombe' } },
    { title: 'Aventura', icon: '⭐', activities: ['Boulders Beach (pinguins)', 'Cape Point (Cabo da Boa Esperança)', 'Shark cage diving'], restaurants: { lunch: 'Black Sheep em Franschhoek', dinner: 'Kloof Street House' } },
    { title: 'Descobertas', icon: '🎭', activities: ['Kirstenbosch Gardens', 'Constantia (vinícolas)', 'Woodstock (arte urbana)'], restaurants: { lunch: 'The Pot Luck Club', dinner: 'Fyn' } },
  ],
  'cidadedomexico': [
    { title: 'Cultura', icon: '🏛️', activities: ['Museu Nacional de Antropologia', 'Templo Mayor', 'Palacio de Bellas Artes'], restaurants: { lunch: 'El Cardenal', dinner: 'Pujol' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Mercado de San Juan', 'Tour de tacos em La Condesa', 'Mezcalería (degustação)'], restaurants: { lunch: 'Contramar', dinner: 'Quintonil (Michelin)' } },
    { title: 'Passeios', icon: '🚶', activities: ['Coyoacán (Casa Frida Kahlo)', 'Xochimilco (trajineras)', 'Chapultepec (castelo + parque)'], restaurants: { lunch: 'Los Danzantes (Coyoacán)', dinner: 'Rosetta' } },
    { title: 'Aventura', icon: '⭐', activities: ['Pirâmides de Teotihuacán', 'Voo de balão sobre Teotihuacán', 'Basílica de Guadalupe'], restaurants: { lunch: 'La Gruta (dentro de caverna)', dinner: 'Máximo Bistrot' } },
  ],
  'cusco': [
    { title: 'Cultura', icon: '🏛️', activities: ['Plaza de Armas + Catedral', 'Qoricancha (Templo do Sol)', 'San Blas (bairro artesanal)'], restaurants: { lunch: 'Cicciolina', dinner: 'MAP Café' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Mercado San Pedro', 'Degustação de pisco sour', 'Aula de culinária peruana'], restaurants: { lunch: 'Morena Peruvian Kitchen', dinner: 'Chicha por Gastón Acurio' } },
    { title: 'Passeios', icon: '🚶', activities: ['Sacsayhuamán', 'Vale Sagrado (Ollantaytambo)', 'Moray (terraços circulares)'], restaurants: { lunch: 'El Huacatay (Urubamba)', dinner: 'Limo' } },
    { title: 'Aventura', icon: '⭐', activities: ['Machu Picchu', 'Trilha Inca (1 dia)', 'Montanha Arco-Íris (Vinicunca)'], restaurants: { lunch: 'Toto´s House (Aguas Calientes)', dinner: 'Calle del Medio' } },
  ],
  'dublin': [
    { title: 'Cultura', icon: '🏛️', activities: ['Trinity College + Book of Kells', 'Kilmainham Gaol', 'National Museum of Ireland'], restaurants: { lunch: 'The Woollen Mills', dinner: 'Chapter One (Michelin)' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Guinness Storehouse', 'Temple Bar (pubs)', 'Jameson Distillery'], restaurants: { lunch: 'The Brazen Head (pub mais antigo)', dinner: 'Etto' } },
    { title: 'Passeios', icon: '🚶', activities: ['St. Stephen\'s Green', 'Grafton Street', 'Phoenix Park'], restaurants: { lunch: 'Cornucopia', dinner: 'The Winding Stair' } },
    { title: 'Aventura', icon: '⭐', activities: ['Bate-volta Cliffs of Moher', 'Howth Head (trilha costeira)', 'Glendalough (vale glacial)'], restaurants: { lunch: 'Howth Market', dinner: 'Mulberry Garden' } },
  ],
  'dubrovnik': [
    { title: 'Cultura', icon: '🏛️', activities: ['Muralhas da Cidade (caminhada)', 'Stradun (rua principal)', 'Palácio do Reitor'], restaurants: { lunch: 'Nishta', dinner: 'Proto' } },
    { title: 'Passeios', icon: '🚶', activities: ['Teleférico Monte Srđ', 'Lokrum Island', 'Fort Lovrijenac'], restaurants: { lunch: 'Banje Beach bar', dinner: 'Nautika' } },
    { title: 'Aventura', icon: '⭐', activities: ['Kayak pelas muralhas', 'Ilhas Elafiti (barco)', 'Mergulho no Adriático'], restaurants: { lunch: 'Restaurante em Lopud', dinner: 'Restaurant 360' } },
    { title: 'Descobertas', icon: '🎭', activities: ['Tour Game of Thrones', 'Trsteno Arboretum', 'Ston (muralhas + ostras)'], restaurants: { lunch: 'Bota Šare (ostras)', dinner: 'Pantarul' } },
  ],
  'florenca': [
    { title: 'Cultura', icon: '🏛️', activities: ['Galleria degli Uffizi', 'Duomo + Cúpula de Brunelleschi', 'Galleria dell\'Accademia (Davi)'], restaurants: { lunch: 'Trattoria Mario', dinner: 'Buca Mario' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Mercato Centrale', 'Tour de gelato', 'Degustação de Chianti'], restaurants: { lunch: "All'Antico Vinaio (panini)", dinner: 'Il Latini' } },
    { title: 'Passeios', icon: '🚶', activities: ['Ponte Vecchio', 'Palazzo Pitti + Jardins Boboli', 'Piazzale Michelangelo (pôr do sol)'], restaurants: { lunch: 'Vivoli (gelato)', dinner: 'Trattoria Sostanza' } },
    { title: 'Aventura', icon: '⭐', activities: ['Bate-volta Val d\'Orcia (Toscana)', 'San Gimignano', 'Siena'], restaurants: { lunch: 'Osteria em San Gimignano', dinner: 'Enoteca Pinchiorri' } },
  ],
  'florianopolis': [
    { title: 'Cultura', icon: '🏛️', activities: ['Centro Histórico + Praça XV', 'Mercado Público', 'Ponte Hercílio Luz'], restaurants: { lunch: 'Box 32 (frutos do mar)', dinner: 'Ostradamus' } },
    { title: 'Passeios', icon: '🚶', activities: ['Praia da Joaquina (dunas)', 'Lagoa da Conceição', 'Santo Antônio de Lisboa'], restaurants: { lunch: 'Arante (Pântano do Sul)', dinner: 'Marisqueira Sintra' } },
    { title: 'Aventura', icon: '⭐', activities: ['Trilha da Lagoinha do Leste', 'Stand-up paddle na Lagoa', 'Sandboard nas dunas da Joaquina'], restaurants: { lunch: 'Bar do Arante', dinner: 'Isola di Capri' } },
    { title: 'Descobertas', icon: '🎭', activities: ['Ribeirão da Ilha (ostras)', 'Jurerê Internacional', 'Praia do Campeche + Ilha'], restaurants: { lunch: 'Rancho Açoriano', dinner: 'Black Swan' } },
  ],
  'fozdoiguacu': [
    { title: 'Cultura', icon: '🏛️', activities: ['Cataratas do Iguaçu (lado brasileiro)', 'Cataratas (lado argentino)', 'Marco das Três Fronteiras'], restaurants: { lunch: 'Porto Canoas', dinner: 'Capitão Bar' } },
    { title: 'Passeios', icon: '🚶', activities: ['Parque das Aves', 'Usina de Itaipu', 'Templo Budista'], restaurants: { lunch: 'Restaurante Búfalo Branco', dinner: 'Chez Deolinda' } },
    { title: 'Aventura', icon: '⭐', activities: ['Macuco Safari (bote nas cataratas)', 'Trilha das Cataratas', 'Rafting no Rio Iguaçu'], restaurants: { lunch: 'Pícnic no parque', dinner: 'Tarobá Churrascaria' } },
  ],
  'genebra': [
    { title: 'Cultura', icon: '🏛️', activities: ['Jet d\'Eau', 'Palais des Nations (ONU)', 'CERN (visita guiada)'], restaurants: { lunch: 'Café du Soleil (fondue)', dinner: 'Le Chat-Botté' } },
    { title: 'Passeios', icon: '🚶', activities: ['Vieille Ville (cidade antiga)', 'Catedral de São Pedro', 'Jardim Inglês + Relógio de Flores'], restaurants: { lunch: 'Brasserie des Halles de l\'Île', dinner: 'Bayview' } },
    { title: 'Aventura', icon: '⭐', activities: ['Cruzeiro no Lago Genebra', 'Bate-volta Chamonix (Mont Blanc)', 'Annecy (vila medieval)'], restaurants: { lunch: 'Restaurante em Annecy', dinner: 'Domaine de Châteauvieux' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Carouge (bairro boêmio)', 'Chocolateria Stettler', 'Degustação de queijos suíços'], restaurants: { lunch: 'Chez Ma Cousine', dinner: 'Roberto (italiano)' } },
  ],
  'gramado': [
    { title: 'Cultura', icon: '🏛️', activities: ['Mini Mundo', 'Museu do Festival de Cinema', 'Igreja Matriz São Pedro'], restaurants: { lunch: 'Colosseo', dinner: 'Belle du Valais (fondue)' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Rua Coberta (chocolates)', 'Fábrica de Chocolate Prawer', 'Tour de vinícolas em Bento Gonçalves'], restaurants: { lunch: 'Mamma Gema', dinner: 'Josephina' } },
    { title: 'Passeios', icon: '🚶', activities: ['Lago Negro', 'Pórtico Via Nova Petrópolis', 'Parque do Caracol (cascata)'], restaurants: { lunch: 'Café Colonial Bela Vista', dinner: 'Wood Fire' } },
    { title: 'Aventura', icon: '⭐', activities: ['Snowland', 'Bondinhos Aéreos em Canela', 'Alpen Park'], restaurants: { lunch: 'Le Refuge (Canela)', dinner: 'Empório Canela' } },
  ],
  'hanoi': [
    { title: 'Cultura', icon: '🏛️', activities: ['Templo da Literatura', 'Mausoléu de Ho Chi Minh', 'Museu de Etnologia'], restaurants: { lunch: 'Bún Chả Hương Liên (Obama)', dinner: 'La Badiane' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Old Quarter (street food tour)', 'Phở Thìn (pho original)', 'Egg coffee em Giảng Café'], restaurants: { lunch: 'Phở Gia Truyền', dinner: 'Quán Ăn Ngon' } },
    { title: 'Passeios', icon: '🚶', activities: ['Lago Hoàn Kiếm + Templo Ngọc Sơn', 'Bairro Antigo (36 ruas)', 'Water Puppet Theatre'], restaurants: { lunch: 'Bánh Mì 25', dinner: 'Madame Hiên' } },
    { title: 'Aventura', icon: '⭐', activities: ['Baía de Ha Long (cruzeiro)', 'Tam Coc (Ninh Binh)', 'Sapa (terraços de arroz)'], restaurants: { lunch: 'Restaurante no cruzeiro', dinner: 'Home Hanoi' } },
  ],
  'havana': [
    { title: 'Cultura', icon: '🏛️', activities: ['Habana Vieja (centro histórico)', 'Capitolio Nacional', 'Museo de la Revolución'], restaurants: { lunch: 'La Guarida', dinner: 'San Cristóbal' } },
    { title: 'Passeios', icon: '🚶', activities: ['Malecón (passeio costeiro)', 'Passeio de carro clássico', 'Plaza Vieja + Cathedral'], restaurants: { lunch: 'El Del Frente', dinner: 'Doña Eutimia' } },
    { title: 'Descobertas', icon: '🎭', activities: ['Fusterlandia (mosaicos)', 'Callejón de Hamel (arte afro-cubana)', 'Fábrica de Arte Cubano'], restaurants: { lunch: 'O\'Reilly 304', dinner: 'Atelier' } },
    { title: 'Aventura', icon: '⭐', activities: ['Bate-volta Viñales (charutos)', 'Praia de Varadero', 'Cayo Blanco (snorkeling)'], restaurants: { lunch: 'Restaurante em Viñales', dinner: 'La Fontana' } },
  ],
  'istambul': [
    { title: 'Cultura', icon: '🏛️', activities: ['Hagia Sophia', 'Mesquita Azul', 'Palácio Topkapi'], restaurants: { lunch: 'Hafiz Mustafa 1864', dinner: 'Mikla (rooftop)' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Grand Bazaar', 'Spice Bazaar', 'Tour gastronômico em Kadıköy'], restaurants: { lunch: 'Karaköy Güllüoğlu (baklava)', dinner: 'Çiya Sofrası' } },
    { title: 'Passeios', icon: '🚶', activities: ['Cruzeiro pelo Bósforo', 'Torre de Gálata', 'Istiklal Caddesi + Taksim'], restaurants: { lunch: 'Balık Ekmek (sanduíche de peixe)', dinner: 'Nusr-Et' } },
    { title: 'Aventura', icon: '⭐', activities: ['Cisterna da Basílica', 'Ilhas dos Príncipes (ferry)', 'Banho turco (Çemberlitaş Hamamı)'], restaurants: { lunch: 'Restaurante em Büyükada', dinner: 'Sultanahmet Köftecisi' } },
  ],
  'jericoacoara': [
    { title: 'Passeios', icon: '🚶', activities: ['Duna do Pôr do Sol', 'Pedra Furada', 'Lagoa do Paraíso'], restaurants: { lunch: 'Restaurante do Carcará', dinner: 'Tamarindo' } },
    { title: 'Aventura', icon: '⭐', activities: ['Kitesurf na praia', 'Passeio de buggy (Tatajuba)', 'Stand-up paddle na lagoa azul'], restaurants: { lunch: 'Na Praia', dinner: 'Bistrô da Terra' } },
    { title: 'Descobertas', icon: '🎭', activities: ['Lagoa Azul', 'Árvore da Preguiça', 'Vila de Jeri (ruas de areia)'], restaurants: { lunch: 'Espaço Gourmet', dinner: 'Dona Amélia' } },
  ],
  'joanesburgo': [
    { title: 'Cultura', icon: '🏛️', activities: ['Apartheid Museum', 'Constitution Hill', 'Soweto (tour guiado)'], restaurants: { lunch: 'Sakhumzi (Soweto)', dinner: 'Marble' } },
    { title: 'Passeios', icon: '🚶', activities: ['Maboneng Precinct', 'Neighbourgoods Market', 'Cradle of Humankind'], restaurants: { lunch: 'Living Room (Maboneng)', dinner: 'DW Eleven-13' } },
    { title: 'Aventura', icon: '⭐', activities: ['Pilanesberg Safari (dia)', 'Lion & Safari Park', 'Bungee jump Soweto Towers'], restaurants: { lunch: 'Restaurante no parque', dinner: 'The Grillhouse' } },
  ],
  'kyoto': [
    { title: 'Cultura', icon: '🏛️', activities: ['Fushimi Inari (10.000 torii)', 'Kinkaku-ji (Pavilhão Dourado)', 'Kiyomizu-dera'], restaurants: { lunch: 'Nishiki Market', dinner: 'Kikunoi (Michelin)' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Nishiki Market (cozinha de Kyoto)', 'Cerimônia do chá', 'Tofu kaiseki'], restaurants: { lunch: 'Omen (udon)', dinner: 'Gion Namba' } },
    { title: 'Passeios', icon: '🚶', activities: ['Arashiyama (bambuzal)', 'Gion (bairro das gueixas)', 'Filósofo\'s Path'], restaurants: { lunch: 'Sagano Tofu', dinner: 'Pontocho Alley (yakitori)' } },
    { title: 'Aventura', icon: '⭐', activities: ['Bate-volta Nara (cervos + templos)', 'Todai-ji (Grande Buda)', 'Fushimi Sake District'], restaurants: { lunch: 'Mochidono (Nara)', dinner: 'Giro Giro Hitoshina' } },
  ],
  'lasvegas': [
    { title: 'Cultura', icon: '🏛️', activities: ['The Strip (passeio)', 'Bellagio Fountains', 'Neon Museum'], restaurants: { lunch: 'In-N-Out Burger', dinner: 'Joel Robuchon (Michelin)' } },
    { title: 'Passeios', icon: '🚶', activities: ['Venetian + Grand Canal', 'High Roller (roda-gigante)', 'Fremont Street Experience'], restaurants: { lunch: 'Eggslut', dinner: 'Bazaar Meat by José Andrés' } },
    { title: 'Aventura', icon: '⭐', activities: ['Grand Canyon (helicóptero)', 'Red Rock Canyon', 'Valley of Fire State Park'], restaurants: { lunch: 'Pícnic em Red Rock', dinner: 'Nobu' } },
    { title: 'Descobertas', icon: '🎭', activities: ['Cirque du Soleil', 'Area 15 (imersivo)', 'Arts District'], restaurants: { lunch: 'Tacos El Gordo', dinner: 'é by José Andrés' } },
  ],
  'lima': [
    { title: 'Cultura', icon: '🏛️', activities: ['Centro Histórico + Plaza Mayor', 'Huaca Pucllana', 'Museu Larco'], restaurants: { lunch: 'La Mar (cebicheria)', dinner: 'Central (melhor do mundo)' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Mercado de Surquillo', 'Tour de ceviche', 'Aula de pisco sour'], restaurants: { lunch: 'Isolina (comida criolla)', dinner: 'Maido' } },
    { title: 'Passeios', icon: '🚶', activities: ['Miraflores (Parque del Amor)', 'Barranco (bairro boêmio)', 'Larcomar (shopping + vista)'], restaurants: { lunch: 'Café Bisetti (Barranco)', dinner: 'Astrid y Gastón' } },
    { title: 'Aventura', icon: '⭐', activities: ['Paracas (Islas Ballestas)', 'Huacachina (oásis + sandboard)', 'Paragliding em Miraflores'], restaurants: { lunch: 'Restaurante em Paracas', dinner: 'Rafael' } },
  ],
  'losangeles': [
    { title: 'Cultura', icon: '🏛️', activities: ['Getty Center', 'The Broad', 'Griffith Observatory'], restaurants: { lunch: 'Grand Central Market', dinner: 'Bestia' } },
    { title: 'Passeios', icon: '🚶', activities: ['Hollywood Boulevard + Walk of Fame', 'Venice Beach + Boardwalk', 'Santa Monica Pier'], restaurants: { lunch: 'In-N-Out Burger', dinner: 'Republique' } },
    { title: 'Aventura', icon: '⭐', activities: ['Malibu (praias + canyons)', 'Runyon Canyon (trilha)', 'Disneyland (Anaheim)'], restaurants: { lunch: 'Nobu Malibu', dinner: 'Providence' } },
    { title: 'Descobertas', icon: '🎭', activities: ['Arts District DTLA', 'Silver Lake (cafés + lojas)', 'Rodeo Drive + Beverly Hills'], restaurants: { lunch: 'Howlin\' Ray\'s (hot chicken)', dinner: 'n/naka' } },
  ],
  'lyon': [
    { title: 'Cultura', icon: '🏛️', activities: ['Vieux Lyon (Renascença)', 'Basílica de Fourvière', 'Traboules (passagens secretas)'], restaurants: { lunch: 'Bouchon Daniel et Denise', dinner: 'Paul Bocuse' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Les Halles de Lyon Paul Bocuse', 'Tour de bouchons lyonnais', 'Degustação de Beaujolais'], restaurants: { lunch: 'Café Comptoir Abel', dinner: 'La Mère Brazier' } },
    { title: 'Passeios', icon: '🚶', activities: ['Presqu\'île (entre rios)', 'Parc de la Tête d\'Or', 'Confluence (arquitetura moderna)'], restaurants: { lunch: 'Chez Paul', dinner: 'Têtedoie' } },
    { title: 'Aventura', icon: '⭐', activities: ['Bate-volta Pérouges (vila medieval)', 'Beaujolais (vinícolas)', 'Mont Pilat'], restaurants: { lunch: 'Hostellerie du Vieux Pérouges', dinner: 'Le Bec' } },
  ],
  'madri': [
    { title: 'Cultura', icon: '🏛️', activities: ['Museu do Prado', 'Reina Sofía (Guernica)', 'Palácio Real'], restaurants: { lunch: 'Mercado de San Miguel', dinner: 'StreetXO' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Mercado de San Miguel', 'Tour de tapas em La Latina', 'Aula de paella + sangria'], restaurants: { lunch: 'La Barraca (paella)', dinner: 'DiverXO (Michelin)' } },
    { title: 'Passeios', icon: '🚶', activities: ['Retiro Park + Palácio de Cristal', 'Gran Vía + Sol', 'Bairro de las Letras'], restaurants: { lunch: 'Sobrino de Botín (mais antigo)', dinner: 'Lateral' } },
    { title: 'Aventura', icon: '⭐', activities: ['Bate-volta Toledo', 'Catedral de Toledo', 'Segóvia (aqueduto + leitão)'], restaurants: { lunch: 'Mesón Cándido (Segóvia)', dinner: 'Coque' } },
  ],
  'male': [
    { title: 'Cultura', icon: '🏛️', activities: ['Friday Mosque (Hukuru Miskiy)', 'National Museum', 'Fish Market'], restaurants: { lunch: 'Sala Thai', dinner: 'The Sea House' } },
    { title: 'Passeios', icon: '🚶', activities: ['Hulhumalé Beach', 'Snorkeling em Villingili', 'Sultan Park'], restaurants: { lunch: 'Symphony', dinner: 'Jade Bistro' } },
    { title: 'Aventura', icon: '⭐', activities: ['Snorkeling com mantas', 'Mergulho em recife de coral', 'Excursão banco de areia'], restaurants: { lunch: 'Pícnic na praia', dinner: 'Ithaa (subaquático)' } },
  ],
  'manaus': [
    { title: 'Cultura', icon: '🏛️', activities: ['Teatro Amazonas', 'Mercado Adolpho Lisboa', 'Centro Histórico'], restaurants: { lunch: 'Restaurante Banzeiro', dinner: 'Caxiri' } },
    { title: 'Passeios', icon: '🚶', activities: ['Encontro das Águas', 'Praia da Ponta Negra', 'MUSA (Museu da Amazônia)'], restaurants: { lunch: 'Tambaqui de Banda', dinner: 'Casa do Pensador' } },
    { title: 'Aventura', icon: '⭐', activities: ['Selva amazônica (lodge)', 'Observação de botos-cor-de-rosa', 'Trilha na floresta + aldeia indígena'], restaurants: { lunch: 'Restaurante no lodge', dinner: 'Restaurante Flutuante' } },
  ],
  'marrakech': [
    { title: 'Cultura', icon: '🏛️', activities: ['Mesquita Koutoubia', 'Palais Bahia', 'Medersa Ben Youssef'], restaurants: { lunch: 'Café Nomad', dinner: 'La Maison Arabe' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Jemaa el-Fna (barracas noturnas)', 'Aula de tagine', 'Souk de especiarias'], restaurants: { lunch: 'Al Fassia', dinner: 'Le Jardin' } },
    { title: 'Passeios', icon: '🚶', activities: ['Jardins Majorelle', 'Medina (souks)', 'Saadian Tombs'], restaurants: { lunch: 'NOMAD', dinner: 'Dar Yacout' } },
    { title: 'Aventura', icon: '⭐', activities: ['Montanhas Atlas (mula/4x4)', 'Cascatas de Ouzoud', 'Deserto de Agafay (glamping)'], restaurants: { lunch: 'Restaurante berbere', dinner: 'Le Comptoir Darna' } },
  ],
  'medellin': [
    { title: 'Cultura', icon: '🏛️', activities: ['Plaza Botero', 'Comuna 13 (grafiti tour)', 'Museo de Antioquia'], restaurants: { lunch: 'Hacienda (bandeja paisa)', dinner: 'El Cielo' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Mercado del Río', 'Tour de café colombiano', 'Mondongos (comida típica)'], restaurants: { lunch: 'Mondongos', dinner: 'Carmen' } },
    { title: 'Passeios', icon: '🚶', activities: ['Parque Arví (teleférico)', 'El Poblado (cafés)', 'Jardín Botánico'], restaurants: { lunch: 'Restaurante em Arví', dinner: 'Oci.Mde' } },
    { title: 'Aventura', icon: '⭐', activities: ['Bate-volta Guatapé (Peñón)', 'Parapente em San Félix', 'Río Claro (rafting)'], restaurants: { lunch: 'Restaurante em Guatapé', dinner: 'Alambique' } },
  ],
  'melbourne': [
    { title: 'Cultura', icon: '🏛️', activities: ['NGV (National Gallery of Victoria)', 'Federation Square', 'Immigration Museum'], restaurants: { lunch: 'Lune Croissanterie', dinner: 'Attica' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Queen Victoria Market', 'Laneways coffee tour', 'South Melbourne Market'], restaurants: { lunch: 'Chin Chin', dinner: 'Supernormal' } },
    { title: 'Passeios', icon: '🚶', activities: ['Hosier Lane (street art)', 'Royal Botanic Gardens', 'St Kilda Beach + pinguins'], restaurants: { lunch: 'Tipo 00 (pasta)', dinner: 'Cumulus Inc.' } },
    { title: 'Aventura', icon: '⭐', activities: ['Great Ocean Road', 'Twelve Apostles', 'Yarra Valley (vinícolas)'], restaurants: { lunch: 'Apollo Bay (fish & chips)', dinner: 'Vue de Monde' } },
  ],
  'mendoza': [
    { title: 'Cultura', icon: '🏛️', activities: ['Plaza Independencia', 'Museo del Área Fundacional', 'Teatro Independencia'], restaurants: { lunch: 'Fuente y Fonda', dinner: 'Azafran' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Tour de vinícolas (Malbec)', 'Bodega Catena Zapata', 'Bodega Zuccardi'], restaurants: { lunch: 'Restaurante Zuccardi', dinner: '1884 Francis Mallmann' } },
    { title: 'Passeios', icon: '🚶', activities: ['Parque General San Martín', 'Chacras de Coria', 'Maipu (bike + vinícolas)'], restaurants: { lunch: 'Patio de Jesús María', dinner: 'Siete Cocinas' } },
    { title: 'Aventura', icon: '⭐', activities: ['Aconcágua (base camp trek)', 'Rafting no Río Mendoza', 'Termas de Cacheuta'], restaurants: { lunch: 'Restaurante na montanha', dinner: 'Casa Vigil' } },
  ],
  'montevideu': [
    { title: 'Cultura', icon: '🏛️', activities: ['Teatro Solís', 'Museo Torres García', 'Plaza Independencia'], restaurants: { lunch: 'Mercado del Puerto', dinner: 'La Perdiz' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Mercado del Puerto (parrilha)', 'Tour de chivito', 'Bodega Bouza'], restaurants: { lunch: 'El Palenque (chivito)', dinner: 'Jacinto' } },
    { title: 'Passeios', icon: '🚶', activities: ['Ciudad Vieja (rambla)', 'Pocitos Beach', 'Parque Rodó'], restaurants: { lunch: 'Café Brasilero', dinner: 'Estrecho' } },
    { title: 'Aventura', icon: '⭐', activities: ['Bate-volta Colonia del Sacramento', 'Barrio Histórico (Colonia)', 'Bodega Juanicó'], restaurants: { lunch: 'El Drugstore (Colonia)', dinner: 'Francis (Colonia)' } },
  ],
  'munique': [
    { title: 'Cultura', icon: '🏛️', activities: ['Marienplatz + Glockenspiel', 'Residenz München', 'Alte Pinakothek'], restaurants: { lunch: 'Augustiner Bräustuben', dinner: 'Tantris' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Viktualienmarkt', 'Hofbräuhaus', 'Beer garden Englischer Garten'], restaurants: { lunch: 'Weisses Bräuhaus', dinner: 'Schuhbecks' } },
    { title: 'Passeios', icon: '🚶', activities: ['Englischer Garten', 'Nymphenburg Palace', 'BMW Welt'], restaurants: { lunch: 'Café Luitpold', dinner: 'Brenner' } },
    { title: 'Aventura', icon: '⭐', activities: ['Bate-volta Neuschwanstein', 'Castelo de Linderhof', 'Zugspitze (pico mais alto)'], restaurants: { lunch: 'Restaurante em Füssen', dinner: 'Restaurant Dallmayr' } },
  ],
  'nairobi': [
    { title: 'Cultura', icon: '🏛️', activities: ['Nairobi National Museum', 'Karen Blixen Museum', 'Kazuri Beads Factory'], restaurants: { lunch: 'Carnivore Restaurant', dinner: 'Talisman' } },
    { title: 'Passeios', icon: '🚶', activities: ['David Sheldrick Elephant Orphanage', 'Giraffe Centre', 'Nairobi National Park'], restaurants: { lunch: 'Mama Oliech', dinner: 'About Thyme' } },
    { title: 'Aventura', icon: '⭐', activities: ['Safari Masai Mara (2 dias)', 'Lake Nakuru (flamingos)', 'Great Rift Valley'], restaurants: { lunch: 'Restaurante no safari', dinner: 'Saruni Mara lodge' } },
  ],
  'natal': [
    { title: 'Cultura', icon: '🏛️', activities: ['Forte dos Reis Magos', 'Centro Histórico', 'Maior Cajueiro do Mundo (Pirangi)'], restaurants: { lunch: 'Camarões', dinner: 'Mangai' } },
    { title: 'Passeios', icon: '🚶', activities: ['Praia de Ponta Negra + Morro do Careca', 'Parrachos de Maracajaú (snorkeling)', 'Genipabu (dunas)'], restaurants: { lunch: 'Tábua de Carne', dinner: 'Camarões Potiguar' } },
    { title: 'Aventura', icon: '⭐', activities: ['Buggy pelas dunas de Genipabu', 'Mergulho em Maracajaú', 'Passeio de dromedário'], restaurants: { lunch: 'Barraca na praia', dinner: 'Casa de Taipa' } },
  ],
  'nice': [
    { title: 'Cultura', icon: '🏛️', activities: ['Museu Matisse', 'Vieux Nice (cidade velha)', 'Colline du Château'], restaurants: { lunch: 'Chez Pipo (socca)', dinner: 'Jan (Michelin)' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Cours Saleya (mercado de flores)', 'Salade niçoise original', 'Tour gastronômico em Vieux Nice'], restaurants: { lunch: 'La Merenda', dinner: 'Le Safari' } },
    { title: 'Passeios', icon: '🚶', activities: ['Promenade des Anglais', 'Cap Ferrat (Villa Ephrussi)', 'Antibes (Museu Picasso)'], restaurants: { lunch: 'Plage Beau Rivage', dinner: 'La Petite Maison' } },
    { title: 'Aventura', icon: '⭐', activities: ['Bate-volta Monaco (Monte Carlo)', 'Èze Village (vila medieval)', 'Snorkeling em Villefranche'], restaurants: { lunch: 'Café de Paris (Monaco)', dinner: 'Le Plongeoir' } },
  ],
  'novadelhi': [
    { title: 'Cultura', icon: '🏛️', activities: ['Red Fort', 'Humayun\'s Tomb', 'Qutub Minar'], restaurants: { lunch: 'Karim\'s (Old Delhi)', dinner: 'Indian Accent' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Chandni Chowk (street food)', 'Paranthe Wali Gali', 'Aula de culinária indiana'], restaurants: { lunch: 'Al Jawahar', dinner: 'Bukhara (ITC Maurya)' } },
    { title: 'Passeios', icon: '🚶', activities: ['Lotus Temple', 'Akshardham Temple', 'Connaught Place + Janpath'], restaurants: { lunch: 'Saravana Bhavan', dinner: 'Dum Pukht' } },
    { title: 'Aventura', icon: '⭐', activities: ['Bate-volta Agra (Taj Mahal)', 'Agra Fort', 'Fatehpur Sikri'], restaurants: { lunch: 'Pinch of Spice (Agra)', dinner: 'Olive Bar & Kitchen' } },
  ],
  'orlando': [
    { title: 'Passeios', icon: '🚶', activities: ['Magic Kingdom', 'EPCOT', 'Animal Kingdom'], restaurants: { lunch: 'Be Our Guest (Magic Kingdom)', dinner: 'Victoria & Albert\'s' } },
    { title: 'Aventura', icon: '⭐', activities: ['Universal Studios + Islands of Adventure', 'Wizarding World of Harry Potter', 'Kennedy Space Center'], restaurants: { lunch: 'Three Broomsticks', dinner: 'The Ravenous Pig' } },
    { title: 'Descobertas', icon: '🎭', activities: ['Disney Springs', 'International Drive', 'SeaWorld'], restaurants: { lunch: 'The Boathouse', dinner: 'Morimoto Asia' } },
  ],
  'osaka': [
    { title: 'Cultura', icon: '🏛️', activities: ['Osaka Castle', 'Shitennō-ji (templo mais antigo)', 'National Museum of Art'], restaurants: { lunch: 'Ippudo Ramen', dinner: 'Ajinoya (okonomiyaki)' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Dōtonbori (street food)', 'Kuromon Market', 'Shinsekai (kushikatsu)'], restaurants: { lunch: 'Daruma (kushikatsu)', dinner: 'Mizuno (okonomiyaki)' } },
    { title: 'Passeios', icon: '🚶', activities: ['Dōtonbori (neons + canal)', 'Namba (compras)', 'Umeda Sky Building'], restaurants: { lunch: 'Takoyaki Wanaka', dinner: 'Kitashinchi (restaurantes)' } },
    { title: 'Aventura', icon: '⭐', activities: ['Universal Studios Japan', 'Bate-volta Hiroshima + Miyajima', 'Mount Kōya (templos)'], restaurants: { lunch: 'Okonomimura (Hiroshima)', dinner: 'Hajime (Michelin)' } },
  ],
  'pequim': [
    { title: 'Cultura', icon: '🏛️', activities: ['Cidade Proibida', 'Praça Tiananmen', 'Templo do Céu'], restaurants: { lunch: 'Quanjude (pato laqueado)', dinner: 'Da Dong' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Wangfujing Snack Street', 'Hutong food tour', 'Aula de dumpling'], restaurants: { lunch: 'Baoyuan Jiaozi Wu (dumplings)', dinner: 'TRB Hutong' } },
    { title: 'Passeios', icon: '🚶', activities: ['Hutongs (beco de bicicleta)', 'Lago Houhai', 'Palácio de Verão'], restaurants: { lunch: 'Noodle bar no hutong', dinner: 'King\'s Joy (vegetariano)' } },
    { title: 'Aventura', icon: '⭐', activities: ['Grande Muralha (Mutianyu)', 'Tumbas Ming', 'Via Sagrada'], restaurants: { lunch: 'Restaurante na Muralha', dinner: 'Jing Yaa Tang' } },
  ],
  'porto': [
    { title: 'Cultura', icon: '🏛️', activities: ['Livraria Lello', 'Torre dos Clérigos', 'Sé Catedral'], restaurants: { lunch: 'Café Santiago (francesinha)', dinner: 'The Yeatman' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Caves de vinho do Porto (Vila Nova de Gaia)', 'Mercado do Bolhão', 'Tour de francesinhas'], restaurants: { lunch: 'Cantinho do Avillez', dinner: 'Pedro Lemos (Michelin)' } },
    { title: 'Passeios', icon: '🚶', activities: ['Ribeira (UNESCO)', 'Ponte Dom Luís I', 'Foz do Douro (praia)'], restaurants: { lunch: 'Café Majestic', dinner: 'DOP' } },
    { title: 'Aventura', icon: '⭐', activities: ['Cruzeiro pelo Rio Douro', 'Bate-volta Douro (vinícolas)', 'Guimarães (berço de Portugal)'], restaurants: { lunch: 'DOC no Douro', dinner: 'Casa de Chá da Boa Nova (Michelin)' } },
  ],
  'praga': [
    { title: 'Cultura', icon: '🏛️', activities: ['Castelo de Praga', 'Catedral de São Vito', 'Ponte Carlos'], restaurants: { lunch: 'Lokál', dinner: 'La Degustation (Michelin)' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Havelské Tržiště (mercado)', 'Cervejaria Strahov', 'Tour de cerveja tcheca'], restaurants: { lunch: 'Café Imperial', dinner: 'Field (Michelin)' } },
    { title: 'Passeios', icon: '🚶', activities: ['Praça da Cidade Velha + Relógio Astronômico', 'Josefov (bairro judeu)', 'Petřín Hill (torre)'], restaurants: { lunch: 'Café Savoy', dinner: 'Mlýnec' } },
    { title: 'Aventura', icon: '⭐', activities: ['Bate-volta Český Krumlov', 'Kutná Hora (Ossuário)', 'Karlštejn Castle'], restaurants: { lunch: 'Restaurante em Český Krumlov', dinner: 'Eska' } },
  ],
  'puntadeleste': [
    { title: 'Passeios', icon: '🚶', activities: ['La Mano (escultura na praia)', 'Porto de Punta del Este', 'Casapueblo (Carlos Páez Vilaró)'], restaurants: { lunch: 'Lo de Tere', dinner: 'La Huella' } },
    { title: 'Aventura', icon: '⭐', activities: ['José Ignacio (praia)', 'Rota dos vinhos (Bodega Garzón)', 'Isla de Lobos (leões-marinhos)'], restaurants: { lunch: 'Restaurante Garzón (Mallmann)', dinner: 'Marismo' } },
    { title: 'Descobertas', icon: '🎭', activities: ['Fundación Atchugarry (esculturas)', 'Manantiales Beach', 'Feira de artesanato'], restaurants: { lunch: 'Parador La Huella', dinner: 'Il Baretto' } },
  ],
  'recife': [
    { title: 'Cultura', icon: '🏛️', activities: ['Recife Antigo (Marco Zero)', 'Instituto Ricardo Brennand', 'Paço do Frevo'], restaurants: { lunch: 'Oficina do Sabor (Olinda)', dinner: 'Ponte Nova' } },
    { title: 'Passeios', icon: '🚶', activities: ['Olinda (centro histórico)', 'Praia de Boa Viagem', 'Casa da Cultura'], restaurants: { lunch: 'Beijupirá', dinner: 'Wiella Bistrô' } },
    { title: 'Aventura', icon: '⭐', activities: ['Praia dos Carneiros', 'Porto de Galinhas (piscinas naturais)', 'Mergulho em Fernando de Noronha'], restaurants: { lunch: 'Barcaxeira (Carneiros)', dinner: 'Galpão' } },
  ],
  'riodejaneiro': [
    { title: 'Cultura', icon: '🏛️', activities: ['Cristo Redentor', 'Museu do Amanhã', 'Escadaria Selarón'], restaurants: { lunch: 'Confeitaria Colombo', dinner: 'Lasai' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Feira de São Cristóvão', 'Bar do Mineiro (Santa Teresa)', 'Tour gastronômico no Centro'], restaurants: { lunch: 'Zaza Bistrô', dinner: 'Oro (Michelin)' } },
    { title: 'Passeios', icon: '🚶', activities: ['Pão de Açúcar (bondinho)', 'Copacabana + Ipanema', 'Santa Teresa (bonde)'], restaurants: { lunch: 'Azul Marinho', dinner: 'Aprazível' } },
    { title: 'Aventura', icon: '⭐', activities: ['Trilha Pedra Bonita', 'Floresta da Tijuca', 'Asa-delta em São Conrado'], restaurants: { lunch: 'Bar Urca', dinner: 'Marius Degustare' } },
  ],
  'salvador': [
    { title: 'Cultura', icon: '🏛️', activities: ['Pelourinho (centro histórico)', 'Igreja de São Francisco', 'Elevador Lacerda'], restaurants: { lunch: 'Acarajé da Dinha', dinner: 'Amado' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Mercado Modelo', 'Aula de moqueca baiana', 'Tour de acarajé'], restaurants: { lunch: 'Casa de Tereza', dinner: 'Paraíso Tropical' } },
    { title: 'Passeios', icon: '🚶', activities: ['Farol da Barra', 'Cidade Baixa (Mercado)', 'Solar do Unhão (MAM)'], restaurants: { lunch: 'Restaurante do SESC', dinner: 'Ori' } },
    { title: 'Aventura', icon: '⭐', activities: ['Praia do Forte (Projeto Tamar)', 'Morro de São Paulo (lancha)', 'Ilha de Itaparica'], restaurants: { lunch: 'Restaurante em Praia do Forte', dinner: 'Mistura (Pelourinho)' } },
  ],
  'sanfrancisco': [
    { title: 'Cultura', icon: '🏛️', activities: ['Golden Gate Bridge', 'Alcatraz Island', 'SFMOMA'], restaurants: { lunch: 'Ferry Building Marketplace', dinner: 'State Bird Provisions' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Fisherman\'s Wharf', 'Mission District (burritos)', 'Chinatown (mais antigo dos EUA)'], restaurants: { lunch: 'La Taqueria (Mission)', dinner: 'Benu (Michelin)' } },
    { title: 'Passeios', icon: '🚶', activities: ['Cable Car + Lombard Street', 'Painted Ladies (Alamo Square)', 'Haight-Ashbury'], restaurants: { lunch: 'Tartine Bakery', dinner: 'Nopa' } },
    { title: 'Aventura', icon: '⭐', activities: ['Muir Woods (sequoias)', 'Sausalito (ferry + bike)', 'Napa Valley (vinícolas)'], restaurants: { lunch: 'Gott\'s Roadside (Napa)', dinner: 'The French Laundry' } },
  ],
  'santiago': [
    { title: 'Cultura', icon: '🏛️', activities: ['Museo Chileno de Arte Precolombino', 'Palacio de La Moneda', 'Cerro Santa Lucía'], restaurants: { lunch: 'La Mar (cebicheria)', dinner: 'Boragó' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Mercado Central', 'Tour de vinho (Concha y Toro)', 'Bairro Lastarria (cafés)'], restaurants: { lunch: 'Donde Augusto', dinner: 'Ambrosía' } },
    { title: 'Passeios', icon: '🚶', activities: ['Cerro San Cristóbal (teleférico)', 'Bairro Bellavista', 'Parque Bicentenario'], restaurants: { lunch: 'Liguria', dinner: 'Mestizo' } },
    { title: 'Aventura', icon: '⭐', activities: ['Cajón del Maipo', 'Embalse El Yeso', 'Valparaíso (bate-volta)'], restaurants: { lunch: 'Café con Piernas', dinner: 'De Patio' } },
  ],
  'santorini': [
    { title: 'Cultura', icon: '🏛️', activities: ['Oia (pôr do sol)', 'Fira (capital)', 'Akrotiri (ruínas minoicas)'], restaurants: { lunch: 'Ammoudi Fish Tavern', dinner: 'Lycabettus' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Degustação de vinho vulcânico (Santo Wines)', 'Aula de culinária grega', 'Tomato festival (Santorini)'], restaurants: { lunch: 'Metaxy Mas', dinner: 'Selene' } },
    { title: 'Passeios', icon: '🚶', activities: ['Trilha Fira-Oia', 'Red Beach', 'Thirasia Island (ferry)'], restaurants: { lunch: 'To Psaraki', dinner: 'Kapari Wine Restaurant' } },
    { title: 'Aventura', icon: '⭐', activities: ['Catamaran sunset cruise', 'Vulcão + hot springs', 'Mergulho em Caldera'], restaurants: { lunch: 'Restaurante no barco', dinner: 'Naoussa (Fira)' } },
  ],
  'seul': [
    { title: 'Cultura', icon: '🏛️', activities: ['Gyeongbokgung Palace', 'Bukchon Hanok Village', 'National Museum of Korea'], restaurants: { lunch: 'Gwangjang Market', dinner: 'Jungsik (Michelin)' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Gwangjang Market (bindaetteok)', 'Tour de BBQ coreano', 'Noryangjin Fish Market'], restaurants: { lunch: 'Tosokchon (samgyetang)', dinner: 'Myeongdong Kyoja (kalguksu)' } },
    { title: 'Passeios', icon: '🚶', activities: ['Myeongdong (compras + skincare)', 'Hongdae (arte urbana)', 'N Seoul Tower + Namsan'], restaurants: { lunch: 'Isaac Toast', dinner: 'Maple Tree House (BBQ)' } },
    { title: 'Aventura', icon: '⭐', activities: ['DMZ (zona desmilitarizada)', 'Nami Island', 'Bukhansan National Park (trilha)'], restaurants: { lunch: 'Restaurante na DMZ', dinner: 'Mingles' } },
  ],
  'sevilha': [
    { title: 'Cultura', icon: '🏛️', activities: ['Alcázar de Sevilha', 'Catedral + Giralda', 'Plaza de España'], restaurants: { lunch: 'El Rinconcillo (mais antigo)', dinner: 'Abantal (Michelin)' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Mercado de Triana', 'Tour de tapas em Santa Cruz', 'Show de flamenco + jantar'], restaurants: { lunch: 'Bodega Santa Cruz', dinner: 'Eslava' } },
    { title: 'Passeios', icon: '🚶', activities: ['Santa Cruz (bairro judeu)', 'Triana (cerâmica + ponte)', 'Parque de María Luisa'], restaurants: { lunch: 'La Brunilda', dinner: 'Contenedor' } },
    { title: 'Aventura', icon: '⭐', activities: ['Bate-volta Córdoba (Mesquita)', 'Ronda (ponte sobre o desfiladeiro)', 'Jerez (bodegas de sherry)'], restaurants: { lunch: 'Bodegas Mezquita (Córdoba)', dinner: 'AzCenit' } },
  ],
  'sydney': [
    { title: 'Cultura', icon: '🏛️', activities: ['Sydney Opera House (tour)', 'Art Gallery of NSW', 'The Rocks (bairro histórico)'], restaurants: { lunch: 'Bourke Street Bakery', dinner: 'Quay' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Fish Market', 'Tour gastronômico em Surry Hills', 'Bondi to Coogee (brunch)'], restaurants: { lunch: 'Bills (Surry Hills)', dinner: 'Ester' } },
    { title: 'Passeios', icon: '🚶', activities: ['Bondi Beach + Bondi to Coogee Walk', 'Harbour Bridge (caminhada)', 'Ferry para Manly Beach'], restaurants: { lunch: 'Icebergs (Bondi)', dinner: 'Bennelong' } },
    { title: 'Aventura', icon: '⭐', activities: ['Blue Mountains', 'Taronga Zoo (ferry)', 'Snorkeling em Gordons Bay'], restaurants: { lunch: 'Café em Katoomba', dinner: 'Firedoor' } },
  ],
  'telaviv': [
    { title: 'Cultura', icon: '🏛️', activities: ['Jaffa (cidade antiga)', 'Tel Aviv Museum of Art', 'Neve Tzedek (bairro)'], restaurants: { lunch: 'Abu Hassan (hummus)', dinner: 'OCD' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Carmel Market (Shuk HaCarmel)', 'Tour de street food em Jaffa', 'Levinsky Market'], restaurants: { lunch: 'HaKosem (falafel)', dinner: 'Mashya' } },
    { title: 'Passeios', icon: '🚶', activities: ['Rothschild Boulevard', 'Tayelet (calçadão praiano)', 'Florentin (street art)'], restaurants: { lunch: 'Dr. Shakshuka (Jaffa)', dinner: 'Taizu' } },
    { title: 'Aventura', icon: '⭐', activities: ['Bate-volta Jerusalém', 'Muro das Lamentações', 'Mar Morto (flutuação)'], restaurants: { lunch: 'Machneyuda (Jerusalém)', dinner: 'North Abraxas' } },
  ],
  'toronto': [
    { title: 'Cultura', icon: '🏛️', activities: ['CN Tower', 'Royal Ontario Museum', 'Art Gallery of Ontario'], restaurants: { lunch: 'St. Lawrence Market', dinner: 'Canoe' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Kensington Market', 'Tour de poutine', 'Distillery District (cafés)'], restaurants: { lunch: 'Pai Northern Thai', dinner: 'Alo (Michelin)' } },
    { title: 'Passeios', icon: '🚶', activities: ['Harbourfront + Toronto Islands (ferry)', 'Graffiti Alley', 'Queen Street West'], restaurants: { lunch: 'Rasta Pasta', dinner: 'Richmond Station' } },
    { title: 'Aventura', icon: '⭐', activities: ['Niagara Falls (dia)', 'Niagara-on-the-Lake (vinícolas)', 'EdgeWalk na CN Tower'], restaurants: { lunch: 'Restaurante em Niagara', dinner: 'Byblos' } },
  ],
  'vancouver': [
    { title: 'Cultura', icon: '🏛️', activities: ['Museum of Anthropology (UBC)', 'Gastown (bairro histórico)', 'Vancouver Art Gallery'], restaurants: { lunch: 'Japadog', dinner: 'Hawksworth' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Granville Island Market', 'Chinatown (dim sum)', 'Robson Street (sushi)'], restaurants: { lunch: 'Go Fish (fish tacos)', dinner: 'Miku (sushi)' } },
    { title: 'Passeios', icon: '🚶', activities: ['Stanley Park (seawall)', 'Capilano Suspension Bridge', 'Granville Island'], restaurants: { lunch: 'Café em Granville Island', dinner: 'Blue Water Café' } },
    { title: 'Aventura', icon: '⭐', activities: ['Grouse Mountain', 'Whistler (bate-volta)', 'Sea-to-Sky Gondola'], restaurants: { lunch: 'Splitz Grill (Whistler)', dinner: 'Botanist' } },
  ],
  'veneza': [
    { title: 'Cultura', icon: '🏛️', activities: ['Basílica de San Marco + Piazza', 'Palazzo Ducale', 'Gallerie dell\'Accademia'], restaurants: { lunch: 'Osteria Al Squero', dinner: 'Osteria alle Testiere' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Mercato di Rialto', 'Tour de cicheti (tapas venezianas)', 'Bacari em Cannaregio'], restaurants: { lunch: 'All\'Arco', dinner: 'Antiche Carampane' } },
    { title: 'Passeios', icon: '🚶', activities: ['Ponte di Rialto', 'Dorsoduro (Peggy Guggenheim)', 'Gôndola pelo Grand Canal'], restaurants: { lunch: 'Trattoria da Romano (Burano)', dinner: 'Trattoria da Fiore' } },
    { title: 'Aventura', icon: '⭐', activities: ['Murano (fábricas de vidro)', 'Burano (casas coloridas)', 'Torcello (ilha histórica)'], restaurants: { lunch: 'Ristorante ai Cacciatori (Torcello)', dinner: 'Do Forni' } },
  ],
  'viena': [
    { title: 'Cultura', icon: '🏛️', activities: ['Palácio de Schönbrunn', 'Museu de História da Arte', 'Ópera Estatal de Viena'], restaurants: { lunch: 'Figlmüller (schnitzel)', dinner: 'Steirereck' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Naschmarkt', 'Sachertorte no Hotel Sacher', 'Café Vienense (Café Central)'], restaurants: { lunch: 'Café Central', dinner: 'Plachutta' } },
    { title: 'Passeios', icon: '🚶', activities: ['Ringstraße (circular de bonde)', 'Prater + roda-gigante', 'Hundertwasserhaus'], restaurants: { lunch: 'Zum Schwarzen Kameel', dinner: 'MRAZ & Sohn' } },
    { title: 'Aventura', icon: '⭐', activities: ['Bate-volta Wachau Valley (vinho)', 'Abadia de Melk', 'Danúbio de bicicleta'], restaurants: { lunch: 'Heuriger em Grinzing', dinner: 'Konstantin Filippou' } },
  ],
  'xangai': [
    { title: 'Cultura', icon: '🏛️', activities: ['The Bund (Wai Tan)', 'Museu de Xangai', 'Jardim Yuyuan'], restaurants: { lunch: 'Nanxiang Steamed Bun Restaurant', dinner: 'Ultraviolet by Paul Pairet' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Xiaolongbao tour', 'French Concession food walk', 'Tianzifang (galerias + cafés)'], restaurants: { lunch: 'Jia Jia Tang Bao', dinner: 'Fu He Hui (vegetariano)' } },
    { title: 'Passeios', icon: '🚶', activities: ['French Concession (platanos)', 'Pudong (Shanghai Tower)', 'Zhujiajiao Water Town'], restaurants: { lunch: 'Lost Heaven (Yunnan)', dinner: 'Mr & Mrs Bund' } },
    { title: 'Aventura', icon: '⭐', activities: ['Bate-volta Suzhou (jardins UNESCO)', 'Hangzhou (Lago Oeste)', 'Trem-bala Maglev (430 km/h)'], restaurants: { lunch: 'Louwailou (Hangzhou)', dinner: 'Jean Georges Shanghai' } },
  ],
  'zurique': [
    { title: 'Cultura', icon: '🏛️', activities: ['Kunsthaus Zürich', 'Altstadt (cidade velha)', 'Fraumünster (vitrais de Chagall)'], restaurants: { lunch: 'Zeughauskeller', dinner: 'The Restaurant (Dolder Grand)' } },
    { title: 'Gastronomia', icon: '🍽️', activities: ['Confiserie Sprüngli (chocolates)', 'Viadukt (mercado + lojas)', 'Fondue em Oepfelchammer'], restaurants: { lunch: 'Hiltl (vegetariano mais antigo)', dinner: 'Kronenhalle' } },
    { title: 'Passeios', icon: '🚶', activities: ['Lago de Zurique (barco)', 'Lindenhof (mirante)', 'Bahnhofstrasse (compras)'], restaurants: { lunch: 'Café Schober', dinner: 'Haus Hiltl' } },
    { title: 'Aventura', icon: '⭐', activities: ['Bate-volta Lucerna (ponte de madeira)', 'Monte Pilatus (teleférico)', 'Jungfraujoch (topo da Europa)'], restaurants: { lunch: 'Restaurante em Lucerna', dinner: 'Pavyllon' } },
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
