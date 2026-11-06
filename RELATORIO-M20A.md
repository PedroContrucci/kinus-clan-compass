# RELATORIO-M20A — adultos e crianças no motor e no PDF

## O que mudou
- `src/lib/pax.ts` (novo, sem imports): `paxOf(trip)` lê `adults/children/infants` da index signature do
  `StoredTrip`; sem os campos → adults = travelers, children = 0, infants = 0. `paxLabel` → "2 adultos + 2 crianças".
- `createTrip.ts`: grava `adults`, `children` (só crianças), `infants`, `childrenAges` (quando há idade);
  `travelers` inalterado (= adultos + crianças + bebês). `src/types/trip.ts` **não foi tocado**.
- Motor (`itineraryEngine.ts`), novo parâmetro `pax` (opcional; ausente = comportamento de antes):
  - EXP (ingresso) = estimatedCostBRL × adultos; label "(2 adultos + 2 crianças)" na location; com criança,
    dica "+ N crianças: ingresso infantil a confirmar" ao fim das tips. Bebê não conta e não gera dica.
    Refeições seguem × travelers; hotel inalterado; nenhum preço infantil inventado.
  - Com criança: Michelin só no almoço e ≤ 1 na viagem (injetado + catálogo). Luxo vai ao almoço 1×,
    com o preço da estrela (mesma tabela do jantar). Michelin do catálogo no jantar fica bloqueado.
  - Para todos: nunca 2 Michelin no mesmo dia (injetado ou do catálogo).
- `draftItinerary.ts` passa `paxOf(trip)` ao motor; `draftRoteiro.ts` ao trocar item.
- PDF: capa "2 adultos + 2 crianças" quando há crianças; item de ingresso ganha linha
  "2 adultos + 2 criancas - ingresso infantil a confirmar".

## Verificação
- vitest: 69 arquivos, 804 passam (793 + 11 novos em `src/test/m20.test.ts`), nenhum assert existente alterado.
- Fixture Paris 2 adultos: inalterada (teste compara dias com e sem pax sem criança/bebê → idênticos).
- tsc limpo; `npm run build` ok; eslint: 31 problemas antes e depois nos arquivos tocados (nenhum novo).
- 1 iteração vermelha no caminho: o jantar do catálogo descartado pela injeção do Michelin contava como
  Michelin do dia e quebrava `michelinTier.test.ts`; corrigido no motor (desfaz a contagem), teste intacto.

## Fora do escopo / dívidas
- `GeneratedItineraryStage.tsx` (cockpit legado) só recebe `travelers`: geração e troca de item ali
  seguem × travelers. Fluxo atual (`buildItineraryForTrip`) usa pax.
- O PDF só mostra o label em itens gerados com pax; roteiros antigos não mudam.
- Sem functions tocadas → nada de redeploy. Sem Publish.

## Push do commit feat (a6de76e)
```
To https://github.com/PedroContrucci/kinus-clan-compass
   9d88fb4..a6de76e  main -> main
```
