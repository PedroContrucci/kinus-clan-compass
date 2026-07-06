// Feedback notify edge function - sends instant email with AI classification
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GRAVIDADE_EMOJI: Record<string, string> = {
  critico: '🔴',
  confusao: '🟡',
  sugestao: '💡',
  elogio: '💚',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const fb = await req.json();
    const { tester_name = 'Anônimo', rating = 0, category = '', message = '', page = '' } = fb || {};

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const FEEDBACK_EMAIL = Deno.env.get('FEEDBACK_EMAIL');
    const CALLMEBOT_PHONE = Deno.env.get('CALLMEBOT_PHONE');
    const CALLMEBOT_APIKEY = Deno.env.get('CALLMEBOT_APIKEY');

    let analise = 'Análise indisponível';
    let acao_sugerida = '—';
    let gravidade: string = category === 'bug' ? 'critico' : category === 'confusing' ? 'confusao' : category === 'love' ? 'elogio' : 'sugestao';

    if (ANTHROPIC_API_KEY) {
      try {
        const prompt = `Classifique este feedback de testador beta do app de viagens KINU. Responda APENAS JSON: { gravidade: 'critico'|'confusao'|'sugestao'|'elogio', analise: string (1 frase), acao_sugerida: string (1 frase) }\n\nFeedback:\n${JSON.stringify({ tester_name, rating, category, message, page })}`;

        const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 400,
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const raw = aiData?.content?.[0]?.text || '';
          let jsonStr = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
          const first = jsonStr.indexOf('{');
          const last = jsonStr.lastIndexOf('}');
          if (first !== -1 && last !== -1) jsonStr = jsonStr.slice(first, last + 1);
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.gravidade) gravidade = parsed.gravidade;
            if (parsed.analise) analise = parsed.analise;
            if (parsed.acao_sugerida) acao_sugerida = parsed.acao_sugerida;
          } catch (e) {
            console.error('feedback-notify: failed parsing AI JSON', e, raw);
          }
        } else {
          console.error('feedback-notify: Anthropic non-OK', aiRes.status, await aiRes.text());
        }
      } catch (e) {
        console.error('feedback-notify: Anthropic call failed', e);
      }
    }

    const emoji = GRAVIDADE_EMOJI[gravidade] || '💡';
    const stars = '★'.repeat(Math.max(0, Math.min(5, Number(rating) || 0))) + '☆'.repeat(5 - Math.max(0, Math.min(5, Number(rating) || 0)));
    const escapeHtml = (s: string) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

    const subject = `[KINU Beta] ${emoji} ${tester_name} em ${page || '?'}`;
    const html = `
      <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; color: #0f172a;">
        <h2 style="margin: 0 0 12px;">${emoji} Novo feedback de ${escapeHtml(tester_name)}</h2>
        <p style="color:#64748b; margin: 0 0 16px;">Categoria: <b>${escapeHtml(category)}</b> · Página: <b>${escapeHtml(page || '?')}</b></p>
        <p style="color:#f59e0b; font-size: 18px; margin: 0 0 16px;">${stars}</p>
        <blockquote style="border-left: 4px solid #10b981; padding: 8px 16px; margin: 0 0 20px; background:#f1f5f9; color:#0f172a; border-radius: 4px;">
          ${escapeHtml(message).replace(/\n/g, '<br>')}
        </blockquote>
        <p style="margin: 8px 0;"><b>Análise:</b> ${escapeHtml(analise)}</p>
        <p style="margin: 8px 0;"><b>Ação sugerida:</b> ${escapeHtml(acao_sugerida)}</p>
      </div>
    `;

    if (!RESEND_API_KEY || !FEEDBACK_EMAIL) {
      console.error('feedback-notify: missing RESEND_API_KEY or FEEDBACK_EMAIL');
      return new Response(JSON.stringify({ ok: false, error: 'missing-email-config' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'KINU Beta <onboarding@resend.dev>',
        to: FEEDBACK_EMAIL,
        subject,
        html,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error('feedback-notify: Resend failed', emailRes.status, errText);
      return new Response(JSON.stringify({ ok: false, error: 'resend-failed', detail: errText }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (CALLMEBOT_PHONE && CALLMEBOT_APIKEY) {
      try {
        const msgText = `${emoji} KINU Feedback — ${tester_name} (${rating}/5)\n\n📍 ${page}\n\n💬 "${message}"\n\n🤖 ${analise}\n\n▶️ ${acao_sugerida}`;
        await fetch(`https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(CALLMEBOT_PHONE)}&text=${encodeURIComponent(msgText)}&apikey=${CALLMEBOT_APIKEY}`);
      } catch (e) {
        console.error('feedback-notify: WhatsApp call failed', e);
      }
    }

    return new Response(JSON.stringify({ ok: true, gravidade }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('feedback-notify: unexpected error', e);
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'unexpected' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
