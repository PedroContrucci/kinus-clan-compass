# Relatório — Candidatas de capa para "Nordeste Brasileiro: Sol, Mar e Cultura"

**Data:** 2026-08-10
**Escopo:** somente leitura. **Nenhum arquivo de código/dado modificado, nenhum INSERT/UPDATE/DELETE executado.**
**Alvo:** `community_itineraries.id = a2762135-4323-4cb9-b8e7-946012516895`

---

## TL;DR

Cinco candidatas verificadas, todas **HTTP 200 `image/jpeg`** e todas **inspecionadas
visualmente** — não só testadas por status. A recomendada é a **capoeira no Pelourinho**
(§3, candidata 1): é comprovadamente Salvador e cobre o "Cultura" do título.

**Correção importante:** a capa que está hoje no banco é a foto que eu mesmo recomendei
no `RELATORIO-DIAGNOSTICO-COVER-SALVADOR.md` §7. Ela está viva, mas o conteúdo é os
**Alpes**, não Salvador. O relato do fundador está correto e a minha recomendação anterior
estava errada. Detalhe em §5.

**Alerta de método:** a busca do Unsplash devolve resultado geograficamente errado com
frequência alta — a query `"Pelourinho Salvador Brazil"` retornou **Paraty** em 1º lugar
e **Santa Catarina** em 6º. Foi exatamente esse tipo de falso positivo que gerou o
problema atual. Ver §4.

---

## 1. A edge function — localização e forma de chamada

| Item | Valor |
|---|---|
| Arquivo | `supabase/functions/unsplash/index.ts` |
| Endpoint | `GET {VITE_SUPABASE_URL}/functions/v1/unsplash` |
| Parâmetros | `query` (obrigatório), `per_page` (default `5`), `orientation` (default `landscape`) |
| Auth | header `Authorization: Bearer {VITE_SUPABASE_PUBLISHABLE_KEY}` |
| Secret usada | `UNSPLASH_ACCESS_KEY` (`index.ts:61`) — vive só no Supabase, nunca no cliente |
| Upstream | `https://api.unsplash.com/search/photos` com `Client-ID` (`index.ts:103-113`) |
| Cache | in-memory, TTL 24h, chave `query-perPage-orientation` (`index.ts:89`) |

O padrão de chamada foi copiado de `src/hooks/useUnsplash.ts:96-104`, que é o caminho
real usado em produção.

**Não foi preciso usar o fallback.** A function respondeu **HTTP 200** nas duas queries
direto do Codespace, então as candidatas vieram do mesmo caminho que o app usa — a
`UNSPLASH_ACCESS_KEY` permaneceu onde estava, sem nunca ser lida por mim.

```bash
curl -H "Authorization: Bearer $VITE_SUPABASE_PUBLISHABLE_KEY" \
  "$VITE_SUPABASE_URL/functions/v1/unsplash?query=Pelourinho%20Salvador%20Brazil&per_page=8&orientation=landscape"
```

Usei `per_page=8` (em vez do default 5) por query justamente porque o ruído geográfico
descrito em §4 descarta boa parte dos resultados.

---

## 2. Como cada candidata foi validada

Três filtros, em ordem. Uma candidata só entra na lista se passar nos três:

1. **Evidência textual de Salvador** — `description`/`alt_description` do próprio Unsplash
   citando Salvador, Bahia ou um bairro identificável. Fotos sem descrição foram
   descartadas mesmo quando plausíveis: não dá para afirmar o local.
2. **HTTP** — `HEAD` em `images.unsplash.com/<slug>?w=800`, exigindo `200` + `image/jpeg`.
3. **Inspeção visual** — baixei cada imagem e olhei. Este passo é o que teria evitado o
   erro atual: a foto dos Alpes passa nos filtros 1 e 2 sem problema nenhum.

---

## 3. As 5 candidatas

Ordenadas por adequação ao roteiro. Todas verificadas em 2026-08-10.

### 1. Capoeira no Pelourinho — **recomendada**

| | |
|---|---|
| **URL** | `https://images.unsplash.com/photo-1583166614297-a97b68d5cead?w=800` |
| **Descrição (Unsplash)** | "Capoeira in the streets of Pelourinho, Salvador, Brazil" |
| **Alt text** | "a group of people that are standing in the street" |
| **Autor** | Nigel SB Photography |
| **HTTP** | ✅ 200 · `image/jpeg` |
| **Página** | https://unsplash.com/photos/a-group-of-people-that-are-standing-in-the-street-me2X2pfRhXU |

**Visual confirmado:** roda de capoeira em praça calçada de pedra portuguesa, casarões
coloniais e igreja barroca ao fundo. É o Pelourinho inequivocamente.

*Por que primeiro:* é a única com localização explícita **e** um assunto que carrega o
"Cultura" do título. As outras quatro são paisagem; esta tem gente e ação.

---

### 2. Porto da Barra — orla e cidade

| | |
|---|---|
| **URL** | `https://images.unsplash.com/photo-1569556420157-6030491766d1?w=800` |
| **Descrição (Unsplash)** | "Orla marítima do Porto da Barra, no bairro de mesmo nome em Salvador - BA. Brasil." |
| **Alt text** | "people on shore beside building during daytime" |
| **Autor** | Marcus Alves |
| **HTTP** | ✅ 200 · `image/jpeg` |
| **Página** | https://unsplash.com/photos/people-on-shore-beside-building-during-daytime--yrin-Mm_N4 |

**Visual confirmado:** vista aérea da orla, praia com guarda-sóis, mar azul-turquesa e
prédios da cidade. Céu limpo.

*Por que segundo:* cobre "Sol" e "Mar" ao mesmo tempo e ainda mostra a cidade. É a mais
"cartão-postal" do conjunto — melhor escolha se a preferência for paisagem em vez de gente.

---

### 3. Pôr do sol na praia

| | |
|---|---|
| **URL** | `https://images.unsplash.com/photo-1689555204752-ca13d86fb3ab?w=800` |
| **Descrição (Unsplash)** | "Salvador, Bahia, Brasil" |
| **Alt text** | "two people standing on a beach at sunset" |
| **Autor** | Adriano Rosa |
| **HTTP** | ✅ 200 · `image/jpeg` |
| **Página** | https://unsplash.com/photos/two-people-standing-on-a-beach-at-sunset-l5RPKmF63Wc |

**Visual confirmado:** silhuetas contra o sol se pondo, barcos ancorados, tons alaranjados.
Bonita e emotiva.

*Ressalva:* nada na imagem identifica Salvador — poderia ser qualquer litoral. A
localização vem só da descrição do autor.

---

### 4. Coqueiro na Baía de Todos os Santos

| | |
|---|---|
| **URL** | `https://images.unsplash.com/photo-1546536635-e3c6b5941a63?w=800` |
| **Descrição (Unsplash)** | "Coconut tree on the shore of the bay sea, called Bay of All Saints that bathes the city of Salvador, Bahia, Brazil" |
| **Alt text** | "coconut tree at the beach" |
| **Autor** | Marcus Alves |
| **HTTP** | ✅ 200 · `image/jpeg` |
| **Página** | https://unsplash.com/photos/coconut-tree-at-the-beach-CUAPwIH3E4M |

**Visual confirmado:** coqueiro em primeiro plano dominando o quadro, areia clara, mar
calmo com barquinhos ao longe, céu azul.

*Ressalva:* o tronco corta o centro da imagem — arriscado num hero recortado em
`object-cover`. E, como a #3, é visualmente genérica.

---

### 5. Vista aérea da cidade

| | |
|---|---|
| **URL** | `https://images.unsplash.com/photo-1562070086-bd76d3409dd6?w=800` |
| **Descrição (Unsplash)** | "Salvador da Bahia, Brasil" |
| **Alt text** | "gray high-rise buildings" |
| **Autor** | Mr. Söbau |
| **HTTP** | ✅ 200 · `image/jpeg` |
| **Página** | https://unsplash.com/photos/gray-high-rise-buildings-VNZ_79sXMrw |

**Visual confirmado:** foto de janela de avião, malha urbana densa até o mar, com uma
faixa larga de nuvem carregada cobrindo o topo do quadro.

*Ressalva:* é a mais fraca das cinco. Céu nublado e cinza brigam com "Sol, Mar e Cultura",
e a cidade vista de longe não diz nada de Bahia. Listada por completude.

---

## 4. O que foi descartado, e por quê

Das 16 fotos retornadas, 11 caíram. Vale registrar porque explica o risco do processo:

| Foto | Motivo |
|---|---|
| `photo-1623194417728…` | **É Paraty (RJ)** — descrição cita "Paraty's Historic Center". Veio em **1º lugar** na query de Pelourinho. |
| `photo-1590869600354…` | **É Santa Catarina** — "Old city in Santa Catarina, Brazil". |
| `photo-1629228420074…` | Morro de São Paulo — Bahia, mas a ~2h de barco de Salvador. Não é a cidade. |
| 8 outras | Sem `description`. Alt genérico ("aerial view of buildings", "a group of people sitting on top of a statue"). Plausíveis, mas não verificáveis. |

**A lição:** a busca do Unsplash faz correspondência semântica, não geográfica. Pedir
"Salvador" e receber Paraty em primeiro lugar é o comportamento normal dela. Qualquer
automação futura que escolha capa por query — sem alguém olhando a imagem — vai repetir
esse erro. Aceitar o topo do ranking sem inspeção é precisamente o que produziu a capa
alpina.

---

## 5. Correção do meu relatório anterior

O `RELATORIO-DIAGNOSTICO-COVER-SALVADOR.md` §7 recomendou:

```
https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800
```

Esse valor está no banco agora (confirmado por leitura), e **a foto é dos Alpes** — uma
cama num deck de madeira com vista para vale e montanhas nevadas. Verifiquei baixando e
olhando a imagem.

O erro: no relatório anterior eu validei aquela URL por **HTTP 200** e pela **posição dela
no repositório** (`src/data/destinationPdfData.ts:838`, num bloco rotulado Salvador), e
descrevi o conteúdo como "Pelourinho / cultura afro-brasileira" — uma inferência do rótulo
do arquivo, não uma observação da foto. Nunca olhei a imagem. O rótulo no
`destinationPdfData.ts` está errado, e eu propaguei o erro dele.

Consequência prática: **o `destinationPdfData.ts` não é fonte confiável de conteúdo de
foto.** Ele já tinha uma URL morta conhecida (§4 do relatório anterior) e agora tem também
uma URL viva com conteúdo trocado. Continua fora do escopo desta missão, mas a varredura
recomendada lá deveria checar conteúdo, não só status HTTP.

---

## 6. SQL de UPDATE — pronto, aguardando a escolha

Nada foi executado. Substitua `<URL_ESCOLHIDA>` por uma das cinco URLs da §3:

```sql
UPDATE public.community_itineraries
SET cover_image_url = '<URL_ESCOLHIDA>'
WHERE id = 'a2762135-4323-4cb9-b8e7-946012516895';
```

Já com a recomendada (§3, candidata 1) preenchida:

```sql
UPDATE public.community_itineraries
SET cover_image_url = 'https://images.unsplash.com/photo-1583166614297-a97b68d5cead?w=800'
WHERE id = 'a2762135-4323-4cb9-b8e7-946012516895';
```

Confirmação depois de rodar:

```sql
SELECT title, cover_image_url
FROM public.community_itineraries
WHERE id = 'a2762135-4323-4cb9-b8e7-946012516895';
```

---

## 7. Pendência ainda em aberto

A **Correção Secundária** do relatório anterior — `onError` nos `<img>` do
`ItineraryDetailModal` e do `ItineraryCard` — **continua não aplicada**. O `UPDATE` acima
resolve este roteiro; não impede que a próxima URL morra. Fica registrado como item
separado, para quando houver missão de patch.

Vale notar que `onError` **não** teria pego o problema atual: a foto dos Alpes carrega com
sucesso. Erro de conteúdo só se detecta olhando.

---

## 8. Método e conformidade

**Leituras:** REST API do Supabase (`SELECT` via GET, chave anon do `.env`), edge function
`unsplash` em produção, `HEAD`/`GET` em `images.unsplash.com`.

**Escritas:** nenhuma. Nenhum `INSERT`/`UPDATE`/`DELETE`. Nenhum arquivo do projeto criado
ou modificado além deste relatório. `src/data/`, `src/lib/hotelZones.ts`,
`src/lib/michelinData.ts` e `src/types/trip.ts` não foram tocados.

As imagens baixadas para inspeção foram para o diretório temporário da sessão, fora do
repositório.

Arquivos lidos, nenhum modificado:

```
supabase/functions/unsplash/index.ts          src/hooks/useUnsplash.ts
src/components/community/ItineraryDetailModal.tsx
src/components/community/ItineraryCard.tsx
```
