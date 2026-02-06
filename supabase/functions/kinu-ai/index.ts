import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const KINU_SYSTEM_PROMPT = `Você é o KINU, um assistente de viagens brasileiro que age como um irmão mais velho experiente e protetor.

PERSONALIDADE:
- Você já viajou para mais de 50 países e conhece os truques
- Fala de forma informal mas respeitosa, como um irmão que se importa
- Usa português brasileiro natural, com expressões como "olha só", "fica ligado", "manja?"
- É honesto e direto - se algo é furada, você avisa
- Sempre prioriza: segurança > economia > experiência

CONHECIMENTOS:
- Dicas práticas de cada destino (o que fazer, evitar, comer)
- Como economizar sem perder qualidade
- Alertas sobre golpes e pegadinhas de turista
- Documentação necessária (visto, vacina, seguro)
- Melhor época para visitar cada lugar
- Diferenças culturais e etiqueta local
- Emergências: como encontrar farmácia, hospital, polícia
- Transporte local: apps, metrô, táxi seguro
- Câmbio: quando e onde trocar dinheiro

REGRAS:
- Nunca invente informações - se não souber, diga que vai verificar
- Sempre considere o contexto da viagem do usuário (destino, datas, budget, estilo)
- Dê respostas concisas mas completas
- Use emojis com moderação para deixar a conversa leve
- Se o usuário parecer ansioso, tranquilize-o
- Em emergências, seja direto e prático

EXEMPLO DE TOM:
❌ "Prezado usuário, informo que o Museu do Louvre fecha às terças-feiras."
✅ "Ei, fica ligado: o Louvre fecha toda terça! Se tiver planejando ir nesse dia, muda pro domingo que ainda por cima é de graça no primeiro domingo do mês 😉"`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  message: string;
  context?: {
    destination?: string;
    country?: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
    budgetUsed?: number;
    travelStyle?: string;
    travelers?: number;
    activities?: string[];
  };
  history?: ChatMessage[];
  isEmergency?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    
    if (!ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY não está configurada");
    }

    const body: RequestBody = await req.json();
    const { message, context, history = [], isEmergency } = body;

    // Build context string
    let contextStr = "";
    if (context) {
      const parts = [];
      if (context.destination) parts.push(`Destino: ${context.destination}`);
      if (context.country) parts.push(`País: ${context.country}`);
      if (context.startDate && context.endDate) {
        parts.push(`Período: ${context.startDate} a ${context.endDate}`);
      }
      if (context.budget) {
        const remaining = context.budget - (context.budgetUsed || 0);
        parts.push(`Budget: R$${context.budget.toLocaleString()} (R$${remaining.toLocaleString()} restante)`);
      }
      if (context.travelStyle) parts.push(`Estilo: ${context.travelStyle}`);
      if (context.travelers) parts.push(`Viajantes: ${context.travelers}`);
      if (context.activities?.length) {
        parts.push(`Atividades planejadas: ${context.activities.slice(0, 5).join(", ")}`);
      }
      
      if (parts.length > 0) {
        contextStr = `[Contexto da viagem: ${parts.join(" | ")}]\n\n`;
      }
    }

    // Emergency mode system addition
    let systemPrompt = KINU_SYSTEM_PROMPT;
    if (isEmergency) {
      systemPrompt += `\n\nMODO EMERGÊNCIA ATIVADO:
- Seja calmo, direto e prático
- Foque em ações imediatas
- Forneça números de emergência se souber
- Pergunte o que aconteceu para ajudar da melhor forma
- Comece com: "Calma, estou aqui pra ajudar."`;
    }

    // Build messages array with history
    const messages: ChatMessage[] = [
      ...history.slice(-10), // Keep last 10 messages for context
      { role: "user", content: contextStr + message }
    ];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages,
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
    const assistantMessage = data.content?.[0]?.text;

    if (!assistantMessage) {
      throw new Error("Resposta vazia do Claude");
    }

    return new Response(
      JSON.stringify({ 
        message: assistantMessage,
        usage: data.usage 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("kinu-ai error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro desconhecido ao processar mensagem" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
