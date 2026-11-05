# RELATÓRIO M19a-2 — languageCode na URL do Place Details (horarios)

## O que mudou
`kinu-beta/functions/quick-endpoint/index.ts`, função `placeHorarios`:
- Removido o header `X-Goog-Language-Code: pt-BR`.
- Idioma passado na URL: `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=pt-BR`.
- Mais nada tocado (2 linhas alteradas).

## Verificação
- Não rodados nesta missão (correção pontual pedida): vitest, tsc, build, eslint.
- Intocáveis (`src/data/*`, `hotelZones.ts`, `michelinData.ts`, `types/trip.ts`) não tocados.

## Observação
- `RECHECK_FIELDS` (linha ~610 do mesmo arquivo) ainda usa o header `X-Goog-Language-Code`; fora do escopo, não alterado.

## Redeploy (Lovable)
Function tocada: `quick-endpoint`. Arquivos: `kinu-beta/functions/quick-endpoint/index.ts`. Nenhum arquivo em `_shared/`.

## Commit e push do fix
Commit: `fix(enrich): languageCode na URL do Place Details (horarios)`

```
To https://github.com/PedroContrucci/kinus-clan-compass
   f52155a..d8a8e5d  main -> main
```
