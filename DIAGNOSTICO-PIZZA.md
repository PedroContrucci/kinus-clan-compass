# Diagnóstico — KINU AI lê o catálogo antigo do Rio (falta a pizzaria Ferro e Farinha)

**Sintoma:** o KINU AI recomenda a partir de um catálogo desatualizado do Rio de Janeiro
e não conhece `rio-ferro-farinha` (Ferro e Farinha), mesmo após o commit
"Updated rioActivities to 62".

**Veredito:** o código-fonte `.ts` está **correto**. O bug é um artefato obsoleto
`src/data/destinationActivities.js` que **sombreia** (shadow) o `.ts` na resolução de
módulos do Vite. O bundle carrega o `.js` antigo (28 atividades do Rio, sem
ferro-farinha) em vez do `.ts` novo (62 atividades, com ferro-farinha).

---

## Verificações pedidas — todas OK no `.ts`

As três hipóteses originais foram confirmadas como **corretas**; nenhuma delas é a causa.

### 1. `rioActivities` tem 62 entradas e inclui `rio-ferro-farinha` ✅
- `src/data/destinationActivities.ts:6200` — `const rioActivities: SuggestedActivity[]`
  com **62** entradas (`id: 'rio-'` de 6201 a 6324).
- `rio-ferro-farinha` presente em `src/data/destinationActivities.ts:6267` — é a
  entrada **#34** de 62.

```ts
// src/data/destinationActivities.ts:6267
{ id: 'rio-ferro-farinha', name: 'Ferro e Farinha', category: 'dinner', neighborhood: 'Catete', rating: 4.7, estimatedCostBRL: 90, durationHours: 2, tips: [/* ... */], styleTags: ['gastronomy'] },
```

### 2. O registry aponta 'Rio de Janeiro' → `rioActivities` ✅
```ts
// src/data/destinationActivities.ts:6327
export const destinationActivities: Record<string, DestinationData> = {
  // ...
  // src/data/destinationActivities.ts:6433
  'Rio de Janeiro': {
    cityName: 'Rio de Janeiro',
    // ...
    activities: rioActivities,   // :6436
  },
```

### 3. `KinuAIContext.tsx` resolve a chave e injeta o catálogo no agente ✅
```ts
// src/contexts/KinuAIContext.tsx:6
import { destinationActivities } from "@/data/destinationActivities";

// src/contexts/KinuAIContext.tsx:22
function buildCuratedCatalog(city: string) {
  const data = destinationActivities[city];        // :23
  if (!data) return null;
  return data.activities.slice(0, 60).map((a) => ({ /* ... */ }));  // :25
}
```
- O catálogo é enviado à edge function `kinu-ai` (`KinuAIContext.tsx:143-155`) e injetado
  no system prompt como "FONTE DA VERDADE" (`supabase/functions/kinu-ai/index.ts:500`).
- `CURATED_CITIES` contém `'Rio de Janeiro'` exato (`src/lib/curatedCities.ts:1`), então
  o catálogo realmente é enviado.
- Ferro-farinha (#34) sobrevive aos dois `slice`: cliente `slice(0, 60)`
  (`KinuAIContext.tsx:25`) e servidor `slice(0, 35)` (`kinu-ai/index.ts:486`).

**Conclusão parcial:** pelo `.ts`, o dado chegaria ao agente. Logo, o "catálogo antigo"
vem de outra fonte.

---

## 🔴 Causa raiz — `.js` obsoleto sombreia o `.ts`

Existe **`src/data/destinationActivities.js`** ao lado do `.ts`. É uma versão antiga
compilada:

| | `.ts` (atual) | `.js` (obsoleto) |
|---|---|---|
| entradas do Rio | **62** | **28** |
| `rio-ferro-farinha` | presente | **ausente** (`grep -c` = 0) |
| export `destinationActivities` | sim (`:6327`) | sim (`.js:6406`) |
| chave `'Rio de Janeiro'` | sim (`:6433`) | sim (`.js:6512`) |
| `getDestinationActivities()` | sim | sim (`.js:6519`) |

Ou seja: o `.js` exporta exatamente a mesma API pública do `.ts`, mas com dados velhos.

### Por que o `.js` vence a resolução

Todos os imports do módulo são **sem extensão**:

```ts
// src/contexts/KinuAIContext.tsx:6
import { destinationActivities } from "@/data/destinationActivities";
```
(idem em `src/pages/Viagens.tsx:33`, `src/lib/itineraryValidator.ts:1`,
`src/lib/createTrip.ts:8-9`, `src/components/cockpit/GeneratedItineraryStage.tsx:29`,
`src/components/cockpit/ActivityDetailDrawer.tsx:5`)

- `tsconfig.json:3` → `"allowJs": true`
- `tsconfig.app.json:13` / `tsconfig.node.json:9` → `"moduleResolution": "bundler"`
- `vite.config.ts:16` define **apenas** o alias `@ → ./src`; **não** sobrescreve
  `resolve.extensions`.
- A ordem padrão de `resolve.extensions` do Vite/esbuild é:
  `['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json']`
  → **`.js` é resolvido ANTES de `.ts`**.

Portanto `@/data/destinationActivities` resolve para o **`.js` antigo (28 atividades do
Rio, sem ferro-farinha)**. O commit "Updated rioActivities to 62" alterou só o `.ts`; o
`.js` velho ficou no repo e é o que o bundle — e portanto o KINU AI — realmente lê.

Isso explica o sintoma exatamente: catálogo do Rio menor e sem Ferro e Farinha.

---

## ✅ Correção recomendada (passo a passo) — NÃO aplicada

### Passo 1 — Confirmar que o `.js` é lixo, não fonte
```bash
grep -c "id: 'rio-" src/data/destinationActivities.js   # 28 (antigo)
grep -c "id: 'rio-" src/data/destinationActivities.ts   # 62 (atual)
grep -rn "destinationActivities\.js" src/               # nenhum import explícito ao .js
```
Nenhum arquivo importa o `.js` explicitamente — todos usam o caminho sem extensão. O `.js`
só existe como artefato acidental.

### Passo 2 — Remover o artefato obsoleto
```bash
git rm src/data/destinationActivities.js
```
Com o `.js` fora, o mesmo import passa a resolver para `destinationActivities.ts` (62
atividades, com ferro-farinha).

### Passo 3 — Evitar recorrência (recomendado)
Escolha uma das opções:

- **(a) `.gitignore`** — impedir que qualquer `.js` gerado em `src/data/` volte ao repo:
  ```
  # .gitignore
  src/data/*.js
  ```
- **(b) Fixar a ordem de resolução** no Vite para o TypeScript ganhar, evitando shadowing
  futuro:
  ```ts
  // vite.config.ts, dentro de resolve: { ... }
  extensions: ['.mts', '.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
  ```
  (Coloca `.ts`/`.tsx` antes de `.js`.)

### Passo 4 — Verificar após a correção
```bash
# o import deve resolver para o .ts com 62 entradas
grep -c "id: 'rio-" src/data/destinationActivities.ts   # 62
```
- Rebuild/reinício do dev server (limpar cache do Vite se necessário:
  `rm -rf node_modules/.vite`).
- Testar no KINU AI: perguntar por pizza/jantar no Rio e confirmar que "Ferro e Farinha"
  aparece.

### Passo 5 (opcional, defeito secundário) — cap de 35 itens
Independente do bug do `.js`, o agente vê no máximo **35** das 62 curadorias, por causa de
dois cortes em sequência:
- cliente: `data.activities.slice(0, 60)` — `src/contexts/KinuAIContext.tsx:25`
- servidor: `cat.items.slice(0, 35)` — `supabase/functions/kinu-ai/index.ts:486`

Como `rioActivities` está ordenado **alfabeticamente por `id`**, o `slice(0, 35)` descarta a
cauda (de `rio-forte-copacabana` em diante). Ferro-farinha (#34) escapa por pouco, mas
outras entradas novas não chegam ao modelo. Se o objetivo é o agente conhecer todo o
catálogo, aumentar/remover esse limite (avaliando o tamanho do payload/prompt).

---

## Resumo

| Item | Estado |
|---|---|
| `rioActivities` no `.ts` (62 entradas + ferro-farinha) | ✅ correto |
| registry `'Rio de Janeiro'` → `rioActivities` | ✅ correto |
| `KinuAIContext` resolve e injeta o catálogo | ✅ correto |
| **`src/data/destinationActivities.js` obsoleto sombreando o `.ts`** | 🔴 **causa raiz** |
| cap de 35 itens no prompt do agente | 🟡 defeito secundário (não é a causa do sintoma) |

**Ação principal:** remover `src/data/destinationActivities.js` e blindar contra
shadowing (Passos 2–3).
