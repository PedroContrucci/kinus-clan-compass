# STEP1-DURACAO-VOO — plannedFlightToSelected trunca duração decimal

## Achados que mudam o plano
- Bug real, causa confirmada: em `DraftCockpit.tsx:107` o match
  `/(\d+)h\s*(\d+)?/` NÃO é ancorado. Em "7.5h" o primeiro ponto de casada
  possível é o "5" (posição 2), então `m[1] = "5"` → `durationMinutes = 300`
  em vez de 450 (Cartagena). "11.25h" daria `m[1] = "25"` → 1500 min.
  Sem ponto (ex.: "3h") casa certeiro: 180.
- `plannedFlightToSelected` (DraftCockpit.tsx:103-131) é função de módulo do
  arquivo, sem `export` — para o caso de vitest preciso exportá-la (única
  mudança de superfície).
- Consumidores do campo: `GeneratedItineraryStage.tsx:268` usa
  `durationMinutes / 60` para decidir voo que vira o dia — hoje Cartagena
  entra como voo curto errado. Corrigir aqui conserta o dia de chegada
  também.
- Formato "1h05" (horas + minutos) existe nas opções do FlightSelectionStage,
  mas essas NÃO passam por `plannedFlightToSelected` (só voos planejados do
  `buildDraftTrip`, que usam "7.5h"/"3h"). A regex nova do pedido
  (`/(\d+(?:\.\d+)?)\s*h/` → `Math.round(hours*60)`) portanto não afeta
  nenhum caminho que use "XhYY". Nada a perder.

## Diff proposto (2 arquivos)
1. **src/components/cockpit/DraftCockpit.tsx** (103-131):
   - `export function plannedFlightToSelected(...)` (só o `export` novo).
   - Bloco do `durationMinutes`:
     ```ts
     const m = duration.match(/(\d+(?:\.\d+)?)\s*h/);
     if (!m) return 0;
     return Math.round(parseFloat(m[1]) * 60);
     ```
2. **src/test/flightDurationPlanned.test.ts** (novo):
   - "7.5h" → 450 · "3h" → 180 · "11.25h" → 675 (via `plannedFlightToSelected`
     com objeto de voo mínimo e `.option.durationMinutes`).
   - Casos de borda: duração ausente → 0; string sem "h" → 0.

## Fora do escopo
- Nada em `src/data/`, `hotelZones`, `michelinData`, `types/trip.ts`.
- Nenhuma outra função de parse (ex. `generatorNoRepeat.test.ts:21` tem cópia
  do mesmo bug num teste próprio — fica para missão futura).

## Validação
`npx vitest run` → `npx tsc -p tsconfig.app.json --noEmit` → `npm run build` →
eslint nos 2 arquivos. Depois `git pull --ff-only origin main`, commit `fix:`,
push (saída literal no relatório), `RELATORIO-DURACAO-VOO.md` em commit `docs:`
separado (≤60 linhas), deletar este STEP1.

## Pendência anterior
`STEP1-FLIGHTLINE.md` (linha do voo do card) segue aguardando "APLICAR".
