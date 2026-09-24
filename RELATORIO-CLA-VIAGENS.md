# RELATÓRIO — CLA-VIAGENS

## Entregue
1. /cla: seção "Meus Roteiros" removida. Seção curada renomeada "🧭 Roteiros do KINU".
2. /cla: "➕ Adicionar à minha viagem" nas atividades/restaurantes do catálogo (lista "Atividades mais bem avaliadas")
   e "🏨 Usar este hotel" nos hotéis curados. Michelin e cards comunitários sem ação.
   Sheet `src/components/cla/AddToTripSheet.tsx`: viagens draft/active (destino + datas; outra cidade desabilitada
   "cidade diferente"), dia, horário (default por categoria). Sem viagem na cidade → "Planejar uma viagem para <cidade>"
   → /planejar com `state.openWizardFor` (Planejar.tsx abre o wizard via `handleSelectCity`, prefill existente).
3. /viagens: `src/components/viagens/ViagensVividas.tsx` (endDate < hoje, status active/completed): "registrada em <data>"
   / "fazer check-in", troféus da Camada Local da cidade presentes em `getProgress().unlocked` (cache do motor, leitura).
   Com check-in: "Indicar meu roteiro ao clã" → sheet (título ≤80, prévia só com nomes do catálogo, "Compartilhado de
   forma anônima com o clã") → "✓ no clã" + "Retirar".
4. /cla "Roteiros do Clã": RPC `cla_shared_trips_public(p_city)`; card anônimo, "Ver roteiro" expande dias, item com ✓ se vivido
   e "➕ Adicionar à minha viagem" (mesmo sheet). Chip "Roteiros" conta esses roteiros.
5. Eventos: `cla.add_to_trip {activity_id, city, trip_id}` (no sheet), `cla.trip_shared {city, days}` (em `shareTrip`).

## Reuso da inserção (sem duplicar)
`src/lib/tripItineraryOps.ts` recebe, com corpo idêntico, `calculateTripProgress`, `applyTripPlannedCostDelta` e
`addCatalogActivityToDay` (o miolo do antigo `handleAddActivity`). Em Viagens.tsx: `calculateProgress` e
`applyPlannedCostDelta` viraram aliases das funções extraídas; `handleAddActivity` mantém clone + `persistTrip` + toast e
chama `addCatalogActivityToDay`. O handler `adicionar_atividade` do agente continua chamando `handleAddActivity`.
O Clã chama `updateTrip(id, t => addCatalogActivityToDay(clone, dia, item, horario))`. Hotel: `applyHotelSwap` via `updateTrip`.
Única adição visual em Viagens.tsx: montagem de `<ViagensVividas />` abaixo da lista.

## Insert em cla_shared_trips (exato)
```
{ user_id, trip_id, city /* resolveCity(destination) */, days /* trip.days.length */,
  travelers /* max(1, trip.travelers) */, children /* trip.childrenCount || 0 */,
  itinerary: [{ day, items: [{ id /* catalog id */, name /* nome do catálogo */, category }] }],
  lived_ids /* livedIds do check-in → ids do catálogo da cidade */, title /* ≤80 ou null */ }
```
Ids extraídos de `day-N-<id>` e de `<id>-<timestamp 13 dígitos>`; itens fora do catálogo ficam de fora.
Conflito 23505 (já compartilhada) = sucesso silencioso. "Retirar" = delete por user_id + trip_id.

## Validação
vitest 436/436 verde · tsc limpo · eslint sem problema nos arquivos tocados. Nenhuma edge function tocada → sem redeploy.

## Intocados
src/data/*, hotelZones, michelinData, src/types/trip.ts, achievementEngine, tripEvents, gerador.

## Push
Commit/push não executados: o ambiente Lovable gerencia o Git e sincroniza a main sozinho.
