# STEP1 — FLIGHT-PRICE-ROUTE (não commitar)

## Achados que mudam o plano
1. **Mapeamento cidade→IATA já existe e já chega ao buildDraftTrip.** É `findCityInfo(city).city.airports[0]`
   (src/data/destinationCatalog.ts) — o mesmo do wizard (WizardStep1Logistics:48/155), do KINU AI
   (KinuAIContext:453) e do onboarding (onboardingFlow.ts:65). `input.destinationAirportCode` já vem
   preenchido; origem = `input.originAirportCode || 'GRU'`. Nada novo a mapear.
2. **A tabela `flight_price_estimates` cobre 14 rotas, e nem Cartagena nem Rio estão nela.**
   GRU→AMS, BCN, CDG, DXB, FCO, FRA, JFK, LHR, LIS, MAD, NRT; GIG→CDG, JFK, LIS.
   Das 21 cidades curadas, ganham 'route' no máximo: Paris, Lisboa, Roma, Nova York, Londres,
   Barcelona, Dubai, Tóquio (só se airports[0] for NRT). As outras 13 — incluindo Cartagena, Rio,
   Fortaleza, Salvador, Buenos Aires, Orlando — caem em 'tier'.
   → **O teste "SP→Cartagena ≠ SP→Rio" não passa com os dados de hoje** (os dois viram 'tier'
   e o número do tier é o mesmo para os dois). Decisão A.
3. **`getFlightPriceEstimate` nunca diz "desconhecida".** Sem linha na tabela, ele devolve um
   fallback regional (europe/usa/asia/default) inventado no código. Usar isso como 'route' seria
   mentir no rótulo. Proposta: nova função `lookupRouteEstimate(o, d)` em flightPricing.ts que
   devolve `FlightPriceEstimate | null` (só a consulta à tabela); `getFlightPriceEstimate` passa a
   chamá-la e mantém o fallback dela — comportamento idêntico para quem já usa.
4. **A assinatura não tem data.** `getFlightPriceEstimate(origin, destination)`. A data entra por
   `calculateDatePrice(economyAvg, date)` (dia da semana × temporada), já existente. Sem variação
   aleatória (`includeVariation: false`) para o rascunho ser determinístico.
5. **Unidade:** a tabela traz ida+volta por pessoa (economy_avg GRU→LIS = 4.000). O modelo hoje
   grava `legPrice` por perna (tier ÷ 2). Proposta: perna = round(calculateDatePrice(avg, data da
   perna) / 2), ida com departureDate e volta com returnDate. Decisão B.
6. buildDraftTrip já é async; a consulta falhando (rede/erro) cai em 'tier' — nunca lança.

## Diff proposto
- `src/lib/flightPricing.ts`: + `lookupRouteEstimate(o, d): Promise<FlightPriceEstimate|null>`;
  + `routeLegPrices(o, d, dep, ret): Promise<{outbound, return, priceSource:'route'} | null>`;
  `getFlightPriceEstimate` reusa o lookup (mesma saída).
- `src/lib/createTrip.ts`: `flightPrice` (tier) vira fallback; com rota, `legPrice` de cada perna
  vem de `routeLegPrices`. `buildPlannedFlights` recebe preço de ida e de volta separados.
  `priceSource` gravado nos voos planejados e copiado para `outboundFlight`/`returnFlight`
  (index signature, fora de src/types/trip.ts).
- `src/lib/flightModel.ts`: `buildPlannedFlights` aceita `returnLegPrice?` (default = legPrice) e
  `priceSource?`; `plannedFlightToSelected` propaga `priceSource`.
- `src/lib/onboardingFlow.ts` (kinuDidLines): linha do voo estimado ganha
  "· estimativa por rota" | "· estimativa genérica"; budgetDetail: "voo R$ X (estimativa por rota)".
  Sem priceSource (rascunhos antigos) → "genérica".
- Finanças: nada muda no caminho — o motor já soma price × viajantes nos 4 baldes; total = soma.
- `src/test/flightPriceRoute.test.ts` (novo, supabase mockado):
  (a) rota conhecida ≠ outra rota conhecida (ex. GRU→LIS ≠ GRU→NRT) com priceSource 'route';
  (b) rota ausente → preço = número do tier de hoje, priceSource 'tier';
  (c) erro na consulta → 'tier', sem lançar;
  (d) total do orçamento == voo + hotel + alimentação + passeios (+ reserva) nos dois casos;
  (e) card mostra "estimativa por rota"/"genérica".
  Testes existentes que constroem rascunhos (draftTruth, generatorDayIds, oneActivate…) passam a
  usar o mock do supabase → caem em 'tier' → números atuais preservados.

## Decisões abertas
A. Cartagena/Rio fora da tabela: (1) trocar o teste para duas rotas que existem (GRU→LIS vs
   GRU→NRT) e manter Cartagena/Rio em 'tier' — recomendo; ou (2) eu insiro linhas novas em
   `flight_price_estimates` para as 13 cidades faltantes (preciso de valores seus — não invento
   preço); ou (3) as duas coisas.
B. Tabela = ida+volta por pessoa, perna = metade? (recomendo; consistente com tier ÷ 2.)
C. Aplicar a sazonalidade/dia da semana de `calculateDatePrice` ao rascunho? (recomendo sim —
   é o que a missão pede por "data"; muda o número conforme o mês da viagem.)
