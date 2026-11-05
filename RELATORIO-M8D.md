# RELATORIO M8d — PDF: checklist por clima, selo e câmbio

## Feito (commit cdb4e35, `src/lib/tripPdfExport.ts`)
1. **Higiene & Saúde:** "Protetor solar" e "Repelente de insetos" só entram quando `isBeach` (mesmo critério de `packingClimate` usado para roupa de banho). Paris em dezembro: nenhum dos dois; Fortaleza em janeiro: os dois.
2. **Selo:** sob "ROTEIRO DIA A DIA", linha 8pt com `catalogVerifiedLabel(trip.destination)`; sem data, não imprime.
3. **Câmbio: NÃO aplicado** (conforme a missão).

## Onde vive a cotação
`useExchangeRates` (`src/hooks/useExchangeRates.ts`): hook que busca via supabase, com cache localStorage `kinu_exchange_rates_v2` (6h) e `FALLBACK_RATES`. O `trip` não guarda cotação nem moeda (`src/types/trip.ts` sem campo). Para imprimir no PDF, o chamador precisa passar a cotação ao exportador.

## Verificação
- tsc limpo; vitest 785 verdes (3 skipped, 1 todo), nenhum assert alterado; build ok.
- eslint em tripPdfExport.ts: 29 erros `no-explicit-any` já existentes, nenhum novo.
- Nenhum teste de PDF comparava o checklist.
- Nenhuma edge function tocada; sem arquivos intocáveis alterados.

## Push

## Adendo — saída literal do push
```
To https://github.com/PedroContrucci/kinus-clan-compass
   6df9d54..98b1dd9  main -> main
```
