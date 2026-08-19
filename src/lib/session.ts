/**
 * session.ts — a sessão do kinu-beta como estado observável, sem React.
 *
 * POR QUE EXISTE: o tripSync do Arco 4c precisa saber QUEM é o usuário no instante em que
 * o sino do tripStore toca — num caminho síncrono, fora de qualquer componente. O recon
 * §4.1 descartou as duas alternativas: passar `user_id` por parâmetro envenenaria a
 * assinatura das 12 exports do store (e os 28 pontos migrados no Arco 1), e chamar
 * `kinuBeta.auth.getSession()` dentro do store é `async` — não serve a um `listTrips()`
 * síncrono, faria uma chamada por operação e acoplaria o funil ao cliente do banco.
 *
 * O PADRÃO é o mesmo já provado em `useAuth.ts:77-108`: assina o GoTrue ANTES de pedir a
 * sessão inicial, e a resolução cai na primeira das duas respostas — inclusive quando essa
 * resposta é uma falha de rede. A diferença é que aqui o estado vive no módulo, não em
 * `useState`: quem lê não precisa ser componente nem estar montado.
 *
 * SEM STORAGE PRÓPRIO: quem persiste a sessão é o GoTrue, na chave `kinu-beta-auth`
 * (`client.ts`). Este módulo é cache em memória e nada mais. Não grava, não lê localStorage.
 *
 * SOBRE A ASSINATURA DUPLICADA: o `useAuth` continua com a dele, intocado. São dois
 * assinantes do MESMO GoTrueClient — não são dois clientes; o aviso
 * `Multiple GoTrueClient instances` já registrado na 3a §6.4 não piora com isto. Unificar
 * os dois é melhoria de arco futuro (recon §9 risco 14).
 */

import { kinuBeta } from '@/integrations/kinu-beta/client';

type SessionListener = (userId: string | null) => void;

const listeners = new Set<SessionListener>();

let started = false;
let resolved = false;
let currentUserId: string | null = null;

/**
 * O id do usuário logado — SÍNCRONO, do cache em memória.
 *
 * `null` quer dizer duas coisas diferentes: "sem sessão" e "ainda não sei". Quem precisa
 * distinguir pergunta a `isSessionResolved()`.
 */
export function getCurrentUserId(): string | null {
  return currentUserId;
}

/**
 * `false` até a primeira resolução — venha ela pelo evento do GoTrue, pelo `getSession` ou
 * pela FALHA dele.
 *
 * É este bit que impede o espelho do 4c de ler o `null` do boot como "usuário anônimo" e
 * adotar/limpar viagens de alguém que está a 200ms de aparecer. Mesmo papel do `isLoading`
 * do `useAuth`, só que legível de fora do React.
 */
export function isSessionResolved(): boolean {
  return resolved;
}

/**
 * Assina as mudanças de sessão. Devolve o unsubscribe.
 *
 * NÃO chama o listener na hora da assinatura: quem assina já pode ler
 * `getCurrentUserId()` + `isSessionResolved()` de forma síncrona, na linha seguinte. Mesmo
 * contrato do `subscribeTrips` do Arco 1 (`tripStore.ts:216`) — uma porta, um sino.
 */
export function subscribeSession(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Um listener que lança não pode derrubar os outros — mesma proteção do emit do
// tripStore (`tripStore.ts:192-200`).
function emit(): void {
  listeners.forEach((listener) => {
    try {
      listener(currentUserId);
    } catch (err) {
      console.warn('[session] listener lançou exceção — ignorado', err);
    }
  });
}

/** Aceita `Session | null` do GoTrue sem depender do tipo, e nunca lança. */
function readUserId(session: unknown): string | null {
  const user = (session as { user?: { id?: unknown } } | null | undefined)?.user;
  return typeof user?.id === 'string' ? user.id : null;
}

/**
 * Aplica um estado de sessão vindo de qualquer das duas fontes.
 *
 * REGRA DE EMISSÃO:
 *   1. primeira resolução -> emite SEMPRE, mesmo com id `null`;
 *   2. depois             -> emite só quando o id MUDA.
 *
 * O item 1 existe porque quem assina antes do boot — que é exatamente o caso do
 * `startTripSync()` da 4c — precisa de um toque no instante em que a resposta deixa de ser
 * "ainda não sei". No caminho anônimo esse toque nunca viria de um evento.
 *
 * Refresh de token chega como evento novo carregando o MESMO id: cai no item 2 e não
 * emite. Sem essa comparação, o espelho do 4c recalcularia o diff da lista inteira a cada
 * hora, para nada.
 */
function applySession(userId: string | null): void {
  const firstResolution = !resolved;
  const changed = userId !== currentUserId;

  resolved = true;
  currentUserId = userId;

  if (firstResolution || changed) emit();
}

/**
 * Liga o módulo. Idempotente: a segunda chamada é no-op — não assina de novo, não pede
 * sessão de novo, não mexe no estado já resolvido.
 *
 * Não devolve promessa de propósito: o boot não espera por rede. Quem precisa saber quando
 * resolveu usa `subscribeSession` ou `isSessionResolved()`.
 */
export function startSession(): void {
  if (started) return;
  started = true;

  // ANTES do getSession, pela mesma razão do useAuth: entre assinar e resolver existe uma
  // janela, e um evento que caia nela (login em outra aba, refresh, retorno do OAuth) some
  // se a assinatura vier depois. A subscription não é guardada: este módulo vive o tempo
  // do documento e não há `stopSession()`.
  kinuBeta.auth.onAuthStateChange((_event, session) => {
    applySession(readUserId(session));
  });

  kinuBeta.auth
    .getSession()
    .then((result) => {
      // Só resolve se o evento ainda não resolveu. O GoTrue v2 sempre emite
      // INITIAL_SESSION, então na prática este caminho é cinto de segurança — e aplicá-lo
      // tarde reabriria justamente a janela que a ordem acima fecha: um SIGNED_IN chegado
      // no meio seria sobrescrito pelo retrato velho que o getSession leu.
      if (resolved) return;
      applySession(readUserId(result?.data?.session));
    })
    .catch((error) => {
      // Rede caída não pode deixar o 4c esperando para sempre por uma resolução que não
      // vem: "sem sessão" é estado legítimo e o espelho sabe o que fazer com ele (nada).
      // Mesma decisão do `useAuth.ts:95-102`.
      console.error('[session] getSession falhou', error);
      if (resolved) return;
      applySession(null);
    });
}
