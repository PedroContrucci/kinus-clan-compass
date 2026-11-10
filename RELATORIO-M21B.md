# RELATORIO-M21B — rótulos e totais da rota do dia (DIAGNÓSTICO; nenhum código alterado)

## Status
Missão só de diagnóstico: `STEP1-M21B.md` na raiz (não commitado). Nenhum arquivo de código tocado. Aguarda decisões.

## Causas (arquivo:linha)
- **"18 min a pé" por ponte:** `roteiroBlocks.ts:123-128` decide o modo só pelo tempo (`durationMin <= 45` ⇒ "a pé"),
  nunca pela distância. O mapa pede `/route/v1/foot/` ao OSRM público (`DailyRouteMap.tsx:296`), que só tem perfil de
  carro — os minutos são de carro. 18 min de carro ≤ 45 ⇒ "a pé". (Confirmar com 1 `curl` antes de aplicar.)
- **Dois totais:** faixa "~40 min" = Σ trechos entre itens do roteiro (`RoteiroDia.tsx:300`, 18+17+5), sem hotel→1.
  "~49 min" = Σ OSRM do mapa (`DailyRouteMap.tsx:449-451`), com hotel→1 (+9). Nenhum inclui 4→hotel, embora a faixa mostre 🏨 final.
- **Pílulas no mapa:** `DailyRouteMap.tsx:421-430`, `durationMin` do OSRM (carro), sem modo.
- **Fonte serifada:** `font-['Outfit']` (`RoteiroDia.tsx:194, 323, 357`) gera `font-family: Outfit` sem fallback;
  `src/index.css:5` tem o `@import` das fontes depois de `@tailwind` (inválido). Por leitura não achei por que só esta
  tela difere — precisa medir no navegador.
- **"Marcar como fechado":** 1 ocorrência de UI (`RoteiroDia.tsx:232`) + 2 comentários (`:110`, `:139`).

## Correção proposta (não aplicada)
(a) modo pela distância em `roteiroBlocks.ts:123-128` (~4 linhas); (b) remover o total do mapa
(`DailyRouteMap.tsx:449-453`) e somar hotel→1 na faixa (`RoteiroDia.tsx:299`, ~3 linhas); fonte: mover `@import`
ao topo + fallback no Tailwind. Asserts: `roteiroDia.test.tsx:156` (0,9 km/12 min → "~12 min a pé") não muda se mantiver
minutos do OSRM; muda (12→10) se usar `travelMinutes`. +1 teste (8 km/18 min → "de táxi").

## Decisões pendentes (Pedro)
1. Walk com OSRM: manter minutos do OSRM e trocar só o modo (recomendado) × refazer por `travelMinutes(km)`.
2. Total único na faixa, com hotel→1 (recomendado); 4→hotel entra ou some o 🏨 final?
3. Fonte: medir no navegador antes e depois corrigir `@import` + fallback (recomendado).

## Observação
`RELATORIO-M21A.md` aparece modificado na árvore (voltou ao rascunho "PARADA"); o commit `c9a3e63` está correto.
Não toquei nele. Sugestão: `git checkout RELATORIO-M21A.md`.

## Push
