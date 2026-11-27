# RELATORIO-M28 — noites de hotel e datas do link de reserva

**Data:** 27/11/2026 · **Modelo que escreveu o código:** Claude Sonnet 5.5 (Claude Code) · **Fechamento:** à mão, no terminal do Codespace
**Commits:** `287736a` (M28a) · `87f1cb2` (M28b)
**Origem:** defeito nº 1 da bateria de roteiros do PFC (Gemini · Lisboa, 24/11): hotel cobrado por 5 noites com check-in em 11/01 e check-out em 15/01.

## 1. O que mudou

### M28a — `fix(hotel): noites de hotel não contam a noite do voo` (`287736a`)
- `src/lib/itineraryEngine.ts` (+3 −1): `totalNights` passa a ser o número de dias entre o check-in (dia da chegada) e o check-out. Desconta `arrivalDayIndex`, além do check-out na véspera que já existia. Nunca menor que 1.
- `src/test/hotelNightsArrival.test.ts` (novo, 6 testes).
- Motor congelado: mudança autorizada por ser defeito achado em uso e conta de dinheiro, não escolha de roteiro.

### M28b — `fix(links): link de hotel usa check-in e check-out da hospedagem` (`87f1cb2`)
- `src/lib/offersLinks.ts`: nova `hotelStayDates(acc, fallbackStart, fallbackEnd)`. Usa `acc.checkIn` e `acc.checkOut`; sem os dois, ou fora de ordem, cai nas datas da viagem, como antes.
- `src/components/cockpit/TripPanel.tsx`: links de hotel do hero usam as datas da estadia. Voo não muda.
- `src/lib/razaoLines.ts`: links de "fechar" do Financeiro usam as datas da estadia. Segundo ponto com o mesmo defeito, fora do bloco original da missão; incluído pelo Code, correto.
- `src/test/hotelLinkDates.test.ts` (novo, 3 testes).
- 4 arquivos, +69 −6.

Não tocados: `src/data/`, `src/lib/hotelZones.ts`, `src/lib/michelinData.ts`, `src/types/trip.ts`, estimadores (`tierSystem`, `economicGenerator`, `activityPricing`), `createTrip.ts`, Wizard.

## 2. Medições (saída da suíte de 27/11, 09:58)

| Cena | Check-in → check-out | Noites | Diária | Total |
|---|---|---|---|---|
| Lisboa 10→15/01/2027 (ida 21:00→09:00) | 11/01 → 15/01 | 4 (era 5) | 775 | 3.100 (era 3.875) |
| Paris 06→11/12/2026 (ida 23:00→14:30) | 07/12 → 11/12 | 4 | 1.150 | 4.600 |
| Rio 10→13/12/2026 (ida 08:00→12:00) | 10/12 → 13/12 | 3 | 775 | 2.325 |
| Tóquio 28/12→03/01 (ida 23:00→11:00) | 30/12 → 03/01 | 4 | 800 | 3.200 |
| Lisboa, volta 02:30 | 11/01 → 14/01 | 3 | 775 | 2.325 |
| Lisboa importada | 11/01 → 15/01 | 4 | 775 | 3.100 (= gerada) |

- **Propriedade, 28 cidades × 3 perfis (84 viagens, 7 noites no pedido):** `totalNights` = dias entre `checkIn` e `checkOut`, sempre ≥ 1, e Financeiro da hospedagem = `acc.totalPrice`. Cidades com chegada no mesmo dia: 7 noites; com chegada no dia seguinte: 6; Tóquio, Bangkok e Singapura (chegada dois dias depois): 5.
- **Cenas do smoke:** Fortaleza família 5 noites · Paris gastrô 10–15/12 4 · Paris família 10–15/12 4 · Paris Natal 20–27/12 6 · Lisboa Natal 6 · Roma Réveillon 4 · Tóquio Réveillon 4.
- **Links (M28b), medidos também com `TZ=America/Sao_Paulo`:**
  - Financeiro: `…booking.com/searchresults.pt-br.html?ss=My%20Story%20Hotel%20Rossio%20Lisboa&checkin=2027-01-11&checkout=2027-01-15&group_adults=4&no_rooms=1`
  - Hero: `…&checkin=2027-01-11&checkout=2027-01-15&group_adults=4`
  - Sem `acc.checkIn`: mantém 10/01 → 15/01. Voo (Kiwi): segue com a data da partida.

## 3. Gates

| Gate | Resultado |
|---|---|
| `npx tsc -p tsconfig.app.json --noEmit` | limpo |
| `npx vitest run` | **99 arquivos, 990 passed, 3 skipped, 1 todo, 0 failed** (981 + 6 + 3) |
| `TZ=America/Sao_Paulo npx vitest run src/test/hotelLinkDates.test.ts` | 3 de 3 |
| `npm run build` | `✓ built in 30.91s` |
| `git pull --ff-only` | `Already up to date.` |

Dúvida levantada na revisão do diff e descartada por medição: `hotelStayDates` lê a data com `new Date(...)`. Como `acc.checkIn` é gravado com `.toISOString()` (`createTrip.ts:220`), a leitura não desloca o dia em São Paulo; o teste no fuso de São Paulo confirma.

## 4. Push

M28a: comitada e empurrada pelo Claude Code antes do corte da sessão. A saída do push se perdeu com a sessão; evidência: `git log` com `origin/main` em `287736a` antes de qualquer ação manual.

M28b:
```
Enumerating objects: 20, done.
Counting objects: 100% (20/20), done.
Delta compression using up to 2 threads
Compressing objects: 100% (11/11), done.
Writing objects: 100% (11/11), 2.74 KiB | 936.00 KiB/s, done.
Total 11 (delta 9), reused 0 (delta 0), pack-reused 0 (from 0)
remote: Resolving deltas: 100% (9/9), completed with 9 local objects.
To https://github.com/PedroContrucci/kinus-clan-compass
   287736a..87f1cb2  main -> main
```

## 5. Prova em produção (27/11, depois do Publish)

- `/smoke`: **334/336**, 21 cenas, 0 FAIL. Avisos: Rio R8 (overflow R$ 114, intencional) e Porto Seguro R5 (pool de restaurantes esgotado).
- Importação nova de Lisboa (roteiro nº 1 da bateria, 11–15/01/2027, 2 adultos + 2 crianças, teto R$ 25.000): cartão "My Story Hotel Rossio · R$ 775/noite · 4 noites"; custo estimado R$ 25.238 com "hotel R$ 3.100". O estouro do teto caiu de R$ 1.013 para R$ 238.
- Link do Booking copiado da tela: `checkin=2027-01-11&checkout=2027-01-15`.

## 6. Incidente durante a missão

Às 08:20 o Claude Code parou nos gates da M28b com `API Error: 400 You have reached your specified API usage limits. You will regain access on 2026-12-01 at 00:00 UTC`. Causa: limite mensal de gasto da organização na Anthropic (US$ 40, gasto US$ 40,04). O mesmo limite vale para a chave do `kinu-ai` em produção: o agente ficou fora do ar das 08:20 às 11:14, quando o limite foi ajustado para US$ 45. Nenhum código se perdeu; a M28b estava no working tree e foi fechada à mão. Custo da missão: não medido (sessão cortada antes do `/cost`).

## 7. Achados para a fila (fora do escopo da M28)

1. **Linha do teto contradiz o cartão:** "Teto informado: R$ 25.000 · 2 adultos + 2 crianças, 5 noites, perfil Conforto" aparece acima do cartão que diz 4 noites. A linha conta dias da viagem menos um; a redação é decisão do Pedro.
2. **Booking consultado como 4 adultos:** `group_adults=4` para 2 adultos + 2 crianças (8 e 12). Pré-existente; muda preço e tipo de quarto.
3. **Porto Seguro:** ida 23:00 → chegada 10:00 do dia seguinte, perdendo uma noite. Causa provável na duração da rota; não verificada.
4. **Hero sem `no_rooms=1`:** o link do Financeiro leva o parâmetro, o do hero não.
5. **Viagens antigas:** ficam com as noites antigas até o próximo Regerar ou troca de voo.
6. **M28c (estacionada):** estimadores e Wizard ainda usam dias menos um.
7. **Limite de gasto compartilhado** entre produção e desenvolvimento: separar por workspace na Anthropic.
