# RELATÓRIO C.2.1 — Voo: escolha persiste, janela filtra a sugestão, preço por pessoa/perna

Commit: `c31ba96` (feat). Sem edge function tocada → sem prompt de redeploy. Publish é do fundador.

## Achados
- **Item 1, causa real:** a busca automática não refazia nada; o `kinuFlightSearch` gravado já impedia.
  Tocar numa opção só mudava estado local; só o rodapé gravava. Fechar pela linha descartava a escolha.
- **Financeiro já estava certo:** `getSelectedFlightPlannedTotal` = (ida+volta)×travelers. O 1.528 era o
  **item do roteiro** (`itineraryEngine.ts`): cada perna levava metade de (ida+volta)×pax e "/pessoa" = (ida+volta)/2.
- `prices_for_dates` (amadeus-flights, só leitura) sem parâmetro de passageiros → `price` = 1 adulto, por trecho.
- Conta da missão: 636+897 = 1.533 × 2 = **3.066** (não 3.056). Teste fixa 3.066.

## O que mudou
1. **Persistência:** toque na opção → `writeFlightsThrough` na hora, `chosenBy:'user'` só na perna tocada.
   Fechar o painel (botão "Usar estes voos" ou linha) com `flightDirty` → `replanTrip` (preserveEdits) + toast.
   Auto-busca e "aplicar" pendente nunca trocam perna do usuário; `shouldAutoSearch` false se a volta é do usuário.
   "Voltar à sugestão do KINU" (topo do painel, só com perna do usuário) → `pickBest` da busca gravada ou
   estimativa, `chosenBy:'kinu'`. `key` do estágio embutido saiu; a seleção acompanha `current`.
2. **Janela:** `rankFlights` 'kinu' põe à frente só quem chega 06–22 e, em rota doméstica, no mesmo dia;
   faixa de preço medida dentro desse grupo. Nenhuma elegível → todas competem e o porquê termina em
   "nenhuma opção chega entre 06h e 22h". Lista mostra todas; excluídas com "fora da janela · chega 03:00 (+1)".
   `explainPick`: "direto · chega 21:05 · menor preço" (ou "menor preço entre os diretos"/"mais rápido");
   média só como ressalva quando |dif| > 5%.
3. **Linha única:** `flightChoiceLine` — "KINU escolheu: Azul · direto · chega 11:12 · R$ 636/pessoa · menor preço" /
   "Você escolheu: Gol · direto · chega 03:00 (+1) · R$ 631/pessoa". Card e chip usam a mesma; sem "· trocar".
4. **Preço:** comentário no `FlightOption.price` (por pessoa, por trecho). Lista com "/pessoa". Item do roteiro:
   ida = ida×pax, /pessoa = ida; volta idem. Tela: "R$ 1.272 · 2 pax (R$ 636/pessoa)". Total do roteiro igual.
5. **Estimativa:** com ofertas, sai da lista → linha "estimativa por rota|genérica: R$ X/pessoa · preços reais abaixo".
6. **Sheet:** `repositionInputs={false}`; valor e horários com `scrollIntoView({block:'center'})` no foco. Payload igual.

## Decisões (fundador)
- D1 sem cache em memória — `kinuFlightSearch` na viagem é a fonte. · D2 fechar com `flightDirty` replaneja (botão ou linha).
- D3 sem `pricePerPerson` — `option.price` é por pessoa, documentado no tipo. · D4 link no topo do painel aberto.
- D5 tocados fora da lista: `itineraryEngine.ts` (custo por perna + comentário do tipo; a var `flightPerPerson`
  ficou sem uso e saiu), `GeneratedItineraryStage.tsx` (texto do flight), `flightRanking.test.tsx` (l.103/138/158).
- Escopo: "· trocar" fora do texto da linha (puxado do C.2.2).

## Testes
- Novos: (1) cockpitCard — escolher Gol 03:00 → fecha pela linha → reabre: `chosenBy:'user'`, preço 631,
  "Selecionado", nenhum `useFlightSearch` habilitado; "Voltar à sugestão" → Azul/kinu. (2)(3)(4)(5) flightEngine —
  631@03:00(+1) × 676@21:05 → 676; só 03:00 → ela + ressalva; razão sem "média"; 3.066; ida 1.272/636, volta 1.794/897.
  (6) flightRanking — estimativa em linha, 5 cartões, 1º "R$ 6.000/pessoa".
- `SMOKE_FULL=1 npx vitest run` (1 rodada): **49 arquivos, 595 passed**, 1 skipped, 1 todo.
- Smoke = C.2: `R13 55/61 PASS · 6 WARN | R14 12/12 | R15 57/63 PASS · 6 WARN | R16 63/63 PASS`.
- `tsc -p tsconfig.app.json --noEmit` limpo · `npm run build` ok · eslint: contagem por regra/arquivo idêntica antes/depois.

## Push (feat)
```
To https://github.com/PedroContrucci/kinus-clan-compass
   b745a22..c31ba96  main -> main
```

/cost: o agente não roda comandos de barra — rodar `/cost` no chat para anotar.
