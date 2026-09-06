// supabase/functions/_shared/telemetry.ts
// Arco 5.e — persiste o veredicto da sombra (5.d) e conta requisições por chave.
// Base: RELATORIO-RECON-ARCO5.md §5.3, §5.5 · RELATORIO-F3-ARCO5D.md §6.
//
// ESTE MÓDULO SÓ REGISTRA. Não bloqueia, não atrasa, não lança. O aperto é o 5.f.
//
// A regra que governa este arquivo: uma falha de telemetria NUNCA pode atrasar
// nem derrubar a resposta. Por isso `recordRequest` é SÍNCRONA e devolve `void` —
// é a única forma de o call site não ter como esperar por ela nem por engano. Um
// `await recordRequest(...)` escrito por distração amanhã seria um no-op, em vez
// de acoplar a resposta do KINU à latência do PostgREST.
//
// Sem imports de valor, pela mesma regra do _shared/http.ts e do
// verifyKinuBetaJwt.ts: nenhuma dependência de rede no boot, e é o que permite
// exercitar o arquivo REAL fora do Deno no harness. O `import type` abaixo é
// apagado em tempo de compilação — não existe em runtime.

import type { ShadowVerdict } from "./verifyKinuBetaJwt.ts";

const RPC_PATH = "/rest/v1/rpc/record_request";

// Curto de propósito: a promise não é aguardada, então este timeout não protege
// a resposta (ela já foi enviada) — protege o isolate de ficar preso a um
// PostgREST pendurado enquanto o runtime espera o waitUntil.
const RPC_TIMEOUT_MS = 2_000;

// 64 bits. Colisão é irrelevante nesta escala e o truncamento é mais uma barreira
// entre o contador e o IP de origem.
const HASH_HEX_CHARS = 16;

// Uma linha por isolate, não uma por requisição: env faltando é condição estável.
let warnedMissingEnv = false;

/** Só ASCII inofensivo entra em coluna de texto ou em linha de log. */
function safeLabel(value: unknown, fallback: string): string {
  if (typeof value !== "string" || !value) return fallback;
  return value.replace(/[^A-Za-z0-9._:-]/g, "").slice(0, 40) || fallback;
}

function firstForwardedIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (!xff) return null;
  return xff.split(",")[0]?.trim() || null;
}

/**
 * O IP nunca vira chave em claro. O contador não precisa saber QUEM é — só
 * precisa distinguir um de outro (recon §5.3: "ele guarda uma chave opaca, não
 * dado pessoal").
 *
 * O sal eleva o custo de reverter: sem ele, varrer os 4 bilhões de IPv4 e casar
 * o hash é trabalho de minutos. Com ele, não é impossível — a proteção de verdade
 * é a tabela ser deny-all. Env com fallback embutido é o padrão do 5.c/5.d:
 * configurar secret no projeto do Lovable custa um prompt.
 */
async function hashedIpKey(ip: string): Promise<string> {
  const salt = Deno.env.get("KINU_TELEMETRY_SALT") ?? "kinu-5e";
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${salt}|${ip}`),
  );
  let hex = "";
  for (const b of new Uint8Array(digest)) hex += b.toString(16).padStart(2, "0");
  return `ip:${hex.slice(0, HASH_HEX_CHARS)}`;
}

async function bucketKey(req: Request, who: ShadowVerdict | null): Promise<string> {
  // uuid INTEIRO: o log da sombra trunca em 8 para não virar identificador, mas
  // o contador precisa distinguir pessoas — é o insumo do limite por usuário.
  if (who?.identified && typeof who.userId === "string" && who.userId) {
    return `user:${who.userId}`;
  }
  const ip = firstForwardedIp(req);
  // Balde da chamada servidor→servidor (kinu-ai:250 → google-places) e de todo
  // consumo sem proxy. Conta separado de propósito: no 5.f ele NÃO pode virar
  // limite, porque todos caem nele juntos.
  if (!ip) return "ip:unknown";
  return await hashedIpKey(ip);
}

async function postRpc(fn: string, outcome: string, key: string): Promise<void> {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceKey) {
    if (!warnedMissingEnv) {
      warnedMissingEnv = true;
      console.error("[5e] telemetria desligada: SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY ausentes");
    }
    return;
  }

  // service_role e NÃO a anon key: `grant execute` só existe para service_role
  // (ver migração §9). Conceder à anon deixaria qualquer pessoa da internet
  // inflar o contador com a chave que viaja em todo bundle. A service key JÁ
  // está no ambiente de toda function deste projeto (feedback-digest:34) —
  // lê-la não cria segredo novo nem amplia superfície.
  const res = await fetch(`${url.replace(/\/+$/, "")}${RPC_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ p_fn: fn, p_outcome: outcome, p_key: key }),
    signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
  });

  if (!res.ok) {
    // PGRST202 aqui = migração ainda não aplicada, ou cache de schema do
    // PostgREST ainda não recarregou. Ruído no log, e nada mais.
    console.error(`[5e] record_request respondeu ${res.status}`);
  }

  // Drena o corpo para não deixar conexão pendurada no pool do isolate.
  try {
    await res.text();
  } catch {
    /* corpo já consumido ou conexão morta: irrelevante para telemetria */
  }
}

/**
 * Registra a requisição. Fire-and-forget: retorna antes de qualquer I/O.
 *
 * Nunca lança, nunca espera, nunca bloqueia — e não aplica limite nenhum.
 */
export function recordRequest(req: Request, fn: string, who: ShadowVerdict | null): void {
  try {
    const safeFn = safeLabel(fn, "unknown");
    const outcome = who?.identified ? "identified" : safeLabel(who?.reason, "unknown");

    const pending = (async () => {
      const key = await bucketKey(req, who);
      await postRpc(safeFn, outcome, key);
    })().catch((err) => {
      // Inclui o AbortError do timeout. Nada daqui sobe para o handler.
      console.error("[5e] telemetria falhou:", err instanceof Error ? err.message : String(err));
    });

    // O Edge Runtime do Supabase pode congelar o isolate assim que a resposta
    // sai; sem waitUntil a escrita se perde às vezes. O guard de `typeof` é o que
    // permite este arquivo rodar no harness e em qualquer outro runtime — sem
    // ele, seria ReferenceError no boot.
    const rt = (globalThis as {
      EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void };
    }).EdgeRuntime;
    if (rt && typeof rt.waitUntil === "function") rt.waitUntil(pending);
  } catch (err) {
    // Não existe caminho em que um bug daqui encoste na resposta do usuário.
    console.error("[5e] recordRequest quebrou:", err instanceof Error ? err.message : String(err));
  }
}
