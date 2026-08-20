/**
 * tripAdoption.ts — a adoção CONSENTIDA das viagens que já estavam no navegador (Arco 4e).
 *
 * O QUE ESTE ARQUIVO É: a resposta à pergunta que o espelho da 4c se recusou a responder
 * sozinho. O `tripSync` semeia o snapshot no boot sem enfileirar nada (`tripSync.ts:14-19`),
 * então **escrita anterior ao login nunca sobe** — se subisse, o primeiro login adotaria em
 * silêncio o que quer que estivesse ali, inclusive de outra pessoa (recon §3.4a, risco 1).
 * A adoção é o ato de desfazer essa regra UMA VEZ, com o usuário dizendo sim.
 *
 * O QUE ELE NÃO FAZ, de propósito:
 *   - não tem máquina de envio: enfileira pelo `enqueueUpserts` e o outbox da 4c cuida do
 *     resto (lotes, retry, `blocked`, `kinu_sync_log`). Adoção interrompida no meio é
 *     retomada pelo próximo gatilho de flush, sem estado intermediário próprio;
 *   - não LÊ do banco: o ramo "dono diferente" aqui apenas NÃO adota. Limpar o local e puxar
 *     do banco do novo dono exige `select` e é a 4f;
 *   - não desliga o espelho para quem recusou — ver RECUSA, abaixo.
 *
 * RECUSA, declarada: gravar `{ userId: null }` impede a adoção do PASSADO em bloco e nada
 * mais. O sino do `tripStore` não distingue viagem velha de nova, então editar uma viagem
 * antiga já logado faz a viagem inteira subir. É deliberado: a alternativa (quarentena de ids)
 * prometeria "nunca sai deste navegador" — promessa que a hidratação da 4f não conseguiria
 * manter — e transformaria uma edição feita pelo dono da conta em dado invisível nos outros
 * dispositivos dele. O diálogo diz isso na tela, em vez de o código fingir o contrário.
 */

import { loadJson } from '@/lib/safeStorage';
import { getCurrentUserId, isSessionResolved, subscribeSession } from '@/lib/session';
import { listTrips } from '@/lib/tripStore';
import { enqueueUpserts, flush } from '@/lib/tripSync';

export const OWNER_KEY = 'kinu_trips_owner';

/**
 * Quem é o dono deste navegador — e, junto, se a pergunta já foi feita.
 *
 * QUATRO ESTADOS, e a ordem de leitura importa (`decideFor`): `userId: null` é RECUSA, não
 * "dono diferente de todo mundo". Testar dono antes de recusa faria a recusa cair no ramo
 * errado por acidente aritmético.
 *
 *   (chave ausente)                  -> nunca foi perguntado
 *   { userId: 'X', adoptedAt: iso }  -> X adotou o passado nesta data
 *   { userId: 'X', adoptedAt: null } -> X é o dono e NÃO HAVIA nada para adotar (login com
 *                                       `kinu_trips` vazio). Ver `evaluate`.
 *   { userId: null, adoptedAt: null} -> alguém recusou: ninguém adota, ninguém mais pergunta
 */
export interface TripsOwner {
  userId: string | null;
  adoptedAt: string | null;
}

/**
 * O pedido de consentimento em aberto. `tripIds` é congelado no instante da pergunta: é
 * exatamente o conjunto sobre o qual o usuário está decidindo, e o número que ele lê na tela.
 */
export interface AdoptionPrompt {
  userId: string;
  tripIds: string[];
}

type AdoptionListener = (prompt: AdoptionPrompt | null) => void;

const listeners = new Set<AdoptionListener>();

let started = false;
let prompt: AdoptionPrompt | null = null;

// ---------------------------------------------------------------------------
// A chave
// ---------------------------------------------------------------------------

function isOwner(value: unknown): value is TripsOwner {
  const owner = value as TripsOwner | null;
  return Boolean(owner)
    && typeof owner === 'object'
    && (owner.userId === null || typeof owner.userId === 'string')
    && (owner.adoptedAt === null || typeof owner.adoptedAt === 'string');
}

/**
 * O marcador como está gravado, ou `null` quando ausente.
 *
 * Marcador TORTO também devolve `null` — ou seja, "nunca perguntado". É a escolha
 * recuperável das três: perguntar de novo custa um diálogo e a re-adoção é idempotente
 * (`upsert` por PK), enquanto ler lixo como recusa silenciaria o app para sempre e lê-lo como
 * adoção subiria o passado sem consentimento.
 */
export function getTripsOwner(): TripsOwner | null {
  const raw = loadJson<unknown>(OWNER_KEY, null);
  if (raw === null || raw === undefined) return null;

  if (!isOwner(raw)) {
    console.warn(`[tripAdoption] ${OWNER_KEY} em formato inesperado — tratando como ausente`);
    return null;
  }

  return { userId: raw.userId, adoptedAt: raw.adoptedAt };
}

/**
 * NUNCA LANÇA. Um `QuotaExceededError` aqui não pode derrubar o clique do usuário — e a
 * consequência de não gravar é conhecida e benigna: o app pergunta de novo na próxima sessão.
 * É por isso que o `accept` enfileira ANTES de gravar (ver lá).
 */
function writeOwner(owner: TripsOwner): void {
  try {
    localStorage.setItem(OWNER_KEY, JSON.stringify(owner));
  } catch (err) {
    console.warn(`[tripAdoption] não foi possível gravar ${OWNER_KEY}`, err);
  }
}

// ---------------------------------------------------------------------------
// Estado observável — mesmo contrato do session.ts e do tripStore
// ---------------------------------------------------------------------------

/** O pedido em aberto, ou `null`. Síncrono: quem monta depois do boot lê isto na montagem. */
export function getAdoptionPrompt(): AdoptionPrompt | null {
  return prompt;
}

/**
 * Assina o pedido de consentimento. Devolve o unsubscribe.
 *
 * NÃO chama o listener na assinatura — mesmo contrato do `subscribeSession` (4b) e do
 * `subscribeTrips` (Arco 1). O diálogo monta lendo `getAdoptionPrompt()` de forma síncrona e
 * assina para o que vier depois; sem isso ele perderia um pedido emitido antes da montagem,
 * que é o caso normal (a sessão resolve na rota `/`, onde o diálogo não renderiza).
 */
export function subscribeAdoption(listener: AdoptionListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Um listener que lança não derruba os outros — mesma proteção do emit do session.ts.
function setPrompt(next: AdoptionPrompt | null): void {
  prompt = next;
  listeners.forEach((listener) => {
    try {
      listener(prompt);
    } catch (err) {
      console.warn('[tripAdoption] listener lançou exceção — ignorado', err);
    }
  });
}

// ---------------------------------------------------------------------------
// O gatilho
// ---------------------------------------------------------------------------

/** Ids locais válidos. Viagem sem id não tem PK possível e não pode ser adotada. */
function localTripIds(): string[] {
  return listTrips()
    .map((trip) => trip?.id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);
}

/**
 * Uma avaliação por RESOLUÇÃO DE SESSÃO — nunca no sino do `tripStore`.
 *
 * A distinção não é estilo: se a avaliação rodasse a cada escrita, criar uma viagem logo
 * depois de um login sem viagens dispararia o diálogo sobre uma viagem que o espelho da 4c
 * está subindo naquele instante. A pergunta é sobre o PASSADO, e o passado se define no
 * momento em que a sessão resolve.
 */
function evaluate(): void {
  // O `null` do boot é "ainda não sei", não "anônimo" — a mesma regra do guard da 4c.
  if (!isSessionResolved()) return;

  const userId = getCurrentUserId();

  // Pedido pendente não sobrevive à troca de sessão: consentimento dado por A não vale para
  // B, e um modal aberto em nome de quem já saiu é pergunta sem dono.
  if (prompt && prompt.userId !== userId) setPrompt(null);

  if (!userId) return; // anônimo: nada a decidir, e nada é gravado
  if (prompt) return;  // já estou perguntando para este mesmo usuário

  // Ausente é o ÚNICO estado que faz alguma coisa. Os outros três — recusa, dono atual e
  // dono diferente — terminam aqui, cada um pelo seu motivo (ver `TripsOwner`). O ramo do
  // dono diferente é o que a 4f vai transformar em "limpa o local e hidrata do banco dele".
  if (getTripsOwner()) return;

  const tripIds = localTripIds();

  if (tripIds.length === 0) {
    // Dono sem passado. Gravar aqui fecha um buraco real: sem isso, as viagens criadas DEPOIS
    // deste login — que o espelho já subiu — apareceriam na sessão seguinte como "passado" e
    // o app perguntaria se pode trazer para a conta viagens que já estão nela.
    // Sem diálogo, de propósito: não há o que consentir quando não há o que adotar.
    writeOwner({ userId, adoptedAt: null });
    return;
  }

  setPrompt({ userId, tripIds });
}

/**
 * Liga a adoção. Idempotente, e não devolve promessa: o boot não espera por rede.
 *
 * A assinatura não é guardada para desligar depois — este módulo vive o tempo do documento,
 * como o `session.ts` e o `tripSync.ts`.
 */
export function startTripAdoption(): void {
  if (started) return;
  started = true;

  subscribeSession(() => evaluate());

  // A sessão pode ter resolvido ANTES desta linha: `subscribeSession` não replica o estado
  // atual na assinatura (contrato do 4b). Mesmo empurrão do `startTripSync()`.
  evaluate();
}

// ---------------------------------------------------------------------------
// As duas respostas
// ---------------------------------------------------------------------------

/**
 * Revalida o dono da pergunta. Se a sessão trocou com o modal aberto (logout, ou login de
 * outra conta em outra aba), a decisão é DESCARTADA sem gravar nada: ninguém decide o destino
 * de dados em nome de uma sessão que não é mais a sua.
 */
function claimPrompt(): AdoptionPrompt | null {
  const current = prompt;
  if (!current) return null;

  if (getCurrentUserId() !== current.userId) {
    console.warn('[tripAdoption] a sessão mudou com o pedido aberto — decisão descartada');
    setPrompt(null);
    return null;
  }

  return current;
}

/**
 * "Trazer para minha conta": enfileira o passado e devolve o problema ao outbox.
 *
 * A ORDEM DAS DUAS ESCRITAS É O DESENHO. Enfileira primeiro, grava o marcador depois: se a
 * gravação falhar, a próxima sessão pergunta de novo e a re-adoção é inofensiva (`upsert` por
 * PK no banco, dedupe por id no `enqueue`). Na ordem inversa, um marcador gravado com a fila
 * vazia seria "adotado" com o passado nunca enviado — e ninguém mais perguntaria. Falhar
 * re-perguntando é recuperável; falhar em silêncio, não.
 *
 * O `flush()` vem por último e não é esperado: se a rede estiver caída, as entradas ficam no
 * outbox e sobem no próximo gatilho. Do ponto de vista do usuário, a adoção já aconteceu.
 */
export function acceptAdoption(): void {
  const current = claimPrompt();
  if (!current) return;

  // Interseção com o que ainda existe: um id apagado em outra aba entre a pergunta e o clique
  // viraria upsert órfão, que o `sendUpserts` descarta com aviso — barulho sem função. Adota-se
  // o que foi mostrado, menos o que deixou de existir. Viagens criadas DEPOIS da pergunta não
  // entram aqui de propósito: são escrita pós-login, e o espelho da 4c já as enfileirou.
  const alive = new Set(localTripIds());
  const ids = current.tripIds.filter((id) => alive.has(id));

  enqueueUpserts(ids, current.userId);
  writeOwner({ userId: current.userId, adoptedAt: new Date().toISOString() });

  setPrompt(null);
  void flush();
}

/**
 * "Deixar só neste navegador": grava a recusa e não fala com o banco.
 *
 * `userId: null` — a recusa vale para o navegador, não para a conta. Um segundo usuário neste
 * mesmo navegador também não terá o passado adotado, o que é a direção conservadora: o risco 1
 * do recon é justamente apropriar-se de viagens alheias no primeiro login.
 */
export function declineAdoption(): void {
  const current = claimPrompt();
  if (!current) return;

  writeOwner({ userId: null, adoptedAt: null });
  setPrompt(null);
}
