# RELATÓRIO C.5a — UI em blocos: Financeiro, Preparação e Painel

Commit `b08ad86` (feat). Motor intocado; `src/data/*`, `hotelZones`, `michelinData`, `types/trip.ts` intocados. Nenhuma function tocada → sem redeploy.

## O que mudou
- **Regra única** `isDomesticTrip` (`src/lib/tripScope.ts`): `international` do voo → catálogo (região Brasil) → país. Derivado na renderização.
- **Financeiro:** doméstica sem câmbio nenhum (cotação, histórico, calculadora, alertas, insight, "budget ≈"). Internacional: bloco único fechado "💱 Câmbio · 1 USD = R$ 5,09 · ver ▸"; sem cotação real a linha diz "cotação indisponível" (o fallback 5,88 nunca aparece fechado). Tiles via `formatTileBRL` (R$ 0 · R$ 9.016 · R$ 12,3k). Gráfico → "📈 Gastos por dia · concentra no Dia N ▸".
- **Predição KINU (3 meses, "70% de confiança") removida para todo destino** — era projeção local com confiança fixa. Volta só com fonte declarada.
- **Preparação:** checklist recortado por id na renderização (doméstica esconde `doc-1, pre-2, pre-3, pre-4`; `pack-3` → "Carregadores"), escondidos fora da Prontidão; cada categoria colapsável com "2/4", aberto só o primeiro incompleto. Guia do Destino devolve `null` vazio/carregando. "Sua mala está vazia" → linha "🧳 Bagagem · nenhuma ainda · adicionar ▸" (mesmo `AddLuggageModal`).
- **Painel:** "Exportar Roteiro (debug)" só em `import.meta.env.DEV`. Ordem e padrões das seções já eram os pedidos; persistência em localStorage mantida (decisão a).

## Achado 3 — clima sem fonte
"KINU diz: Fortaleza 15–25 °C · jaqueta leve · camadas · guarda-chuva" vinha de `getWeatherTips()` **hardcoded** (3 faixas: "é Europa?" + mês; resto no default 15–25 °C). Não vinha da function `weather`. Função removida inteira; o bloco sumiu. Fica só o alerta do `useWeather` (function `weather` → OpenWeatherMap), com a origem "previsão · OpenWeather"; sem previsão, sem bloco.

## Achado 4 — "Seu voo caiu R$ 9.016"
`lastPriceCheck` = menor tarifa **só ida** da `amadeus-flights` (Travelpayouts) **× 2 × viajantes**, contra `getFlightPlannedTotal` (voo escolhido, quase sempre estimativa route/tier). Fontes e formatos diferentes → número sem origem. `isPriceCheckComparable` exige `source` igual à `priceSource` do voo planejado, voo não-estimativa e `roundTrip: true`; hoje ninguém grava isso → alerta (caiu e subiu) não renderiza. **Decisão b aplicada:** `verificar_ofertas` passa pela mesma função via `buildOfferCheckReply` e responde "Ainda não tenho preço real comparável para esta rota." + link, nunca um número. A gravação de `lastPriceCheck` segue igual.

## Verificação
- Testes novos (`src/test/tripScopeBlocks.test.tsx`, 6): doméstica sem câmbio/passaporte; voo decide antes do catálogo; internacional com câmbio fechado e sem Predição; clima sem fonte → sem bloco; formato dos tiles; agente sem fonte comparável → sem número.
- `npx vitest run` (2×): 54 arquivos, 640 ok · 3 skipped · 1 todo. `tsc -p tsconfig.app.json` 0. `npm run build` ok. ESLint: arquivos novos limpos; tocados 89 antes/89 depois (todos preexistentes).

## Pendências (não feitas)
- "trocar" do orçamento no card do rascunho navega para Planejar em vez de abrir o painel.
- Selo "↓ R$ X desde dd/MM" + "Héstia: preço caiu" no card de voo (`getPriceChangeInfo`, histórico local) não foi auditado nesta missão — conferir a fonte no próximo arco.

## Push
```
To https://github.com/PedroContrucci/kinus-clan-compass
   7c54e88..b08ad86  main -> main
```
