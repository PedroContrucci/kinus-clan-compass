# RELATÓRIO C.4.1 — pendências do scheduler (51b60e4)

**Aceite:** smoke R13 55/61 · R14 12/12 · R15 57/63 · R16 63/63, **idênticos ao C.4**. R19 **504 P · 0 W · 0 F** nas duas rodadas (14:00 e 02:30; antes eram 9 W). Fortaleza 10–15/nov com volta 02:30 → **4 noites, total 4 × diária, `buckets.hotelPlanned` igual, checkOut 14/nov**; com volta 14:00 → 5. tsc zero · suíte 52 arquivos / 629 ✓ · build ok · eslint 41 = 41 da main nos arquivos tocados.

## O que mudou
1. **Rótulo "Logística"** pela natureza do item (type flight/checkin/checkout/transport ou id `slot-checkin|checkout|transfer`), em `isLogisticsItem`. Check-out 23:15 e transfer 23:45 deixam de aparecer como "Manhã" e "Tarde". Calculado na renderização, nada gravado.
2. **Duração no card:** "0.5h" → "30 min", "0.75h" → "45 min", "1.5h" → "1h30", "5h" → "5h" (`durationLabel`: abaixo de 60 min mostra "N min", senão `formatDurationHM`). O campo gravado continua decimal. O PDF não imprime duração de atividade, então lá não muda nada.
3. **Noites (dinheiro):**
   - **Regra:** `checkoutOnEve` no motor, com a mesma conta do R10/R11 (transfer − 30 min < 00:00).
   - **Aplicação, uma vez só:** `accommodationWithNights` no `buildItineraryForTrip` regrava `totalNights`, `totalPrice` (diária × noites) e `checkOut`. Se o voo de volta mudar para um horário diurno, as noites voltam ao número cheio.
   - **Gravação:** em `createTrip` e no `regenerateWith` do `DraftCockpit` (regerar e troca de perna; o `replanTrip` repassa via `...built`).
   - **R-V12:** Financeiro (override do curado), card do hotel, PDF e troca de hotel leem o mesmo `totalNights`/`totalPrice`.
   - **Card:** "4 noites (saída na véspera do voo)", calculado de `acc.checkOut` < data final. Nenhum campo novo; `trip.ts` intocado.
4. **R19:** o deslocamento depois de bate-volta (daytrip) ou de manhã ≥ 4 h passa a ser 15 min, como no motor (R4).
5. **PDF:** a coluna mostra só "00:35"; o "(+1)" vai junto ao nome.

## Desvios
- **`src/lib/itemDisplay.ts` (arquivo novo, só adição):** exportar os helpers do `GeneratedItineraryStage.tsx` gerava 2 avisos novos do eslint (react-refresh). Movidos para um arquivo próprio, e o eslint voltou a 41 = 41.
- **Testes antigos ajustados à mudança pedida:** o snapshot do motor agora compara só o `michelinCount` do `meta` (o `meta` ganhou `hotelNights`/`checkoutOnEve`, conferidos à parte). No `cockpitCard`, a duração do card passou a "1h30" e o PDF agora tem "00:35" na coluna e "(+1)" no nome.
- **Fortaleza "comfort" não tem hotel curado; só "luxury" tem (Gran Marquise).** O teste de aceite usa luxury. Para comfort, um teste à parte prova 4 noites gravadas e a estimativa do motor na proporção 4/5.
- **Suíte rodada 2×.** Depois disso, a única mudança foi mover os helpers; rodei os testes afetados, o tsc, o build e o eslint.

## Pendências registradas
- **B (decisão: sem migração):** viagens já salvas com 5 noites só se corrigem quando o roteiro é refeito (trocar voo ou regenerar). Os testadores da onda criam viagens novas.
- **C (dívida do C.4.2):** sem hotel curado, a diária do `createTrip` (`acc.nightlyRate`) e a estimativa do motor (`getActivityPrice('hotel_night')`) divergem. Hoje o Financeiro usa a do motor, e o card e o PDF usam a gravada. As noites agora batem; a diária ainda não. Falta uma fonte única de diária.
- O `totalNights` base continua "dias − 1" e ignora a chegada em D+1 (o `checkIn` já é deslocado). Fica para revisar junto com o C.

## Redeploy
Nenhuma edge function tocada; não há prompt de redeploy. O Publish do front fica com o fundador.

## Push
```
To https://github.com/PedroContrucci/kinus-clan-compass
   9ce597a..51b60e4  main -> main
```
