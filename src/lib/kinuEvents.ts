// kinuEvents — as decisões do usuário viram linhas na tabela `events` do kinu-beta.
//
// Emissor ÚNICO do app. O `trackOnboarding` (lib/onboarding.ts) delega para cá, então
// existe um só lugar que conhece o schema, um só lugar que decide o que fazer quando a
// gravação falha, e um só lugar para consertar quando o motor de conquistas nascer.
//
// SCHEMA REAL, lido do OpenAPI do PostgREST do kinu-beta em 09/09/2026 (não adivinhado):
//   events(id bigserial pk, user_id uuid NULL, name text NOT NULL,
//          props jsonb NOT NULL, created_at timestamptz default now())
//
// ATENÇÃO — A PORTA ESTÁ FECHADA HOJE. Medido com curl contra o projeto:
//   anon         -> INSERT: 42501 "permission denied for table events"
//   service_role -> SELECT: 42501 "permission denied for table events"
// A tabela existe e está exposta, mas nenhum GRANT foi aplicado. Consequência que vale
// dizer em voz alta: o `trackOnboarding` nunca gravou um evento — nem por causa disso,
// ele também tentava três formatos de coluna e NENHUM dos três era o desta tabela
// (`type/payload`, `event_type/data`, `name/properties` — a coluna é `props`).
//
// É por isso que o anel local NÃO é decoração. Cada evento entra no anel primeiro e sai
// dele quando o kinu-beta aceita. Enquanto o GRANT não for aplicado (o SQL está no
// relatório deste arco), nada se perde: o primeiro evento emitido depois do grant
// carrega consigo a fila acumulada.
//
// INVARIANTE: nada aqui lança, nunca. Telemetria que derruba a tela é pior que
// telemetria que falta — é o mesmo compromisso do anel `kinu_sync_log` (tripSync.ts).
import { kinuBeta } from '@/integrations/kinu-beta/client';
import { loadJson } from '@/lib/safeStorage';

export const EVENTS_KEY = 'kinu_events';

/** 50 entradas, o mesmo tamanho do `kinu_sync_log`. Estoura pelo mais velho. */
const RING_LIMIT = 50;

/** Quantos pendentes uma emissão tenta drenar. Limite existe para uma fila de 50 acumulada
 *  offline não virar 50 requests no primeiro clique depois que a rede volta. */
const DRAIN_LIMIT = 10;

export type EventProps = Record<string, string | number | boolean>;

export interface KinuEvent {
  /** ISO. Também é metade da identidade da entrada na hora de marcar como enviada. */
  ts: string;
  name: string;
  props: EventProps;
  userId?: string;
  /** Já aceito pelo kinu-beta? `false` volta na próxima drenagem. */
  sent: boolean;
}

function isEvent(value: unknown): value is KinuEvent {
  const e = value as KinuEvent | null;
  return Boolean(e)
    && typeof e.ts === 'string'
    && typeof e.name === 'string'
    && typeof e.props === 'object' && e.props !== null
    && typeof e.sent === 'boolean';
}

/** Nunca lança, sempre array. Entrada torta é descartada em silêncio: o anel é descartável. */
export function readEvents(): KinuEvent[] {
  const raw = loadJson<unknown>(EVENTS_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter(isEvent);
}

/** `false` quando o storage recusou (cota, navegador privado). Quem chama decide o plano B. */
function writeEvents(events: KinuEvent[]): boolean {
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(-RING_LIMIT)));
    return true;
  } catch {
    return false;
  }
}

/** Identidade de uma entrada para o read-modify-write da drenagem. */
const keyOf = (e: KinuEvent) => `${e.ts}|${e.name}`;

/**
 * Dedupe no EMISSOR, não em cada tela.
 *
 * React remonta e o roteiro re-renderiza a cada troca de dia: sem esta guarda, um
 * `hotel.reasons_viewed` viraria 50 cópias e o anel de 50 morreria no nascimento. A regra
 * é estreita de propósito — só o evento IDÊNTICO ao último é descartado. Dois eventos
 * iguais separados por qualquer outro são dois eventos de verdade.
 */
function isDuplicateOfLast(events: KinuEvent[], name: string, props: EventProps, userId?: string): boolean {
  const last = events[events.length - 1];
  if (!last || last.name !== name || last.userId !== userId) return false;
  return JSON.stringify(last.props) === JSON.stringify(props);
}

/** O uid da sessão, quando quem emite não sabe quem é o usuário. Nunca lança. */
async function currentUserId(): Promise<string | undefined> {
  try {
    const { data } = await kinuBeta.auth.getSession();
    return data?.session?.user?.id ?? undefined;
  } catch {
    return undefined;
  }
}

/** Uma linha na tabela. `true` = aceita. Nunca lança. */
async function insertOne(event: KinuEvent, fallbackUid?: string): Promise<boolean> {
  try {
    const { error } = await kinuBeta.from('events').insert({
      user_id: event.userId ?? fallbackUid ?? null,
      name: event.name,
      props: event.props,
    } as never);
    // Falha para: sem rede, sem GRANT (42501), RLS.
    return !error;
  } catch {
    return false;
  }
}

/**
 * Manda os pendentes para o kinu-beta, do mais antigo para o mais novo.
 *
 * Read-modify-write na marcação: a fila é relida DEPOIS dos inserts, porque uma emissão
 * nova pode ter entrado no anel enquanto o request estava no ar — reescrever a lista antiga
 * apagaria esse evento.
 *
 * Exportada para o teste. Nunca lança.
 */
export async function flushEvents(): Promise<void> {
  try {
    const pending = readEvents().filter((e) => !e.sent).slice(0, DRAIN_LIMIT);
    if (pending.length === 0) return;

    const fallbackUid = await currentUserId();
    const delivered = new Set<string>();

    for (const event of pending) {
      // `break` e não `continue`: a fila é cronológica, e pular o que falhou entregaria
      // o evento novo antes do velho. A entrada fica e a próxima emissão tenta de novo.
      if (!(await insertOne(event, fallbackUid))) break;
      delivered.add(keyOf(event));
    }

    if (delivered.size === 0) return;
    writeEvents(readEvents().map((e) => (delivered.has(keyOf(e)) ? { ...e, sent: true } : e)));
  } catch {
    /* invariante: nada aqui lança */
  }
}

/**
 * Registra um evento. Fire-and-forget: grava no anel, tenta o kinu-beta por fora e volta
 * na hora. NUNCA LANÇA e nunca espera rede — quem chama é uma tela.
 *
 * `userId` é opcional: sem ele, a drenagem usa o uid da sessão corrente.
 */
export function trackEvent(name: string, props: EventProps = {}, userId?: string): void {
  const entry: KinuEvent = { ts: new Date().toISOString(), name, props, userId, sent: false };
  let enfileirado = false;

  try {
    const events = readEvents();
    if (isDuplicateOfLast(events, name, props, userId)) return;
    events.push(entry);
    enfileirado = writeEvents(events);
  } catch {
    /* cai no envio direto abaixo */
  }

  // Storage bloqueado (navegador privado, cota) não pode significar telemetria zero: sem
  // fila para drenar, o evento vai direto. Sem rede aí ele se perde de verdade — é o
  // único caminho em que isso acontece, e é o único em que não há onde guardar.
  if (enfileirado) void flushEvents();
  else void (async () => { await insertOne(entry, await currentUserId()); })();
}
