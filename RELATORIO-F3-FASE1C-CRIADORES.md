# RELATÓRIO — F3 / Arco 1 / Fase 1c: criadores de viagem migrados para `addTrip()`

**Data:** 2026-08-11
**Base:** `RELATORIO-RECON-TRIPSTORE.md` §2.3, §2.4 · `RELATORIO-F3-FASE1B-LEITORES.md`
**Commit:** `044504a` — *feat(f3): fase 1c - criadores de viagem migrados para addTrip (wizard + kinu ai)*
**Status:** aplicado, commitado e **pushado**. Verde em typecheck / testes / build.

---

## 1. O que entrou

| Arquivo | Mudança |
|---|---|
| `src/components/wizard/NewPlanningWizard.tsx` | `loadJson + push + setItem` → `addTrip(trip)`; import de `loadJson` removido |
| `src/contexts/KinuAIContext.tsx` | idem; `createdVia` mantido **antes** da chamada |

**2 arquivos, 4 hunks, +7 / −9.** `src/lib/tripStore.ts` **não foi tocado** — a 1c só o consome,
como a 1b.

O diff saiu **idêntico ao proposto no STEP 1**, sem surpresa de aplicação.

### O padrão, nos dois arquivos

```diff
-      const existingTrips = loadJson<any[]>('kinu_trips', []);
-      existingTrips.push(trip);
-      localStorage.setItem('kinu_trips', JSON.stringify(existingTrips));
+      addTrip(trip);
```

Com isso, **`kinu_trips` sai por completo dos dois criadores.** As 4 operações do recon §2.3/§2.4
viraram 2 chamadas de funil.

---

## 2. Os 3 fatos da recon que fecharam o diff

Verificados **antes** de escrever qualquer linha — é o que fez a aplicação ser sem atrito:

| # | Fato | Onde | Consequência |
|---|---|---|---|
| 1 | `buildDraftTrip` retorna `Promise<SavedTrip>` | `createTrip.ts:39` | Casa exatamente com `addTrip(trip: SavedTrip)`. **Zero cast, zero `any` novo.** |
| 2 | `buildDraftTrip` sempre gera `id` (`trip-${Date.now()}`) | `createTrip.ts:42,113` | `trip.id` segue válido depois do `addTrip`. O fallback `if (!stored.id)` do store nunca dispara aqui. |
| 3 | `loadJson` tinha **1 uso em cada arquivo** | Wizard `:153` · KinuAI `:383` | Os dois imports ficaram órfãos e saíram — ao contrário da 1b, onde `Conta`/`FeedbackButton` mantiveram o import por causa de `kinu_user`/`kinu_feedback`. |

### `createdVia` sobrevive — e por quê

`addTrip` empurra o **objeto cru** e só normaliza o valor de retorno (`tripStore.ts:287-303`):

```ts
const stored = trip as StoredTrip;   // mesma referência, sem cópia
const trips = readRaw();             // readRaw, NÃO listTrips — não normaliza os outros
trips.push(stored);
writeAll(trips);
```

`StoredTrip = SavedTrip & { [key: string]: any }`. O campo atravessa. É a mesma travessia que o
**teste-chave da 1b** trava para `outboundFlight` — se ela quebrar, aquele teste cai antes de o
problema chegar em produção.

`setPendingNavigation({ ... tripId: trip.id })` na linha seguinte também seguiu válido: o `addTrip`
opera sobre a mesma referência, não devolve clone que precise ser recapturado.

---

## 3. Efeito: o que muda de verdade

### 3.1 (a) O sino passa a tocar na criação

`addTrip` → `writeAll` → `emit()` (`tripStore.ts:233-236`). **Criar viagem por qualquer um dos dois
caminhos agora notifica os 3 assinantes da 1b:** `Dashboard`, `Cla`, `FeedbackButton`.

| Caminho | Antes | Depois da 1c |
|---|---|---|
| Wizard cria viagem com `/cla` montada atrás | card só aparecia com F5 | aparece sozinho |
| `FeedbackButton` (monta 1× por sessão, `App.tsx:74`) | anexava a viagem **anterior** ao feedback | anexa a recém-criada |
| Chat KINU → `/dashboard` | já funcionava (1b, 4/4) — porque o Dashboard remonta na navegação | idem, agora pelo sino de verdade, não por remount |

O `FeedbackButton` é o ganho mais direto: pela §4 da 1b ele é o mais stale dos leitores, e é
justamente o canal de bug report do beta — contexto errado ali é onde mais custa.

### 3.2 (b) A metade "criação" do recon §4.2 morreu

A escrita antiga regravava o array inteiro a partir de uma leitura feita **antes** do push. Com
`addTrip`, a leitura acontece **no instante da escrita** (`readRaw()` dentro da função):

> **Uma viagem criada por outra tela não pode mais ser engolida por uma regravação vinda destes
> dois criadores.**

Isso importa porque a janela era **real, não teórica**: `buildDraftTrip` é assíncrono e lento
(chamadas de rede), e no wizard ainda há um `await new Promise(setTimeout, 1500)` depois dele.
Havia segundos entre a leitura e a escrita.

### 3.3 ⚠️ A metade "edição por cima" continua viva — só morre na 1d

**Declarado sem rodeio: o cenário completo do recon §4.2 ainda reproduz.**

1. Usuário na `/viagens` com N viagens em memória.
2. Chat cria a N+1 → **agora esta parte está blindada** ✅
3. Usuário confirma qualquer coisa na tela → `Viagens` regrava **N** a partir do `useState`. **A
   viagem nova ainda some.** ❌

`Viagens.tsx` segue com as 18 operações próprias, regravando o array inteiro a partir do estado
React. **A 1c blinda quem cria, não quem sobrescreve.** Isso é 1d.

O §4.1 (`GeneratedItineraryStage`) também não foi tocado — arquivo proibido nesta fase.

### 3.4 Ganho colateral não pedido: storage torto deixa de matar a criação

Antes, `loadJson<any[]>('kinu_trips', [])` com `{}` no storage devolvia `{}`, e
`existingTrips.push(...)` estourava `TypeError`. Nos dois arquivos a linha estava dentro de
`try/catch`, então o resultado era: **wizard mostrava "Erro ao gerar rascunho" e o chat falhava em
silêncio** — em vez de criar a viagem.

`readRaw()` trata não-array como `[]` com aviso (`tripStore.ts:218-228`). Com storage torto, a
criação **passa a funcionar** em vez de falhar. É o recon §4.3 fechando também para os criadores.

---

## 4. Verificação

| Gate | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ exit 0, zero erros |
| `npx vitest run` | ✅ **34/34** em 3 arquivos |
| `npx vite build` | ✅ built in 20.80s |
| `eslint src` | 228 erros vs. **230 na 1b** → **−2** |

A queda de 2 no lint são exatamente os dois `loadJson<any[]>` removidos. O aviso de chunk >500 kB é
pré-existente e não tem relação com esta fase.

**Nenhum teste novo.** A 1b já cobre `addTrip` (2 casos, incluindo o read-modify-write) e
`subscribeTrips` (3 casos); migrar chamador não cria comportamento novo no store. Os testes
**não** cobrem estes dois componentes — nenhum é renderizado em teste, igual à 1b. **A prova da
migração é runtime, não unitária** — ver §6.

---

## 5. Push — passo obrigatório da missão

Na 1b o push ficou esquecido e travou a entrega. Saída literal desta vez:

```
$ git push origin main
To https://github.com/PedroContrucci/kinus-clan-compass
   5b6ccd3..044504a  main -> main
push exit=0
```

**Hash em produção: `044504a`.**

⚠️ **Pendência de verificação humana:** o adendo da 1b instituiu conferir o card do Lovable após o
push (o webhook perdeu o evento do `70009c5` e exigiu commit-isca). **Não tenho acesso ao painel do
Lovable** — a conferência do card é sua. Se não atualizar, o remédio conhecido é o commit-isca.

---

## 6. Prova de runtime sugerida (4 checagens)

O que vale a pena olhar no app, em ordem de valor:

1. **Wizard + `/cla` atrás** — criar viagem pelo wizard e voltar para `/cla` **sem F5**. Card novo
   deve estar lá. (É o ganho novo mais visível da 1c.)
2. **FeedbackButton** — criar viagem, abrir o feedback **sem recarregar**, conferir que o contexto
   anexado é a viagem **nova**, não a anterior.
3. **`createdVia`** — criar pelo chat e conferir no DevTools que `kinu_trips` tem
   `createdVia: 'kinu'` na viagem nova.
4. **O limite honesto** — reproduzir o §4.2 inteiro: na `/viagens`, criar pelo chat e confirmar uma
   atividade. **A viagem nova ainda deve sumir.** Se sumir, está correto para esta fase — é a 1d que
   fecha isso. Se *não* sumir, algo mudou a mais do que o previsto e vale investigar.

---

## 7. Conformidade de escopo

**Não tocados, conforme a proibição da fase:** `Viagens.tsx`, `GeneratedItineraryStage.tsx`,
`DraftCockpit.tsx`, `tripStore.ts`, `src/data/`, `src/lib/hotelZones.ts`, `src/lib/michelinData.ts`,
`src/types/trip.ts`.

`src/lib/safeStorage.ts` **não foi tocado** — só perdeu 2 dos 9 importadores. `loadJson` segue vivo
e em uso, inclusive **dentro do próprio `tripStore.readRaw`** (`tripStore.ts:219`).

`STEP1-TRIPSTORE-1C.md` deletado após a aplicação, conforme o protocolo.

---

## 8. Estado do Arco 1 e próximo passo

| Fase | Escopo | Estado |
|---|---|---|
| 1a | `tripStore.ts` criado, sem consumidores | ✅ `c4bb752` |
| 1b | testes (28) + 4 leitores puros migrados | ✅ `70009c5` |
| **1c** | **2 criadores → `addTrip`** | ✅ **`044504a`** |
| 1d | `Viagens.tsx` (18 ops) + `GeneratedItineraryStage` (§4.1, exige `id` por prop) | ⬜ pendente |

**Restam 20 das 28 operações do recon** — 18 na `Viagens.tsx` e 2 na `GeneratedItineraryStage`.

A 1d é a fase pesada e é onde os dois bugs de perda silenciosa (§4.1 e §4.2) efetivamente morrem.
A trava conhecida está registrada no recon §8.1: **`GeneratedItineraryStage` não conhece o `id` da
viagem** — busca por `destination` + datas — e precisa recebê-lo por prop via `DraftCockpit`.
São 2 assinaturas de componente a mudar, fora do `tripStore.ts`. Sem isso, o §4.1 não fecha.

## Adendo pós-entrega (11/ago, noite)
- Prova de runtime 1c: sino via wizard confirmado (/cla sem F5); createdVia presente no storage; §4.2 completo reproduzido ao vivo (Lisboa criada pelo chat foi engolida por edicao na /viagens — esperado, morre na 1d).
- Achado de backlog: JSON de feedback exportado NAO contem o contexto de viagem que o FeedbackButton le (campos: id/timestamp/tester_name/rating/category/message/page/userAgent/screenSize/appVersion). Investigar se o anexo de activeTrip se perde no caminho.
