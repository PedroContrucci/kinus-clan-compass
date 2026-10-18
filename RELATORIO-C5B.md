# RELATÓRIO C.5b — Roteiro em blocos

**Entregue (`ace8e7f`)**: na aba Roteiro da viagem ativa, cada item vira uma linha fechada
`☐ 09:15 Nome · 5h · ~R$ 170 ▸`; ao tocar abre (um por vez, `aria-expanded`): 💡 dica, foto + ★ + aberto/fechado
(`PlaceInfoCard`, montado **só** no item aberto), Michelin/Clã, preço com origem (“estimativa do KINU” / “valor que
você registrou”), as ações do tipo e “Mais detalhes”. Cabeçalho em uma linha `Dia 3 · 12/nov (quinta) · 5 itens · R$ 290`.
“🗺 Rota do dia · ~N min de deslocamento ▸” colapsado; o `DailyRouteMap` só monta aberto. Filtros, tira de dias,
“Onde você fica” e JetLagAlert ficam; a vista filtrada usa as mesmas linhas (prefixo “Dia N”).

**Ações por tipo** (`src/lib/roteiroBlocks.ts`): passeio pago → Reservar com parceiro + Trocar; passeio grátis e
restaurante → Trocar; café/room service do hotel, check-out, transfer → nada; voo e check-in → Confirmar; confirmado/cancelado → nada.

**Arquivos**: novo `cockpit/RoteiroDia.tsx` (UI pura, sem estado de viagem) · novo `lib/roteiroBlocks.ts` · `pages/Viagens.tsx`
(o bloco do dia e as linhas filtradas passam a usar o componente; saem banner de foto, clima do cabeçalho, rodapé “Total do dia” e imports órfãos).
Motor, `GeneratedItineraryStage`, PDF, `DailyRouteMap`, `TripPanel`, `src/data`, `types/trip.ts`: intocados.

**Nenhum handler novo.** Os que já existiam só mudaram de lugar: ☐ → `confirmModal`/`handleConfirmActivity`; Reservar → `OffersModal`; Trocar →
`swapModal`; Mais detalhes → `ActivityDetailDrawer` (o “ver no mapa” dele agora abre a rota); Confirmar voo/hotel →
`setActiveTab('painel') + setPendingConfirmRequest` (o mesmo caminho do `confirmar_item` do KINU AI; formulário único no TripPanel).

**Regra de deslocamento (real > estimado)**: `legBetween` usa o OSRM do mapa quando ele já calculou o trecho; se não, `logisticsLine`
do motor. Uma fonte por trecho, nunca as duas; o “~N min” da Rota do dia soma pela mesma função.

**Decisões**: D1 “Adicionar atividade” **não** criada (continua pelo KINU AI) · D2 Confirmar no check-in, check-out sem ação ·
D3 ☑ confirmado só leitura — **pendências**: “desconfirmar atividade” + “desconfirmar voo mantém ‘confirmed’” · D4 clima e foto-banner
saem do cabeçalho · D5 “Mais detalhes” mantém o drawer.
Observação: a linha não mostra mais o número do pino; o mapa ainda numera as paradas.

**Verificação**: `src/test/roteiroDia.test.tsx` com 6 testes: (a) 5 linhas, 0 ações, densidade por contagem (cabeçalho + rota + 5×44 px + conectores ≤ 700 px);
(b) passeio pago: Reservar + Trocar, sem Confirmar, um aberto por vez; (c) café do hotel sem ação, ☐ → onCheck;
(d) voo: Confirmar, sem checkbox; (e) mapa não montado fechado, montado aberto; regra real > estimado.
Suíte: 1 execução, 55 arquivos e 646 testes passando · tsc 0 · build ok · eslint: 0 nos arquivos novos, Viagens.tsx 39→38 problemas, nenhum novo.
Sem function tocada → sem redeploy. Publish é com o fundador.

**Push (feat)**:
```
To https://github.com/PedroContrucci/kinus-clan-compass
   2027569..ace8e7f  main -> main
```
