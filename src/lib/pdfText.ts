// M8a — helpers puros do PDF (sem imports): texto seguro p/ WinAnsi, culinária PT, plural, escala, clima da mala.

const SYMBOL_MAP: Array<[RegExp, string]> = [
  [/[\u2B50\u2605\u2606\u{1F31F}]/gu, '*'],
  [/[\u2192\u279C\u27A1]/g, '>'],
  [/[\u2713\u2714\u2705]/g, 'ok'],
  [/[\u26A0]/g, '!'],
];

/** Mantém só o que a helvetica (WinAnsi) codifica em 8 bits; um char fora dela quebra a string inteira. */
export function pdfSafe(input: unknown): string {
  let s = String(input ?? '').normalize('NFC');
  for (const [re, rep] of SYMBOL_MAP) s = s.replace(re, rep);
  s = s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/\u2026/g, '...');
  // Latin-1 + extras WinAnsi usados pelo PDF (— – • › ‹ €  ™); resto sai (emoji, VS16, ZWJ...).
  // eslint-disable-next-line no-control-regex
  return s.replace(/[^\x09\x0A\x20-\x7E\xA0-\xFF\u2014\u2013\u2022\u203A\u2039\u20AC\u2122]/gu, '');
}

const CUISINE_PT: Record<string, string> = {
  french: 'Francesa', japanese: 'Japonesa', italian: 'Italiana', portuguese: 'Portuguesa', spanish: 'Espanhola',
  modern: 'Contemporânea', contemporary: 'Contemporânea', creative: 'Criativa', innovative: 'Inovadora',
  seafood: 'Frutos do mar', chinese: 'Chinesa', thai: 'Tailandesa', korean: 'Coreana', indian: 'Indiana',
  mexican: 'Mexicana', peruvian: 'Peruana', brazilian: 'Brasileira', british: 'Britânica', american: 'Americana',
  german: 'Alemã', greek: 'Grega', turkish: 'Turca', moroccan: 'Marroquina', sushi: 'Sushi', steakhouse: 'Churrascaria',
  vegetarian: 'Vegetariana', mediterranean: 'Mediterrânea', cantonese: 'Cantonesa', argentinian: 'Argentina',
  lebanese: 'Libanesa', asian: 'Asiática', 'french-chinese': 'Franco-chinesa',
  traditional: 'Tradicional', classic: 'Clássica', fusion: 'Fusão', 'french contemporary': 'Francesa contemporânea',
  'modern french': 'Francesa contemporânea', 'modern cuisine': 'Contemporânea', 'creative french': 'Francesa criativa',
};

export function cuisinePt(v: string): string {
  const key = String(v ?? '').trim().toLowerCase();
  return CUISINE_PT[key] ?? String(v ?? '');
}

/** "Cozinha French" → "Cozinha Francesa" (fallback: igual). */
export function localizeCuisineTip(s: string): string {
  const m = /^Cozinha\s+(.+)$/.exec(String(s ?? '').trim());
  if (!m) return s;
  const pt = CUISINE_PT[m[1].trim().toLowerCase()];
  return pt ? `Cozinha ${pt}` : s;
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export interface FlightLike {
  isDirect?: boolean;
  connectionCity?: string;
  segments?: Array<{ arrival?: { iataCode?: string } }>;
  baggage?: string;
}

export function stopsLabel(opt?: FlightLike | null): string {
  if (!opt || typeof opt.isDirect !== 'boolean') return 'escala a confirmar';
  if (opt.isDirect) return 'direto';
  const segs = opt.segments ?? [];
  const via = segs.slice(0, -1).map((s) => s.arrival?.iataCode).filter(Boolean) as string[];
  const cities = via.length ? via : opt.connectionCity ? [opt.connectionCity] : [];
  const n = Math.max(cities.length, 1);
  return `${n === 1 ? '1 escala' : `${n} escalas`}${cities.length ? ` (${cities.join(', ')})` : ''}`;
}

export function baggageLabel(opt?: FlightLike | null): string {
  return opt?.baggage ? `bagagem: ${opt.baggage}` : 'bagagem a confirmar';
}

const BEACH_CITIES = ['barcelona', 'rio de janeiro', 'salvador', 'fortaleza', 'porto seguro', 'maceio', 'florianopolis', 'miami', 'cartagena', 'dubai', 'cidade do cabo'];
const SOUTH_COUNTRIES = ['argentina', 'chile', 'australia', 'nova zelandia', 'africa do sul', 'indonesia', 'brasil'];
const norm = (s: string) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

/** month: 1-12. Frio = norte nov–mar | sul jun–ago. Praia só em cidade de praia. */
export function packingClimate(o: { destination: string; country?: string; month: number }): { cold: boolean; beach: boolean } {
  const south = SOUTH_COUNTRIES.includes(norm(o.country ?? ''));
  const m = o.month;
  const cold = south ? m >= 6 && m <= 8 : m >= 11 || m <= 3;
  const dest = norm(o.destination);
  return { cold, beach: BEACH_CITIES.some((c) => dest.includes(c)) };
}

/** 'YYYY-MM-DD' → mês 1-12 sem passar por Date/UTC; fallback 7. */
export function monthOf(startDate?: string): number {
  const m = /^\d{4}-(\d{2})/.exec(startDate ?? '');
  const n = m ? parseInt(m[1], 10) : 0;
  return n >= 1 && n <= 12 ? n : 7;
}
