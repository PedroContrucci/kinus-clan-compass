# Relatório — Gerador/voo: chegada marcada no D2 para voo diurno

**Commit:** `94113bc` · `fix(voo): dia de chegada calculado, não assumido`
**Data:** 09/09/2026 · **Origem:** feedback da testadora-zero
**Arquivos:** 3 alterados + 1 suíte nova · 62 inserções, 27 remoções
**Estado:** no repo e no `main`. **Publish é do fundador.**

---

## 1. O defeito

GRU → Cartagena, ida às 08:00. O app mostrava duração ~4 h, chegada no **D2**, e o roteiro
começando só no dia seguinte. Fatos da rota: GRU→CTG não tem voo direto (7-9 h com conexão) e
chega no mesmo dia em qualquer cenário realista.

---

## 2. Diagnóstico — o código já sabia a resposta e a jogava fora

`buildDraftTrip` chamava `calculateArrivalTime`, recebia `nextDay: false` e
`arrivalDate: 05/10` — **a resposta certa** — e duas linhas abaixo escrevia:

```ts
const flightArrivalDate = arrDate;                    // atribuído e NUNCA usado
const arrivalDaysLater = flightHours > 18 ? 2 : 1;    // nunca 0
```

`flightArrivalDate` e `nextDay` eram variáveis mortas (zero usos no arquivo). Chegada no mesmo
dia era **inexprimível**: a expressão não tem como valer 0.

**Repro executada** antes de qualquer patch, com o caso exato dela:

```
duration = 4h · departureTime 08:00 · arrivalTime 10:00
departureDate = 2026-10-05    arrivalDate = 2026-10-06    checkIn hotel = 2026-10-06
dia1 = Embarque ✈️ 05/10      dia2 = Chegada 🛬 06/10
calculateArrivalTime dizia: nextDay=false, arrivalDate=2026-10-05   ← descartado
```

O cartão saía **internamente incoerente**: voo de 4 h saindo 08:00 do dia 5, chegando "10:00 do
dia 6". Não era só um dia a mais — era um dia a mais com a hora do mesmo dia.

### 2.1 As duas suspeitas, ambas confirmadas

**(a) Overnight assumido sempre.** Confirmado, e pior que "assume": o valor 0 não existia no
domínio da expressão.

**(b) Duração de tabela estática.** Confirmado, com um mecanismo que o briefing não previa. O
fallback de `getFlightDuration` usa **fuso horário como proxy de distância**:

```ts
const absDiff = Math.abs(tzDiff ?? 4);
if (absDiff <= 2) return 4;    // ← Cartagena caía aqui
```

Cartagena é `America/Bogota`, UTC−5 contra UTC−3 → `tzDiff = −2` → **4 h** para uma rota de
~4.500 km sem voo direto. Todo o Caribe, a América Central e a costa oeste sul-americana caíam
nesse mesmo balde.

**E os dois defeitos se produziram um ao outro:** a duração errada realimentava o horário
(`flightHours > 6 ? '21:00' : '08:00'` → 4 h dá 08:00). Com a duração certa o app teria escolhido
um voo noturno e a chegada no D2 estaria correta. Foi a combinação — 4 h + 08:00 + `? 2 : 1` —
que produziu o absurdo visível.

### 2.2 Por onde o erro se espalhava

| Consumidor | Efeito |
|---|---|
| `flights.outbound.arrivalDate` | o "+1" no cartão de voo |
| `accommodation.checkIn` | check-in do hotel um dia atrasado — nem consultava a variável, assumia `addDays(departureDate, 1)` |
| `generateDays`: `isArrivalDay = dayNum === 2` | **o roteiro começando no dia seguinte** |

O PDF (`tripPdfExport.ts:1263`) não tem cálculo próprio — deriva `startDate + day - 1` e consome
`trip.days` como vier. Consertar a raiz consertou o PDF junto.

`MinimalFlightCard` e `FlightAnchorCard` calculam `isNextDay` comparando as duas datas: eram
renderizadores honestos de um dado errado, e não foram tocados.

---

## 3. O que mudou

### 3.1 `createTrip.ts` — ligar o fio que já existia

```ts
const arrivalDaysLater = Math.max(0, Math.min(3,
  differenceInCalendarDays(arrDate, input.departureDate)));
```

O clamp `[0,3]` protege contra fuso extremo e contra duração absurda vinda da tabela. O
`checkIn` do hotel passou a usar a mesma variável em vez do `+1` embutido.

### 3.2 `createTrip.ts` — a grade de dias derivada, não constante

`generateDays` ganhou `arrivalDayNum` (default 2, que preserva o comportamento antigo para
qualquer chamador que não passe). Quatro constantes viraram derivações:

| Antes | Depois |
|---|---|
| `isArrivalDay = dayNum === 2 \|\| (transit && dayNum === 3)` | `dayNum === arrivalDayNum` |
| `needsTransitDay && dayNum === 2` | `dayNum > 1 && dayNum < arrivalDayNum` |
| `isRecoveryDay` com 3/4 fixos | `dayNum === arrivalDayNum + 1` |
| `explorationStart` = 3/4/5 fixos | `arrivalDayNum + (SEVERO ? 2 : 1)` |

`needsTransitDay = flightHours >= 20` deixou de existir: o dia de trânsito agora é uma
consequência da aritmética do voo, não um segundo `if` paralelo com o seu próprio limiar.

**O caso novo é `arrivalDayNum === 1`.** O `if (dayNum === 1)` interceptava antes e devolvia só
check-in + voo; agora o `isArrivalDay` é testado primeiro e, quando os dois são verdade, o dia 1
sai `'Embarque e Chegada ✈️🛬'` com as duas pernas na mesma lista: check-in no aeroporto → voo →
chegada → transfer → check-in no hotel → tarde → jantar. Os horários derivam de
`smartArrivalTime`, que já vinha certo; há um teste que trava a ordem cronológica.

### 3.3 `GeneratedItineraryStage.tsx` — o gerador que já era quase certo

```diff
-  const isShortFlight = outboundFlight.option.durationMinutes < 240;
-  const sameDayArrival = isShortFlight && !crossesMidnight;
+  const sameDayArrival = !crossesMidnight;
-    if (diff >= 1 && diff <= 3) arrivalDayIndex = diff;
+    if (diff >= 0 && diff <= 3) arrivalDayIndex = diff;
```

O `< 240` reprovava o caso 3 do briefing — **08:00 + 9 h pousa 17:00 do mesmo dia** — e excluía
exatamente 4 h no limite. Quem decide se virou o dia é a meia-noite, sozinha. E o `diff >= 1`
descartava o zero, ou seja, ignorava justamente a chegada no mesmo dia quando ela vinha de um voo
real escolhido.

### 3.4 `trip.ts` — a adição aprovada

```ts
'São Paulo-Cartagena': 7.5,
```

Chave nova numa tabela, conforme a regra da casa para `src/types/trip.ts`: **nunca modificar, só
adicionar**.

### 3.5 A decisão que o STEP1 não previu — horário de partida por direção

**Com a duração honesta, o bug voltava por outro caminho.** 7,5 h dispara
`flightHours > 6 ? '21:00'`, e 21:00 + 7,5 h − 2 h de fuso = 02:30 do dia seguinte: Cartagena
voltava para o D2, agora "legitimamente". Consertar a duração sem mexer nisso teria entregue um
patch que não corrige o caso relatado.

A regra `> 6 h ⇒ noturno` foi calibrada no transatlântico para leste — GRU→Lisboa sai à noite
mesmo — e por tabela mandava para a madrugada tudo que passasse de 6 h. O discriminador real não
é a duração, é a **direção**:

```ts
const isEastboundOvernight = tzDiff >= 3;
const departureTime = isLongHaul ? '23:00'
  : (flightHours > 6 && isEastboundOvernight ? '21:00' : '08:00');
```

**Isto muda destinos que não estavam no relato** — decisão deliberada, dentro do escopo
"cálculo de datas/voo", e vale sua conferida:

| Destino | Antes | Depois | Leitura |
|---|---|---|---|
| Lisboa, Paris, Tóquio, Dubai, Bangkok… | noturno | **noturno** | inalterado, `tzDiff >= 3` |
| Bogotá (7 h) | 21:00 | **08:00** | rota majoritariamente diurna |
| Cancún (9 h) | 21:00 | **08:00** | diurna com conexão |
| Miami (9 h), Orlando (9,5 h) | 21:00 | **08:00** | existem os dois; o diurno é o típico de lazer |
| Nova York (10 h) | 21:00 | **08:00** | existem os dois |
| Los Angeles, São Francisco (>10 h) | 23:00 | **23:00** | `isLongHaul` tem precedência |

Se você preferir Nova York e Miami de volta ao noturno, é subir o limiar de `flightHours > 6`
para `> 9` dentro do ramo diurno — uma linha, e os testes de Lisboa/Paris/Tóquio seguram o resto.

---

## 4. Testes

Suíte nova `src/test/flightArrivalDay.test.ts` — **12 casos, todos verdes**.

**Aritmética pura, fuso 0 (os três do briefing):**

| Caso | Resultado |
|---|---|
| `08:00 + 4h` → 12:00, mesmo dia | ✅ **D1** |
| `23:30 + 9h` → 08:30, cruza a meia-noite | ✅ **D2** |
| `08:00 + 9h` → 17:00, mesmo dia | ✅ **D1** |

Os três **já passavam antes do patch**: a aritmética nunca esteve errada. Ficam como trava contra
quem reintroduzir um `? 2 : 1`.

**Ponta a ponta, o caso da testadora-zero:** duração 7,5 h (não 4 h), partida 08:00, chegada no
mesmo dia, check-in do hotel no dia da chegada, dia 1 com voo + chegada + check-in de hotel na
mesma lista e em ordem cronológica, e o dia 2 **sem** uma segunda chegada.

**Não-regressão dos voos que já estavam certos:** Tóquio (24 h) mantém dia de trânsito e chega no
D3; Paris (11,5 h) sai 23:00 e chega no D2 com o dia 1 ainda sendo só embarque; Lisboa (9 h)
segue noturno — a regra de direção não pode transformar transatlântico em voo de dia; Buenos
Aires (3 h) chega no mesmo dia, como sempre deveria.

**Verificação completa:**

| Checagem | Resultado |
|---|---|
| Suíte inteira | **170/170** em 13 arquivos |
| `tsc --noEmit -p tsconfig.app.json` | limpo |
| `eslint` nos 4 arquivos | **18 problemas antes, 18 depois** — zero novos |
| `vite build` | ok em 23 s |

`generatorNoRepeat`, `tripHydration`, `tripAdoption` e `flight-fallback` tocam o mesmo objeto de
viagem e eram o alarme para o §3.2: passaram sem alteração.

---

## 5. Dívidas registradas

### 5.1 O fallback por fuso é um proxy errado por construção

`getFlightDuration` estima duração a partir de `Math.abs(tzDiff)`. Cartagena está a 2 h de fuso e
4.500 km; Fortaleza está a 0 h e 2.400 km. **O eixo norte-sul não aparece no fuso.** A linha nova
resolve um destino; a próxima cidade do catálogo sem entrada na tabela cai no mesmo buraco.

**Substituto honesto, para arco próprio:** o catálogo já tem lat/lng — distância haversine ÷
~850 km/h + 1 h de margem (taxi, subida, descida), com `FLIGHT_DURATION` mantida apenas como
**override** para rotas cuja conexão obrigatória distorce o tempo de voo puro (Cartagena é
exatamente esse caso: 7,5 h de porta a porta contra ~5 h de ar).

**Não feito agora, de propósito:** inventar uma segunda heurística no meio de um patch de correção
é o mecanismo que produziu a primeira.

### 5.2 Pré-requisito da missão da origem (§7.1 do relatório do kinu-ai)

A missão de ligar a cidade de origem ao agente **não pode começar** sem resolver isto antes:
`criar_viagem` no `KinuAIContext.tsx:362-364` chuta `originCity: 'São Paulo'` /
`originAirportCode: 'GRU'` **hardcoded**, e `createTrip.ts` e o wizard têm o mesmo default. Ou
seja: **origem presente ≠ origem conhecida.**

Ligar `trip.origin` no `<trip_context>` sem distinguir procedência faria o KINU voltar a dizer
"saindo de São Paulo" — agora com um dado do sistema por trás, o que o torna mais convincente e
igualmente falso. Precisa de um `originSource: 'user' | 'default'` (ou de `origin` só preenchido
na confirmação) **antes** de ligar o fio. Até lá, a proibição incondicional do commit `9c543dd`
é o que segura a mentira.

---

## 6. O que este patch NÃO fez

- **Não tocou em `src/data/`.**
- **Não modificou nada em `src/types/trip.ts`** — só a adição da chave nova, conforme a regra
  da casa.
- **Não tocou nos cartões de voo** (`MinimalFlightCard`, `FlightAnchorCard`, `FlightCard`):
  passam a mostrar "+1" só quando houver "+1".
- **Não tocou em `tripPdfExport.ts`** — sem lógica própria de chegada, herdou o conserto.
- **Não tocou em `plannedFlightToSelected`** — parou de envenenar o gerador do cockpit sozinho,
  assim que a `arrivalDate` de origem ficou correta.
- **Não tocou em `supabase/`.** O patch do kinu-ai de hoje (`9c543dd`) segue pendente de redeploy,
  independente deste.

---

## 7. Estado

| Item | Estado |
|---|---|
| Dia de chegada calculado (`createTrip`) | ✅ no `main` |
| Check-in do hotel no dia certo | ✅ no `main` |
| Grade de dias derivada + dia 1 combinado | ✅ no `main` |
| Horário de partida por direção | ✅ no `main` — **conferir §3.5** |
| `sameDayArrival` no cockpit | ✅ no `main` |
| `'São Paulo-Cartagena': 7.5` | ✅ no `main` |
| Suíte `flightArrivalDay.test.ts` | ✅ 12/12 · suíte inteira 170/170 |
| **Publish** | ⏳ **do fundador** |
| Haversine no lugar do proxy de fuso | 📋 dívida — §5.1 |
| `originSource` antes da missão da origem | 📋 pré-requisito — §5.2 |

Arcos 5.a-5.e inalterados. **O relógio do 5.f não foi tocado:** série diária desde 06/09, aperto
elegível a partir de 13/09.

**Rascunho `STEP1-VOO-D2.md`:** deletado, conforme protocolo. Nunca entrou em commit.
