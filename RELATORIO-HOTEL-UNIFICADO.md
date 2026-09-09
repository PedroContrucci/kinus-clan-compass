# Relatório — Unificar as bases de hotel: o gerador escolhe entre os curados

**Commit:** `26397da` · `feat(hotel): gerador escolhe entre os curados`
**Data:** 09/09/2026 · **Origem:** `RELATORIO-TROCAR-HOTEL.md` §2 e §7 (raiz achada no arco anterior)
**Arquivos:** 1 novo, 4 alterados · 146 inserções, 25 remoções
**Estado:** no repo e no `main`. **Publish e smoke são do fundador.**

---

## 1. O que estava errado

Duas bases de hotéis viviam em paralelo e o gerador usava a fraca:

| | `curatedHotels.ts` | `HOTEL_RECOMMENDATIONS` |
|---|---|---|
| Tamanho | 68 hotéis · 16 cidades | 107 hotéis · 32 cidades |
| Campos | zona, tier, personas, **faixa**, rating, tips | nome, estrelas, bairro, `whyGood`, `perNight` |
| Consumidor antes | só o agente (`KinuAIContext`) | **`buildDraftTrip`** — o hotel da viagem |

Medido no arco anterior: **7 de 84** escolhas do gerador estavam entre os curados. Cartagena e
Gramado — 10 hotéis curados cada — nasciam com `Novotel <cidade>`, nome sintético de *fallback*,
enquanto a pílula da trilha prometia "Escolhido pelo KINU".

Agora **viagens novas nascem curadas quando a cidade tem um curado do tier pedido**: 33 das 84
células cidade × tier, todas com a diária dentro da faixa curada. As outras 51 ficam byte a byte
iguais.

---

## 2. O achado que definiu a regra (e por que não é o `[0]` cru)

O briefing dizia "escolhe o 1º de `rankHotelsForTrip`". **Medi antes de escrever, e o `[0]` cru não
serve.** Duas medições:

**(a) A curadoria não cobre os tiers.** `budget` existe em **4 das 16** cidades curadas, `mid` em 9,
`upscale` em 14, `resort` em 9. Os 4 tiers do wizard colapsam em 3 (`backpacker`/`economic` →
`budget`), e só 33 das 64 células das cidades curadas têm hotel do tier exato.

| Cidade | total | budget | mid | upscale | resort |
|---|---|---|---|---|---|
| Cartagena | 10 | 1 | 2 | 4 | 3 |
| Gramado | 10 | 2 | 3 | 4 | 1 |
| Dubai | 5 | 1 | 0 | 1 | 3 |
| Orlando | 5 | 0 | 1 | 0 | 4 |
| Rio de Janeiro | 4 | 0 | 0 | 3 | 1 |
| Lisboa | 4 | 0 | 0 | 2 | 2 |
| Buenos Aires | 4 | 0 | 1 | 3 | 0 |
| Porto Seguro | 4 | 0 | 0 | 0 | 4 |
| Paris · Tóquio · Roma · Nova York · Barcelona | 3 cada | 0 | 1 | 2 | 0 |
| Salvador | 3 | 0 | 0 | 2 | 1 |
| Fortaleza | 2 | 0 | 0 | 1 | 1 |
| Londres | 2 | 1 | 0 | 1 | 0 |

**(b) Sem tier exato, a ordenação ignora o orçamento.** `rankHotelsForTrip` foi escrita para
**listar** — o humano vê o preço e decide. Como escolha automática, quando nada bate o tier, quem
decide é persona + rating:

| Cidade · tier | Hoje | `rank[0]` cru | Fator |
|---|---|---|---|
| Rio · Mochileiro | Selina R$ 150 | **Copacabana Palace R$ 4.500** | 30× |
| Orlando · Econômico | Ibis R$ 500 | **Four Seasons Resort R$ 5.000** | 10× |
| Barcelona · Mochileiro | Brummell R$ 330 | Hotel Arts R$ 3.500 | 10,6× |
| Porto Seguro · Mochileiro | Ibis R$ 285 | Club Med Trancoso R$ 2.750 | 9,6× |
| Salvador · Mochileiro | Ibis R$ 120 | Deville Prime R$ 900 | 7,5× |
| Dubai · Conforto | Rove R$ 1.300 | Atlantis The Palm R$ 3.750 | 2,9× |

Um mochileiro que abre o app e recebe o Copacabana Palace não ganhou curadoria: ganhou uma conta
que não pediu. Testei também *tier mais próximo* (desce primeiro): ou estoura o orçamento (Rio
budget → Fairmont R$ 2.150, 14×) ou rebaixa o tier pago (Londres **Conforto** → Premier Inn
`budget`; Dubai Conforto → Rove R$ 525). Nenhum fallback automático é honesto.

### A regra que ficou

```ts
const ACCEPTED_TIERS = {
  budget:  ['budget'],
  mid:     ['mid'],
  upscale: ['upscale', 'resort'],   // no topo os dois são pares — a ordenação já assumia
  resort:  ['resort', 'upscale'],
};
pickCuratedHotelForTrip = rank(...).find(r => accepted.includes(r.hotel.tier)) ?? null;
```

- **Dentro do conjunto aceito, a ordenação de sempre decide** (tier +100 > resort +40, persona,
  zona ideal, rating no desempate). Nenhuma lógica de ranking nova: a missão era ligar o que o
  arco anterior escreveu e testou, não reescrever.
- **`null` é resposta legítima**, não falha: sem cobertura de tier, o gerador segue no
  `HOTEL_RECOMMENDATIONS`. Mesmo padrão honesto das 5 cidades sem curadoria.
- **A porta de saída continua aberta:** o modal mostra a curadoria **inteira** com preço e faixa.
  Quem quer o Copacabana Palace escolhe o Copacabana Palace — vendo o número. É a diferença entre
  oferecer e empurrar.

**Cobertura:** 0 → **33 de 84** células. Nas 16 cidades curadas, 33 de 64. Em Conforto + Luxo,
**23 de 32**. Em Luxo, **16 de 16**.

---

## 3. O que foi construído

### 3.1 `src/lib/hotelSwap.ts` (+83/−12)

- `ACCEPTED_TIERS` + `pickCuratedHotelForTrip(city, trip)` — §2, com o porquê no comentário.
- `curatedAccommodationFields(hotel, fallback)` — **fonte única** do mapeamento hotel curado →
  hospedagem (`name`, `neighborhood: zone`, `description: tips[0]`, `stars: TIER_STARS[tier]`,
  `curatedHotelId`). Estava embutido no `applyHotelSwap`; agora os dois caminhos — troca do
  usuário e criação da viagem — escrevem hospedagem do mesmo jeito e não podem divergir. Os 27
  casos do `hotelSwap.test.ts` seguem verdes sem uma linha alterada: é o teste do helper.
- Cabeçalho do arquivo atualizado: o aviso "unificar é a missão seguinte" virou a descrição do
  estado real (viagens antigas quase nunca têm curado; novas nascem curadas em 33/84).

### 3.2 `src/lib/createTrip.ts` (+40/−11) — o coração

```ts
const curatedHotel = pickCuratedHotelForTrip(destinationCity, {
  budgetTier: input.budgetTier,          // do INPUT: o SavedTrip guarda budgetType=travelStyle
  travelers: totalTravelers,             // persona sai daqui: >=3 família, 2 casal, 1 solo
  travelInterests: input.travelInterests || [],
});

const baseHotelNightPrice = Math.round(getActivityPrice('hotel_night', ...) * tierMultiplier);
const hotelNightPrice = curatedHotel ? nightlyRateFor(curatedHotel, baseHotelNightPrice) : baseHotelNightPrice;

const baseHotelPlanned = Math.round(estimate.hotel * tierMultiplier);
const hotelPlanned = curatedHotel ? hotelNightPrice * totalNights : baseHotelPlanned;
const totalPlanned = Math.round((estimate.flights + estimate.hotel + tours + food + transport) * tierMultiplier)
  + (hotelPlanned - baseHotelPlanned);   // delta 0 sem curado -> byte a byte igual
```

O termo de delta é o que **garante** a não-regressão: sem hotel curado ele é exatamente `0` e a
expressão é a de antes, dígito por dígito — não é "quase igual", é a mesma conta.

`budgetTotal = input.budgetAmount || totalPlanned` passa a considerar o hotel curado, então
**rascunho sem orçamento informado não nasce estourado** (`available: 0`, travado por teste).
`curatedHotelId` entra por fora do tipo com um `as` local no literal, como `mealPlan` já entrava
(recon §4.6) — `src/types/` intocado.

### 3.3 O bug que apareceu no caminho (e que o D2 mandou consertar)

`GeneratedItineraryStage` roda o gerador interno **sempre** e, num `useEffect` de mount, persiste
as finanças com a **sua** estimativa (`getActivityPrice('hotel_night') × noites`, ignorando
`trip.accommodation`). Consequências:

- o bucket de hospedagem do hotel curado voltava para a estimativa assim que o usuário abria a
  etapa de roteiro — card mostrando R$ 650/noite, Financeiro mostrando R$ 800;
- **pior, isso atravessa o arco anterior:** o delta que `applyHotelSwap` grava era revertido na
  próxima visita à etapa. O "Trocar hotel" desfazia a si mesmo, em silêncio. O
  `RELATORIO-TROCAR-HOTEL.md` §3.5 afirmou persistência e não viu este caminho — **fica
  corrigido aqui**;
- hoje era quase invisível porque as duas contas coincidem — exceto no Mochileiro, onde a etapa
  **ignora o multiplicador 0,6** e já inflava o bucket.

Correção: `DraftCockpit` passa `hotelPlannedOverride = accommodation.totalPrice` **só quando há
`curatedHotelId`**, e o `computeBuckets` da etapa prefere o override. 6 linhas úteis, 2 arquivos,
portão na proveniência: viagem sem hotel curado não muda um centavo, e o "byte a byte" do §4 segue
valendo. `hotelPlannedOverride` entrou nas duas listas de dependências (é `number | undefined`
derivado de `accommodation.totalPrice`: só muda quando o hotel muda, e recomputar com o mesmo
valor não redispara nada — o laço que o comentário de `:1134` guarda não reabre).

Aproveitei para tipar `DraftTrip.accommodation` como `AccommodationLike` em vez de espalhar dois
`as any` — o `eslint` do arquivo fecha em 29 problemas, o mesmo de antes.

### 3.4 `src/test/hotelUnificado.test.ts` (novo, 14 casos)

Trava as **duas** metades da regra, porque cada uma sozinha quebra o produto:

1. Cartagena/Conforto nasce com hotel da curadoria e `curatedHotelId` gravado; `Novotel` morre e o
   nome é de um curado de verdade; **tier respeitado** (Mochileiro pega `budget`, Luxo pega
   `upscale`, e a diária do mochileiro é menor que a do luxo); a diária **é** o ponto médio e cai
   dentro da faixa; a tip curada vira a `description`; Tóquio Conforto e Luxo curados (acento na
   chave não atrapalha); finanças coerentes (`totalPrice = diária × noites`,
   `categories.accommodation.planned = totalPrice`, `planned` = soma dos buckets, rascunho sem
   orçamento não nasce estourado).
2. Istambul e Bangkok seguem no `HOTEL_RECOMMENDATIONS`, sem proveniência, com o sufixo
   `" — Bairro, Cidade"` de sempre; Marrakech/Conforto confere os **números** de antes
   (R$ 800/noite, R$ 5.600, planejado R$ 38.720); **Rio/Mochileiro não é promovido** a hotel de
   luxo curado — é o caso que justifica a regra inteira.
3. `pickCuratedHotelForTrip`: `upscale`↔`resort` como par (Porto Seguro, só resorts, atende o
   Luxo); resort **não** desce para o Conforto (Dubai/Conforto fica sem curado em vez de receber
   Atlantis a R$ 3.750); cidade sem curadoria e argumentos nulos devolvem `null` sem explodir.

---

## 4. Matriz de não-regressão — 84 células

Regerada **com o código aplicado** (viagem de 8 dias / 7 noites, 2 adultos + 2 crianças, GRU →
cidade, sem orçamento informado). `CURADAS: 33/84 · FORA DA FAIXA: 0`.

### 4.1 As 33 células que mudaram

| Cidade | Tier | Hotel ANTES | R$/n | Hotel DEPOIS | id curado | tier/zona | Faixa | R$/n | Planejado |
|---|---|---|---|---|---|---|---|---|---|
| Paris | Conforto | Hotel Le Marais | 1.800 | Citadines Tour Eiffel | `par-h-citadines-eiffel` | mid/15e | 800-1.300 | **1.050** | 61.218 → 55.968 |
| Paris | Luxo | Le Bristol Paris | 4.500 | Le Pavillon de la Reine | `par-h-pavillon-reine` | upscale/Marais | 2.200-3.800 | **3.000** | 122.286 → 111.786 |
| Fortaleza | Luxo | Vila Galé | 3.500 | Gran Marquise | `for-h-gran-marquise` | upscale/Mucuripe | 800-1.400 | **1.100** | 128.640 → 111.840 |
| Rio de Janeiro | Luxo | Belmond Copacabana Palace | 2.000 | Fairmont Rio Copacabana | `rio-h-fairmont` | upscale/Copacabana | 1.500-2.800 | **2.150** | 59.914 → 60.964 |
| Lisboa | Luxo | Olissippo Lapa Palace | 2.800 | Memmo Alfama | `lis-h-memmo` | upscale/Alfama | 1.000-1.800 | **1.400** | 84.158 → 74.358 |
| Orlando | Conforto | Novotel Orlando | 1.200 | Drury Plaza Disney Springs | `orl-h-drury` | mid/Lake Buena Vista | 600-1.000 | **800** | 55.384 → 52.584 |
| Orlando | Luxo | Four Seasons Orlando | 3.000 | Four Seasons Resort Orlando | `orl-h-four-seasons` | resort/Disney World | 3.500-6.500 | **5.000** | 111.786 → 125.786 |
| Tóquio | Conforto | Hotel Gracery Shinjuku | 1.600 | Mimaru Tokyo Ueno | `tok-h-mimaru-ueno` | mid/Ueno | 700-1.200 | **950** | 59.496 → 54.946 |
| Tóquio | Luxo | Aman Tokyo | 4.000 | Park Hyatt Tokyo | `tok-h-park-hyatt` | upscale/Shinjuku | 2.800-5.000 | **3.900** | 116.676 → 115.976 |
| Roma | Conforto | Hotel Raffaello | 1.400 | Hotel Santa Maria | `rom-h-santa-maria` | mid/Trastevere | 700-1.200 | **950** | 54.152 → 51.002 |
| Roma | Luxo | Hotel de Russie | 3.500 | Hotel Artemide | `rom-h-artemide` | upscale/Via Nazionale | 900-1.500 | **1.200** | 105.182 → 89.082 |
| Salvador | Luxo | Four Seasons Salvador | 1.500 | Fasano Salvador | `ssa-h-fasano` | upscale/Comércio | 1.500-2.800 | **2.150** | 49.076 → 53.626 |
| Buenos Aires | Conforto | Mine Hotel | 600 | Home Hotel | `bue-h-home` | mid/Palermo Hollywood | 500-900 | **700** | 26.440 → 27.140 |
| Buenos Aires | Luxo | Mine Hotel | 1.800 | Palacio Duhau - Park Hyatt | `bue-h-duhau` | upscale/Recoleta | 1.600-2.800 | **2.200** | 55.110 → 57.910 |
| Cartagena | Mochileiro | Ibis Cartagena | 180 | Life is Good Hostel | `ctg-h-life-good` | budget/Getsemaní | 80-200 | **140** | 8.865 → 8.585 |
| Cartagena | Econômico | Ibis Cartagena | 300 | Life is Good Hostel | `ctg-h-life-good` | budget/Getsemaní | 80-200 | **140** | 17.900 → 16.780 |
| Cartagena | Conforto | **Novotel Cartagena** | 800 | Estelar Cartagena de Indias | `ctg-h-estelar` | mid/Bocagrande | 500-800 | **650** | 36.064 → 35.014 |
| Cartagena | Luxo | Four Seasons Cartagena | 2.200 | Hyatt Regency Cartagena | `ctg-h-hyatt` | upscale/Bocagrande | 900-1.500 | **1.200** | 70.556 → 63.556 |
| Nova York | Conforto | citizenM Bowery | 2.200 | Hotel Beacon | `ny-h-beacon` | mid/Upper West Side | 1.200-2.000 | **1.600** | 84.120 → 79.920 |
| Nova York | Luxo | The Mark | 5.500 | The Plaza | `ny-h-plaza` | upscale/Central Park South | 4.000-8.000 | **6.000** | 172.030 → 175.530 |
| Gramado | Mochileiro | **Ibis Gramado** | 120 | Pousada Vovó Carolina | `gra-h-vovo-carolina` | budget/Centro | 350-550 | **450** | 4.530 → 6.840 |
| Gramado | Econômico | **Ibis Gramado** | 200 | Pousada Vovó Carolina | `gra-h-vovo-carolina` | budget/Centro | 350-550 | **450** | 10.312 → 12.062 |
| Gramado | Conforto | **Novotel Gramado** | 500 | Bavária Sport Hotel | `gra-h-bavaria` | mid/Centro | 600-1.000 | **800** | 21.638 → 23.738 |
| Gramado | Luxo | Four Seasons Gramado | 1.500 | Hotel Ritta Höppner | `gra-h-ritta` | upscale/Mini Mundo | 1.500-2.500 | **2.000** | 47.140 → 50.640 |
| Londres | Mochileiro | The Hoxton Southwark | 480 | Premier Inn County Hall | `lon-h-premier-ch` | budget/South Bank | 700-1.100 | **900** | 18.032 → 20.972 |
| Londres | Econômico | The Hoxton Southwark | 800 | Premier Inn County Hall | `lon-h-premier-ch` | budget/South Bank | 700-1.100 | **900** | 35.164 → 35.864 |
| Londres | Luxo | The Savoy | 4.800 | The Savoy | `lon-h-savoy` | upscale/Strand | 4.500-8.000 | **6.250** | 131.260 → 141.410 |
| Barcelona | Conforto | Hotel Brummell | 1.300 | Yurbban Trafalgar | `bcn-h-yurbban` | mid/Sant Pere | 700-1.100 | **900** | 49.906 → 47.106 |
| Barcelona | Luxo | Mandarin Oriental | 3.200 | Hotel Arts Barcelona | `bcn-h-arts` | upscale/Barceloneta | 2.500-4.500 | **3.500** | 96.138 → 98.238 |
| Porto Seguro | Luxo | Four Seasons Porto Seguro | 2.660 | Club Med Trancoso | `pse-h-club-med` | resort/Trancoso | 2.000-3.500 | **2.750** | 77.874 → 78.504 |
| Dubai | Mochileiro | Rove Downtown | 300 | Rove Downtown | `dxb-h-rove-dt` | budget/Downtown | 400-650 | **525** | 15.230 → 16.805 |
| Dubai | Econômico | Rove Downtown | 500 | Rove Downtown | `dxb-h-rove-dt` | budget/Downtown | 400-650 | **525** | 29.312 → 29.487 |
| Dubai | Luxo | Burj Al Arab | 4.000 | Address Downtown | `dxb-h-address-dt` | upscale/Downtown | 2.000-3.500 | **2.750** | 109.294 → 100.544 |

### 4.2 As 51 células idênticas (conferidas valor por valor)

Hotel, bairro, estrelas, diária, `totalPrice`, bucket de hospedagem e `finances.planned` iguais aos
de antes do commit:

- **20** das 5 cidades sem curadoria: Cidade do Cabo, Istambul, Bangkok, Marrakech, Singapura.
  Amostras: Marrakech/Conforto `Riad Kniza — Medina, Marrakech` R$ 800 · 5.600 · planejado 38.720;
  Singapura/Luxo `Naumi Hotel` R$ 3.800 · 26.600 · 106.608.
- **31** das cidades curadas sem hotel no tier: Mochileiro e Econômico em Paris, Fortaleza, Rio,
  Lisboa, Orlando, Tóquio, Roma, Salvador, Buenos Aires, Nova York, Barcelona, Porto Seguro (24);
  Conforto em Fortaleza, Rio, Lisboa, Salvador, Porto Seguro, Londres, Dubai (7).
  Amostras: Dubai/Conforto `Rove Downtown — Downtown, Dubai` R$ 1.300 · 9.100 · 52.848;
  Londres/Conforto `The Hoxton Southwark` R$ 2.000 · 14.000 · 64.746.

### 4.3 Leitura honesta dos números

- **No Luxo o planejado cai em 9 cidades e sobe em 7.** As quedas são grandes (Fortaleza −16.800,
  Roma −16.100, Paris −10.500): a base antiga cobrava `Four Seasons <cidade>` genérico onde a
  curadoria tem hotel real e mais barato.
- **Mochileiro e Econômico sobem nas 4 cidades com tier `budget`.** Gramado 120 → 450 é o caso
  claro: **`Ibis Gramado a R$ 120/noite` não existe** — era preço sintético. R$ 450 na Pousada Vovó
  Carolina é a faixa real. O número piora e a informação melhora.
- **Mochileiro e Econômico recebem o mesmo hotel e a mesma diária** nessas 4 cidades: os dois viram
  `budget` no `TIER_MAP` e a curadoria não tem dois degraus abaixo de `mid`. O multiplicador 0,6 do
  Mochileiro deixa de valer **na linha do hotel** (segue valendo no resto da viagem).
- **`Novotel <cidade>` sai de Cartagena e Gramado** — os dois casos que abriram esta missão.
- **`stars` vem do tier** (`budget`→3, `mid`→4, `upscale`/`resort`→5). A curadoria não tem estrelas,
  só `rating` (todos entre 4,5 e 4,8, o que arredondaria os 68 para 5). É aproximação de
  **exibição**, declarada no código desde o arco anterior — daí `Life is Good Hostel` aparecer
  como 3★.
- **O nome perde o sufixo `" — Bairro, Cidade"`** (passa a ser o nome curado puro, como a troca já
  gravava). **Ganho colateral confirmado:** `TripPanel:926` e `tripPdfExport:1226` montam o link de
  mapa concatenando `", <destino>"` e hoje geram *"Novotel Cartagena — Centro, Cartagena,
  Cartagena"*; agora vira *"Estelar Cartagena de Indias, Cartagena"*.

---

## 5. Verificação

| Checagem | Resultado |
|---|---|
| `src/test/hotelUnificado.test.ts` | **14 casos** |
| Suíte inteira | **221/221** em 17 arquivos (era 207/207) |
| `hotelSwap.test.ts` + `hotelSwapPersistence.test.ts` | 27 + 6 verdes **sem alteração** — são o teste do helper extraído |
| `flightArrivalDay` / `generatorNoRepeat` (chamam `buildDraftTrip`) | 12 + 9 verdes |
| `tsc --noEmit -p tsconfig.app.json` | limpo |
| `eslint` — `createTrip.ts` + `hotelSwap.ts` | **3 antes, 3 depois** (todos pré-existentes) |
| `eslint` — `DraftCockpit.tsx` + `GeneratedItineraryStage.tsx` | **29 antes, 29 depois** (medido com `git stash`) |
| `vite build` | ok |
| Matriz 84 células | 33 curadas, **0 fora da faixa**, 51 idênticas |

**O smoke de 336 não roda aqui** — é a página `SmokeTest.tsx`, que conta no browser. Fica com você
junto do Publish. A forma de `accommodation` não mudou (só valores e um campo novo por fora do
tipo).

---

## 6. Como conferir no app

1. **Rascunho novo em Cartagena, Conforto** → a pílula **Hotel** da trilha mostra
   `Estelar Cartagena de Indias`, não `Novotel Cartagena`. O card mostra `Bocagrande`, 4★, e a tip
   curada como descrição.
2. **Mesma viagem → 🔄 Trocar hotel:** o atual agora aparece **dentro** da lista curada com
   `✓ ATUAL` (não mais na seção "fora da curadoria").
3. **Rascunho novo em Rio, Mochileiro** → `Selina Copacabana` a R$ 150, como antes. O Rio não tem
   curado `budget`, e o modal segue oferecendo os 4 curados **com preço** para quem quiser subir.
4. **Rascunho novo em Istambul** → idêntico ao de antes; o modal continua admitindo a lacuna.
5. **Abrir a etapa de roteiro de um rascunho curado e voltar ao Financeiro:** o bucket de
   hospedagem **continua** com a diária curada (era aqui que a estimativa antiga voltava — §3.3).
6. **Trocar hotel numa viagem ativa, ir ao roteiro e voltar:** o delta da troca sobrevive.

---

## 7. O que este patch NÃO fez

- **Não tocou em `src/data/`** (leitura apenas), `src/types/`, gerador de **roteiro**, edge
  function, migração, secret ou telemetria.
- **Não alterou nenhuma viagem existente.** Sem migração retroativa e sem lazy: a regra roda no
  nascimento da viagem, e só ali.
- **Não aposentou `HOTEL_RECOMMENDATIONS`.** Ela é a base das 5 cidades sem curadoria e das 31
  células sem tier coberto. Aposentá-la exige curadoria nova — decisão de conteúdo, não de código.
- Não criou campo de tier ou persona em `SavedTrip` (ver §8).

---

## 8. Dívidas — as herdadas e uma nova

- **`budgetType` ≠ tier (nova, registrada por decisão sua).** `SavedTrip` guarda
  `budgetType: travelStyle`, que não é tier; `tierOfTrip` não acha o valor no `TIER_MAP` e cai no
  default `mid`. Efeito: o **modal** ranqueia qualquer viagem salva como `mid`. O gerador não sofre
  porque recebe `input.budgetTier` direto. Consertar exige `src/types/trip.ts` — proibido neste
  arco. Curiosidade que confirma o diagnóstico: o `DraftCockpit` declara
  `budgetType?: 'backpacker' | 'economic' | 'comfort' | 'luxury'` no seu tipo local, ou seja, o
  componente **acredita** que o campo é tier.
- **`src/types/trip.ts` incompleto** — origem dos tipos-espelho (`SwapTripLike` e companhia) e do
  `StoredTrip`.
- **Haversine no lugar do proxy de fuso** em `getFlightDuration` (`RELATORIO-VOO-D2.md` §5.1).
- **`originSource` antes da missão da origem** (`RELATORIO-VOO-D2.md` §5.2): `criar_viagem` chuta
  GRU hardcoded.
- **Cabeçalho do `curatedHotels.ts` impreciso:** lista as cidades como *"Rome, Tokyo"* enquanto as
  **chaves** do objeto estão em português (`'Roma'`, `'Tóquio'`) — vem da tabela do kinu-beta. Não
  há bug de lookup (medido: `Tóquio direto=3`, `Roma direto=3`), e o arquivo é gerado e proibido
  aqui. Some no próximo `sync-hotels`.

---

## 9. Estado

| Item | Estado |
|---|---|
| `pickCuratedHotelForTrip` + `ACCEPTED_TIERS` | ✅ no `main` |
| `curatedAccommodationFields` como fonte única | ✅ no `main` |
| `buildDraftTrip` escolhendo entre os curados (33/84) | ✅ no `main` |
| Finanças coerentes com o hotel curado | ✅ travado por teste |
| Bucket revertido pela etapa de roteiro (bug do arco anterior) | ✅ corrigido, portão no `curatedHotelId` |
| 51 células sem curadoria byte a byte iguais | ✅ conferidas na matriz |
| Viagens existentes intactas | ✅ nenhuma migração |
| **Publish + smoke 336** | ⏳ **do fundador** |
| `sync-catalog --apply` (catálogo atual, WARN de Fortaleza) | 📋 missão seguinte, já autorizada |

Arcos 5.a-5.e inalterados. **O relógio do 5.f não foi tocado:** série diária desde 06/09, aperto
elegível a partir de 13/09. O redeploy da `kinu-ai` + `catalog.ts` (`e354681`) segue pendente.

**Rascunho `STEP1-HOTEL-UNIFICADO.md`:** deletado, conforme protocolo. Nunca entrou em commit.
