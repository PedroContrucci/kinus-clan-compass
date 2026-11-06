// pax — adultos, crianças e bebês de uma viagem (M20a). Sem imports (roda no Node).
// `travelers` continua sendo o total (adultos + crianças + bebês). Os campos novos entram pela
// index signature do StoredTrip (src/types/trip.ts é intocável), como `childrenCount`.
// Viagem antiga, sem os campos: adults = travelers, children = 0, infants = 0.

export interface Pax {
  adults: number;
  children: number;
  infants: number;
  /** adults + children + infants (= travelers). */
  total: number;
}

const nat = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function paxOf(trip: any): Pax {
  const travelers = Math.max(1, nat(trip?.travelers) ?? 1);
  const adultsRaw = nat(trip?.adults);
  if (adultsRaw === null) return { adults: travelers, children: 0, infants: 0, total: travelers };
  const adults = Math.max(1, adultsRaw);
  const children = nat(trip?.children) ?? 0;
  const infants = nat(trip?.infants) ?? 0;
  return { adults, children, infants, total: Math.max(travelers, adults + children + infants) };
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "2 adultos + 2 crianças (+ 1 bebê)"; sem criança nem bebê: "2 adultos". */
export function paxLabel(p: Pick<Pax, 'adults' | 'children' | 'infants'>): string {
  const parts = [plural(p.adults, 'adulto', 'adultos')];
  if (p.children > 0) parts.push(plural(p.children, 'criança', 'crianças'));
  if (p.infants > 0) parts.push(plural(p.infants, 'bebê', 'bebês'));
  return parts.join(' + ');
}
