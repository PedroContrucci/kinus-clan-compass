// supabase/functions/_shared/verifyKinuBetaJwt.ts
// Arco 5.d — identidade do kinu-beta DENTRO das functions do Lovable (rota (a) do
// recon §4.1). Verifica o access token do GoTrue do kinu-beta por JWKS ES256.
// Base: RELATORIO-RECON-ARCO5.md §4.0 (JWKS público), §4.1 (o algoritmo),
// §3.5 (por que a anon key não pode ser aceita), §6.2 (fase 5.d).
//
// MODO SOMBRA: este módulo NUNCA bloqueia e NUNCA lança. Ele responde uma de duas
// coisas — "é este usuário" ou "não sei quem é, por este motivo". Quem decide o
// que fazer com a resposta é o Arco 5.f, não este arquivo.
//
// Sem imports, pela mesma regra do _shared/http.ts: nenhuma dependência de rede no
// boot, e é o que permite exercitar o arquivo real fora do Deno.
//
// POR QUE WebCrypto PURO E NÃO `npm:jose`: a assinatura ES256 de um JWS é r||s, 64
// bytes crus — exatamente o que crypto.subtle.verify consome para ECDSA. Não há
// conversão DER para errar. E a única regra que de fato nos protege (recusar quem
// não é `authenticated`) o jose não faz sozinho: seria escrita à mão de qualquer
// jeito. Trocar ~25 linhas de checagem por uma dependência npm no caminho crítico
// das duas functions mais caras é câmbio ruim.

// O ref do kinu-beta não é segredo: é URL pública, já viaja no bundle do browser.
// Env com fallback embutido é o padrão do ALLOWED_ORIGINS (5.c): sem secret
// configurado, o comportamento correto já é o default — importa porque configurar
// secret no projeto do Lovable custa um prompt (adendo do 5.c).
const ISSUER = (
  Deno.env.get("KINU_BETA_ISSUER") ??
  "https://qbhcrwndkfzqeviiayvq.supabase.co/auth/v1"
).replace(/\/+$/, "");

const JWKS_URL = `${ISSUER}/.well-known/jwks.json`;

const ACCEPTED_AUD = ["authenticated"];

// ESTRITO, por decisão do arco: lista branca de um item. `service_role` não é
// usuário, e uma lista branca falha FECHADA — um papel novo do Supabase vira
// `bad-role` no log da sombra (visível, corrigível) em vez de entrar calado.
const REQUIRED_ROLE = "authenticated";

const CLOCK_SKEW_S = 60;
const JWKS_TIMEOUT_MS = 3_000;

// Cooldown do refetch. Sem ele, um atacante mandando `kid` aleatório provoca UMA
// chamada de rede por requisição: o refetch de rotação de chave viraria
// amplificador. Vale também para nova tentativa após falha — JWKS fora do ar é no
// máximo 1 fetch/min por isolate.
const JWKS_RETRY_COOLDOWN_MS = 60_000;

export type VerifyResult = { userId: string } | { error: string };

export interface ShadowVerdict {
  identified: boolean;
  userId?: string;
  reason?: string;
}

interface Jwk {
  kid?: string;
  kty?: string;
  crv?: string;
  x?: string;
  y?: string;
}

// Cache em escopo de módulo: vive enquanto o isolate viver (recon §4.1 item 1).
// Uma busca por isolate, não por requisição.
let jwksKeys: Jwk[] | null = null;
let jwksLastAttemptAt = 0;
const keyCache = new Map<string, CryptoKey>();

/** Só ASCII inofensivo sai daqui: valor vindo do token nunca entra cru em header
 *  de resposta nem em linha de log (injeção de CRLF quebraria os dois). */
function safeLabel(value: unknown): string {
  return typeof value === "string"
    ? value.replace(/[^A-Za-z0-9._:-]/g, "").slice(0, 24) || "empty"
    : "none";
}

function b64urlToBytes(seg: string): Uint8Array | null {
  const rest = seg.length % 4;
  if (rest === 1) return null;
  const pad = rest === 2 ? "==" : rest === 3 ? "=" : "";
  try {
    const bin = atob(seg.replace(/-/g, "+").replace(/_/g, "/") + pad);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

function decodeSegment(seg: string): Record<string, unknown> | null {
  const bytes = b64urlToBytes(seg);
  if (!bytes) return null;
  try {
    const obj = JSON.parse(new TextDecoder().decode(bytes));
    return obj && typeof obj === "object" && !Array.isArray(obj)
      ? obj as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

async function loadJwks(force: boolean): Promise<Jwk[] | null> {
  if (jwksKeys && !force) return jwksKeys;

  const now = Date.now();
  // Um JWKS buscado há instantes não fica menos velho ao ser buscado de novo:
  // o cooldown é o que separa "rotação de chave" de "sonda com kid aleatório".
  if (jwksLastAttemptAt !== 0 && now - jwksLastAttemptAt < JWKS_RETRY_COOLDOWN_MS) {
    return jwksKeys;
  }
  jwksLastAttemptAt = now;

  try {
    const res = await fetch(JWKS_URL, { signal: AbortSignal.timeout(JWKS_TIMEOUT_MS) });
    if (!res.ok) {
      console.error(`[5d] JWKS respondeu ${res.status}`);
      return jwksKeys;
    }
    const body = await res.json() as { keys?: unknown };
    if (!Array.isArray(body?.keys)) {
      console.error("[5d] JWKS sem array `keys`");
      return jwksKeys;
    }
    jwksKeys = body.keys as Jwk[];
    keyCache.clear(); // chaves importadas do JWKS anterior não valem mais
    return jwksKeys;
  } catch (err) {
    // Rede caída, timeout, JSON quebrado: a sombra registra e a requisição segue.
    console.error("[5d] JWKS indisponível:", err instanceof Error ? err.message : String(err));
    return jwksKeys;
  }
}

async function importVerifyKey(kid: string, jwk: Jwk): Promise<CryptoKey | null> {
  const cached = keyCache.get(kid);
  if (cached) return cached;

  if (jwk.kty !== "EC" || jwk.crv !== "P-256" || !jwk.x || !jwk.y) return null;

  try {
    // JWK reconstruído com os campos mínimos de propósito: `use` e `key_ops` do
    // JWKS original conflitam com `keyUsages` em algumas implementações.
    const key = await crypto.subtle.importKey(
      "jwk",
      { kty: "EC", crv: "P-256", x: jwk.x, y: jwk.y, ext: true },
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"],
    );
    keyCache.set(kid, key);
    return key;
  } catch {
    return null;
  }
}

/**
 * Verifica um access token do kinu-beta. NUNCA lança.
 *
 * A ordem importa: a assinatura é conferida ANTES de qualquer claim. Validar `exp`
 * de um payload não verificado é ler dado do atacante — qualquer outra ordem é um
 * bug esperando data.
 */
export async function verifyKinuBetaJwt(token: string): Promise<VerifyResult> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return { error: "malformed" };

    const header = decodeSegment(parts[0]);
    if (!header) return { error: "malformed" };

    // Mata `alg: none` e a anon key HS256 do recon §3.5 sem tocar em rede.
    if (header.alg !== "ES256") return { error: `alg:${safeLabel(header.alg)}` };

    const kid = typeof header.kid === "string" ? header.kid : "";
    if (!kid) return { error: "no-kid" };

    let keys = await loadJwks(false);
    let jwk = keys?.find((k) => k.kid === kid);
    if (!jwk) {
      keys = await loadJwks(true); // rotação de chave sem downtime (com cooldown)
      jwk = keys?.find((k) => k.kid === kid);
    }
    if (!keys) return { error: "jwks-unavailable" };
    if (!jwk) return { error: "unknown-kid" };

    const key = await importVerifyKey(kid, jwk);
    if (!key) return { error: "bad-jwk" };

    const signature = b64urlToBytes(parts[2]);
    if (!signature) return { error: "malformed" };
    // ES256 = r||s, 32 + 32. Qualquer outro tamanho não é assinatura deste alg.
    if (signature.length !== 64) return { error: "bad-sig-format" };

    const signed = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const ok = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      signature,
      signed,
    );
    if (!ok) return { error: "bad-signature" };

    // --- daqui para baixo as claims são confiáveis ---
    const claims = decodeSegment(parts[1]);
    if (!claims) return { error: "malformed" };

    const nowS = Math.floor(Date.now() / 1000);
    if (typeof claims.exp !== "number" || nowS > claims.exp + CLOCK_SKEW_S) {
      return { error: "expired" };
    }
    if (typeof claims.nbf === "number" && nowS + CLOCK_SKEW_S < claims.nbf) {
      return { error: "not-yet-valid" };
    }
    if (claims.iss !== ISSUER) return { error: "bad-iss" };

    const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!aud.some((a) => typeof a === "string" && ACCEPTED_AUD.includes(a))) {
      return { error: "bad-aud" };
    }

    // Lista branca de um item — ver REQUIRED_ROLE. `anon` cai aqui, e é o alvo
    // declarado do recon §3.5; `service_role` também, e é de propósito.
    if (claims.role !== REQUIRED_ROLE) return { error: `role:${safeLabel(claims.role)}` };

    if (typeof claims.sub !== "string" || !claims.sub) return { error: "no-sub" };

    return { userId: claims.sub };
  } catch (err) {
    // Não existe caminho em que um bug daqui apague o app.
    console.error("[5d] verificador quebrou:", err instanceof Error ? err.message : String(err));
    return { error: "verifier-crashed" };
  }
}

/**
 * O envelope que as functions caras chamam: lê o header, verifica, LOGA, devolve.
 * Nunca lança, nunca bloqueia.
 *
 * Requisição sem `x-kinu-authorization` sai daqui sem tocar em rede nenhuma — o
 * custo do modo sombra para tráfego anônimo é uma leitura de header.
 */
export async function shadowIdentify(req: Request, fn: string): Promise<ShadowVerdict> {
  try {
    const raw = req.headers.get("x-kinu-authorization") ?? "";
    const token = raw.replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      console.log(`[5d-shadow] fn=${fn} identified=false reason=no-header`);
      return { identified: false, reason: "no-header" };
    }

    const result = await verifyKinuBetaJwt(token);

    if ("userId" in result) {
      // 8 caracteres: bastam para contar usuários distintos, não bastam para o log
      // virar identificador. O token JAMAIS é logado, em nenhum caminho.
      console.log(`[5d-shadow] fn=${fn} identified=true sub=${result.userId.slice(0, 8)}...`);
      return { identified: true, userId: result.userId };
    }

    console.log(`[5d-shadow] fn=${fn} identified=false reason=${result.error}`);
    return { identified: false, reason: result.error };
  } catch (err) {
    console.error("[5d] sombra quebrou:", err instanceof Error ? err.message : String(err));
    return { identified: false, reason: "shadow-crashed" };
  }
}

/**
 * O veredicto como header de resposta — a saída (B) do arco: o painel do Supabase
 * do projeto Lovable é inacessível (adendo do 5.c), então um `console.log` que
 * ninguém abre não é observação.
 *
 * O RECORTE é o que torna isto barato: só aparece quando o chamador MANDOU token.
 * Tráfego anônimo sai byte-a-byte igual ao de hoje, e não há o que vazar — o
 * veredicto é sobre um token que o próprio chamador acabou de enviar.
 *
 * Não exige Access-Control-Expose-Headers: quem lê é `curl`. O JS do app não lê
 * (nem precisa).
 */
export function shadowHeader(who: ShadowVerdict): Record<string, string> {
  if (who.reason === "no-header") return {};
  return {
    "x-kinu-shadow": who.identified ? "identified" : `rejected:${safeLabel(who.reason)}`,
  };
}
