# Relatório — cidade pegajosa + catálogo agrupado

**Data:** 2026-07-30
**Commit:** `65ee84a6b2d163592f6d182a3548fa286cf1f5b2` — `fix: sticky city context + grouped catalog injection`
**Origem:** correções derivadas de [`DIAGNOSTICO-FLORERIA.md`](DIAGNOSTICO-FLORERIA.md)
**Arquivos:** `src/contexts/KinuAIContext.tsx`, `supabase/functions/kinu-ai/index.ts`
(2 arquivos, 53 inserções, 5 remoções)

---

## Contexto

O diagnóstico da Florería Atlántico descartou bug de dados: o item chega íntegro ao modelo.
A assimetria nascia **depois da entrega** — o catálogo ia como uma lista corrida de até 80
linhas, e o modelo tende a citar sempre as primeiras. Some-se a isso o fato de que o
catálogo só era injetado quando a cidade aparecia *literalmente na mensagem*, o que
derrubava a fonte da verdade em qualquer follow-up ("e pra jantar?").

As duas correções atacam esses dois pontos.

---

## 1) Cidade pegajosa — `src/contexts/KinuAIContext.tsx`

**Problema:** `detectCuratedCity` só olhava a mensagem atual e o destino da viagem ativa.
Numa conversa como *"o que fazer em Buenos Aires?"* → *"e pra jantar?"*, a segunda mensagem
não tem cidade detectável e não há viagem ativa: `curatedCatalog` virava `null` e o agente
respondia sem catálogo — livre para inventar ou para recorrer só ao conhecimento geral.

**Mudança:**

| Linhas | O que |
|---|---|
| `:82-86` | novo `stickyCuratedCityRef` — última cidade curada detectada na conversa |
| `:117-128` | resolução da cidade com fallback na pegajosa |
| `:230` | `clearMessages` zera a pegajosa junto com o histórico |

Regra de precedência implementada em `:117-128`:

```ts
const hasActiveTrip = Boolean(tripContext?.destination);
const detectedCity = detectCuratedCity(content, tripContext?.destination);
if (detectedCity) {
  stickyCuratedCityRef.current = detectedCity;
} else if (hasActiveTrip) {
  stickyCuratedCityRef.current = null;
}
const curatedCity = detectedCity ?? (hasActiveTrip ? null : stickyCuratedCityRef.current);
```

- **Detecção explícita** na mensagem → sobrescreve a pegajosa.
- **Viagem ativa** → sobrescreve a pegajosa (`detectCuratedCity` já prioriza
  `tripContext.destination`).
- **Sem nenhuma das duas** → usa a pegajosa.

### Decisão de projeto registrada

Quando existe viagem ativa cujo destino **não** está no catálogo curado, a pegajosa é
**limpa** em vez de reaproveitada. Injetar o catálogo de Buenos Aires enquanto a pessoa
planeja outra cidade seria pior que não injetar nada — o agente passaria a recomendar
lugares da cidade errada como "fonte da verdade". Reverter isso é uma linha, caso a
preferência mude.

O estado é um `ref`, não `useState`: ele não deve disparar render, e é lido dentro do
`sendMessage` no mesmo tick em que é escrito.

---

## 2) Catálogo agrupado — `supabase/functions/kinu-ai/index.ts`

**Problema:** o bloco `CATÁLOGO CURADO KINU` era um `join("\n")` chapado de até 80 linhas.
Perguntas específicas ("onde jantar?", "vida noturna?") competiam com toda a lista, e itens
no fim do array — como `bue2-floreria`, 36º de 42 — raramente eram alcançados.

**Mudança:**

| Linhas | O que |
|---|---|
| `:331-340` | nova const `CATALOG_SECTIONS` — 6 seções em ordem cronológica do dia |
| `:507-531` | montagem do bloco reescrita, agrupando por `category` |

Seções, na ordem em que são emitidas (chaves = categorias de `SuggestedActivity`):

| Categoria | Cabeçalho |
|---|---|
| `breakfast` | ☕ CAFÉ DA MANHÃ |
| `morning` | 🌅 MANHÃ |
| `lunch` | 🍽️ ALMOÇO |
| `afternoon` | 🌤️ TARDE |
| `dinner` | 🌙 JANTAR |
| `night` | 🌃 NOITE |
| *(desconhecida/vazia)* | 📍 OUTROS |

Garantias mantidas:

- **Formato de cada linha inalterado** — `- Nome (categoria, bairro, R$custo) — tip`.
  Só entraram os cabeçalhos e a separação em blocos.
- **Nada é descartado em silêncio.** Categoria inesperada ou vazia cai em `📍 OUTROS`, em
  vez de sumir. `category` vem de `sanitizeText`, ou seja, é texto livre — o fallback
  cobre divergência futura entre o tipo TS e o que chega no payload.
- Seção vazia não é emitida.
- O cabeçalho do bloco ganhou instrução explícita: *"Está agrupado por momento do dia: vá
  direto à seção que responde à pergunta e considere TODOS os itens dela, não só os
  primeiros."*

---

## Verificação

**Type-check:** `npx tsc -p tsconfig.app.json --noEmit` → **OK**.

⚠️ **Ressalva:** `tsconfig.app.json` tem `include: ["src"]` — portanto **não cobre o edge
function**, e o Deno não está instalado neste ambiente. Para não deixar essa metade sem
verificação, a lógica nova de agrupamento foi replicada e executada contra os dados reais
do catálogo:

| Verificação | Resultado |
|---|---|
| Nenhum item perdido no agrupamento | ✅ **22 cidades** do registry — linhas emitidas == itens de entrada |
| Categoria desconhecida (`brunch_novo`) e vazia (`''`) | ✅ caem em `📍 OUTROS` |
| Buenos Aires emite os 6 cabeçalhos | ✅ na ordem cronológica |
| `bue2-floreria` na seção 🌃 NOITE | ✅ presente |
| `bue2-bomba` na seção 🌃 NOITE | ✅ presente |

Isso valida lógica e sintaxe do código novo, **não** sua execução sob Deno. Um
`deno check` continua pendente antes do deploy do edge function.

### Efeito medido na Florería

| | Antes | Depois |
|---|---|---|
| Posição vista pelo modelo | 36ª de 42, lista corrida | 6ª de 6, dentro de 🌃 NOITE |

Ou seja: numa pergunta sobre vida noturna em Buenos Aires, o modelo passa a ter uma seção
de 6 linhas para consultar em vez de varrer 42. Isso ataca diretamente a hipótese 1 do
`DIAGNOSTICO-FLORERIA.md` (teto de 3-5 vereditos da regra 17 aplicado sobre lista chapada).

**O que ainda não está provado:** que o agente passe a citar a Florería numa conversa real.
As duas mudanças melhoram as condições de recuperação; confirmar exige reproduzir a
conversa e observar a resposta. A regra 17(4) — adequar a *crianças* e orçamento — continua
valendo e pode, legitimamente, preterir um speakeasy de R$80 num app de viagem em clã.

---

## Pendências

- [ ] `deno check` / deploy do `supabase/functions/kinu-ai`
- [ ] Reproduzir conversa de vida noturna em Buenos Aires e confirmar a hipótese 1
- [ ] Decidir se a pegajosa deve sobreviver a uma viagem ativa não-curada (hoje: não)
