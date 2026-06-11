import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: feedbacks, error } = await supabase
      .from('beta_feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    if (!feedbacks || feedbacks.length === 0) {
      return new Response(
        JSON.stringify({ digest: null, message: 'Sem feedbacks ainda' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `Você é o analista de QA do app de viagens KINU. Analise os feedbacks de testadores beta e responda APENAS com JSON válido, sem markdown, no formato: { resumo: string (2 frases), criticos: [{quem, problema, onde}], padroes: [{padrao, quantas_pessoas, sugestao_de_correcao}], sugestoes_dos_usuarios: [string], destaques_positivos: [string], prioridade_1: string (a única coisa a corrigir primeiro e por quê) }. Agrupe feedbacks parecidos como padrão. Mensagens iniciadas com 🔴 são críticas, 🟡 confusão, 🟢 sugestão/elogio.

Feedbacks:
${JSON.stringify(feedbacks, null, 2)}`;

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      return new Response(
        JSON.stringify({ error: 'Anthropic API error', details: errText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const anthropicData = await anthropicRes.json();
    let rawText = anthropicData.content?.[0]?.text ?? '';

    rawText = rawText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    let digest;
    try {
      digest = JSON.parse(rawText);
    } catch (_e) {
      return new Response(
        JSON.stringify({ error: 'Resposta do modelo não é JSON válido', raw: rawText, count: feedbacks.length }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ digest, count: feedbacks.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
