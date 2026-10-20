# RELATORIO-C8 — "Onde fechar ▸" · dentro/fora · 3 ajustes

Commit `378e84a` (feat). Motor, edge functions e intocáveis sem mudança. Suíte 62/62 arquivos (720 ✓), rodada 1× ·
tsc zero · build ok · eslint 45→45 nos tocados (nenhum novo) · `SmokeTest.tsx` intocado.

## Entregue
- **`buildCloseLinks(kind, ctx)`** (`offersLinks.ts`, puro) → `CloseLink {provider, label, url, partner}` + `CLOSE_DISCLOSURE`.
  `OfferLink`/`buildOfferLinks` ficam como estavam para os 5 consumidores.
- **Razão:** linhas de voo/hotel a confirmar ganham `closeLinks` (rota de `flightSearchRoute`, datas da viagem, pax).
  Bloco colapsado "Onde fechar" com a linha de transparência no topo, até 4 provedores, abre em nova aba.
  Depois do clique aparece "Fechou? Registrar valor pago ▸", que abre o sheet de confirmar de hoje. Sai o botão "Reservar com parceiro".
- **Roteiro:** passeio pago aberto com `online`/`partner` → o mesmo bloco (o site oficial vem antes); "Fechou?" → confirmModal.
  "Marcar como fechado" só com `online`/`partner`/`phone` (o ☐ "feito" fica). Restaurante mantém o botão de reserva.
- **Prontidão** = `prontidao(trip)`: voo + hotel + itens que exigem reserva, confirmados / total. O checklist ganhou o
  próprio contador no título.
- **0a:** já estava resolvido no C.7. Os chips aparecem com mensagens enquanto não há escolha (teste `inicio.test.tsx:154`).
- **0b:** ida nova → volta = ida + 5; se você já mexeu na volta, a duração é mantida (D5). `min` = ida, e a volta nunca fica antes da ida.
- **0c:** "trocar" da origem abre a lista `WIZARD_ORIGINS`. `applyOriginChange` reescreve origem/código/`originSource:'user'`
  e as pontas das pernas, limpa `outboundFlight/returnFlight`, e aparece o toast "Origem alterada — buscando voos de novo".
  "trocar" do 💰 abre o Dialog de orçamento, que agora também aparece no rascunho e grava `budgetSource:'user'` (D4).
- Fora da lista, por necessidade: `DraftCockpit.tsx` (2 props), `onboardingFlow.ts` e `timezone.ts` (só adições).

## Provedor × kind
| Provedor | Kind | Entra? | Por quê |
|---|---|---|---|
| Kiwi | voo | entra · parceiro KINU | afiliado TP ativo; from/to/departure/return/adults |
| Google Flights | voo | entra · link direto | rota + datas + "for N adults" na busca |
| Skyscanner | voo | entra · link direto | rota + yyMMdd + adults |
| LATAM | voo | entra se for a cia da oferta | deep link com origin/destination/outbound/inbound/adt |
| Azul · GOL · TAP | voo | fora | sem padrão datado confirmado; home sem data, nunca |
| Booking | hotel | entra · link direto | ss (hotel+cidade), checkin/checkout/group_adults |
| Hoteis.com | hotel | entra · link direto | Hotel-Search destination/startDate/endDate/adults |
| Airbnb | hotel | entra · link direto | cidade + checkin/checkout/adults |
| Google Hotels | hotel | fora | a URL não leva datas |
| Site oficial (catálogo) | passeio | entra, primeiro | `booking_url`; "parceiro KINU" quando o modo é `partner` |
| Klook | passeio | entra · link direto | busca nome+cidade; link curto de afiliado sem busca não entra |
| GetYourGuide | passeio | entra · link direto | busca nome+cidade + date_from/date_to do dia |
| Civitatis | passeio | fora | só slug de cidade, sem busca por nome |
| qualquer um | walk_in/included/phone/null | fora | sem reserva online |

## Atenção
- O catálogo de hoje tem 22 `phone` e 3 `walk_in`, nenhum `online`/`partner`. Por isso o "Onde fechar" de passeio ainda
  não aparece no app, e a Prontidão passa a contar os 22 itens por telefone.
- Nenhuma edge function tocada → sem redeploy. Publish é com o fundador.

## Push
```
To https://github.com/PedroContrucci/kinus-clan-compass
   d64365f..378e84a  main -> main
```
