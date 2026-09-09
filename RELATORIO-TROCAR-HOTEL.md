# Relatório — Hotéis curados visíveis e escolhíveis

**Commit:** `c92d780` · `feat(hotel): hotéis curados visíveis e escolhíveis`
**Data:** 09/09/2026 · **Origem:** lacuna apontada pelo fundador e pelos testadores
**Arquivos:** 4 novos, 4 alterados · 1.069 inserções, 15 remoções
**Estado:** no repo e no `main`. **Publish e smoke são do fundador.**

---

## 1. A lacuna

68 hotéis curados viviam em `src/data/curatedHotels.ts` com zona, tier, persona, faixa de preço e
tips. O algoritmo escolhia um por viagem, e o usuário **não via a lista nem conseguia trocar**.
Segunda maior decisão de uma viagem em família, sem porta de saída — contra o eixo de
suficiência. O código sabia: o comentário da pílula "Hotel" na trilha do rascunho dizia
literalmente *"chosen by KINU inside the itinerary; read-only for now"*.

---

## 2. O achado que mudou o desenho

O briefing dizia "o algoritmo escolhe um [dos 68]". **Não escolhe.** Existem duas bases de hotéis
paralelas, e a que o gerador usa não é a curada:

| | `src/data/curatedHotels.ts` | `HOTEL_RECOMMENDATIONS` (`hotelZones.ts`) |
|---|---|---|
| Tamanho | 68 hotéis · 16 cidades | **107 hotéis · 32 cidades** |
| Origem | `sync-hotels.ts` ← `curated_hotels` do kinu-beta | escrita à mão no arquivo |
| Campos | zona, tier, personas, faixa, rating, tips | nome, estrelas, bairro, `whyGood`, `perNight` |
| Consumidor | **só `KinuAIContext`** — o agente | **`buildDraftTrip`** — o hotel da viagem |

Medi a sobreposição rodando as duas bases uma contra a outra:

```
SOBREPOSIÇÃO: 7/84 escolhas do algoritmo estão entre os 68 curados

Paris          algoritmo="Hotel Le Marais"     |  3 curados | está na lista? false
Cartagena      algoritmo="Novotel Cartagena"   | 10 curados | false
Gramado        algoritmo="Novotel Gramado"     | 10 curados | false
Rio de Janeiro algoritmo="Arena Copacabana"    |  4 curados | false
Dubai          algoritmo="Rove Downtown"       |  5 curados | TRUE  ← a única
```

**Em 20 das 21 cidades o hotel do tier "conforto" não existe na lista curada.** E a base do
gerador é a mais fraca: ele devolve `Novotel <cidade>` — nome sintético de fallback — para
Cartagena e Gramado, que têm **10 hotéis curados cada** ali do lado, sem uso.

**Consequência de desenho:** "o atual marcado" era insatisfazível em ~92 % dos casos. A resposta
está no §3.2, e a raiz virou a missão seguinte (§7).

### 2.1 Dois números meus estavam errados

São **68** hotéis, não 61, e **5** cidades sem curadoria, não 11 — Cidade do Cabo, Istambul,
Bangkok, Marrakech e Singapura; as outras 16 têm. Os dois saíram da prosa do
`RELATORIO-CATALOGO-DEMANDA.md` §8.2 e do commit `e354681`, e de lá entraram no briefing desta
missão. O gerador e o `catalog.ts` sempre disseram `68 hotéis`. Corrigido no mesmo commit, com
nota de correção no relatório anterior.

### 2.2 `HeroCards.tsx` é código morto

Zero importadores em todo o `src/`. O card de hotel que o usuário vê não é esse — construir ali
teria produzido uma feature invisível.

---

## 3. O que foi construído

### 3.1 `src/lib/hotelSwap.ts` — a lógica pura

Sem React, testável direto.

**O preço é o ponto honesto.** `priceRangeBRL` é **string formatada**, não número. Conferi os 68:
todos casam `R$ <min>-<max>` em pt-BR (41 em `R$ #.###-#.###`, 19 em `R$ ###-#.###`, 5 em
`R$ ###-###`, 2 em `R$ ##-###`, 1 em `R$ #.###-##.###`; zero fora do padrão). O parse é
determinístico e total, usa o **ponto médio** como diária — e o modal mostra a **faixa inteira**
ao lado, com "usamos R$ X no orçamento". O usuário vê de onde veio o número em vez de receber um
valor exato que não existe.

**Ordenação:** tier igual `+100`, persona `+50`, zona ideal `+10`, rating no desempate. `resort`
vale `+40` para quem pediu acima de `budget`, e nunca ganha do tier exato. Persona derivada do que
a viagem já tem — `travelers >= 3` → família, `2` → casal, `1` → solo — **sem campo novo**.

**`applyHotelSwap` é imutável e o delta não acumula:** ele é sempre calculado contra o
`totalPrice` vigente, então A→B→C deixa o mesmo estado de A→C. Mesmo desenho do
`flightFinance.syncTripFlightPlannedFinances`, que já era o padrão da casa.

**`stars` vem do tier** (`budget`→3, `mid`→4, `upscale`/`resort`→5): a curadoria não tem estrelas,
só `rating`, e todos estão entre 4,5 e 4,8 — arredondar daria 5 para os 68. **É aproximação de
exibição, não dado**, e está declarado no código e no teste.

### 3.2 `HotelSwapModal` — a seção ATUAL

```
ATUAL — ESCOLHIDO PELO KINU
  Novotel Cartagena · Centro · R$ 450/noite
  não faz parte da curadoria KINU desta cidade
─────────────────────────────────
CURADORIA KINU EM CARTAGENA (10)
  ● Casa San Agustín · Centro Histórico · Alto padrão · casal   RECOMENDADO
    R$ 2.200-3.800/noite · usamos R$ 3.000 no orçamento
    <1 tip>
```

Quando o atual **é** um dos curados (o caso Dubai), ele não aparece duas vezes: some da seção
ATUAL e ganha `✓ ATUAL` na lista, desabilitado.

O rodapé mostra o impacto no planejado antes de aplicar. **Trocar hotel confirmado pede um segundo
toque** — a confirmação é sobre uma reserva concreta, e ela deixa de existir; o aviso diz isso e
mostra o delta.

### 3.3 Cidades sem curadoria (5)

O botão **existe** — a ausência é informação. O modal diz que ainda não há hotéis curados ali,
sem rodeio ("prefiro dizer isso a inventar uma recomendação"), e oferece o caminho externo que já
existia: o `onOpenAuction('hotel')` do `TripPanel`. Zero componente novo.

### 3.4 Os pontos de entrada

| Ponto | O quê |
|---|---|
| `TripPanel` — card de hotel | botão "🔄 Trocar hotel", visível inclusive com hotel confirmado |
| `DraftCockpit` — pílula "Hotel" da trilha | passa a abrir o modal; deixou de ser read-only |
| `Viagens.tsx` | passa `onUpdateTrip={handleUpdateTrip}` ao `DraftCockpit`, o mesmo contrato que o `TripPanel` já tinha |

**Desvio do STEP1, declarado:** o terceiro ponto previsto era a linha "Hotel:" do
`GeneratedItineraryStage:1361`. Ao implementar vi que ela **não é um card de hotel** — é uma linha
de porcentagem dentro do detalhamento de orçamento (`R$ 3.150 (16%)`), que nem mostra o nome do
hotel. Botão de troca ali seria botão numa linha de finanças. A pílula da trilha está na mesma
tela, logo acima, e é o ponto certo. Se preferir o botão também no resumo, é uma linha.

### 3.5 Persistência

Um só caminho de escrita para os dois estados da viagem: `onUpdateTrip` → `handleUpdateTrip` →
`updateTrip(id, updater)`, que é **read-modify-write a partir do storage**, não da cópia React —
as outras viagens nunca são reconstruídas da memória. O espelho kinu-beta serializa a viagem
inteira, então a troca sobe pelo outbox do 4c **sem nenhuma mudança de contrato**.

### 3.6 Tipos: nenhuma adição em `src/types/`

`HotelCard` já comportava tudo que a troca escreve. `curatedHotelId` é gravado **por fora do
tipo**, exatamente como `accommodation.mealPlan` já era (recon §4.6) — o `StoredTrip` tem index
signature e o campo atravessa o `normalizeTrip` intacto, o que está travado por teste.

Em vez de espalhar `any`, `hotelSwap.ts` exporta `SwapTripLike`, `AccommodationLike`,
`TripFinancesLike` e `FinanceBucketLike`. `SavedTrip` e `StoredTrip` os satisfazem por estrutura
— **nenhum cast nos chamadores**. Fica registrado como dívida de tipagem, junto da que já estava
aberta: quando `src/types/trip.ts` for corrigido, estes tipos-espelho somem.

---

## 4. Verificação

| Checagem | Resultado |
|---|---|
| `src/test/hotelSwap.test.ts` | **27 casos** |
| `src/test/hotelSwapPersistence.test.ts` | **6 casos** |
| Suíte inteira | **207/207** em 16 arquivos (era 174/174) |
| `tsc --noEmit -p tsconfig.app.json` | limpo |
| `eslint` nos 4 arquivos novos | **zero problemas** |
| `eslint` nos 3 arquivos tocados | **96 antes, 96 depois** — nenhuma dívida nova |
| `vite build` | ok |

O recálculo financeiro é o coração, e está coberto: troca mais cara e mais barata movem
`categories.accommodation.planned`, `finances.planned` e `available` pelo **mesmo delta absoluto**;
**duas trocas seguidas não acumulam**; voltar ao hotel original restaura o orçamento exatamente;
as outras categorias ficam intactas; `available` nunca fica negativo; datas e noites preservadas;
hotel confirmado volta a planejado; faixa ilegível preserva a diária atual em vez de zerar.

A persistência cobre reload (`getTrip` relê do localStorage), preservação do `curatedHotelId` na
travessia do `normalizeTrip`, isolamento das outras viagens do array, ida e volta pelo JSON (o que
o outbox faz) e trocas sucessivas gravadas no storage sem acumular delta.

**O smoke de 336 não roda aqui** — é a página `SmokeTest.tsx`, que conta no browser. Fica com
você junto do Publish. A troca não muda a forma de `accommodation`, só valores; se houver caso de
hotel lá, deve continuar passando.

---

## 5. Como conferir no app

1. Viagem ativa em cidade curada (Cartagena, Gramado, Paris…) → card de hotel → **🔄 Trocar
   hotel**. O atual aparece na seção ATUAL, rotulado; a curadoria abaixo, ordenada.
2. Escolher outro → o total da estadia e o planejado mudam na hora. **Recarregar a página**: a
   escolha continua lá.
3. Rascunho → pílula **Hotel** na trilha → mesmo modal.
4. Cidade sem curadoria (Istambul, Bangkok, Marrakech, Singapura, Cidade do Cabo) → o modal
   admite a lacuna e oferece o caminho externo.
5. Confirmar o hotel e tentar trocar → aviso de que a troca desfaz a confirmação, com o delta.

---

## 6. O que este patch NÃO fez

- **Não tocou em `src/data/`** (leitura apenas) nem em `src/types/`.
- **Não tocou no gerador de roteiro** nem em `buildDraftTrip` — o hotel de viagens novas continua
  saindo de `HOTEL_RECOMMENDATIONS`. É a missão seguinte.
- **Não tocou em edge function**, migração, secret, CORS ou telemetria.
- **Não mexeu nos cartões de voo** nem em `HeroCards` (morto).
- **Não alterou viagens existentes**: nada de migração retroativa. A troca é ação do usuário.

---

## 7. Missão seguinte (decidida pelo fundador): unificar as duas bases

A raiz do §2 **não fica como dívida** — vira arco próprio, com a proibição de "lógica do gerador"
levantada para este ponto específico. O hotel não é roteiro, e servir `Novotel Cartagena` com 10
curados ao lado é o produto mentindo sobre si mesmo.

**Escopo:** `buildDraftTrip` passa a escolher entre `curatedHotels` quando a cidade tiver
curadoria, usando a ordenação de `rankHotelsForTrip` que este arco acabou de escrever e testar
(tier → persona → zona → rating). `HOTEL_RECOMMENDATIONS` fica como fallback só para as cidades
sem curados. **Só viagens novas; as existentes ficam intactas.**

O que já está pronto para isso: `rankHotelsForTrip`, `parsePriceRangeBRL`, `nightlyRateFor` e o
mapa de tier/persona são puros, exportados e cobertos por 27 casos. A missão é ligá-los ao
`createTrip`, não escrevê-los.

**Ponto de atenção para lá:** `getHotelRecommendation` devolve `perNight` **numérico**, e a
curadoria devolve **faixa**. Trocar a fonte muda o preço planejado de toda viagem nova — é
mudança de comportamento visível, não refactor, e merece a mesma matriz de não-regressão que o
`94113bc` teve.

### 7.1 Dívidas herdadas, ainda abertas

- **Haversine no lugar do proxy de fuso** em `getFlightDuration` (`RELATORIO-VOO-D2.md` §5.1).
- **`originSource` antes da missão da origem** (`RELATORIO-VOO-D2.md` §5.2): `criar_viagem` chuta
  GRU hardcoded — origem presente ≠ origem conhecida.
- **`src/types/trip.ts` incompleto**: os tipos-espelho do §3.6 e o `StoredTrip` existem por causa
  disso.

---

## 8. Estado

| Item | Estado |
|---|---|
| `hotelSwap.ts` (parse, ordenação, recálculo) | ✅ no `main` |
| `HotelSwapModal` com seção ATUAL rotulada | ✅ no `main` |
| Entrada na viagem ativa (`TripPanel`) | ✅ no `main` |
| Entrada no rascunho (pílula da trilha) | ✅ no `main` |
| Caminho honesto das 5 cidades sem curadoria | ✅ no `main` |
| Persistência por `updateTrip` + espelho | ✅ travada por teste |
| Correção dos números no relatório anterior | ✅ no mesmo commit |
| **Publish + smoke 336** | ⏳ **do fundador** |
| Unificar as duas bases de hotel | 📋 missão seguinte — §7 |

Arcos 5.a-5.e inalterados. **O relógio do 5.f não foi tocado:** série diária desde 06/09, aperto
elegível a partir de 13/09. O redeploy da `kinu-ai` + `catalog.ts` (`e354681`) segue pendente,
independente deste patch.

**Rascunho `STEP1-TROCAR-HOTEL.md`:** deletado, conforme protocolo. Nunca entrou em commit.
