# RELATORIO — PLACE-PHOTO

- Novo `src/lib/placePhoto.ts`: `placePhotoUrl(id, w=640)` (usa `catalogIdOf`), `fetchPlacePhotoAttribution` (memo por sessão), registro de ids 404.
- Novo `src/components/shared/PlacePhoto.tsx`: `<PlacePhoto>` (lazy, gradiente, 404 → ClaLazyImage/DestinationImage ou `fallback`) e `<PlacePhotoCredit>` ("Foto: …", só drawers).
- Uso: cards do /cla (atividades `a.id`, hotéis `h.id`); ActivityDetailDrawer (roteiro e /cla, `catalogIdOf(activity.id)`) com crédito; HotelDetailContent (showPhoto) com crédito.
- Sem uso: Michelin (sem id no catálogo), popups da Rota do Dia (sem imagem), linhas do bloco/modal de hotel (sem foto hoje).
- Endpoint ao vivo: for-mercado-peixes 200 image/jpeg; for-doce-50-sabores 200 image/jpeg, crédito "Jorge Fialho".
- Validação: 443 testes, tsc limpo, eslint limpo nos arquivos novos.
- Não tocados: src/data, hotelZones, michelinData, types/trip.ts, gerador, edge functions.
