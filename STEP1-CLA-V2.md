# STEP1 — Clã Vivo v2 (Waze mode)

## Achados que mudam o plano
1. **Catálogo não tem contagem de avaliações Google.** `SuggestedActivity` tem só `rating` (sem `reviews`/`googleId`). Proposta: mostrar `Google 4,6` sem "(2.300)"; o parêntese só aparece se um campo de contagem existir no futuro. Nada em `src/data/` é tocado.
2. **`cla_suggestions_public` mudou de formato** (`apoios` → `confirmations`, mais `id`, `neighborhood`, `google_status`). `ClaSuggestionPublic` em `cla.ts` é atualizado; `apoios` sai.
3. **Chips do modo "durante" chamam `sendMessage(prompt)`.** "Indicar este lugar" não é prompt: precisa abrir o formulário. Proposta: um evento de janela `kinu:open-cla-suggest` `{ city, preferGps: true }` escutado por um host global (montado em `App.tsx`), para o formulário abrir por cima do chat em qualquer página.
4. `hasLivedCity` hoje conta `trip.completed` **e** `trip.checkin`. A missão pede "trip.completed". Proposta: manter como está (check-in é pós-viagem por construção e a RLS de `cla_confirmations` é a verdade). Decisão aberta D1.
5. O mapa Leaflet usa OpenStreetMap (mesmo tile do `DailyRouteMap`, sem chave).

## Diff proposto
**Novos**
- `src/lib/claDedupe.ts` — função pura `findDuplicate(name, city, pending[]) → { kind: 'catalog'|'suggested', name, suggestionId? } | null`. Usa `normalizePlaceName` contra `getDestinationActivities(city)` e contra as indicações `pending` da RPC. Sem imports de rede → testável.
- `src/lib/claDailyCap.ts` — limite de 5/dia/usuário em localStorage (`kinu:cla-cap:<userId>:<YYYY-MM-DD>`), via `loadJson`.
- `src/components/cla/IndicarLugarSheet.tsx` — o formulário (Sheet): cidade (21 + outra), nome 3–80, categoria (6), bairro, LOCALIZAÇÃO ("Estou aqui" / "Marcar no mapa" / pular com aviso), dica ≤200, faixa de preço (5 chips), melhor horário (4 chips), família (toggle). Dedupe antes de inserir → "já está no catálogo / já foi sugerido — quer confirmar?" (se foi sugerido e o usuário viveu a cidade, o botão confirma direto).
- `src/components/cla/PinPickerMap.tsx` — mini-mapa Leaflet centrado em `CITY_COORDINATES[city]`; toque solta o pino.
- `src/components/cla/ClaSuggestHost.tsx` — escuta `kinu:open-cla-suggest` e abre o sheet.
- `src/test/claDedupe.test.ts` + `src/test/claDailyCap.test.ts`.

**Alterados**
- `src/lib/cla.ts` — tipos novos; `suggestPlace` com os campos v2; `confirmSuggestion(id, city)` (erro `23505` = sucesso silencioso); `myConfirmations(ids)`; `mySuggestions` passa a trazer `curator_note`.
- `src/pages/Cla.tsx` — duas seções: **A) Contribua com o catálogo** (botão principal, "Indicações do clã em <cidade>" com status, 🤝, pill Google, "Também fui"; "Suas indicações" com curator_note) e **B) O que o clã viveu** (top 10, Google × Clã lado a lado, dica "Você avalia depois de viver — no check-in da viagem.").
- `src/components/ai/KinuQuickActions.tsx` — chip "📍 Indicar este lugar" no modo durante (dispara o evento).
- `src/App.tsx` — monta `<ClaSuggestHost />`.
- **Removido:** `src/components/cla/SuggestClaForm.tsx`.

## Formato exato do insert (`cla_suggestions`)
```
{ user_id, city, name, category, neighborhood|null, lat|null, lng|null,
  coord_source: 'gps'|'pin'|'none', tip|null (≤200),
  price_range|null, best_time|null, family_ok: boolean,
  status: 'pending', lived: boolean }
```
`confirmations`, `google_status`, `curator_note` ficam a cargo do servidor/curadoria.
`cla_confirmations`: `{ suggestion_id, user_id }`.

## Eventos
`cla.suggestion {city, category, coord_source, lived}` · `cla.confirmation {suggestion_id, city}`.

## Geolocalização
A permissão é pedida **só** no toque em "Estou aqui" (`navigator.geolocation.getCurrentPosition`, alta precisão, timeout 10s), e a precisão aparece como "±N m". Quando o formulário abre pelo chip do modo durante, "Estou aqui" já vem selecionado e o pedido dispara ao abrir; se o usuário negar → aviso + caminho do mapa.

## Decisões abertas
- D1: elegibilidade = `trip.completed` apenas, ou completed + check-in (recomendo o segundo)?
- D2: Google sem contagem de avaliações, por enquanto (achado 1): ok?

Não toca em: `src/data/`, hotelZones, michelinData, `src/types/trip.ts`, motor de conquistas, tripEvents, gerador.
