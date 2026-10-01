# RELATORIO-DURACAO-VOO — plannedFlightToSelected trunca duração decimal

## Problema
`plannedFlightToSelected` (src/components/cockpit/DraftCockpit.tsx) casava
`/(\d+)h\s*(\d+)?/` SEM âncora. Em "7.5h" o primeiro casada possível era o "5"
(posição 2): `durationMinutes = 300` em vez de 450 (Cartagena). "11.25h"
daria 1500 ("25h"). O campo alimenta o total de minutos do SelectedFlight e
a decisão de "voo que vira o dia" em GeneratedItineraryStage.tsx:268 — o dia
de chegada estava errado para voos com duração decimal.

## Mudanças (2 arquivos)
1. **src/components/cockpit/DraftCockpit.tsx** (103-112)
   - `plannedFlightToSelected` agora é `export` (o teste precisa importar;
     único mudança de superfície) com
     `// eslint-disable-next-line react-refresh/only-export-components`
     para não introduzir warning novo (o arquivo já tinha o mesmo warning
     no `inferAirportCode`, linha 61).
   - Parse novo, exatamente como pedido:
     `duration.match(/(\d+(?:\.\d+)?)\s*h/)` → `Math.round(parseFloat(m[1]) * 60)`.
     Sem match → 0 (igual antes).
2. **src/test/flightDurationPlanned.test.ts** (novo) — 5 casos:
   - "7.5h" → 450 · "3h" → 180 · "11.25h" → 675 · duração ausente → 0 ·
     string sem "h" → 0.

## Nota
- Formato "1h05" (h + minutos) existe só nas opções do FlightSelectionStage,
  que NÃO passa por plannedFlightToSelected — nenhum caminho usa "XhYY" aqui.
- Cópia do mesmo bug em `src/test/generatorNoRepeat.test.ts:21` é um helper
  de teste, não código do app — fora do escopo desta missão.

## Validação
- `npx vitest run`: 452 testes em 34 arquivos, todos verdes (5 novos).
- `npx tsc -p tsconfig.app.json --noEmit`: limpo.
- `npm run build`: ok (aviso de chunk >500 kB, pré-existente).
- `npx eslint` nos arquivos tocados: sem problema novo (13 erros `any`
  pré-existentes no DraftCockpit, 1 warning pré-existente na linha 61;
  o teste novo está limpo).

## Commit/push
Não executados aqui — o fundador comita/pusha pelo Lovable
(`fix:` para código, `docs:` separado para este relatório). STEP1-DURACAO-VOO.md
deletado; nunca commitado.
