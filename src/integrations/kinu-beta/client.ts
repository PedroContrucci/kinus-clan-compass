// Cliente Supabase do kinu-beta — o projeto próprio do Kinu (região SP).
//
// REGRA DA CASA (dois bancos, duas pastas — supabase-beta/README.md):
//   supabase  = SERVIÇOS   -> src/integrations/supabase/client.ts (Lovable Cloud)
//               edge functions (kinu-ai, amadeus-flights, weather, unsplash,
//               exchange-rates, google-places, maps-embed, feedback-notify),
//               catálogo community_* e beta_feedback.
//   kinuBeta  = IDENTIDADE -> este arquivo (kinu-beta)
//               auth, profiles, trips, kinu_sessions.
// Nada de auth no primeiro; nada de edge function no segundo.
//
// SEM TIPAGEM GERADA — decisão consciente do Arco 3a. O `Database` de
// src/integrations/supabase/types.ts descreve o schema do LOVABLE: usá-lo aqui
// seria mentira tipada (nomes iguais, tabelas diferentes — `trips` do Lovable é
// colunar, a do kinu-beta é payload-cru). Enquanto os tipos do kinu-beta não
// forem gerados, as queries de profiles/trips/kinu_sessions vêm `any`.
//
// A anon key é PÚBLICA por design: quem protege as linhas é a RLS provada 11/11
// no Arco 2. A SERVICE KEY (.env.sync) NUNCA entra aqui — toda variável VITE_
// vai inteira para o bundle do browser.

import { createClient } from '@supabase/supabase-js';

const KINU_BETA_URL = import.meta.env.VITE_KINU_BETA_URL;
const KINU_BETA_ANON_KEY = import.meta.env.VITE_KINU_BETA_ANON_KEY;

if (!KINU_BETA_URL || !KINU_BETA_ANON_KEY) {
  // Barulho no console em vez de "Invalid API key" misterioso em cada login.
  console.error(
    '[kinu-beta] VITE_KINU_BETA_URL e/ou VITE_KINU_BETA_ANON_KEY ausentes. ' +
    'Preencha o .env com a anon key do painel do kinu-beta — sem elas, auth ' +
    'e dados do usuário não funcionam.'
  );
}

export const kinuBeta = createClient(KINU_BETA_URL, KINU_BETA_ANON_KEY, {
  auth: {
    storage: localStorage,
    // storageKey explícito: os refs dos dois projetos já são diferentes, então
    // a chave padrão (sb-<ref>-auth-token) não colidiria — mas nomear é o que
    // impede a colisão de virar acidente numa regeneração do cliente Lovable.
    storageKey: 'kinu-beta-auth',
    persistSession: true,
    autoRefreshToken: true,
    // Retorno do OAuth (Google) traz a sessão na URL; sem isto ela se perde.
    detectSessionInUrl: true,
  },
});
