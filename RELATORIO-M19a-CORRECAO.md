# RELATORIO M19a-CORRECAO — horarios preserva curadoria e pede pt-BR

Data: 2026-11-05 · Commit de código: `7224362` · Arquivo: `kinu-beta/functions/quick-endpoint/index.ts`

## O que mudou (só `handleHorarios` / `placeHorarios`)
1. **Curadoria humana vence.** `base()` agora seleciona `days_of_week`. O update monta `hours_checked_at` + `weekday_descriptions` sempre; `days_of_week` só entra se `row.days_of_week` era null. Se já havia valor, ele é mantido e contado em novo stat `curado_mantido`.
2. **Idioma.** `placeHorarios` envia `X-Goog-Language-Code: pt-BR` (igual a `placeEstado`), então `weekday_descriptions` vem em português.

## Detalhes de comportamento
- `curado_mantido` conta também em `dry_run` (nada gravado, mas a decisão é a mesma).
- `amostra[].days_of_week` mostra o valor curado quando mantido, senão o calculado do Google.
- `com_restricao` / `sem_restricao` / `sem_horario` continuam refletindo o que o Google disse, mesmo quando o curado foi mantido. Logo, `curado_mantido` pode se sobrepor a eles.
- Linha curada continua recebendo `hours_checked_at`, então não é reprocessada.

## Verificação
- `deno` não existe no Codespace: `deno check` não rodou. Sintaxe checada com `ts.transpileModule` (0 diagnósticos); tipos não checados.
- Nenhuma chamada real ao Google/Supabase. Vitest/tsc/build do app não rodados (mudança só em `kinu-beta/functions`).
- Intocados: `src/data/*`, `hotelZones.ts`, `michelinData.ts`, `types/trip.ts`, `scripts/sync-catalog.ts`.

## Pendente para o fundador
- Rodar o SQL do `RELATORIO-M19a.md` (colunas `hours_checked_at`, `weekday_descriptions`) antes do primeiro POST.
- Redeploy da `quick-endpoint` pelo Lovable (arquivo único, sem `_shared/`).
- Sugestão: `POST {"mode":"horarios","city":"Paris","dry_run":true}` antes de gravar.

## Nota de processo
O adendo da correção foi acrescentado ao `RELATORIO-M19a.md` já commitado, a seu pedido. O CLAUDE.md pede adendo em commit novo. Este relatório é o registro separado.

## Push do código (fix)
```
To https://github.com/PedroContrucci/kinus-clan-compass
   a56e25f..7224362  main -> main
```
