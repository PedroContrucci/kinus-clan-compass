# RELATÓRIO — F3 / Arco 1 / Fase 1e: `GeneratedItineraryStage` no funil

**Data:** 2026-08-13
**Base:** `RELATORIO-RECON-TRIPSTORE.md` §2.2, §4.1, §4.4, §8.1 ·
`RELATORIO-F3-FASE1DIII-CICLO.md` §6 e adendo
**Commit:** `<preenchido no adendo>`
**Push:** `<preenchido no adendo>`

**Status:** aplicado, commitado e pushado. Verde em typecheck / testes / build.

---

## 1. O resultado, primeiro — **o Arco 1 fechou**

```
$ grep -rn "kinu_trips" src/
src/pages/Viagens.tsx:486:    // Reset pelo funil: apaga `kinu_trips` E varre TODOS os `kinu_price_history_*`,
src/lib/tripStore.ts:26:export const TRIPS_KEY = 'kinu_trips';
src/lib/tripStore.ts:183: * Notifica quando `kinu_trips` muda — por escrita desta aba (via `emit`) ou de outra
src/pages/Dashboard.tsx:45:  // O sino: recarrega quando `kinu_trips` muda nesta aba ou em outra.
```

Quatro ocorrências. **Três são comentários**; a única linha de código é a constante
`TRIPS_KEY` dentro do próprio funil. A saída bateu exatamente com a prevista no STEP 1.

```
$ grep -rn "localStorage\.\(get\|set\|remove\)Item(.kinu_trips" src/
(nenhum)
```

```
$ grep -c "localStorage\." src/components/cockpit/GeneratedItineraryStage.tsx
0
$ grep -c "localStorage\." src/components/cockpit/DraftCockpit.tsx
0
```

**Nenhum ponto do app lê ou escreve `kinu_trips` fora do `tripStore`.**

| Escritas cruas de `kinu_trips` | Recon | Pós 1d-iii | **Pós 1e** |
|---|---|---|---|
| `src/pages/Viagens.tsx` | 14 | 0 | **0** |
| `src/components/cockpit/GeneratedItineraryStage.tsx` | 1 (+1 leitura) | 1 (+1 leitura) | **0** |
| Total no `src/` fora do store | 15+ | 2 | **0** |

**2 arquivos, 5 hunks, +50 / −44.** `src/lib/tripStore.ts` **não foi tocado** — como em 1b,
1c, 1d-i, 1d-ii e 1d-iii. `Viagens.tsx` **não foi tocada** (a Parte 1 do STEP 1 provou que
não precisava ser). O diff saiu **idêntico ao proposto**.

---

## 2. O que mudou de fato

### 2.1 A prop do `id` — a trava §8.1 caiu sem tocar na `/viagens`

`DraftCockpit.tsx` já recebia a viagem inteira, com `id: string` **obrigatório** na
interface local (`:11-13`), vinda de `Viagens.tsx:1478-1483`. O único ponto de montagem do
Stage é `DraftCockpit.tsx:367` — `SmokeTest.tsx:3` importa a **função** `generateItinerary`,
não o componente. Uma prop obrigatória nova, portanto, não quebrou nenhum outro chamador, e
o `tsc` confirmou.

`tripId: string` entrou **obrigatório**, por decisão: um opcional exigiria um caminho de
fallback para "sem id" — que é exatamente o `return` silencioso do §4.4 que esta fase
existe para matar.

### 2.2 A escrita de finanças migrou para `updateTrip`

Saiu (`:1086-1129` do arquivo antigo): `getItem` cru → `JSON.parse` → `findIndex` por
`destination` + `startDate` + `endDate` → mutação do objeto → `setItem` do **array inteiro**.

Entrou: `updateTrip(tripId, (trip) => ({ ...trip, finances: {…} }))`.

Quatro consequências, todas declaradas antes de aplicar:

1. **O `return` silencioso do §4.4 morreu.** `idx === -1` era um `return` mudo; agora
   `updateTrip` loga `[tripStore] updateTrip: viagem "<id>" não existe no storage — nada
   gravado` (`tripStore.ts:315`).
2. **A busca por conteúdo morreu junto** — e com ela o bug de dois rascunhos no mesmo
   destino e nas mesmas datas patchearem sempre o primeiro (§4.4).
3. **O §4.1 fechou.** O array inteiro nunca mais é regravado a partir de memória: só o slot
   deste `id` é tocado, o resto vem do storage no instante da escrita.
4. **A gravação passa a persistir `days` normalizados** (efeito de `normalizeTrip` dentro do
   `updateTrip`) — mesmo padrão já aceito na 1d-iii; a função é idempotente e toda leitura
   do app já normaliza.

O `try/catch` **permaneceu**, por decisão consciente: o `JSON.parse` de storage torto agora
é tratado dentro do store, mas o `setItem` ainda pode lançar `QuotaExceededError`, e o store
declara explicitamente que **não** captura erro de escrita (`tripStore.ts:16-19`). Removê-lo
converteria uma degradação silenciosa numa exceção dentro de `useEffect`.

### 2.3 Equivalência financeira: verificada campo a campo

O `updateTrip` entrega ao updater a viagem **normalizada**; o código antigo lia a viagem
**crua**. `normalizeTrip` roda `syncTripFlightPlannedFinances`, que muta exatamente três
campos (`flightFinance.ts:27-37`) — e nenhum deles é lido pelo nosso updater:

| Campo mutado pelo sync | Consumido pelo updater? |
|---|---|
| `finances.categories.flights.planned` | Não — sobrescrito por `flightsPlanned` |
| `finances.planned` | Não — sobrescrito por `totalPlanned` |
| `finances.available` | Não — sobrescrito pelo cálculo |

Os campos que o updater **lê** de `prevFinances` — `total`, `confirmed`, `bidding` e os
`confirmed`/`bidding` de cada categoria — não são tocados pelo sync. `trip.budget` idem.

→ **Zero mudança de resultado financeiro.**

---

## 3. A análise de loop — havia ciclo, e ele foi fechado pela própria migração

A missão pediu para não presumir. A cadeia existia, elo a elo:

| # | Elo | Evidência |
|---|---|---|
| 1 | `updateTrip` → `writeAll` → `emit()` **síncrono** | `tripStore.ts:233-236`, `:321` |
| 2 | Sino da `/viagens`: `setTrips(fresh)` + `setSelectedTrip(fresh.find(…))` | `Viagens.tsx:255-266` |
| 3 | `listTrips()` → `normalizeTrip` devolve objeto novo → `Object.is` falha → re-render garantido | `tripStore.ts:257`, `:146-155` |
| 4 | `<DraftCockpit trip={selectedTrip}>` re-renderiza (sem `key`, logo **sem remount**) | `Viagens.tsx:1479` |
| 5 | `departureDate={new Date(trip.startDate)}` — **`Date` novo a cada render** | `DraftCockpit.tsx:371-372` |
| 6 | `useMemo([…, departureDate, returnDate])` recompõe → identidade nova | `:1134` (antigo) |
| 7 | `useEffect([days, recompute…])` vê dep mudada → dispara → volta ao passo 1 | `:1137-1139` |

Sem guarda, isso é `Maximum update depth exceeded`. O ciclo não existia antes **só porque o
`setItem` cru não notificava ninguém** — a escrita era invisível ao React. Trocá-lo por
`updateTrip` ligaria o passo 1 e fecharia o laço.

**A guarda foi a própria migração.** Com o `id` em mãos, `destination`, `departureDate` e
`returnDate` deixaram de ser necessários — existiam **apenas** para a busca por conteúdo do
§4.4. As deps passaram a `[breakdown, tripId]`:

- **`breakdown`** — `const [breakdown] = useState(initialBreakdown)` (`:1043`), declarado
  **sem setter**: identidade imutável por toda a vida do componente.
- **`tripId`** — string primitiva, mesmo valor a cada render.

→ **O passo 6 deixou de acontecer.** O ciclo é impossível por construção, não por
heurística. **Nenhuma guarda extra foi adicionada** — sem flag `isWriting`, sem `useRef` de
comparação, sem debounce: seriam remendos sobre um ciclo que simplesmente deixou de existir.

**Bônus:** o passo 5 já fazia o effect **redisparar a cada render** do cockpit — a escrita
crua rodava redundantemente muitas vezes por sessão, invisível porque não emitia. A migração
eliminou também esse desperdício.

---

## 4. Verificação

```
$ npx tsc --noEmit
(sem saída — limpo)

$ npx vitest run
 ✓ src/test/flight-fallback.test.tsx (5 tests) 561ms
 ✓ src/test/tripStore.test.ts (28 tests) 19ms
 ✓ src/test/example.test.ts (1 test) 4ms

 Test Files  3 passed (3)
      Tests  34 passed (34)
   Duration  9.16s

$ npx vite build
✓ built in 21.25s
```

O aviso de chunk > 500 kB é o de sempre, anterior a esta fase e a todo o Arco 1.

---

## 5. PARTE 3 — o limbo do draft: **diagnóstico entregue, correção pendente de decisão de
produto**

Confirmado com o fundador: **fora do diff desta fase.** Fica registrado aqui.

### 5.1 O sintoma

Reportado no adendo da 1d-iii: apagar uma atividade dentro do cockpit de rascunho não
persiste. Console sem nenhum aviso `[tripStore]`.

### 5.2 Quais edições vivem só em estado local

Todas escrevem **apenas** em `days` (`useState`, `:1042`). Nenhuma chama `onSave`:

| Edição | Handler | Botão na UI |
|---|---|---|
| Remover atividade | `handleRemoveActivity` `:1197-1204` | `Trash2` `:1543` |
| Trocar atividade | `handleSwapActivity` `:1206-1263` | `RefreshCw` `:1537` |
| Adicionar personalizada | `onClick` inline `:1698-1714` | modal "Criar personalizada" |

**"Editar horário" não existe.** O ícone `Pencil` é importado na linha 9 e **nunca
renderizado**. Não há caminho de edição de horário, nome ou custo neste Stage. Os outros dois
botões do modal ("Buscar no Clã", "Sugestões KINU", `:1650-1696`) só emitem toast.

### 5.3 O caminho de persistência existe e está inteiro

```
botão "Salvar" (:1287)
  → handleSaveWithDays (:1185)        toTripDays(days) + computeBuckets(days)
  → onSave(tripDays, buckets)
  → DraftCockpit.handleSave (:211)    monta { ...trip, days: nextDays }
  → onSave(updatedTrip)
  → Viagens.handleSaveDraft (:1059)   updateTrip(…)  ← já migrado na 1d-ii
```

**Não falta botão.** Clicar "Salvar" depois de apagar a atividade já grava a remoção hoje,
sem nenhuma mudança de código.

### 5.4 O diagnóstico: são **dois** defeitos empilhados, e o de baixo é o que manda

**Defeito 1 (UX, menor).** As edições não têm autosave nem indicação de alterações não
salvas. Quem apaga e dá F5 sem clicar "Salvar" perde — comportamento normal de formulário,
mas sem aviso.

**Defeito 2 — o que realmente explica o sintoma: mesmo salvando, o F5 desfaz.**

```tsx
// GeneratedItineraryStage.tsx:1034-1042
  // SINGLE SOURCE OF TRUTH: the internal generator ALWAYS runs so trip-wide
  // no-repetition, Michelin cap and sunset rules apply. existingDays is ignored
  // as an itinerary source (kept in the prop only for backwards compatibility).
  void existingDays;                                  // ← os dias salvos são DESCARTADOS
  const { days: initialDays, … } = useMemo(() => generateItinerary(…), […]);
  const [days, setDays] = useState(initialDays);      // ← estado nasce SEMPRE do gerador
```

O Stage **ignora por decisão explícita** os dias persistidos e regenera o roteiro do zero a
cada montagem. E `generateItinerary` é **determinístico**: a única ocorrência de `Math.random`
no arquivo inteiro está na linha 137, dentro de `convertTripDaysToItinerary` — o conversor de
`existingDays`, hoje código morto pelo `void`. Reabrir o rascunho reconstrói **o mesmo
roteiro**, com a atividade apagada de volta no lugar.

→ **Chamar `onSave` no ponto de edição — o "fix mínimo" — NÃO corrigiria o sintoma.** A
remoção chegaria ao storage e o F5 continuaria exibindo o roteiro regenerado. Pior: o próximo
"Salvar"/"Ativar" regravaria por cima com os dias regenerados, apagando a edição já
persistida. **O autosave sozinho troca um limbo por outro.**

### 5.5 As 4 opções — decisão de produto pendente

| # | Opção | O que faz | Custo |
|---|---|---|---|
| 1 | **Rehidratar** | Usar `existingDays` como estado inicial quando completos. O conversor `convertTripDaysToItinerary` (`:95`) já existe pronto e voltaria a viver. | Roteiros salvos perdem as garantias trip-wide do gerador |
| 2 | **Rehidratar + autosave** ⭐ *pragmática* | Opção 1 + chamar `onSave` nas 3 edições. Persistência real ponta a ponta, F5 preserva. | Idem, mais escrita a cada edição |
| 3 | **Só UX** | Manter o gerador; marcar estado "não salvo" no botão e avisar ao sair. | Não persiste edição nenhuma — só para de enganar o usuário |
| 4 | **Diff sobre o gerador** ⭐ *ideal* | Persistir as edições como operações (removidos/trocados) e reaplicá-las sobre o roteiro regenerado. | Preserva garantias **e** edições; bem mais caro |

**Recomendação anotada:** **2** se a prioridade é o usuário confiar no que vê (pragmática);
**4** se as garantias do gerador — não-repetição trip-wide, teto Michelin, regra de pôr do
sol — forem inegociáveis (ideal).

Não entrou no diff porque a correção real exige honrar `existingDays` na montagem, o que
contradiz uma decisão de produto **declarada em comentário no código**. Isso é produto, não
migração de storage. **Aguardando decisão do fundador.**

---

## 6. Onde o Arco 1 está agora

**Fechado.** Todo acesso a `kinu_trips` no `src/` passa pelo `tripStore`:

| Fase | Escopo | Status |
|---|---|---|
| 1a | `tripStore.ts` — o funil | ✅ |
| 1b | Leitores | ✅ |
| 1c | Criadores | ✅ |
| 1d-i / ii / iii | `/viagens` — infra, handlers, ciclo de vida | ✅ |
| **1e** | **`GeneratedItineraryStage` — o último escritor cru** | ✅ |

---

## 7. Fora de escopo, observado no caminho

**Mutação de estado no add-activity** (`GeneratedItineraryStage.tsx:1709-1710`):

```tsx
const updatedDays = [...days];                              // cópia RASA
updatedDays[selectedDay - 1].activities.push(newActivity);  // muta o objeto do estado atual
```

O spread copia o array, mas o objeto do dia é o mesmo — o `push` muta o estado anterior no
lugar. Funciona hoje porque o array novo já dispara o re-render. **Pré-existente, não é
regressão desta fase**, e os outros dois handlers (`:1198`, `:1254`) fazem certo com `map`.
Candidato a limpeza junto com a decisão da Parte 3, já que mexe nos mesmos handlers.

**Pendências herdadas ainda abertas** (registradas em fases anteriores, sem ação aqui):
o deep-link `?trip=` nunca implementado na `/viagens` (1d-iii §7) e a decisão de produto da
Parte 3 acima.
