# Relatório — commit e push do fix do voo de volta

**Data:** 2026-08-04
**Relatório anterior:** `RELATORIO-FIX-VOO.md` (o que foi corrigido)
**Diagnóstico de origem:** `DIAGNOSTICO-VOO-VOLTA.md`
**Escopo deste turno:** nenhuma mudança de código. Só verificação, commit e push do que já estava pronto.

## Situação encontrada

O fix descrito em `RELATORIO-FIX-VOO.md` estava **inteiro no working tree, mas nunca commitado**.
`origin/main` ainda apontava para `8319e1e`.

Nada tinha se perdido em rebuild — **nada foi reaplicado**. O `git status` mostrava as três peças do
fix intactas:

| arquivo | estado |
|---|---|
| `src/components/cockpit/FlightSelectionStage.tsx` | modificado (swap da linha 248 + variação de preços) |
| `src/test/flight-fallback.test.tsx` | novo, não rastreado |
| `DIAGNOSTICO-VOO-VOLTA.md` / `RELATORIO-FIX-VOO.md` | novos, não rastreados |

## Verificação antes do commit

```
npx vitest run  →  2 arquivos, 6 testes, todos passando
```

```
✓ src/test/flight-fallback.test.tsx (5 tests) 648ms
✓ src/test/example.test.ts (1 test) 2ms

Test Files  2 passed (2)
     Tests  6 passed (6)
```

Bateu com o 6/6 esperado.

**Ressalva:** o `npx tsc --noEmit` **não** foi rodado neste turno. A verificação de tipos que consta
é a do relatório anterior, não uma confirmada agora.

## O que foi commitado

Commit `afe7b34` — *fix: return flight fallback route swap + fallback variance + regression test*

4 arquivos, 460 inserções, 6 remoções:

- `src/components/cockpit/FlightSelectionStage.tsx`
- `src/test/flight-fallback.test.tsx`
- `DIAGNOSTICO-VOO-VOLTA.md`
- `RELATORIO-FIX-VOO.md`

## Resultado na origin

```
8319e1e..afe7b34  main -> main
```

**`origin/main` = `afe7b34c2ec4212c918a62f55f89f0f717320718`**

Confirmado com `git fetch origin main` + `git rev-parse origin/main` depois do push — o hash local e
o remoto são o mesmo.

## O que ficou de fora (de propósito)

Três arquivos continuam **sem commit** no working tree. São da frente do write-back do catálogo, não
do voo, e por isso não entraram num commit cujo título fala de fallback de voo:

- `scripts/writeback-catalog.ts` — novo, 275 linhas
- `package.json` — adiciona os scripts `sync-hotels` e `writeback-catalog`
- `.gitignore` — adiciona `.writeback-backups/`

Precisam de uma decisão sua: commitar como frente separada ou seguir em aberto.

## Pendências herdadas (não mexidas neste turno)

- **§5.4 do diagnóstico** — códigos de cidade vs. aeroporto (`SAO → RIO` para uma busca `GRU → GIG`).
  É da edge function, fora do escopo "só front".
- `MinimalFlightCard.tsx` / `FlightAnchorCard.tsx` seguem como código morto.
