/**
 * tripHydration.ts — a porta de VOLTA: kinu-beta -> localStorage (Arco 4f). Fecha a Fase B.
 *
 * O QUE ESTE ARQUIVO É: o primeiro `select` do Arco 4. Os arcos 4a-4e construíram uma porta só
 * — o banco enche, o outbox garante entrega, a adoção pergunta antes de subir o passado — e
 * nenhuma linha lia de volta. Sem esta, o banco é backup; com ela, é fonte.
 *
 * A DIFERENÇA DE RISCO ENTRE AS DUAS PORTAS, e é ela que explica o resto do arquivo: **a de ida
 * acrescenta, a de volta apaga**. Um `upsert` errado grava lixo recuperável; uma hidratação
 * errada remove viagem do usuário do navegador dele. Por isso a ordem aqui é sempre a mesma:
 *
 *   1. QUEM tem direito de hidratar   -> o marcador `kinu_trips_owner` da 4e (§ gate)
 *   2. O QUE não pode ser tocado      -> `getOutboxProtection()` da 4c
 *   3. O QUE some                     -> só então, "banco vence"
 *
 * FALHA NUNCA DESTRÓI: erro do PostgREST, rede caída ou promessa rejeitada deixam o
 * localStorage intacto (recon §4.4, o fallback local). Só um `select` que RESPONDEU move uma
 * vírgula.
 *
 * SEM TEMPO REAL, declarado: os gatilhos são resolução de sessão, decisão da adoção e o botão
 * do `/smoke`. Nada de `visibilitychange`, `online` ou polling — hidratar é destrutivo por
 * natureza e não deve rodar sozinho enquanto o usuário digita. Frescor multi-dispositivo na
 * Fase B é por recarga de página, que é literalmente o passo 8 da checklist do recon §7.4.
 */

import { kinuBeta } from '@/integrations/kinu-beta/client';
import { getCurrentUserId, isSessionResolved, subscribeSession } from '@/lib/session';
import { claimOwnership, getTripsOwner, subscribeAdoption } from '@/lib/tripAdoption';
import { hydrateTrips, listTrips, normalizeTrip, StoredTrip } from '@/lib/tripStore';
import {
  absorbLocalWrite,
  discardForeignUpserts,
  getOutboxProtection,
  hashTrip,
  SCHEMA_VERSION,
} from '@/lib/tripSync';

/**
 * Por que a hidratação NÃO rodou. Os quatro são estados normais do app, não erros — e o painel
 * do soak precisa distinguir "não hidratou porque não devia" de "tentou e falhou".
 */
export type HydrationSkip =
  | 'sem-sessao'    // anônimo, ou a sessão ainda não resolveu (o `null` do boot)
  | 'sem-decisao'   // `kinu_trips_owner` ausente: a 4e ainda não perguntou/gravou
  | 'recusa'        // `{ userId: null }`: este navegador é local por decisão do usuário
  | 'em-voo';       // já existe uma hidratação em andamento

export interface HydrationError {
  code: string | null;
  message: string;
  at: string;
}

export interface HydrationResultInfo {
  added: number;
  updated: number;
  removed: number;
  keptLocal: number;
  /** Ids que vieram do banco e não entraram: `schema_version` futuro ou payload torto. */
  ignored: string[];
  /** `true` quando esta hidratação também trocou o dono do navegador. */
  takeover: boolean;
  /** `false` quando a fusão deu o que já estava gravado — nada escrito, sino mudo. */
  changed: boolean;
}

export interface HydrationOutcome {
  ok: boolean;
  skipped: HydrationSkip | null;
  result: HydrationResultInfo | null;
  error: HydrationError | null;
}

export interface HydrationStatus {
  lastHydrationAt: string | null;
  lastHydrationError: HydrationError | null;
  lastResult: HydrationResultInfo | null;
  lastSkip: HydrationSkip | null;
  inFlight: boolean;
}

/** O retrato comparativo do recon §7.3. Leitura PURA: não grava nada, em lugar nenhum. */
export interface MirrorDiff {
  ok: boolean;
  error: HydrationError | null;
  checkedAt: string;
  onlyLocal: string[];
  onlyRemote: string[];
  divergent: string[];
  ignored: string[];
  /** A ordem dos ids comuns aos dois lados. `false` aqui muda a viagem ativa do `/cla`. */
  orderMatches: boolean;
  localCount: number;
  remoteCount: number;
}

// ---------------------------------------------------------------------------
// Estado do módulo — vive o tempo do documento, como session.ts, tripSync.ts e tripAdoption.ts
// ---------------------------------------------------------------------------

let started = false;
let inFlight = false;
let lastHydrationAt: string | null = null;
let lastHydrationError: HydrationError | null = null;
let lastResult: HydrationResultInfo | null = null;
let lastSkip: HydrationSkip | null = null;

// ---------------------------------------------------------------------------
// A linha que veio do banco
// ---------------------------------------------------------------------------

interface RemoteRow {
  id: string;
  payload: unknown;
  schema_version: number;
}

function note(error: unknown): HydrationError {
  const shaped = error as { code?: unknown; message?: unknown };
  const code = typeof shaped?.code === 'string' ? shaped.code : null;
  const message = typeof shaped?.message === 'string' ? shaped.message : String(error);

  const shapedError = { code, message, at: new Date().toISOString() };
  console.warn('[tripHydration] falha na leitura', code ?? '(sem código)', message);

  return shapedError;
}

/**
 * O `select` do arco, e cada pedaço dele é uma regra:
 *
 * `order('created_at', { ascending: true })` é OBRIGATÓRIO (recon §2.4, risco 5). O índice da
 * tabela é `(user_id, updated_at desc)`; aceitar a ordem "natural" faria a ÚLTIMA da lista
 * virar a menos recentemente atualizada — e `getActiveTrip()` usa exatamente "a última da
 * lista" como fallback. A viagem ativa do `/cla` e do `FeedbackButton` mudaria sozinha, sem
 * ninguém tocar em nada. `created_at asc` é o que reproduz o `push` do `addTrip`.
 *
 * `.eq('user_id', uid)` mesmo com RLS: a policy já restringe, mas a mesma disciplina do
 * `toRow()` vale aqui — não confiar em política para definir o que é meu. Custo zero, e é o que
 * segura o dia em que alguém afrouxar uma policy.
 *
 * `created_at` NÃO é selecionado: ele só ordena, não entra no payload nem no localStorage.
 */
async function selectRows(uid: string): Promise<{ rows: RemoteRow[] | null; error: HydrationError | null }> {
  try {
    const { data, error } = await kinuBeta
      .from('trips')
      .select('id, payload, schema_version')
      .eq('user_id', uid)
      .order('created_at', { ascending: true });

    if (error) return { rows: null, error: note(error) };
    if (!Array.isArray(data)) {
      return { rows: null, error: note(new Error('resposta sem array de linhas')) };
    }

    return { rows: data as RemoteRow[], error: null };
  } catch (err) {
    // Rede caída rejeita a promessa em vez de devolver `error`. Mesma decisão: não toca no
    // storage, registra, e o app segue no fallback local.
    return { rows: null, error: note(err) };
  }
}

/**
 * Traduz linhas do banco em viagens, aplicando as três exceções da fusão.
 *
 * `schema_version != 1` -> ignorada COM AVISO, sem regravar e sem apagar do banco (recon §2.3).
 * E o id entra no `keepLocal`: tratá-la como "ausente do banco" faria a hidratação apagar a
 * cópia local de uma viagem que existe, só que num formato que este cliente não entende. Essa é
 * a proteção mais barata do arco — sem ela, um cliente velho (aba não recarregada, PWA em
 * cache) destrói o que um cliente novo escreveu.
 *
 * A IDENTIDADE É A PK: `{ ...payload, id: row.id }`. Se o payload trouxer outro `id`, quem vale
 * é a coluna — é ela que o `upsert` usa como chave, e divergir aqui criaria uma viagem que o
 * espelho reenvia para a linha errada.
 */
function prepare(rows: RemoteRow[], uid: string, before: { keepLocal: string[]; skipRemote: string[] }) {
  // O OUTBOX É LIDO DOS DOIS LADOS DO REQUEST, e isto não é excesso de zelo — é o único jeito de
  // fechar a janela do voo. Cenário real, o da adoção (4e): `acceptAdoption()` enfileira A e B,
  // dispara o flush E o gatilho desta hidratação no mesmo instante. Se o flush drenar enquanto o
  // `select` está no ar, a leitura volta com a resposta ANTERIOR ao upsert — banco vazio — e um
  // outbox já vazio não protegeria nada: A e B seriam apagados do navegador no segundo seguinte
  // ao usuário ter dito "trazer para minha conta".
  //
  // A união cobre as duas pontas: o que estava pendente ao pedir e o que foi enfileirado durante.
  // O preço é ser conservador — uma viagem que drenou no meio do voo não recebe a versão do banco
  // nesta rodada. A próxima hidratação a pega, e não apagar por engano vale muito mais.
  const after = getOutboxProtection(uid);
  const skipRemote = new Set([...before.skipRemote, ...after.skipRemote]);

  const incoming: StoredTrip[] = [];
  const keepLocal = [...new Set([...before.keepLocal, ...after.keepLocal])];
  const ignored: string[] = [];

  rows.forEach((row) => {
    const id = typeof row?.id === 'string' && row.id ? row.id : null;
    if (!id) {
      console.warn('[tripHydration] linha sem id descartada');
      return;
    }

    if (row.schema_version !== SCHEMA_VERSION) {
      console.warn(
        `[tripHydration] viagem ${id} em schema_version ${row.schema_version} — ignorada ` +
        `(este cliente entende ${SCHEMA_VERSION}); a cópia local fica intacta`,
      );
      ignored.push(id);
      keepLocal.push(id);
      return;
    }

    const payload = row.payload;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      console.warn(`[tripHydration] viagem ${id} com payload inesperado — ignorada`);
      ignored.push(id);
      keepLocal.push(id);
      return;
    }

    // `delete` pendente: a linha está prestes a morrer no banco. Reimportá-la ressuscitaria uma
    // viagem que o usuário apagou.
    if (skipRemote.has(id)) return;

    // Normaliza na entrada para que a comparação de idempotência do `hydrateTrips` seja estável
    // — o `listTrips()` normaliza na leitura de qualquer forma.
    incoming.push(normalizeTrip({ ...(payload as Record<string, unknown>), id }));
  });

  return { incoming, keepLocal, ignored };
}

// ---------------------------------------------------------------------------
// O gate — quem tem direito de hidratar
// ---------------------------------------------------------------------------

function skip(reason: HydrationSkip): HydrationOutcome {
  lastSkip = reason;
  return { ok: true, skipped: reason, result: null, error: null };
}

/**
 * Hidrata agora, se puder. Nunca lança — erro de rede é estado normal aqui.
 *
 * O GATE, em ordem (os quatro estados de `kinu_trips_owner`, lidos pela segunda vez no projeto —
 * a primeira é o `decideFor` da 4e):
 *
 *   ausente          -> NÃO hidrata. Quem decide é a 4e, com o diálogo. Assim que ela gravar o
 *                       marcador (no aceite, ou no login sem passado), a hidratação roda.
 *   { X, … } · X     -> hidrata: banco vence, menos o que está no outbox.
 *   { A, … } · B     -> TROCA DE DONO (recon §3.2 ramo 2).
 *   { null, null }   -> RECUSA: nunca hidrata. Quem recusou pediu que este navegador ficasse
 *                       local, e a recusa é do navegador, não da conta.
 *
 * O gate não é zelo: sem ele, um navegador com viagens locais de quem recusou a adoção mais uma
 * conta nova de banco vazio = "banco vence" apagando tudo, sem pergunta e sem desfazer.
 */
export async function hydrateNow(): Promise<HydrationOutcome> {
  if (inFlight) return skip('em-voo');

  // O `null` do boot é "ainda não sei", não "anônimo" — a mesma regra do guard da 4c.
  if (!isSessionResolved()) return skip('sem-sessao');

  const uid = getCurrentUserId();
  if (!uid) return skip('sem-sessao');

  const owner = getTripsOwner();
  if (!owner) return skip('sem-decisao');
  if (owner.userId === null) return skip('recusa');

  const takeover = owner.userId !== uid;

  inFlight = true;
  try {
    // Antes do request: o que já estava pendente. Ver `prepare()` — a fila pode drenar no meio
    // do voo, e um outbox vazio na volta não sabe o que estava lá na ida.
    const before = getOutboxProtection(uid);

    // O SELECT VEM ANTES DE QUALQUER ESCRITA, e na troca de dono isso é o desenho: se a leitura
    // falhar, o navegador continua com o passado de A e com o marcador de A, em vez de ficar sem
    // um e sem o outro. O preço declarado é que B vê as viagens de A até o próximo sucesso —
    // exatamente o status quo da 4e, e recuperável no gatilho seguinte.
    const { rows, error } = await selectRows(uid);

    if (error || !rows) {
      lastHydrationError = error;
      lastHydrationAt = new Date().toISOString();
      lastSkip = null;
      return { ok: false, skipped: null, result: null, error };
    }

    // A sessão pode ter caído ou trocado durante o voo. Hidratar agora gravaria o banco de quem
    // já saiu por cima do navegador de quem entrou.
    if (getCurrentUserId() !== uid) {
      console.warn('[tripHydration] a sessão mudou durante a leitura — nada foi gravado');
      return skip('sem-sessao');
    }

    const { incoming, keepLocal, ignored } = prepare(rows, uid, before);

    let applied = { added: 0, updated: 0, removed: 0, keptLocal: 0, changed: false };

    // A TROCA DE DONO NÃO É UM CAMINHO DE DADOS PRÓPRIO: é a hidratação normal, com os upserts
    // do dono anterior descartados antes. As viagens de A somem porque não estão no banco de B e
    // não estão no outbox de B — a mesma regra que remove qualquer outra, sem exceção nova.
    absorbLocalWrite(() => {
      if (takeover) discardForeignUpserts(uid);
      applied = hydrateTrips(incoming, keepLocal);
    });

    // Depois da escrita local, de propósito. Se esta gravação falhar (quota), a próxima sessão
    // repete a troca — e repetir é inofensivo, porque o local já é o banco de B.
    if (takeover) claimOwnership(uid);

    lastHydrationAt = new Date().toISOString();
    lastHydrationError = null;
    lastSkip = null;
    lastResult = { ...applied, ignored, takeover };

    return { ok: true, skipped: null, result: lastResult, error: null };
  } finally {
    inFlight = false;
  }
}

// ---------------------------------------------------------------------------
// Os gatilhos
// ---------------------------------------------------------------------------

/**
 * Liga a hidratação. Idempotente, e não devolve promessa: o boot não espera por rede.
 *
 * As assinaturas não são guardadas — este módulo vive o tempo do documento, como os outros três.
 */
export function startTripHydration(): void {
  if (started) return;
  started = true;

  subscribeSession(() => {
    void hydrateNow();
  });

  // A DECISÃO DA ADOÇÃO, não o sino do tripStore. O pedido em aberto vira `null` quando o
  // usuário responde — e no aceite o marcador acabou de ser gravado em nome dele, então esta é
  // a primeira vez que o gate acima deixa passar. Sem isto, o primeiro login de quem adota só
  // hidrataria no boot seguinte.
  //
  // Na recusa o mesmo toque acontece e o gate devolve 'recusa': custa uma chamada síncrona.
  subscribeAdoption((prompt) => {
    if (!prompt) void hydrateNow();
  });

  // A sessão pode ter resolvido ANTES desta linha: `subscribeSession` não replica o estado atual
  // na assinatura (contrato do 4b). Mesmo empurrão do `startTripSync()` e do `startTripAdoption()`.
  void hydrateNow();
}

// ---------------------------------------------------------------------------
// Observabilidade — o que o painel §7.3 lê
// ---------------------------------------------------------------------------

export function getHydrationStatus(): HydrationStatus {
  return { lastHydrationAt, lastHydrationError, lastResult, lastSkip, inFlight };
}

/**
 * A comparação local × banco do recon §7.3 — as quatro métricas que faltavam ao painel da 4d.
 *
 * LEITURA PURA: nada aqui grava em lugar nenhum, nem no localStorage nem no banco. É o
 * instrumento do soak, e um instrumento que altera o que mede não serve de critério de corte.
 *
 * `divergent` usa o MESMO hash do espelho de escrita (`hashTrip`), dos dois lados e sobre o
 * payload normalizado — comparar cru acusaria diferença de normalização como divergência real.
 */
export async function compareWithDatabase(): Promise<MirrorDiff> {
  const empty: MirrorDiff = {
    ok: false,
    error: null,
    checkedAt: new Date().toISOString(),
    onlyLocal: [],
    onlyRemote: [],
    divergent: [],
    ignored: [],
    orderMatches: true,
    localCount: 0,
    remoteCount: 0,
  };

  const uid = isSessionResolved() ? getCurrentUserId() : null;
  if (!uid) {
    return { ...empty, error: { code: null, message: 'sem sessão resolvida', at: empty.checkedAt } };
  }

  const { rows, error } = await selectRows(uid);
  if (error || !rows) return { ...empty, error };

  const local = listTrips();
  const localById = new Map<string, StoredTrip>();
  local.forEach((trip) => {
    if (typeof trip?.id === 'string' && trip.id) localById.set(trip.id, trip);
  });

  const remoteById = new Map<string, StoredTrip>();
  const remoteOrder: string[] = [];
  const ignored: string[] = [];

  rows.forEach((row) => {
    const id = typeof row?.id === 'string' && row.id ? row.id : null;
    if (!id) return;

    const payload = row.payload;
    if (row.schema_version !== SCHEMA_VERSION || !payload || typeof payload !== 'object') {
      ignored.push(id);
      return;
    }

    remoteOrder.push(id);
    remoteById.set(id, normalizeTrip({ ...(payload as Record<string, unknown>), id }));
  });

  const onlyLocal: string[] = [];
  const divergent: string[] = [];

  localById.forEach((trip, id) => {
    const remote = remoteById.get(id);
    if (!remote) {
      if (!ignored.includes(id)) onlyLocal.push(id);
      return;
    }
    if (hashTrip(trip) !== hashTrip(remote)) divergent.push(id);
  });

  const onlyRemote = remoteOrder.filter((id) => !localById.has(id));

  // A ordem só é comparável sobre os ids que existem dos dois lados: um "só no local" já aparece
  // na própria métrica, e deixá-lo entrar aqui faria a linha da ordem acusar vermelho por um
  // problema que não é dela.
  const localCommon = local
    .map((trip) => trip?.id as string)
    .filter((id) => typeof id === 'string' && remoteById.has(id));
  const remoteCommon = remoteOrder.filter((id) => localById.has(id));

  return {
    ok: true,
    error: null,
    checkedAt: new Date().toISOString(),
    onlyLocal,
    onlyRemote,
    divergent,
    ignored,
    orderMatches: localCommon.join('|') === remoteCommon.join('|'),
    localCount: local.length,
    remoteCount: remoteOrder.length,
  };
}
