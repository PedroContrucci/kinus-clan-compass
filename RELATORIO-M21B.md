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

## Adendo — execução (12/11/2026)

**Aplicado:** D1 (modo pela distância), D2 (total único), D3 (texto do botão). D4 fora de escopo. Commit de código `3a7281b`.
- `roteiroBlocks.ts`: `legBetween` live → km ≤ 1,2 = "~N min a pé" com N = `round(travelMinutes(km))`; km > 1,2 = "~N min de táxi" com os minutos do OSRM. `legBetween` ganhou 5º arg opcional (hotel); novo `hotelLegsMinutes`.
- `RoteiroDia.tsx`: prop `stayCoord`; faixa = trechos entre itens + hotel→1º + último→hotel. Item "no hotel" É o hotel (o trecho dele ao vizinho entra pelo `legBetween`; o `hotelLegsMinutes` conta 0 nele — sem dupla contagem). Sem hotel: soma só os trechos, como antes. Callers: `Viagens.tsx` e `RoteiroRascunho.tsx` passam `stayHotelCoord(days, destino)`.
- `DailyRouteMap.tsx`: removido "Tempo total de deslocamento". Botão: "Marcar como reservado".
- Trecho hotel→1º/último→hotel usa só cálculo por coordenada (o nome do ponto live do hotel não casa com nenhum item).

**Cena Jerónimos → Ponto Final → Santa Justa → Ramiro (print: 18, 17, 5 min)**
- Antes: "~18 min a pé", "~17 min a pé", "~5 min a pé" (todos ≤45 min ⇒ "a pé"); faixa ~40 min; mapa ~49 min (dois totais).
- Depois: modo pela distância. Os km do print não foram medidos (sem rede); por regra, os trechos de 18 e 17 min (ponte, carro) têm km > 1,2 ⇒ "~18 min de táxi" e "~17 min de táxi". O de 5 min fica "de táxi" (~5 min) se > 1,2 km, ou "a pé" com `travelMinutes` se ≤ 1,2 km. Total único = faixa (agora com hotel→1º e último→hotel); o do mapa não existe mais.
- Cobertura por teste (cena à mão): live 8 km/18 min → "~18 min de táxi"; live 0,9 km → "~11 min a pé".

**Assert alterado (autorizado, D1)** `roteiroDia.test.tsx` (deslocamento)
- Antigo: live 0,9 km/12 min → "~12 min a pé". Novo: "~11 min a pé" (= round(travelMinutes(0,9))). Motivo: minutos do OSRM são de carro.

**Asserts tocados por D3 (consequência do texto; só a string)**: `'Marcar como fechado'` → `'Marcar como reservado'` em `roteiroDia.test.tsx` (4 linhas), `closeLinks.test.tsx` (1), `roteiroRascunho.test.tsx` (regex). Fora D1/D3 nenhum assert mudou.

**Testes novos (4)**: táxi 8 km/18 min · a pé 0,9 km · faixa soma hotel→1º e último→hotel (e 0 sem hotel) · mapa sem "Tempo total".

**Gates:** tsc limpo · vitest 85 arquivos, 903 passed, 0 failed · `npm run build` ok · eslint: 32 problemas antes e depois (nenhum novo).
**Não tocados:** `src/data/*`, `hotelZones.ts`, `michelinData.ts`, `types/trip.ts`, motor, validador, PDF.

**Push (código):**
```
To https://github.com/PedroContrucci/kinus-clan-compass
   c6aa957..3a7281b  main -> main
```
