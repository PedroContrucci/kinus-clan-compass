import { create } from 'zustand';

const ACTIVITIES_DB = {
  roma: [
    {
      name: 'Museus do Vaticano + Capela Sistina',
      image: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=600',
      baseCost: 1800,
      premiumCost: 3500,
      luxuryCost: 5500,
      duration: '4h',
      location: 'Vaticano',
      clanTip: { text: 'Vai direto pra Sistina, depois volta com calma', author: 'MariaViaja' }
    },
    {
      name: 'Coliseu + Fórum Romano',
      image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600',
      baseCost: 1200,
      premiumCost: 2500,
      luxuryCost: 4000,
      duration: '3h',
      location: 'Centro Histórico',
      clanTip: { text: 'Underground tour é incrível!', author: 'PedroNomad' }
    },
    {
      name: 'Fontana di Trevi + Pantheon',
      image: 'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=600',
      baseCost: 400,
      premiumCost: 800,
      luxuryCost: 1500,
      duration: '2h',
      location: 'Centro',
      clanTip: { text: 'Vá ao amanhecer, fica vazio!', author: 'AnaExplora' }
    },
    {
      name: 'Trastevere Food Tour',
      image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600',
      baseCost: 650,
      premiumCost: 1200,
      luxuryCost: 2000,
      duration: '3h',
      location: 'Trastevere',
      clanTip: { text: 'Melhor carbonara da minha vida!', author: 'GastroLuiz' }
    },
    {
      name: 'Villa Borghese + Galeria',
      image: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=600',
      baseCost: 900,
      premiumCost: 1600,
      luxuryCost: 2800,
      duration: '3h',
      location: 'Villa Borghese',
      clanTip: { text: 'Reserve com 1 mês de antecedência!', author: 'ArteClara' }
    },
    {
      name: 'Piazza Navona + Campo de\' Fiori',
      image: 'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=600',
      baseCost: 300,
      premiumCost: 600,
      luxuryCost: 1000,
      duration: '2h',
      location: 'Centro',
      clanTip: null
    }
  ]
};

const HOTELS_DB = {
  roma: {
    economic: { name: 'Hotel Centro Roma', stars: 3, perNight: 450 },
    comfort: { name: 'Hotel Artemide', stars: 4, perNight: 850 },
    premium: { name: 'Hotel de Russie', stars: 5, perNight: 1800 },
    luxury: { name: 'Rome Cavalieri', stars: 5, perNight: 3500 }
  }
};

const FLIGHTS_DB = {
  roma: {
    economic: { class: 'Econômica', cost: 3500 },
    comfort: { class: 'Econômica Premium', cost: 5500 },
    premium: { class: 'Executiva', cost: 12000 },
    luxury: { class: 'Primeira Classe', cost: 25000 }
  }
};

interface Day {
  date: string;
  label: string;
  icon: string;
  activities: Activity[];
  totalCost: number;
}

interface Activity {
  id: string;
  name: string;
  image: string;
  cost: number;
  duration: string;
  location: string;
  time: string;
  date: string;
  description?: string;
  clanTip?: { text: string; author: string } | null;
}

interface Itinerary {
  id: string;
  destination: string;
  dates: { start: string; end: string };
  travelers: number;
  budget: number;
  totalCost: number;
  occupation: number;
  tier: string;
  flight: { class: string; cost: number };
  hotel: { name: string; stars: number; totalCost: number };
  days: Day[];
  breakdown: {
    flights: number;
    hotel: number;
    activities: number;
    food: number;
  };
}

interface ItineraryStore {
  itinerary: Itinerary | null;
  generateItinerary: (formData: {
    destination: string;
    dates: { start: string; end: string };
    travelers: number;
    budget: number;
  }) => void;
  saveTrip: () => void;
}

export const useItineraryStore = create<ItineraryStore>((set, get) => ({
  itinerary: null,
  
  generateItinerary: (formData) => {
    const { destination, dates, travelers, budget } = formData;
    const days = 7;
    
    // ═══════════════════════════════════════════════════════════════════
    // GOVERNANÇA DE BUDGET: 80-100% OBRIGATÓRIO
    // ═══════════════════════════════════════════════════════════════════
    
    const targetIdeal = budget * 0.90;
    
    // Determina tier baseado no budget
    let tier = 'economic';
    if (budget >= 100000) tier = 'luxury';
    else if (budget >= 60000) tier = 'premium';
    else if (budget >= 40000) tier = 'comfort';
    
    // Seleciona voo do tier
    const flightData = FLIGHTS_DB.roma[tier as keyof typeof FLIGHTS_DB.roma] || FLIGHTS_DB.roma.economic;
    const flightCost = flightData.cost * travelers;
    
    // Seleciona hotel do tier
    const hotelData = HOTELS_DB.roma[tier as keyof typeof HOTELS_DB.roma] || HOTELS_DB.roma.economic;
    const hotelCost = hotelData.perNight * days;
    
    // Calcula quanto resta para atividades
    const fixedCosts = flightCost + hotelCost;
    const remainingForActivities = targetIdeal - fixedCosts;
    const dailyActivityBudget = remainingForActivities / days;
    
    // Gera dias com atividades
    const itineraryDays: Day[] = [];
    let totalActivitiesCost = 0;
    
    const activities = ACTIVITIES_DB.roma;
    let activityIndex = 0;
    
    for (let i = 0; i < days; i++) {
      const dayActivities: Activity[] = [];
      let daySpent = 0;
      
      // Seleciona 2-3 atividades por dia dentro do budget
      for (let j = 0; j < 3 && activityIndex < activities.length * 2; j++) {
        const act = activities[activityIndex % activities.length];
        const cost = tier === 'luxury' ? act.luxuryCost :
                     tier === 'premium' ? act.premiumCost : act.baseCost;
        
        if (daySpent + cost <= dailyActivityBudget * 1.2) {
          dayActivities.push({
            id: `${i}-${j}`,
            name: act.name,
            image: act.image,
            cost,
            duration: act.duration,
            location: act.location,
            time: `${9 + j * 4}:00`,
            date: `${13 + i}/02`,
            description: `Tour guiado em português com acesso prioritário`,
            clanTip: act.clanTip
          });
          daySpent += cost;
        }
        activityIndex++;
      }
      
      totalActivitiesCost += daySpent;
      
      itineraryDays.push({
        date: `${13 + i}/02`,
        label: i === 0 ? 'Chegada' : i === days - 1 ? 'Partida' : `Dia ${i}`,
        icon: i === 0 || i === days - 1 ? '✈️' : '🏛️',
        activities: dayActivities,
        totalCost: daySpent
      });
    }
    
    const foodCost = Math.round(budget * 0.08);
    const totalCost = fixedCosts + totalActivitiesCost + foodCost;
    const occupation = Math.round((totalCost / budget) * 100);
    
    set({
      itinerary: {
        id: Date.now().toString(),
        destination: 'Roma, Itália',
        dates: { start: '12/02', end: '19/02' },
        travelers,
        budget,
        totalCost,
        occupation,
        tier,
        flight: {
          class: flightData.class,
          cost: flightCost
        },
        hotel: {
          name: hotelData.name,
          stars: hotelData.stars,
          totalCost: hotelCost
        },
        days: itineraryDays,
        breakdown: {
          flights: flightCost,
          hotel: hotelCost,
          activities: totalActivitiesCost,
          food: foodCost
        }
      }
    });
  },
  
  saveTrip: () => {
    const { itinerary } = get();
    if (!itinerary) return;
    
    const existing = JSON.parse(localStorage.getItem('kinu-trips') || '[]');
    existing.push({
      ...itinerary,
      activities: itinerary.days.flatMap(d => 
        d.activities.map(a => ({ 
          ...a, 
          status: 'pending',
          estimatedCost: a.cost
        }))
      ),
      confirmedCost: 0,
      inAuctionCost: 0,
      daysUntil: 12,
      hoursUntil: 4
    });
    localStorage.setItem('kinu-trips', JSON.stringify(existing));
    
    // Dispatch event to notify trips store
    window.dispatchEvent(new Event('kinu-trip-saved'));
  }
}));
