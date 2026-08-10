# Relatório de Diagnóstico — Cover quebrado do roteiro "Nordeste Brasileiro"

**Data:** 2026-08-10
**Escopo:** diagnóstico apenas. **Nenhum arquivo foi modificado.**
**Sintoma:** o roteiro "Nordeste Brasileiro: Sol, Mar e Cultura" (Salvador) abre o modal
com hero escuro e alt text visível — imagem quebrada. Japão e Itália renderizam normal.

---

## TL;DR

**É problema de DADO, não de código.** O `cover_image_url` do roteiro do Nordeste aponta
para uma foto do Unsplash que **não existe mais** — retorna **HTTP 404** com
`content-type: text/html`. A URL está perfeitamente bem-formada: não é campo vazio, não
tem espaço, não tem diferença de formato em relação às que funcionam. Ela simplesmente
morreu na origem.

**O patch do `ItineraryDetailModal` não causou isso.** O hero já abria quebrado antes —
mas o carrossel tinha mais duas fotos válidas, então dava para navegar para longe do
erro. O patch removeu essas duas fotos (que eram justamente o bug anterior), e com isso
**expôs** um defeito de dado que já existia. Detalhe em §5.

**Achado bônus:** a investigação revelou a origem exata das duas fotos hardcoded que
removi no patch anterior — elas eram os `cover_image_url` de outros dois roteiros da
própria tabela. Ver §6. Fecha em definitivo o diagnóstico do bug do Japão.

---

## 1. Fonte dos dados dos "Roteiros Completos"

Não é mock, não é arquivo estático. É **tabela do Supabase**.

| Item | Valor |
|---|---|
| Tabela | `community_itineraries` |
| Hook | `useCommunityItineraries` — `src/hooks/useSupabaseData.ts:176-209` |
| Consumo | `src/pages/Cla.tsx:110` → `filteredItineraries` → `ItineraryCard` (`Cla.tsx:520-526`) |
| Filtro | `.eq('is_published', true)`, ordenado por `likes_count` desc |

```ts
// src/hooks/useSupabaseData.ts:184-192
let query = supabase
  .from('community_itineraries')
  .select(`
    *,
    destination_city:cities(*),
    destination_country:countries(*)
  `)
  .eq('is_published', true)
  .order('likes_count', { ascending: false });
```

A migration `supabase/migrations/20260206002306_*.sql:157` apenas **cria** a coluna
`cover_image_url TEXT` — não há seed no repositório. As linhas existem somente no banco
live, o que significa que **a correção não pode ser feita por commit**; tem que ser no
banco (ver §7).

---

## 2. Valor literal do `cover_image_url` do Salvador/Nordeste

Consultado via REST API do Supabase com a chave anon do `.env`:

```
id:              a2762135-4323-4cb9-b8e7-946012516895
title:           Nordeste Brasileiro: Sol, Mar e Cultura
cover_image_url: https://images.unsplash.com/photo-1551592398-bec5ca7e5921?w=800
is_published:    true
```

Valor literal, sem truncar:

```
https://images.unsplash.com/photo-1551592398-bec5ca7e5921?w=800
```

Sem espaços à esquerda/direita, sem caractere invisível, sem `null`, sem string vazia.
O campo está **populado e sintaticamente perfeito**.

---

## 3. Comparação com Japão e Itália — o que difere

A diferença **não é** formato, nem campo vazio, nem espaço. É que **a URL está morta**.

Teste HTTP em todas as 5 capas publicadas:

| Roteiro | Photo ID | HTTP | content-type |
|---|---|---|---|
| Itália Clássica | `photo-1552832230-c0197dd311b5` | **200** | `image/jpeg` |
| Japão Completo | `photo-1493976040374-85c8e12f0c0e` | **200** | `image/jpeg` |
| **Nordeste Brasileiro** | `photo-1551592398-bec5ca7e5921` | **404** | `text/html` ❌ |
| Portugal de Norte a Sul | `photo-1555881400-74d7acaacd8b` | **200** | `image/jpeg` |
| Tailândia: Praias e Templos | `photo-1552465011-b4e21bf6e79a` | **200** | `image/jpeg` |

Todas as 5 seguem o mesmo padrão `https://images.unsplash.com/photo-<id>?w=800`. Mesma
origem, mesmo query param, mesmo formato. O ID do Nordeste é o único que o Unsplash não
resolve mais — devolve uma página HTML de erro, que o `<img>` não consegue renderizar.
Daí o hero escuro com o alt text aparecendo.

**Nota sobre o Japão renderizar "perfeitamente":** é em parte coincidência. O
`cover_image_url` do roteiro do Japão é `photo-1493976040374-85c8e12f0c0e` — **exatamente
a mesma constante** que serve de `FALLBACK_PHOTO` no modal
(`ItineraryDetailModal.tsx:81`). Esse roteiro renderizaria igual mesmo com o campo vazio.

---

## 4. Outros roteiros no mesmo estado

**Nenhum.** Entre os 5 roteiros publicados, o do Nordeste é o único com URL morta. Os
outros 4 respondem 200 com `image/jpeg`.

⚠️ **Porém, o apodrecimento não está contido na tabela.** Ao procurar um substituto,
testei as duas fotos de Salvador catalogadas em `src/data/destinationPdfData.ts:837-840`:

| Photo ID | Origem | HTTP |
|---|---|---|
| `photo-1596394516093-501ba68a0ba6` | `destinationPdfData.ts:838` | **200** ✅ |
| `photo-1586793744669-1a48b9d59a8c` | `destinationPdfData.ts:839` | **404** ❌ |

Ou seja: **há URLs mortas também no catálogo estático do repositório**, fora da tabela.
Não varri o repo inteiro (são centenas de URLs Unsplash hardcoded em `destinationPdfData.ts`,
`destinations.ts` e afins) porque está fora do escopo desta missão — mas fica registrado
que uma varredura completa provavelmente encontraria mais. Recomendo tratar como item
separado.

---

## 5. O patch anterior causou isso?

**Não. Ele expôs um defeito que já existia.** Vale a precisão, já que o relato veio como
"após o patch".

Comportamento **antes** do patch:

```tsx
const photos = [
  itinerary.cover_image_url || '...fallback...',   // ← URL morta é truthy: passa
  '...photo-1552465011...',                        // válida
  '...photo-1555881400...',                        // válida
];
```

A URL morta é uma string não-vazia, portanto **truthy** — o `||` nunca disparava o
fallback. `photos[0]` já era a URL 404, e o modal do Nordeste **já abria com o hero
quebrado**. A diferença é que existiam mais duas fotos válidas: as setas apareciam e o
usuário podia navegar para uma imagem que carregava, o que mascarava o sintoma.

Comportamento **depois** do patch:

```tsx
const coverPhotos = [itinerary.cover_image_url].filter(Boolean) as string[];
const photos = coverPhotos.length > 0 ? coverPhotos : [FALLBACK_PHOTO];
```

`filter(Boolean)` tem exatamente a mesma semântica de truthiness do `||` anterior — a URL
morta continua passando. O array agora tem tamanho 1, então não há mais para onde
navegar, e o hero quebrado fica permanentemente à vista.

**Conclusão:** mesma foto quebrada nos dois casos; o patch removeu o disfarce, não criou
o defeito. Nenhum dos dois códigos jamais tratou "URL presente porém morta" — só tratam
"URL ausente".

---

## 6. Achado bônus — fecha o diagnóstico do bug original

As duas URLs que estavam hardcoded no modal e que removi no patch anterior são,
literalmente, os `cover_image_url` de outros dois roteiros da mesma tabela:

| URL hardcoded no modal | É a capa de |
|---|---|
| `photo-1552465011-b4e21bf6e79a` | **"Tailândia: Praias e Templos"** |
| `photo-1555881400-74d7acaacd8b` | **"Portugal de Norte a Sul"** |

Isso confirma o relato do tester com precisão total: ele viu uma **praia da Tailândia**
(que identificou como Phuket) e uma foto de **Portugal** (que identificou como Porto).
No diagnóstico anterior eu havia confirmado o Porto por `destinationPdfData.ts:478` mas
registrei que não conseguia verificar a foto da Tailândia — ela não aparecia em lugar
nenhum do repositório. Agora está explicado: ela nunca esteve no repo, estava no banco.

Alguém aparentemente copiou as capas de dois roteiros vizinhos para "encher" o carrossel.

---

## 7. Proposta de correção — é dado ou é código?

### Correção primária: DADO (obrigatória, resolve o sintoma)

Um `UPDATE` numa linha do Supabase. **Zero alteração de código, zero deploy.**

```sql
UPDATE public.community_itineraries
SET cover_image_url = 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800'
WHERE id = 'a2762135-4323-4cb9-b8e7-946012516895';
```

A foto sugerida está **verificada como viva (HTTP 200)** e é a que o próprio repositório
cataloga como Salvador em `src/data/destinationPdfData.ts:838` (Pelourinho / cultura
afro-brasileira). É coerente com o destino do roteiro.

*Ressalva:* não tenho como saber qual foto o autor do roteiro pretendia originalmente —
a original foi despublicada do Unsplash e não é recuperável. Esta é uma substituição
adequada ao destino, não a restauração do conteúdo original. Se houver preferência
editorial, o valor do `SET` é o único ponto a trocar.

### Correção secundária: CÓDIGO (recomendada, previne recorrência)

O `UPDATE` conserta este roteiro hoje. Não impede que **qualquer** capa morra amanhã —
URLs do Unsplash são despublicáveis a qualquer momento, e o app não tem nenhuma defesa
contra isso. Hoje o resultado é sempre um hero quebrado com alt text.

Defesa mínima, em `src/components/community/ItineraryDetailModal.tsx`, no `<motion.img>`
da linha ~156:

```tsx
onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_PHOTO; }}
```

~1 linha, risco baixo, transforma "imagem quebrada" em "imagem genérica". O mesmo vale
para o `<img>` do lightbox (~linha 409) e, com a constante equivalente, para o
`ItineraryCard`.

**Recomendação:** aplicar as duas. A de dado resolve o chamado do tester; a de código
evita que o próximo link morto vire outro ticket. Nenhuma das duas foi aplicada — esta
missão era só de diagnóstico.

---

## 8. Como os dados foram obtidos

Consulta **somente leitura** à REST API do Supabase, autenticada com a
`VITE_SUPABASE_PUBLISHABLE_KEY` do `.env` (chave anon, pública por natureza — é a mesma
que o browser usa). Nenhum `INSERT`/`UPDATE`/`DELETE` foi executado. As verificações de
disponibilidade foram `curl` HEAD/GET contra `images.unsplash.com`.

Arquivos inspecionados, nenhum modificado:

```
src/hooks/useSupabaseData.ts                 src/data/destinationPdfData.ts
src/pages/Cla.tsx                            supabase/migrations/20260206002306_*.sql
src/components/community/ItineraryDetailModal.tsx
```
