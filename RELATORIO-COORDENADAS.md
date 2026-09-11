# RELATÓRIO — Coordenadas curadas: a Rota do Dia sem geocoding em runtime

## O que mudou

A precedência do mapa passou a ser **coordenada curada (Google Places, por id) >
`ATTRACTION_COORDS` (manual, por nome) > Nominatim**. Casamento por id porque nome é texto de tela.

| Arquivo | O quê |
|---|---|
| `src/data/generated/coords.ts` | novo, **vazio** — a ponte `lat`/`lng` → runtime |
| `src/lib/routeCoords.ts` | novo — `curatedCoordOf` e `resolveStopCoord` |
| `cockpit/DailyRouteMap.tsx` + `pages/Viagens.tsx` | `activities` aceita `id?`; nova prop `hotelId` (o `curatedHotelId`); o `geocode` virou `geocodeByName`, o fallback |
| `scripts/sync-catalog.ts` | `--apply` emite `coords.ts`; lê `curated_hotels` só para isso |
| `supabase-beta/ENRICH-COORDS.md` | novo — SQL, enrich e o "modo coords" |

`SuggestedActivity` intocado, `destinationActivities.ts` byte-idêntico, `curatedHotels.ts` só
leitura (segue escrito só pelo `sync-hotels.ts`).

## O que o banco desmentiu, medido antes de escrever código

`curated_activities`: 901 published, **325 com `place_id`** (36%). `curated_hotels`: 68 published,
**0 com `place_id`**. `lat`/`lng` não existiam em nenhuma das duas.

**O Gran Marquise não saiu do lugar hoje** — o enrich nunca passou pelos hotéis, então não há
coordenada para ele existir. Este arco entrega o caminho pronto e provado; a correção aparece
quando o §3 do `ENRICH-COORDS.md` rodar. Dizer o contrário seria um patch com cara de conserto.

## Decisões

- **Arquivo gerado, não campo no literal.** `lat:` dentro do array tipado é erro de
  excess-property no `tsc`, não "campo por fora do tipo" — não há index signature ali. Precedente:
  o `landmarkTiers.ts`. Coordenada é geometria, como tier é classificação.
- **Sem guarda de piso no `coords.ts`.** A cobertura nasceu em 0 e cresce a cada enrich; um piso
  de 80% abortaria todo run legítimo. No lugar dela, a contagem impressa no `--apply`.
- **Aborta o sync:** meia coordenada, valor não numérico, fora de faixa, `0,0` (golfo da Guiné —
  é enrich que falhou, não lugar) e id nas duas tabelas. Coluna faltando vira `die()` com o SQL
  na mensagem, não o `42703` cru do PostgREST.

## Proposta para o `quick-endpoint`: modo coords

O enrich de hoje trabalha sobre a fila de revisão — deixa de fora os 64% sem `place_id` e os 68
hotéis, que são os lugares que o mapa desenha. Payload `{ city, mode: 'coords' }`: varre
`published` **com `lat` nula** (o critério é a coordenada faltando, não `needs_review`), resolve
por **Place Details** quando há `place_id` — uma chamada, exata — e por **text search** de
`nome + cidade` quando não, gravando o `place_id` junto para nunca precisar de um segundo.
Responde `{ processadas, por_place_id, por_busca, sem_resultado }`. Por cidade, para o custo do
Places ficar visível: 21 chamadas cobrem tudo. Detalhes no §3 do `ENRICH-COORDS.md`.

## Gates

`npx vitest run` → **427 passed** (29 arquivos; eram 418/28) · `tsc -p tsconfig.app.json --noEmit`
limpo · `npm run build` ok · eslint sem problema novo: arquivos novos zerados, `Viagens.tsx` nos
mesmos 40 de antes, `DailyRouteMap.tsx` no mesmo `prefer-const` pré-existente (linha 169 → 178).

Os 9 testes novos provam precedência **contando chamadas do fallback**, não só valores: com
coordenada curada o Nominatim não é chamado; sem ela, é chamado uma vez. Mais a trava de deriva
do artefato, que confere offline que todo id de `coords.ts` ainda existe em `src/data/`.

## Deploy

Nenhuma edge function deste repo foi tocada — **não há prompt de redeploy**. O que falta é do
fundador: SQL do §1 → enrich §2/§3 (`quick-endpoint`, kinu-beta) → `sync-catalog.ts --apply` →
commit do `coords.ts` → **Publish**.

## Push

```
$ git push origin main
To https://github.com/PedroContrucci/kinus-clan-compass
   ba98afc..b3c5629  main -> main
```
