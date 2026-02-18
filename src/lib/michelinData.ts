// Michelin Guide Restaurant Dataset — Curated for KINU Travel OS
// Source: Michelin Guide 2024-2025 selections
// Covers top destinations for Brazilian travelers

export interface MichelinRestaurant {
  name: string;
  city: string;
  country: string;
  stars: 1 | 2 | 3;
  cuisine: string;
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  neighborhood?: string;
}

// Key: lowercase city name → array of restaurants
export const MICHELIN_RESTAURANTS: Record<string, MichelinRestaurant[]> = {

  // ============ PARIS ============
  paris: [
    { name: "L'Ambroisie", city: "Paris", country: "France", stars: 3, cuisine: "French", priceRange: "$$$$", neighborhood: "Le Marais" },
    { name: "Arpège", city: "Paris", country: "France", stars: 3, cuisine: "French", priceRange: "$$$$", neighborhood: "7ème" },
    { name: "Alléno Paris", city: "Paris", country: "France", stars: 3, cuisine: "French", priceRange: "$$$$", neighborhood: "8ème" },
    { name: "Épicure", city: "Paris", country: "France", stars: 3, cuisine: "French", priceRange: "$$$$", neighborhood: "8ème" },
    { name: "Le Cinq", city: "Paris", country: "France", stars: 3, cuisine: "French", priceRange: "$$$$", neighborhood: "8ème" },
    { name: "Pierre Gagnaire", city: "Paris", country: "France", stars: 3, cuisine: "French", priceRange: "$$$$", neighborhood: "8ème" },
    { name: "Kei", city: "Paris", country: "France", stars: 3, cuisine: "French-Japanese", priceRange: "$$$$", neighborhood: "1er" },
    { name: "Le Pré Catelan", city: "Paris", country: "France", stars: 3, cuisine: "French", priceRange: "$$$$", neighborhood: "16ème" },
    { name: "Plénitude", city: "Paris", country: "France", stars: 3, cuisine: "French", priceRange: "$$$$", neighborhood: "1er" },
    { name: "Le Gabriel", city: "Paris", country: "France", stars: 3, cuisine: "French", priceRange: "$$$$", neighborhood: "8ème" },
    { name: "Le Jules Verne", city: "Paris", country: "France", stars: 2, cuisine: "French", priceRange: "$$$$", neighborhood: "Tour Eiffel" },
    { name: "Le Taillevent", city: "Paris", country: "France", stars: 2, cuisine: "French", priceRange: "$$$$", neighborhood: "8ème" },
    { name: "David Toutain", city: "Paris", country: "France", stars: 2, cuisine: "French", priceRange: "$$$", neighborhood: "7ème" },
    { name: "Sur Mesure", city: "Paris", country: "France", stars: 2, cuisine: "French", priceRange: "$$$$", neighborhood: "1er" },
    { name: "Blanc", city: "Paris", country: "France", stars: 2, cuisine: "Asian-Fusion", priceRange: "$$$$", neighborhood: "16ème" },
    { name: "Sushi Yoshinaga", city: "Paris", country: "France", stars: 2, cuisine: "Japanese", priceRange: "$$$$", neighborhood: "2ème" },
    { name: "L'Abysse", city: "Paris", country: "France", stars: 2, cuisine: "Japanese", priceRange: "$$$$", neighborhood: "8ème" },
    { name: "Tour d'Argent", city: "Paris", country: "France", stars: 1, cuisine: "French", priceRange: "$$$$", neighborhood: "5ème" },
    { name: "Frenchie", city: "Paris", country: "France", stars: 1, cuisine: "French", priceRange: "$$$", neighborhood: "2ème" },
    { name: "Granite", city: "Paris", country: "France", stars: 1, cuisine: "French", priceRange: "$$$", neighborhood: "1er" },
    { name: "Yam'Tcha", city: "Paris", country: "France", stars: 1, cuisine: "French-Chinese", priceRange: "$$$", neighborhood: "1er" },
    { name: "Comice", city: "Paris", country: "France", stars: 1, cuisine: "French", priceRange: "$$$", neighborhood: "16ème" },
    { name: "Le Violon d'Ingres", city: "Paris", country: "France", stars: 1, cuisine: "French", priceRange: "$$$", neighborhood: "7ème" },
    { name: "Ze Kitchen Galerie", city: "Paris", country: "France", stars: 1, cuisine: "French-Asian", priceRange: "$$$", neighborhood: "6ème" },
    { name: "Nakatani", city: "Paris", country: "France", stars: 1, cuisine: "French-Japanese", priceRange: "$$$", neighborhood: "7ème" },
  ],

  // ============ ROMA / ROME ============
  roma: [
    { name: "La Pergola", city: "Roma", country: "Italy", stars: 3, cuisine: "Italian", priceRange: "$$$$" },
    { name: "Il Pagliaccio", city: "Roma", country: "Italy", stars: 2, cuisine: "Italian", priceRange: "$$$$" },
    { name: "Idylio", city: "Roma", country: "Italy", stars: 2, cuisine: "Italian", priceRange: "$$$$" },
    { name: "Imàgo", city: "Roma", country: "Italy", stars: 1, cuisine: "Italian", priceRange: "$$$$" },
    { name: "All'Oro", city: "Roma", country: "Italy", stars: 1, cuisine: "Italian", priceRange: "$$$" },
    { name: "Aroma", city: "Roma", country: "Italy", stars: 1, cuisine: "Italian", priceRange: "$$$$" },
    { name: "Pipero", city: "Roma", country: "Italy", stars: 1, cuisine: "Italian", priceRange: "$$$" },
    { name: "Enoteca La Torre", city: "Roma", country: "Italy", stars: 1, cuisine: "Italian", priceRange: "$$$" },
  ],

  // ============ LONDRES / LONDON ============
  londres: [
    { name: "Alain Ducasse at The Dorchester", city: "London", country: "UK", stars: 3, cuisine: "French", priceRange: "$$$$" },
    { name: "Core by Clare Smyth", city: "London", country: "UK", stars: 3, cuisine: "British", priceRange: "$$$$" },
    { name: "Sketch", city: "London", country: "UK", stars: 3, cuisine: "French", priceRange: "$$$$" },
    { name: "The Araki", city: "London", country: "UK", stars: 2, cuisine: "Japanese", priceRange: "$$$$" },
    { name: "Dinner by Heston", city: "London", country: "UK", stars: 2, cuisine: "British", priceRange: "$$$$" },
    { name: "The Ledbury", city: "London", country: "UK", stars: 2, cuisine: "British", priceRange: "$$$$" },
    { name: "Dishoom", city: "London", country: "UK", stars: 1, cuisine: "Indian", priceRange: "$$" },
    { name: "The Clove Club", city: "London", country: "UK", stars: 1, cuisine: "British", priceRange: "$$$" },
    { name: "Brat", city: "London", country: "UK", stars: 1, cuisine: "British", priceRange: "$$$" },
  ],

  // ============ BARCELONA ============
  barcelona: [
    { name: "ABaC", city: "Barcelona", country: "Spain", stars: 3, cuisine: "Spanish", priceRange: "$$$$" },
    { name: "Lasarte", city: "Barcelona", country: "Spain", stars: 3, cuisine: "Basque", priceRange: "$$$$" },
    { name: "Cocina Hermanos Torres", city: "Barcelona", country: "Spain", stars: 2, cuisine: "Spanish", priceRange: "$$$$" },
    { name: "Disfrutar", city: "Barcelona", country: "Spain", stars: 2, cuisine: "Spanish", priceRange: "$$$$" },
    { name: "Moments", city: "Barcelona", country: "Spain", stars: 2, cuisine: "Catalan", priceRange: "$$$$" },
    { name: "Alkimia", city: "Barcelona", country: "Spain", stars: 1, cuisine: "Catalan", priceRange: "$$$" },
    { name: "Cinc Sentits", city: "Barcelona", country: "Spain", stars: 1, cuisine: "Catalan", priceRange: "$$$" },
  ],

  // ============ TÓQUIO / TOKYO ============
  tóquio: [
    { name: "Sukiyabashi Jiro", city: "Tokyo", country: "Japan", stars: 3, cuisine: "Sushi", priceRange: "$$$$" },
    { name: "Quintessence", city: "Tokyo", country: "Japan", stars: 3, cuisine: "French", priceRange: "$$$$" },
    { name: "Joël Robuchon", city: "Tokyo", country: "Japan", stars: 3, cuisine: "French", priceRange: "$$$$" },
    { name: "Ryugin", city: "Tokyo", country: "Japan", stars: 3, cuisine: "Japanese", priceRange: "$$$$" },
    { name: "Narisawa", city: "Tokyo", country: "Japan", stars: 2, cuisine: "Japanese", priceRange: "$$$$" },
    { name: "Den", city: "Tokyo", country: "Japan", stars: 2, cuisine: "Japanese", priceRange: "$$$" },
    { name: "Florilège", city: "Tokyo", country: "Japan", stars: 2, cuisine: "French-Japanese", priceRange: "$$$" },
    { name: "Sushi Saito", city: "Tokyo", country: "Japan", stars: 3, cuisine: "Sushi", priceRange: "$$$$" },
  ],

  // ============ NOVA YORK / NEW YORK ============
  'nova york': [
    { name: "Le Bernardin", city: "New York", country: "USA", stars: 3, cuisine: "French-Seafood", priceRange: "$$$$" },
    { name: "Eleven Madison Park", city: "New York", country: "USA", stars: 3, cuisine: "American", priceRange: "$$$$" },
    { name: "Masa", city: "New York", country: "USA", stars: 3, cuisine: "Japanese", priceRange: "$$$$" },
    { name: "Per Se", city: "New York", country: "USA", stars: 3, cuisine: "French-American", priceRange: "$$$$" },
    { name: "Chef's Table at Brooklyn Fare", city: "New York", country: "USA", stars: 3, cuisine: "French-Japanese", priceRange: "$$$$" },
    { name: "Daniel", city: "New York", country: "USA", stars: 2, cuisine: "French", priceRange: "$$$$" },
    { name: "Jean-Georges", city: "New York", country: "USA", stars: 2, cuisine: "French", priceRange: "$$$$" },
    { name: "Atomix", city: "New York", country: "USA", stars: 2, cuisine: "Korean", priceRange: "$$$$" },
    { name: "Peter Luger", city: "New York", country: "USA", stars: 1, cuisine: "Steakhouse", priceRange: "$$$" },
  ],

  // ============ LISBOA / LISBON ============
  lisboa: [
    { name: "Belcanto", city: "Lisboa", country: "Portugal", stars: 2, cuisine: "Portuguese", priceRange: "$$$$" },
    { name: "ALMA", city: "Lisboa", country: "Portugal", stars: 1, cuisine: "Portuguese", priceRange: "$$$" },
    { name: "Eleven", city: "Lisboa", country: "Portugal", stars: 1, cuisine: "Mediterranean", priceRange: "$$$" },
    { name: "Feitoria", city: "Lisboa", country: "Portugal", stars: 1, cuisine: "Portuguese", priceRange: "$$$" },
    { name: "Epur", city: "Lisboa", country: "Portugal", stars: 1, cuisine: "French-Portuguese", priceRange: "$$$" },
  ],

  // ============ MADRI / MADRID ============
  madri: [
    { name: "DiverXO", city: "Madrid", country: "Spain", stars: 3, cuisine: "Asian-Spanish", priceRange: "$$$$" },
    { name: "Smoked Room", city: "Madrid", country: "Spain", stars: 2, cuisine: "Spanish", priceRange: "$$$$" },
    { name: "Coque", city: "Madrid", country: "Spain", stars: 2, cuisine: "Spanish", priceRange: "$$$$" },
    { name: "Santceloni", city: "Madrid", country: "Spain", stars: 1, cuisine: "Spanish", priceRange: "$$$$" },
    { name: "DSTAgE", city: "Madrid", country: "Spain", stars: 1, cuisine: "Spanish", priceRange: "$$$" },
  ],

  // ============ AMSTERDÃ / AMSTERDAM ============
  amsterdã: [
    { name: "Librije's Zusje", city: "Amsterdam", country: "Netherlands", stars: 2, cuisine: "French", priceRange: "$$$$" },
    { name: "Spectrum", city: "Amsterdam", country: "Netherlands", stars: 2, cuisine: "French", priceRange: "$$$$" },
    { name: "&moshik", city: "Amsterdam", country: "Netherlands", stars: 2, cuisine: "French", priceRange: "$$$$" },
    { name: "Bord'Eau", city: "Amsterdam", country: "Netherlands", stars: 1, cuisine: "French", priceRange: "$$$" },
    { name: "Rijks", city: "Amsterdam", country: "Netherlands", stars: 1, cuisine: "Dutch", priceRange: "$$$" },
  ],

  // ============ BUENOS AIRES ============
  'buenos aires': [
    { name: "Aramburu", city: "Buenos Aires", country: "Argentina", stars: 1, cuisine: "Argentine", priceRange: "$$$" },
    { name: "Mengano", city: "Buenos Aires", country: "Argentina", stars: 1, cuisine: "Argentine", priceRange: "$$" },
    { name: "Niño Gordo", city: "Buenos Aires", country: "Argentina", stars: 1, cuisine: "Asian-Argentine", priceRange: "$$" },
  ],

  // ============ BANGKOK ============
  bangkok: [
    { name: "Gaggan Anand", city: "Bangkok", country: "Thailand", stars: 2, cuisine: "Indian-Thai", priceRange: "$$$$" },
    { name: "Le Normandie", city: "Bangkok", country: "Thailand", stars: 2, cuisine: "French", priceRange: "$$$$" },
    { name: "Sorn", city: "Bangkok", country: "Thailand", stars: 2, cuisine: "Thai", priceRange: "$$$" },
    { name: "Jay Fai", city: "Bangkok", country: "Thailand", stars: 1, cuisine: "Thai", priceRange: "$$" },
    { name: "Nahm", city: "Bangkok", country: "Thailand", stars: 1, cuisine: "Thai", priceRange: "$$$" },
    { name: "Paste", city: "Bangkok", country: "Thailand", stars: 1, cuisine: "Thai", priceRange: "$$$" },
  ],

  // ============ DUBAI ============
  dubai: [
    { name: "Trèsind Studio", city: "Dubai", country: "UAE", stars: 2, cuisine: "Indian", priceRange: "$$$$" },
    { name: "Stay by Yannick Alléno", city: "Dubai", country: "UAE", stars: 2, cuisine: "French", priceRange: "$$$$" },
    { name: "Il Ristorante Niko Romito", city: "Dubai", country: "UAE", stars: 1, cuisine: "Italian", priceRange: "$$$$" },
    { name: "Ossiano", city: "Dubai", country: "UAE", stars: 1, cuisine: "Seafood", priceRange: "$$$$" },
    { name: "Hakkasan", city: "Dubai", country: "UAE", stars: 1, cuisine: "Chinese", priceRange: "$$$" },
  ],

  // ============ SINGAPURA / SINGAPORE ============
  singapura: [
    { name: "Les Amis", city: "Singapore", country: "Singapore", stars: 3, cuisine: "French", priceRange: "$$$$" },
    { name: "Odette", city: "Singapore", country: "Singapore", stars: 3, cuisine: "French", priceRange: "$$$$" },
    { name: "Zén", city: "Singapore", country: "Singapore", stars: 3, cuisine: "Scandinavian", priceRange: "$$$$" },
    { name: "Liao Fan Hong Kong Soya Sauce", city: "Singapore", country: "Singapore", stars: 1, cuisine: "Chinese", priceRange: "$" },
    { name: "Burnt Ends", city: "Singapore", country: "Singapore", stars: 1, cuisine: "BBQ", priceRange: "$$$" },
  ],

  // ============ MILÃO / MILAN ============
  milão: [
    { name: "Enrico Bartolini", city: "Milan", country: "Italy", stars: 3, cuisine: "Italian", priceRange: "$$$$" },
    { name: "Seta", city: "Milan", country: "Italy", stars: 2, cuisine: "Italian", priceRange: "$$$$" },
    { name: "Il Luogo di Aimo e Nadia", city: "Milan", country: "Italy", stars: 2, cuisine: "Italian", priceRange: "$$$$" },
    { name: "Cracco", city: "Milan", country: "Italy", stars: 1, cuisine: "Italian", priceRange: "$$$$" },
    { name: "Joia", city: "Milan", country: "Italy", stars: 1, cuisine: "Vegetarian", priceRange: "$$$" },
  ],

  // ============ ISTAMBUL / ISTANBUL ============
  istambul: [
    { name: "Turk Fatih Tutak", city: "Istanbul", country: "Turkey", stars: 2, cuisine: "Turkish", priceRange: "$$$$" },
    { name: "Neolokal", city: "Istanbul", country: "Turkey", stars: 1, cuisine: "Turkish", priceRange: "$$$" },
    { name: "Mikla", city: "Istanbul", country: "Turkey", stars: 1, cuisine: "Turkish-Scandinavian", priceRange: "$$$" },
    { name: "Nicole", city: "Istanbul", country: "Turkey", stars: 1, cuisine: "Turkish", priceRange: "$$$" },
  ],
};

// English key aliases
MICHELIN_RESTAURANTS['rome'] = MICHELIN_RESTAURANTS['roma'];
MICHELIN_RESTAURANTS['london'] = MICHELIN_RESTAURANTS['londres'];
MICHELIN_RESTAURANTS['tokyo'] = MICHELIN_RESTAURANTS['tóquio'];
MICHELIN_RESTAURANTS['new york'] = MICHELIN_RESTAURANTS['nova york'];
MICHELIN_RESTAURANTS['lisbon'] = MICHELIN_RESTAURANTS['lisboa'];
MICHELIN_RESTAURANTS['madrid'] = MICHELIN_RESTAURANTS['madri'];
MICHELIN_RESTAURANTS['amsterdam'] = MICHELIN_RESTAURANTS['amsterdã'];
MICHELIN_RESTAURANTS['singapore'] = MICHELIN_RESTAURANTS['singapura'];
MICHELIN_RESTAURANTS['milan'] = MICHELIN_RESTAURANTS['milão'];
MICHELIN_RESTAURANTS['istanbul'] = MICHELIN_RESTAURANTS['istambul'];

/**
 * Find if a restaurant name matches a Michelin entry.
 * Uses fuzzy matching: case-insensitive, partial name match.
 */
export function findMichelinMatch(
  restaurantName: string,
  city: string
): MichelinRestaurant | null {
  if (!restaurantName || !city) return null;

  const cityKey = city.toLowerCase().split(',')[0].trim();
  
  let restaurants = MICHELIN_RESTAURANTS[cityKey];
  
  if (!restaurants) {
    for (const key of Object.keys(MICHELIN_RESTAURANTS)) {
      if (cityKey.includes(key) || key.includes(cityKey)) {
        restaurants = MICHELIN_RESTAURANTS[key];
        break;
      }
    }
  }

  if (!restaurants) return null;

  const nameLower = restaurantName.toLowerCase().trim();

  // Exact match
  const exact = restaurants.find(r => r.name.toLowerCase() === nameLower);
  if (exact) return exact;

  // Partial match
  const partial = restaurants.find(r => {
    const michelinLower = r.name.toLowerCase();
    return nameLower.includes(michelinLower) || michelinLower.includes(nameLower);
  });
  if (partial) return partial;

  // Word-based match (at least 2 words match)
  const nameWords = nameLower.split(/\s+/).filter(w => w.length > 2);
  if (nameWords.length >= 2) {
    const wordMatch = restaurants.find(r => {
      const michelinWords = r.name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const matchCount = nameWords.filter(w => michelinWords.some(mw => mw.includes(w) || w.includes(mw))).length;
      return matchCount >= 2;
    });
    if (wordMatch) return wordMatch;
  }

  return null;
}

/** Get Michelin star display text */
export function getMichelinStarDisplay(stars: number): string {
  return '⭐'.repeat(stars);
}

/** Get total Michelin restaurants count for a city */
export function getMichelinCountForCity(city: string): number {
  const cityKey = city.toLowerCase().split(',')[0].trim();
  return MICHELIN_RESTAURANTS[cityKey]?.length || 0;
}

/** Get top Michelin restaurants for a city (for recommendations) */
export function getTopMichelinForCity(city: string, limit: number = 5): MichelinRestaurant[] {
  const cityKey = city.toLowerCase().split(',')[0].trim();
  const restaurants = MICHELIN_RESTAURANTS[cityKey] || [];
  return [...restaurants].sort((a, b) => b.stars - a.stars).slice(0, limit);
}
