# STEP1 — CLA-VIAGENS (Clã como fonte; viagens próprias em Viagens)

## Achados que mudam o plano
1. **A inserção não é reutilizável hoje.** `adicionar_atividade` (Viagens.tsx:1029) resolve o item do catálogo e chama
   `handleAddActivity` (Viagens.tsx:953), um closure preso a `selectedTrip` + `persistTrip` + toast. O KinuAIContext só
   despacha (`handlers.adicionar_atividade`). De /cla não há como chamar sem duplicar.
   → Proposta: extrair o corpo para função pura `addCatalogActivityToDay(trip, dia, suggested, horario): SavedTrip | null`
   em `src/lib/tripItineraryOps.ts` (arquivo novo). `handleAddActivity` passa a ser
   `updateTrip(id, t => addCatalogActivityToDay(t, ...))` + toast; /cla usa a mesma função via `updateTrip` do tripStore.
   Comportamento idêntico (mesmo id, custo, sort, `applyPlannedCostDelta`, `calculateProgress`).
2. **Formato do id.** Item adicionado manualmente ganha id `<catalogId>-<timestamp>`, não `day-N-<id>`.
   A extração do itinerário compartilhado precisa aceitar os dois: `day-N-<id>` e `<id>-<13 dígitos>`; itens sem id de
   catálogo resolvível (voo, hotel, livres) ficam fora do compartilhamento.
3. **Horário:** a tool exige `horario`. No sheet do /cla proponho seletor de horário com default por categoria
   (café 08:00, almoço 12:30, jantar 20:00, demais 10:00).
4. **Hotel:** `applyHotelSwap(t, hotel)` já é puro (hotelSwap.ts) — /cla chama `updateTrip(id, t => applyHotelSwap(t, h))`.
5. **Banco kinu-beta:** as tabelas `cla_*` vivem no projeto kinu-beta (sem migrations neste repo). Não consigo criar
   `cla_shared_trips` nem a RPC daqui → entrego o SQL no relatório para o fundador aplicar no kinu-beta; o front
   degrada em silêncio (seção vazia / botão desabilitado) até a tabela existir.

## Diff proposto
- `src/lib/tripItineraryOps.ts` (novo): `addCatalogActivityToDay`, `defaultTimeFor(category)`, `extractCatalogId(itemId)`.
- `src/pages/Viagens.tsx`: `handleAddActivity` delega à função nova (sem mudar comportamento); nova seção
  "Viagens vividas" (endDate < hoje, status active/completed): check-in "registrada em <data>" / "fazer check-in",
  troféus do cache de conquistas (leitura de `localAchievements`, sem tocar engine); botão "Indicar meu roteiro ao clã".
- `src/components/cla/AddToTripSheet.tsx` (novo): lista viagens draft/active (destino + datas; cidade ≠ → desabilitada
  "cidade diferente"), dia, horário; hotel → "Usar este hotel". Toast "Adicionada ao dia 3 da viagem Fortaleza".
  Sem viagem na cidade → "Planejar uma viagem para <cidade>" → wizard com destino pré-preenchido.
- `src/components/cla/ShareTripSheet.tsx` (novo): título opcional ≤80, prévia (dias + nomes do catálogo apenas),
  linha "Compartilhado de forma anônima com o clã"; depois "✓ no clã" + "Retirar".
- `src/lib/cla.ts`: `shareTrip`, `unshareTrip`, `mySharedTripIds`, `sharedTripsPublic(city)`.
- `src/pages/Cla.tsx`: remove "Meus Roteiros"; ação "➕ Adicionar à minha viagem" em atividades/restaurantes/hotéis;
  "Roteiros do Clã" via RPC com "Ver roteiro"; seção curada renomeada "Roteiros do KINU".
- Eventos: `trackEvent('cla.add_to_trip', {activity_id, city, trip_id})`, `trackEvent('cla.trip_shared', {city, days})`.

## Insert em cla_shared_trips (formato exato)
```
{ user_id, trip_id, city, days: int, travelers: int, children: int,
  itinerary: [{ day: int, items: [{ id: catalogId, name, category }] }],
  lived_ids: string[] /* do check-in */, title: string | null }
```
SQL a entregar (kinu-beta): tabela com `unique(trip_id)`, RLS insert/delete/select só `auth.uid() = user_id`,
RPC `cla_shared_trips_public(p_city)` security definer devolvendo tudo exceto `user_id`/`trip_id`.

## Intocados
src/data/*, hotelZones, michelinData, src/types/trip.ts, achievementEngine, tripEvents, gerador.

## Decisões abertas
- A. OK extrair `handleAddActivity` para função pura (única forma de não duplicar)?
- B. Horário no sheet com default por categoria — ou sempre fixo?
- C. SQL do kinu-beta: você aplica a partir do relatório?

Aguardando "APLICAR".
