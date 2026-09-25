# STEP1 — Clã v3 (chips = prioridades, Gastronomia+Michelin, Dicas do clã)

## Achados que mudam o plano
1. **Fonte das prioridades:** `TRAVEL_INTERESTS` em `src/components/wizard/types.ts` (12 itens). Contagem real de `styleTags` no catálogo:
   gastronomy 462 · culture 402 · family 271 · history 124 · nature 88 · nightlife 70 · art 67 · relaxation 65 · shopping 50 · beach 39 · adventure 6 · **winter 0**.
   `romantic` (168) existe no catálogo mas NÃO é prioridade do wizard → não vira chip.
2. **kinu-beta é projeto externo:** não tenho ferramenta de migration nele. Entrego o SQL em `supabase-beta/migrations/004_cla_tips.sql` (tabelas, RLS, grants, 2 RPCs); o fundador aplica. Até lá o chip mostra "dicas do clã ainda não disponíveis" (nada lança).
3. **Deploy x CLAUDE.md:** a missão pede "Deploy kinu-ai", mas a regra 8 diz que functions sobem por prompt do fundador. Proposta: NÃO deployo; o relatório entrega o prompt de redeploy (`kinu-ai/index.ts`, `kinu-ai/catalog.ts`, `_shared/*`). Se quiser que eu suba direto, diga "APLICAR + DEPLOY".

## Mapeamento prioridade → chip (ordem do wizard; chip oculto quando a cidade tem 0)
| Chip | Regra |
|---|---|
| 🍜 Gastronomia | category breakfast/lunch/dinner OU tag gastronomy · toggle "Só Michelin" |
| 🏖️ Praia | tag beach |
| 🌙 Vida Noturna | category night OU tag nightlife |
| 👨‍👩‍👧 Família | tag family |
| 🏛️ História | tag history |
| 🎨 Arte | tag art |
| 🎭 Cultura | tag culture |
| 🏔️ Aventura | tag adventure |
| 💆 Relaxamento | tag relaxation |
| 🛍️ Compras | tag shopping |
| 🌿 Natureza | tag nature |
| ❄️ Inverno/Neve | tag winter (hoje 0 em todas → oculto) |
Um item pode aparecer em vários chips. Todos = união; Roteiros e Hotéis inalterados; Dicas do clã no fim. Pergunta: prefere mostrar chips com 0 (desabilitados) em vez de ocultar?

## Diff proposto
- `src/lib/claChips.ts` (novo, puro + teste): `PRIORITY_CHIPS` derivado de `TRAVEL_INTERESTS` + `matchesPriority(item, id)`.
- `src/pages/Cla.tsx`: novo set de chips, toggle "Só Michelin" dentro de Gastronomia, card com descrição (tips[0]), 📍 → link Google Maps com coord de `src/data/generated/coords.ts` (fallback nome+cidade), foto sempre (placeholder gradiente).
- `src/lib/claTips.ts` (novo): `tipsPublic`, `leaveTip`, `voteTip`, `supersedeTip`, `tipsForAgent` (cache sessão, máx 40). Nunca lança. Eventos `cla.tip`, `cla.tip_vote`.
- `src/components/cla/ClaTipSheet.tsx` + `ClaTipCard.tsx` (novos): escopo/lugar/tipo/texto 10–280; "👍 Ainda vale" (toggle), "👎 Mudou" (sheet preenchida → insert com supersedes_id + voto outdated); pill "pode ter mudado" quando disputes > confirmations; frescor "confirmada há N dias por M pessoas".
- `ActivityDetailDrawer.tsx`: seção "Dicas do clã" (scope place) abaixo das tips do catálogo.
- `KinuAIContext.tsx`: `claTips` no body quando há cidade (viagem ativa ou detectada).
- `kinu-ai/index.ts`: bloco **"🤝 DICAS VIVAS DO CLÃ (confirmadas pela comunidade — cite a data quando falar de preço/horário)"** dentro do bloco do catálogo + 1 regra no system prompt; validação/sanitização de `claTips` no corpo (máx 40, texto ≤280, sem nomes).
- `supabase-beta/migrations/004_cla_tips.sql`: cla_tips / cla_tip_votes (unique tip_id+user_id), RLS por auth.uid(), insert com `lived` recalculado no servidor, RPCs security definer sem expor user_id.

## Intocáveis respeitados
src/data/*, hotelZones, michelinData, types/trip.ts, achievements, tripEvents, gerador, corsGate/shadowIdentify/checkRate.

## Decisões abertas
1. Deploy: eu ou prompt ao fundador? (padrão: prompt)
2. Chips com 0: ocultar (padrão) ou desabilitar?
