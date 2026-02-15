import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TripRequest {
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  travelType: string;
  budget: string;
  priorities: string[];
}

const SYSTEM_PROMPT = `Você é o motor de roteiros do KINU Travel OS. Gera roteiros de viagem em JSON.

REGRAS DE ESTRUTURA DO ROTEIRO:
- Dia 1 = EMBARQUE: apenas voo de ida + check-in aeroporto. Horário do voo no final do dia.
- Dia 2 = CHEGADA: transfer aeroporto → hotel, check-in, atividade leve (jet lag). Jantar no bairro do hotel.
- Dias 3 a N-1 = EXPLORAÇÃO: 4-6 atividades por dia (café, museu/atração, almoço, passeio/tour, jantar). Variar os bairros.
- Dia N = RETORNO: check-out, atividade leve pela manhã, voo de volta.

REGRAS DE PREÇOS:
- TODOS os custos DEVEM ser em BRL (Reais) e > 0 para atividades pagas.
- Custos INDIVIDUAIS (multiplicar por número de viajantes): voos, refeições, ingressos, tours.
- Custos COMPARTILHADOS (NÃO multiplicar): hotel por noite, transfer por veículo.
- Atividades gratuitas (passeio pelo bairro, praia, parque): cost = 0.
- Faixas de preço por nível (por pessoa, em BRL):
  - Budget: voo R$ 3.500-5.000, hotel R$ 400-800/noite, almoço R$ 80-150, jantar R$ 120-250, museu R$ 50-120
  - Midrange: voo R$ 5.000-8.000, hotel R$ 800-2.000/noite, almoço R$ 150-300, jantar R$ 250-500, museu R$ 100-200
  - Luxury: voo R$ 8.000-15.000, hotel R$ 2.000-5.000/noite, almoço R$ 300-600, jantar R$ 500-1.200, museu R$ 150-350

REGRAS DE RESPOSTA:
- Responda APENAS com JSON válido, sem texto adicional, sem markdown, sem backticks.
- Use nomes REAIS de restaurantes, museus, bairros e atrações do destino.
- Descrições curtas e práticas (1-2 frases).
- Tipos de atividade: "food", "culture", "transport", "photo", "relax", "shopping", "nightlife".
- Inclua 3-5 dicas do Clã KINU relevantes ao destino.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY não está configurada");
    }

    const tripData: TripRequest = await req.json();
    const { destination, startDate, endDate, travelers, travelType, budget, priorities } = tripData;

    // Calculate days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Determine price level from budget
    const budgetNum = parseInt(budget.replace(/\D/g, '')) || 50000;
    const budgetPerPersonPerDay = budgetNum / travelers / days;
    let priceLevel = 'midrange';
    if (budgetPerPersonPerDay < 600) priceLevel = 'budget';
    else if (budgetPerPersonPerDay > 1500) priceLevel = 'luxury';

    const userPrompt = `Gera um roteiro de viagem em JSON para:
- Destino: ${destination}
- Período: ${days} dias (${startDate} a ${endDate})
- Viajantes: ${travelers} pessoa(s) - ${travelType}
- Orçamento total: R$ ${budgetNum.toLocaleString('pt-BR')} (nível: ${priceLevel})
- Prioridades: ${priorities.join(", ")}

O JSON deve ter esta estrutura exata:
{
  "destination": "${destination}",
  "country": "país",
  "days": ${days},
  "travelers": ${travelers},
  "priceLevel": "${priceLevel}",
  "estimatedBudget": número total estimado em BRL,
  "focusAreas": ["área1", "área2"],
  "itinerary": [
    {
      "day": 1,
      "title": "Embarque",
      "icon": "✈️",
      "activities": [
        {
          "time": "HH:MM",
          "name": "nome da atividade",
          "description": "descrição curta e prática",
          "duration": "duração",
          "cost": custo TOTAL em BRL (já multiplicado por ${travelers} viajantes para itens individuais),
          "type": "food|culture|transport|photo|relax|shopping|nightlife",
          "category": "voo|hotel|restaurante|museu|tour|transfer|info"
        }
      ]
    }
  ],
  "clanTips": [
    {
      "tip": "dica útil e específica do destino",
      "icon": "emoji"
    }
  ]
}

IMPORTANTE: Todos os costs já devem estar multiplicados por ${travelers} viajantes para itens individuais (voos, refeições, ingressos). Hotel e transfer NÃO multiplicar.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Aguarde um momento e tente novamente." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`Erro na API do Claude: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      throw new Error("Resposta vazia do Claude");
    }

    // Parse JSON — handle possible markdown code blocks
    let itinerary;
    try {
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
      console.error("Failed to parse Claude response:", content.substring(0, 500));
      throw new Error("Resposta inválida do Claude — não é JSON");
    }

    return new Response(JSON.stringify(itinerary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("generate-itinerary error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Erro desconhecido ao gerar roteiro",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
