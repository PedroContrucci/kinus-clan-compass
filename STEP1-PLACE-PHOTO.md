# STEP1 — PLACE-PHOTO (foto real do lugar no catálogo)

## Achados que mudam o plano
- **Michelin não tem id** (`MichelinRestaurant` = name/city/stars/cuisine/priceRange/neighborhood). Sem id → sem place-photo; Michelin segue no Unsplash. Não dá para adicionar id sem tocar michelinData (intocável).
- **Rota do Dia (DailyRouteMap) não mostra imagem** nos popups → nada a trocar.
- **Bloco/ficha/modal de hotel**: a única foto de hotel é `HotelDetailContent` (showPhoto, usado no /cla). As linhas do bloco/modal de hotel não têm foto hoje; não vou adicionar foto nelas (seria mudança de layout, não troca de fonte). Decisão aberta #1.
- Hero da viagem (TripPanel) e banner do dia (Viagens) são fotos da cidade/dia, não de um item → ficam no Unsplash.

## Diff proposto
1. `src/lib/placePhoto.ts` (novo)
   - `PLACE_PHOTO_BASE = ${VITE_SUPABASE_URL}/functions/v1/place-photo`
   - `placePhotoUrl(catalogId, w: 320|640|960|1280 = 640)` → aplica `catalogIdOf` (tira `day-N-`), `encodeURIComponent`; `null` se id vazio.
   - `fetchPlacePhotoAttribution(id)` → GET único (mesma URL w=320, cache do navegador), lê `x-kinu-attribution`, `decodeURIComponent`; memo por id na sessão; nunca lança.
   - Teste vitest: prefixo removido, w padrão, id vazio → null.
2. `src/components/shared/PlacePhoto.tsx` (novo) `<PlacePhoto id name city w categoryKeyword tone className>`
   - IntersectionObserver (mesmo padrão do ClaLazyImage) → `<img loading="lazy">`; gradiente de categoria enquanto carrega; `onError` → `ClaLazyImage`/`DestinationImage` (cadeia nome→categoria→cidade). Lembra ids 404 na sessão para não repetir.
3. Uso como primeira fonte:
   - `Cla.tsx` `CardShell`: nova prop `photoId` (atividade `a.id`, hotel `h.id`; Michelin sem id → ClaLazyImage como hoje).
   - `ActivityDetailDrawer.tsx`: header usa PlacePhoto com `catalogIdOf(item.id)` + linha "Foto: …".
   - `HotelDetailDrawer.tsx` (`showPhoto`): PlacePhoto `hotel.id` + linha "Foto: …".
   - `MichelinDetailDrawer.tsx`: sem mudança (sem id).
4. Atribuição só nos drawers, via `fetchPlacePhotoAttribution`; cards não buscam.

## Não tocado
src/data/, hotelZones, michelinData, types/trip.ts, gerador, edge functions.

## Validação
vitest inteiro, tsc app, build, eslint nos tocados; checagem ao vivo do endpoint para `for-mercado-peixes` e o id da Sorveteria 50 Sabores (a tela /cla logada depende de sessão — pode não ser verificável aqui).

## Decisões abertas
1. Adicionar miniatura nas linhas do bloco/modal de hotel? (sugestão: não nesta missão)
2. Michelin fica no Unsplash até ganhar id no catálogo — ok?
