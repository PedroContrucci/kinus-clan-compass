# RELATORIO-M19B — motor respeita especificidade do dia da semana

Commits: `03c7a57` data(catalog) (só `daysOfWeek.ts`; `kinu-ai/catalog.ts` não mudou) · `7f503a1` feat(engine).
Verificação: `vitest` 785 verdes (3 skipped, 1 todo) · `tsc` limpo · `build` ok · eslint: 2 `no-explicit-any`
em `itineraryEngine.ts:698`, pré-existentes (não tocados).

## Motor
- Ordem do sort: `[michelinOverCap, hopKey, interestKey, weekdayKey, themeKey, dualKey, priceKey]`.
  Tier NÃO é chave: é filtro (byTier) depois do sort.
- `weekdayKey`: `n && n <= 3 ? n : 7`. Só item raro (≤ 3 dias/semana) ganha prioridade;
  "fecha um dia" (4–6) vale igual a sem restrição. Fortaleza: "só quinta" vence na quinta (c43 verde).
- Por que não especificidade pura: Parque Ueno (6 dias) passava na frente dos teamLab (sem restrição, =7)
  e o T3 perdia orçamento (1758→1608).

## T3 (flightLegSwap, Tóquio)
`toursPlanned` 1878 → 2048. Assert original `>` intacto; teamLab voltaram.

## generatorNoRepeat — única mudança de teste fora da fixture
- Antigo: pool esperado de almoço = todos os nomes da categoria (Tóquio: 10).
- Novo: para Tóquio/almoço, o pool desconta ids com fechamento em CURATED_DAYS_OF_WEEK
  (Yadoroku, Sushi Dai, Kondo → pool 7). Aplicado nos 2 casos ("só repete após esgotar" e "teto ceil").
- Motivo: sem prioridade para "fecha um dia", sobram só casas fechadas nos últimos dias e o motor repete
  (14 dias: 8 distintos em 9 slots, "sushi em pé" ×2). O pool real por dia é menor que o bruto.
  Outras cidades/slots e demais asserts intactos.
- **Observação: Tóquio tem 10 almoços no catálogo para 14 dias — LOTE.**

## Fixture `itineraryEngine.before.json` (zz-regen apagado)
Cartagena e Tóquio sem diferença.
- Lisboa saiu: d5 Sintra; d6 Jardim Botânico Tropical, Jardim da Estrela, Ponto Final; d7 Santa Justa,
  Jerónimos, Velho Eurico; d8 Copenhagen Coffee Lab, MAAT.
- Lisboa entrou: d5 Copenhagen, Santa Justa, Feira da Ladra, Velho Eurico; d6 Sintra;
  d7 MAAT, Gulbenkian, Zé da Mouraria; d8 Dear Breakfast, Jardim da Estrela.
- Fortaleza: d7 saiu Museu da Fotografia; entrou Praia de Iracema e Ponte dos Ingleses.

## Edge functions
`supabase/functions/kinu-ai/catalog.ts` inalterado: sem redeploy.

## Push
(ver abaixo)
