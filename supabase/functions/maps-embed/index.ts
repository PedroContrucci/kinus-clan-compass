import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsGate } from "../_shared/http.ts";

serve(async (req) => {
  // Arco 5.c: envelope CORS (allowlist ALLOWED_ORIGINS) + burst guard em memória.
  // Ver RELATORIO-F3-ARCO5C.md. Nada abaixo desta linha mudou.
  const gate = corsGate(req, { fn: "maps-embed", limit: 30, windowMs: 10_000 });
  if (gate.response) return gate.response;
  const corsHeaders = gate.headers;

  const API_KEY = Deno.env.get("GOOGLE_MAPS_EMBED_KEY");
  if (!API_KEY) {
    return new Response(JSON.stringify({ error: "No key" }), {
      status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { query, zoom } = await req.json();
    const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=${encodeURIComponent(query)}&zoom=${zoom || 12}&language=pt-BR`;
    return new Response(JSON.stringify({ embedUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
