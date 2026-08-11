# RELATÓRIO — F3 / Arco 1 / Fase 1b: testes do tripStore + migração dos 4 leitores

**Data:** 2026-08-11
**Base:** `RELATORIO-RECON-TRIPSTORE.md` · `RELATORIO-F3-FASE1A-TRIPSTORE.md`
**Status:** aplicado, verde em typecheck / testes / build.

---

## 1. O que entrou

| Arquivo | Mudança |
|---|---|
| `src/test/tripStore.test.ts` | **criado** — 28 testes cobrindo as 11 funções públicas |
| `src/pages/Cla.tsx` | migrado para `listTrips`/`getActiveTrip` + assina o sino |
| `src/pages/Dashboard.tsx` | migrado para `listTrips` + assina o sino |
| `src/pages/Conta.tsx` | migrado para `listTrips` (não assina — §4) |
| `src/components/shared/FeedbackButton.tsx` | migrado para `getActiveTrip` + assina o sino |

Diff da migração: **+25 / −20** em 4 arquivos. `src/lib/tripStore.ts` **não foi tocado** —
a 1b só o consome e o testa.

---

## 2. Os testes — 28 casos, verdes de primeira

Rodam em jsdom (já configurado no `vitest.config.ts`). Dois cuidados de isolamento que
eram obrigatórios:

1. `localStorage.clear()` em `beforeEach` — o jsdom mantém o storage entre testes.
2. Todo teste que assina **desassina no `finally`**. O `Set` de listeners do
   `subscribeTrips` é módulo-level, compartilhado pelo arquivo inteiro; um listener
   vazado dispararia `setState` fantasma no teste seguinte.

`console.warn` é mockado — o store avisa de propósito em vários caminhos testados, e em
5 casos o spy **é** a asserção.

### Cobertura por função

| Função | Casos |
|---|---|
| `listTrips` | 7 — vazio, `{}`, `null`, string, JSON corrompido, entradas inválidas, normalização de `days` crus |
| `getTrip` | 2 |
| `getActiveTrip` | 4 — inclui "futura vence a última" e "passada cai para a última" |
| `addTrip` | 2 — inclui read-modify-write |
| `updateTrip` | 3 — inclui **o teste-chave** |
| `deleteTrip` | 2 — inclui a limpeza do `kinu_price_history_<id>` |
| `clearTrips` | 1 — históricos órfãos somem, `kinu_user` fica |
| `subscribeTrips` | 3 |
| `getPriceHistory` | 2 |
| `pushPriceSnapshot` | 2 — inclui o teto de 10 |

`normalizeTrip` (a 12ª) é exercitada de lado no caso de normalização.

### O teste-chave

É o que prova a razão de o store existir — a "regra de ouro" da §3 da fase 1a:

```ts
it('não reconstrói as outras viagens: escrita externa em B sobrevive a um update em A', ...)
```

Cria A e B, deixa **outro caminho de escrita** alterar B direto no storage, chama
`updateTrip('a', ...)` e verifica que a edição em B sobreviveu — inclusive o
`outboundFlight`, que é o campo com 5 leitores que o `SavedTrip` não declara (recon §4.6).
Se a `StoredTrip` algum dia parar de preservar campos extras na travessia, este teste cai.

### O que os testes **não** provam

- Não renderizam componente nenhum — provam o store, não a migração da Parte 2.
- **Multi-aba não tem cobertura.** O evento `storage` do jsdom não cruza contextos, então
  `handleStorageEvent` fica sem teste. Declarado, não escondido.
- `QuotaExceededError` não é coberto — decisão 1 da §7 da 1a: o erro propaga de propósito.

---

## 3. A migração

Padrão idêntico nos três que assinam. `subscribeTrips` devolve o próprio `unsubscribe`,
então ele já serve de cleanup do `useEffect`:

```tsx
useEffect(() => {
  const load = () => setX(listTrips());
  load();
  return subscribeTrips(load);
}, []);
```

**A partir desta fase o listener de `window` passa a existir de verdade pela primeira vez** —
na 1a ele nascera com zero assinantes (§7 decisão 6).

### Ganhos concretos, por arquivo

- **`Cla.tsx`** — a heurística de "viagem ativa" sai do arquivo. O `try/catch { /* ignore */ }`
  sai junto: era exatamente ele que fazia a `/cla` **degradar em silêncio** com storage torto
  (recon §4.3). Agora o store avisa no console e devolve `[]`.
- **`Dashboard.tsx`** — o sino ficou em `useEffect` **separado** de propósito: o efeito
  original depende de `user`/`authLoading`/`navigate` e re-assinaria a cada mudança de auth.
  **Ganho colateral:** `localTrips` passa a vir normalizado — hoje o Dashboard lia cru
  (recon §4.5), então viagem criada pelo chat e nunca aberta na `/viagens` chegava sem
  `days[].title`/`icon`. A fusão com o Supabase não mudou.
- **`Conta.tsx`** — **corrige um crash real.** `Conta.tsx:27` faz `savedTrips.map(...)`
  fora de try/catch (alvo nomeado do recon §4.3): storage torto derrubava a `/conta`.
  `listTrips()` nunca lança e sempre devolve array.
- **`FeedbackButton.tsx`** — mata a duplicação literal do recon §2.5
  (`Cla.tsx:81-83` ≡ `FeedbackButton.tsx:25-27`). A heurística existe em um lugar só agora.

### `loadJson`: onde saiu e onde ficou

| Arquivo | Import |
|---|---|
| `Cla.tsx` | **removido** — era o único uso |
| `Dashboard.tsx` | **removido** — era o único uso |
| `Conta.tsx` | **fica** — ainda serve `kinu_user` (:19) e `kinu_feedback` (:135) |
| `FeedbackButton.tsx` | **fica** — ainda serve `kinu_feedback` (:106) |

---

## 4. O sino: quem assina, e a decisão que mudou

| Arquivo | Assina? | Por quê |
|---|---|---|
| `Cla.tsx` | ✅ | Exibe lista (`myTrips`) **e** estado (`activeTrip`) |
| `Dashboard.tsx` | ✅ | É onde o funil de criação aterrissa |
| `FeedbackButton.tsx` | ✅ | **mudança vs. o plano original da missão** — ver abaixo |
| `Conta.tsx` | ❌ | Deliberado — ver abaixo |

### Por que o `FeedbackButton` virou obrigatório

`src/App.tsx:74` monta o `<BetaFeedbackWrapper />` **fora do `<Routes>`**. Consequência:
o componente monta uma vez ao sair da `/` e **nunca mais desmonta**. O `useEffect(..., [])`
dele não era "leitura a cada abertura do diálogo" — era **uma leitura por sessão inteira**.
Abrir e fechar o diálogo não relia nada.

Isso inverte o palpite: o `FeedbackButton` era **o mais stale dos quatro, não o menos**.
Sem assinar, quem cria viagem pelo chat e depois manda feedback anexa a viagem **anterior** —
contexto errado num canal de bug report, que é justamente onde isso mais custa. Custou 2 linhas.

### Por que a `Conta` **não** assina

É rota dentro do `<Routes>` → desmonta e remonta a cada visita, então **toda entrada na
`/conta` já é releitura fresca**. A única janela restante seria criar viagem pelo chat global
enquanto parado na `/conta` e esperar os 3 contadores mexerem sozinhos — estatística, não
superfície de decisão. Assinar exigiria quebrar o efeito atual em dois (ele mistura guarda de
auth + `navigate` + leitura) para ganho não observável.

**Reversível em 3 linhas**, é o mesmo padrão da §3.

---

## 5. ⚠️ O que esta fase NÃO resolve

**O bug reproduzido em produção — viagem criada pelo KINU AI não aparece na `/viagens` sem
F5 — continua vivo depois desta fase.**

Por quê: a `/viagens` é `Viagens.tsx`, arquivo **proibido nesta fase** (é a 1d). Ele segue
com as 18 operações de storage próprias, sem `listTrips` e sem `subscribeTrips`. Nada do que
entrou aqui toca nele.

O que a 1b entrega de verdade sobre esse bug:

- O **mecanismo** que o resolve (`subscribeTrips`) saiu do papel e roda em 3 telas — antes
  tinha zero assinantes e zero cobertura de teste.
- **`/cla` e `/dashboard` param de precisar de F5.** Criar viagem pelo chat estando no
  Dashboard faz o card aparecer sozinho.
- A **perda silenciosa** do recon §4.2 (viagem some quando a `/viagens` regrava) **não foi
  tocada** — depende de o `updateTrip` substituir as escritas da `Viagens`, que é a 1d.

---

## 6. Verificação

| Gate | Resultado |
|---|---|
| `tsc --noEmit` | ✅ exit 0, zero erros |
| `vitest run` (suíte inteira) | ✅ **34/34** em 3 arquivos (28 novos) |
| `npm run build` | ✅ built in 21.70s |
| `eslint src` | 230 erros vs. **236 na baseline** → **−6** |

Os 230 são o passivo pré-existente de `no-explicit-any` do projeto, não gate ativo. A queda
de 6 vem dos `any` removidos na migração; o arquivo de teste novo entrou **sem nenhum `any`**
(o cast de fixture parcial está isolado num helper único, `fixture()`).

---

## 7. Conformidade de escopo

**Não tocados, conforme a proibição da fase:** `Viagens.tsx`, `KinuAIContext.tsx`,
`NewPlanningWizard.tsx`, `GeneratedItineraryStage.tsx`, `src/data/`, `src/lib/hotelZones.ts`,
`src/lib/michelinData.ts`, `src/types/trip.ts`, `src/lib/tripStore.ts`.

**Próxima fase (1c/1d):** os consumidores de escrita — é onde a perda silenciosa do §4.2
e o bug da `/viagens` efetivamente morrem.
