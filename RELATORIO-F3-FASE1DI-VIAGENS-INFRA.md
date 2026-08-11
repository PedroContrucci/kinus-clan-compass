# RELATÓRIO — F3 / Arco 1 / Fase 1d-i: `/viagens` no funil (mount + sino + escrita genérica)

**Data:** 2026-08-11
**Base:** `RELATORIO-RECON-TRIPSTORE.md` §2.1, §4.1, §4.2, §4.3, §4.5, §4.10 · adendo da 1c
**Commit:** `c90fd4a` — *feat(f3): fase 1d-i - /viagens no funil: mount via listTrips + sino + escrita generica*
**Push:** `42429a4..c90fd4a  main -> main`
**Status:** aplicado, commitado e pushado. Verde em typecheck / testes / build.

---

## 1. O que entrou

**1 arquivo, 3 hunks no `git diff`, +33 / −18.** `src/lib/tripStore.ts` **não foi tocado** — a
1d-i só o consome, como a 1b e a 1c.

| Frente | Antes | Depois |
|---|---|---|
| MOUNT | `loadJson` + `map(normalizeTrip)` + `setItem` | `setTrips(listTrips())` |
| SINO | não existia | `useEffect` com `subscribeTrips`, deps `[]` |
| `handleUpdateTrip` | `updater({...selectedTrip})` + regrava o array | `updateTrip(id, updater)` |
| `persistTrip` | `trips.map(...)` + regrava o array | `updateTrip(id, () => trip)` |

O diff saiu **idêntico ao proposto no STEP 1** — nenhuma surpresa na aplicação, nenhum ajuste
de última hora.

### 1.1 A escrita-no-read morreu

```diff
-    const rawTrips = loadJson<any[]>('kinu_trips', []);
-    const normalizedTrips = rawTrips.map((trip: any) => normalizeTrip(trip));
-    setTrips(normalizedTrips);
-    localStorage.setItem('kinu_trips', JSON.stringify(normalizedTrips));
+    setTrips(listTrips());
```

Quatro linhas viram uma, e com elas somem **três** defeitos de uma vez:

- **§4.5 — escrita-no-read.** A `/viagens` não grava mais no storage durante o mount. A forma dos
  dados no disco deixa de depender de a página ter sido aberta alguma vez.
- **§4.3 — mount quebrando com storage torto.** `listTrips()` garante array; `{}` ou `null` viram
  `[]` com aviso em vez de `TypeError` fora de `try/catch`.
- **§4.5 — normalização assimétrica.** Normalizar passou a ser responsabilidade da **leitura**, e
  toda leitura do funil já normaliza (1b).

### 1.2 O sino

```ts
  useEffect(() => {
    return subscribeTrips(() => {
      const fresh = listTrips();
      setTrips(fresh);
      setSelectedTrip((current) => {
        if (!current) return current;
        return fresh.find((trip) => trip.id === current.id) ?? null;
      });
    });
  }, []);
```

Assina **uma vez**. O updater funcional do `setSelectedTrip` dá acesso à seleção corrente sem
capturar `selectedTrip` na closure — por isso as deps são `[]` e não há re-assinatura a cada
render. O retorno do `subscribeTrips` é a própria função de cleanup, então o `return` direto
desanexa o listener de `window` quando o último assinante sai (`tripStore.ts:198-204`).

### 1.3 As duas escritas genéricas

```diff
-    const updatedTrip = updater({ ...selectedTrip });
-    setSelectedTrip(updatedTrip);
-    const updatedTrips = trips.map(t => t.id === updatedTrip.id ? updatedTrip : t);
-    setTrips(updatedTrips);
-    localStorage.setItem('kinu_trips', JSON.stringify(updatedTrips));
+    const stored = updateTrip(selectedTrip.id, (trip) => updater(trip));
+    if (stored) setSelectedTrip(stored);
```

**Assinaturas preservadas:** `handleUpdateTrip(updater)` e `persistTrip(trip: SavedTrip)` continuam
idênticas. Os 4 chamadores do primeiro (`TripPanel:987, 997, 1039, 1049`, prop `onUpdateTrip`) e
os 6 do segundo (monitor de preço `:790`, `handleReplaceActivity`, `handleAdjustTime`,
`handleRemoveActivity`, `handleAddActivity`, ação `verificar_ofertas` do KINU) **não mudaram uma
vírgula**.

`setTrips` saiu dos dois: quando `updateTrip` grava, o `emit` síncrono de dentro do `writeAll`
aciona o sino, que recarrega a lista **do disco** — mais correto que o `map` sobre memória.
Quando `updateTrip` devolve `null` (id inexistente), nada foi gravado e `trips` **deve** mesmo
ficar como está.

---

## 2. A decisão delicada: re-sync do `selectedTrip`

O sino re-deriva a seleção pelo id a partir da lista fresca. Quando o id **sumiu do storage**,
a escolha foi **limpar a seleção** (`null`), não mantê-la:

| | Manter a seleção obsoleta | **Limpar — escolhida** |
|---|---|---|
| O que o usuário vê | o cockpit da viagem morta, aparentemente normal | volta para a lista |
| Próxima edição | `updateTrip` acha `index === -1`, só faz `console.warn`, **não grava** | impossível — não há seleção |
| Falha | **silenciosa** | visível e correta |

Manter a seleção reintroduziria exatamente a classe de bug que o Arco 1 existe para matar: uma
tela que parece funcionar sobre um dado que não está mais lá. O gatilho real hoje é outra aba
apagando a viagem (delete ou reset) — e aí a lista é a tela honesta.

**Sem `toast`.** O callback roda dentro do updater do `setSelectedTrip`; sob `StrictMode` o React
pode invocá-lo duas vezes e o aviso sairia duplicado. Avisar o usuário é decisão de produto e
pede um `useRef` com o id corrente — registrado como opção, fora do escopo desta fase.

### 2.1 Por que o sino não desperta nada indesejado

Todo `emit` produz um `selectedTrip` com identidade nova (`JSON.parse` + `normalizeTrip`). Os
quatro efeitos que dependem dele:

| Efeito | Deps | Consequência do re-run |
|---|---|---|
| `:190` navegação pendente | `[pendingNavigation, selectedTrip, ...]` | idempotente; sai no primeiro `if` |
| `:200` `setTripContext` | `[selectedTrip, activeTab, setTripContext]` | remonta o contexto do KINU. Sem escrita, sem loop |
| `:789` monitor de preço | `[selectedTrip?.id]` | **não re-roda** — o id não muda. Zero chamada extra ao Amadeus |
| `:926` `registerActionHandlers` | `[selectedTrip, registerActionHandlers]` | grava num `useRef` (`KinuAIContext:274-278`, `useCallback` estável) — não re-renderiza o provider |

Nenhum escreve no storage ⇒ **não existe ciclo `emit → setState → emit`**. E a churn de identidade
do `selectedTrip` **já existia**: todo `persistTrip` sempre trocou o objeto. O sino só acrescenta
um gatilho.

### 2.2 Ordem dentro de uma escrita migrada

`persistTrip` → `updateTrip` → `writeAll` → `emit` **síncrono** → listener (`setTrips` +
`setSelectedTrip`) → retorna → `setSelectedTrip(stored)`. Dois `setSelectedTrip` no mesmo lote do
React; vence o último, que é o objeto recém-gravado. O `match` do listener tem conteúdo
equivalente, então a ordem não altera o resultado. Um único re-render, por batching.

### 2.3 Por que o sino não atrapalha o que ainda não foi migrado

`localStorage.setItem` **não dispara evento `storage` na própria aba**. Os 12 handlers com
`setItem` próprio, o `handleSaveDraft`, o `handleActivateDraft` e o `GeneratedItineraryStage`
não passam pelo store e portanto **não emitem** — o sino nem fica sabendo deles. Ele não pode
clobberar uma edição em voo desses caminhos. A convivência das duas gerações de escrita durante
a 1d-ii/iii está garantida por construção.

---

## 3. Efeito: o que morre agora e o que só morre depois

**Morre nesta fase, na prática, nesta mesma aba** — cenário Lisboa (§4.2, reproduzido ao vivo no
adendo da 1c):

1. `/viagens` montada com N viagens em `trips`.
2. "cria uma viagem pra Lisboa" no chat → `KinuAIContext` chama `addTrip` (1c) → `writeAll` →
   `emit` **síncrono**.
3. O sino recarrega: `trips` passa a ter **N+1**.
4. O usuário confirma qualquer coisa na tela — **mesmo por um handler ainda não migrado** — e o
   `trips.map(...)` roda sobre a lista **já com Lisboa dentro**. A viagem sobrevive.

**A garantia POR CONSTRUÇÃO só chega na 1d-ii/iii.** A diferença é de natureza, não de grau:

| | 1d-i (agora) | 1d-ii/iii |
|---|---|---|
| Mecanismo | **notificação** — o estado React é *reparado* depois da escrita alheia | cada handler **relê o storage no instante da escrita** |
| Cobre | escritas que passam pelo store (`addTrip`, `updateTrip`, outra aba) | qualquer escrita, inclusive as que não emitem |
| Ponto cego | escritor que grava cru sem emitir (§4.1) e do qual a `/viagens` ainda depende via `trips` de memória | nenhum: o array de memória sai do caminho da escrita |

Em uma frase: **a 1d-i tira a `/viagens` do escuro; a 1d-ii/iii tira o array de memória do caminho
da escrita.** As duas são necessárias.

---

## 4. Riscos residuais assumidos

1. **`persistTrip` continua sendo um snapshot de viagem inteira.** O updater é constante
   (`() => updatedTrip`), montado a partir da `selectedTrip` em memória. O isolamento **entre**
   viagens está garantido; **dentro** de uma mesma viagem (dois escritores no mesmo id) não.
   Nenhum consumidor atual faz isso.
2. **Uma escrita no mesmo tick, antes do re-render**, ainda leria o `trips` velho num handler não
   migrado. Janela de microtask — estritamente melhor que o estado anterior.
3. **`GeneratedItineraryStage` (§4.1) segue fora do sino** — escreve cru, não emite. Fecha na 1e.
4. **Escrita falha ⇒ UI não avança.** Quando `updateTrip` devolve `null`, o `setSelectedTrip` é
   pulado. Antes, a UI atualizava e o disco não — agora os dois ficam consistentes. Só alcançável
   numa situação já quebrada (viagem selecionada ausente do storage), e o store loga o aviso.

---

## 5. Prova

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | **limpo**, zero erro |
| `npx vitest run` | **34/34**, 3 arquivos (`tripStore` 28 · `flight-fallback` 5 · `example` 1) |
| `npx vite build` | **✓ built in 22.13s** |

O único aviso do build é o de chunk > 500 kB, pré-existente e sem relação com esta fase.

---

## 6. Escopo — o que **não** foi tocado

Intactos, como combinado: os 12 `setItem` de handlers (`handleConfirmActivity`,
`handleStartBidding`, `handleAddManualExpense`, `handleToggleChecklist`, `handleUpdateBudget`,
`handleResetJourney`, `handleDeleteTrip`, `handlePackingUpdate`, `handleSwapActivity`,
`handleHeroConfirm`, `handleHeroUnconfirm`, `pick()` inline do modal de swap) → **1d-ii/1d-iii**;
`handleSaveDraft` e `handleActivateDraft` → **1d-iii**; `GeneratedItineraryStage` e `DraftCockpit`
→ **1e**. `tripStore.ts`, `src/data/`, `hotelZones.ts`, `michelinData.ts`, `types/trip.ts`:
não tocados.

`normalizeTrip` permanece importado na `Viagens.tsx` — ainda tem 1 uso, em `handleActivateDraft`
(1d-iii). `loadJson` também permanece: `kinu_user`, linha 238.

---

## 7. Estado do Arco 1

| Fase | O que fez | Status |
|---|---|---|
| 1a | `tripStore.ts` — a fundação | ✅ |
| 1b | 4 leitores puros no funil | ✅ |
| 1c | 2 criadores em `addTrip` | ✅ |
| **1d-i** | **`/viagens`: mount + sino + escrita genérica** | ✅ **esta fase** |
| 1d-ii / 1d-iii | os demais handlers da `/viagens` em `updateTrip`/`deleteTrip`/`clearTrips` | ⏳ |
| 1e | `GeneratedItineraryStage` (§4.1, §4.4) | ⏳ |

## Achados de produto na prova da 1d-i (11/ago)
- Prova: Lisboa sobrevive a edicao na /viagens (§4.2 morto na pratica); persistTrip migrado grava e persiste; mapa logistico reage.
- Backlog 1: trocar horario de atividade nao reorganiza a logistica do dia — decidir UX (reordenar automatico vs oferecer reorganizacao via agente).
- Backlog 2 (PRIORIDADE editorial): durações de passeios precisam de auditoria de sanidade — duracao irreal fere a promessa de catalogo verificado. Adicionar dimensao 'duracao crivel' ao pipeline de curadoria.
- Backlog 3: handleRemoveActivity existe e esta migrado, mas nao ha botao de remover atividade na UI do roteiro — funcao sem interface.
