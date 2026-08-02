# Relatório — Camada de hotéis curados no agente (piloto H1)

**Data:** 2026-08-01
**Escopo:** leitura simples — plugar `curated_hotels` (Cartagena + Gramado) no contexto do agente.

## O que entrou

| # | Arquivo | Mudança |
|---|---|---|
| 1 | `src/data/curatedHotels.ts` | **novo** — 20 hotéis (10 Cartagena + 10 Gramado), gerados do banco |
| 2 | `scripts/sync-hotels.ts` | **novo** — gerador banco → app, espelho do `sync-catalog.ts` |
| 3 | `src/contexts/KinuAIContext.tsx` | anexa `hotels` ao payload `curatedCatalog` |
| 4 | `supabase/functions/kinu-ai/index.ts` | seção final `🏨 HOTÉIS CURADOS` no bloco CATÁLOGO |

### 1) `src/data/curatedHotels.ts`

Tipo `CuratedHotel` + `export const curatedHotels: Record<string, CuratedHotel[]>`, com a chave
sendo o nome da cidade como em `CURATED_CITIES`. Helper `getCuratedHotels(city)` devolve `null`
para cidade sem curadoria — é o que faz a seção sumir do prompt em Paris, Salvador etc.

Os dados foram lidos do banco **agora** (`curated_hotels`, `status='published'`, `order=id.asc`)
e escritos no arquivo, como o `sync-catalog` faz com as atividades. Cobertura de persona nas duas
cidades: `family`, `couple` e `solo` todas presentes, em faixas de `budget` a `resort`.

### 2) `scripts/sync-hotels.ts`

Não foi pedido, mas é o que **gerou** o arquivo — sem ele o próximo refresh vira trabalho manual.
Mesmas convenções do `sync-catalog.ts`: lê `.env.sync`, valida ids duplicados, escreve o arquivo e
roda `tsc --noEmit` no fim.

```
npx tsx scripts/sync-hotels.ts                 # piloto H1 (Cartagena + Gramado)
npx tsx scripts/sync-hotels.ts Cartagena Gramado Paris
```

O arquivo gerado é marcado `// GERADO por scripts/sync-hotels.ts — não edite à mão.`

### 3) Payload (`KinuAIContext`)

`buildCuratedHotels(city)` monta a lista e ela viaja **dentro** de `curatedCatalog`:

```ts
curatedCatalog: { city, items, hotels }   // hotels: undefined quando a cidade não tem curadoria
```

> **Nomes dos campos:** você listou `persona_tags` / `price_range_brl` (as colunas do banco). No
> payload usei **camelCase** (`personaTags`, `priceRangeBRL`) para bater com o que já trafega ali
> (`costBRL`, `tip`, `neighborhood`). Se preferir snake_case no contrato da edge, é troca de duas
> linhas nos dois lados.

### 4) Seção no prompt (edge function)

Entra **depois** de `📍 OUTROS`, como última seção do bloco CATÁLOGO. Formato:

```
🏨 HOTÉIS CURADOS
Estes são os ÚNICOS hotéis que você pode recomendar em Cartagena — nunca invente outro nome.
Recomende pela persona da viagem (família / casal / solo), usando as personas marcadas em cada
hotel, e respeite a faixa de preço do usuário. Sempre ofereça uma alternativa de troca DENTRO
desta lista.
- Sofitel Legend Santa Clara (Centro Histórico, resort, R$ 2.500-4.500, family/couple) — Convento do século XVII virado lenda…
- Life is Good Hostel (Getsemaní, budget, R$ 80-200, solo) — O hostel querido de Getsemaní…
```

Sanitização no mesmo padrão dos itens: cap de 30 hotéis, `sanitizeText` em todo campo, até 5
personas e 2 tips por hotel. Custo no prompt: **~1.9 kB** por cidade (1902 Cartagena / 1877 Gramado).

## Validação

| Verificação | Resultado |
|---|---|
| `npx tsc -p tsconfig.app.json --noEmit` | ✅ OK |
| `npx vitest run` | ✅ 1/1 |
| Parse da edge function (esbuild, não coberta pelo tsc) | ✅ exit 0 |
| Render da seção com os dados reais | ✅ 20 hotéis, 2 cidades |
| Cidade sem curadoria (Paris) | ✅ `hotels` omitido, seção não aparece |

## ⚠️ Redeploy da edge é manual — agora via Supabase CLI

A mudança em `supabase/functions/kinu-ai/index.ts` **não vale em produção só com o push**. Até o
redeploy, o app manda `hotels` no payload e a função antiga simplesmente ignora o campo (degrada sem
quebrar, mas sem a seção de hotéis).

> **Atualização (02/08):** ficou provado que o Lovable **não** estava deployando a versão atual da
> `kinu-ai` — sonda em produção respondeu `SEM_HOTEIS_NO_CONTEXTO` recebendo o campo `hotels`. O
> deploy das edge functions passou para a Supabase CLI. Ver `RELATORIO-DEPLOY-EDGE.md`.

## Notas para o próximo lote (H2)

- **Só leitura.** O agente recomenda e propõe troca em texto; não há ferramenta estruturada de
  hotel. `confirmar_item({tipo:'hotel'})` já existe e não foi tocada.
- **`gra-h-gramado-hostel`** está com `notes: 'H1 · VERIFICAR nome/operação'` no banco e mesmo assim
  `status='published'` — vale confirmar antes de escalar a curadoria.
- Colunas `place_id` / `google_rating` / `google_reviews` / `auto_check` estão **todas nulas** nas 20
  linhas; quando forem preenchidas, dá pra exibir corroboração externa.
