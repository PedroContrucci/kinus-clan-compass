// place-photo — serve a foto de um lugar do catálogo curado a partir do Google Places (New).
// GET /place-photo?id=<id do catálogo>&w=<largura, opcional, padrão 640>
// Fluxo: id → RPC photo_ref_of (kinu-beta, anon) → photos/<ref>/media (Google, chave do servidor)
// → bytes da imagem com cache longo. A imagem NUNCA é armazenada (termos do Google); a atribuição
// vai no header x-kinu-attribution para o front exibir.
// Segredos (Lovable): GOOGLE_PLACES_API_KEY, KINU_BETA_URL, KINU_BETA_ANON_KEY.
// Sem corsGate de propósito: é <img src>, GET simples, sem preflight. Só ids conhecidos devolvem algo.

const GOOGLE_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY") ?? "";
const KB_URL = Deno.env.get("KINU_BETA_URL") ?? "";
const KB_ANON = Deno.env.get("KINU_BETA_ANON_KEY") ?? "";

const LARGURAS = new Set([320, 640, 960, 1280]);
const ID_OK = /^[a-z0-9][a-z0-9-]{2,79}$/;

function resp(status: number, body: string, extra: Record<string, string> = {}): Response {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300", ...extra },
  });
}

Deno.serve(async (req) => {
  if (req.method !== "GET") return resp(405, "GET only");
  if (!GOOGLE_KEY || !KB_URL || !KB_ANON) return resp(503, "place-photo sem configuração");

  const url = new URL(req.url);
  const id = (url.searchParams.get("id") ?? "").trim().toLowerCase();
  const wRaw = Number(url.searchParams.get("w") ?? 640);
  const w = LARGURAS.has(wRaw) ? wRaw : 640;
  if (!ID_OK.test(id)) return resp(400, "id inválido");

  let ref: string | null = null, attribution: string | null = null;
  try {
    const r = await fetch(`${KB_URL}/rest/v1/rpc/photo_ref_of`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: KB_ANON, Authorization: `Bearer ${KB_ANON}` },
      body: JSON.stringify({ p_id: id }),
      signal: AbortSignal.timeout(4000),
    });
    if (r.ok) {
      const rows = await r.json();
      ref = rows?.[0]?.photo_ref ?? null;
      attribution = rows?.[0]?.photo_attribution ?? null;
    }
  } catch { /* cai no 404 */ }
  if (!ref) return resp(404, "sem foto para este id", { "Cache-Control": "public, max-age=3600" });

  try {
    const g = await fetch(
      `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=${w}&key=${GOOGLE_KEY}`,
      { redirect: "follow", signal: AbortSignal.timeout(8000) },
    );
    if (!g.ok) return resp(502, `google ${g.status}`, { "Cache-Control": "public, max-age=600" });

    const headers = new Headers();
    headers.set("Content-Type", g.headers.get("Content-Type") ?? "image/jpeg");
    headers.set("Cache-Control", "public, max-age=604800, s-maxage=604800, immutable");
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Expose-Headers", "x-kinu-attribution");
    if (attribution) headers.set("x-kinu-attribution", encodeURIComponent(attribution));
    return new Response(g.body, { status: 200, headers });
  } catch {
    return resp(504, "google indisponível", { "Cache-Control": "public, max-age=120" });
  }
});
