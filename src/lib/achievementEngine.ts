// achievementEngine — o motor. Lê os fatos, decide o que está destravado, grava UMA vez.
//
// A REGRA QUE MANDA NO ARQUIVO: a idempotência é por CHAVE NATURAL lida do servidor. Antes de
// gravar qualquer coisa, o motor lê os `achievement.unlocked` do próprio usuário e só emite as
// chaves que faltam. Não é o dedupe do emissor que protege daqui — ele só compara com o evento
// imediatamente anterior (kinuEvents.ts:105) e nunca serviria para "esta pessoa já tem este
// troféu desde março".
//
// LÊ DO SERVIDOR, NÃO DO ANEL. O anel local guarda 50 entradas deste navegador; a verdade da
// vivência é a tabela `events` do kinu-beta, que tem o histórico inteiro e o que foi feito no
// celular. A RLS *own* (SELECT+INSERT para authenticated, provada em 10/09) é o que torna essa
// leitura possível do cliente — e é por isso que a RPC `security definer` prevista no §6 do
// desenho não existe: ela só faria falta se o motor rodasse com `service_role`.
//
// RETROATIVO NÃO É UM MODO. Toda passada lê o histórico inteiro. Não há "primeira execução" no
// código: quem já viajou acorda com os troféus porque os eventos já estão na tabela.
//
// ERRO DE LEITURA ABORTA A PASSADA. Sem saber o que já está gravado, gravar seria reemitir a
// coleção inteira a cada boot offline. Melhor não destravar agora do que sujar a tabela.
//
// INVARIANTE, a mesma do emissor: nada aqui lança, nunca.
import { kinuBeta } from '@/integrations/kinu-beta/client';
import { flushEvents, subscribeEvents, trackEvent } from '@/lib/kinuEvents';
import { loadJson } from '@/lib/safeStorage';
import { getCurrentUserId, subscribeSession } from '@/lib/session';
import {
  achievementOf,
  computeProgress,
  EMPTY_PROGRESS,
  type Achievement,
  type AchievementEvent,
  type Progress,
} from '@/lib/achievements';

/** O snapshot do último cálculo. Cache de LEITURA: a verdade é a tabela. */
export const ACHIEVEMENTS_KEY = 'kinu_achievements';

/** O nome reservado ao motor (§1 do desenho). Ninguém mais emite isto. */
const UNLOCKED_EVENT = 'achievement.unlocked';

/** Os únicos nomes que o motor entende. Filtrar no servidor evita trazer o onboarding e a
 *  transparência do hotel para dentro de um cálculo que não olha para eles. */
const TRACKED_NAMES = [
  'trip.created',
  'trip.activated',
  'trip.completed',
  'trip.item_confirmed',
  // A fonte PRIMÁRIA da vivência (§2). Fora desta lista, a Camada Local inteira dependeria
  // do fallback — e o item confirmado e não vivido valeria troféu.
  'trip.checkin',
  'budget.closed_under',
  UNLOCKED_EVENT,
];

/** Teto de linhas por leitura. Alto o bastante para um histórico real, finito o bastante para
 *  que uma tabela envenenada não vire um download. */
const ROW_LIMIT = 5000;

// ---------------------------------------------------------------------------
// Estado do módulo — o mesmo idioma do session.ts: vive fora do React
// ---------------------------------------------------------------------------

type AchievementListener = (progress: Progress, unlockedNow: Achievement[]) => void;

const listeners = new Set<AchievementListener>();

let started = false;
let running: Promise<void> | null = null;
let runAgain = false;

/** O progresso conhecido. Começa no cache para a UI não piscar antes da primeira leitura. */
let progress: Progress = readCache();

/**
 * As chaves emitidas NESTA sessão.
 *
 * Cobre a janela entre o `trackEvent` e a linha aparecer na tabela: sem ela, dois eventos
 * seguidos abririam duas passadas e a segunda leria um servidor que ainda não recebeu a primeira.
 */
const emittedThisSession = new Set<string>();

function readCache(): Progress {
  try {
    const cached = loadJson<Progress | null>(ACHIEVEMENTS_KEY, null);
    // Snapshot velho de um formato anterior não pode virar tela quebrada. O de antes da
    // Camada Local não tem `visitedCities` e traz um `total` de 12 — NORMALIZA em vez de
    // descartar: o cache existe só para a primeira pintura, e a passada seguinte corrige
    // os números de qualquer forma. Descartar faria a tela piscar zerada em todo boot.
    if (cached && typeof cached.xp === 'number' && Array.isArray(cached.unlocked)) {
      return {
        ...cached,
        total: typeof cached.total === 'number' ? cached.total : EMPTY_PROGRESS.total,
        visitedCities: Array.isArray(cached.visitedCities) ? cached.visitedCities : [],
      };
    }
  } catch {
    /* cache é descartável */
  }
  return EMPTY_PROGRESS;
}

/** Grava o snapshot. Storage bloqueado não interrompe nada: o cache só serve à primeira pintura,
 *  e a passada seguinte recalcula do servidor de qualquer forma. */
function writeCache(next: Progress): void {
  try {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(next));
  } catch {
    /* cota, navegador privado — a verdade continua sendo a tabela */
  }
}

function notify(unlockedNow: Achievement[]): void {
  listeners.forEach((listener) => {
    try {
      listener(progress, unlockedNow);
    } catch (err) {
      console.warn('[achievements] listener lançou exceção — ignorado', err);
    }
  });
}

/** O progresso conhecido agora — SÍNCRONO, do cache em memória. */
export function getProgress(): Progress {
  return progress;
}

/**
 * Assina o progresso. Devolve o unsubscribe.
 *
 * `unlockedNow` traz os troféus destravados NESTA passada — é o que a celebração mostra. Vem
 * vazio nas passadas em que nada muda, que são a maioria.
 */
export function subscribeAchievements(listener: AchievementListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// ---------------------------------------------------------------------------
// A leitura
// ---------------------------------------------------------------------------

/** As linhas do usuário, ou `null` quando a leitura falhou — que não é o mesmo que "nenhuma". */
async function readUserEvents(userId: string): Promise<AchievementEvent[] | null> {
  try {
    const { data, error } = await kinuBeta
      .from('events')
      .select('name, props')
      // A RLS já restringe a linha ao dono. O `eq` explícito é o mesmo cinto do tripHydration:
      // uma política afrouxada no futuro não pode virar troféu de estranho.
      .eq('user_id', userId)
      .in('name', TRACKED_NAMES)
      .limit(ROW_LIMIT);

    if (error) return null;
    if (!Array.isArray(data)) return null;

    return (data as { name?: unknown; props?: unknown }[])
      .filter((row) => typeof row?.name === 'string')
      .map((row) => ({
        name: row.name as string,
        props: (row.props ?? {}) as Record<string, unknown>,
      }));
  } catch {
    return null;
  }
}

/** As chaves que a tabela já registra como destravadas. */
function recordedKeys(events: AchievementEvent[]): Set<string> {
  const keys = new Set<string>();
  for (const event of events) {
    if (event.name !== UNLOCKED_EVENT) continue;
    const key = event.props?.key;
    if (typeof key === 'string' && key) keys.add(key);
  }
  return keys;
}

// ---------------------------------------------------------------------------
// A passada
// ---------------------------------------------------------------------------

async function runOnce(): Promise<void> {
  // SEM DONO NÃO RODA — mesma regra do `sweepCompletedTrips`. Conquista é de alguém.
  const userId = getCurrentUserId();
  if (!userId) return;

  // ANTES DE LER, DRENAR. O fato que acabou de acontecer ainda está no anel; ler a tabela sem
  // esperar a entrega computaria o mundo de um segundo atrás, e o troféu só apareceria na
  // próxima passada — que pode nunca vir, porque é a emissão que acorda o motor.
  await flushEvents();

  const events = await readUserEvents(userId);
  if (!events) return;

  const recorded = recordedKeys(events);
  const next = computeProgress(events);

  const unlockedNow: Achievement[] = [];
  for (const key of next.unlocked) {
    if (recorded.has(key)) continue;
    if (emittedThisSession.has(key)) continue;

    // Marca ANTES de emitir, pelo mesmo motivo do `claim` do tripEvents: `trackEvent` é síncrono
    // e não lança, então não há janela real entre as duas — e marca sem evento se resolve na
    // próxima passada, enquanto evento sem marca duplicaria.
    emittedThisSession.add(key);
    trackEvent(UNLOCKED_EVENT, { key }, userId);

    const achievement = achievementOf(key);
    if (achievement) unlockedNow.push(achievement);
  }

  progress = next;
  writeCache(next);
  notify(unlockedNow);
}

/**
 * Recalcula. UMA PASSADA POR VEZ, com volta extra para quem chegou no meio — o mesmo idioma do
 * `flushEvents` e do `scheduleSweep`.
 *
 * A serialização não é enfeite: três `trip.completed` na varredura do boot abririam três leituras
 * concorrentes, as três leriam a tabela antes de qualquer gravação, e as três emitiriam
 * `pe_na_estrada`.
 *
 * Nunca lança. Devolve a promessa para o teste — quem chama de dentro do app usa `void`.
 */
export function runAchievements(): Promise<void> {
  if (running) {
    runAgain = true;
    return running;
  }

  running = (async () => {
    try {
      do {
        runAgain = false;
        await runOnce();
      } while (runAgain);
    } catch (err) {
      console.warn('[achievements] passada falhou — ignorada', err);
    } finally {
      running = null;
    }
  })();

  return running;
}

/**
 * Liga o motor. Idempotente, síncrona, não devolve promessa — o boot não espera por rede. Mesmo
 * formato dos outros cinco `start*` do App.tsx.
 */
export function startAchievements(): void {
  if (started) return;
  started = true;

  // O login (e o retorno do OAuth) é o primeiro gatilho: é ali que o retroativo acontece.
  subscribeSession(() => {
    // Sessão nova, sessão outra: o que esta sessão emitiu não vale para o próximo dono.
    emittedThisSession.clear();
    void runAchievements();
  });

  // E depois de cada fato. `achievement.unlocked` fica de fora ou o motor se acorda em looping:
  // ele emite, o sino toca, ele lê, emite de novo — a leitura pararia o ciclo, mas custaria um
  // round-trip por troféu.
  subscribeEvents((name) => {
    if (name === UNLOCKED_EVENT) return;
    void runAchievements();
  });

  // A sessão pode ter resolvido antes desta linha — `subscribeSession` não replica o estado
  // atual na assinatura (contrato do 4b). Mesmo empurrão do `startTripCompletion`.
  void runAchievements();
}
