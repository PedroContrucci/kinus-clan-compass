# RELATORIO-C5D — modo de reserva por atividade, tiles clicáveis, quando o dinheiro sai

**Commit:** `f0c6479` feat (C.5d). Suíte 56 arquivos / 665 testes verdes (1 rodada completa), tsc zero, build ok,
eslint sem problema novo (Viagens.tsx: 38 antes = 38 depois; demais arquivos limpos).

## Sync (A)
- `sync-catalog.ts` passa a ler `booking_mode,booking_url,booking_phone,booking_note` e emite
  **`src/data/generated/booking.ts`** (`CURATED_BOOKING` por id). Não entra em `destinationActivities.ts`:
  `SuggestedActivity` é intocável (mesma ponte de `coords.ts`). Modo fora dos 5 → aborta sem escrever; restaura junto.
- Log: `booking.ts: 25/901 (walk_in 3 · phone 22 · online 0 · partner 0 · included 0) — ARQUIVO NOVO`.
  O 4º walk_in (`for-rest-mercado-peixes`) está `retired` e fica fora. Os 22 phone estão **sem telefone**.
- Diff de linhas: `destinationActivities.ts` **0**, `coords.ts`/`landmarkTiers.ts` **0**, `kinu-ai/catalog.ts` **0**
  → **nenhuma edge function tocada, sem redeploy.**

## Ação por booking_mode (B), em `roteiroBooking`
- partner+url → "Reservar com parceiro ▸"; online+url → "Reservar no site ▸"; phone+tel → "Ligar ▸" (tel:);
  phone sem tel → "Reserva por telefone · número a cadastrar", sem botão; included/null/sem url → nada.
- **D2:** walk_in mostra só a note, verbatim, numa linha; sem note, "Sem reserva · ordem de chegada". Nunca os dois.
- **D3:** o "Reservar com parceiro" genérico (busca Viator/Klook) sai de todas as linhas e **não** vira linha de
  fim do dia. Volta quando houver partner+url por atividade. `onOffers` por item saiu do RoteiroDia/RoteiroLinha.
- Linha aberta ganha **"Marcar como fechado"** → confirmModal (só itens com ☐, não fechados). Fechada mantém ☐.
- Razão (Compromissos): item do dia mostra só o botão Ligar/Reservar (`BookingAction`); texto fica no Roteiro.

## Financeiro (C, D)
- **D1:** `razaoBreakdown` agrupa as linhas do razão (voo · hotel · passeios · alimentação · transfer, + outros se > 0).
  Σ quebra = tile por construção. Tiles viram botões (`FinanceiroTiles`), um aberto por vez; Orçamento → Dialog
  existente; Disponível → "Reserva 15% · fora do plano".
- `razaoDesembolso` + "📅 Quando o dinheiro sai" (colapsado): "Ao confirmar o voo · hoje", "No check-in (10/nov) · Hotel",
  "Dia N (dd/mmm)" (data do dia ou início + N − 1, regra do Roteiro), "Reserva … (não planejado)" fora da soma.
  Só a parte a confirmar: Σ marcos = Planejado.

## Testes
roteiroDia: (a) Crocobeach walk_in só a note, (a2) walk_in sem note, (b) phone sem tel → texto / com tel → Ligar,
(c) null/included/online sem url → nada, (d) online → "Reservar no site", partner → "com parceiro", "Marcar como
fechado" → onCheck. razaoLines: (e) Σ quebra = tile + tiles um por vez, (f) Σ desembolso = Planejado.
Online/partner/tel simulados com `vi.mock` (o banco ainda não tem nenhum).

## Pendências (esteira, fora desta missão)
- Duplicatas em Fortaleza for-rest-* vs for-*: Cabaña del Primo, Coco Bambu Beira Mar, Mercado dos Peixes, Santa Grelha.
- Telefones dos 22 restaurantes phone; partner+url por atividade (pré-requisito do retorno do link de parceiro).

## Push
```
To https://github.com/PedroContrucci/kinus-clan-compass
   4cc6127..f0c6479  main -> main
```
