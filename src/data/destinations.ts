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

export interface Destination {
  id: string;
  name: string;
  country: string;
  emoji: string;
  heroImage: string;
  rating: number;
  reviewCount: number;
  priceLevel: 1 | 2 | 3 | 4;
  avgBudget: number;
  duration: number;
  tags: string[];
  itinerary: DayItinerary[];
}

export const destinations: Destination[] = [
  {
    id: 'paris',
    name: 'Paris',
    country: 'França',
    emoji: '🗼',
    heroImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
    rating: 4.8,
    reviewCount: 1247,
    priceLevel: 3,
    avgBudget: 1500,
    duration: 5,
    tags: ['Romântico', 'Cultura'],
    itinerary: [
      {
        day: 1,
        title: 'Chegada e Le Marais',
        icon: '🏨',
        activities: [
          { time: '14:00', name: 'Check-in Hotel Le Marais', description: 'Acomodação no charmoso bairro', duration: '1h', cost: 0, type: 'relax' },
          { time: '16:00', name: 'Passeio pelo Le Marais', description: 'Explore ruelas medievais', duration: '2h', cost: 0, type: 'culture' },
          { time: '19:00', name: 'Jantar no Breizh Café', description: 'Melhores crepes de Paris', duration: '1h30', cost: 45, type: 'food', clanTip: 'Pede o completo!', clanAuthor: 'MariaV' },
        ],
      },
      {
        day: 2,
        title: 'Torre Eiffel e Trocadéro',
        icon: '🗼',
        activities: [
          { time: '09:00', name: 'Torre Eiffel', description: 'Subida ao topo da torre', duration: '3h', cost: 28, type: 'culture' },
          { time: '13:00', name: 'Almoço no Café de l\'Homme', description: 'Vista incrível para a torre', duration: '1h30', cost: 55, type: 'food' },
          { time: '15:00', name: 'Trocadéro', description: 'Melhor ponto para fotos', duration: '1h', cost: 0, type: 'photo' },
        ],
      },
      {
        day: 3,
        title: 'Louvre e Champs-Élysées',
        icon: '🏛️',
        activities: [
          { time: '09:00', name: 'Museu do Louvre', description: 'Mona Lisa e obras primas', duration: '4h', cost: 17, type: 'culture', clanTip: 'Vá na quarta de manhã!', clanAuthor: 'JoãoP' },
          { time: '14:00', name: 'Jardins das Tulherias', description: 'Caminhada relaxante', duration: '1h', cost: 0, type: 'relax' },
          { time: '16:00', name: 'Champs-Élysées', description: 'Compras e passeio', duration: '3h', cost: 0, type: 'culture' },
        ],
      },
      {
        day: 4,
        title: 'Montmartre',
        icon: '🎨',
        activities: [
          { time: '10:00', name: 'Sacré-Cœur', description: 'Vista panorâmica de Paris', duration: '1h30', cost: 0, type: 'culture' },
          { time: '12:00', name: 'Place du Tertre', description: 'Artistas e cafés', duration: '2h', cost: 30, type: 'food' },
          { time: '15:00', name: 'Moulin Rouge', description: 'Foto icônica', duration: '30min', cost: 0, type: 'photo' },
        ],
      },
      {
        day: 5,
        title: 'Versalhes',
        icon: '👑',
        activities: [
          { time: '09:00', name: 'Palácio de Versalhes', description: 'Dia inteiro no palácio', duration: '6h', cost: 20, type: 'culture' },
          { time: '16:00', name: 'Jardins de Versalhes', description: 'Passeio pelos jardins', duration: '2h', cost: 0, type: 'relax' },
        ],
      },
    ],
  },
  {
    id: 'tokyo',
    name: 'Tóquio',
    country: 'Japão',
    emoji: '🏯',
    heroImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
    rating: 4.9,
    reviewCount: 2341,
    priceLevel: 3,
    avgBudget: 2000,
    duration: 7,
    tags: ['Aventura', 'Cultura', 'Gastronômico'],
    itinerary: [
      {
        day: 1,
        title: 'Chegada em Shibuya',
        icon: '🏙️',
        activities: [
          { time: '14:00', name: 'Check-in Hotel Shibuya', description: 'Coração de Tóquio', duration: '1h', cost: 0, type: 'relax' },
          { time: '18:00', name: 'Cruzamento de Shibuya', description: 'O mais famoso do mundo', duration: '1h', cost: 0, type: 'photo' },
          { time: '20:00', name: 'Jantar Ramen', description: 'Ichiran Ramen', duration: '1h', cost: 15, type: 'food', clanTip: 'Pede extra chashu!', clanAuthor: 'TiagoM' },
        ],
      },
      {
        day: 2,
        title: 'Templos de Asakusa',
        icon: '⛩️',
        activities: [
          { time: '08:00', name: 'Senso-ji Temple', description: 'Templo mais antigo', duration: '2h', cost: 0, type: 'culture' },
          { time: '11:00', name: 'Nakamise Shopping', description: 'Rua tradicional', duration: '1h30', cost: 20, type: 'culture' },
        ],
      },
    ],
  },
  {
    id: 'lisboa',
    name: 'Lisboa',
    country: 'Portugal',
    emoji: '🚃',
    heroImage: 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800',
    rating: 4.7,
    reviewCount: 892,
    priceLevel: 2,
    avgBudget: 800,
    duration: 4,
    tags: ['Econômico', 'Cultura', 'Gastronômico'],
    itinerary: [
      {
        day: 1,
        title: 'Alfama',
        icon: '🏘️',
        activities: [
          { time: '10:00', name: 'Elétrico 28', description: 'Passeio tradicional', duration: '1h', cost: 3, type: 'transport' },
          { time: '12:00', name: 'Miradouro da Senhora do Monte', description: 'Melhor vista de Lisboa', duration: '1h', cost: 0, type: 'photo' },
          { time: '20:00', name: 'Casa de Fado', description: 'Jantar com música', duration: '2h', cost: 40, type: 'food', clanTip: 'Reserve com antecedência!', clanAuthor: 'AnaS' },
        ],
      },
      {
        day: 2,
        title: 'Belém',
        icon: '🏛️',
        activities: [
          { time: '09:00', name: 'Torre de Belém', description: 'Monumento icônico', duration: '1h', cost: 8, type: 'culture' },
          { time: '11:00', name: 'Pastéis de Belém', description: 'Os originais!', duration: '1h', cost: 5, type: 'food' },
        ],
      },
    ],
  },
  {
    id: 'barcelona',
    name: 'Barcelona',
    country: 'Espanha',
    emoji: '🏖️',
    heroImage: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800',
    rating: 4.6,
    reviewCount: 1567,
    priceLevel: 2,
    avgBudget: 1000,
    duration: 5,
    tags: ['Praia', 'Cultura', 'Família'],
    itinerary: [
      {
        day: 1,
        title: 'Gaudí Tour',
        icon: '🏗️',
        activities: [
          { time: '09:00', name: 'Sagrada Família', description: 'Obra-prima de Gaudí', duration: '2h', cost: 26, type: 'culture' },
          { time: '14:00', name: 'Park Güell', description: 'Mosaicos coloridos', duration: '2h', cost: 10, type: 'culture' },
        ],
      },
    ],
  },
  {
    id: 'roma',
    name: 'Roma',
    country: 'Itália',
    emoji: '🏛️',
    heroImage: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800',
    rating: 4.8,
    reviewCount: 1823,
    priceLevel: 2,
    avgBudget: 1100,
    duration: 4,
    tags: ['Cultura', 'Romântico', 'Gastronômico'],
    itinerary: [
      {
        day: 1,
        title: 'Roma Antiga',
        icon: '🏛️',
        activities: [
          { time: '09:00', name: 'Coliseu', description: 'Anfiteatro icônico', duration: '2h', cost: 16, type: 'culture' },
          { time: '12:00', name: 'Fórum Romano', description: 'Centro da Roma Antiga', duration: '2h', cost: 0, type: 'culture' },
          { time: '20:00', name: 'Trastevere', description: 'Jantar tradicional', duration: '2h', cost: 35, type: 'food', clanTip: 'Prova a carbonara!', clanAuthor: 'PedroL' },
        ],
      },
    ],
  },
];
