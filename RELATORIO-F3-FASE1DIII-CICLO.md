# RELATÓRIO — F3 / Arco 1 / Fase 1d-iii: ciclo de vida da `/viagens` no funil

**Data:** 2026-08-12
**Base:** `RELATORIO-RECON-TRIPSTORE.md` §2.1, §4.9 · `RELATORIO-F3-FASE1DII-HANDLERS.md` §1
**Commit:** `2136413` — *feat(f3): fase 1d-iii - ciclo de vida da /viagens no funil (draft/activate/delete/reset)*
**Push:** `git push origin main` →

```
(registrado no commit seguinte)
```

**Status:** aplicado, commitado e pushado. Verde em typecheck / testes / build.

---

## 1. O resultado, primeiro

```
$ grep -c "localStorage\." src/pages/Viagens.tsx
0
```

**Zero.** Não zero `setItem` de `kinu_trips` — **zero acesso a `localStorage` de qualquer
espécie** nas 2.865 linhas do arquivo. A `/viagens`, que abriu o Arco 1 como a maior
concentração de escrita crua do app, saiu inteira para trás do funil.

| | Recon (§2.1) | Pós 1d-i | Pós 1d-ii | **Pós 1d-iii** |
|---|---|---|---|---|
| `localStorage.setItem('kinu_trips', …)` | 13 | 13 | 3 | **0** |
| `localStorage.removeItem('kinu_trips')` | 1 | 1 | 1 | **0** |
| Qualquer `localStorage.*` no arquivo | 16 | 4 | 4 | **0** |
| `setTrips(…)` | 16 | 16 | 6 | **2** |

Os 2 `setTrips` que ficam são o mount (`:248`) e o sino (`:258`) da 1d-i — os dois pontos
que **existem para** trazer o storage para o React. Nenhum deles escreve.

Chamadas ao store agora no arquivo: **14 `updateTrip`**, **1 `deleteTrip`**, **1 `clearTrips`**,
**3 `listTrips`**, 1 `subscribeTrips`, 1 `normalizeTrip`.

**1 arquivo, 5 hunks, +33 / −17.** `src/lib/tripStore.ts` **não foi tocado** — como em 1b,
1c, 1d-i e 1d-ii. O diff saiu **idêntico ao proposto no STEP 1**, nos 4 handlers e no import.

---

## 2. A investigação pedida: a natureza real dos handlers de draft

A missão pediu para não presumir. O `handleSaveDraft` podia ser um `updateTrip` puro ou um
upsert precisando de fallback `addTrip` — e a diferença é grande: um fallback errado
**recria uma viagem que o usuário mandou apagar**.

**Veredito: update puro, sem fallback.** Quatro evidências independentes:

**(a) O cockpit não existe sem uma viagem selecionada.** `Viagens.tsx:1461-1469` só o
renderiza sob `selectedTrip && selectedTrip.status === 'draft'`, e passa `trip={selectedTrip}`.
Não há outro chamador dos dois handlers — só as duas props.

**(b) Toda origem de `selectedTrip` é o storage.** As 19 chamadas de `setSelectedTrip` no
arquivo se dividem em quatro grupos, e nenhum injeta viagem inédita: `listTrips()` (mount e
sino), retorno de `updateTrip` (12 pontos), item da lista `trips` — que só é preenchida por
`listTrips()` — e `null` explícito.

**(c) O payload preserva o `id`.** Os três pontos do cockpit que chamam `onSave`/`onActivate`
montam `{ ...trip, … }` (`DraftCockpit.tsx:195`, `:216`, `:301`). Nenhum cria `id` novo.

**(d) O draft já nasce gravado.** Os dois únicos criadores de viagem do app —
`NewPlanningWizard.tsx:153` e `KinuAIContext.tsx:385` — chamam `addTrip(trip)` (fase 1c)
**antes** de mandar o usuário para a `/viagens`.

### O que isso desarmou

O código antigo tratava o caso "a viagem não está mais na lista" da pior forma possível:

```tsx
const updatedTrips = trips.map((t) => (t.id === updatedTrip.id ? updatedTrip : t));
localStorage.setItem('kinu_trips', JSON.stringify(updatedTrips));
```

Se a viagem tivesse sido excluída em outra aba, o `map` não encontrava nada para substituir
— mas o `setItem` gravava o array de memória mesmo assim, **com a viagem excluída de volta
dentro dele**. Era o §4.2 na sua forma mais grave: ressurreição de registro apagado, mais o
descarte de qualquer viagem criada nesse intervalo.

Agora o `updateTrip` loga `viagem "<id>" não existe no storage — nada gravado`, devolve
`null`, e a guarda `if (stored)` impede a tela de exibir um fantasma — enquanto o sino já
terá zerado a seleção. **Não há fallback `addTrip` por decisão, não por omissão.**

---

## 3. `normalizeTrip`: por que a chamada explícita ficou

A missão levantou a hipótese de o `updateTrip` já normalizar e tornar a chamada redundante
— o que apagaria o último uso do import. A leitura do store diz o contrário:

| `tripStore.ts` | o que faz |
|---|---|
| `:319` `updater(normalizeTrip(trips[index]))` | normaliza **a entrada lida do storage** |
| `:320` `trips[index] = updated` | grava o retorno do updater **como veio** |
| `:323` `return updated` | devolve esse mesmo objeto ao chamador |

O comentário da própria função declara a regra: *"o store não reescreve a decisão do
chamador"*. E o updater do `handleActivateDraft` **descarta** o argumento normalizado — o
cockpit já montou a viagem inteira. Sem a chamada explícita, o que iria para o disco **e
para a `selectedTrip`** seriam os dias crus recém-saídos do `generateBasicDays`: sem `icon`,
sem `category`, sem ids de atividade, e sem o `syncTripFlightPlannedFinances` que acerta
`finances.planned` com o voo que o usuário **acabou de escolher** — exatamente o momento em
que essa sincronia importa.

**A ordem importa e foi preservada:** normalizar **depois** do fallback de dias.

Sobre a ordem dos dois `setSelectedTrip` em jogo: o `writeAll` dentro do `updateTrip`
dispara o sino **sincronamente**, e o sino faz `setSelectedTrip(fresh.find(…))` com a viagem
normalizada da leitura; o `if (stored) setSelectedTrip(stored)` roda depois, no mesmo lote do
React, e vence — com o objeto normalizado por esta chamada. Os dois caminhos convergem para
o mesmo conteúdo; a chamada explícita é o que garante que o perdedor não importe.

**O import de `normalizeTrip` permanece**, e este é seu único uso no arquivo.

---

## 4. As duas estreias em produção (recon §4.9)

O `deleteTrip` e o `clearTrips` existiam desde a fase 1a sem um único chamador. Esta fase
os ligou — e com eles, a limpeza do histórico de preços, que **nunca aconteceu na vida do
app**.

### `handleDeleteTrip` → `deleteTrip(tripId)`

`kinu_price_history_<id>` só tem um escritor (`TripPanel.tsx:167`) e, até hoje, **nenhum
apagador**. Cada viagem excluída deixava até 10 snapshots de preço no `localStorage` para
sempre, presos a um id que não existe mais. `deleteTrip` (`tripStore.ts:327-338`) remove a
chave junto — e a remove **mesmo quando a viagem já não estava na lista**, porque o
`removeItem` está fora do `else`. Exclusão de viagem no KINU passou a ser exclusão de fato.

### `handleResetJourney` → `clearTrips()`

O reset agora varre **todos** os `kinu_price_history_*` do storage — inclusive os órfãos
acumulados por todas as exclusões anteriores ao commit de hoje. É o único ponto do app capaz
de recolher esse lixo. A varredura coleta as chaves antes de remover
(`tripStore.ts:346-351`): `removeItem` reindexa o `localStorage` e apagar dentro do laço
pularia chaves.

### O que **não** mudou

Comportamento de tela preservado ao pé da letra: o `window.confirm` antes da exclusão, o
`e.stopPropagation()`, os dois toasts, o `setResetModal(false)` e o `navigate('/planejar')`
— todos fora de qualquer updater, na mesma ordem.

A promoção da primeira viagem restante depois de excluir a selecionada também ficou, com um
ganho: a lista vem de `listTrips()` (storage recém-gravado) em vez de `trips.filter(…)`
(estado React), então uma viagem criada em outra aba no intervalo entra na conta em vez de
sumir. O `setSelectedTrip(null)` do reset ficou também: é redundante com o sino, mas é a
declaração explícita da intenção do handler e custa um set no-op no mesmo lote do React.

---

## 5. Verificação

```
$ npx tsc --noEmit
(sem saída — exit 0)

$ npx vitest run
 ✓ src/test/flight-fallback.test.tsx (5 tests) 204ms
 ✓ src/test/tripStore.test.ts (28 tests) 30ms
 ✓ src/test/example.test.ts (1 test) 3ms
 Test Files  3 passed (3)
      Tests  34 passed (34)

$ npx vite build
✓ built in 22.48s
```

O aviso de chunk > 500 kB é o de sempre, anterior a esta fase e a todo o Arco 1.

---

## 6. Onde o Arco 1 está agora

Escritas cruas de `kinu_trips` restantes em todo o `src/` (fora do próprio store e dos
testes):

```
src/components/cockpit/GeneratedItineraryStage.tsx:1086   localStorage.getItem('kinu_trips')
src/components/cockpit/GeneratedItineraryStage.tsx:1129   localStorage.setItem('kinu_trips', …)
```

**Duas linhas, um arquivo** — escopo declarado da fase 1e, junto com o `DraftCockpit`.
Depois delas, o funil está fechado: nenhum ponto do app toca `kinu_trips` sem passar pelo
`tripStore`.

---

## 7. Fora de escopo, observado no caminho

**O deep-link `?trip=` nunca foi implementado na `/viagens`.** `Viagens.tsx:163` faz
`const location = useLocation();` e a variável **não é usada em nenhum outro ponto do
arquivo** (`grep -n "location" src/pages/Viagens.tsx` devolve só a linha 163). Enquanto
isso, `NewPlanningWizard.tsx:161` navega para `` `/viagens?trip=${trip.id}` `` — o wizard
manda a viagem recém-criada por query param e a tela ignora, deixando o usuário na lista
para clicar na viagem que acabou de criar.

O recon já apontava isso em §4.11, e o `getTrip(id)` do store existe exatamente para
atender esse caso — seriam ~4 linhas de `useEffect`. Não entrou aqui porque é **produto**
(muda navegação), não migração de storage. Candidato a fase própria.
