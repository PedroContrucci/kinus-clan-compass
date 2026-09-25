// Chips do Clã = prioridades do wizard (TRAVEL_INTERESTS). Puro, testável.
import { TRAVEL_INTERESTS } from '@/components/wizard/types';

export interface ChipCandidate {
  category: string;
  styleTags: string[];
}

export const PRIORITY_CHIPS = TRAVEL_INTERESTS.map((i) => ({ id: i.id as string, label: `${i.icon} ${i.label}` }));

const FOOD = ['breakfast', 'lunch', 'dinner'];

/** Um item cai no chip quando a tag bate; Gastronomia também pega refeições, Vida Noturna a categoria night. */
export function matchesPriority(item: ChipCandidate, id: string): boolean {
  const tags = item.styleTags.map((t) => t.toLowerCase());
  if (tags.includes(id)) return true;
  if (id === 'gastronomy') return FOOD.includes(item.category);
  if (id === 'nightlife') return item.category === 'night';
  if (id === 'beach') return tags.includes('praia');
  return false;
}
