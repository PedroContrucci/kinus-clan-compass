// timezone — fuso na DATA da viagem e chegada calculada em UTC (MATRIZ-VOO-FUSO §0–§4).
// Puro: Intl + o mapa gerado; sem `new Date()` de "hoje" em nenhum cálculo.
//
// R-V1: chegada = saída local → UTC → + duração → local do destino (offset na data de chegada).
// R-V2: D+n = diferença entre as DATAS locais de saída e chegada, nunca horas somadas.
// R-V3/R-V7: offset de origem E destino, pela data (IANA + Intl), horário de verão incluso.
// R-V6: fuso desconhecido → { diff: 0, tzKnown: false } e a tela diz "a confirmar". Sem número de fallback.
import { format } from 'date-fns';
import { CITY_TIMEZONES } from '@/data/generated/cityTimezones';

/** Origem quando a viagem não declara uma (o padrão do app). */
export const DEFAULT_ORIGIN_CITY = 'São Paulo';

export interface TimezoneDiff {
  /** Destino − origem, em horas, na data pedida. Pode ser decimal (Nova Délhi = +8,5). */
  diff: number;
  tzKnown: boolean;
  originTz: string | null;
  destinationTz: string | null;
  /** Offset UTC do destino na data, em horas (null quando desconhecido). */
  destinationUtcOffset: number | null;
  originCity: string;
}

/** Cidade → IANA, ou null. */
export function cityTimezone(city: string | undefined | null): string | null {
  if (!city) return null;
  return CITY_TIMEZONES[city] ?? null;
}

/** Offset do fuso no instante dado, em minutos (UTC−3 → −180). */
export function tzOffsetMinutes(tz: string, at: Date): number {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' })
    .formatToParts(at)
    .find(p => p.type === 'timeZoneName')?.value ?? '';
  if (name === 'GMT' || name === 'UTC') return 0;
  const m = name.match(/^(?:GMT|UTC)([+-])(\d{1,2})(?::?(\d{2}))?$/);
  if (!m) throw new Error(`offset ilegível para ${tz}: "${name}"`);
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] || 0));
}

/** 'yyyy-MM-dd' da data de calendário (Date local ou ISO). Aceita a chave pronta. */
export function dateKey(date: Date | string): string {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  return format(typeof date === 'string' ? new Date(date) : date, 'yyyy-MM-dd');
}

function keyToUtcMidnight(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/**
 * Diferença de fuso destino − origem NA DATA (meio-dia UTC do dia pedido). Sem fuso
 * conhecido para qualquer das pontas → { diff: 0, tzKnown: false }.
 */
export function getTimezoneDiff(
  origin: string | undefined | null,
  destination: string | undefined | null,
  date: Date | string,
): TimezoneDiff {
  const originCity = origin || DEFAULT_ORIGIN_CITY;
  const originTz = cityTimezone(originCity);
  const destinationTz = cityTimezone(destination);
  if (!originTz || !destinationTz) {
    return { diff: 0, tzKnown: false, originTz, destinationTz, destinationUtcOffset: null, originCity };
  }
  try {
    const at = new Date(keyToUtcMidnight(dateKey(date)) + 12 * 3600_000);
    const o = tzOffsetMinutes(originTz, at);
    const d = tzOffsetMinutes(destinationTz, at);
    return { diff: (d - o) / 60, tzKnown: true, originTz, destinationTz, destinationUtcOffset: d / 60, originCity };
  } catch {
    return { diff: 0, tzKnown: false, originTz, destinationTz, destinationUtcOffset: null, originCity };
  }
}

export interface ArrivalInput {
  /** Data local da saída ('yyyy-MM-dd', Date ou ISO). */
  date: Date | string;
  /** Hora local da saída 'HH:mm'. */
  time: string;
  durationMinutes: number;
  originTz: string;
  destinationTz: string;
}

export interface Arrival {
  /** Hora local de chegada 'HH:mm'. */
  arrivalTime: string;
  /** Data local de chegada 'yyyy-MM-dd'. */
  arrivalDate: string;
  /** D+n sobre datas locais. */
  daysLater: number;
}

/** Chegada local: saída local → UTC → + duração → local do destino. */
export function computeArrival(i: ArrivalInput): Arrival {
  const depKey = dateKey(i.date);
  const [h, mi] = i.time.split(':').map(Number);
  const naive = keyToUtcMidnight(depKey) + ((h || 0) * 60 + (mi || 0)) * 60_000;
  // Offset da origem no instante real da saída (2ª leitura cobre a virada de horário de verão).
  let utc = naive - tzOffsetMinutes(i.originTz, new Date(naive)) * 60_000;
  utc = naive - tzOffsetMinutes(i.originTz, new Date(utc)) * 60_000;

  const arrUtc = utc + i.durationMinutes * 60_000;
  const local = new Date(arrUtc + tzOffsetMinutes(i.destinationTz, new Date(arrUtc)) * 60_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const arrivalDate = `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}`;
  return {
    arrivalTime: `${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`,
    arrivalDate,
    daysLater: Math.round((keyToUtcMidnight(arrivalDate) - keyToUtcMidnight(depKey)) / 86_400_000),
  };
}

/**
 * Fuso da viagem recalculado NA LEITURA (origem, destino, data de ida). Conserta viagens
 * antigas que gravaram o gap de "hoje" em `trip.timezone.diff`, sem regravar nada.
 */
export function tripTimezone(trip: { origin?: string; destination?: string; startDate?: string }): TimezoneDiff {
  return getTimezoneDiff(trip.origin, trip.destination, trip.startDate || new Date(0));
}

function hoursLabel(n: number): string {
  return `${String(Math.abs(n)).replace('.', ',')}h`;
}

/** "+3h" · "-2h" · "0h" · "a confirmar". */
export function formatTzDiff(tz: Pick<TimezoneDiff, 'diff' | 'tzKnown'>): string {
  if (!tz.tzKnown) return 'a confirmar';
  return `${tz.diff > 0 ? '+' : tz.diff < 0 ? '-' : ''}${hoursLabel(tz.diff)}`;
}

/** "UTC+0 (3h à frente de São Paulo)" · "a confirmar". */
export function formatTzInfo(tz: TimezoneDiff): string {
  if (!tz.tzKnown || tz.destinationUtcOffset === null) return 'a confirmar';
  const off = tz.destinationUtcOffset;
  const utc = `UTC${off < 0 ? '-' : '+'}${String(Math.abs(off)).replace('.', ',')}`;
  const rel = tz.diff === 0
    ? `mesmo fuso de ${tz.originCity}`
    : `${hoursLabel(tz.diff)} ${tz.diff > 0 ? 'à frente de' : 'atrás de'} ${tz.originCity}`;
  return `${utc} (${rel})`;
}
