# MATRIZ A.1 — Voo e fuso: casos de aceitação

**Versão:** v1 · 05/out/2026 · **Dono:** Pedro · **Vira:** `src/test/flightEngine.test.ts` + regras R11–R12 do `itineraryValidator`
**Regra de ouro:** chegada é sempre calculada em UTC e convertida para a hora local de cada ponto. Nunca "saída local + duração". D+n é calculado sobre datas locais.

## 0. Convenções

- Origem padrão **GRU** (São Paulo, UTC−3, sem horário de verão desde 2019).
- Datas-padrão da matriz: **ida 10/nov/2026, volta 15/nov/2026** (mesmas do fluxo curto). Casos de horário de verão usam **10–15/jul/2026**.
- Duração = porta a porta, incluindo conexões. Estimativa pode errar ±1h; **D+n não pode errar**.
- `tzKnown:false` → tela mostra "horário de chegada a confirmar". **Nunca** um fallback numérico.
- Preço: por pessoa, por perna; total = soma das pernas × viajantes. Fonte sempre declarada: `route` | `tier` | `amadeus` | `confirmed`.

## 1. Fusos na data da viagem (o motor calcula; a matriz confere)

| Cidade | IANA | nov/2026 | jul/2026 | Δ vs GRU (nov) |
|---|---|---|---|---|
| São Paulo | America/Sao_Paulo | −3 | −3 | 0 |
| Fortaleza | America/Fortaleza | −3 | −3 | 0 |
| Cartagena | America/Bogota | −5 | −5 | −2 |
| Nova York | America/New_York | −5 (EST) | −4 (EDT) | −2 (jul: −1) |
| Lisboa | Europe/Lisbon | 0 (WET) | +1 (WEST) | +3 (jul: +4) |
| Cidade do Cabo | Africa/Johannesburg | +2 | +2 | +5 |
| Tóquio | Asia/Tokyo | +9 | +9 | +12 |

Horário de verão: NY e Lisboa mudam no último domingo de outubro / primeiro de novembro. **Um teste de julho e um de novembro por cidade com DST** — é a única forma de provar que a data entra no cálculo.

## 2. Casos — ida

| # | Rota | Duração | Saída (local) | Chegada esperada (local) | D+n | Conexão | Observação |
|---|---|---|---|---|---|---|---|
| I1 | GRU→FOR | 3h25 | 08:00 | 11:25 | D+0 | direto | mesmo fuso; caso-controle |
| I2 | GRU→CTG | 7h30 | 08:00 | 13:30 | D+0 | 1 (BOG) | −2h; regex "7.5h" → 450 min |
| I3 | GRU→LIS (nov) | 10h00 | 23:00 | 12:00 | **D+1** | direto | pernoite; +3h |
| I3b | GRU→LIS (jul) | 10h00 | 23:00 | 13:00 | **D+1** | direto | mesma saída, chegada muda 1h por DST |
| I4 | GRU→JFK (nov) | 9h45 | 22:00 | 05:45 | **D+1** | direto | −2h; chegada de madrugada |
| I4b | GRU→JFK (jul) | 9h45 | 22:00 | 06:45 | **D+1** | direto | DST |
| I5 | GRU→NRT | 26h00 | 18:00 | 08:00 | **D+2** | 1 (DOH/DXB/IST) | +12h; único caso D+2 |
| I6 | GRU→CPT | 14h00 | 17:00 | 12:00 | **D+1** | 1 (JNB) | +5h |

Verificação de cada linha: `chegadaUTC = saídaLocal − offsetOrigem + duração`; `chegadaLocal = chegadaUTC + offsetDestino(na data de chegada)`; `D+n = dataLocalChegada − dataLocalSaída`.

## 3. Casos — volta

| # | Rota | Duração | Saída (local destino) | Chegada GRU (local) | D+n | Regra do último dia |
|---|---|---|---|---|---|---|
| V1 | FOR→GRU | 3h25 | 14:00 | 17:25 | D+0 | manhã livre, almoço, aeroporto 12:00 |
| V2 | CTG→GRU | 7h30 | 09:00 | 18:30 | D+0 | só café + check-out; aeroporto 06:00 |
| V3 | LIS→GRU (nov) | 10h00 | 13:00 | 20:00 | D+0 | manhã curta; aeroporto 10:00 |
| V4 | JFK→GRU (nov) | 9h45 | 22:00 | 09:45 | **D+1** | dia inteiro útil; aeroporto 19:00 |
| V5 | NRT→GRU | 27h00 | 22:00 | 13:00 | **D+1** | dia inteiro útil; aeroporto 19:00 |
| V6 | CPT→GRU | 14h00 | 14:00 | 23:00 | D+0 | manhã curta; aeroporto 11:00 |

**Regra R-V8 (último dia):** hora de ir para o aeroporto = saída − 3h (internacional) / − 2h (doméstico). Atividades do último dia só até essa hora, com deslocamento. Se saída < 10:00, o último dia tem apenas café e check-out.

## 4. Regras que a matriz prova

| Regra | Enunciado | Caso que a quebra hoje |
|---|---|---|
| R-V1 | Chegada calculada em UTC, convertida para local de cada ponto | cockpit soma saída + duração sem fuso |
| R-V2 | D+n sobre datas locais, nunca sobre horas somadas | regex "7.5h" → Cartagena D+2 (Rachel, 09/set) |
| R-V3 | Fuso por origem **e** destino, na **data da viagem** | `getTimezoneDiff` ignora origem e data; fallback 4 |
| R-V4 | Conexão: cada segmento com hora local do seu aeroporto; total = soma + esperas | Amadeus `segments[]` sem fuso no cockpit |
| R-V5 | Preço por perna, fonte declarada; total × viajantes | (A.5 feito: route/tier) |
| R-V6 | Fuso desconhecido → `tzKnown:false` + "a confirmar"; nunca número | fallback 4 |
| R-V7 | Horário de verão pela data (Intl, IANA) | gap medido "hoje" |
| R-V8 | Último dia termina na hora do aeroporto (−3h intl / −2h dom) | rascunho fixa volta 14:00 |
| R-V9 | Dia 1: chegada antes de 14:00 → tarde leve; 14–20h → só jantar; após 20:00 → nada; D+1/D+2 desloca o dia 1 | tela e rascunho divergem |
| R-V10 | Recovery day por severidade, tabela nomeada, calibrada (§5) | ALTO = MODERADO hoje |
| R-V11 | Trocar a ida recalcula dia 1 e D+n; trocar a volta recalcula o último dia; nada apagado em silêncio | (A.4) |
| R-V12 | Card, lista, Financeiro, roteiro e PDF leem o mesmo objeto de voo | `trip.flights.*` vs `outboundFlight` |

## 5. Severidade (Biology AI) — proposta de calibração para `RECOVERY_BY_SEVERITY`

Entrada: |Δ fuso| **e** pernoite/duração. Hoje a tabela dá recovery day igual para MODERADO, ALTO e SEVERO — Cartagena (−2h, diurno) não pode perder um dia.

| Severidade | Critério proposto | Dia 1 | Dia 2 |
|---|---|---|---|
| BAIXO | \|Δ\| ≤ 2 e sem pernoite | normal (R-V9) | normal |
| MODERADO | \|Δ\| ≤ 2 com pernoite **ou** 3 ≤ \|Δ\| ≤ 5 | leve | manhã leve, tarde normal |
| ALTO | 6 ≤ \|Δ\| ≤ 8 | chegada + descanso | recovery day (leve, perto do hotel) |
| SEVERO | \|Δ\| ≥ 9 | chegada + descanso | recovery day + dia 3 leve |

Exemplos: FOR = BAIXO · CTG = BAIXO · JFK (pernoite, −2) = MODERADO · LIS (+3, pernoite) = MODERADO · CPT (+5, pernoite) = MODERADO/ALTO (decidir) · NRT (+12) = SEVERO.
**Decisão pendente do Pedro:** aprovar esta tabela ou manter a atual. A matriz testa a tabela aprovada.

## 6. Casos de troca de perna (A.4)

| # | Viagem base | Troca | Efeito esperado |
|---|---|---|---|
| T1 | LIS, ida 23:00 (D+1 12:00) | ida → 10:00 (chega 23:00 D+0) | dia 1 vira "chegada noturna, nada"; dia 2 passa a ser o 1º de exploração; D+n = 0 |
| T2 | FOR, volta 14:00 | volta → 07:30 | último dia só café + check-out; atividades da manhã reencaixadas ou removidas **com aviso** |
| T3 | NRT, ida 18:00 (D+2) | ida → 01:00 (chega 14:00 D+1) | ganha um dia; motor insere dia de exploração; orçamento de passeios sobe |
| T4 | qualquer | troca com edições manuais no roteiro | confirmação "refaz o roteiro e desfaz N trocas" (já existe) |

## 7. Prova de realidade (A.6) — a tabela que o Pedro preenche

Datas: **ida 10/nov/2026, volta 15/nov/2026, 1 adulto, econômica, Google Flights**, cotado na mesma hora. Preço ida+volta por pessoa, em R$. Anotar também o menor tempo total e se é direto.

| Cidade | IATA (conferir) | Ida+volta R$ | Menor duração ida | Direto? | Cotado em |
|---|---|---|---|---|---|
| Fortaleza | FOR | | | | |
| Rio de Janeiro | GIG | | | | |
| Salvador | SSA | | | | |
| Porto Seguro | BPS | | | | |
| Gramado | POA (ou CXJ) | | | | |
| Buenos Aires | EZE | | | | |
| Cartagena | CTG | | | | |
| Orlando | MCO | | | | |
| Cidade do Cabo | CPT | | | | |
| Istambul | IST | | | | |
| Marrakech | RAK | | | | |
| Bangkok | BKK | | | | |
| Singapura | SIN | | | | |

Tolerância: estimativa do KINU dentro de **±20%** do cotado. Fora disso, a linha da tabela de rotas é corrigida; o rótulo "estimativa por rota" só vale para rotas dentro da tolerância.

## 8. O que este documento não decide

- Ranking de ofertas reais (direto > preço > janela de chegada) — A.3
- Preço dos hotéis por tier (Casa Lola "Conforto") — A.6, parte 2
- UI do bloco de voo — C.4
