import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const TripRequestSchema = z.object({
  destination: z.string()
    .min(2, "Destination must be at least 2 characters")
    .max(100, "Destination must be at most 100 characters")
    .regex(/^[a-zA-Z0-9À-ÿ\s,.\-']+$/, "Destination contains invalid characters"),
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),
  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format"),
  travelers: z.number()
    .int("Travelers must be a whole number")
    .min(1, "At least 1 traveler required")
    .max(50, "Maximum 50 travelers allowed"),
  travelType: z.string()
    .min(1, "Travel type is required")
    .max(50, "Travel type too long"),
  budget: z.string()
    .min(1, "Budget is required")
    .max(50, "Budget value too long"),
  priorities: z.array(
    z.string().min(1).max(100)
  ).min(1, "At least one priority required").max(10, "Maximum 10 priorities allowed"),
});

// Sanitize input for AI prompt to prevent prompt injection
function sanitizePromptInput(input: string): string {
  return input
    .replace(/[<>{}[\]]/g, '') // Remove potentially dangerous characters
    .replace(/ignore.*instructions/gi, '') // Remove common injection patterns
    .replace(/system.*prompt/gi, '')
    .replace(/\\/g, '') // Remove escape characters
    .trim()
    .substring(0, 200); // Limit length
}

// Validate date range
function validateDateRange(startDate: string, endDate: string): { valid: boolean; days: number; error?: string } {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    return { valid: false, days: 0, error: "Invalid start date" };
  }

  if (isNaN(end.getTime())) {
    return { valid: false, days: 0, error: "Invalid end date" };
  }

  if (end < start) {
    return { valid: false, days: 0, error: "End date must be after start date" };
  }

  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  if (days < 1) {
    return { valid: false, days: 0, error: "Trip must be at least 1 day" };
  }

  if (days > 365) {
    return { valid: false, days: 0, error: "Trip cannot exceed 365 days" };
  }

  return { valid: true, days };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ===== AUTHENTICATION CHECK =====
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No valid authorization header' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with the user's token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify the user's JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No user ID in token' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // ===== END AUTHENTICATION CHECK =====

    // ===== INPUT VALIDATION =====
    // Check request body size first
    const body = await req.text();
    if (body.length > 10000) {
      return new Response(
        JSON.stringify({ error: 'Request too large' }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate with Zod
    let tripData;
    try {
      const rawData = JSON.parse(body);
      tripData = TripRequestSchema.parse(rawData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid input', 
            details: error.errors.map(e => e.message)
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (error instanceof SyntaxError) {
        return new Response(
          JSON.stringify({ error: 'Invalid JSON in request body' }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw error;
    }

    // Validate date range
    const dateValidation = validateDateRange(tripData.startDate, tripData.endDate);
    if (!dateValidation.valid) {
      return new Response(
        JSON.stringify({ error: dateValidation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const days = dateValidation.days;
    // ===== END INPUT VALIDATION =====

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Sanitize all user inputs before using in prompt
    const sanitizedDestination = sanitizePromptInput(tripData.destination);
    const sanitizedTravelType = sanitizePromptInput(tripData.travelType);
    const sanitizedBudget = sanitizePromptInput(tripData.budget);
    const sanitizedPriorities = tripData.priorities.map(p => sanitizePromptInput(p));

    const systemPrompt = `Você é um especialista em viagens do KINU - The Travel OS. Gera roteiros de viagem detalhados e personalizados baseados nas preferências do viajante.

IMPORTANTE: Responde APENAS com um JSON válido, sem texto adicional. O JSON deve seguir exatamente esta estrutura:
{
  "destination": "nome do destino",
  "country": "país",
  "days": número de dias,
  "estimatedBudget": valor em reais (número),
  "focusAreas": ["área1", "área2"],
  "itinerary": [
    {
      "day": 1,
      "title": "título do dia",
      "icon": "emoji representativo",
      "activities": [
        {
          "time": "HH:MM",
          "name": "nome da atividade",
          "description": "descrição curta",
          "duration": "duração",
          "cost": custo em reais (número),
          "type": "food|culture|transport|photo|relax"
        }
      ]
    }
  ],
  "clanTips": [
    {
      "tip": "dica útil",
      "icon": "emoji"
    }
  ],
  "similarTrips": [
    {
      "destination": "destino similar",
      "days": número,
      "budget": valor,
      "match": "porcentagem de match"
    }
  ]
}

Gera 4-6 atividades por dia, distribuídas ao longo do dia (manhã, tarde, noite).
Inclui 3 dicas de ouro relevantes para as prioridades escolhidas.
Inclui 2-3 viagens similares da comunidade.`;

    const userPrompt = `Cria um roteiro de viagem para:
- Destino: ${sanitizedDestination}
- Período: ${days} dias (${tripData.startDate} a ${tripData.endDate})
- Viajantes: ${tripData.travelers} pessoa(s) - ${sanitizedTravelType}
- Orçamento: ${sanitizedBudget}
- Prioridades: ${sanitizedPriorities.join(", ")}

Gera um roteiro completo e detalhado seguindo a estrutura JSON especificada.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao seu workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar roteiro. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response - handle markdown code blocks
    let itinerary;
    try {
      // Remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      itinerary = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Invalid JSON response from AI");
    }

    return new Response(JSON.stringify(itinerary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-itinerary error:", error);
    return new Response(
      JSON.stringify({ error: "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
