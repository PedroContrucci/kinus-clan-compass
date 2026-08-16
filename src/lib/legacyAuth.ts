// Corte seco do mock de auth — RELATORIO-RECON-AUTH.md §6(d), opção A com o
// verniz de B.
//
// ESTE É O ÚNICO ARQUIVO DO src/ QUE PODE TOCAR EM `kinu_user`.
// A meta de encerramento do Arco 3 é `grep -rn "kinu_user" src/` sem nenhuma
// ocorrência fora daqui (mesma disciplina do tripStore no Arco 1: uma chave,
// uma porta). Quando o legado morrer de vez, apaga-se o arquivo inteiro.
//
// Por que corte seco: as sessões do mock são `{email, name}` sem senha e sem
// email validado. Não existe caminho técnico que as transforme em conta real
// sem a participação da pessoa (recon §6(d), opção C = inviável). O que dá
// para fazer é não deixar ninguém digitar duas vezes o que já digitou.
//
// As VIAGENS NÃO ESTÃO EM RISCO: `kinu_trips` não é escopado por usuário.
// Apagar `kinu_user` não apaga viagem nenhuma.

const LEGACY_USER_KEY = 'kinu_user';

export interface LegacyIdentity {
  email: string;
  name: string;
}

/**
 * Lê a sessão do mock e a APAGA no mesmo gesto — ler é consumir.
 *
 * Idempotente: a segunda chamada não acha mais a chave e devolve null.
 * Devolve null também quando não havia nada, quando o JSON estava torto (a
 * chave é apagada mesmo assim) ou quando o localStorage não está disponível.
 */
export function consumeLegacyUser(): LegacyIdentity | null {
  let raw: string | null = null;

  try {
    if (typeof localStorage === 'undefined') return null;
    raw = localStorage.getItem(LEGACY_USER_KEY);
  } catch (error) {
    console.warn('[legacyAuth] localStorage indisponível', error);
    return null;
  }

  if (raw === null) return null;

  // A chave morre aqui, aconteça o que acontecer com o parse abaixo.
  try {
    localStorage.removeItem(LEGACY_USER_KEY);
  } catch (error) {
    console.warn('[legacyAuth] não consegui apagar kinu_user', error);
  }

  try {
    const parsed = JSON.parse(raw) as { email?: unknown; name?: unknown } | null;
    return {
      email: typeof parsed?.email === 'string' ? parsed.email.trim() : '',
      name: typeof parsed?.name === 'string' ? parsed.name.trim() : '',
    };
  } catch (error) {
    console.warn('[legacyAuth] kinu_user corrompido — apagado sem verniz', error);
    return null;
  }
}
