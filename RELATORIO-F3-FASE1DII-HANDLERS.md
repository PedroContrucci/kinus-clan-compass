# RELATÓRIO — F3 / Arco 1 / Fase 1d-ii: handlers de edição da `/viagens` → `updateTrip`

**Data:** 2026-08-11
**Base:** `RELATORIO-RECON-TRIPSTORE.md` §2.1, §4.8 · `RELATORIO-F3-FASE1DI-VIAGENS-INFRA.md`
**Commit:** `3e433f1` — *feat(f3): fase 1d-ii - handlers de edicao da /viagens migrados para updateTrip*
**Push:** `git push origin main` →

```
To https://github.com/PedroContrucci/kinus-clan-compass
   40f9887..3e433f1  main -> main
```

**Status:** aplicado, commitado e pushado. Verde em typecheck / testes / build.

---

## 1. O que entrou

**1 arquivo, 9 hunks no `git diff`, +241 / −214.** `src/lib/tripStore.ts` **não foi
tocado** — a 1d-ii só o consome, como a 1b, a 1c e a 1d-i.

| | Antes | Depois |
|---|---|---|
| `localStorage.setItem('kinu_trips', …)` | 13 | **3** |
| `setTrips(…)` | 16 | **6** |
| Chamadas a `updateTrip(…)` | 2 (da 1d-i) | **12** |

Os 3 `setItem` que sobram — mais o `removeItem` — são **exatamente** o escopo da 1d-iii:
`handleResetJourney` (`:486`, `removeItem`), `handleDeleteTrip` (`:503`),
`handleSaveDraft` (`:1054`), `handleActivateDraft` (`:1073`).
Os 6 `setTrips` que sobram: 4 deles são desses mesmos handlers; os outros 2 são o mount
(`:248`) e o sino (`:258`) da 1d-i — legítimos.

O diff saiu **idêntico ao proposto no STEP 1**, nos 10 handlers. Nenhum ajuste de última
hora, nenhuma surpresa de tipo.

---

## 2. O padrão que morreu

Repetido **10 vezes**, palavra por palavra:

```diff
-    setSelectedTrip(updatedTrip);
-    const updatedTrips = trips.map((t) => (t.id === updatedTrip.id ? updatedTrip : t));
-    setTrips(updatedTrips);
-    localStorage.setItem('kinu_trips', JSON.stringify(updatedTrips));
+    /* dentro do updater */
+      return updatedTrip;
+    });
+    if (stored) setSelectedTrip(stored);
```

Ele carregava três defeitos por ocorrência, e os três morreram juntos:

### 2.1 O `trips.map` — a perda silenciosa (§4.1, §4.2)

Era o cenário do recon na sua forma mais crua: **reconstruir o array inteiro a partir do
estado React**. Uma viagem criada pelo chat (`KinuAIContext`, provider global) ou uma
finança recalculada pelo `GeneratedItineraryStage` (que escreve direto no storage, fora do
React do `Viagens`) desaparecia no clique seguinte em qualquer um destes 10 handlers.

Com `updateTrip`, **só o slot daquele `id` é regravado**. As outras viagens do array vêm
do disco e voltam para o disco sem nunca passar pela memória do componente.

### 2.2 O spread raso — mutação do estado React

`const updatedTrip = { ...selectedTrip }` copia um nível. Os handlers então mutavam
`finances`, `days[i].activities[j]`, `flights.outbound`, `accommodation` — **objetos
compartilhados com `selectedTrip` e com `trips`**. Ou seja: o estado React era mutado
no lugar, e só depois o setter era chamado.

Dentro do updater isso deixou de ser um problema **por construção**, sem reescrever uma
linha da lógica de finanças:

> `updateTrip` → `readRaw()` → `loadJson` → `JSON.parse(localStorage.getItem(…))`.
> **Cada chamada faz um parse novo.** `normalizeTrip` faz spread raso por cima desse
> parse, então todos os sub-objetos (`finances`, `days`, `flights`) são exclusivos daquela
> chamada. Não há aliasing com o React.

Foi essa propriedade que permitiu manter o estilo mutativo dos handlers — o que manteve os
diffs pequenos (`{ ...selectedTrip }` → `{ ...trip }`, mais a moldura e a indentação) em
handlers de 60 linhas como o `handleHeroConfirm`. Reescrever a lógica de finanças de 4
handlers para estilo imutável seria risco alto com ganho zero nesta fase.

### 2.3 A base de cálculo obsoleta

O mais silencioso dos três. Vários handlers **leem um valor da viagem e o usam como base
de uma subtração**:

| Handler | Valor lido | Papel |
|---|---|---|
| `handleHeroConfirm` | `getFlightPlannedTotal(trip)`, `categories.flights.confirmed` | base do estorno antes de gravar o novo valor |
| `handleHeroUnconfirm` | `categories.flights.confirmed` / `categories.accommodation.confirmed` | valor a devolver para `planned` |
| `handleStartBidding` | `act.cost` | valor movido de `planned` para `bidding` |
| `handleToggleChecklist` | `item.checked` | o valor que vai ser **invertido** |
| todos com finanças | `finances.confirmed` etc. | acumuladores (`+=`) |

Lidos da closure, todos podiam estar defasados. Agora saem do disco no instante da
escrita. O caso do checklist é o mais fácil de ver: dois cliques originados de renders
diferentes **não podem mais se anular**.

---

## 3. Regra (a) — onde a derivação ficou

Os 10 handlers, e o que exatamente migrou para dentro do updater:

| # | Handler | Derivação dentro do updater |
|---|---|---|
| 1 | `handleConfirmActivity` | ✅ finanças, categoria, `progress`, **promoção draft→active** |
| 2 | `handleStartBidding` | ✅ inclusive `act.cost` |
| 3 | `handleAddManualExpense` | ✅ |
| 4 | `handleToggleChecklist` | ✅ o `checked` invertido é o do disco |
| 5 | `handleUpdateBudget` | ⚠️ `newBudget` ficou fora |
| 6 | `handlePackingUpdate` | ✅ |
| 7 | `handleSwapActivity` | ⚠️ a seleção da candidata ficou fora |
| 8 | `handleHeroConfirm` | ✅ inclusive `previousFlightPlanned` / `previousFlightConfirmed` |
| 9 | `handleHeroUnconfirm` | ✅ inclusive `previousConfirmed` (nos dois ramos) |
| 10 | `pick()` inline | ⚠️ as candidatas exibidas ficaram fora |

### 3.1 As três exceções são a mesma exceção

Nenhum handler ficou bloqueado por dependência externa de prop ou estado. As três
derivações que não migraram têm **todas o mesmo motivo estrutural**:

> **Um updater não pode abortar a escrita.** Ele é obrigado a devolver uma viagem, e
> devolver a viagem intocada **grava mesmo assim** e acorda o sino à toa. Toda guarda com
> early-return — ainda mais quando ela dispara um `toast` — tem que rodar **antes** do
> `updateTrip`.

- **`handleUpdateBudget`** — `const newBudget = parseFloat(budgetEditValue) ||
  selectedTrip.budget` alimenta `if (newBudget <= 0) return`. A parte trip-derivada é só o
  fallback para campo vazio. O que importa — o recálculo de `available` sobre
  `planned`/`bidding`/`confirmed` — migrou e roda sobre o disco.
- **`handleSwapActivity`** — a seleção da candidata tem **dois** early-returns com toast
  (`'Sem outra opção curada para este horário'`). A **construção** da viagem migrou: o
  `days.map` roda sobre `trip.days`, e o fallback `a.description` vem do disco.
- **`pick()` inline** — as candidatas listadas são as que **já estão renderizadas na
  tela**. Recalculá-las do disco no instante do clique faria o usuário clicar numa opção e
  receber outra. Aqui a decisão foi deliberadamente pelo comportamento visível.

### 3.2 Um caso que mereceu cuidado

`handleConfirmActivity` usa a atividade **depois** da escrita, para
`setRecentlyConfirmed(activity.id)` e para o título do toast. Com a lógica dentro do
updater, essa variável saiu de escopo. Solução: `const activity = confirmModal.activity;`
— `id` e `name` não são tocados pela edição, então o valor é idêntico ao de antes, sem
precisar reextrair a atividade da viagem gravada nem lidar com `stored` possivelmente
`null`.

Em `handleStartBidding`, o mesmo problema teve outra resposta: `const dayDate = (stored ??
selectedTrip).days[dayIndex]?.date` — prefere o disco, mas preserva o comportamento atual
se `updateTrip` devolver `null`.

---

## 4. Regras (b), (d), (e) — conferência

- **(b) `setTrips` saiu dos 10; `setSelectedTrip(stored)` com guarda `if (stored)`.**
  Confere. O sino da 1d-i cobre a lista: `updateTrip` → `writeAll` → `emit()` **síncrono**
  → o listener roda `setTrips(listTrips())` antes de o handler continuar. Não existe
  janela em que a lista fique obsoleta.
- **(d) Promoção `draft`→`active` em `handleConfirmActivity`.** Preservada exatamente como
  estava, na mesma posição relativa (depois do `progress`, antes do retorno), dentro do
  updater. Ganho de brinde: passa a testar o `status` do disco.
- **(e) Toasts e navegação.** Intocados, todos fora do updater. `navigator.vibrate`,
  `setRecentlyConfirmed`, `setOffersModal`, `setSwapModal(null)`, `setBudgetEditOpen`,
  `setManualExpenseModal`, `setConfirmModal(null)` — nenhum foi movido.

---

## 5. Gate de qualidade

| Passo | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ limpo, exit 0 |
| `npx vitest run` | ✅ **34 testes, 3 arquivos, 0 falhas** (`tripStore.test.ts` 28, `flight-fallback.test.tsx` 5, `example.test.ts` 1) |
| `npx vite build` | ✅ `built in 20.78s` |

O único aviso do build é o de tamanho de chunk (`> 500 kB`), pré-existente e sem relação
com esta fase.

Sobre tipos: as duas anotações `const updatedTrip: SavedTrip` viraram `: StoredTrip` (o
tipo que `updateTrip` exige de volta). Como `StoredTrip = SavedTrip & { [key: string]:
any }`, nada se perde. `handlePackingUpdate` ficou especialmente limpo: `packing` é campo
fora do tipo (§4.6) e atravessa o funil pela index signature, **sem `as any`**.

---

## 6. Pendências

### 6.1 §4.8 — a divergência do `cost` no swap (decisão de produto) 🟡

Confirmado em conversa: os dois caminhos foram migrados **separadamente**, e a unificação
fica pendente.

| | `handleSwapActivity` (`:551-601`) | `pick()` inline (`:2611-2637`) |
|---|---|---|
| Escolhe a candidata | **aleatória** (`Math.random()`) | **o usuário clica** |
| Escreve `id`, `name`, `description`, `status` | ✅ | ✅ |
| Escreve **`cost`** | ❌ **não** | ✅ **sim** (`picked.estimatedCostBRL`) |
| `inferPoolCategory` | 19 linhas | **as mesmas 19 linhas**, verbatim |

**A diferença não é reconciliável sem mudar comportamento visível:**

- Fazer o swap aleatório escrever `cost` mexe no FinOps — `finances.planned` é derivado
  dos custos das atividades, então a troca aleatória passaria a alterar o orçamento
  planejado. Hoje não altera.
- Fazer o `pick()` parar de escrever `cost` ignora o preço que o **próprio card do modal
  anuncia** ao usuário ("~R$ 180").

Qual das duas é a correta é **decisão de produto**, não de refatoração. Um helper
compartilhado com uma flag `{ updateCost: boolean }` removeria a duplicação de código mas
**congelaria a inconsistência atrás de um parâmetro** — pior para quem for decidir depois,
porque a divergência deixaria de estar à vista.

**Fica registrado:** a troca de atividade tem dois comportamentos diferentes para o mesmo
gesto do usuário. Ambos passaram pelo funil na 1d-ii; a divergência permanece, aguardando
decisão.

### 6.2 `inferPoolCategory` duplicado 🟢

19 linhas idênticas, sem dependência de estado, em `Viagens.tsx:521-539` e `:2576-2594`.
Poderia ser um `const` de módulo. É dedup trivial e sem risco, mas **fora do escopo
declarado desta fase** (migrar handlers para `updateTrip`). Naturalmente resolvido junto
com §6.1, se a unificação acontecer.

### 6.3 `checklist` sem guarda de `undefined` 🟢

`handleToggleChecklist` faz `updatedTrip.checklist.find(...)` sem checar. `normalizeTrip`
não cria `checklist`. É **fiel ao código anterior** — quebrava antes e quebra agora — com
uma melhora: a exceção agora acontece **dentro do updater**, ou seja, depois do `readRaw`
e **antes** do `writeAll`. Nada é gravado pela metade. Endurecer isso é assunto da fase de
normalização.

---

## 7. Onde o Arco 1 está

| Fase | Escopo | Status |
|---|---|---|
| 1a | `src/lib/tripStore.ts` — a fundação | ✅ |
| 1b | leitores puros (`Cla`, `Dashboard`, `Conta`, `FeedbackButton`) | ✅ |
| 1c | criadores (`NewPlanningWizard`, `KinuAIContext`) → `addTrip` | ✅ |
| 1d-i | `/viagens`: mount + sino + escrita genérica | ✅ |
| **1d-ii** | **`/viagens`: 10 handlers de edição de 1 viagem** | ✅ **esta fase** |
| 1d-iii | `/viagens`: `handleSaveDraft`, `handleActivateDraft`, `handleDeleteTrip`, `handleResetJourney` | ⬜ |
| 1e | `GeneratedItineraryStage`, `DraftCockpit` | ⬜ |

Depois da 1d-ii, **o `Viagens.tsx` tem 3 `setItem` e 1 `removeItem` sobrando** — e todos
os 4 estão nomeados na 1d-iii. O escritor concorrente que ainda não passa pelo funil (e
que é a origem do risco §4.1) continua sendo o `GeneratedItineraryStage`, escopo da 1e.

---

## 8. Fora do escopo — não tocado

`handleSaveDraft`, `handleActivateDraft`, `handleDeleteTrip`, `handleResetJourney`
(1d-iii) · `handleUpdateTrip`, `persistTrip` (já migrados na 1d-i) ·
`GeneratedItineraryStage`, `DraftCockpit` (1e) · `src/lib/tripStore.ts` · `src/data/` ·
`src/lib/hotelZones.ts` · `src/lib/michelinData.ts` · `src/types/trip.ts`.

**Imports:** nenhum novo. `updateTrip` e `StoredTrip` já tinham chegado na 1d-i
(`src/pages/Viagens.tsx:37`).

## Adendo pós-entrega (11/ago, noite 2)
- Prova de runtime 1d-ii: FinOps confirmacao OK (planejado -600 / confirmado +600 / disponivel estavel); checklist persiste; orcamento recalcula (34k->38k, disponivel +4k); swap via modal persiste; hero confirm/unconfirm OK. Swap aleatorio sem botao proprio na UI do card (acionado por outro caminho) — nao testado em runtime, coberto por codigo identico ao modal.
- Backlog A (UX): confirmacao de atividades hoje vive no Roteiro; avaliar painel proprio de confirmacoes e fluxo por categoria (restaurante confirma 'na hora', ingresso confirma antecipado).
- Backlog B (produto): aba Preparacao esta generica por destino — checklist/packing deveria customizar por destino (clima, tomada, visto, moeda). Investigar por que Smart Packing nao diferencia.
