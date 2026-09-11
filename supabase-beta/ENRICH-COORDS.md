# ENRICH-COORDS — as coordenadas curadas, do Google Places até a Rota do Dia

O que este arquivo resolve: a Rota do Dia geocodificava cada parada por **texto** no Nominatim,
em runtime. O Gran Marquise, que fica na Beira-Mar do Mucuripe, era desenhado seis quadras para
dentro do Meireles. Buscar um nome num índice mundial devolve o lugar mais parecido, não o lugar
certo — e o mais parecido erra em silêncio, com a mesma cara de acerto.

O app já sabe usar a coordenada curada quando ela existe (`src/lib/routeCoords.ts`). Falta o
banco tê-la. São três passos, nesta ordem.

## Estado no dia em que este arquivo entrou (11/set/2026, medido)

| Tabela | `published` | com `place_id` | com `lat`/`lng` |
|---|---|---|---|
| `curated_activities` | 901 | 325 (36%) | coluna não existia |
| `curated_hotels` | 68 | **0** | coluna não existia |

O enrich nunca passou pelos hotéis. É por isso que o passo 3 importa tanto quanto os outros:
sem ele, o Gran Marquise continua exatamente onde estava.

## Passo 1 — as colunas (SQL Editor do painel do kinu-beta)

```sql
alter table curated_activities add column if not exists lat double precision;
alter table curated_activities add column if not exists lng double precision;
alter table curated_hotels     add column if not exists lat double precision;
alter table curated_hotels     add column if not exists lng double precision;
```

`double precision` e não `numeric`: coordenada é medida, não dinheiro. Duas colunas e não um
`point`/PostGIS: o consumidor é um `Record<string, {lat, lng}>` no cliente, e uma extensão
geoespacial aqui seria peso sem uso.

Enquanto elas não existirem, `npx tsx scripts/sync-catalog.ts` aborta com este SQL na mensagem
e não escreve byte nenhum — o 400 do PostgREST é `42703, column ... does not exist`.

## Passo 2 — o enrich grava a coordenada junto com o `place_id`

Na function `quick-endpoint` (kinu-beta), no mesmo ponto em que hoje ela grava `place_id` e
`google_address`, gravar `lat` e `lng` da **mesma resposta**. Nunca de uma segunda chamada: duas
consultas ao Places podem devolver dois lugares diferentes para o mesmo nome, que é literalmente
o bug que estamos consertando.

**Places API (New)** — o `fieldMask` precisa pedir a localização:

```
X-Goog-FieldMask: places.id,places.displayName,places.formattedAddress,places.location
```
```ts
const p = data.places?.[0];
const lat = p?.location?.latitude ?? null;
const lng = p?.location?.longitude ?? null;
```

**Places API legada** — `fields=place_id,name,formatted_address,geometry`:

```ts
const r = data.results?.[0] ?? data.result;
const lat = r?.geometry?.location?.lat ?? null;
const lng = r?.geometry?.location?.lng ?? null;
```

E no mesmo `update` do `place_id`:

```ts
await supabase.from(table).update({ place_id, google_address, lat, lng }).eq('id', id);
```

Duas regras que o `sync-catalog.ts` cobra depois, e por isso é melhor cobrar aqui:

- **Nunca gravar meia coordenada.** Ou os dois campos, ou nenhum. `lat` sem `lng` aborta o sync.
- **Nunca gravar `0,0`.** É o golfo da Guiné. Quando o Places não achar o lugar, deixar nulo —
  nulo é "ainda não sei", zero é uma mentira precisa. O sync também aborta nesse caso.

## Passo 3 — o "modo coords": varrer o que ficou para trás

O enrich de hoje trabalha sobre a fila de revisão. Isso deixa de fora os 64% de atividades
`published` sem `place_id` e os 68 hotéis — que são justamente os lugares que o mapa desenha.
A proposta é um modo novo, disparado por payload:

```jsonc
{ "city": "Fortaleza", "mode": "coords" }   // opcional: "table": "curated_hotels"
```

Comportamento:

1. Seleciona de `curated_activities` **e** `curated_hotels` as linhas `status = 'published'`
   da cidade **com `lat` nula** — o critério é a coordenada faltando, não `needs_review`.
2. Para cada uma: se já tem `place_id`, resolve por **Place Details** (uma chamada, exata, sem
   risco de casar com outro lugar). Se não tem, faz **text search** por `name + ', ' + city`
   com `locationBias` na cidade, e grava `place_id` junto — assim a linha nunca precisa de um
   segundo text search na vida.
3. Grava `lat`, `lng` e, quando vier da busca, `place_id` e `google_address`.
4. Responde com o que fez: `{ processadas, resolvidas_por_place_id, resolvidas_por_busca,
   sem_resultado }`. Sem número devolvido, não há como saber se a varredura valeu a pena.

Rodar por cidade (não tudo de uma vez) mantém o custo do Places visível e o timeout da function
longe. As 21 cidades curadas cabem em 21 chamadas.

## Passo 4 — trazer para o app

```bash
npx tsx scripts/sync-catalog.ts            # dry-run: imprime a cobertura, não escreve
npx tsx scripts/sync-catalog.ts --apply    # escreve src/data/generated/coords.ts
```

O `--apply` imprime `coords.ts: N/901 atividades (X%), M/68 hotéis (Y%) com coordenada`. Depois:
commit do arquivo gerado e **Publish** pelo botão do Lovable — sem Publish, o mapa em produção
segue com a coordenada anterior.

Não há guarda de piso no `coords.ts`, ao contrário do catálogo: a cobertura nasceu em 0 e cresce
a cada rodada de enrich, então um piso de 80% abortaria todo run legítimo. O que substitui a
guarda é a contagem impressa — e a trava de deriva em `src/test/routeCoords.test.ts`, que confere
offline que todo id do artefato ainda existe em `src/data/`.
