import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsGate } from "../_shared/http.ts";

serve(async (req) => {
  // Arco 5.c: envelope CORS (allowlist ALLOWED_ORIGINS) + burst guard em memória.
  // limit 90/10s, alto de propósito: kinu-ai:250 chama esta função servidor→servidor,
  // sem Origin e com o IP da infraestrutura da edge — todos os usuários do agente
  // dividem um balde só (recon §6.3 item 9). Apertar aqui mataria o consultar_lugares.
  // Ver RELATORIO-F3-ARCO5C.md. Nada abaixo mudou.
  const gate = corsGate(req, { fn: "google-places", limit: 90, windowMs: 10_000 });
  if (gate.response) return gate.response;
  const corsHeaders = gate.headers;

  const API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!API_KEY) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { action, query, placeId, destination } = body;

    if (action === "search") {
      const url = `https://places.googleapis.com/v1/places:searchText`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": API_KEY,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.currentOpeningHours,places.photos,places.googleMapsUri,places.primaryType,places.editorialSummary",
        },
        body: JSON.stringify({
          textQuery: `${query}, ${destination}`,
          languageCode: "pt-BR",
          maxResultCount: 1,
        }),
      });
      const data = await response.json();
      const place = data.places?.[0];
      if (!place) {
        return new Response(JSON.stringify({ found: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let photoUrl = null;
      if (place.photos && place.photos.length > 0) {
        const photoName = place.photos[0].name;
        photoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=300&maxWidthPx=400&key=${API_KEY}`;
      }

      return new Response(JSON.stringify({
        found: true,
        id: place.id,
        name: place.displayName?.text,
        address: place.formattedAddress,
        rating: place.rating,
        totalRatings: place.userRatingCount,
        priceLevel: place.priceLevel,
        openNow: place.currentOpeningHours?.openNow,
        hours: place.currentOpeningHours?.weekdayDescriptions,
        photoUrl,
        mapsUrl: place.googleMapsUri,
        type: place.primaryType,
        summary: place.editorialSummary?.text,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "search_many") {
      const limit = Math.min(Math.max(Number(body.limit) || 8, 1), 10);
      const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": API_KEY,
          "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.currentOpeningHours.openNow,places.googleMapsUri,places.primaryType",
        },
        body: JSON.stringify({
          textQuery: `${query}, ${destination}`,
          languageCode: "pt-BR",
          maxResultCount: limit,
        }),
      });
      const data = await response.json();
      const results = (data.places || []).slice(0, limit).map((p: any) => ({
        name: p.displayName?.text,
        address: p.formattedAddress,
        rating: p.rating,
        totalRatings: p.userRatingCount,
        priceLevel: p.priceLevel,
        openNow: p.currentOpeningHours?.openNow,
        mapsUrl: p.googleMapsUri,
        type: p.primaryType,
      }));
      return new Response(JSON.stringify({ found: results.length > 0, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "details") {
      const url = `https://places.googleapis.com/v1/places/${placeId}`;
      const response = await fetch(url, {
        headers: {
          "X-Goog-Api-Key": API_KEY,
          "X-Goog-FieldMask": "id,displayName,formattedAddress,rating,userRatingCount,priceLevel,currentOpeningHours,photos,googleMapsUri,editorialSummary,reviews",
          "X-Goog-Language": "pt-BR",
        },
      });
      const place = await response.json();

      let photoUrl = null;
      if (place.photos && place.photos.length > 0) {
        photoUrl = `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxHeightPx=400&maxWidthPx=600&key=${API_KEY}`;
      }

      const topReviews = (place.reviews || []).slice(0, 3).map((r: any) => ({
        author: r.authorAttribution?.displayName,
        rating: r.rating,
        text: r.text?.text?.substring(0, 200),
        time: r.relativePublishTimeDescription,
      }));

      return new Response(JSON.stringify({
        found: true,
        id: place.id,
        name: place.displayName?.text,
        address: place.formattedAddress,
        rating: place.rating,
        totalRatings: place.userRatingCount,
        priceLevel: place.priceLevel,
        openNow: place.currentOpeningHours?.openNow,
        hours: place.currentOpeningHours?.weekdayDescriptions,
        photoUrl,
        mapsUrl: place.googleMapsUri,
        summary: place.editorialSummary?.text,
        reviews: topReviews,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
