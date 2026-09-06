// supabase/functions/metrics/index.ts
// Arco 5.e — a leitura da telemetria, para o fundador, por `curl`.
//
// POR QUE ESTA FUNCTION EXISTE: o painel do Supabase do projeto Lovable é
// inacessível (RELATORIO-F3-ARCO5C.md) e a leitura de logs pelo Lovable retém só
// o boot atual. O critério do 5.f (RELATORIO-F3-ARCO5D.md §6.2) é literalmente
// uma série de 7 dias — pedir ao Lovable que leia e transcreva sete números, sete
// vezes, é frágil no lugar exato onde a decisão vai ser tomada. Esta function é o
// que transforma "a sombra está ligada" em "aqui está a série".
//
// ESTA É A PRIMEIRA PORTA DO ARCO 5 QUE FECHA — e fecha por ser administrativa.
// A proibição de bloquear protege o tráfego EXISTENTE de kinu-ai e
// feedback-notify; um endpoint administrativo que nasce fechado não muda
// requisição nenhuma que hoje existe. Endpoint admin aberto é que seria o pecado
// (é exatamente o R-04 que matou a feedback-digest).
//
// FAIL-CLOSED POR CONSTRUÇÃO: sem METRICS_ALLOWED_SUBS configurado, devolve 503 e
// não lê nada. Um deploy sem o segredo não abre coisa alguma.

import { corsGate } from "../_shared/http.ts";
import { verifyKinuBetaJwt } from "../_shared/verifyKinuBetaJwt.ts";

const DEFAULT_DAYS = 7;
const MAX_DAYS = 90;
const READ_TIMEOUT_MS = 8_000;

// Os motivos que o 5.d §6.2 conta como BUG NOSSO — não como abuso. `malformed` e
// `alg:*` ficam de fora de propósito: são lixo de terceiro batendo na porta, não
// defeito do nosso caminho de autenticação.
const BUG_REASONS = ["expired", "bad-iss", "bad-aud", "bad-signature"];
const isBug = (outcome: string) =>
  BUG_REASONS.includes(outcome) || outcome.startsWith("role:");

interface ShadowRow { day: string; fn: string; outcome: string; hits: number }
interface RateRow {
  day: string; fn: string; kind: string;
  buckets: number; reqs: number; max_hits_hour: number;
}

function allowedSubs(): string[] {
  // Lido a cada requisição para que trocar o secret valha sem redeploy, assim que
  // o isolate atender a próxima chamada (mesmo padrão do ALLOWED_ORIGINS do 5.c).
  return (Deno.env.get("METRICS_ALLOWED_SUBS") ?? "")
    .split(",").map((s) => s.trim()).filter(Boolean);
}

function pct(part: number, whole: number): number | null {
  if (!whole) return null;
  return Math.round((part / whole) * 10000) / 100;
}

/**
 * Transforma linhas cruas no critério do 5.d §6.2. É o ponto do arco: o fundador
 * não deveria ter que somar colunas à mão para saber se pode apertar.
 *
 * O denominador de `bugPctComHeader` é `total - no-header`, e não `total`. Medir
 * motivo de bug contra o total misturaria tráfego anônimo legítimo no divisor e
 * faria qualquer defeito parecer pequeno — é a correção que o 5.d §6.2 registrou.
 */
export function criterio(rows: ShadowRow[]) {
  const byDayFn = new Map<string, {
    day: string; fn: string; total: number; identified: number;
    noHeader: number; bugs: number; jwksUnavailable: number;
    outcomes: Record<string, number>;
  }>();

  for (const r of rows) {
    const k = `${r.day}|${r.fn}`;
    let acc = byDayFn.get(k);
    if (!acc) {
      acc = {
        day: r.day, fn: r.fn, total: 0, identified: 0,
        noHeader: 0, bugs: 0, jwksUnavailable: 0, outcomes: {},
      };
      byDayFn.set(k, acc);
    }
    const hits = Number(r.hits) || 0;
    acc.total += hits;
    acc.outcomes[r.outcome] = (acc.outcomes[r.outcome] ?? 0) + hits;
    if (r.outcome === "identified") acc.identified += hits;
    if (r.outcome === "no-header") acc.noHeader += hits;
    if (r.outcome === "jwks-unavailable") acc.jwksUnavailable += hits;
    if (isBug(r.outcome)) acc.bugs += hits;
  }

  return [...byDayFn.values()]
    .sort((a, b) => (a.day === b.day ? a.fn.localeCompare(b.fn) : b.day.localeCompare(a.day)))
    .map((a) => {
      const comHeader = a.total - a.noHeader;
      return {
        day: a.day,
        fn: a.fn,
        total: a.total,
        identified: a.identified,
        comHeader,
        // Critério 1 do 5.f: estável por 7 dias, variação < 10 p.p. de um dia
        // para o outro.
        identifiedPct: pct(a.identified, a.total),
        // Critério 1 do 5.f: < 1 % das requisições QUE VIERAM COM HEADER.
        bugs: a.bugs,
        bugPctComHeader: pct(a.bugs, comHeader),
        // Critério 2 do 5.f: < 0,1 %.
        jwksUnavailablePct: pct(a.jwksUnavailable, a.total),
        outcomes: a.outcomes,
      };
    });
}

Deno.serve(async (req) => {
  // Mesmo envelope das outras 10 (5.c). limit baixo: é endpoint de leitura
  // manual, ninguém dispara isto em rajada legítima.
  const gate = corsGate(req, { fn: "metrics", limit: 10, windowMs: 10_000 });
  if (gate.response) return gate.response;
  const corsHeaders = gate.headers;

  const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const subs = allowedSubs();
    if (subs.length === 0) {
      console.error("[5e-metrics] METRICS_ALLOWED_SUBS ausente — endpoint fechado");
      return json({ error: "metrics-not-configured" }, 503);
    }

    // Mesma identidade do 5.d, mas aqui verificada DE VERDADE: o veredicto decide
    // a resposta em vez de só marcar o envelope.
    const raw = req.headers.get("x-kinu-authorization") ?? "";
    const token = raw.replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "forbidden" }, 403);

    const who = await verifyKinuBetaJwt(token);
    if (!("userId" in who) || !subs.includes(who.userId)) {
      // O motivo vai para o log, não para a resposta: quem bate na porta não
      // aprende nada sobre por que ela não abriu.
      console.warn(
        `[5e-metrics] recusado: ${"error" in who ? who.error : "sub-fora-da-allowlist"}`,
      );
      return json({ error: "forbidden" }, 403);
    }

    let days = DEFAULT_DAYS;
    try {
      const body = await req.json();
      const n = Number((body as { days?: unknown })?.days);
      if (Number.isFinite(n)) days = Math.min(Math.max(Math.trunc(n), 1), MAX_DAYS);
    } catch {
      /* corpo vazio ou não-JSON: o default de 7 dias é o do critério */
    }

    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) {
      console.error("[5e-metrics] SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY ausentes");
      return json({ error: "storage-unavailable" }, 503);
    }
    const base = url.replace(/\/+$/, "");
    const headers = {
      "Content-Type": "application/json",
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    };

    const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

    const [shadowRes, rateRes] = await Promise.all([
      fetch(
        `${base}/rest/v1/shadow_daily?day=gte.${since}` +
          `&order=day.desc,fn.asc,outcome.asc&limit=2000`,
        { headers, signal: AbortSignal.timeout(READ_TIMEOUT_MS) },
      ),
      fetch(`${base}/rest/v1/rpc/rate_metrics`, {
        method: "POST",
        headers,
        body: JSON.stringify({ p_days: days }),
        signal: AbortSignal.timeout(READ_TIMEOUT_MS),
      }),
    ]);

    if (!shadowRes.ok || !rateRes.ok) {
      const detail = `shadow=${shadowRes.status} rate=${rateRes.status}`;
      console.error(`[5e-metrics] leitura falhou: ${detail}`);
      // PGRST202/42P01 aqui = a migração ainda não chegou em produção.
      return json({ error: "read-failed", detail }, 200);
    }

    const shadow = await shadowRes.json() as ShadowRow[];
    const rate = await rateRes.json() as RateRow[];

    return json({
      generated_at: new Date().toISOString(),
      days,
      // O critério do 5.f, já somado.
      criterio: criterio(Array.isArray(shadow) ? shadow : []),
      // O número de calibração do limite por usuário: max_hits_hour, kind=user.
      rate: Array.isArray(rate) ? rate : [],
      shadow_raw: Array.isArray(shadow) ? shadow : [],
    }, 200);
  } catch (e) {
    console.error("[5e-metrics] erro inesperado:", e instanceof Error ? e.message : String(e));
    return json({ error: "unexpected" }, 200);
  }
});
