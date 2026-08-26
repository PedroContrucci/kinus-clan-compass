import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsGate } from "../_shared/http.ts";

function sanitizeUrl(url: string): string {
  return url
    .replace(/token=[^&]+/gi, 'token=***')
    .replace(/apikey=[^&]+/gi, 'apikey=***')
    .replace(/access_key=[^&]+/gi, 'access_key=***')
    .replace(/appid=[^&]+/gi, 'appid=***')
    .replace(/key=[^&]+/gi, 'key=***')
    .replace(/x-api-key=[^&]+/gi, 'x-api-key=***');
}

Deno.serve(async (req) => {
  // Arco 5.c: envelope CORS (allowlist ALLOWED_ORIGINS). burst: false — o 403 logo
  // abaixo não custa cota nem fatura, então contar seria cerimônia. O Allow-Methods
  // que esta função declarava sozinha agora sai para as 10.
  // Ver RELATORIO-F3-ARCO5C.md. O 403 do R-04 continua exatamente onde estava.
  const gate = corsGate(req, { fn: 'feedback-digest', limit: 0, burst: false });
  if (gate.response) return gate.response;
  const corsHeaders = gate.headers;

  // R-04: função desativada. Expunha beta_feedback (service_role) a qualquer chamador
  // anônimo, contornando a RLS. Sem uso legítimo restante — o dono recebe feedback via
  // feedback-notify (WhatsApp). Código abaixo mantido inerte para reversão.
  return new Response(
    JSON.stringify({ error: 'Esta função foi desativada.' }),
    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!anthropicKey) {
      console.error('[feedback-digest] ANTHROPIC_API_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY não configurada' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: feedbacks, error } = await supabase
      .from('beta_feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[feedback-digest] supabase select error', error instanceof Error ? sanitizeUrl(error.message) : 'Unknown error');
      return new Response(
        JSON.stringify({ error: error.message || 'Erro ao buscar feedbacks' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!feedbacks || feedbacks.length === 0) {
      return new Response(
        JSON.stringify({ digest: null, message: 'Sem feedbacks ainda' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `Você é o analista de QA do app de viagens KINU. Analise os feedbacks de testadores beta e responda APENAS com JSON válido, sem markdown, no formato: { resumo: string (2 frases), criticos: [{quem, problema, onde}], padroes: [{padrao, quantas_pessoas, sugestao_de_correcao}], sugestoes_dos_usuarios: [string], destaques_positivos: [string], prioridade_1: string (a única coisa a corrigir primeiro e por quê) }. Agrupe feedbacks parecidos como padrão. Mensagens iniciadas com 🔴 são críticas, 🟡 confusão, 🟢 sugestão/elogio. Todos os campos de lista (criticos, padroes, sugestoes_dos_usuarios, destaques_positivos) devem SEMPRE ser arrays JSON, mesmo vazios []. Nunca use texto no lugar de um array.

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
      console.error('[feedback-digest] Anthropic API error', anthropicRes.status, errText);
      return new Response(
        JSON.stringify({ error: 'Anthropic API error', details: errText }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const anthropicData = await anthropicRes.json();
    let rawText = anthropicData.content?.[0]?.text ?? '';

    rawText = rawText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    let digest;
    try {
      digest = JSON.parse(rawText);
    } catch (_e) {
      const first = rawText.indexOf('{');
      const last = rawText.lastIndexOf('}');
      if (first !== -1 && last !== -1 && last > first) {
        const candidate = rawText.slice(first, last + 1);
        try {
          digest = JSON.parse(candidate);
        } catch (_e2) {
          console.error('[feedback-digest] JSON parse fallback failed', candidate.slice(0, 500));
          return new Response(
            JSON.stringify({ error: 'Resposta do modelo não é JSON válido', raw: rawText, count: feedbacks.length }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        console.error('[feedback-digest] no JSON braces found in model output', rawText.slice(0, 500));
        return new Response(
          JSON.stringify({ error: 'Resposta do modelo não é JSON válido', raw: rawText, count: feedbacks.length }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ digest, count: feedbacks.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('[feedback-digest] unhandled error', e instanceof Error ? sanitizeUrl(e.message) : 'Unknown error');
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
