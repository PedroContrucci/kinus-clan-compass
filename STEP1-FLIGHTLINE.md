# STEP1-FLIGHTLINE — Card "O que o KINU fez": linha do voo vira estimativa

## Achados que mudam o plano
- `kinuDidLines` (src/lib/onboardingFlow.ts:92-129) monta a linha do voo a partir de
  `trip.flights.outbound.departureTime` — hora fixa do gerador (createTrip), não de
  voos reais. A troca é só reescrever as strings da linha.
- Estado "voo real escolhido": `DraftCockpit.handleFlightsSelected` grava
  `flightsSelected: true` + `outboundFlight`/`returnFlight` (SelectedFlight). Porém
  `handleSave` também grava `flightsSelected: stage === 'itinerary'` em qualquer save
  do estágio roteiro. Gatilho honesto do sufixo: **não** tem
  `trip.flightsSelected && trip.outboundFlight`.
- Navegação: `KinuDidCard` hoje faz `document.getElementById('draft-cockpit')
  ?.scrollIntoView(...)` — só rola, não abre o passo Voo. `DraftCockpit` não tem
  prop de estágio externo (estado interno `stage`). Precisa de um sinal.
- `KinuDidCard` só é renderizado em `Viagens.tsx:1483-1489` (draft com
  `onboardingFlow === 'v2'`), sempre junto do `DraftCockpit` na mesma árvore.

## Diff proposto (4 arquivos, nenhum intocável tocado)
1. **src/lib/onboardingFlow.ts** (`kinuDidLines`):
   - Linha do voo vira: `Voo estimado · ida dd/mm · volta dd/mm · escolha o voo real
     para fechar o orçamento` (datas de `trip.startDate`/`trip.endDate`, `format(dd/MM)`,
     date-fns já importado). Remover o bloco que lê `departureTime/arrivalTime`.
   - Linha do orçamento: enquanto `!(trip.flightsSelected && trip.outboundFlight)`,
     append ` · fecha ao escolher o voo`.
   - Nenhuma assinatura muda; `KinuDidLines` segue com os mesmos 5 campos.
2. **src/components/onboarding/KinuDidCard.tsx**:
   - Nova prop opcional `onOpenFlights?: () => void`. Ação do voo chama
     `onOpenFlights?.()`; fallback continua o scroll de hoje (se prop ausente).
3. **src/pages/Viagens.tsx** (ponto 1483-1489):
   - Estado `const [openFlightsSignal, setOpenFlightsSignal] = useState(0)`.
   - `onOpenFlights` = incrementa + scroll para `#draft-cockpit`; passa
     `openFlightsSignal` ao `DraftCockpit`.
4. **src/components/cockpit/DraftCockpit.tsx**:
   - Nova prop opcional `openFlightsSignal?: number`; `useEffect` que, ao incrementar,
     faz `setStage('flights')`. Sem remount, sem tocar lógica de voos.

## Decisões abertas
- Nenhuma blocking. Sufixo do orçamento usa o gatilho acima; se preferir
  só `!trip.flightsSelected`, é 1 linha.

## Validação (após aplicar)
`npx vitest run` → `npx tsc -p tsconfig.app.json --noEmit` → `npm run build` →
eslint nos 4 arquivos. Depois `git pull --ff-only origin main`, commit `fix:`,
push (saída literal no relatório), `RELATORIO-FLIGHTLINE.md` em commit `docs:`
separado (≤60 linhas), deletar este STEP1.
