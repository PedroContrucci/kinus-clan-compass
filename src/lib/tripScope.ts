// Recorte do que a viagem mostra (C.5a). Tudo derivado na renderização — nada é gravado.
//
// Doméstica x internacional: o voo é quem sabe (`international` gravado pelo flightModel);
// sem voo, o catálogo (região Brasil) ou o país declarado na viagem.
import { findCityInfo } from '@/data/destinationCatalog';
import { DESTINATION_DOCS, getDocsForDestination, type DestinationDocInfo } from '@/data/destinationDocs';
import { getAllExpandedInfo, type CityPdfData } from '@/data/destinationPdfData';
import type { ChecklistItem } from '@/types/trip';

// Aceita SavedTrip/StoredTrip sem cast; os campos fora do tipo são lidos por `extra()`.
type TripLike = { destination?: string; country?: string };
const extra = (trip: TripLike | null | undefined, key: string): unknown =>
  trip ? (trip as Record<string, unknown>)[key] : undefined;

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

export function isDomesticTrip(trip: TripLike | null | undefined): boolean {
  if (!trip) return false;
  const flights = [extra(trip, 'outboundFlight'), extra(trip, 'returnFlight')] as Array<{ international?: unknown } | undefined>;
  for (const f of flights) {
    if (f && typeof f.international === 'boolean') return !f.international;
  }
  if (trip.destination && findCityInfo(trip.destination)?.region === 'Brasil') return true;
  const country = norm(trip.country || '');
  return country === 'brasil' || country === 'brazil';
}

/** Tiles do Financeiro: inteiro até 10 mil; formato k só acima disso. */
export function formatTileBRL(value: number): string {
  const n = Math.round(Number(value) || 0);
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs < 10000) return `${sign}R$ ${abs.toLocaleString('pt-BR')}`;
  const k = (abs / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  return `${sign}R$ ${k}k`;
}

/** Itens do checklist fixo que só existem em viagem internacional. */
export const INTERNATIONAL_ONLY_CHECKLIST_IDS = ['doc-1', 'pre-2', 'pre-3', 'pre-4'] as const;

// ── C.9 — regras do destino ─────────────────────────────────────────────────
// Fonte 1: `destinationDocs` (o mesmo texto que o PDF imprime em DOCUMENTAÇÃO), país resolvido
// pelo catálogo. Fonte 2 (só visto/tomada/Schengen, quando o país não está no docs): `info` do
// pdfData por chave exata. Sem dado → campo undefined → o item não aparece (nunca default "sim").

export type RuleSource = 'docs' | 'pdf';
export interface DestinationRules {
  country?: string;
  international: boolean;
  visaRequired?: boolean;
  visaText?: string;
  vaccineRequired?: boolean;
  /** nome da vacina exigida, quando o texto diz qual */
  vaccine?: string;
  vaccineText?: string;
  /** tipos de tomada do destino, ex. ['C', 'F'] */
  plugTypes?: string[];
  /** "230 V", "127/220 V" */
  voltage?: string;
  /** plugue BR (N, 2 pinos) não encaixa em nenhum tipo do destino */
  plugDiffers?: boolean;
  plugText?: string;
  insuranceMandatory?: boolean;
  currency?: string;
  currencyDiffers?: boolean;
  passportText?: string;
  currencyText?: string;
  source?: RuleSource;
}

const COUNTRY_ALIAS: Record<string, string> = { Inglaterra: 'Reino Unido' };
/** Tipos em que o plugue brasileiro (N, 2 pinos) encaixa. */
const BR_PLUG_FITS = new Set(['C', 'E', 'F', 'N']);

function docsFor(trip: TripLike): DestinationDocInfo | null {
  const dest = trip.destination || '';
  const byCity = getDocsForDestination(dest);
  if (byCity) return byCity;
  const fromCatalog = findCityInfo(dest.split(',')[0].trim())?.country.country;
  for (const c of [fromCatalog, trip.country]) {
    if (!c) continue;
    const doc = DESTINATION_DOCS[COUNTRY_ALIAS[c] || c];
    if (doc) return doc;
  }
  return null;
}

function pdfInfoFor(trip: TripLike): CityPdfData['info'] | null {
  const key = norm((trip.destination || '').split(',')[0]);
  return key ? getAllExpandedInfo()[key] ?? null : null;
}

function parsePlug(text: string): { types?: string[]; voltage?: string } {
  const t = text.match(/tipo\s+([A-Z](?:\s*\/\s*[A-Z])*)/);
  const v = text.match(/(\d{3})V(?:\/(\d{3})V)?/);
  return {
    types: t ? t[1].split('/').map((x) => x.trim()) : undefined,
    voltage: v ? `${v[2] ? `${v[1]}/${v[2]}` : v[1]} V` : undefined,
  };
}

/** Texto de visto do pdfData (sem acento): isento/doméstico → false; visto/eVisa/eTA/NZeTA → true. */
function pdfVisaRequired(visa: string): boolean | undefined {
  const v = norm(visa);
  if (/isento|n\/a/.test(v)) return false;
  if (/visto|visa|eta\b|nzeta/.test(v)) return true;
  return undefined;
}

const currencyCode = (text?: string) => text?.match(/\(([A-Z]{3})\)/)?.[1];

export function destinationRules(trip: TripLike | null | undefined): DestinationRules {
  if (!trip) return { international: false };
  const international = !isDomesticTrip(trip);
  const docs = docsFor(trip);
  const pdf = docs ? null : pdfInfoFor(trip);
  const city = findCityInfo((trip.destination || '').split(',')[0].trim());

  const visaText = docs?.visto ?? pdf?.visa;
  const visaRequired = docs ? !docs.vistoIsento : pdf ? pdfVisaRequired(pdf.visa) : undefined;
  const plugText = docs?.tomada ?? pdf?.voltage;
  const plug = plugText ? parsePlug(plugText) : {};
  const currency = currencyCode(docs?.moeda) ?? city?.city.currency ?? currencyCode(pdf?.currency);
  const vaccineText = docs?.vacina;

  return {
    country: docs?.country ?? city?.country.country ?? (trip.country || undefined),
    international,
    visaRequired,
    visaText,
    vaccineRequired: docs ? docs.vacinaObrigatoria : undefined,
    vaccine: docs?.vacinaObrigatoria && vaccineText && /febre amarela/i.test(vaccineText) ? 'febre amarela' : undefined,
    vaccineText,
    plugTypes: plug.types,
    voltage: plug.voltage,
    plugDiffers: plug.types ? !plug.types.some((t) => BR_PLUG_FITS.has(t)) : undefined,
    plugText,
    insuranceMandatory: visaText ? /schengen/i.test(visaText) : undefined,
    currency,
    currencyDiffers: currency ? currency !== 'BRL' : undefined,
    passportText: docs?.passaporte,
    currencyText: docs?.moeda ?? pdf?.currency,
    source: docs ? 'docs' : pdf ? 'pdf' : undefined,
  };
}

const plugLabel = (r: DestinationRules) =>
  `tipo ${r.plugTypes?.join('/')}${r.voltage ? ` · ${r.voltage}` : ''}`;

/** Uma linha: "Portugal · sem visto até 90 dias · sem vacina · tomada C/F 230 V · seguro obrigatório". */
export function rulesSummary(r: DestinationRules): string | null {
  const parts: string[] = [];
  if (r.visaRequired === false) {
    const days = r.visaText?.match(/até (\d+) dias|ate (\d+) dias/);
    parts.push(days ? `sem visto até ${days[1] || days[2]} dias` : 'sem visto');
  } else if (r.visaRequired === true) {
    parts.push('visto ou autorização de entrada');
  }
  if (r.vaccineRequired === false) parts.push('sem vacina');
  else if (r.vaccineRequired === true) parts.push(r.vaccine ? `vacina obrigatória: ${r.vaccine}` : 'vacina obrigatória');
  if (r.plugTypes) parts.push(`tomada ${r.plugTypes.join('/')}${r.voltage ? ` ${r.voltage}` : ''}`);
  if (r.insuranceMandatory) parts.push('seguro obrigatório');
  if (parts.length === 0) return null;
  return [r.country, ...parts].filter(Boolean).join(' · ');
}

/**
 * Recorte do checklist gravado (a lista fixa mora em src/types/trip.ts, intocável), lido das
 * regras do destino. Devolve os rótulos ajustados e os ids a esconder — quem renderiza soma ao
 * próprio `hiddenIds`, então o item escondido também sai do contador.
 */
export function scopeChecklist(items: ChecklistItem[], rules: DestinationRules): { items: ChecklistItem[]; hiddenIds: string[] } {
  const hidden = new Set<string>();
  if (!rules.international) INTERNATIONAL_ONLY_CHECKLIST_IDS.forEach((id) => hidden.add(id));
  if (rules.visaRequired !== true) hidden.add('doc-2');
  if (rules.vaccineRequired !== true) hidden.add('pre-1');

  const label = (i: ChecklistItem): string => {
    switch (i.id) {
      case 'doc-2': return 'Visto ou autorização de entrada';
      case 'doc-3': return rules.insuranceMandatory ? 'Seguro viagem obrigatório (Schengen)' : 'Seguro viagem (recomendado)';
      case 'pre-1': return rules.vaccine ? `Vacina obrigatória — ${rules.vaccine} (CIVP)` : 'Vacina obrigatória (ver regras do destino)';
      case 'pack-3': return rules.plugDiffers ? `Adaptador de tomada (${plugLabel(rules)}) e carregadores` : 'Carregadores';
      default: return i.label;
    }
  };
  return {
    items: items.map((i) => {
      const l = label(i);
      return l === i.label ? i : { ...i, label: l };
    }),
    hiddenIds: items.filter((i) => hidden.has(i.id)).map((i) => i.id),
  };
}

export type PriceCheck = { price: number; delta?: number; checkedAt?: number; source?: string; roundTrip?: boolean };

/**
 * Só compara preço real com preço real da mesma fonte e do mesmo formato (ida e volta).
 * Hoje a consulta grava a tarifa só de ida × 2, sem `source`, contra um voo planejado que
 * em geral é estimativa (route/tier) — então isto devolve false até haver real vs real.
 */
export function isPriceCheckComparable(trip: TripLike | null | undefined, check?: PriceCheck | null): boolean {
  const pc = check ?? ((extra(trip, 'lastPriceCheck') as PriceCheck | undefined) || null);
  if (!pc || !pc.source || pc.roundTrip !== true) return false;
  const out = extra(trip, 'outboundFlight') as { source?: string; priceSource?: string } | undefined;
  if (!out || !out.source || out.source === 'estimate') return false;
  return out.priceSource === pc.source;
}

export const NO_COMPARABLE_PRICE_REPLY = 'Ainda não tenho preço real comparável para esta rota.';

/** Resposta do agente (`verificar_ofertas`): sem fonte comparável, nunca um número. */
export function buildOfferCheckReply(
  trip: TripLike,
  check: PriceCheck,
  anchor: number,
  kiwiUrl: string,
): string {
  if (!isPriceCheckComparable(trip, check) || !(anchor > 0)) {
    return kiwiUrl ? `${NO_COMPARABLE_PRICE_REPLY} ${kiwiUrl}` : NO_COMPARABLE_PRICE_REPLY;
  }
  const fmt = (n: number) => `R$ ${Math.round(n).toLocaleString('pt-BR')}`;
  const comparable = check.price;
  if (comparable <= anchor * 0.95) {
    return `📉 Achei voo por ${fmt(comparable)} — ${fmt(anchor - comparable)} abaixo do seu planejado (${fmt(anchor)}). Vale garantir: ${kiwiUrl}`;
  }
  if (comparable <= anchor * 1.05) {
    return `➡️ Preços estáveis: melhor voo agora ${fmt(comparable)} vs ${fmt(anchor)} planejado. ${kiwiUrl}`;
  }
  return `📈 Voos subiram: melhor agora ${fmt(comparable)} vs ${fmt(anchor)} planejado. ${kiwiUrl}`;
}
