# Diagnóstico — voo de VOLTA com a mesma rota da IDA

**Data:** 2026-08-03
**Reportado por:** tester — "as opções de VOO DE VOLTA aparecem idênticas às de ida — mesma origem e
destino (sempre Fortaleza→Recife, nunca Recife→Fortaleza)".
**Escopo:** diagnóstico apenas. **Nenhum arquivo de app foi alterado.**

## Veredito em uma linha

**Swap duplo.** A busca da volta está **correta** — quem está errado é o **fallback de dados
simulados**, chamado com origem/destino já trocados numa função que **troca outra vez por dentro**.
Duas inversões se cancelam e a volta volta a ser `FOR → REC`.

| Hipótese levantada na missão | Veredito |
|---|---|
| Segunda busca com origem/destino trocados | ❌ Não — a segunda busca está **correta** |
| Uma busca só (round-trip) mal interpretada na renderização | ❌ Não — são duas buscas `one_way=true` independentes |
| **Params da volta montados com as variáveis da ida (bug de cópia)** | ✅ **Sim — mas no _fallback_, não na busca** |

---

## 1) O fluxo, de ponta a ponta

```
FlightSelectionStage.tsx
   ├─ useFlightSearch(originCode,      destinationCode, departureDate)  → IDA    ✅
   └─ useFlightSearch(destinationCode, originCode,      returnDate)     → VOLTA  ✅
            │
            ▼  useFlightSearch.ts:56  supabase.functions.invoke('amadeus-flights')
      edge amadeus-flights/index.ts   (motor: Travelpayouts, NÃO Amadeus)
            │
            ▼  data.length > 0 ?
        ┌───┴────────────────────────────────┐
      SIM                                   NÃO
   dados reais ✅              generateFallbackFlightOptions(...) ❌ ← O BUG
```

O único seletor de voo vivo é `src/components/cockpit/FlightSelectionStage.tsx`, renderizado por
`DraftCockpit.tsx:348` e `:391`. `MinimalFlightCard.tsx` e `FlightAnchorCard.tsx` também desenham
"✈️ VOO DE VOLTA", mas são **código morto** — só aparecem no barrel `planejar/index.ts`, nenhum
componente os renderiza. Não são o caminho do tester.

---

## 2) O que está CERTO (descartado como causa)

### 2.1 As duas buscas — `FlightSelectionStage.tsx:189-209`

```ts
  } = useFlightSearch(                       // IDA — linha 189
    originCode,
    destinationCode,
    formatDateForAPI(departureDate),

  } = useFlightSearch(                       // VOLTA — linha 203
    destinationCode,                         // ← trocado corretamente
    originCode,                              // ←
    formatDateForAPI(returnDate),            // ← e com a data de volta
  );
```

Trocado corretamente, e a `queryKey` do react-query (`useFlightSearch.ts:50`) inclui origem, destino
e data — não há colisão de cache entre ida e volta. As datas flexíveis (`:212-229`) seguem o mesmo
padrão, também corretas.

### 2.2 A edge é simétrica — `supabase/functions/amadeus-flights/index.ts`

Não existe conceito de ida/volta na edge: ela recebe `origin`/`destination` e repassa
(`:144`, `one_way=true`), e a rota exibida sai do **item devolvido pelo upstream**
(`mapItemToOffer`, `:85-90`), não de nenhuma suposição de direção.

### 2.3 Prova ao vivo — a busca real devolve a direção certa

Sonda `POST /functions/v1/amadeus-flights` (a função não escreve em tabela nenhuma, `verify_jwt`
dispensável — sondar não persiste nada):

```
=== FOR -> REC @ 2026-08-20 ===   success=True  n=2
    FOR → REC  08:40  R$ 1806
    FOR → REC  08:40  R$ 511
=== REC -> FOR @ 2026-08-25 ===   success=True  n=3
    REC → FOR  20:40  R$ 478      ← direção correta
    REC → FOR  11:00  R$ 556
    REC → FOR  06:35  R$ 447
```

**Com dado real, a volta é `REC → FOR`.** O backend está limpo.

> Ressalva: a sonda mira `lnhbamzhturwkhcwiohr` (`supabase/config.toml:1`), cujo papel em produção
> segue **não identificado** — ver `RELATORIO-CORRECAO-LOTE6.md`, Correção 2. Isso não afeta este
> diagnóstico: o defeito é no **front**, que é o mesmo bundle em qualquer ref.

---

## 3) O que está ERRADO — o swap duplo

### 3.1 A função troca por dentro quando `isReturn` — `FlightSelectionStage.tsx:85-112`

```ts
function generateFallbackFlightOptions(
  originCode: string,                        // linha 86
  destinationCode: string,                   // linha 87
  isReturn: boolean = false                  // linha 88
): FlightOption[] {
  ...
  if (isDomestic) {
    return [
      { id: `${isReturn?'return':'outbound'}-fallback-dom-1`, airline: 'Estimativa · companhia a definir',
        route: isReturn?`${destinationCode} → ${originCode}`:`${originCode} → ${destinationCode}`,
        //     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ linha 98 — INVERSÃO Nº 2
```

A mesma inversão em **6 lugares**: linhas **98, 103, 108** (trecho doméstico) e **118, 130, 142**
(internacional).

### 3.2 E o chamador já entrega trocado — `FlightSelectionStage.tsx:232-246`

```ts
  const outboundOptions: FlightOption[] = useMemo(() => {
    if (outboundData && outboundData.length > 0) return outboundData.map(convertToFlightOption);
    return generateFallbackFlightOptions(originCode, destinationCode, false);   // linha 237 ✅
  }, [outboundData, originCode, destinationCode]);

  const returnOptions: FlightOption[] = useMemo(() => {
    if (returnData && returnData.length > 0) return returnData.map(convertToFlightOption);
    return generateFallbackFlightOptions(destinationCode, originCode, true);    // linha 245 ❌
    //                                   ^^^^^^^^^^^^^^^  ^^^^^^^^^^  INVERSÃO Nº 1
  }, [returnData, originCode, destinationCode]);
```

### 3.3 A conta

Viagem **Fortaleza (FOR) → Recife (REC)**, chamada da linha 245:

| | valor real | ligado ao parâmetro |
|---|---|---|
| argumento 1 | `destinationCode` = **REC** | parâmetro `originCode` |
| argumento 2 | `originCode` = **FOR** | parâmetro `destinationCode` |

Dentro da função, `isReturn === true`, então:

```
route = `${destinationCode} → ${originCode}`   // parâmetros
      = `${FOR}            → ${REC}`           // valores reais
      = "FOR → REC"                            // ← a rota da IDA
```

### 3.4 Reprodução executando o código real

Script que **recorta a função do próprio arquivo** e a executa (sem transcrever):

```
IDA   — generateFallbackFlightOptions(originCode, destinationCode, false)
   outbound-fallback-dom-1   route = "FOR → REC"   08:15  R$ 850
   outbound-fallback-dom-2   route = "FOR → REC"   10:40  R$ 920
   outbound-fallback-dom-3   route = "FOR → REC"   13:30  R$ 1050

VOLTA — generateFallbackFlightOptions(destinationCode, originCode, true)
   return-fallback-dom-1     route = "FOR → REC"   18:30  R$ 850
   return-fallback-dom-2     route = "FOR → REC"   20:00  R$ 920
   return-fallback-dom-3     route = "FOR → REC"   15:20  R$ 1050

route da volta esperado: "REC → FOR"
route da volta obtido:   "FOR → REC"      ❌ BUG CONFIRMADO
```

Bate com o relato **literalmente**, inclusive o "idênticas": mesma rota, **mesma companhia**
(`Estimativa · companhia a definir`) e **mesmos preços** (850/920/1050 nos dois sentidos — ver
§5.1). Só os horários diferem.

### 3.5 Por que o tester caiu no fallback

O fallback dispara quando a busca devolve lista vazia (`data.length > 0` falso). A mesma sonda numa
data sem cache do upstream:

```
=== FOR -> REC @ 2026-09-15 ===   success=True  n=0     ← lista vazia → fallback
=== REC -> FOR @ 2026-09-20 ===   success=True  n=0     ← lista vazia → fallback
```

`success=True` com `n=0` significa que o token está configurado e o upstream simplesmente não tinha
tarifa cacheada para aquele par/data (token ausente devolveria `success=false`, `:281-286`).
Rota curta e regional + data distante = fallback quase garantido. **Foi o que o tester viu.**

---

## 4) Exibição ou dado? — **os dois**

**Não existe busca errada.** No caminho do fallback não há busca nenhuma: o objeto é 100% simulado.
Mas o `route` **não é um rótulo** desenhado por cima de um dado certo — é o **único** lugar do
`FlightOption` que carrega origem e destino. O tipo (`:26-44`) não tem `departureAirport` /
`arrivalAirport`, e o fallback não preenche `segments`. Errado o `route`, o objeto inteiro não sabe
para onde vai.

E ele **não fica na tela do seletor** — vaza para o roteiro gerado:

```ts
// GeneratedItineraryStage.tsx:708  (atividade 'Voo de Volta')
location: returnFlight.option.route + (travelers > 1 ? ` (${travelers} pax)` : ''),
```

Ou seja: o roteiro salvo do usuário registra o voo de volta como **`FOR → REC`**. O rótulo do
cabeçalho da seção (`:624`, `{destination} ({destinationCode}) → {origin} ({originCode})`) está
**certo** — o que produz o sintoma mais confuso do bug: **o cabeçalho diz `REC → FOR` e todos os
cartões abaixo dele dizem `FOR → REC`.**

| Camada | Estado |
|---|---|
| Busca (front → edge → upstream) | ✅ correta nos dois sentidos |
| Cabeçalho "VOO DE VOLTA" (`:624`) | ✅ correto |
| Cartões de voo no fallback (`:98,103,108,118,130,142` + `:245`) | ❌ rota da ida |
| Roteiro gerado, atividade "Voo de Volta" (`:708`) | ❌ herda a rota errada |
| Cartões de voo com dado real da API | ✅ correto |

---

## 5) Correção recomendada

### 5.1 A correção — **uma linha**

Os nomes dos parâmetros (`originCode`, `destinationCode`) significam **origem e destino da viagem** —
é o que a chamada da ida (`:237`) já assume, e o `isReturn` existe justamente para a função derivar a
direção sozinha. O chamador da volta é que não devia trocar nada.

```diff
--- a/src/components/cockpit/FlightSelectionStage.tsx
@@ -245
-    return generateFallbackFlightOptions(destinationCode, originCode, true);
+    return generateFallbackFlightOptions(originCode, destinationCode, true);
```

Com isso as duas chamadas ficam simétricas (`originCode, destinationCode, <isReturn>`), a inversão
acontece **num lugar só** — e é exatamente o padrão que `DraftCockpit.tsx:256-277`
(`buildPlaceholderFlight`) já usa e acerta:

```ts
const from = isOutbound ? originCode : destinationCode;   // troca uma vez, num lugar só
const to   = isOutbound ? destinationCode : originCode;
```

> **Alternativa rejeitada:** tirar o `isReturn` de dentro dos 6 `route` e deixar o chamador trocar.
> Mexe em 6 linhas em vez de 1, e deixa `isReturn` governando preço/horário/id mas não a rota — a
> mesma armadilha, só que mais escondida.

### 5.2 Ainda no mesmo fallback — preços iguais nos dois sentidos

O trecho **doméstico** (`:95-112`) usa `850 / 920 / 1050` para ida **e** volta, e a mesma companhia
genérica. É metade do "aparecem idênticas" do relato e continua depois de corrigir a rota. O trecho
internacional (`:114-150`) já diferencia (`5500` vs `5800`, `4500` vs `4600`). **Sugestão:** aplicar
uma variação equivalente no doméstico. *Decisão sua — não é o bug reportado.*

### 5.3 Guarda contra regressão

`generateFallbackFlightOptions` não é exportada e não há teste de voo no repo (`npx vitest run` = 1
teste, `src/test/example.test.ts`). Sugiro **exportá-la** e fixar o invariante:

```ts
it('fallback da volta inverte a rota da ida', () => {
  const ida   = generateFallbackFlightOptions('FOR', 'REC', false);
  const volta = generateFallbackFlightOptions('FOR', 'REC', true);
  expect(ida[0].route).toBe('FOR → REC');
  expect(volta[0].route).toBe('REC → FOR');
});
```

### 5.4 Fora do escopo, observado de passagem

A edge devolve **códigos de cidade** onde o app manda **códigos de aeroporto**: busca `GRU → GIG`,
resposta `SAO → RIO` (o upstream normaliza para metropolitano). Cosmético, atinge ida e volta por
igual, e **não** tem relação com este bug — mas explica rotas que não batem com o aeroporto escolhido.

---

## 6) Resumo

| | |
|---|---|
| **Arquivo** | `src/components/cockpit/FlightSelectionStage.tsx` |
| **Linha** | **245** (a inversão nº 1), contra `:98,103,108,118,130,142` (a nº 2) |
| **Natureza** | swap duplo — dado simulado nasce errado; a busca real nunca esteve errada |
| **Gatilho** | busca devolve 0 ofertas (rota regional / data sem cache no upstream) |
| **Alcance** | cartões da volta **e** a atividade "Voo de Volta" do roteiro salvo (`GeneratedItineraryStage.tsx:708`) |
| **Correção** | 1 linha (§5.1) |
| **Estado** | ⏸️ **nada alterado** — aguardando sua ordem |
