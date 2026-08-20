/**
 * tripSync.ts — o espelho de ESCRITA: localStorage -> kinu-beta.
 *
 * O QUE ESTE ARQUIVO É (recon §0): a segunda porta. O `tripStore` do Arco 1 continua
 * síncrono, hermético e sem saber que existe banco; este módulo assina o sino dele,
 * descobre o que mudou e empurra para o `trips` do kinu-beta em background. Nenhum dos 28
 * pontos de acesso migrados no Arco 1 é tocado, e os 28 testes do store seguem valendo.
 *
 * O QUE ESTE ARQUIVO **NÃO** FAZ, de propósito:
 *   - não LÊ do banco (nenhum `select`): hidratação é a 4f;
 *   - não ADOTA viagens que já estavam no navegador: adoção é a 4e, com consentimento;
 *   - não espelha `kinu_price_history_*` nem qualquer outra chave (recon §2.5).
 *
 * A CONSEQUÊNCIA DA REGRA DA ADOÇÃO, declarada: o snapshot é semeado no `startTripSync()`
 * sem enfileirar nada, e o handler atualiza o snapshot mesmo sem sessão. Logo, uma escrita
 * feita ANTES do login **não sobe nunca** — o diff não a vê como novidade depois. Isso é
 * deliberado: se o espelho subisse o passado no primeiro login, ele estaria adotando dados
 * de quem quer que tenha usado aquele navegador (recon §3.4a, risco 1). A 4e é o lugar de
 * trazer o passado, e ela pergunta antes.
 *
 * CONSISTÊNCIA EVENTUAL, também declarada (risco 3): uma escrita local pode não estar no
 * banco no instante seguinte. O outbox persistente é o que impede que ela se perca — o
 * único jeito de perder de vez é aquele navegador nunca mais ser aberto.
 *
 * MULTI-DISPOSITIVO na Fase B é last-write-wins com o documento inteiro como unidade
 * (risco 6) — a mesma semântica que o localStorage já tem hoje.
 */

import { kinuBeta } from '@/integrations/kinu-beta/client';
import { getCurrentUserId, isSessionResolved, subscribeSession } from '@/lib/session';
import { listTrips, subscribeTrips, StoredTrip } from '@/lib/tripStore';
import { loadJson } from '@/lib/safeStorage';

export const OUTBOX_KEY = 'kinu_trips_outbox';

/** Gravado explicitamente em toda linha: o espelho não confia no default da coluna (§2.3). */
export const SCHEMA_VERSION = 1;

/** Recon §3.3: payload de viagem é gordo. A unidade é a linha; não há "meia viagem". */
const BATCH_SIZE = 5;

/**
 * Trava do laço de drenagem. Toda volta do laço tem de tirar ao menos um item do outbox
 * (sucesso), marcá-lo (`blocked`) ou sair; se um bug futuro quebrar essa invariante, isto
 * é o que evita travar a aba num laço infinito de requests.
 */
const MAX_ROUNDS = 200;

/** Anel de diagnóstico do espelho (recon §7.2). Não é fila: perder evento antigo é o desenho. */
export const SYNC_LOG_KEY = 'kinu_sync_log';

/** 50 eventos. Mesmo idioma do anel de `pushPriceSnapshot` no tripStore (`shift()` no topo). */
const LOG_LIMIT = 50;

export type OutboxOp = 'upsert' | 'delete';

/**
 * Uma op pendente. `seq` é monotônico dentro do outbox e serve a duas coisas: ordem FIFO
 * da drenagem e identidade da tentativa — a remoção pós-sucesso casa `(id, seq)`, então uma
 * escrita nova que aconteceu durante o voo não é apagada pela resposta do lote antigo.
 *
 * `uid` é o dono da op — quem estava logado quando ela foi enfileirada. O flush só drena o
 * que é seu, e isto fecha uma janela estreita mas real: A edita offline, faz logout, B loga
 * no mesmo navegador, a rede volta — sem o `uid`, a viagem de A nasceria na conta de B, que
 * é adoção silenciosa pela porta de trás (a 4e é quem adota, e ela pergunta antes).
 * Entradas de outro dono ficam paradas e visíveis em `getOutboxLength()`.
 *
 * `blocked` marca o que a policy recusou (`42501`): fica registrado, visível em
 * `getOutboxLength()`, e **não é retentado** — 42501 não melhora com repetição (risco 3.4c).
 */
export interface OutboxEntry {
  op: OutboxOp;
  id: string;
  seq: number;
  uid: string;
  blocked?: boolean;
}

/** A linha do `trips`. Estes quatro campos, nem um a mais (§2.2, risco 4). */
export interface TripRow {
  id: string;
  user_id: string;
  payload: StoredTrip;
  schema_version: number;
}

export interface FlushError {
  code: string | null;
  message: string;
  at: string;
}

/**
 * Uma TENTATIVA de flush, por op. Sucesso e falha, os dois — um log que só registra erro não
 * responde "o espelho está funcionando?", só "o espelho quebrou".
 *
 * `code` só existe em falha, e vem `null` quando a falha não trouxe código do PostgREST (rede
 * caída, por exemplo): `null` aqui é "falhou sem código", que é diferente de ausente.
 */
export interface SyncLogEvent {
  ts: string;
  op: OutboxOp;
  id: string;
  ok: boolean;
  code?: string | null;
}

/**
 * O retrato do lado LOCAL do espelho. `pending + blocked + foreignOwner === total do outbox`,
 * sempre — é a invariante que a 4c deixou faltando (relatório 4c §9 item 4: um número só não
 * distinguia os três casos).
 */
export interface SyncStatus {
  ownerUserId: string | null;
  sessionResolved: boolean;
  outbox: {
    pending: number;
    blocked: number;
    foreignOwner: number;
    ids: { pending: string[]; blocked: string[]; foreignOwner: string[] };
  };
  lastFlushAt: string | null;
  lastFlushError: FlushError | null;
  errors24h: number;
  inFlight: boolean;
}

// ---------------------------------------------------------------------------
// Estado do módulo — vive o tempo do documento, como no session.ts
// ---------------------------------------------------------------------------

let started = false;
let inFlight = false;
let snapshot = new Map<string, string>();
let lastFlushError: FlushError | null = null;
let lastFlushAt: string | null = null;
let profileInsertTried = false;

// ---------------------------------------------------------------------------
// O guard — a regra mais importante do arquivo
// ---------------------------------------------------------------------------

/**
 * O usuário para quem espelhar, ou `null`.
 *
 * `isSessionResolved()` é obrigatório aqui: no boot o `getCurrentUserId()` é `null` porque
 * a resposta do GoTrue não chegou, não porque o usuário é anônimo (session.ts, 4b). Tratar
 * um pelo outro faria o espelho considerar "sem sessão" alguém que está a 200ms de aparecer.
 */
function activeUserId(): string | null {
  if (!isSessionResolved()) return null;
  return getCurrentUserId();
}

// ---------------------------------------------------------------------------
// Hash do payload — barato, determinístico, sem dependência nova
// ---------------------------------------------------------------------------

function hashTrip(trip: StoredTrip): string {
  const json = JSON.stringify(trip);

  // djb2-xor. O `^` já reduz a int32 a cada volta, então `h` nunca sai da faixa exata dos
  // doubles. O comprimento vai concatenado: 32 bits sozinhos colidem cedo demais para o
  // gosto de quem decide o que sobe para o banco.
  let h = 5381;
  for (let i = 0; i < json.length; i += 1) {
    h = (h * 33) ^ json.charCodeAt(i);
  }

  return `${(h >>> 0).toString(36)}:${json.length}`;
}

function tripId(trip: StoredTrip): string | null {
  return typeof trip?.id === 'string' && trip.id ? trip.id : null;
}

// ---------------------------------------------------------------------------
// Outbox — read-modify-write, sempre (a regra de ouro do Arco 1)
// ---------------------------------------------------------------------------

/**
 * `uid` é obrigatório: a chave nasce neste arco, então não existe entrada legada sem dono
 * para preservar. Entrada sem `uid` é entrada torta — descartada com aviso, e não drenada
 * sob a sessão de quem estiver logado no momento.
 */
function isEntry(value: unknown): value is OutboxEntry {
  const entry = value as OutboxEntry | null;
  return Boolean(entry)
    && typeof entry.id === 'string'
    && (entry.op === 'upsert' || entry.op === 'delete')
    && typeof entry.seq === 'number'
    && typeof entry.uid === 'string';
}

/** Nunca lança, sempre array, entrada torta é descartada — mesmo contrato do `readRaw`. */
function readOutbox(): OutboxEntry[] {
  const raw = loadJson<unknown>(OUTBOX_KEY, []);

  if (!Array.isArray(raw)) {
    console.warn(`[tripSync] ${OUTBOX_KEY} não é um array — tratando como vazio`);
    return [];
  }

  const usable = raw.filter(isEntry);
  if (usable.length !== raw.length) {
    console.warn(
      `[tripSync] ${raw.length - usable.length} entrada(s) inválida(s) no outbox descartada(s)`,
    );
  }

  return usable;
}

function writeOutbox(entries: OutboxEntry[]): void {
  if (entries.length === 0) {
    localStorage.removeItem(OUTBOX_KEY);
    return;
  }
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(entries));
}

/**
 * Enfileira ops. Uma op por id: a mais recente vence — `delete` depois de `upsert` deixa só
 * o `delete`, `upsert` depois de `delete` deixa só o `upsert` (risco 10: é isto que impede
 * duas abas reordenadas de ressuscitarem uma viagem apagada).
 *
 * Reenfileirar um id limpa o `blocked`: uma escrita local nova merece uma tentativa nova.
 *
 * O `seq` sai do MÁXIMO do outbox lido agora, não de um contador em memória — duas abas
 * compartilham a chave e nenhuma delas conhece o contador da outra.
 */
function enqueue(ops: Array<{ op: OutboxOp; id: string }>, uid: string): void {
  if (ops.length === 0) return;

  const entries = readOutbox();
  const byId = new Map(entries.map((entry) => [entry.id, entry] as const));
  let seq = entries.reduce((max, entry) => Math.max(max, entry.seq), 0);

  ops.forEach(({ op, id }) => {
    seq += 1;
    byId.set(id, { op, id, seq, uid });
  });

  writeOutbox([...byId.values()].sort((a, b) => a.seq - b.seq));
}

/**
 * A PORTA DA ADOÇÃO (4e) — o único caminho pelo qual o PASSADO entra na fila.
 *
 * O sino do `tripStore` só enfileira o que MUDOU depois do login (ver o cabeçalho deste
 * arquivo); trazer o que já estava no navegador é decisão do usuário, e quem a coleta é o
 * `tripAdoption.ts`. Esta função existe para que ele não precise conhecer o formato do
 * outbox: `seq`, `uid`, `blocked` e a regra "op mais recente por id vence" continuam sendo
 * segredo daqui, e a adoção herda os três de graça por passar pelo mesmo `enqueue()`.
 *
 * Não faz flush: quem chama decide quando (a adoção grava o marcador antes de disparar).
 */
export function enqueueUpserts(ids: string[], uid: string): void {
  enqueue(ids.map((id) => ({ op: 'upsert' as const, id })), uid);
}

/**
 * Tira do outbox as entradas que subiram. Casa `(id, seq)`: se o mesmo id foi reenfileirado
 * durante o voo, ele tem `seq` novo e SOBREVIVE. Sem essa comparação, o espelho perderia
 * silenciosamente a última edição do usuário — exatamente a classe de bug que o Arco 1 matou.
 */
function settle(done: OutboxEntry[]): void {
  if (done.length === 0) return;
  const seqs = new Map(done.map((entry) => [entry.id, entry.seq] as const));
  writeOutbox(readOutbox().filter((entry) => seqs.get(entry.id) !== entry.seq));
}

function markBlocked(batch: OutboxEntry[]): void {
  const seqs = new Map(batch.map((entry) => [entry.id, entry.seq] as const));
  writeOutbox(
    readOutbox().map((entry) => (
      seqs.get(entry.id) === entry.seq ? { ...entry, blocked: true } : entry
    )),
  );
}

// ---------------------------------------------------------------------------
// kinu_sync_log — o anel de diagnóstico (recon §7.2)
// ---------------------------------------------------------------------------

function isLogEvent(value: unknown): value is SyncLogEvent {
  const event = value as SyncLogEvent | null;
  return Boolean(event)
    && typeof event.ts === 'string'
    && typeof event.id === 'string'
    && (event.op === 'upsert' || event.op === 'delete')
    && typeof event.ok === 'boolean';
}

/**
 * Nunca lança, sempre array. Sem `console.warn` para log torto, de propósito: barulho SOBRE o
 * diagnóstico é pior que o diagnóstico faltando — e este anel é descartável por natureza.
 */
function readLog(): SyncLogEvent[] {
  const raw = loadJson<unknown>(SYNC_LOG_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter(isLogEvent);
}

/**
 * Registra uma tentativa por op, e marca o `lastFlushAt`.
 *
 * NUNCA LANÇA — e isso é requisito, não zelo: um `QuotaExceededError` gravando diagnóstico não
 * pode derrubar o flush que estava funcionando. O `lastFlushAt` é marcado ANTES da gravação,
 * porque a tentativa aconteceu mesmo que o registro dela não caiba no storage.
 *
 * Read-modify-write, como todo o resto: duas abas espelhando compartilham este anel.
 */
function logAttempt(entries: OutboxEntry[], ok: boolean, code?: string | null): void {
  if (entries.length === 0) return;

  const ts = new Date().toISOString();
  lastFlushAt = ts;

  try {
    const events = readLog();

    entries.forEach((entry) => {
      events.push(
        ok
          ? { ts, op: entry.op, id: entry.id, ok: true }
          : { ts, op: entry.op, id: entry.id, ok: false, code: code ?? null },
      );
    });

    // Anel: o mais antigo sai pela frente. Mesmo `while` do PRICE_HISTORY_LIMIT do tripStore.
    while (events.length > LOG_LIMIT) events.shift();

    localStorage.setItem(SYNC_LOG_KEY, JSON.stringify(events));
  } catch (err) {
    console.warn('[tripSync] não foi possível gravar kinu_sync_log', err);
  }
}

// ---------------------------------------------------------------------------
// Diff por snapshot (recon §4.3, opção 1)
// ---------------------------------------------------------------------------

/**
 * Compara o `listTrips()` de agora com o snapshot em memória e **substitui** o snapshot.
 *
 * Chamar isto SEM usar o resultado é o que semeia o estado inicial: o próximo diff só vê o
 * que mudou a partir daqui. É também o único mecanismo que funciona para escrita de OUTRA
 * aba (evento `storage`), onde não existe delta para o store informar.
 */
function diffLocal(): { upserts: string[]; deletes: string[] } {
  const next = new Map<string, string>();
  const upserts: string[] = [];

  listTrips().forEach((trip) => {
    const id = tripId(trip);
    if (!id) return; // sem id não há PK possível; o store sempre gera um em addTrip

    const hash = hashTrip(trip);
    next.set(id, hash);
    if (snapshot.get(id) !== hash) upserts.push(id);
  });

  const deletes = [...snapshot.keys()].filter((id) => !next.has(id));
  snapshot = next;

  return { upserts, deletes };
}

// ---------------------------------------------------------------------------
// A linha — único construtor (risco 4)
// ---------------------------------------------------------------------------

/**
 * A ÚNICA função que monta uma linha de `trips`. Exatamente
 * `{ id, user_id, payload, schema_version }`.
 *
 * NUNCA acrescente campo aqui, e nunca espalhe `...trip` no objeto: `status` e `destination`
 * são colunas GERADAS de `payload->>` e `created_at`/`updated_at` têm default e trigger.
 * Enviar qualquer uma delas dá `428C9 cannot insert a non-DEFAULT value into column` e
 * quebra 100% das escritas do arco (recon §2.2). `status` e `destination` continuam indo ao
 * banco — DENTRO do payload, que é de onde o Postgres os projeta.
 *
 * `user_id` vem sempre da sessão (§5.2), nunca de prop, parâmetro de tela ou do payload:
 * `trips.user_id` é `not null` sem default (`23502` se omitido) e a policy `trips_insert_own`
 * exige `user_id = auth.uid()` (`42501` se errado). O `upsert` manda a linha inteira, o que
 * também satisfaz o `with check` do `trips_update_own` (§5.5).
 */
export function toRow(trip: StoredTrip, userId: string): TripRow {
  return {
    id: trip.id,
    user_id: userId,
    payload: trip,
    schema_version: SCHEMA_VERSION,
  };
}

// ---------------------------------------------------------------------------
// Envio
// ---------------------------------------------------------------------------

/**
 * Não é união discriminada de propósito: `tsconfig.app.json` roda com `strict: false`, e sem
 * `strictNullChecks` o TS não estreita `{ok:true} | {ok:false, …}` pelo `ok` — todo acesso a
 * `outcome.code` viraria TS2339. Campos opcionais num único tipo custam menos que 5 casts.
 */
type Outcome = { ok: boolean; code?: string | null; message?: string };

/** Traduz erro do PostgREST OU exceção de rede no mesmo veredito, e registra o último. */
function note(error: unknown): Outcome {
  if (!error) return { ok: true };

  const shaped = error as { code?: unknown; message?: unknown };
  const code = typeof shaped.code === 'string' ? shaped.code : null;
  const message = typeof shaped.message === 'string' ? shaped.message : String(error);

  lastFlushError = { code, message, at: new Date().toISOString() };
  console.warn('[tripSync] falha no flush', code ?? '(sem código)', message);

  return { ok: false, code, message };
}

async function upsertRows(rows: TripRow[]): Promise<Outcome> {
  try {
    const { error } = await kinuBeta.from('trips').upsert(rows, { onConflict: 'id' });
    return note(error);
  } catch (err) {
    // Rede caída rejeita a promessa em vez de devolver `error`. Os dois caminhos são a
    // mesma decisão: mantém no outbox, tenta no próximo gatilho.
    return note(err);
  }
}

/**
 * Fallback defensivo do `23503` (§5.6, risco 8): a FK de `trips.user_id` aponta para
 * `public.profiles`, e o perfil nasce pelo trigger `handle_new_user`. Se o trigger falhou,
 * a policy `profiles_insert_own` permite exatamente este insert. Uma vez por sessão.
 *
 * `name` vai `null` porque este módulo não conhece o nome — `session.ts` só carrega o id, e
 * a coluna é nullable. Não é o caminho normal de criação de perfil; é o remendo.
 */
async function ensureProfile(userId: string): Promise<void> {
  try {
    const { error } = await kinuBeta.from('profiles').insert({ id: userId, name: null });
    if (error) console.warn('[tripSync] insert defensivo em profiles falhou', error);
  } catch (err) {
    console.warn('[tripSync] insert defensivo em profiles lançou', err);
  }
}

/**
 * Envia linhas já montadas.
 *
 * Devolve `true` quando houve PROGRESSO (as entradas saíram do outbox ou foram marcadas) e
 * `false` quando o lote deve ser retentado depois — é este contrato que garante que o laço
 * de drenagem termina.
 */
async function sendPreparedRows(rows: TripRow[], entries: OutboxEntry[]): Promise<boolean> {
  const outcome = await upsertRows(rows);

  // Registra a tentativa ANTES de decidir o que fazer com ela: no caminho do 42501 o lote é
  // reenviado uma linha por vez, e cada reenvio é uma tentativa nova — que aparece no log como
  // tal. "Cada tentativa" é literal.
  logAttempt(entries, outcome.ok, outcome.code);

  if (outcome.ok) {
    settle(entries);
    return true;
  }

  if (outcome.code === '42501') {
    // A policy recusou. Num lote de 5 o erro não diz QUAL linha — isola uma a uma, para não
    // deixar 4 linhas inocentes presas atrás de uma (recon §3.4c).
    if (rows.length === 1) {
      console.error(
        `[tripSync] 42501 (RLS) na viagem ${entries[0].id} — marcada, sem retry`,
        outcome.message,
      );
      markBlocked(entries);
      return true;
    }

    for (let i = 0; i < rows.length; i += 1) {
      await sendPreparedRows([rows[i]], [entries[i]]);
    }
    return true;
  }

  if (outcome.code === '23503' && !profileInsertTried) {
    profileInsertTried = true;
    await ensureProfile(rows[0].user_id);

    const retry = await upsertRows(rows);
    logAttempt(entries, retry.ok, retry.code);

    if (retry.ok) {
      settle(entries);
      return true;
    }
  }

  return false;
}

async function sendUpserts(batch: OutboxEntry[], userId: string): Promise<boolean> {
  const byId = new Map<string, StoredTrip>();
  listTrips().forEach((trip) => {
    const id = tripId(trip);
    if (id) byId.set(id, trip);
  });

  const rows: TripRow[] = [];
  const sending: OutboxEntry[] = [];
  const orphans: OutboxEntry[] = [];

  batch.forEach((entry) => {
    const trip = byId.get(entry.id);
    if (!trip) {
      orphans.push(entry);
      return;
    }
    rows.push(toRow(trip, userId));
    sending.push(entry);
  });

  if (orphans.length > 0) {
    // Upsert de viagem que não existe mais localmente. Pelo "op mais recente por id vence",
    // um delete já teria substituído este upsert — então isto é resto de storage torto.
    // Sai da fila sem gastar request.
    console.warn(
      `[tripSync] ${orphans.length} upsert(s) sem viagem local — descartados do outbox`,
    );
    settle(orphans);
  }

  if (rows.length === 0) return true;

  return sendPreparedRows(rows, sending);
}

/**
 * O delete não filtra por `user_id`: a policy `trips_delete_own` já restringe o alcance, e
 * apagar uma linha que não é sua simplesmente afeta 0 linhas, sem erro. Idempotente.
 */
async function sendDelete(entry: OutboxEntry): Promise<boolean> {
  let outcome: Outcome;

  try {
    const { error } = await kinuBeta.from('trips').delete().eq('id', entry.id);
    outcome = note(error);
  } catch (err) {
    outcome = note(err);
  }

  logAttempt([entry], outcome.ok, outcome.code);

  if (outcome.ok) {
    settle([entry]);
    return true;
  }

  if (outcome.code === '42501') {
    console.error(
      `[tripSync] 42501 (RLS) no delete de ${entry.id} — marcado, sem retry`,
      outcome.message,
    );
    markBlocked([entry]);
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// flush
// ---------------------------------------------------------------------------

/**
 * Drena o outbox. Um por vez: `inFlight` impede que dois gatilhos simultâneos (escrita +
 * `online`, por exemplo) mandem a mesma linha duas vezes — o item só sai do outbox DEPOIS
 * da resposta, então sem essa trava o segundo flush leria o mesmo pendente.
 *
 * Não lança: erro de rede é estado normal aqui, não exceção do chamador. Por isso todos os
 * gatilhos podem usar `void flush()`.
 */
export async function flush(): Promise<void> {
  if (inFlight) return;

  const userId = activeUserId();
  if (!userId) return; // sem sessão o banco é parede, não porta (§5.4, risco 9)

  inFlight = true;
  try {
    for (let round = 0; round < MAX_ROUNDS; round += 1) {
      // A sessão pode cair no meio da drenagem. O que não subiu FICA no outbox: o próximo
      // login do mesmo usuário o encontra intacto.
      if (getCurrentUserId() !== userId) {
        console.warn('[tripSync] sessão mudou durante o flush — o resto fica no outbox');
        return;
      }

      // Relê o storage a cada volta: outra aba pode ter mexido no outbox entre dois lotes.
      // O filtro por `uid` é o que impede drenar op de outro dono (ver `OutboxEntry.uid`).
      const mine = readOutbox().filter((entry) => entry.uid === userId);
      const pending = mine
        .filter((entry) => !entry.blocked)
        .sort((a, b) => a.seq - b.seq);

      if (pending.length === 0) {
        // Só apaga o último erro quando NÃO sobrou nada nosso na fila. Um item `blocked`
        // (42501) some do `pending` na mesma volta em que foi marcado — limpar aqui deixaria
        // a 4d com "1 pendente" e nenhuma razão na tela.
        if (mine.length === 0) lastFlushError = null;
        return;
      }

      const batch = pending.slice(0, BATCH_SIZE);
      const upserts = batch.filter((entry) => entry.op === 'upsert');
      const deletes = batch.filter((entry) => entry.op === 'delete');

      if (upserts.length > 0 && !(await sendUpserts(upserts, userId))) return;

      for (const entry of deletes) {
        if (!(await sendDelete(entry))) return;
      }
    }

    console.error(`[tripSync] flush interrompido após ${MAX_ROUNDS} lotes — outbox não drenou`);
  } finally {
    inFlight = false;
  }
}

// ---------------------------------------------------------------------------
// O sino do Arco 1
// ---------------------------------------------------------------------------

function handleLocalChange(): void {
  const { upserts, deletes } = diffLocal();
  if (upserts.length === 0 && deletes.length === 0) return;

  // ANÔNIMO: o snapshot ACIMA já foi atualizado e nada é enfileirado. Atualizar o snapshot
  // é o ponto: sem isso, o primeiro login veria toda escrita anônima como novidade e a
  // subiria — adoção silenciosa, que é da 4e e pede consentimento (risco 1).
  const userId = activeUserId();
  if (!userId) return;

  enqueue(
    [
      ...deletes.map((id) => ({ op: 'delete' as const, id })),
      ...upserts.map((id) => ({ op: 'upsert' as const, id })),
    ],
    userId,
  );

  void flush();
}

/**
 * Liga o espelho. Idempotente: a segunda chamada é no-op — não assina de novo, não semeia
 * de novo. Não devolve promessa: o boot não espera por rede.
 *
 * As assinaturas não são guardadas para desligar depois. Este módulo vive o tempo do
 * documento e não existe `stopTripSync()` — mesma decisão do `session.ts` (4b).
 */
export function startTripSync(): void {
  if (started) return;
  started = true;

  // Semeia o snapshot com o que JÁ está no storage e descarta o resultado. Ver o cabeçalho:
  // subir o passado é adoção (4e), não espelho.
  diffLocal();

  subscribeTrips(handleLocalChange);

  subscribeSession((userId) => {
    if (userId) void flush();
  });

  window.addEventListener('online', () => void flush());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void flush();
  });

  // A sessão pode ter resolvido ANTES desta linha — `subscribeSession` não replica o estado
  // atual na assinatura (contrato do 4b). Sem este empurrão, um outbox que sobrou do boot
  // anterior ficaria esperando o próximo evento.
  if (activeUserId()) void flush();
}

// ---------------------------------------------------------------------------
// Observabilidade — o mínimo de que a 4d precisa
// ---------------------------------------------------------------------------

/**
 * Quantas ops esperam no banco. Conta TODAS as pendentes, inclusive as `blocked` (42501) e
 * as de outro dono (`uid` diferente do logado) — as duas continuam ocupando a fila, e a 4d
 * é que vai separar os três casos no painel.
 */
export function getOutboxLength(): number {
  return readOutbox().length;
}

/**
 * O erro da última tentativa que falhou, ou `null` quando não sobrou NADA do dono atual na
 * fila — nem pendente, nem `blocked`. Ou seja: enquanto um item recusado pela policy estiver
 * ali, o motivo continua legível, que é o mínimo para a 4d explicar por que a fila não zera.
 */
export function getLastFlushError(): FlushError | null {
  return lastFlushError;
}

/**
 * O retrato do espelho. Funciona sem `startTripSync()` — é leitura de storage e de estado de
 * módulo, o que permite inspecionar uma aba onde o espelho nunca ligou.
 *
 * A classificação é a mesma regra do `flush()`: op de outro dono não é minha para drenar. Com
 * a sessão ainda resolvendo (ou anônima), `ownerUserId` é `null` e TODA op cai em
 * `foreignOwner` — que é a verdade: neste instante nenhuma delas pode subir.
 */
export function getSyncStatus(): SyncStatus {
  const ownerUserId = activeUserId();
  const entries = readOutbox();

  const ids = {
    pending: [] as string[],
    blocked: [] as string[],
    foreignOwner: [] as string[],
  };

  entries.forEach((entry) => {
    if (entry.uid !== ownerUserId) ids.foreignOwner.push(entry.id);
    else if (entry.blocked) ids.blocked.push(entry.id);
    else ids.pending.push(entry.id);
  });

  const log = readLog();
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  // `Date.parse` de um `ts` torto dá NaN, e `NaN >= cutoff` é `false`: evento com data
  // ilegível não entra na conta em vez de virar erro de hoje.
  const errors24h = log.filter((event) => !event.ok && Date.parse(event.ts) >= cutoff).length;

  return {
    ownerUserId,
    sessionResolved: isSessionResolved(),
    outbox: {
      pending: ids.pending.length,
      blocked: ids.blocked.length,
      foreignOwner: ids.foreignOwner.length,
      ids,
    },
    // O anel é cronológico por construção (append no fim), então o último é o mais recente. O
    // fallback existe para o caso de a aba ter recarregado: a variável de módulo zera, o
    // storage não.
    lastFlushAt: lastFlushAt ?? (log.length > 0 ? log[log.length - 1].ts : null),
    lastFlushError,
    errors24h,
    inFlight,
  };
}

/** O anel como está gravado: cronológico, mais antigo primeiro. Quem quer o topo, inverte. */
export function getSyncLog(): SyncLogEvent[] {
  return readLog();
}

/**
 * Apaga o anel de diagnóstico. **NÃO** toca no outbox — apagar o outbox seria descartar
 * escrita do usuário que ainda não subiu, e nenhum botão de painel tem esse direito.
 */
export function clearSyncLog(): void {
  localStorage.removeItem(SYNC_LOG_KEY);
}
