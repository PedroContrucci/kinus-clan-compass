# RELATÓRIO — Não repetir o mesmo lugar na viagem inteira

**Data:** 2026-09-03
**Bug de origem:** PDF de Fortaleza com *Cabaña del Primo* escalado 3× (almoço
dia 2, jantar dia 4, almoço dia 8).
**Correção:** unicidade por nome normalizado, global na viagem, atravessando
categorias e dias — mais degradação distribuída quando o pool esgota.

---

## 1. Placar

| Verificação | Antes | Depois |
|---|---|---|
| Vitest | 133/133 | **158/158** (+25 novos) |
| `tsc --noEmit` | limpo | **limpo** |
| ESLint (arquivos tocados) | 64 problemas pré-existentes | **64** — nenhum novo |
| ESLint (arquivos novos) | — | **0** |
| `/smoke` | 320/320 em 20 cenários | **335/336 em 21 cenários** |
| Ocorrências cross-categoria (matriz de 11.040 configs) | 255 | **0** |

---

## 2. O bug tinha dois mecanismos, não um

A hipótese da missão estava certa, mas cobria uma fração do problema. Varrendo
11.040 configurações (23 cidades × 8 durações × 3 tamanhos de grupo × 4 faixas
de preço × 5 conjuntos de interesse):

- **Mecanismo A — cross-categoria.** `for-cabana-del-primo` (lunch) e
  `for-rest-cabana-del-primo` (dinner) são a mesma casa sob ids distintos. A
  regra por id não enxergava. **255 ocorrências, e é o único par colidente do
  catálogo inteiro.**
- **Mecanismo B — reuso intra-categoria.** Quando o pool de uma categoria
  esgota, o gerador já reciclava de propósito. **26.704 ocorrências, 23/23
  cidades.**

O PDF apanhou dos dois ao mesmo tempo: `d2/lunch` + `d3/dinner` (A) e `d8/lunch`
(B). Reproduzido de forma determinística em `Fortaleza, 9 dias, 1 viajante,
midrange, [gastronomy,beach,family], budget 10000` → `d2/lunch d3/dinner
d8/lunch`.

> **Sobre "8 dias":** o PDF foi descrito como 8 dias, mas a repro pede 9. Com 8
> dias o Cabaña sai 1× e o roteiro passa limpo — provavelmente contagem de
> noites vs. dias de calendário. O padrão almoço→jantar→almoço é idêntico.

---

## 3. Cinco caminhos de escalação, não um

A missão apontou `GeneratedItineraryStage.tsx:324`. O ponto real é a linha 303,
e havia mais quatro. Todos corrigidos:

| # | Local | Papel | Estava |
|---|---|---|---|
| A | `GeneratedItineraryStage.tsx:303` `pickActivity` | Gerador do cockpit — produziu o PDF | chave por **id**, por categoria |
| B | `createTrip.ts` `pickExp` + `pickRestaurant` | Gerador do wizard | chave por **id**, por categoria |
| C | `Viagens.tsx:1210` `pickActivity` | Gerador de fallback | chave por **id**; 3º passe ignorava usados por completo |
| D | `Viagens.tsx:574` e `:2625` | Troca manual de atividade | chave por **id** |
| E | `GeneratedItineraryStage.tsx:1235` | Troca manual no stage | chave por **id** |

### Um sexto caminho apareceu durante a implementação

Não estava no STEP1 porque só ficou visível quando o teste do wizard começou a
rodar: em `createTrip.ts`, os **dias de chegada e de recuperação** escalam
restaurantes a partir de `theme.restaurants`, e dias gastronômicos promovem uma
casa Michelin — **nenhum dos dois passava pelo rastreio**. Sintoma real
encontrado: Cartagena com *Carmen* no jantar do dia 2 **e** do dia 3, em dias
consecutivos. E `getTopMichelinForCity(city, 3)[0]` fixava a mesma casa em todo
dia de tema Gastronomia.

Corrigidos: nomes vindos do tema agora são registrados (`claim()`), e o Michelin
escolhe a melhor casa **ainda não usada** na viagem.

---

## 4. Normalização — divergência confirmada pelos dados

`src/lib/placeIdentity.ts`: minúsculas + remoção de acentos + colapso de espaços
+ remoção do prefixo de refeição que a UI acrescenta (`Almoço: `, `Jantar: `).

**Não remove conteúdo entre parênteses.** Medido contra o catálogo inteiro, isso
não colapsa nenhum par a mais que a normalização base (1 em ambos os casos), e
arriscaria fundir `Coco Bambu (Varjota)` com um futuro `Coco Bambu (Beira-Mar)`
— convenção já usada em `Mar & Terra (Varjota)`. Um `.replace()` que hoje não
faz nada e amanhã apaga um restaurante não paga o próprio risco.

| Par | Esperado | Resultado |
|---|---|---|
| `Cabaña del Primo` (lunch) × `Cabaña del Primo` (dinner) | colapsa | ✅ `cabana del primo` |
| `Coco Bambu Beira-Mar` × `Coco Bambu (Varjota)` | não colapsa | ✅ |
| `Praia de Iracema e Ponte dos Ingleses` × `Pôr do sol e noite na Ponte dos Ingleses` | não colapsa | ✅ |

Há uma **guarda de catálogo** nos testes que afirma que o único par colidente das
23 cidades é o Cabaña del Primo. Se alguém cadastrar duas casas reais com nome
colidente, o teste acusa antes que uma suma dos roteiros.

---

## 5. Degradação: o número que decide o mini-lote

Exigência do relatório. Slots de refeição que caem na cascata de reuso, por
cidade, sobre a matriz de 11.040 configurações:

| Cidade | slots de refeição | degradados antes | degradados depois | % depois |
|---|---|---|---|---|
| Cartagena | 8400 | 2520 | 2520 | 30,0% |
| Nova York | 8400 | 1800 | 1800 | 21,4% |
| Dubai | 8400 | 1785 | 1785 | 21,3% |
| Barcelona | 8400 | 1510 | 1510 | 18,0% |
| Singapura | 7628 | 1368 | 1368 | 17,9% |
| Cidade do Cabo | 8144 | 1352 | 1352 | 16,6% |
| Marrakech | 7984 | 1320 | 1320 | 16,5% |
| Gramado | 8400 | 1320 | 1320 | 15,7% |
| Bangkok | 8025 | 1262 | 1262 | 15,7% |
| Istambul | 7960 | 1257 | 1257 | 15,8% |
| Paris | 8400 | 1290 | 1290 | 15,4% |
| Londres | 8400 | 1272 | 1272 | 15,1% |
| Buenos Aires | 8400 | 1248 | 1248 | 14,9% |
| Porto Seguro | 8400 | 1140 | 1140 | 13,6% |
| Lisboa | 8400 | 1108 | 1108 | 13,2% |
| Orlando | 8010 | 1038 | 1038 | 13,0% |
| Roma / Rome | 8400 | 972 | 972 | 11,6% |
| Tóquio / Tokyo | 8400 | 852 | 852 | 10,1% |
| **Fortaleza** | 8400 | **1035** | **780** | **9,3%** |
| Salvador | 8400 | 360 | 360 | 4,3% |
| Rio de Janeiro | 8400 | 60 | 60 | 0,7% |
| **TOTAL** | 190.551 | **27.693** | **27.438** | 14,4% |

A queda de exatamente 255 é toda em Fortaleza — são as ocorrências
cross-categoria eliminadas. **As demais cidades não mudam de volume, e isso é
esperado:** a degradação delas é aritmética (mais slots que restaurantes no
pool), não um defeito de lógica. O que mudou nelas foi a **qualidade** da
degradação:

| Métrica de qualidade | Antes | Depois |
|---|---|---|
| Lugares em papéis diferentes (o bug) | 255 | **0** |
| Nomes com 3+ aparições | 734 | **600** (−18%) |
| Repetições em dias consecutivos | ocorriam | **0** |
| Nomes acima do teto `ceil(slots/pool)` | — | **0 — distribuição ótima** |

### Onde falta catálogo

Este é o número acionável. Restaurantes por categoria vs. o necessário para não
degradar (9 dias exige 7 cafés, 7 almoços, 8 jantares):

| Cidade | café | almoço | jantar | faltam p/ 9d | faltam p/ 14d |
|---|---|---|---|---|---|
| **Cartagena** | 4 | **4** | 6 | **8** | 23 |
| Dubai | 3 | 6 | 6 | 7 | 22 |
| Singapura | 3 | 6 | 6 | 7 | 22 |
| Nova York | 4 | 6 | 6 | 6 | 21 |
| Barcelona / Cidade do Cabo / Istambul / Bangkok / Marrakech | 3 | 6 | 7 | 6 | 21 |
| Buenos Aires / Londres | 3 | 7 | 7 | 5 | 20 |
| Porto Seguro | 3 | 8 | 7 | 5 | 19 |
| Orlando / Gramado | 4 | 7 | 7 | 4 | 19 |
| Lisboa | 4 | 6 | 9 | 4 | 18 |
| Roma / Rome | 4 | 9 | 7 | 4 | 17 |
| Tóquio / Tokyo | 4 | 10 | 7 | 4 | 16 |
| **Fortaleza** | 5 | **6** | 15 | **3** | 13 |
| Salvador | 4 | 8 | 13 | 3 | 12 |
| Paris | 7 | 6 | 8 | 1 | 16 |
| Rio de Janeiro | 6 | 11 | 16 | 1 | 7 |

**Recomendações antes da onda de testadores:**

1. **Cartagena é a prioridade** — 4 almoços para uma viagem de 9 dias. 30% dos
   slots degradam. Precisa de +8 casas (3 almoços, 2 jantares, 3 cafés).
2. **Fortaleza precisa de +1 restaurante de almoço** para o Cabaña del Primo cair
   de 2× para 1× numa viagem de 9 dias. Hoje são 6 almoços para 7 slots — a
   repetição é aritmética, não lógica.
3. **Café da manhã é o gargalo geral** — 18 das 23 cidades têm 3 ou 4 opções.
   Um lote de cafés é o melhor retorno por item cadastrado.

---

## 6. Sobre "no máximo 1×"

O STEP1 prometia um teste provando que o Cabaña del Primo sai no máximo 1×. Ao
implementar, isso se mostrou **aritmeticamente impossível na config do PDF**:
Fortaleza tem 6 restaurantes de almoço e a viagem de 9 dias serve 7 almoços.
Alguma casa repete, necessariamente.

O que o teste garante, e que é a correção real do bug:

- **nunca em papéis diferentes** — almoço + jantar da mesma casa é impossível agora;
- **no máximo 2×**, nunca 3× como no PDF;
- **nunca em dias consecutivos** — no smoke, 6 dias de intervalo;
- **nenhum nome acima de `ceil(slots/pool)`** — se é preciso repetir, distribui-se
  pelo maior número de casas possível em vez de concentrar numa só.

Chegar a 1× é decisão de **catálogo**, não de lógica: +1 almoço em Fortaleza
resolve. Está na tabela da §5.

---

## 7. Validador

Apenas a R5, como combinado. Passou a comparar por **nome normalizado** (id não
identifica lugar) e a distinguir:

- **experiência repetida → FAIL** (o gerador nunca deve fazê-lo);
- **refeição repetida → WARN**, com o menor intervalo no detalhe.

Nenhuma outra regra tocada. WARN não conta como PASS em `formatReport`, então a
mudança não infla o placar — apenas para de chamar de erro uma degradação
deliberada.

---

## 8. `/smoke` — novo placar-baseline

O `319/320` morreu. Números medidos com a mesma data que a página usa (hoje):

| Cenário | Placar | Detalhe |
|---|---|---|
| Código antigo, 20 cenários originais | **320/320 PASS** | limpo — **e cego para o bug** |
| Código antigo, 21 cenários (com o novo) | 335/336 | `R5 [FAIL]: Cabaña del Primo (days 2, 3, 8)` |
| **Código novo, 21 cenários** | **335/336 PASS** | `R5 [WARN]: pool esgotado — cabana del primo (days 2, 8), menor intervalo 6d` |

**Novo baseline: 335/336, com 1 WARN intencional.**

O WARN é o cenário `Fortaleza 9 dias (regressão no-repeat)` acusando que o pool
de almoços da cidade não cobre a viagem. É informação correta e desejada: quando
Fortaleza ganhar o 7º restaurante de almoço, esse WARN vira PASS sozinho e o
placar fecha em 336/336.

A linha do meio é a prova de que o cenário novo tem poder de detecção: com o
código antigo ele acusa exatamente as três aparições do PDF. Sem ele, o smoke
passava limpo com o bug em produção.

**Zero FAIL novo. Zero regressão nos 20 cenários originais.**

---

## 9. Arquivos

| Arquivo | Mudança |
|---|---|
| `src/lib/placeIdentity.ts` | **novo** — normalização, rastreador e cascata de reuso |
| `src/components/cockpit/GeneratedItineraryStage.tsx` | gerador A + troca manual E |
| `src/lib/createTrip.ts` | gerador B + nomes de tema + Michelin |
| `src/pages/Viagens.tsx` | gerador C + trocas manuais D |
| `src/lib/itineraryValidator.ts` | apenas R5 |
| `src/pages/SmokeTest.tsx` | cenário Fortaleza 9 dias |
| `src/test/placeIdentity.test.ts` | **novo** — 16 testes |
| `src/test/generatorNoRepeat.test.ts` | **novo** — 9 testes |

Não tocados, conforme o escopo: `src/data/**`, tipo `SuggestedActivity`, demais
regras do validador.

---

## 10. Limitação declarada

O gerador **C** (`generateBasicDays`, em `Viagens.tsx`) foi corrigido mas **não
tem teste automatizado**: é uma função interna de um componente React, não
exportada, e extraí-la exigiria refatorar a estrutura do componente — risco
desproporcional ao pedido. Está coberto por `tsc`, lint e inspeção. Os geradores
A e B, que atendem os fluxos reais de produção, têm teste de integração.
