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
// A PORTA ABRIU EM 10/09/2026: o GRANT e a RLS de `events` foram aplicados e provados no
// projeto. Até ali nada gravava — e não era só o grant: o antigo `trackOnboarding` tentava
// três formatos de coluna (`type/payload`, `event_type/data`, `name/properties`) e nenhum
// dos três era o desta tabela, cuja coluna é `props`.
//
// É por isso que o anel local NÃO é decoração, e continua não sendo depois do grant. Cada
// evento entra no anel primeiro e sai dele quando o kinu-beta aceita: enquanto a resposta
// não vem (sem rede, RLS negando), nada se perde — o primeiro evento emitido depois que a
// porta responde carrega consigo a fila acumulada.
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

/**
 * Identidade de uma entrada para o read-modify-write da drenagem.
 *
 * AS PROPS FAZEM PARTE DA IDENTIDADE, e isso não é zelo: `ts|name` colide sempre que dois
 * eventos do MESMO nome saem no mesmo milissegundo, que é o caso normal de quem emite em
 * laço — a varredura do `tripEvents` concluindo três viagens, o motor de conquistas gravando
 * dois troféus. Na colisão, a marcação de entregue pegava as DUAS entradas enquanto só uma
 * tinha sido inserida: a segunda ficava `sent: true` sem nunca ter chegado no kinu-beta, e
 * sumia em silêncio. Duas entradas com mesmo ts, mesmo nome E mesmas props são o mesmo evento;
 * aí colapsar é o certo.
 */
const keyOf = (e: KinuEvent) => `${e.ts}|${e.name}|${JSON.stringify(e.props)}`;

/** A identidade de um evento para o dedupe: nome + props + dono. */
const signatureOf = (name: string, props: EventProps, userId?: string) =>
  JSON.stringify([name, props, userId ?? null]);

/**
 * A última emissão ACEITA nesta sessão — em memória, não no anel.
 *
 * O anel não serve como única referência do dedupe por dois motivos medidos: ele pode nem
 * receber a emissão (storage bloqueado devolve `enqueued: false` e o evento vai direto),
 * e depender de um round-trip pelo localStorage para saber o que acabou de sair é frágil
 * justamente no caso que importa, o de duas emissões no MESMO tick.
 */
let lastAccepted: { signature: string; enqueued: boolean } | null = null;

/**
 * Dedupe no EMISSOR, não em cada tela.
 *
 * React remonta e o roteiro re-renderiza a cada troca de dia: sem esta guarda, um
 * `hotel.reasons_viewed` viraria 50 cópias e o anel de 50 morreria no nascimento. A regra
 * é estreita de propósito — só o evento IDÊNTICO ao último é descartado. Dois eventos
 * iguais separados por qualquer outro são dois eventos de verdade.
 *
 * A memória manda quando existe; o anel é a referência só na PRIMEIRA emissão da sessão,
 * que é quando a memória ainda não sabe nada e o rastro do carregamento anterior é o único
 * que existe (o remonte depois de um F5 emite o mesmo `reasons_viewed`).
 */
function isDuplicate(events: KinuEvent[], signature: string): boolean {
  // Anel vazio depois de uma emissão que ENTROU nele = alguém limpou o storage por fora
  // (outra aba, DevTools, o `beforeEach` de um teste). A memória virou lixo; o anel manda.
  if (lastAccepted?.enqueued && events.length === 0) lastAccepted = null;
  if (lastAccepted) return lastAccepted.signature === signature;

  const last = events[events.length - 1];
  return Boolean(last) && signatureOf(last.name, last.props, last.userId) === signature;
}

// ---------------------------------------------------------------------------
// O sino do emissor — quem quer saber que um fato aconteceu
// ---------------------------------------------------------------------------

type EventListener = (name: string) => void;

const listeners = new Set<EventListener>();

/**
 * Assina as emissões ACEITAS. Devolve o unsubscribe.
 *
 * Existe para o motor de conquistas (`achievementEngine.ts`), que precisa recalcular quando um
 * fato novo acontece — e não a cada mexida no roteiro. Assinar o `tripStore` seria mais fácil e
 * mais errado: arrastar uma atividade toca o sino do store e não é fato nenhum.
 *
 * Toca com o NOME, não com o evento inteiro: quem assina vai ler a tabela de qualquer jeito, e
 * entregar as props aqui convidaria alguém a computar conquista em cima do anel local.
 *
 * Mesmo contrato do `subscribeTrips` e do `subscribeSession`: não replica nada na assinatura.
 */
export function subscribeEvents(listener: EventListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Um listener que lança não pode derrubar a emissão — é a invariante do arquivo, e quem chama
// `trackEvent` é uma tela.
function emit(name: string): void {
  listeners.forEach((listener) => {
    try {
      listener(name);
    } catch (err) {
      console.warn('[kinuEvents] listener lançou exceção — ignorado', err);
    }
  });
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
 * Uma passada pela fila. Nunca lança.
 *
 * Read-modify-write na marcação: a fila é relida DEPOIS dos inserts, porque uma emissão
 * nova pode ter entrado no anel enquanto o request estava no ar — reescrever a lista antiga
 * apagaria esse evento.
 */
async function drainOnce(): Promise<void> {
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

/** A drenagem em curso, quando há uma. */
let draining: Promise<void> | null = null;
/** Chegou evento novo enquanto a drenagem estava no ar? Ela dá mais uma volta. */
let drainAgain = false;

/**
 * Manda os pendentes para o kinu-beta, UMA DRENAGEM POR VEZ.
 *
 * O `pending` é lido do anel e o `sent: true` só é gravado DEPOIS dos inserts — então duas
 * drenagens no ar ao mesmo tempo leem a mesma fila e entregam a mesma linha duas vezes.
 * Foi assim que uma troca de hotel virou duas linhas idênticas a 10ms na tabela `events`:
 * o `hotel.swapped` abriu uma drenagem, o `hotel.reasons_viewed` do re-render abriu outra
 * antes da primeira terminar, e a segunda reenviou o `swapped` que ainda estava pendente.
 * Não era emissão dobrada — era entrega dobrada, com UMA entrada no anel.
 *
 * Serializar não pode custar evento: quem chega no meio marca `drainAgain` e a drenagem
 * em curso volta para a fila em vez de deixar o último evento esperando a próxima emissão.
 *
 * Exportada para o teste. Nunca lança.
 */
export function flushEvents(): Promise<void> {
  if (draining) {
    drainAgain = true;
    return draining;
  }

  draining = (async () => {
    try {
      do {
        drainAgain = false;
        await drainOnce();
      } while (drainAgain);
    } finally {
      draining = null;
    }
  })();

  return draining;
}

/**
 * Registra um evento. Fire-and-forget: grava no anel, tenta o kinu-beta por fora e volta
 * na hora. NUNCA LANÇA e nunca espera rede — quem chama é uma tela.
 *
 * `userId` é opcional: sem ele, a drenagem usa o uid da sessão corrente.
 */
export function trackEvent(name: string, props: EventProps = {}, userId?: string): void {
  const entry: KinuEvent = { ts: new Date().toISOString(), name, props, userId, sent: false };
  const signature = signatureOf(name, props, userId);
  let enfileirado = false;

  try {
    const events = readEvents();
    if (isDuplicate(events, signature)) return;
    events.push(entry);
    enfileirado = writeEvents(events);
  } catch {
    /* cai no envio direto abaixo */
  }

  // Registrada ANTES do envio: o dedupe da próxima emissão não pode depender de rede nem
  // de storage — dois cliques no mesmo botão acontecem no mesmo tick, antes de qualquer um.
  lastAccepted = { signature, enqueued: enfileirado };

  // Storage bloqueado (navegador privado, cota) não pode significar telemetria zero: sem
  // fila para drenar, o evento vai direto. Sem rede aí ele se perde de verdade — é o
  // único caminho em que isso acontece, e é o único em que não há onde guardar.
  if (enfileirado) void flushEvents();
  else void (async () => { await insertOne(entry, await currentUserId()); })();

  // POR ÚLTIMO, e só para o que passou pelo dedupe: evento descartado não é fato novo, e o sino
  // toca depois da drenagem começar para que quem assina já encontre a entrega em curso.
  emit(name);
}
