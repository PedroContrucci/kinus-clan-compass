# Relatório — correção do voo de VOLTA

**Data:** 2026-08-03
**Diagnóstico de origem:** `DIAGNOSTICO-VOO-VOLTA.md`
**Escopo:** só front. Nenhuma edge function tocada — o Publish resolve.

## O que foi aplicado

### 1. A correção do bug (§5.1) — `FlightSelectionStage.tsx:248`

```diff
-    return generateFallbackFlightOptions(destinationCode, originCode, true);
+    return generateFallbackFlightOptions(originCode, destinationCode, true);
```

O swap duplo acabou: as duas chamadas ficaram simétricas (`originCode, destinationCode, <isReturn>`)
e a inversão passa a acontecer **num lugar só**, dentro da função. Adicionado um comentário no
cabeçalho da função dizendo que os parâmetros são a origem/destino **da viagem** e que o chamador
não deve pré-trocar nada — que era a armadilha.

### 2. Variação do fallback doméstico (§5.2) — `:102,107,112`

Os preços do trecho doméstico eram idênticos nos dois sentidos (850/920/1050). Agora seguem o mesmo
padrão do internacional:

| opção | ida | volta |
|---|---|---|
| 1 | 850 | 890 |
| 2 | 920 | 965 |
| 3 | 1050 | 1010 |

A ordem relativa foi preservada, então a opção 1 continua sendo a mais barata do conjunto e os
badges (`isBestPrice` / `isFastest`) continuam coerentes.

**A companhia eu deixei como está** — de propósito. O rótulo `Estimativa · companhia a definir` é
honesto: é dado simulado, e ele vaza para o roteiro salvo do usuário (`GeneratedItineraryStage.tsx:708`).
Trocar por nomes de companhias reais inventaria uma informação que o app não tem. O trecho
internacional, que é o modelo que você citou, também não diferencia companhia — só preço e duração.
Se você quiser mesmo companhias distintas, é um a mais, e sugiro que venham do dado real, não do
fallback.

### 3. Guarda contra regressão — `src/test/flight-fallback.test.tsx` (novo)

`generateFallbackFlightOptions` passou a ser exportada. O arquivo tem **5 testes**, em duas camadas:

**Camada 1 — o invariante da função** (o que o §5.3 sugeriu): rota da volta invertida, doméstico e
internacional, e ida/volta não idênticas (id, preço e horário diferentes).

**Camada 2 — o call site.** Aqui uma ressalva importante: os testes da camada 1 **não pegariam o bug
reportado**, porque o defeito não estava na função, estava em quem a chamava. Então adicionei dois
testes que renderizam a `FlightSelectionStage` com o hook de busca mockado devolvendo lista vazia
(exatamente o gatilho do fallback) e conferem a rota nos cartões: ida `FOR → REC`, volta `REC → FOR`.

**Verificado que a guarda morde:** reintroduzi o bug na linha 248 e rodei a suíte —
os 3 testes da camada 1 passaram, e só o teste de renderização da volta falhou. Depois restaurei a
correção.

## Verificação

```
npx tsc --noEmit    → limpo (exit 0)
npx vitest run      → 2 arquivos, 6 testes, todos passando
```

(O diagnóstico previa "2/2" arquivos; são 6 testes porque a guarda ficou nas duas camadas.)

## O que NÃO foi feito

- **§5.4, códigos de cidade vs. aeroporto** (edge devolve `SAO → RIO` para uma busca `GRU → GIG`).
  Cosmético, atinge ida e volta por igual e é da edge — fora do escopo "só front".
- `MinimalFlightCard.tsx` / `FlightAnchorCard.tsx` continuam como código morto; não foram tocados.
