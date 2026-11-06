# RELATORIO-M20B — voo com adultos/crianças/bebês por idade

Commit: `601068d feat(flights): pax por idade na busca de voo; hero com estimativa por pagante e por pessoa, fonte e data (M20b)`

## Nota: a function amadeus-flights é Travelpayouts; Amadeus real = M10 degrau 0
O nome engana: o motor é Travelpayouts/Aviasales Data API v3 (preço de referência em cache, de 1 adulto, sem
pax). Por isso **não** há `priceIsTotal` nem `checkedBags` (não existem na fonte; badge de bagagem fora).
Amadeus real (Flight Offers Search, preço total e bagagem) fica para o M10 degrau 0.

## O que mudou
- `src/lib/pax.ts` · `airfarePaxOf(trip)`: idade ≥ 12 = adulto; 2–11 = criança; < 2 = bebê; criança sem
  idade = criança; lê `childrenAges` (index signature). `payers` = adultos + crianças.
- Function: aceita `adults` (padrão 1), `children`, `infants` (inteiros, teto 20) e **ecoa `pax`** em todas
  as respostas. Não repassa ao upstream (ele não aceita). Sem pax = comportamento de antes.
- Front manda pax: `useFlightSearch`/`useFlexibleFlightSearch`/manuais (param opcional `pax`),
  `DraftCockpit`, `FlightSelectionStage` (prop `pax`), `TripPanel` (flex) e `Viagens.tsx` (monitor de preço).
- Preço: `getSelectedFlightPlannedTotal` = (ida + volta, 1 adulto) × **pagantes**; bebê de colo fora.
  Monitor de preço usa pagantes também (compara com o mesmo total).
- Hero (`FlightPriceLines`, em `TripPanel`): nunca diz "total". "estimativa para {paxLabel} · preço de
  referência por adulto (Aviasales, {data}) × {n pagantes}" + "por pessoa ≈ R$ X" + "bebê de colo: tarifa à
  parte" quando infants > 0. Voo estimado: "estimativa do KINU por adulto"; confirmado: "confirmado para …".
- Comentário de `FlightOption.price` (`itineraryEngine.ts` L87, onde ele mora) agora diz Travelpayouts/Aviasales
  e "× pagantes".
- Testes novos: `src/test/airfarePax.test.tsx` (8 e 12 → adults 3, children 1; sem idade → criança; <2 →
  bebê; total × pagantes; render do hero). Nenhum assert existente alterado.

## Gates
vitest 73/73 arquivos (817 passam, 3 skipped, 1 todo) · tsc limpo · build ok · eslint sem problema novo
(4 `any` pré-existentes em `flightFinance.ts`, não tocados).

## Pendências / atenção
1. **Linhas de voo do roteiro** (`itineraryEngine.ts` 1195/1468, `× travelers`) ficaram intocadas por decisão
   (4). Sem bebê, pagantes = travelers e nada muda. Com bebê, a linha do roteiro inclui o bebê e o hero não:
   divergência a fechar numa missão própria.
2. Idade < 2 em `childrenAges` conta como bebê (regra da aérea), não como criança paga.
3. Preço de criança = 100% do adulto (Travelpayouts não dá tarifa infantil); tarifa de bebê é "à parte".

## Prompt de redeploy (colar no Lovable)
> Faça redeploy da edge function `amadeus-flights`. Arquivo alterado: `supabase/functions/amadeus-flights/index.ts`
> (importa `supabase/functions/_shared/http.ts`, sem alteração). Nenhum outro arquivo de function mudou. Sem novos
> secrets. Ela passa a aceitar `adults`, `children`, `infants` e a ecoar `pax` na resposta.

## Saída do git push (commit feat)
```
To https://github.com/PedroContrucci/kinus-clan-compass
   630eaab..601068d  main -> main
```
