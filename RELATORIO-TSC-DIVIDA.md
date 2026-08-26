# RELATÓRIO — Dívida do tsc paga

## Os 6 erros que quebravam o build do Lovable

**Data:** 2026-08-26
**Escopo:** `src/components/cockpit/GeneratedItineraryStage.tsx` + `package.json`
(+ `package-lock.json` regenerado pelo npm). **Três arquivos, nada além deles.**
**Base:** `RELATORIO-F3-ARCO5B.md`, adendo de 25/ago — "Build unsuccessful", 6 erros.
**Commit:** `2122dbf`
**Regra da casa respeitada:** sem `amend`, sem `force`. Este relatório vai em
commit `docs:` separado.

---

## 0. Veredicto em cinco linhas

1. **Baseline morreu.** `npx tsc --noEmit -p tsconfig.app.json` → **zero erros**.
   Os 4 herdados da 3ª e os 2 novos, todos pagos.
2. Os erros 1–4 eram **um bug de tipo só**, em duas linhas: `trip.finances || {}`
   fazia o TS inferir a união `TripFinances | {}`.
3. Os erros 5–6 **não eram import errado**. O import estava correto o tempo todo.
   Faltava declarar `@testing-library/dom`, peer dependency obrigatória da RTL v16.
4. Isso explicava a assimetria que ninguém tinha fechado: **4 erros aqui, 6 no
   Lovable.** Causa provada por reprodução (§2.2), não por hipótese.
5. ⚠️ **O `bun.lock` continua sem a entrada.** Ver §5 — é a parte que importa
   deste relatório.

---

## 1. Erros 1–4 — tipo, não comportamento

`GeneratedItineraryStage.tsx`, dentro de `recomputeAndPersistFinances`:

```ts
const prevFinances = trip.finances || {};        // 1098
const prevCats = prevFinances.categories || {};  // 1099
...
const total = trip.budget || prevFinances.total || totalPlanned;  // 1106
```

`trip.finances` é `TripFinances` em `src/types/trip.ts:145` — **não-opcional**.
O `|| {}` é guarda defensiva contra drafts antigos no localStorage gravados sem
o bloco `finances`: o tipo dizia que isso nunca acontece, o runtime sabia que
acontece.

Para o TS, `A || B` produz a **união** dos dois lados, e com
`strictNullChecks: false` ele não descarta `{}` como galho morto:

```
typeof prevFinances  =  TripFinances | {}
```

Daí `Property 'total' does not exist on type '{}'` — mensagem que engana, porque
aponta o membro que quebrou, não a variável. Mesma mecânica nas 4 linhas.

### Patch aplicado

```diff
 import { updateTrip } from '@/lib/tripStore';
+import type { TripFinances } from '@/types/trip';

-          const prevFinances = trip.finances || {};
-          const prevCats = prevFinances.categories || {};
+          const prevFinances: Partial<TripFinances> = trip.finances || {};
+          const prevCats: Partial<TripFinances['categories']> = prevFinances.categories || {};
```

Três linhas. `Partial<T>` porque **é a verdade**: a guarda existe justamente
porque o objeto pode chegar incompleto, e o tipo passou a dizer o que o código
já assumia. Um `as TripFinances` mentiria — afirmaria campos que podem faltar.

`TripFinances['categories']` é indexed access: nenhum tipo novo criado,
`src/types/trip.ts` **não foi tocado**. Sem `any`, sem `@ts-ignore`, **zero
linhas de runtime alteradas** — o `||` avalia igual e o objeto persistido é
byte-a-byte o mesmo.

---

## 2. Erros 5–6 — o import estava certo

### 2.1 O que realmente faltava

```ts
import { render, screen, fireEvent } from "@testing-library/react";
```

Uso canônico da RTL v16, e é para funcionar. A v16 **não** moveu
`screen`/`fireEvent` para fora — ela os re-exporta, como está na declaração
instalada (`@testing-library/react/types/index.d.ts`):

```ts
export * from '@testing-library/dom'
```

O que a v16 mudou foi a **instalação**: `@testing-library/dom` deixou de ser
dependência e virou **peer dependency** que o projeto tem que declarar. E no
`package.json` deste repo ela não estava — nem em `dependencies`, nem em
`devDependencies`.

Sem o pacote, o `export *` não resolve. E com `skipLibCheck: true` (ligado no
`tsconfig.app.json`) o TS **não reclama** do módulo sumido dentro do `.d.ts` —
ele silenciosamente re-exporta nada. Por isso o erro acusava 2 dos 3 nomes da
mesma linha: `render` sobrevive porque é declarado no próprio arquivo da RTL.

### 2.2 Por que 4 erros aqui e 6 no Lovable — a prova

O `node_modules` local veio do `package-lock.json`, que **tem** a peer resolvida.
O `bun.lock` **não tem** — nem a entrada do pacote, nem a peer listada na entrada
da RTL:

```
$ grep '"@testing-library/dom": \[' bun.lock
                          ← nenhuma linha
```

Um lockfile só instala o que lista. Escondendo o pacote, o compilador cuspiu
**os 6 erros do relatório, nas linhas e colunas exatas**:

```
$ mv node_modules/@testing-library/dom /tmp/tl-dom-hidden
$ npx tsc --noEmit -p tsconfig.app.json
GeneratedItineraryStage.tsx(1099,41): error TS2339: Property 'categories' does not exist on type '{}'.
GeneratedItineraryStage.tsx(1106,53): error TS2339: Property 'total' does not exist on type '{}'.
GeneratedItineraryStage.tsx(1107,42): error TS2339: Property 'confirmed' does not exist on type '{}'.
GeneratedItineraryStage.tsx(1108,40): error TS2339: Property 'bidding' does not exist on type '{}'.
flight-fallback.test.tsx(8,18): error TS2305: Module '"@testing-library/react"' has no exported member 'screen'.
flight-fallback.test.tsx(8,26): error TS2305: Module '"@testing-library/react"' has no exported member 'fireEvent'.
$ mv /tmp/tl-dom-hidden node_modules/@testing-library/dom     ← restaurado
```

Causa fechada. Isso também data a dívida: os "2 novos" nasceram no commit
`afe7b34`, que introduziu `flight-fallback.test.tsx` — o primeiro teste do repo
a usar `screen`/`fireEvent`.

### 2.3 Patch aplicado

```diff
   "devDependencies": {
+    "@testing-library/dom": "^10.4.1",
     "@testing-library/jest-dom": "^6.6.0",
```

`^10.4.1` = a versão que **já estava instalada e já rodando**, e que já satisfaz
o range `^10.0.0` da peer. Nada mudou aqui: mesmo pacote, mesmos 120 testes,
mesmo binário. O que muda é o Lovable passar a instalá-lo.

Isto encostou em `package.json`, fora da lista original de arquivos liberados.
**Exceção registrada e aprovada:** é literalmente o passo de migração
documentado da RTL v16, e não havia como pagar os erros 5–6 sem ele. Trocar o
import não resolveria — `import { screen } from "@testing-library/dom"` falharia
igual no Lovable, e pior, viraria TS2307 (módulo não encontrado).

**`src/test/flight-fallback.test.tsx` não foi tocado.** O arquivo nunca teve
defeito; consertou-se a dependência, não o teste.

O `package-lock.json` mudou só o esperado: a entrada nova em `devDependencies` e
a queda do flag `"peer": true` na subárvore que agora é dependência direta.
Nenhuma versão trocou, nada foi removido.

---

## 3. Verificação

```
$ npx tsc --noEmit -p tsconfig.app.json
$                                          ← saída vazia: ZERO erros

$ npx vitest run
 ✓ src/test/tripHydration.test.ts    (22 tests)
 ✓ src/test/tripSync.test.ts         (22 tests)
 ✓ src/test/flight-fallback.test.tsx  (5 tests)
 ✓ src/test/tripAdoption.test.ts     (17 tests)
 ✓ src/test/session.test.ts          (13 tests)
 ✓ src/test/tripStore.test.ts        (31 tests)
 ✓ src/test/tripIdMigration.test.ts   (9 tests)
 ✓ src/test/example.test.ts           (1 test)
 Test Files  8 passed (8)
      Tests  120 passed (120)

$ npm run build
 ✓ 4400 modules transformed.
 ✓ built in 24.24s
```

**tsc zero, 120/120, build ok.** Os 5 testes de `flight-fallback` passam iguais
— mesma contagem, mesmas asserções, arquivo intocado.

---

## 4. Saída do push

```
$ git push origin main
To https://github.com/PedroContrucci/kinus-clan-compass
   bdbd65a..2122dbf  main -> main
```

Commit `2122dbf` — `fix: paga divida do tsc - tipos do GeneratedItineraryStage +
peer dependency do testing-library (6 erros, build do Lovable verde)`.
Fast-forward de `bdbd65a`. Sem `amend`, sem `force`.

Três arquivos, `+8 −17`:

| arquivo | mudança |
|---|---|
| `src/components/cockpit/GeneratedItineraryStage.tsx` | 1 import + 2 anotações |
| `package.json` | 1 linha em `devDependencies` |
| `package-lock.json` | entrada nova + flags `peer` caídos |

---

## 5. ⚠️ O que isto NÃO fechou — o `bun.lock`

**Não declare vitória até o build de lá ficar verde.** Mesma ressalva do arco 5.b.

O `tsc` zerou aqui porque o pacote já estava no `node_modules`. A prova de que o
Lovable fica verde é a declaração nova no `package.json` **mais** o install de lá
fazer o download. E os lockfiles alternativos continuam atrasados:

| lockfile | estado |
|---|---|
| `package-lock.json` | ✅ atualizado neste commit |
| `bun.lock` | ❌ **sem a entrada** — `bun` não está instalado neste ambiente |
| `bun.lockb` | ❌ binário de 28/jul, mais velho que o próprio `bun.lock` |

Decisão tomada (opção **a**): mexer só no `package.json` + `package-lock.json`.
Escrever à mão as **7** entradas que faltariam no `bun.lock`
(`@testing-library/dom@10.4.1` mais `@babel/code-frame`, `@types/aria-query`,
`lz-string`, `pretty-format@27`, e `aria-query@5.3.0` / `dom-accessibility-api@0.5.16`
em versões que conflitam com as já presentes) **sem poder validar com o bun**
seria pior que deixar o lock atrasado.

Os dois cenários, e por que nenhum é silencioso:

- Se o Lovable roda `bun install` normal → ele resolve a dep nova e atualiza o
  lock sozinho. **Encerrado.**
- Se roda `--frozen-lockfile` → o install **falha em voz alta**. Não gera build
  errado, não passa despercebido.

**Próximo passo, se quiser fechar de vez:** rodar `bun install` numa máquina com
bun e commitar o `bun.lock` resultante. Aí o lock sai correto e verificado, em
vez de escrito no escuro.

---

## 6. Fronteiras respeitadas

Confirmado por leitura, não por suposição:

- `src/types/trip.ts` — **intacto**. `TripFinances` é só lido via `import type`.
- `src/data/`, `hotelZones`, `michelinData` — **não tocados**.
- `src/test/flight-fallback.test.tsx` — **não tocado**.
- Runtime — **zero linhas**. Os dois patches são anotação de tipo e declaração
  de dependência.
