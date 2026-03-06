import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");
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
