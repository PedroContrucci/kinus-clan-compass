// supabase/functions/_shared/http.ts
// Arco 5.c — envelope HTTP compartilhado das edge functions: CORS com allowlist
// + burst guard em memória. NÃO contém lógica de negócio de função nenhuma.
// Base: RELATORIO-RECON-ARCO5.md §2 (CORS hoje), §5.1 (memória como 1º estágio),
// §6.2 (fase 5.c) e §6.3 itens 6, 8 e 9.
//
// Sem imports, de propósito: nenhuma dependência de rede no boot.

// Dialeto longo (8 das 11 funções já usavam) + x-kinu-authorization, que o Arco
// 5.d vai precisar. Unificado aqui para nunca mais existir "funciona em metade
// do app" (recon §2.2).
const ALLOW_HEADERS = [
  "authorization",
  "x-client-info",
  "apikey",
  "content-type",
  "x-supabase-client-platform",
  "x-supabase-client-platform-version",
  "x-supabase-client-runtime",
  "x-supabase-client-runtime-version",
  "x-kinu-authorization",
].join(", ");

// unsplash é consumida por GET (useUnsplash.ts:97, DestinationImage.tsx:31,
// tripPdfExport.ts:694); as outras por POST.
const ALLOW_METHODS = "GET, POST, OPTIONS";
const MAX_AGE = "86400"; // 24 h — o navegador impõe o teto dele (Chrome: 2 h)
const DEFAULT_WINDOW_MS = 10_000;

export interface GateOptions {
  /** nome da função, para o log e para a chave do balde */
  fn: string;
  /** requisições permitidas na janela */
  limit: number;
  /** default 10_000 */
  windowMs?: number;
  /** false desliga o burst guard (feedback-digest, que já é 403) */
  burst?: boolean;
}

export interface Gate {
  /** sempre preenchido, inclusive no 403 */
  headers: Record<string, string>;
  /** != null => devolver imediatamente */
  response: Response | null;
}

// Lido a cada requisição (custo desprezível) para que trocar o secret valha sem
// redeploy, assim que o isolate atender a próxima chamada.
function readAllowlist(): string[] {
  const raw = Deno.env.get("ALLOWED_ORIGINS") ?? "";
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

/** Puro: sem Deno, sem rede, sem estado. É o que o harness do relatório exercita. */
export function isOriginAllowed(origin: string, allowlist: string[]): boolean {
  for (const entry of allowlist) {
    if (entry === "*") return true;
    if (entry.startsWith("*.")) {
      // "*.lovable.app" casa "https://x.lovable.app" e NÃO casa "https://evil-lovable.app"
      // (a zona começa com ponto) nem "https://x.lovable.app.evil.com".
      const zone = entry.slice(1);
      try {
        const u = new URL(origin);
        if (u.protocol !== "https:") continue;
        if (u.hostname.endsWith(zone) && u.hostname.length > zone.length) return true;
      } catch {
        continue; // Origin malformada não casa wildcard nenhum
      }
    } else if (entry === origin) {
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Burst guard — 1º estágio anti-rajada, em memória do isolate (recon §5.1).
// NÃO é quota e NÃO é livro-caixa: o contador é por isolate, o Supabase sobe N
// isolates, e cada cold start zera. O limite efetivo é N × limite, com N
// desconhecido. Isso é aceito de propósito — a quota fina é o Arco 5.e.
// ---------------------------------------------------------------------------
const BUCKETS = new Map<string, { count: number; resetAt: number }>();
const MAX_BUCKETS = 5_000;

function clientKey(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (!xff) return null;
  return xff.split(",")[0]?.trim() || null;
}

function burstCheck(
  req: Request,
  headers: Record<string, string>,
  opts: GateOptions,
): Response | null {
  try {
    const ip = clientKey(req);
    if (!ip) return null; // sem IP identificável => PASSA (fail-open declarado)

    const now = Date.now();
    const windowMs = opts.windowMs ?? DEFAULT_WINDOW_MS;
    const key = `${opts.fn}:${ip}`;

    if (BUCKETS.size > MAX_BUCKETS) {
      for (const [k, v] of BUCKETS) if (now >= v.resetAt) BUCKETS.delete(k);
      if (BUCKETS.size > MAX_BUCKETS) BUCKETS.clear();
    }

    const b = BUCKETS.get(key);
    if (!b || now >= b.resetAt) {
      BUCKETS.set(key, { count: 1, resetAt: now + windowMs });
      return null;
    }

    b.count++;
    if (b.count <= opts.limit) return null;

    const retryMs = b.resetAt - now;
    console.warn(`[${opts.fn}] burst: ${b.count} req em ${windowMs}ms de ${ip}`);
    return new Response(
      JSON.stringify({
        error: "Muitas requisições em sequência. Tente de novo em instantes.",
        retryAfterMs: retryMs,
      }),
      {
        status: 429,
        headers: {
          ...headers,
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil(retryMs / 1000)),
        },
      },
    );
  } catch (err) {
    // Fail-open explícito (recon §5.5): um bug do guard nunca pode apagar o app.
    console.error(
      `[${opts.fn}] burstGuard falhou, passando:`,
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}

export function corsGate(req: Request, opts: GateOptions): Gate {
  const origin = req.headers.get("origin");
  const allowlist = readAllowlist();
  const wildcardMode = allowlist.length === 0; // env ausente => comportamento de hoje

  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": ALLOW_HEADERS,
    "Access-Control-Allow-Methods": ALLOW_METHODS,
    "Access-Control-Max-Age": MAX_AGE,
    // Sempre presente: a resposta PODE depender da Origin, então nenhum cache
    // intermediário tem direito de reaproveitá-la entre origens (recon §2.3).
    "Vary": "Origin",
  };

  if (!origin) {
    // REGRA CRÍTICA (recon §6.2): se NÃO veio Origin, PASSA.
    // kinu-ai:250 -> google-places, curl e todo consumo servidor→servidor caem
    // aqui. Requisição sem Origin não é navegador fazendo cross-site.
    headers["Access-Control-Allow-Origin"] = "*";
  } else if (wildcardMode) {
    headers["Access-Control-Allow-Origin"] = "*";
  } else if (isOriginAllowed(origin, allowlist)) {
    headers["Access-Control-Allow-Origin"] = origin;
  } else {
    // Porta fechada ANTES de gastar cota ou fatura. Sem Allow-Origin: o
    // navegador bloquearia a leitura de qualquer jeito — mas aí o dinheiro já
    // teria sido gasto.
    console.warn(`[${opts.fn}] origem recusada: ${origin}`);
    return {
      headers,
      response: new Response(
        JSON.stringify({ error: "Origem não autorizada" }),
        { status: 403, headers: { ...headers, "Content-Type": "application/json" } },
      ),
    };
  }

  if (req.method === "OPTIONS") {
    return { headers, response: new Response(null, { headers }) };
  }

  if (opts.burst !== false) {
    const blocked = burstCheck(req, headers, opts);
    if (blocked) return { headers, response: blocked };
  }

  return { headers, response: null };
}
