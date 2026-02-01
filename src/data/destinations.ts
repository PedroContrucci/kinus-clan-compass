export interface Activity {
  time: string;
  name: string;
  description: string;
  duration: string;
  cost: number;
  type: 'food' | 'culture' | 'transport' | 'photo' | 'relax';
  clanTip?: string;
  clanAuthor?: string;
}

export interface DayItinerary {
  day: number;
  title: string;
  icon: string;
  activities: Activity[];
}

export interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  text: string;
  date: string;
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  emoji: string;
  heroImage: string;
  galleryImages: string[];
  rating: number;
  reviewCount: number;
  priceLevel: 1 | 2 | 3 | 4;
  avgBudget: number;
  duration: number;
  highlight: string;
  tags: string[];
  itinerary: DayItinerary[];
  reviews: Review[];
}

export const destinations: Destination[] = [
  {
    id: 'paris',
    name: 'Paris',
    country: 'França',
    emoji: '🗼',
    heroImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200',
    galleryImages: [
      'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600',
      'https://images.unsplash.com/photo-1478391679764-b2d8b3cd1e94?w=600',
      'https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?w=600',
      'https://images.unsplash.com/photo-1509439581779-6298f75bf6e5?w=600',
      'https://images.unsplash.com/photo-1511739001486-6bfe10ce65f4?w=600',
      'https://images.unsplash.com/photo-1549144511-f099e773c147?w=600',
    ],
    rating: 4.8,
    reviewCount: 1247,
    priceLevel: 3,
    avgBudget: 8500,
    duration: 5,
    highlight: 'Torre Eiffel ao pôr do sol',
    tags: ['Romântico', 'Cultura'],
    itinerary: [
      {
        day: 1,
        title: 'Chegada e Le Marais',
        icon: '🏨',
        activities: [
          { time: '14:00', name: 'Check-in Hotel Le Marais', description: 'Acomodação no charmoso bairro histórico', duration: '1h', cost: 0, type: 'relax', clanTip: 'Peça quarto com vista para a praça', clanAuthor: 'MariaV' },
          { time: '16:00', name: 'Passeio pelo Le Marais', description: 'Ruelas medievais e lojas vintage', duration: '2h', cost: 0, type: 'culture' },
          { time: '19:00', name: 'Jantar no Breizh Café', description: 'Melhores crepes de Paris • €35', duration: '1h30', cost: 45, type: 'food', clanTip: 'Pede o completo de presunto!', clanAuthor: 'PedroL' },
        ],
      },
      {
        day: 2,
        title: 'Torre Eiffel e Trocadéro',
        icon: '🗼',
        activities: [
          { time: '09:00', name: 'Torre Eiffel', description: 'Subida ao topo da torre mais famosa do mundo', duration: '3h', cost: 28, type: 'culture' },
          { time: '13:00', name: 'Almoço no Café de l\'Homme', description: 'Vista incrível para a torre', duration: '1h30', cost: 55, type: 'food' },
          { time: '15:00', name: 'Jardins do Trocadéro', description: 'Melhor ponto para fotos da Eiffel', duration: '1h', cost: 0, type: 'photo', clanTip: 'Vá ao pôr do sol!', clanAuthor: 'JoãoP' },
          { time: '19:00', name: 'Cruzeiro pelo Sena', description: 'Ver Paris iluminada', duration: '2h', cost: 40, type: 'relax' },
        ],
      },
      {
        day: 3,
        title: 'Louvre e Champs-Élysées',
        icon: '🏛️',
        activities: [
          { time: '09:00', name: 'Museu do Louvre', description: 'Mona Lisa e obras primas', duration: '4h', cost: 17, type: 'culture', clanTip: 'Vá na quarta de manhã, menos fila!', clanAuthor: 'AnaS' },
          { time: '14:00', name: 'Jardins das Tulherias', description: 'Caminhada relaxante', duration: '1h', cost: 0, type: 'relax' },
          { time: '16:00', name: 'Champs-Élysées', description: 'Compras e passeio', duration: '3h', cost: 0, type: 'culture' },
          { time: '20:00', name: 'Arco do Triunfo', description: 'Vista noturna', duration: '1h', cost: 13, type: 'photo' },
        ],
      },
      {
        day: 4,
        title: 'Montmartre e Arte',
        icon: '🎨',
        activities: [
          { time: '10:00', name: 'Sacré-Cœur', description: 'Vista panorâmica de Paris', duration: '1h30', cost: 0, type: 'culture' },
          { time: '12:00', name: 'Place du Tertre', description: 'Artistas e cafés', duration: '2h', cost: 30, type: 'food' },
          { time: '15:00', name: 'Moulin Rouge', description: 'Foto icônica', duration: '30min', cost: 0, type: 'photo' },
          { time: '20:00', name: 'Show no Moulin Rouge', description: 'Espetáculo clássico', duration: '2h', cost: 120, type: 'culture' },
        ],
      },
      {
        day: 5,
        title: 'Versalhes',
        icon: '👑',
        activities: [
          { time: '09:00', name: 'Trem para Versalhes', description: 'RER C, 40 minutos', duration: '1h', cost: 7, type: 'transport' },
          { time: '10:00', name: 'Palácio de Versalhes', description: 'Dia inteiro no palácio real', duration: '4h', cost: 20, type: 'culture', clanTip: 'Compre ingresso online!', clanAuthor: 'TiagoM' },
          { time: '15:00', name: 'Jardins de Versalhes', description: 'Passeio pelos jardins majestosos', duration: '2h', cost: 0, type: 'relax' },
          { time: '18:00', name: 'Retorno a Paris', description: 'Jantar de despedida', duration: '2h', cost: 60, type: 'food' },
        ],
      },
    ],
    reviews: [
      { id: 'r1', author: 'Maria Valentina', avatar: 'https://i.pravatar.cc/100?img=1', rating: 5, text: 'Roteiro perfeito! Cada dica valeu ouro. A vista do Trocadéro ao pôr do sol foi inesquecível.', date: '2024-01' },
      { id: 'r2', author: 'Pedro Lopes', avatar: 'https://i.pravatar.cc/100?img=3', rating: 5, text: 'Segui o roteiro à risca. O Breizh Café é realmente incrível, o crepe completo é obrigatório!', date: '2024-01' },
      { id: 'r3', author: 'Ana Silva', avatar: 'https://i.pravatar.cc/100?img=5', rating: 4, text: 'Versalhes merecia um dia inteiro. De resto, impecável!', date: '2023-12' },
    ],
  },
  {
    id: 'tokyo',
    name: 'Tóquio',
    country: 'Japão',
    emoji: '🏯',
    heroImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200',
    galleryImages: [
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600',
      'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=600',
      'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600',
      'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600',
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600',
      'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=600',
    ],
    rating: 4.9,
    reviewCount: 2341,
    priceLevel: 4,
    avgBudget: 12000,
    duration: 7,
    highlight: 'Cruzamento de Shibuya à noite',
    tags: ['Aventura', 'Cultura', 'Gastronômico'],
    itinerary: [
      {
        day: 1,
        title: 'Chegada em Shibuya',
        icon: '🏙️',
        activities: [
          { time: '14:00', name: 'Check-in Hotel Shibuya', description: 'Coração de Tóquio', duration: '1h', cost: 0, type: 'relax' },
          { time: '18:00', name: 'Cruzamento de Shibuya', description: 'O mais famoso do mundo', duration: '1h', cost: 0, type: 'photo', clanTip: 'Vá ao Starbucks do prédio para foto de cima!', clanAuthor: 'LucasK' },
          { time: '20:00', name: 'Jantar Ramen Ichiran', description: 'O melhor ramen de Tóquio', duration: '1h', cost: 15, type: 'food', clanTip: 'Pede extra chashu e ovo!', clanAuthor: 'TiagoM' },
        ],
      },
      {
        day: 2,
        title: 'Templos de Asakusa',
        icon: '⛩️',
        activities: [
          { time: '08:00', name: 'Senso-ji Temple', description: 'Templo mais antigo de Tóquio', duration: '2h', cost: 0, type: 'culture' },
          { time: '11:00', name: 'Nakamise Shopping', description: 'Rua tradicional com souvenirs', duration: '1h30', cost: 20, type: 'culture' },
          { time: '14:00', name: 'Skytree', description: 'Vista de 450m de altura', duration: '2h', cost: 25, type: 'photo' },
          { time: '19:00', name: 'Izakaya tradicional', description: 'Jantar japonês autêntico', duration: '2h', cost: 40, type: 'food' },
        ],
      },
      {
        day: 3,
        title: 'Harajuku e Akihabara',
        icon: '🎮',
        activities: [
          { time: '10:00', name: 'Meiji Shrine', description: 'Santuário sereno', duration: '1h30', cost: 0, type: 'culture' },
          { time: '12:00', name: 'Takeshita Street', description: 'Moda kawaii', duration: '2h', cost: 30, type: 'culture' },
          { time: '15:00', name: 'Akihabara', description: 'Paraíso geek', duration: '3h', cost: 50, type: 'culture' },
          { time: '19:00', name: 'Robot Restaurant', description: 'Show único', duration: '2h', cost: 80, type: 'culture' },
        ],
      },
      {
        day: 4,
        title: 'Monte Fuji',
        icon: '🗻',
        activities: [
          { time: '07:00', name: 'Trem para Kawaguchiko', description: 'Vista do Fuji', duration: '2h', cost: 30, type: 'transport' },
          { time: '10:00', name: 'Lago Kawaguchi', description: 'Reflexo do monte', duration: '3h', cost: 0, type: 'photo', clanTip: 'Alugue uma bicicleta!', clanAuthor: 'JuliaR' },
          { time: '14:00', name: 'Chureito Pagoda', description: 'A foto clássica', duration: '2h', cost: 0, type: 'photo' },
          { time: '18:00', name: 'Retorno a Tóquio', description: 'Jantar em Shinjuku', duration: '3h', cost: 35, type: 'food' },
        ],
      },
      {
        day: 5,
        title: 'Tsukiji e Ginza',
        icon: '🍣',
        activities: [
          { time: '06:00', name: 'Mercado Tsukiji', description: 'Sushi fresco no café', duration: '2h', cost: 40, type: 'food', clanTip: 'Acorde cedo, vale cada minuto!', clanAuthor: 'MarcoA' },
          { time: '10:00', name: 'Jardins do Palácio Imperial', description: 'Paz no centro', duration: '2h', cost: 0, type: 'relax' },
          { time: '14:00', name: 'Ginza Shopping', description: 'Lojas de luxo', duration: '3h', cost: 0, type: 'culture' },
          { time: '19:00', name: 'Jantar Omakase', description: 'Chef\'s choice sushi', duration: '2h', cost: 150, type: 'food' },
        ],
      },
      {
        day: 6,
        title: 'Odaiba e TeamLab',
        icon: '🎨',
        activities: [
          { time: '10:00', name: 'Odaiba', description: 'Ilha futurista', duration: '2h', cost: 0, type: 'culture' },
          { time: '13:00', name: 'TeamLab Borderless', description: 'Arte digital imersiva', duration: '3h', cost: 35, type: 'culture', clanTip: 'Use roupas claras para as fotos!', clanAuthor: 'CamilaF' },
          { time: '17:00', name: 'Gundam Statue', description: 'Para os fãs de anime', duration: '1h', cost: 0, type: 'photo' },
          { time: '19:00', name: 'Jantar com vista', description: 'Rainbow Bridge iluminada', duration: '2h', cost: 60, type: 'food' },
        ],
      },
      {
        day: 7,
        title: 'Dia Livre e Partida',
        icon: '✈️',
        activities: [
          { time: '09:00', name: 'Compras em Shinjuku', description: 'Últimas lembranças', duration: '3h', cost: 100, type: 'culture' },
          { time: '13:00', name: 'Último almoço', description: 'Ramen de despedida', duration: '1h', cost: 20, type: 'food' },
          { time: '15:00', name: 'Traslado Narita', description: 'Volta para casa', duration: '2h', cost: 35, type: 'transport' },
        ],
      },
    ],
    reviews: [
      { id: 'r1', author: 'Lucas Kimura', avatar: 'https://i.pravatar.cc/100?img=8', rating: 5, text: 'Melhor viagem da minha vida! O roteiro cobriu tudo que eu sonhava ver no Japão.', date: '2024-01' },
      { id: 'r2', author: 'Camila Ferreira', avatar: 'https://i.pravatar.cc/100?img=9', rating: 5, text: 'TeamLab foi surreal. A dica de usar roupa clara fez toda diferença nas fotos!', date: '2024-01' },
      { id: 'r3', author: 'Marco Azevedo', avatar: 'https://i.pravatar.cc/100?img=11', rating: 5, text: 'Acordar às 6h pro Tsukiji valeu demais. Sushi mais fresco que já comi.', date: '2023-12' },
    ],
  },
  {
    id: 'lisboa',
    name: 'Lisboa',
    country: 'Portugal',
    emoji: '🚃',
    heroImage: 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200',
    galleryImages: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
      'https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?w=600',
      'https://images.unsplash.com/photo-1580323956656-26bbb7206499?w=600',
      'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600',
      'https://images.unsplash.com/photo-1513735492182-2d3c52ac1ace?w=600',
      'https://images.unsplash.com/photo-1569959220744-ff553533f492?w=600',
    ],
    rating: 4.7,
    reviewCount: 892,
    priceLevel: 2,
    avgBudget: 5500,
    duration: 4,
    highlight: 'Pôr do sol no Miradouro',
    tags: ['Econômico', 'Cultura', 'Gastronômico'],
    itinerary: [
      {
        day: 1,
        title: 'Alfama Histórica',
        icon: '🏘️',
        activities: [
          { time: '10:00', name: 'Elétrico 28', description: 'Passeio tradicional pelos bairros', duration: '1h', cost: 3, type: 'transport', clanTip: 'Pegue logo cedo pra evitar multidão!', clanAuthor: 'AnaS' },
          { time: '12:00', name: 'Miradouro da Senhora do Monte', description: 'Melhor vista de Lisboa', duration: '1h', cost: 0, type: 'photo' },
          { time: '14:00', name: 'Almoço na Alfama', description: 'Sardinhas grelhadas', duration: '1h30', cost: 20, type: 'food' },
          { time: '20:00', name: 'Casa de Fado', description: 'Jantar com música tradicional', duration: '2h', cost: 40, type: 'food', clanTip: 'Reserve com antecedência no A Baíuca!', clanAuthor: 'RicardoP' },
        ],
      },
      {
        day: 2,
        title: 'Belém Monumental',
        icon: '🏛️',
        activities: [
          { time: '09:00', name: 'Torre de Belém', description: 'Monumento icônico à beira-rio', duration: '1h', cost: 8, type: 'culture' },
          { time: '10:30', name: 'Mosteiro dos Jerónimos', description: 'Arquitetura Manuelina', duration: '1h30', cost: 10, type: 'culture' },
          { time: '12:30', name: 'Pastéis de Belém', description: 'Os originais desde 1837!', duration: '1h', cost: 5, type: 'food', clanTip: 'Pede com canela extra!', clanAuthor: 'JoanaM' },
          { time: '15:00', name: 'MAAT', description: 'Museu de arte moderna', duration: '2h', cost: 9, type: 'culture' },
          { time: '19:00', name: 'Docas', description: 'Jantar à beira-rio', duration: '2h', cost: 35, type: 'food' },
        ],
      },
      {
        day: 3,
        title: 'Sintra Mágica',
        icon: '🏰',
        activities: [
          { time: '08:00', name: 'Trem para Sintra', description: '40 minutos de viagem', duration: '1h', cost: 5, type: 'transport' },
          { time: '10:00', name: 'Palácio da Pena', description: 'Castelo de contos de fadas', duration: '2h', cost: 14, type: 'culture', clanTip: 'Compre ingresso online com horário!', clanAuthor: 'BrunoT' },
          { time: '13:00', name: 'Almoço em Sintra', description: 'Travesseiros de Sintra', duration: '1h', cost: 15, type: 'food' },
          { time: '15:00', name: 'Quinta da Regaleira', description: 'Poço Iniciático misterioso', duration: '2h', cost: 10, type: 'culture' },
          { time: '18:00', name: 'Retorno a Lisboa', description: 'Jantar no Bairro Alto', duration: '3h', cost: 30, type: 'food' },
        ],
      },
      {
        day: 4,
        title: 'Baixa e Despedida',
        icon: '🛒',
        activities: [
          { time: '10:00', name: 'Elevador de Santa Justa', description: 'Vista do centro', duration: '30min', cost: 5, type: 'photo' },
          { time: '11:00', name: 'Praça do Comércio', description: 'Coração de Lisboa', duration: '1h', cost: 0, type: 'culture' },
          { time: '13:00', name: 'Time Out Market', description: 'Melhor food hall', duration: '2h', cost: 25, type: 'food', clanTip: 'Prova a francesinha!', clanAuthor: 'CarlaV' },
          { time: '16:00', name: 'LX Factory', description: 'Área criativa, lojas e arte', duration: '2h', cost: 0, type: 'culture' },
        ],
      },
    ],
    reviews: [
      { id: 'r1', author: 'Ana Santos', avatar: 'https://i.pravatar.cc/100?img=16', rating: 5, text: 'Lisboa é amor! Os pastéis de Belém com canela extra foram o highlight.', date: '2024-01' },
      { id: 'r2', author: 'Ricardo Pereira', avatar: 'https://i.pravatar.cc/100?img=12', rating: 4, text: 'Sintra sozinha merecia dois dias. Mas o roteiro foi excelente!', date: '2023-12' },
      { id: 'r3', author: 'Joana Mendes', avatar: 'https://i.pravatar.cc/100?img=20', rating: 5, text: 'O fado na A Baíuca foi emocionante. Obrigada pela dica!', date: '2023-12' },
    ],
  },
  {
    id: 'barcelona',
    name: 'Barcelona',
    country: 'Espanha',
    emoji: '🏖️',
    heroImage: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200',
    galleryImages: [
      'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600',
      'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=600',
      'https://images.unsplash.com/photo-1562883676-8c7feb83f09b?w=600',
      'https://images.unsplash.com/photo-1511527661048-7fe73d85e9a4?w=600',
      'https://images.unsplash.com/photo-1579282240050-352db0a14c21?w=600',
      'https://images.unsplash.com/photo-1464790719320-516ecd75af6c?w=600',
    ],
    rating: 4.6,
    reviewCount: 1567,
    priceLevel: 2,
    avgBudget: 6800,
    duration: 5,
    highlight: 'Sagrada Família ao amanhecer',
    tags: ['Praia', 'Cultura', 'Família'],
    itinerary: [
      {
        day: 1,
        title: 'Gaudí Essencial',
        icon: '🏗️',
        activities: [
          { time: '09:00', name: 'Sagrada Família', description: 'Obra-prima de Gaudí em construção', duration: '2h', cost: 26, type: 'culture', clanTip: 'Reserve o horário mais cedo possível!', clanAuthor: 'MiguelC' },
          { time: '12:00', name: 'Hospital Sant Pau', description: 'Outro Gaudí incrível', duration: '1h', cost: 15, type: 'culture' },
          { time: '14:00', name: 'Park Güell', description: 'Mosaicos coloridos', duration: '2h', cost: 10, type: 'culture' },
          { time: '19:00', name: 'Jantar em Gràcia', description: 'Tapas no bairro boêmio', duration: '2h', cost: 35, type: 'food' },
        ],
      },
      {
        day: 2,
        title: 'Bairro Gótico',
        icon: '⛪',
        activities: [
          { time: '10:00', name: 'Catedral de Barcelona', description: 'Gótica imponente', duration: '1h', cost: 9, type: 'culture' },
          { time: '12:00', name: 'La Rambla', description: 'O passeio clássico', duration: '1h30', cost: 0, type: 'culture' },
          { time: '14:00', name: 'La Boqueria', description: 'Mercado mais famoso', duration: '1h30', cost: 20, type: 'food', clanTip: 'Prova o suco de frutas fresquíssimo!', clanAuthor: 'LauraG' },
          { time: '17:00', name: 'Museu Picasso', description: 'Obras da juventude', duration: '2h', cost: 12, type: 'culture' },
          { time: '20:00', name: 'El Born', description: 'Jantar e drinks', duration: '3h', cost: 40, type: 'food' },
        ],
      },
      {
        day: 3,
        title: 'Praia e Montjuïc',
        icon: '🏖️',
        activities: [
          { time: '09:00', name: 'Barceloneta', description: 'Praia urbana', duration: '3h', cost: 0, type: 'relax' },
          { time: '13:00', name: 'Paella à beira-mar', description: 'Almoço tradicional', duration: '1h30', cost: 25, type: 'food' },
          { time: '15:00', name: 'Teleférico de Montjuïc', description: 'Vista aérea', duration: '30min', cost: 13, type: 'transport' },
          { time: '16:00', name: 'Fundació Joan Miró', description: 'Arte moderna catalã', duration: '2h', cost: 14, type: 'culture' },
          { time: '20:00', name: 'Flamenco show', description: 'Tablao tradicional', duration: '2h', cost: 45, type: 'culture' },
        ],
      },
      {
        day: 4,
        title: 'Camp Nou e Tibidabo',
        icon: '⚽',
        activities: [
          { time: '10:00', name: 'Camp Nou Tour', description: 'Estádio do Barça', duration: '2h', cost: 28, type: 'culture' },
          { time: '13:00', name: 'Almoço em Les Corts', description: 'Cozinha catalã', duration: '1h30', cost: 25, type: 'food' },
          { time: '16:00', name: 'Tibidabo', description: 'Parque com vista', duration: '3h', cost: 35, type: 'relax', clanTip: 'Vá no fim da tarde pro sunset!', clanAuthor: 'DavidR' },
          { time: '20:00', name: 'Jantar em Sarrià', description: 'Bairro charmoso', duration: '2h', cost: 40, type: 'food' },
        ],
      },
      {
        day: 5,
        title: 'Costa Brava',
        icon: '🌊',
        activities: [
          { time: '08:00', name: 'Trem para Tossa de Mar', description: 'Cidade medieval costeira', duration: '2h', cost: 15, type: 'transport' },
          { time: '11:00', name: 'Praia e cidade antiga', description: 'Muralhas e mar azul', duration: '4h', cost: 0, type: 'relax' },
          { time: '14:00', name: 'Almoço frutos do mar', description: 'Fresh from the sea', duration: '2h', cost: 40, type: 'food' },
          { time: '17:00', name: 'Retorno a Barcelona', description: 'Despedida', duration: '2h', cost: 15, type: 'transport' },
        ],
      },
    ],
    reviews: [
      { id: 'r1', author: 'Miguel Costa', avatar: 'https://i.pravatar.cc/100?img=15', rating: 5, text: 'Sagrada Família ao amanhecer foi espiritual. Obrigado pela dica do horário!', date: '2024-01' },
      { id: 'r2', author: 'Laura Garcia', avatar: 'https://i.pravatar.cc/100?img=23', rating: 4, text: 'La Boqueria é imperdível. O suco de frutas é realmente o melhor!', date: '2023-12' },
      { id: 'r3', author: 'David Rodrigues', avatar: 'https://i.pravatar.cc/100?img=33', rating: 5, text: 'Tibidabo ao pôr do sol foi mágico. Vista 360° de toda Barcelona!', date: '2023-11' },
    ],
  },
  {
    id: 'roma',
    name: 'Roma',
    country: 'Itália',
    emoji: '🏛️',
    heroImage: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200',
    galleryImages: [
      'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=600',
      'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=600',
      'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=600',
      'https://images.unsplash.com/photo-1569154003281-41a30d3d618c?w=600',
      'https://images.unsplash.com/photo-1548013146-72479768bada?w=600',
      'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=600',
    ],
    rating: 4.8,
    reviewCount: 1823,
    priceLevel: 2,
    avgBudget: 6200,
    duration: 4,
    highlight: 'Coliseu ao entardecer',
    tags: ['Cultura', 'Romântico', 'Gastronômico'],
    itinerary: [
      {
        day: 1,
        title: 'Roma Antiga',
        icon: '🏛️',
        activities: [
          { time: '09:00', name: 'Coliseu', description: 'Anfiteatro icônico do Império', duration: '2h', cost: 16, type: 'culture', clanTip: 'Compre ingresso combo com Fórum!', clanAuthor: 'GiuliaB' },
          { time: '12:00', name: 'Fórum Romano', description: 'Centro da Roma Antiga', duration: '2h', cost: 0, type: 'culture' },
          { time: '15:00', name: 'Palatino', description: 'Colina dos imperadores', duration: '1h30', cost: 0, type: 'culture' },
          { time: '20:00', name: 'Jantar em Trastevere', description: 'Bairro mais charmoso', duration: '2h', cost: 35, type: 'food', clanTip: 'Prova a carbonara na Da Enzo!', clanAuthor: 'PedroL' },
        ],
      },
      {
        day: 2,
        title: 'Vaticano',
        icon: '⛪',
        activities: [
          { time: '08:00', name: 'Museus do Vaticano', description: 'Antes das multidões', duration: '3h', cost: 17, type: 'culture', clanTip: 'Reserve o primeiro horário online!', clanAuthor: 'FernandaM' },
          { time: '12:00', name: 'Capela Sistina', description: 'Michelangelo no teto', duration: '1h', cost: 0, type: 'culture' },
          { time: '14:00', name: 'Basílica de São Pedro', description: 'Maior igreja do mundo', duration: '2h', cost: 0, type: 'culture' },
          { time: '17:00', name: 'Castel Sant\'Angelo', description: 'Vista do rio Tibre', duration: '1h30', cost: 15, type: 'culture' },
          { time: '20:00', name: 'Jantar no Borgo', description: 'Perto do Vaticano', duration: '2h', cost: 40, type: 'food' },
        ],
      },
      {
        day: 3,
        title: 'Fontes e Praças',
        icon: '⛲',
        activities: [
          { time: '09:00', name: 'Fontana di Trevi', description: 'Jogue a moeda!', duration: '1h', cost: 0, type: 'photo', clanTip: 'Vá às 7h pra foto sem ninguém!', clanAuthor: 'RenatoS' },
          { time: '11:00', name: 'Panteão', description: '2000 anos de arquitetura', duration: '1h', cost: 5, type: 'culture' },
          { time: '13:00', name: 'Almoço na Piazza Navona', description: 'Praça barroca', duration: '1h30', cost: 30, type: 'food' },
          { time: '15:00', name: 'Escadaria da Piazza di Spagna', description: 'Ponto de encontro', duration: '1h', cost: 0, type: 'photo' },
          { time: '17:00', name: 'Villa Borghese', description: 'Parque e galeria', duration: '2h', cost: 13, type: 'culture' },
          { time: '20:00', name: 'Jantar em Campo de\' Fiori', description: 'Mercado noturno', duration: '2h', cost: 35, type: 'food' },
        ],
      },
      {
        day: 4,
        title: 'Além de Roma',
        icon: '🌄',
        activities: [
          { time: '09:00', name: 'Tivoli - Villa d\'Este', description: 'Jardins renascentistas', duration: '3h', cost: 10, type: 'culture' },
          { time: '13:00', name: 'Almoço em Tivoli', description: 'Cozinha regional', duration: '1h30', cost: 25, type: 'food' },
          { time: '16:00', name: 'Retorno a Roma', description: 'Últimas compras', duration: '2h', cost: 0, type: 'culture' },
          { time: '19:00', name: 'Aperitivo ao pôr do sol', description: 'Rooftop bar', duration: '2h', cost: 30, type: 'food', clanTip: 'Aroma Rooftop tem a melhor vista!', clanAuthor: 'ClaraV' },
        ],
      },
    ],
    reviews: [
      { id: 'r1', author: 'Giulia Bianchi', avatar: 'https://i.pravatar.cc/100?img=25', rating: 5, text: 'A carbonara na Da Enzo foi a melhor da minha vida. Roma é mágica!', date: '2024-01' },
      { id: 'r2', author: 'Renato Silva', avatar: 'https://i.pravatar.cc/100?img=14', rating: 5, text: 'Fui às 7h na Fontana di Trevi. Só eu e a fonte. Valeu demais!', date: '2023-12' },
      { id: 'r3', author: 'Clara Vieira', avatar: 'https://i.pravatar.cc/100?img=26', rating: 4, text: 'Aroma Rooftop tem vista do Panteão. Sunset perfeito!', date: '2023-11' },
    ],
  },
  {
    id: 'bali',
    name: 'Bali',
    country: 'Indonésia',
    emoji: '🌴',
    heroImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200',
    galleryImages: [
      'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=600',
      'https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?w=600',
      'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=600',
      'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=600',
      'https://images.unsplash.com/photo-1570789210967-2cac24afeb00?w=600',
      'https://images.unsplash.com/photo-1573790387438-4da905039392?w=600',
    ],
    rating: 4.9,
    reviewCount: 2156,
    priceLevel: 2,
    avgBudget: 7500,
    duration: 7,
    highlight: 'Terraços de arroz ao nascer do sol',
    tags: ['Aventura', 'Praia', 'Romântico'],
    itinerary: [
      {
        day: 1,
        title: 'Chegada em Ubud',
        icon: '🌿',
        activities: [
          { time: '14:00', name: 'Check-in Villa em Ubud', description: 'Vista para o arrozal', duration: '1h', cost: 0, type: 'relax', clanTip: 'Peça villa com piscina privativa!', clanAuthor: 'BeatrizN' },
          { time: '16:00', name: 'Monkey Forest', description: 'Santuário dos macacos', duration: '2h', cost: 5, type: 'culture' },
          { time: '19:00', name: 'Jantar orgânico', description: 'Locavore - estrela Michelin', duration: '2h', cost: 50, type: 'food' },
        ],
      },
      {
        day: 2,
        title: 'Terraços de Tegallalang',
        icon: '🌾',
        activities: [
          { time: '06:00', name: 'Nascer do sol em Tegallalang', description: 'Os famosos terraços de arroz', duration: '2h', cost: 3, type: 'photo', clanTip: 'Chegue antes das 7h!', clanAuthor: 'FelipeM' },
          { time: '10:00', name: 'Tirta Empul', description: 'Templo de purificação', duration: '2h', cost: 5, type: 'culture' },
          { time: '14:00', name: 'Gunung Kawi', description: 'Templos esculpidos na pedra', duration: '2h', cost: 5, type: 'culture' },
          { time: '18:00', name: 'Massagem balinesa', description: 'Spa tradicional', duration: '2h', cost: 30, type: 'relax' },
        ],
      },
      {
        day: 3,
        title: 'Monte Batur',
        icon: '🌋',
        activities: [
          { time: '02:00', name: 'Trekking Monte Batur', description: 'Nascer do sol no vulcão', duration: '6h', cost: 50, type: 'culture', clanTip: 'Leve jaqueta, faz frio lá em cima!', clanAuthor: 'ThiagoR' },
          { time: '11:00', name: 'Hot springs', description: 'Fontes termais naturais', duration: '2h', cost: 15, type: 'relax' },
          { time: '15:00', name: 'Descanso na villa', description: 'Recuperar energias', duration: '3h', cost: 0, type: 'relax' },
          { time: '19:00', name: 'Jantar em Ubud', description: 'Cozinha balinesa', duration: '2h', cost: 25, type: 'food' },
        ],
      },
      {
        day: 4,
        title: 'Seminyak Praias',
        icon: '🏖️',
        activities: [
          { time: '09:00', name: 'Transfer para Seminyak', description: '1h30 de carro', duration: '2h', cost: 25, type: 'transport' },
          { time: '12:00', name: 'Beach club', description: 'Potato Head', duration: '4h', cost: 40, type: 'relax', clanTip: 'Reserve daybed com antecedência!', clanAuthor: 'JulianaC' },
          { time: '17:00', name: 'Sunset em Seminyak', description: 'Praia ao entardecer', duration: '2h', cost: 0, type: 'photo' },
          { time: '20:00', name: 'Jantar La Lucciola', description: 'Pés na areia', duration: '2h', cost: 60, type: 'food' },
        ],
      },
      {
        day: 5,
        title: 'Uluwatu',
        icon: '🏄',
        activities: [
          { time: '09:00', name: 'Surf em Uluwatu', description: 'Ondas lendárias', duration: '3h', cost: 40, type: 'relax' },
          { time: '13:00', name: 'Almoço em Single Fin', description: 'Vista das ondas', duration: '2h', cost: 25, type: 'food' },
          { time: '16:00', name: 'Templo de Uluwatu', description: 'Penhasco dramático', duration: '2h', cost: 5, type: 'culture' },
          { time: '18:00', name: 'Kecak Fire Dance', description: 'Dança tradicional ao pôr do sol', duration: '1h', cost: 15, type: 'culture', clanTip: 'Sente na frente pra sentir o calor!', clanAuthor: 'MarceloA' },
        ],
      },
      {
        day: 6,
        title: 'Nusa Penida',
        icon: '🏝️',
        activities: [
          { time: '07:00', name: 'Ferry para Nusa Penida', description: '45 minutos de barco', duration: '1h', cost: 25, type: 'transport' },
          { time: '09:00', name: 'Kelingking Beach', description: 'O T-Rex de Bali', duration: '2h', cost: 0, type: 'photo', clanTip: 'Desce até embaixo se tiver coragem!', clanAuthor: 'RafaelG' },
          { time: '12:00', name: 'Angel\'s Billabong', description: 'Piscina natural', duration: '1h30', cost: 0, type: 'relax' },
          { time: '14:00', name: 'Broken Beach', description: 'Arco natural incrível', duration: '1h', cost: 0, type: 'photo' },
          { time: '17:00', name: 'Retorno a Bali', description: 'Jantar em Sanur', duration: '3h', cost: 30, type: 'food' },
        ],
      },
      {
        day: 7,
        title: 'Dia Livre e Partida',
        icon: '✈️',
        activities: [
          { time: '09:00', name: 'Última massagem', description: 'Spa de despedida', duration: '2h', cost: 40, type: 'relax' },
          { time: '12:00', name: 'Almoço em Canggu', description: 'Café hipster', duration: '2h', cost: 20, type: 'food' },
          { time: '15:00', name: 'Transfer aeroporto', description: 'Até a próxima, Bali!', duration: '1h', cost: 20, type: 'transport' },
        ],
      },
    ],
    reviews: [
      { id: 'r1', author: 'Beatriz Nunes', avatar: 'https://i.pravatar.cc/100?img=29', rating: 5, text: 'A villa com piscina privativa em Ubud foi um sonho! Acordar com vista pros arrozais...', date: '2024-01' },
      { id: 'r2', author: 'Felipe Martins', avatar: 'https://i.pravatar.cc/100?img=32', rating: 5, text: 'Chegamos às 6h em Tegallalang. Só nós e a névoa da manhã. Mágico!', date: '2024-01' },
      { id: 'r3', author: 'Rafael Gomes', avatar: 'https://i.pravatar.cc/100?img=18', rating: 5, text: 'Desci até Kelingking Beach. Difícil, mas valeu cada gota de suor!', date: '2023-12' },
    ],
  },
  {
    id: 'nova-york',
    name: 'Nova York',
    country: 'EUA',
    emoji: '🗽',
    heroImage: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200',
    galleryImages: [
      'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600',
      'https://images.unsplash.com/photo-1522083165195-3424ed129620?w=600',
      'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=600',
      'https://images.unsplash.com/photo-1555109307-f7d9da25c244?w=600',
      'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=600',
      'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=600',
    ],
    rating: 4.7,
    reviewCount: 3241,
    priceLevel: 4,
    avgBudget: 15000,
    duration: 6,
    highlight: 'Skyline do Top of the Rock',
    tags: ['Cultura', 'Gastronômico', 'Família'],
    itinerary: [
      {
        day: 1,
        title: 'Chegada em Manhattan',
        icon: '🏙️',
        activities: [
          { time: '14:00', name: 'Check-in Times Square', description: 'Coração de NYC', duration: '1h', cost: 0, type: 'relax' },
          { time: '16:00', name: 'Times Square', description: 'Luzes e energia', duration: '1h30', cost: 0, type: 'photo' },
          { time: '18:00', name: 'Broadway Show', description: 'Musical clássico', duration: '3h', cost: 150, type: 'culture', clanTip: 'Compra na TKTS com desconto!', clanAuthor: 'CarolineM' },
          { time: '22:00', name: 'Pizza em Joe\'s', description: 'A melhor fatia de NY', duration: '1h', cost: 10, type: 'food' },
        ],
      },
      {
        day: 2,
        title: 'Downtown Manhattan',
        icon: '🗽',
        activities: [
          { time: '08:00', name: 'Ferry para Estátua da Liberdade', description: 'Ícone americano', duration: '4h', cost: 24, type: 'culture' },
          { time: '13:00', name: '9/11 Memorial', description: 'Tributo emocionante', duration: '2h', cost: 26, type: 'culture' },
          { time: '16:00', name: 'Wall Street', description: 'Centro financeiro', duration: '1h', cost: 0, type: 'culture' },
          { time: '18:00', name: 'Brooklyn Bridge ao pôr do sol', description: 'Caminhada icônica', duration: '1h30', cost: 0, type: 'photo', clanTip: 'Vá do lado de Manhattan pro Brooklyn!', clanAuthor: 'BrunoC' },
          { time: '20:00', name: 'Jantar em DUMBO', description: 'Vista do skyline', duration: '2h', cost: 60, type: 'food' },
        ],
      },
      {
        day: 3,
        title: 'Midtown Icons',
        icon: '🏢',
        activities: [
          { time: '09:00', name: 'Empire State Building', description: 'Vista clássica', duration: '2h', cost: 44, type: 'photo' },
          { time: '12:00', name: 'Almoço em Koreatown', description: 'BBQ coreano', duration: '1h30', cost: 30, type: 'food' },
          { time: '14:00', name: 'MoMA', description: 'Arte moderna', duration: '3h', cost: 25, type: 'culture' },
          { time: '18:00', name: 'Top of the Rock', description: 'Melhor vista de NY', duration: '1h30', cost: 40, type: 'photo', clanTip: 'Vá ao pôr do sol, dá pra ver de dia e de noite!', clanAuthor: 'LuizaP' },
          { time: '20:00', name: 'Jantar Hell\'s Kitchen', description: 'Restaurantes incríveis', duration: '2h', cost: 50, type: 'food' },
        ],
      },
      {
        day: 4,
        title: 'Central Park e Museus',
        icon: '🌳',
        activities: [
          { time: '09:00', name: 'Central Park', description: 'Passeio de bike', duration: '3h', cost: 15, type: 'relax' },
          { time: '13:00', name: 'MET Museum', description: 'Maior museu dos EUA', duration: '4h', cost: 30, type: 'culture', clanTip: 'Foque na ala egípcia e impressionistas!', clanAuthor: 'PatriciaR' },
          { time: '18:00', name: 'Upper West Side', description: 'Bairro charmoso', duration: '2h', cost: 0, type: 'culture' },
          { time: '20:00', name: 'Jantar no Lincoln Center', description: 'Área cultural', duration: '2h', cost: 55, type: 'food' },
        ],
      },
      {
        day: 5,
        title: 'Brooklyn Hip',
        icon: '🎨',
        activities: [
          { time: '10:00', name: 'Williamsburg', description: 'Bairro hipster', duration: '3h', cost: 0, type: 'culture' },
          { time: '14:00', name: 'Smorgasburg', description: 'Food market épico', duration: '2h', cost: 40, type: 'food', clanTip: 'Vai no sábado! Mais opções!', clanAuthor: 'AndrewL' },
          { time: '17:00', name: 'Brooklyn Heights', description: 'Promenade com vista', duration: '1h30', cost: 0, type: 'photo' },
          { time: '19:00', name: 'Pizza em Lucali', description: 'A melhor de Brooklyn', duration: '2h', cost: 35, type: 'food' },
        ],
      },
      {
        day: 6,
        title: 'Últimas Compras',
        icon: '🛍️',
        activities: [
          { time: '10:00', name: 'SoHo Shopping', description: 'Lojas e galerias', duration: '3h', cost: 0, type: 'culture' },
          { time: '14:00', name: 'Chelsea Market', description: 'Almoço e compras', duration: '2h', cost: 35, type: 'food' },
          { time: '16:00', name: 'High Line', description: 'Parque elevado', duration: '1h30', cost: 0, type: 'relax' },
          { time: '18:00', name: 'Hudson Yards', description: 'Arquitetura moderna', duration: '1h', cost: 0, type: 'photo' },
        ],
      },
    ],
    reviews: [
      { id: 'r1', author: 'Caroline Mello', avatar: 'https://i.pravatar.cc/100?img=35', rating: 5, text: 'Broadway foi incrível! A dica do TKTS economizou uns $80!', date: '2024-01' },
      { id: 'r2', author: 'Luiza Pires', avatar: 'https://i.pravatar.cc/100?img=36', rating: 5, text: 'Top of the Rock ao pôr do sol foi o highlight. Melhor que Empire State!', date: '2024-01' },
      { id: 'r3', author: 'Andrew Lima', avatar: 'https://i.pravatar.cc/100?img=17', rating: 4, text: 'Smorgasburg no sábado é caótico mas vale cada minuto. Comida incrível!', date: '2023-12' },
    ],
  },
  {
    id: 'santorini',
    name: 'Santorini',
    country: 'Grécia',
    emoji: '🇬🇷',
    heroImage: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=1200',
    galleryImages: [
      'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600',
      'https://images.unsplash.com/photo-1602872030219-ad2b9a54315c?w=600',
      'https://images.unsplash.com/photo-1571406252241-db0280bd36cd?w=600',
      'https://images.unsplash.com/photo-1504512485720-7d83a16ee930?w=600',
      'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600',
      'https://images.unsplash.com/photo-1598738830581-b0afbb7faa25?w=600',
    ],
    rating: 4.9,
    reviewCount: 1876,
    priceLevel: 3,
    avgBudget: 9800,
    duration: 5,
    highlight: 'Pôr do sol em Oia',
    tags: ['Romântico', 'Praia', 'Aventura'],
    itinerary: [
      {
        day: 1,
        title: 'Chegada em Fira',
        icon: '🏨',
        activities: [
          { time: '14:00', name: 'Check-in hotel com caldera view', description: 'Vista para o vulcão', duration: '1h', cost: 0, type: 'relax', clanTip: 'Pague extra pela vista, vale demais!', clanAuthor: 'IsabelaC' },
          { time: '16:00', name: 'Explorar Fira', description: 'Ruelas brancas e lojas', duration: '2h', cost: 0, type: 'culture' },
          { time: '19:00', name: 'Jantar em Franco\'s', description: 'Vista do pôr do sol', duration: '2h', cost: 80, type: 'food' },
        ],
      },
      {
        day: 2,
        title: 'Oia Clássico',
        icon: '🌅',
        activities: [
          { time: '10:00', name: 'Caminhada Fira-Oia', description: '10km de vistas incríveis', duration: '3h', cost: 0, type: 'culture', clanTip: 'Comece cedo, leve água!', clanAuthor: 'DanielS' },
          { time: '14:00', name: 'Almoço em Oia', description: 'Frutos do mar frescos', duration: '2h', cost: 50, type: 'food' },
          { time: '17:00', name: 'Explorar Oia', description: 'As famosas cúpulas azuis', duration: '2h', cost: 0, type: 'photo' },
          { time: '19:30', name: 'Pôr do sol no castelo', description: 'O mais famoso do mundo', duration: '1h', cost: 0, type: 'photo', clanTip: 'Chegue 2h antes pra garantir lugar!', clanAuthor: 'FernandaL' },
        ],
      },
      {
        day: 3,
        title: 'Praias Vulcânicas',
        icon: '🏖️',
        activities: [
          { time: '10:00', name: 'Red Beach', description: 'Areia vermelha vulcânica', duration: '2h', cost: 0, type: 'relax' },
          { time: '13:00', name: 'Almoço em Akrotiri', description: 'Taverna local', duration: '1h30', cost: 25, type: 'food' },
          { time: '15:00', name: 'Sítio Arqueológico de Akrotiri', description: 'Pompeia grega', duration: '2h', cost: 12, type: 'culture' },
          { time: '18:00', name: 'White Beach de barco', description: 'Acessível só por mar', duration: '2h', cost: 20, type: 'relax' },
        ],
      },
      {
        day: 4,
        title: 'Vulcão e Vinhos',
        icon: '🌋',
        activities: [
          { time: '09:00', name: 'Boat tour ao vulcão', description: 'Caminhada na cratera', duration: '3h', cost: 40, type: 'culture' },
          { time: '13:00', name: 'Hot springs', description: 'Águas termais naturais', duration: '1h', cost: 0, type: 'relax' },
          { time: '16:00', name: 'Santo Wines', description: 'Degustação com vista', duration: '2h', cost: 30, type: 'food', clanTip: 'Prova o Vinsanto, é único!', clanAuthor: 'GabrielaP' },
          { time: '19:00', name: 'Jantar em Pyrgos', description: 'Vila medieval', duration: '2h', cost: 45, type: 'food' },
        ],
      },
      {
        day: 5,
        title: 'Último Dia no Paraíso',
        icon: '✨',
        activities: [
          { time: '09:00', name: 'Perissa Beach', description: 'Areia preta', duration: '3h', cost: 0, type: 'relax' },
          { time: '13:00', name: 'Almoço na praia', description: 'Taverna grega', duration: '1h30', cost: 30, type: 'food' },
          { time: '15:00', name: 'Ancient Thera', description: 'Ruínas no topo', duration: '2h', cost: 6, type: 'culture' },
          { time: '18:00', name: 'Último pôr do sol', description: 'Despedida de Santorini', duration: '1h30', cost: 0, type: 'photo' },
        ],
      },
    ],
    reviews: [
      { id: 'r1', author: 'Isabela Costa', avatar: 'https://i.pravatar.cc/100?img=38', rating: 5, text: 'A vista da caldera vale cada euro extra. Acordar com aquele azul...', date: '2024-01' },
      { id: 'r2', author: 'Fernanda Lima', avatar: 'https://i.pravatar.cc/100?img=39', rating: 5, text: 'Chegamos 2h antes pro sunset em Oia. Conseguimos lugar perfeito!', date: '2024-01' },
      { id: 'r3', author: 'Gabriela Pinto', avatar: 'https://i.pravatar.cc/100?img=41', rating: 5, text: 'Vinsanto na Santo Wines com aquela vista... sem palavras!', date: '2023-12' },
    ],
  },
  {
    id: 'amsterda',
    name: 'Amsterdã',
    country: 'Holanda',
    emoji: '🚲',
    heroImage: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1200',
    galleryImages: [
      'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=600',
      'https://images.unsplash.com/photo-1576924542622-772281b13aa8?w=600',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
      'https://images.unsplash.com/photo-1605101100278-5d1deb2b6498?w=600',
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600',
      'https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?w=600',
    ],
    rating: 4.6,
    reviewCount: 1432,
    priceLevel: 3,
    avgBudget: 7200,
    duration: 4,
    highlight: 'Canais de bike ao entardecer',
    tags: ['Cultura', 'Gastronômico', 'Aventura'],
    itinerary: [
      {
        day: 1,
        title: 'Centro Histórico',
        icon: '🏛️',
        activities: [
          { time: '10:00', name: 'Dam Square', description: 'Praça central', duration: '1h', cost: 0, type: 'culture' },
          { time: '12:00', name: 'Almoço em Jordaan', description: 'Bairro charmoso', duration: '1h30', cost: 25, type: 'food' },
          { time: '14:00', name: 'Casa de Anne Frank', description: 'História emocionante', duration: '2h', cost: 16, type: 'culture', clanTip: 'Reserve online com meses de antecedência!', clanAuthor: 'SofiaK' },
          { time: '17:00', name: 'Passeio de barco nos canais', description: 'A melhor forma de ver a cidade', duration: '1h30', cost: 18, type: 'relax' },
          { time: '20:00', name: 'Jantar indonésio', description: 'Rijsttafel tradicional', duration: '2h', cost: 40, type: 'food' },
        ],
      },
      {
        day: 2,
        title: 'Arte e Cultura',
        icon: '🎨',
        activities: [
          { time: '09:00', name: 'Rijksmuseum', description: 'A Ronda Noturna de Rembrandt', duration: '3h', cost: 22, type: 'culture' },
          { time: '13:00', name: 'Almoço no Museumplein', description: 'Food trucks', duration: '1h', cost: 15, type: 'food' },
          { time: '14:30', name: 'Van Gogh Museum', description: 'Maior coleção do mundo', duration: '2h30', cost: 22, type: 'culture', clanTip: 'Áudio guide vale muito a pena!', clanAuthor: 'PauloM' },
          { time: '18:00', name: 'Vondelpark', description: 'Parque mais famoso', duration: '1h30', cost: 0, type: 'relax' },
          { time: '20:00', name: 'De Pijp', description: 'Jantar no bairro hipster', duration: '2h', cost: 35, type: 'food' },
        ],
      },
      {
        day: 3,
        title: 'De Bike pela Cidade',
        icon: '🚲',
        activities: [
          { time: '09:00', name: 'Alugar bicicleta', description: 'A forma local de viver', duration: '30min', cost: 12, type: 'transport', clanTip: 'Mac Bike tem as melhores!', clanAuthor: 'LeonardoV' },
          { time: '10:00', name: 'NDSM Wharf', description: 'Área industrial cool', duration: '2h', cost: 0, type: 'culture' },
          { time: '13:00', name: 'Almoço em Noord', description: 'Pllek - container bar', duration: '1h30', cost: 20, type: 'food' },
          { time: '15:00', name: 'A\'DAM Lookout', description: 'Vista e balanço no topo', duration: '1h30', cost: 15, type: 'photo' },
          { time: '18:00', name: 'Bike pelos canais', description: 'Golden hour perfeita', duration: '2h', cost: 0, type: 'photo' },
          { time: '20:30', name: 'Red Light District', description: 'Jantar na área histórica', duration: '2h', cost: 30, type: 'food' },
        ],
      },
      {
        day: 4,
        title: 'Campos de Tulipas',
        icon: '🌷',
        activities: [
          { time: '08:00', name: 'Keukenhof', description: 'Maior jardim de flores do mundo', duration: '4h', cost: 20, type: 'culture', clanTip: 'Só funciona março-maio!', clanAuthor: 'MarianaN' },
          { time: '13:00', name: 'Almoço em Lisse', description: 'Cidade das tulipas', duration: '1h', cost: 20, type: 'food' },
          { time: '15:00', name: 'Zaanse Schans', description: 'Moinhos tradicionais', duration: '2h', cost: 10, type: 'culture' },
          { time: '18:00', name: 'Retorno a Amsterdam', description: 'Última noite', duration: '1h', cost: 0, type: 'transport' },
          { time: '19:30', name: 'Jantar de despedida', description: 'Brouwerij \'t IJ', duration: '2h', cost: 35, type: 'food' },
        ],
      },
    ],
    reviews: [
      { id: 'r1', author: 'Sofia Klein', avatar: 'https://i.pravatar.cc/100?img=42', rating: 5, text: 'Reserve Anne Frank com antecedência mesmo! Fila virtual abre 9h, 6 semanas antes.', date: '2024-01' },
      { id: 'r2', author: 'Leonardo Vieira', avatar: 'https://i.pravatar.cc/100?img=43', rating: 4, text: 'Amsterdam de bike é outra experiência. Cuidado com os trams!', date: '2023-12' },
      { id: 'r3', author: 'Mariana Neves', avatar: 'https://i.pravatar.cc/100?img=44', rating: 5, text: 'Keukenhof em abril foi surreal. 7 milhões de tulipas!', date: '2023-05' },
    ],
  },
  {
    id: 'marrakech',
    name: 'Marrakech',
    country: 'Marrocos',
    emoji: '🕌',
    heroImage: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=1200',
    galleryImages: [
      'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=600',
      'https://images.unsplash.com/photo-1517821099606-cef63a9bcda6?w=600',
      'https://images.unsplash.com/photo-1518965539400-77d851d65c43?w=600',
      'https://images.unsplash.com/photo-1545048702-79362596cdc9?w=600',
      'https://images.unsplash.com/photo-1544085311-11a028465b03?w=600',
      'https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=600',
    ],
    rating: 4.5,
    reviewCount: 987,
    priceLevel: 1,
    avgBudget: 4500,
    duration: 5,
    highlight: 'Jemaa el-Fnaa ao anoitecer',
    tags: ['Aventura', 'Cultura', 'Econômico'],
    itinerary: [
      {
        day: 1,
        title: 'Chegada na Medina',
        icon: '🏨',
        activities: [
          { time: '14:00', name: 'Check-in no Riad', description: 'Hotel tradicional marroquino', duration: '1h', cost: 0, type: 'relax', clanTip: 'Escolha riad com terraço!', clanAuthor: 'AlessandraB' },
          { time: '16:00', name: 'Explorar a Medina', description: 'Perder-se é a graça', duration: '2h', cost: 0, type: 'culture' },
          { time: '19:00', name: 'Jemaa el-Fnaa', description: 'A praça mais incrível do mundo', duration: '3h', cost: 15, type: 'culture', clanTip: 'Não perca os encantadores de cobra!', clanAuthor: 'MarcosT' },
        ],
      },
      {
        day: 2,
        title: 'Souks e Palácios',
        icon: '🛒',
        activities: [
          { time: '09:00', name: 'Souks de Marrakech', description: 'Labirinto de compras', duration: '3h', cost: 50, type: 'culture', clanTip: 'Pechinche sempre! Comece com 1/3 do preço!', clanAuthor: 'JulioC' },
          { time: '13:00', name: 'Almoço no Nomad', description: 'Rooftop com vista', duration: '1h30', cost: 20, type: 'food' },
          { time: '15:00', name: 'Palácio Bahia', description: 'Arquitetura andaluza', duration: '1h30', cost: 7, type: 'culture' },
          { time: '17:00', name: 'Tumbas Saadianas', description: 'Mausoléu histórico', duration: '1h', cost: 7, type: 'culture' },
          { time: '20:00', name: 'Jantar no riad', description: 'Tajine tradicional', duration: '2h', cost: 25, type: 'food' },
        ],
      },
      {
        day: 3,
        title: 'Jardins e Beleza',
        icon: '🌴',
        activities: [
          { time: '09:00', name: 'Jardin Majorelle', description: 'Jardim de Yves Saint Laurent', duration: '2h', cost: 14, type: 'culture', clanTip: 'Vá na abertura, fica lotado!', clanAuthor: 'VanessaR' },
          { time: '12:00', name: 'Museu YSL', description: 'Moda e arte', duration: '1h30', cost: 10, type: 'culture' },
          { time: '14:00', name: 'Almoço na Ville Nouvelle', description: 'Parte moderna', duration: '1h30', cost: 20, type: 'food' },
          { time: '16:00', name: 'Hammam tradicional', description: 'Spa marroquino', duration: '2h', cost: 40, type: 'relax', clanTip: 'Heritage Spa é autêntico!', clanAuthor: 'PatriciaM' },
          { time: '20:00', name: 'Jantar no Le Jardin', description: 'Ambiente mágico', duration: '2h', cost: 35, type: 'food' },
        ],
      },
      {
        day: 4,
        title: 'Deserto de Agafay',
        icon: '🏜️',
        activities: [
          { time: '10:00', name: 'Transfer para Agafay', description: 'Deserto perto de Marrakech', duration: '1h', cost: 30, type: 'transport' },
          { time: '12:00', name: 'Passeio de camelo', description: 'Experiência autêntica', duration: '1h30', cost: 35, type: 'culture' },
          { time: '14:00', name: 'Almoço beduíno', description: 'Acampamento no deserto', duration: '2h', cost: 25, type: 'food' },
          { time: '17:00', name: 'Quad no deserto', description: 'Aventura ao pôr do sol', duration: '2h', cost: 50, type: 'culture', clanTip: 'Use cachecol pra poeira!', clanAuthor: 'EduardoG' },
          { time: '20:00', name: 'Jantar sob as estrelas', description: 'Noite no deserto', duration: '3h', cost: 60, type: 'food' },
        ],
      },
      {
        day: 5,
        title: 'Últimos Momentos',
        icon: '✨',
        activities: [
          { time: '09:00', name: 'Madrasa Ben Youssef', description: 'Escola corânica histórica', duration: '1h30', cost: 5, type: 'culture' },
          { time: '11:00', name: 'Últimas compras nos souks', description: 'Lembranças finais', duration: '2h', cost: 30, type: 'culture' },
          { time: '14:00', name: 'Almoço de despedida', description: 'Couscous sexta-feira', duration: '1h30', cost: 15, type: 'food' },
          { time: '16:00', name: 'Chá de menta no terraço', description: 'Contemplar a medina', duration: '1h', cost: 5, type: 'relax' },
        ],
      },
    ],
    reviews: [
      { id: 'r1', author: 'Alessandra Braga', avatar: 'https://i.pravatar.cc/100?img=45', rating: 5, text: 'O riad com terraço foi a melhor decisão. Café da manhã com vista pros minaretes!', date: '2024-01' },
      { id: 'r2', author: 'Julio Costa', avatar: 'https://i.pravatar.cc/100?img=13', rating: 4, text: 'Pechinchei uma luminária de 800 pra 250 dirhams. A dica funcionou!', date: '2023-12' },
      { id: 'r3', author: 'Eduardo Gomes', avatar: 'https://i.pravatar.cc/100?img=19', rating: 5, text: 'Quad no deserto ao pôr do sol foi cinematográfico. Use o cachecol mesmo!', date: '2023-11' },
    ],
  },
];
