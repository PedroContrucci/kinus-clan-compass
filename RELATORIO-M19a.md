# RELATORIO M19a — modo "horarios" na quick-endpoint

## O que mudou
- `kinu-beta/functions/quick-endpoint/index.ts`: `handleHorarios` + `placeHorarios`, roteado em `mode === "horarios"`; cabeçalho atualizado. Nenhum outro modo alterado.
- Seleciona `curated_activities` com `status='published'`, `place_id` não nulo, `hours_checked_at` nulo (city opcional, `limite` padrão 150). Hotéis fora.
- Place Details v1, FieldMask `regularOpeningHours`, mesma API key/fetch dos outros modos.
- `days_of_week`: dias distintos de `periods[].open.day`; 1–6 dias = array; 7 dias ou sem dado = `null`.
  - Caso extra: período único "open dom 00:00 sem close" (24 h) = `null`.
- Sempre grava `hours_checked_at = now()` e `weekday_descriptions` (jsonb, pode ser null).
- Mesmo `TETO_MS` (50 s) e idempotência pelo filtro `hours_checked_at is null`. Sem horário no Google, a linha é marcada como conferida e não volta.
- `restantes` é contagem exata no banco após a rodada (inclui o que passou do limite). Em `dry_run` nada é gravado e `restantes` reflete o total pendente.
- 424 com o SQL se as colunas faltarem (sonda por select; sem DDL na function).
- Resposta: `{ modo, city, dry_run, processadas, com_restricao, sem_restricao, sem_horario, erros, restantes, concluida, amostra[≤10], falhas }`.

## Verificação
- `deno` não existe no Codespace: `deno check` não rodou. Só conferi sintaxe com o transpiler do TypeScript (0 diagnósticos). Tipos não foram checados.
- Nenhuma execução real contra o Google/Supabase.
- Não toquei em `src/data/*`, `hotelZones.ts`, `michelinData.ts`, `types/trip.ts` nem `scripts/sync-catalog.ts`.
- Vitest/tsc/build do app não foram rodados: a mudança é só em `kinu-beta/functions`.

## SQL para rodar ANTES do primeiro POST (SQL Editor do kinu-beta)
```sql
alter table curated_activities add column if not exists hours_checked_at timestamptz;
alter table curated_activities add column if not exists weekday_descriptions jsonb;
```
(`days_of_week` já existe.)

## Uso
`POST { "mode": "horarios", "city": "Paris" }` ou sem city. Repita até `restantes = 0`.

## Redeploy (Lovable/kinu-beta)
Prompt: "Redeploy da edge function quick-endpoint a partir de kinu-beta/functions/quick-endpoint/index.ts (arquivo único, sem `_shared/`)."

## Push do código (feat)
```
To https://github.com/PedroContrucci/kinus-clan-compass
   ae6833e..5205f00  main -> main
```
