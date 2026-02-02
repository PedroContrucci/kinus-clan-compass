// Economic Itinerary Generator for Hard Budget system
// Generates budget-friendly itineraries using free activities and cheap options

import { FREE_ACTIVITIES, allocateBudget } from './budget';

export interface EconomicActivity {
  id: string;
  name: string;
  type: 'culture' | 'photo' | 'walk' | 'nature' | 'food' | 'transport';
  description: string;
  duration: string;
  time: string;
  cost: number;
  isFree: boolean;
  costCategory: 'free' | 'budget' | 'normal';
}

export interface EconomicDay {
  day: number;
  title: string;
  icon: string;
  activities: EconomicActivity[];
}

export interface EconomicItinerary {
  type: 'economic';
  destination: string;
  country: string;
  days: number;
  estimatedBudget: number;
  totalCost: number;
  flights: {
    outbound: { cost: number };
    return: { cost: number };
    total: number;
  };
  accommodation: {
    name: string;
    stars: number;
    perNight: number;
    nights: number;
    total: number;
  };
  itinerary: EconomicDay[];
  savings: number;
  isWithinBudget: boolean;
}

// Get destination-specific day titles
const getEconomicDayTitles = (destination: string): { title: string; icon: string }[] => {
  const titles: Record<string, { title: string; icon: string }[]> = {
    'roma': [
      { title: 'Centro Histórico', icon: '🏛️' },
      { title: 'Trastevere & Mirantes', icon: '🌅' },
      { title: 'Vaticano & Jardins', icon: '⛪' },
      { title: 'Roma Antiga', icon: '🏺' },
      { title: 'Bairros Autênticos', icon: '🍕' },
      { title: 'Parques & Vistas', icon: '🌳' },
      { title: 'Despedida', icon: '👋' },
    ],
    'paris': [
      { title: 'Montmartre & Sacré-Cœur', icon: '⛪' },
      { title: 'Marais & Notre-Dame', icon: '🏛️' },
      { title: 'Jardins & Passeios', icon: '🌳' },
      { title: 'Champs-Élysées', icon: '🗼' },
      { title: 'Sena & Pontes', icon: '🌉' },
      { title: 'Bairros Locais', icon: '🥐' },
      { title: 'Despedida', icon: '👋' },
    ],
    'lisboa': [
      { title: 'Alfama & Castelo', icon: '🏰' },
      { title: 'Baixa & Rossio', icon: '🚃' },
      { title: 'Belém Histórico', icon: '🏛️' },
      { title: 'Bairro Alto', icon: '🎸' },
      { title: 'Miradouros', icon: '🌅' },
      { title: 'Parques & Praias', icon: '🌊' },
      { title: 'Despedida', icon: '👋' },
    ],
    'barcelona': [
      { title: 'Bairro Gótico', icon: '🏛️' },
      { title: 'La Rambla & Boqueria', icon: '🍇' },
      { title: 'Barceloneta', icon: '🏖️' },
      { title: 'Park Güell', icon: '🦎' },
      { title: 'Montjuïc', icon: '🏔️' },
      { title: 'Gràcia', icon: '🎨' },
      { title: 'Despedida', icon: '👋' },
    ],
  };
  
  return titles[destination.toLowerCase()] || [
    { title: 'Exploração', icon: '🧭' },
    { title: 'Cultura', icon: '🏛️' },
    { title: 'Natureza', icon: '🌿' },
    { title: 'Gastronomia', icon: '🍽️' },
    { title: 'Passeios', icon: '🚶' },
    { title: 'Relaxamento', icon: '😌' },
    { title: 'Despedida', icon: '👋' },
  ];
};

// Get cheap hotel options by destination
const getCheapHotelInfo = (destination: string): { name: string; perNight: number; stars: number } => {
  const hotels: Record<string, { name: string; perNight: number; stars: number }> = {
    'roma': { name: 'Hotel Centro ★★★', perNight: 280, stars: 3 },
    'paris': { name: 'Hôtel du Nord ★★★', perNight: 350, stars: 3 },
    'lisboa': { name: 'Hotel Lisboa Central ★★★', perNight: 220, stars: 3 },
    'barcelona': { name: 'Hostal Barcelona ★★★', perNight: 240, stars: 3 },
    'tóquio': { name: 'Tokyo Inn ★★★', perNight: 380, stars: 3 },
    'amsterdã': { name: 'Hotel Amsterdam Budget ★★★', perNight: 320, stars: 3 },
  };
  
  return hotels[destination.toLowerCase()] || { name: 'Hotel Econômico ★★★', perNight: 300, stars: 3 };
};

// Get minimum flight cost by destination
const getMinFlightCost = (destination: string, travelers: number): { outbound: number; return: number; total: number } => {
  const baseCosts: Record<string, number> = {
    'roma': 2800,
    'paris': 3000,
    'lisboa': 2400,
    'barcelona': 2600,
    'tóquio': 4500,
    'amsterdã': 3200,
    'nova york': 3800,
  };
  
  const perPerson = baseCosts[destination.toLowerCase()] || 3000;
  const outbound = Math.round(perPerson * 0.52 * travelers);
  const returnFlight = Math.round(perPerson * 0.48 * travelers);
  
  return {
    outbound,
    return: returnFlight,
    total: outbound + returnFlight,
  };
};

// Select random activities for a day (avoiding duplicates)
const selectActivitiesForDay = (
  freeActivities: { name: string; cost: number; type: string }[],
  usedActivities: Set<string>,
  count: number
): EconomicActivity[] => {
  const available = freeActivities.filter(a => !usedActivities.has(a.name));
  const selected: EconomicActivity[] = [];
  
  for (let i = 0; i < count && available.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * available.length);
    const activity = available[randomIndex];
    
    selected.push({
      id: `free-${activity.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: activity.name,
      type: activity.type as EconomicActivity['type'],
      description: getActivityDescription(activity.name, activity.type),
      duration: getDurationByType(activity.type),
      time: getTimeSlot(selected.length),
      cost: 0,
      isFree: true,
      costCategory: 'free',
    });
    
    usedActivities.add(activity.name);
    available.splice(randomIndex, 1);
  }
  
  return selected;
};

const getActivityDescription = (name: string, type: string): string => {
  const descriptions: Record<string, string> = {
    'photo': 'Ponto fotográfico gratuito',
    'culture': 'Entrada gratuita, arquitetura impressionante',
    'walk': 'Caminhada pelo bairro, sem custo',
    'nature': 'Parque ou jardim público gratuito',
  };
  return descriptions[type] || 'Atividade gratuita';
};

const getDurationByType = (type: string): string => {
  const durations: Record<string, string> = {
    'photo': '30min',
    'culture': '1h30',
    'walk': '2h',
    'nature': '1h30',
  };
  return durations[type] || '1h';
};

const getTimeSlot = (index: number): string => {
  const slots = ['09:00', '11:00', '14:00', '16:00', '18:00'];
  return slots[index] || '10:00';
};

// Generate economic meal activity
const generateEconomicMeal = (
  type: 'almoço' | 'jantar',
  destination: string,
  dailyBudget: number
): EconomicActivity => {
  const meals: Record<string, { almoço: { name: string; desc: string }; jantar: { name: string; desc: string } }> = {
    'roma': {
      almoço: { name: 'Almoço em trattoria local', desc: 'Pasta fresca em restaurante fora da zona turística' },
      jantar: { name: 'Pizza al taglio', desc: 'Pizza ao peso, típica romana e econômica' },
    },
    'paris': {
      almoço: { name: 'Déjeuner en boulangerie', desc: 'Sanduíche + café em padaria parisiense' },
      jantar: { name: 'Crêperie du quartier', desc: 'Crepe galette em lugar local' },
    },
    'lisboa': {
      almoço: { name: 'Tasca portuguesa', desc: 'Prato do dia em tasca tradicional' },
      jantar: { name: 'Petiscos no bairro', desc: 'Petiscos e vinho verde em bar local' },
    },
    'barcelona': {
      almoço: { name: 'Menú del día', desc: 'Menu executivo espanhol com 3 pratos' },
      jantar: { name: 'Tapas no Gótico', desc: 'Tapas variadas em bar tradicional' },
    },
  };
  
  const destMeals = meals[destination.toLowerCase()] || {
    almoço: { name: 'Almoço econômico', desc: 'Restaurante local, boa comida por bom preço' },
    jantar: { name: 'Jantar econômico', desc: 'Street food ou restaurante simples' },
  };
  
  const meal = destMeals[type];
  const cost = type === 'almoço' ? Math.min(dailyBudget * 0.35, 60) : Math.min(dailyBudget * 0.25, 45);
  
  return {
    id: `meal-${type}-${Date.now()}`,
    name: meal.name,
    type: 'food',
    description: meal.desc,
    duration: type === 'almoço' ? '1h' : '1h30',
    time: type === 'almoço' ? '13:00' : '20:00',
    cost: Math.round(cost),
    isFree: false,
    costCategory: 'budget',
  };
};

// Generate transport activity for the day
const generateDailyTransport = (destination: string): EconomicActivity => {
  const transportCosts: Record<string, number> = {
    'roma': 12,
    'paris': 15,
    'lisboa': 10,
    'barcelona': 12,
    'tóquio': 25,
    'amsterdã': 14,
  };
  
  return {
    id: `transport-${Date.now()}`,
    name: 'Transporte público',
    type: 'transport',
    description: 'Metrô e ônibus durante o dia',
    duration: '-',
    time: '-',
    cost: transportCosts[destination.toLowerCase()] || 15,
    isFree: false,
    costCategory: 'budget',
  };
};

// Main function to generate economic itinerary
export const generateEconomicItinerary = (
  destination: string,
  country: string,
  days: number,
  userBudget: number,
  travelers: number,
  originalCost: number
): EconomicItinerary | null => {
  // Get minimum costs
  const flights = getMinFlightCost(destination, travelers);
  const hotelInfo = getCheapHotelInfo(destination);
  const nights = Math.max(1, days - 1); // Nights = days - 1 (last day is departure)
  const accommodationTotal = hotelInfo.perNight * nights;
  
  const fixedCosts = flights.total + accommodationTotal;
  
  // Check if even minimum costs exceed budget
  if (fixedCosts > userBudget * 0.95) {
    // Can't fit even with economic options
    return null;
  }
  
  // Calculate remaining budget for experiences
  const remainingBudget = userBudget - fixedCosts;
  const dailyBudget = remainingBudget / days;
  
  // Get free activities for destination
  const freeActivities = FREE_ACTIVITIES[destination.toLowerCase()] || [];
  const usedActivities = new Set<string>();
  const dayTitles = getEconomicDayTitles(destination);
  
  // Generate days
  const itinerary: EconomicDay[] = [];
  let totalActivitiesCost = 0;
  
  for (let dayNum = 1; dayNum <= days; dayNum++) {
    const dayInfo = dayTitles[dayNum - 1] || { title: `Dia ${dayNum}`, icon: '📍' };
    const dayActivities: EconomicActivity[] = [];
    
    // Add 2-3 free activities
    const freeCount = dayNum === days ? 1 : (dayNum === 1 ? 2 : 3);
    const selectedFree = selectActivitiesForDay(freeActivities, usedActivities, freeCount);
    dayActivities.push(...selectedFree);
    
    // Add economic lunch
    const lunch = generateEconomicMeal('almoço', destination, dailyBudget);
    dayActivities.push(lunch);
    totalActivitiesCost += lunch.cost;
    
    // Add economic dinner (except last day)
    if (dayNum !== days) {
      const dinner = generateEconomicMeal('jantar', destination, dailyBudget);
      dayActivities.push(dinner);
      totalActivitiesCost += dinner.cost;
    }
    
    // Add transport
    const transport = generateDailyTransport(destination);
    dayActivities.push(transport);
    totalActivitiesCost += transport.cost;
    
    // Sort by time
    dayActivities.sort((a, b) => {
      if (a.time === '-') return 1;
      if (b.time === '-') return -1;
      return a.time.localeCompare(b.time);
    });
    
    itinerary.push({
      day: dayNum,
      title: dayInfo.title,
      icon: dayInfo.icon,
      activities: dayActivities,
    });
  }
  
  const totalCost = fixedCosts + totalActivitiesCost;
  const savings = originalCost - totalCost;
  
  return {
    type: 'economic',
    destination,
    country,
    days,
    estimatedBudget: userBudget,
    totalCost,
    flights: {
      outbound: { cost: flights.outbound },
      return: { cost: flights.return },
      total: flights.total,
    },
    accommodation: {
      name: hotelInfo.name,
      stars: hotelInfo.stars,
      perNight: hotelInfo.perNight,
      nights,
      total: accommodationTotal,
    },
    itinerary,
    savings,
    isWithinBudget: totalCost <= userBudget,
  };
};

// Identify top 3 spending items (villains)
export interface BudgetVillain {
  id: string;
  rank: number;
  type: 'flight' | 'hotel' | 'activity' | 'food';
  name: string;
  cost: number;
  percent: number;
  potentialSaving: number;
  canAuction: boolean;
  details?: string;
}

export const identifyTopVillains = (
  flights: { outbound: number; return: number },
  accommodation: { total: number; perNight: number; nights: number },
  activities: { name: string; cost: number; type: string }[],
  totalCost: number
): BudgetVillain[] => {
  const allItems: Omit<BudgetVillain, 'rank'>[] = [
    {
      id: 'flight-outbound',
      type: 'flight',
      name: 'Voo de Ida',
      cost: flights.outbound,
      percent: Math.round((flights.outbound / totalCost) * 100),
      potentialSaving: Math.round(flights.outbound * 0.20), // 20% via auction
      canAuction: true,
    },
    {
      id: 'flight-return',
      type: 'flight',
      name: 'Voo de Volta',
      cost: flights.return,
      percent: Math.round((flights.return / totalCost) * 100),
      potentialSaving: Math.round(flights.return * 0.20),
      canAuction: true,
    },
    {
      id: 'accommodation',
      type: 'hotel',
      name: `Hotel (${accommodation.nights} noites)`,
      cost: accommodation.total,
      percent: Math.round((accommodation.total / totalCost) * 100),
      potentialSaving: Math.round(accommodation.total * 0.25),
      canAuction: true,
      details: `R$ ${accommodation.perNight.toLocaleString()}/noite`,
    },
    ...activities
      .filter(a => a.cost > 50)
      .map(a => ({
        id: `activity-${a.name.toLowerCase().replace(/\s+/g, '-')}`,
        type: 'activity' as const,
        name: a.name,
        cost: a.cost,
        percent: Math.round((a.cost / totalCost) * 100),
        potentialSaving: Math.round(a.cost * 0.30), // 30% potential on activities
        canAuction: true,
      })),
  ];
  
  // Sort by cost (highest first) and take top 3
  return allItems
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 3)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
};
