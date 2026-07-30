# Diagnóstico — `bue2-floreria` (Florería Atlántico) não aparece pro agente

**Data:** 2026-07-30 · **Status:** investigação concluída, **nenhuma correção aplicada**
**Veredito:** não é bug de dados nem de slice. O item **chega íntegro** ao modelo.

---

## Resumo

| Pergunta | Resposta |
|---|---|
| (a) Existe no array de Buenos Aires? | **Sim** — `src/data/destinationActivities.ts:1095` |
| (b) Posição / sobrevive aos slices? | **Índice 35 de 42.** Sobrevive aos dois `slice(0, 80)` |
| (c) Sync pulou por status/bug? | **Não se aplica** — o item não está ausente |

A hipótese de truncamento está **descartada**: o array de Buenos Aires tem 42 entradas, ou
seja, *nenhum* item é cortado por um corte em 80. `bue2-bomba` (idx 30) e `bue2-floreria`
(idx 35) estão ambos muito abaixo do limite.

---

## Evidências

### (a) O item existe no `.ts`

```
src/data/destinationActivities.ts:1095
  { id: 'bue2-floreria', name: 'Florería Atlántico', category: 'night',
    neighborhood: 'Retiro', rating: 4.6, estimatedCostBRL: 80, durationHours: 2,
    tips: ['O speakeasy atrás da floricultura — entre os melhores bares do mundo',
           'Reserve; peça os drinks de imigrantes'], styleTags: ['nightlife'] },
```

Busca no repositório inteiro (excluindo `node_modules`/`.git`): **1 única ocorrência**.
Não há `.js` sombreando o `.ts` (aquele problema foi resolvido em `39220a6`), não existe
diretório `dist/`, e não há cópia duplicada do catálogo em outro lugar.

**Os dois ids entraram no mesmo commit:**

```
$ git log --oneline -S'bue2-floreria' -- src/data/destinationActivities.ts
732d13b feat: sync Lisboa/Rome/BA/Orlando from curated DB (LOTE 2)

$ git log --oneline -S'bue2-bomba' -- src/data/destinationActivities.ts
732d13b feat: sync Lisboa/Rome/BA/Orlando from curated DB (LOTE 2)
```

Isso é importante: **não existe cenário de build defasado** que explique a diferença. Se o
app rodasse um bundle anterior a `732d13b`, *nenhum* dos dois apareceria. Como `bue2-bomba`
aparece, o build em uso é ≥ `732d13b` — e portanto contém `bue2-floreria`.

### (b) Posição no array e sobrevivência aos slices

Array `buenosAiresActivities` (declarado em `:1059`) — **42 entradas**:

```
 0 bue-ateneo          10 bue-heladeria-rapa-nui  20 bue-plaza-mayo      30 bue2-bomba      ←
 1 bue-cafe-san-juan   11 bue-la-cabrera          21 bue-preferido       31 bue2-bombonera
 2 bue-caminito        12 bue-las-lilas           22 bue-puerto-madero   32 bue2-cadore
 3 bue-chori           13 bue-las-violetas        23 bue-recoleta        33 bue2-ecoparque
 4 bue-cocu            14 bue-mercado-san-telmo   24 bue-san-telmo       34 bue2-el-beso
 5 bue-cuartito        15 bue-mezzetta           25 bue-sanjuanino       35 bue2-floreria   ←
 6 bue-don-julio       16 bue-milonga-viruta      26 bue-tango-san-telmo 36 bue2-la-cocina
 7 bue-florida-galerias 17 bue-palermo-bosques    27 bue-teatro-colon    37 bue2-malba
 8 bue-gran-parrilla-plata 18 bue-palermo-soho     28 bue-tortoni        38 bue2-mataderos
 9 bue-guerrin         19 bue-parrilla-pena       29 bue2-bellas-artes   39 bue2-planetario
                                                                        40 bue2-tigre
                                                                        41 bue2-usina
```

Os dois pontos de corte:

1. `src/contexts/KinuAIContext.tsx:25` — `data.activities.slice(0, 80)` → 42 ≤ 80, **nada cortado**
2. `supabase/functions/kinu-ai/index.ts:486` — `cat.items.slice(0, 80)` → idem, **nada cortado**

**Simulação do pipeline completo** (`buildCuratedCatalog` + sanitização do edge function,
executada sobre o arquivo real):

```
buildCuratedCatalog -> 42 itens
após sanitização   -> 42 itens

linha final de Bomba    (idx 30):
- La Bomba de Tiempo (night, Almagro, R$40) — A percussão improvisada das segundas no Konex — energia inesquecível · SÓ segunda-feira: encaixe o dia certo

linha final de Florería (idx 35):
- Florería Atlántico (night, Retiro, R$80) — O speakeasy atrás da floricultura — entre os melhores bares do mundo · Reserve; peça os drinks de imigrantes

caracteres do bloco CATÁLOGO: 6161
```

Ambas as linhas são montadas **íntegras** no bloco `CATÁLOGO CURADO KINU`. Nenhum filtro
descarta o item: `sanitizeText` só remove caracteres de controle `\x00-\x1F\x7F` (os
acentos de *Florería Atlántico* passam intactos) e o único `.filter()` remanescente exige
`name.length > 0`.

### (c) Sync / status no banco — não se aplica

O item **não está ausente** do `.ts`, então não houve skip por `status` nem bug no script.
Consistência confirmada de outra forma: `scripts/sync-catalog.ts` **reescreve o array
inteiro** a partir do banco e aborta com restauração do arquivo se a contagem divergir
(`:233-236`). O `RELATORIO-SYNC-LOTE2.md` registra Buenos Aires com 42 entradas, arquivo ==
banco. Se `bue2-floreria` está no arquivo, ele veio de uma linha `status='published'` do
`curated_activities`.

---

## Onde a diferença realmente pode nascer

O anexo do catálogo é **tudo-ou-nada por mensagem** (`KinuAIContext.tsx:112-113`): ou os 42
itens vão, ou nenhum vai. Não existe caminho no código que entregue `bue2-bomba` e retenha
`bue2-floreria`. Logo a assimetria é **posterior à entrega** — do lado do modelo.

Hipóteses, em ordem de plausibilidade:

**1. Corte de curadoria no próprio prompt (mais provável).**
`supabase/functions/kinu-ai/index.ts:104`, regra 17:

> `(2) apresente no máximo 3-5 vereditos, nunca a lista crua;`
> `(4) adeque ao contexto da viagem (orçamento, interesses, crianças) quando existir`

Com 42 itens entregues e um teto de 3-5 exibidos, **a ausência de um item específico é o
comportamento esperado, não uma falha**. E o critério (4) cita explicitamente *crianças* —
num app de viagem em clã/família, um *speakeasy* de coquetéis a R$80 (`styleTags:
['nightlife']`, sem contrapartida diurna) é candidato natural a ser preterido, enquanto La
Bomba de Tiempo é show de percussão a R$40, com apelo familiar bem mais amplo. Os dois são
`category: 'night'`, mas não são equivalentes sob a regra 17(4).

**2. Ranking por custo/contexto da viagem.** `estimatedCostBRL` 80 vs 40 — se o contexto da
viagem tiver orçamento apertado, a regra 17(4) empurra o item mais caro para fora do top-5.

**3. Restrição de dia da viagem.** A tip de Bomba (*"SÓ segunda-feira"*) é acionável e dá ao
modelo um motivo forte para citá-la quando há roteiro dia-a-dia; Florería não tem gancho
temporal equivalente.

### Limite desta investigação

Não tenho a transcrição real da conversa nem o prompt final enviado na sessão em que o
problema foi observado. As três hipóteses acima são inferidas do código do prompt, não
observadas. **O que está provado é o lado dos dados:** o item existe, está no índice 35 de
42, sobrevive aos dois slices e é serializado íntegro no bloco do catálogo.

**Próximo passo sugerido (não executado):** reproduzir uma conversa perguntando
explicitamente por bares/vida noturna em Buenos Aires e capturar o payload de
`curatedCatalog` enviado, para confirmar a hipótese 1 antes de mexer em qualquer coisa.

---

## Arquivos e linhas citados

| Referência | Papel |
|---|---|
| `src/data/destinationActivities.ts:1095` | entrada `bue2-floreria` |
| `src/data/destinationActivities.ts:1090` | entrada `bue2-bomba` |
| `src/data/destinationActivities.ts:1059` | declaração de `buenosAiresActivities` |
| `src/data/destinationActivities.ts:4939` | registry `'Buenos Aires'` → `buenosAiresActivities` |
| `src/contexts/KinuAIContext.tsx:22-32` | `buildCuratedCatalog` — `slice(0, 80)` |
| `src/contexts/KinuAIContext.tsx:112-113` | anexo tudo-ou-nada do catálogo |
| `supabase/functions/kinu-ai/index.ts:486` | `cat.items.slice(0, 80)` |
| `supabase/functions/kinu-ai/index.ts:331-334` | `sanitizeText` |
| `supabase/functions/kinu-ai/index.ts:104` | regra 17 (teto de 3-5 vereditos) |
