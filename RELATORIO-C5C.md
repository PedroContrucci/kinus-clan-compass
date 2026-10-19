# RELATÓRIO C.5c — Financeiro como livro-razão (+ Roteiro abre/fecha independente)

**Commit:** `d12d0cd` feat · suíte 56/655 verde (2 rodadas) · tsc 0 · build ok · eslint sem problema novo (2 `any` antigos em itineraryEngine.ts:638).

## Entregue
- **0. Roteiro:** abertos = `Set` de ids; abrir uma linha não fecha a outra; "fechar tudo" no cabeçalho do dia com ≥1 aberta. O teste (b) do C.5b ("um aberto por vez") foi reescrito para a regra nova.
- **1. `src/lib/razaoLines.ts`** (puro) + **`FinanceiroRazao.tsx`** (UI pura) em "📒 Compromissos": Voo ida · Voo volta · Hotel (N noites) · Dia 1…N · Reserva (15%). Origem só do que está no objeto (voo `source` → estimativa / tarifa de referência / valor registrado; hotel `hotelRateSource` → estimativa / curado / confirmado; dia → estimativa do catálogo / valor registrado). Ações: [Confirmar] (setActiveTab('painel') + setPendingConfirmRequest), [Reservar com parceiro ▸] (Kiwi via `buildOfferLinks`, quando há origem/destino gravados), [Buscar ofertas ▸] (o mesmo OffersModal "Hospedagem" do HotelPlanBlock), [ver no Roteiro ▸] (limpa o filtro, abre o dia). Dia aberto: ☐/☑ + valor pelo mesmo `setConfirmModal` do Roteiro.
- **2. Ordem da aba:** Héstia · 4 tiles · Compromissos · Gastos por dia · Câmbio (só internacional).
- **3/4. Totais:** Planejado/Confirmado = `razaoTotals(razaoLines(trip))`, a mesma função das linhas → Σ = tile por construção; confirmar pelo razão regrava a viagem e o tile acompanha na hora. Nenhum handler novo, nenhum valor calculado na tela.
- Dias sem item além de voo/hotel (ex.: dia só com o voo de volta) não viram linha.

## Fortaleza 02:30 (fixture: 10→15/11, 2 adultos, rota injetada economyAvg 1.200)
Voo ida **994** + volta **1.160** · Hotel (4 noites) **6.000** · dias 320/760/670/450/650 (= food + tours 2.850) · **Σ = Planejado = 11.004** · Reserva 1.651 (fora das somas). Os 11.750 / 1.158 + 2.282 da missão vêm de uma rota real (Supabase) que o teste não reproduz. O hotel bate (6.000).
Teste: confirmar atividade (pago = estimado + 55) e hotel (5.400 ≠ 6.000) → Planejado = antes − custo − 6.000; Confirmado = pago + 5.400. `finances.planned` gravado diverge, e o teste afirma isso.

## Achados e decisões
- **Achado 1 / D1:** os tiles liam acumuladores (`finances.planned + bidding`, `finances.confirmed`) que derivam ao confirmar com valor ≠ estimado e ao confirmar hotel. Agora a aba lê o razão. **`finances.planned`/`confirmed` continuam gravados, mas a aba Financeiro não os lê mais: são candidatos a sair no próximo arco de motor.** "Outros gastos registrados" = `shopping.confirmed` + `transport.confirmed` gravados, só se > 0 e só a categoria que nenhum item confirmado do roteiro alimenta. Gasto manual legado em voo/hotel/passeio/comida não é separável do gravado e não aparece. O modal de gasto manual continua sem gatilho.
- **Achado 2 / D2:** `computeBuckets` passa a contar `type: 'transport'` (transfer com custo). A linha mora em **`src/lib/itineraryEngine.ts:201`**, não em `planTotals.ts` como dizia o APLICAR. Mudei só ela, no arquivo onde a função vive. O custo entra em passeios (timeSlot afternoon). **O Planejado sobe pelo valor do transfer nas viagens que o têm** (Fortaleza: +R$ 220), na próxima geração ou recálculo. Viagens já gravadas mantêm `categories` até lá; o razão já soma o transfer.
- **Achado 3 / D3:** voo confirmado = uma linha "Voo ida e volta · valor registrado" (`categories.flights.confirmed`). A divisão ida/volta não existe no gravado e não foi inventada.

Intocáveis intactos. Nenhuma edge function tocada → sem prompt de redeploy. STEP1-C5C.md deletado.

## Push (feat)
```
To https://github.com/PedroContrucci/kinus-clan-compass
   2ec37ec..d12d0cd  main -> main
```
