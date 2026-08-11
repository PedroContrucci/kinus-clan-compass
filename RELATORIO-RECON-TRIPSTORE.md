# Relatório — Reconhecimento do acesso a trips no localStorage

**Data:** 2026-08-11
**Arco:** F3 / Arco 1 — preparação para `src/lib/tripStore.ts`
**Escopo:** somente leitura. **Nenhum arquivo modificado.**
**Base:** `RELATORIO-ARCO0-GATE-F3.md` § "Próximo passo"

---

## TL;DR

**28 operações sobre `kinu_trips`, espalhadas por 8 arquivos.** Uma delas concentra 18
(`src/pages/Viagens.tsx`).

O terreno é mais simples do que parecia num aspecto e mais perigoso em outro:

- **Bom:** já existe uma meia-camada (`src/lib/safeStorage.ts` → `loadJson`) usada em 9
  arquivos, e **nenhum `JSON.parse` está sem `try/catch`** — os 4 parses crus que sobraram
  estão todos protegidos. A higiene de parse não é o problema.
- **Ruim:** existem **dois caminhos de escrita concorrente comprovados** que se sobrescrevem
  em silêncio, porque um lado escreve a partir do **estado React** e o outro a partir do
  **localStorage**. Detalhe em §4.1 e §4.2. O funil resolve isso por construção — desde que
  a regra "toda escrita é read-modify-write contra o storage, nunca contra o estado React"
  seja obedecida.

A recomendação de interface está em §7: **9 funções** cobrem 100% dos 28 usos.

---

## 1. Inventário de chaves

Varredura: `grep -rE "kinu_[a-zA-Z0-9_]*" src/` + todas as chamadas
`localStorage.{get,set,remove}Item` e `loadJson`.

| Chave | Ocorrências | É trip? | Onde vive |
|---|---|---|---|
| `kinu_trips` | 28 | ✅ **sim — o alvo** | 8 arquivos (§2) |
| `kinu_price_history_${tripId}` | 2 | ✅ **sim — trip-scoped** | `TripPanel.tsx:150,167` |
| `kinu_trip_panel_sections` | 3 | ❌ preferência de UI (seções abertas/fechadas) | `TripPanel.tsx:96,110,113` |
| `kinu_user` | 10 | ❌ auth | `useAuth.ts`, `Login.tsx`, `Conta.tsx`, `Viagens.tsx:331`, `Dashboard`(via useAuth), `DestinationDetail.tsx:17`, `tripPdfExport.ts:894` |
| `kinu_saved_activities` | 2 | ⚠️ **órfã — ver §4.7** | `ActivityDetailModal.tsx:81,84` |
| `kinu_tester_name` | 3 | ❌ feedback | `FeedbackButton.tsx:11,49,160` |
| `kinu_feedback` | 3 | ❌ feedback | `FeedbackButton.tsx:108`, `Conta.tsx:135` |
| `kinu_exchange_rates_v2` | 1 | ❌ cache de câmbio (TTL) | `useExchangeRates.ts:60,73` |
| `sb-*` (Supabase Auth) | — | ❌ auth | `integrations/supabase/client.ts:13` (`storage: localStorage`) |

**Falsos positivos descartados:** `kinu_estimate`, `kinu_insights`,
`kinu_insights_trip_id_fkey`, `kinu_insights_user_id_fkey` — são **colunas e constraints do
Postgres** em `src/integrations/supabase/types.ts`, não chaves de localStorage.

**Não existe `sessionStorage` em lugar nenhum do `src/`.** Zero ocorrências.

**Fronteira do Arco 1:** o funil cobre `kinu_trips` e `kinu_price_history_*`. `kinu_user`
é assunto de auth (arco próprio), e `kinu_tester_name`/`kinu_feedback`/
`kinu_exchange_rates_v2` não são trip.

---

## 2. Mapa ponto a ponto — `kinu_trips`

### 2.1 `src/pages/Viagens.tsx` — 18 operações

O cockpit. Todas as escritas seguem o mesmo trio: `setSelectedTrip` → `setTrips` →
`localStorage.setItem`.

| Linha | Op | Handler | O que faz |
|---|---|---|---|
| 339 | read | `useEffect` de mount | `loadJson<any[]>('kinu_trips', [])` |
| 342 | **write** | idem | Regrava o array **normalizado** (`normalizeSavedTrip`) — escrita-no-read, §4.5 |
| 437 | write | `handleConfirmActivity` | Confirma atividade, move valor planned→confirmed, recalcula progresso, promove `draft`→`active` |
| 471 | write | `handleStartBidding` | Marca atividade como `bidding`, move planned→bidding |
| 497 | write | `handleAddManualExpense` | Soma gasto manual em `finances.confirmed` + categoria |
| 518 | write | `handleToggleChecklist` | Marca/desmarca item do checklist |
| 537 | write | `handleUpdateBudget` | Novo orçamento, recalcula `available` |
| 548 | **remove** | `handleResetJourney` | `removeItem` — **apaga TODAS as viagens**, §4.9 |
| 565 | write | `handleDeleteTrip` | Remove 1 viagem por id (filter) |
| 585 | write | `handlePackingUpdate` | Grava `trip.packing` (campo fora do tipo, §4.6) |
| 661 | write | `handleSwapActivity` | Troca atividade por candidata do catálogo curado |
| 755 | write | `handleHeroConfirm` | Confirma voo/hotel, reescreve buckets de `flights`/`accommodation` |
| 800 | write | `handleHeroUnconfirm` | Desfaz a confirmação, devolve valores para `planned` |
| 818 | write | `handleUpdateTrip(updater)` | **Escrita genérica** — recebe uma função e persiste o resultado |
| 826 | write | `persistTrip(trip)` | **Helper interno** já é um mini-funil; usado por 883 e 1082 (monitor de preço) |
| 1108 | write | `handleSaveDraft` | Salva rascunho vindo do `DraftCockpit` |
| 1127 | write | `handleActivateDraft` | `status='active'`, gera dias se vazio, **normaliza**, persiste |
| 2688 | write | `pick()` do modal de swap | Duplicata inline de `handleSwapActivity` (§4.8) |

`normalizeSavedTrip` está definido **dentro da página**, em `Viagens.tsx:194` — não é
importável por ninguém.

### 2.2 `src/components/cockpit/GeneratedItineraryStage.tsx` — 2 operações

| Linha | Op | O que faz |
|---|---|---|
| 1086 | read | `localStorage.getItem('kinu_trips')` **cru** + `JSON.parse` (dentro de `try`) |
| 1129 | **write** | Recalcula `finances` a partir dos dias gerados e grava direto no array |

**É o único escritor que não passa pelo estado React do `Viagens`.** Roda dentro de um
`useEffect` disparado a cada mudança de `days` (linha 1137-1139). É a origem do risco §4.1.

Acha a viagem por **`destination` + `startDate` + `endDate`** (linhas 1091-1096), não por
`id` — ver §4.4.

### 2.3 `src/components/wizard/NewPlanningWizard.tsx` — 2 operações

| Linha | Op | O que faz |
|---|---|---|
| 153 | read | `loadJson<any[]>('kinu_trips', [])` |
| 155 | write | `push(trip)` + regrava o array inteiro |

Entrada do funil: `buildDraftTrip()` (de `src/lib/createTrip.ts`) → append → navega para
`/viagens?trip=${trip.id}`.

### 2.4 `src/contexts/KinuAIContext.tsx` — 2 operações

| Linha | Op | O que faz |
|---|---|---|
| 383 | read | `loadJson<any[]>('kinu_trips', [])` |
| 385 | write | `push(trip)` — mesma sequência do wizard, ação `criar_viagem` do chat |

Marca `(trip as any).createdVia = 'kinu'` (linha 381) — campo fora do tipo.
**É um provider global:** essa escrita pode acontecer com o `Viagens` montado. Risco §4.2.

### 2.5 Leitores puros — 4 arquivos, 1 leitura cada

| Arquivo:linha | O que faz com o dado |
|---|---|
| `src/pages/Cla.tsx:79` | `myTrips` = trips com dias; `activeTrip` = heurística "próxima ativa, senão a última" |
| `src/pages/Dashboard.tsx:42` | `localTrips`, fundidos com `useUserTrips` (Supabase) para a listagem |
| `src/pages/Conta.tsx:26` | Estatísticas: nº de viagens, países únicos, total de atividades |
| `src/components/shared/FeedbackButton.tsx:24` | `activeTrip` para anexar contexto ao feedback |

`Cla.tsx:81-83` e `FeedbackButton.tsx:25-27` contêm a **mesma heurística de viagem ativa,
literalmente idêntica**, copiada. Candidata óbvia a `getActiveTrip()`.

---

## 3. Camada existente — o que já está pronto

`src/lib/safeStorage.ts` tem **9 linhas** e **uma função**:

```ts
export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (e) {
    console.warn(`[safeStorage] corrupted key ${key}`, e);
    return fallback;
  }
}
```

Importada por 9 arquivos. **Não tem contraparte de escrita** — todo mundo escreve com
`localStorage.setItem(...JSON.stringify(...))` na mão. Essa assimetria (leitura com rede de
proteção, escrita sem nenhuma) é a forma do problema em uma frase.

`loadJson` também **não valida forma**: se `kinu_trips` contiver `{}` em vez de `[]`, o
retorno é `{}` e o `.map()` de `Viagens.tsx:340` estoura `TypeError` fora de qualquer
`try/catch`, quebrando o mount da página. Ver §4.3.

---

## 4. Riscos para o funil

Ordenados por gravidade.

### 4.1 🔴 Escrita concorrente: `GeneratedItineraryStage` × `Viagens` — perda silenciosa

Cadeia de renderização confirmada: `Viagens.tsx:1517 <DraftCockpit>` →
`DraftCockpit.tsx:367 <GeneratedItineraryStage>`.

O que acontece:

1. `Viagens` carrega `kinu_trips` no mount e guarda em `useState` (`trips`).
2. O usuário abre o cockpit de rascunho; `GeneratedItineraryStage` recalcula as finanças e
   escreve **direto no localStorage** (`:1129`). O `trips` do React **não sabe disso**.
3. Qualquer escrita seguinte do `Viagens` faz `trips.map(...)` sobre o array **em memória,
   agora obsoleto**, e regrava o todo.

**Resultado: o recálculo de finanças é apagado sem erro, sem log, sem sintoma imediato.**
O caminho mais curto para o bug é ativar o rascunho: `handleActivateDraft` (`:1127`)
escreve o `trips` de memória e desfaz o que o estágio acabou de gravar.

### 4.2 🔴 Escrita concorrente: `KinuAIContext` × `Viagens` — viagem nova desaparece

`KinuAIContext` é provider global; o chat está disponível **dentro da `/viagens`**
(`Viagens.tsx:280` consome `useKinuAI()`). Sequência real:

1. Usuário está na `/viagens` com `trips` já em memória (N viagens).
2. Pede "cria uma viagem pra Lisboa" no chat → `KinuAIContext:385` grava **N+1** viagens.
3. Usuário confirma qualquer coisa na tela → `Viagens` regrava **N** viagens.

**A viagem criada pelo KINU some.** Mesmo mecanismo do §4.1, gatilho diferente.

### 4.3 🟡 `loadJson` não valida forma — mount da `/viagens` quebra com storage torto

`loadJson<any[]>` confia no genérico. Storage com `{}`, `null` literal ou string solta
retorna algo que não é array, e `Viagens.tsx:340` (`rawTrips.map`) estoura fora de
`try/catch`. Idem `Conta.tsx:27` (`savedTrips.map`) e `Cla.tsx:80` — este último está
dentro de `try` e degrada em silêncio.

O funil deve **garantir array** na saída, sempre.

### 4.4 🟡 Identificação por conteúdo em vez de `id`

`GeneratedItineraryStage.tsx:1091-1096` localiza a viagem casando
`destination` + `startDate` + `endDate`:

```ts
const idx = trips.findIndex((t) => {
  if (!t || t.destination !== destination) return false;
  const st = t.startDate ? new Date(t.startDate).getTime() : NaN;
  const en = t.endDate ? new Date(t.endDate).getTime() : NaN;
  return st === depTime && en === retTime;
});
if (idx === -1) return;
```

Duas consequências: dois rascunhos para o mesmo destino nas mesmas datas fazem o estágio
patchear **o primeiro**; e quando nada casa, o `return` é **silencioso** — as finanças
simplesmente nunca são persistidas, sem log.

### 4.5 🟡 Normalização assimétrica

`normalizeSavedTrip` (`Viagens.tsx:194`) roda em exatamente **2 dos 8 arquivos-leitores** —
e só na `Viagens` (mount `:340` e ativação `:1123`). `Cla`, `Dashboard`, `Conta`,
`FeedbackButton` e `GeneratedItineraryStage` leem **cru**.

Efeito colateral em `:342`: a `/viagens` **escreve no storage durante a leitura de mount**,
o que significa que a forma dos dados depende de a `/viagens` ter sido aberta. Uma viagem
criada pelo chat e lida pela `/cla` nunca passou por normalização.

### 4.6 🟡 O tipo `SavedTrip` não é o contrato real

Campos gravados no storage que **não existem** em `src/types/trip.ts:118-148`, todos por
`as any`:

| Campo | Escrito em | Lido em |
|---|---|---|
| `lastPriceCheck` | `Viagens.tsx:881, 1084` | `Viagens.tsx:868` |
| `createdVia` | `KinuAIContext.tsx:381` | — |
| `outboundFlight` / `returnFlight` | `DraftCockpit.tsx:197, 218, 304` (via `onSave`/`onActivate`) | `Viagens.tsx:711, 717, 1149`, `flightFinance.ts:2`, `tripPdfExport.ts:1073` |
| `packing` | `Viagens.tsx:581` | componentes de preparação |
| `accommodation.mealPlan` | `Viagens.tsx:741` | TripPanel |
| `flights.*.flightNumber` | `Viagens.tsx:714, 720` | TripPanel / PDF |

`outboundFlight` é o mais grave: **cinco leitores** dependem de um campo que o tipo não
declara e que `createTrip.ts` nunca cria. Se o funil tipar a escrita como `SavedTrip`
estrito, esses campos somem e o PDF/FinOps quebra.

### 4.7 🟡 `kinu_saved_activities` é órfã

Escrita em `ActivityDetailModal.tsx:84` ("Adicionado à sua viagem!"), lida **apenas por ela
mesma** (`:81`, para deduplicar). **Nenhuma viagem consome essa lista.** O usuário recebe um
toast de sucesso e o dado morre no storage. É um bug de produto, não do funil — registrado
aqui porque a varredura o encontrou.

### 4.8 🟡 Duplicata de lógica de swap

`handleSwapActivity` (`Viagens.tsx:588-663`) e o `pick()` inline do modal
(`Viagens.tsx:2661-2691`) fazem a mesma coisa com uma diferença: o inline também atualiza
`cost` (`:2678`), o outro não. Duas escritas, dois comportamentos, mesma intenção.

### 4.9 🟡 Vazamento de `kinu_price_history_*` + reset total

- `handleDeleteTrip` (`:565`) remove a viagem mas **não remove**
  `kinu_price_history_<id>` — a chave fica no storage para sempre.
- `handleResetJourney` (`:548`) faz `removeItem('kinu_trips')`: apaga **tudo**, sem backup,
  e também deixa todos os históricos de preço órfãos.

### 4.10 🟡 Sem sincronização entre abas

**Zero `addEventListener('storage')` no `src/` inteiro.** Duas abas abertas = a última a
escrever ganha, e a outra continua exibindo dados fantasma até o reload. É a versão
multi-aba dos riscos §4.1/§4.2.

### 4.11 🟢 `?trip=` é ignorado

`NewPlanningWizard.tsx:165` navega para `/viagens?trip=${trip.id}` e
`KinuAIContext.tsx:387` guarda `tripId` no `pendingNavigation` — mas `Viagens.tsx` **nunca
lê o parâmetro**. `useLocation()` é chamado na linha 256 e a variável `location` **não é
usada em lugar nenhum** (única outra ocorrência de `location` no arquivo, na linha 169, é a
propriedade `activity.location`, sem relação).

Consequência: quem cria uma viagem cai na lista sem seleção, em vez de na viagem recém-criada.
Não é bug do storage, mas o funil precisa expor `getTrip(id)` para que a correção seja trivial.

### 4.12 🟢 O que **não** é risco

Verificado e descartado, para não virar trabalho inventado:

- **`JSON.parse` sem `try/catch`: não existe.** Os 4 parses crus
  (`GeneratedItineraryStage:1088`, `TripPanel:98`, `TripPanel:111`, `useAuth:21`,
  `tripPdfExport:895`) estão todos dentro de `try`.
- **`DraftCockpit` não toca no localStorage.** Só passa objetos por `onSave`/`onActivate`.
  Está correto como está.
- **Quota / `QuotaExceededError`:** nenhuma escrita trata. Mas o volume (dezenas de
  viagens) não chega perto do limite; registrado como observação, não como risco.

---

## 5. Estatística

**8 arquivos tocam `kinu_trips` diretamente** — 6 leem, 4 escrevem (2 fazem os dois).
**28 operações no total:** 8 leituras, 19 escritas, 1 remoção.

Somando as chaves trip-scoped (`kinu_price_history_*`), são **9 arquivos e 32 operações**.

### Os 5 mais críticos

| # | Arquivo | Ops | Por que é crítico |
|---|---|---|---|
| 1 | `src/pages/Viagens.tsx` | **18** | 64% de todas as operações. Cockpit inteiro: ativação, confirmação, FinOps, checklist, swap, delete, reset. Dona da `normalizeSavedTrip` (privada) e do único helper de persistência (`persistTrip`, `:822`). Migrar esta é migrar a maior parte do trabalho. |
| 2 | `src/components/cockpit/GeneratedItineraryStage.tsx` | 2 | **Maior perigo por operação.** Único escritor que ignora o estado React (§4.1), busca por conteúdo em vez de id (§4.4), falha em silêncio. |
| 3 | `src/contexts/KinuAIContext.tsx` | 2 | Provider **global** — cria viagem de qualquer tela, inclusive por cima da `/viagens` montada (§4.2). |
| 4 | `src/components/wizard/NewPlanningWizard.tsx` | 2 | Porta de entrada canônica do funil wizard → cockpit. Read-modify-write sem normalização. |
| 5 | `src/pages/Cla.tsx` | 1 | Empatado em nº de ops com `Dashboard`/`Conta`/`FeedbackButton`, mas é onde a heurística de "viagem ativa" está duplicada com `FeedbackButton` (§2.5) e onde o beta reporta bugs. |

**Fluxo completo do dado:**

```
NewPlanningWizard ──┐
                    ├─► kinu_trips ──► Viagens (mount, normaliza, REGRAVA)
KinuAIContext ──────┘                     │
                                          ├─► DraftCockpit ──► GeneratedItineraryStage
                                          │        (escreve DIRETO no storage) ⚠️
                                          ├─► TripPanel ─► kinu_price_history_<id>
                                          └─► 16 escritas de edição/confirmação

                    kinu_trips ──► Cla · Dashboard · Conta · FeedbackButton  (leitura crua)
```

---

## 6. Regra de projeto que resolve §4.1 e §4.2

Antes da interface, o princípio — porque é ele que faz o funil valer a pena:

> **Toda escrita é read-modify-write contra o `localStorage`, nunca contra o estado React.**

Hoje o padrão é `trips.map(t => t.id === x ? novo : t)` sobre um array em memória que pode
estar velho. Se `updateTrip(id, patch)` reler o storage no momento da escrita e alterar
**apenas a viagem daquele id**, os dois cenários de perda silenciosa deixam de existir por
construção — sem lock, sem transação, sem mudar nenhum handler além da chamada.

---

## 7. Interface recomendada para `src/lib/tripStore.ts`

Nove funções cobrem os 28 usos. Assinaturas, não implementação.

```ts
export const TRIPS_KEY = 'kinu_trips';

// ---------- leitura ----------

/** Sempre array. Normaliza cada item. Nunca lança. Cobre: Viagens:339,
 *  Cla:79, Dashboard:42, Conta:26, FeedbackButton:24, GeneratedItineraryStage:1086. */
export function listTrips(): SavedTrip[];

/** Cobre o deep-link ?trip= (§4.11) e substitui a busca por conteúdo do
 *  GeneratedItineraryStage (§4.4). */
export function getTrip(id: string): SavedTrip | null;

/** Heurística única de "viagem ativa": próxima com status 'active' e startDate
 *  futuro, senão a última. Dedup de Cla:81-83 e FeedbackButton:25-27. */
export function getActiveTrip(): SavedTrip | null;

// ---------- escrita ----------

/** Append. Gera id/createdAt se faltarem. Cobre NewPlanningWizard:155 e
 *  KinuAIContext:385. */
export function addTrip(trip: SavedTrip): SavedTrip;

/** O carro-chefe. Relê o storage, aplica o updater SÓ na viagem do id, regrava.
 *  Retorna a viagem atualizada, ou null se o id sumiu. Cobre 15 das 16 escritas
 *  da Viagens + a de GeneratedItineraryStage:1129. É o que mata §4.1 e §4.2. */
export function updateTrip(
  id: string,
  updater: (trip: SavedTrip) => SavedTrip
): SavedTrip | null;

/** Remove a viagem E o kinu_price_history_<id> associado (§4.9).
 *  Cobre Viagens:565. */
export function deleteTrip(id: string): void;

/** Apaga todas as viagens e todos os históricos de preço órfãos.
 *  Cobre Viagens:548 (handleResetJourney). */
export function clearTrips(): void;

// ---------- suporte ----------

/** normalizeSavedTrip, hoje presa em Viagens.tsx:194, movida para cá e aplicada
 *  em TODA leitura — acaba com a assimetria do §4.5 e com a escrita-no-read
 *  de Viagens:342. */
export function normalizeTrip(trip: any): SavedTrip;

/** Notifica quando kinu_trips muda — por esta aba ou por outra
 *  (window 'storage'). Resolve §4.10 e é a base do useTrips() do Arco 2. */
export function subscribeTrips(listener: () => void): () => void;
```

### Cobertura — as 28 operações mapeadas contra a interface

| Origem | Ops | Função do funil |
|---|---|---|
| Leituras de lista (6 arquivos) | 8 | `listTrips()` |
| `Viagens` — 14 escritas de edição de 1 viagem | 14 | `updateTrip(id, updater)` |
| `Viagens:342` — regravação normalizada no mount | 1 | **eliminada** (normalização passa a ser da leitura) |
| `Viagens:565` — delete | 1 | `deleteTrip(id)` |
| `Viagens:548` — reset | 1 | `clearTrips()` |
| `Wizard:155` + `KinuAI:385` — append | 2 | `addTrip(trip)` |
| `GeneratedItineraryStage:1129` — patch de finanças | 1 | `updateTrip(id, ...)` — exige receber o `id` por prop (§8) |
| **Total** | **28** | **100%** |

### `kinu_price_history_*` — decisão pendente

`TripPanel.tsx` tem `getPriceHistory` / `savePriceSnapshot` / `getPriceChangeInfo`
(`:148-190`), já encapsulados e funcionais. Duas opções:

- **(a)** Mover para o `tripStore` como `getPriceHistory(tripId)` /
  `pushPriceSnapshot(tripId, price)` — o funil vira dono de tudo que é trip-scoped, e o
  `deleteTrip` limpa a chave sem alcançar dentro de um componente.
- **(b)** Deixar no `TripPanel` no Arco 1 e expor só um `deleteTripSideKeys(id)` no store.

**Recomendo (a)**, mas é decisão do arquiteto: (a) alarga o escopo do Arco 1 em ~40 linhas;
(b) mantém o arco mínimo e adia. `kinu_trip_panel_sections` **não** deve entrar — é
preferência de UI, não trip.

---

## 8. Duas travas que a migração vai encontrar

Registradas agora para não virarem surpresa no meio do Arco 1.

1. **`GeneratedItineraryStage` não conhece o `id` da viagem.** Por isso busca por
   destino+datas (§4.4). Para usar `updateTrip(id, ...)`, o `id` precisa descer como prop
   via `DraftCockpit`. É uma mudança de assinatura em 2 componentes — pequena, mas é
   trabalho fora do `tripStore.ts`, e sem ela o §4.1 não fecha.

2. **Tipar o funil como `SavedTrip` estrito derruba 6 campos vivos** (§4.6) —
   `outboundFlight` tem 5 leitores. As saídas: estender `SavedTrip` com os campos reais
   (correto, mas mexe em `src/types/trip.ts`, hoje na lista de proibidos), ou tipar o store
   com `SavedTrip & Record<string, unknown>` no Arco 1 e fechar o tipo depois. **Recomendo
   a segunda** para manter o arco com saída verificável ("app idêntico, /smoke limpo").

---

## 9. Método e conformidade

**Ferramentas:** `grep -rn` sobre `src/` (`.ts`/`.tsx`) e leitura direta dos arquivos.

**Escritas:** nenhuma. Nenhum arquivo do projeto criado ou modificado além deste relatório.
Nenhum comando `git`. `src/data/`, `src/lib/hotelZones.ts`, `src/lib/michelinData.ts` e
`src/types/trip.ts` foram **lidos, não tocados**.

**Arquivos inspecionados (17):**

```
src/lib/safeStorage.ts                         src/lib/createTrip.ts
src/lib/tripPdfExport.ts                       src/lib/flightFinance.ts
src/hooks/useAuth.ts                           src/hooks/useExchangeRates.ts
src/pages/Viagens.tsx                          src/pages/Cla.tsx
src/pages/Dashboard.tsx                        src/pages/Conta.tsx
src/pages/Login.tsx                            src/pages/DestinationDetail.tsx
src/contexts/KinuAIContext.tsx                 src/components/wizard/NewPlanningWizard.tsx
src/components/cockpit/GeneratedItineraryStage.tsx
src/components/cockpit/TripPanel.tsx           src/components/cockpit/DraftCockpit.tsx
src/components/community/ActivityDetailModal.tsx
src/components/shared/FeedbackButton.tsx       src/types/trip.ts
src/integrations/supabase/client.ts
```

**Limite declarado:** o mapa é estático. Os riscos §4.1, §4.2 e §4.10 foram deduzidos da
leitura do código e da cadeia de renderização confirmada
(`Viagens → DraftCockpit → GeneratedItineraryStage`), **não reproduzidos no navegador**.
A dedução é sólida — o mecanismo está nas linhas citadas — mas não é o mesmo que um repro.
Se quiser certeza antes de mexer, o teste é curto: abrir a `/viagens`, criar viagem pelo
chat do KINU e confirmar qualquer atividade na tela; se a viagem nova sumir da lista após
o reload, §4.2 está provado.
