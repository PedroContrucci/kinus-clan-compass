# RELATÓRIO — Transparência do hotel: o porquê e a porta de saída

**Data:** 2026-09-09
**Commit:** `4bf404f` — `feat(hotel): o hotel do roteiro mostra por que foi escolhido e como trocar`
**Base:** `30cf23c` · **STEP 1 aprovado:** §4 = **B + C**, §3.4 = tabela `events` do kinu-beta,
§3.1 Q2 = `reasons` dentro de `RankedHotel`, Q3 = painel do `/smoke` não.
**Regra de produto que este arco estreia:** toda escolha que o KINU faz pelo usuário mostra
**por que** escolheu e **como trocar**.

---

## 1. Placar

| Verificação | Ao pegar | Agora |
|---|---|---|
| Vitest | 225/225 | **271/271** (+46) |
| `tsc -p tsconfig.app.json --noEmit` | limpo | **limpo** |
| ESLint — conjunto do STEP 1 (`Viagens`, `DraftCockpit`, `HotelSwapModal`, `hotelSwap`) | 53 problemas (51 erros, 2 warnings) | **53** — nenhum novo |
| ESLint — arquivos novos (`kinuEvents`, `HotelPlanBlock`, `HotelDetailDrawer`, 3 testes) | — | **0** |
| ESLint — `onboarding.ts` | 3 erros | **2** (saiu um `any`) |
| ESLint — `createTrip.ts` | 3 erros | **3** (intocados; medidos na versão pré-mudança via `--stdin`) |
| `npm run build` | verde | **verde** (`✓ built in 22.63s`; aviso de chunk > 500 kB pré-existente) |

Diff: **13 arquivos, +1.329 / −69**. Testes novos: `hotelReasons` (17), `kinuEvents` (14),
`hotelPlanBlock` (14), mais 1 em `hotelSwapPersistence`.

---

## 2. O que o usuário passa a ver

**No topo do roteiro** — rascunho (`DraftCockpit`) e viagem ativa (`Viagens`, aba Roteiro),
o mesmo componente nos dois:

```
🏨  ONDE VOCÊ FICA
Casa Lola Luxury Collection
Getsemaní · R$ 600-1.000/noite · 7 noites

Escolhido porque:
 [tier Conforto ✓] [perfil casal ✓] [nota 4.5]

[ Ver curadoria e trocar ]
```

Toque no cartão abre a **ficha**: tier, personas, nota, faixa com o valor que entra no
orçamento, link do mapa da zona e **todas as dicas** — a segunda dica do Sofitel Legend
("Família E casal cabem") e a do Hotel Caribe ("praia em frente") estavam escritas na
curadoria desde sempre e nunca chegaram a uma tela.

Quando o hotel **não** é curado (≈92% das viagens antigas, medido no arco anterior), o bloco
não simula um porquê:

```
⚠ sugestão automática — ainda sem curadoria KINU neste tier
[ Ver curadoria e trocar ]  [ Buscar ofertas ]
```

A frase distingue os dois casos, porque são problemas diferentes do ponto de vista de quem
lê: cidade **com** curadoria e tier fora dela → "neste tier"; cidade **sem** curadoria
nenhuma (5 das 21) → "em Singapura", e aí o caminho externo é o botão que resolve.

Sem hospedagem cadastrada o bloco não renderiza. A pílula do stepper e o card do hero
financeiro **ficam onde estavam** — ninguém perde caminho conhecido.

---

## 3. Os motivos, colados no score (`reasons[]`)

`rankHotelsForTrip` passa a devolver `reasons: HotelReason[]`. A regra que me impus: nenhum
motivo tem condição própria — cada um nasce na mesma linha que soma a parcela.

| kind | Parcela | Label |
|---|---|---|
| `tier` | +100 | `tier Conforto ✓` |
| `tier-resort` | +40 | `resort — atende acima do econômico` |
| `persona` | +50 | `perfil casal ✓` |
| `zone` | +10 | `zona ideal Recoleta ✓` |
| `rating` | +rating | `nota 4.7` |

O invariante que amarra isso é o teste que **reconstrói o score a partir dos motivos** e
exige igualdade, nos 68 hotéis × 4 tiers (272 combinações conferidas):

```ts
expect(somaDosMotivos).toBe(score);
```

Motivo escrito sem parcela é o produto inventando afinidade; parcela somada sem motivo é o
produto escondendo o critério. As duas pontas quebram a suíte agora.

Os 27 testes de `hotelSwap.test.ts` continuam verdes **sem uma linha de edição** — é a prova
de que a ordenação não mudou: entrou explicação, não ranking novo.

`TIER_LABEL` e `PERSONA_LABEL` saíram do `HotelSwapModal` para o `hotelSwap.ts` e agora são
lidos por bloco, modal e ficha. Dois dicionários iguais em arquivos diferentes é como
"Conforto" viraria "mid" em uma das três telas.

Os motivos também entram em cada linha do modal de troca — é ali que o usuário compara, e
comparar sem o critério na frente é escolher no escuro.

---

## 4. A autoria (`chosenBy`) — B + C, como você decidiu

`accommodation.chosenBy: 'kinu' | 'user'`, por fora do tipo como o `curatedHotelId` e o
`mealPlan` já iam. `buildDraftTrip` grava `'kinu'` (**nos dois caminhos** — curado e
`HOTEL_RECOMMENDATIONS`: quem escolheu foi o app em ambos), `applyHotelSwap` grava `'user'`.

| Estado | Rótulo | `inferred` |
|---|---|---|
| `chosenBy: 'kinu'` | `Escolhido porque:` | `false` |
| `chosenBy: 'user'` | `Sua escolha · combina porque:` | `false` |
| ausente (viagem antiga) | heurística B: é o pick de `pickCuratedHotelForTrip`? → KINU; senão → usuário | `true` |

Os três estados têm teste, e um deles é o que justifica o campo existir: um hotel que o
**usuário** escolheu e que por coincidência é o mesmo que o gerador escolheria. A heurística
sozinha diria "Escolhido porque"; o registro diz "Sua escolha". Sem `chosenBy`, o produto que
estreia a regra da transparência começaria roubando o crédito do usuário na primeira frase.

Persistência coberta: o campo sobrevive ao `updateTrip` + reload **e** ao `normalizeTrip`, que
é o caminho do espelho do kinu-beta (`hotelSwapPersistence.test.ts`).

**Nenhuma migração.** Viagens existentes seguem sem o campo e caem na heurística; a próxima
troca de hotel grava `'user'` naturalmente.

---

## 5. Os eventos — e a porta fechada que eu encontrei no caminho

Isto é a parte do relatório que muda o seu plano, então vem antes do resto.

### 5.1 O schema real

Não adivinhei o formato: li o OpenAPI do PostgREST do kinu-beta.

```
events(id bigserial pk, user_id uuid NULL, name text NOT NULL,
       props jsonb NOT NULL, created_at timestamptz default now())
```

### 5.2 Descoberta 1 — `trackOnboarding` nunca gravou uma linha

O helper do onboarding do Lovable tentava três formatos, em ordem, e desistia em silêncio:

```
{ user_id, type, payload }  ·  { user_id, event_type, data }  ·  { user_id, name, properties }
```

A coluna é **`props`**, não `payload`, nem `data`, nem `properties`. Nenhum dos três casava:
todo `onboarding.welcome_shown`, `path_chosen`, `hint_shown` e `guide_reset` desde que aquilo
foi escrito falhou em silêncio. O `desistir em silêncio` fez o defeito ficar invisível.

### 5.3 Descoberta 2 — a tabela não tem GRANT para ninguém

Medido com `curl` contra o projeto, agora:

```
$ curl "$URL/rest/v1/events?select=id&limit=1"   (anon)
{"code":"42501","hint":"Grant the required privileges to the current role with:
  GRANT SELECT ON public.events TO anon;","message":"permission denied for table events"}

$ curl -X POST "$URL/rest/v1/events" -d '{}'     (anon)
{"code":"42501","hint":"Grant the required privileges to the current role with:
  GRANT INSERT ON public.events TO anon;","message":"permission denied for table events"}

$ curl "$URL/rest/v1/events?select=id" (service_role)
{"code":"42501","hint":"... GRANT SELECT ON public.events TO service_role;", ...}
```

*(A sonda de INSERT foi um `POST {}`: a checagem de permissão acontece antes da de
`NOT NULL`, então ela responde a pergunta sem gravar linha nenhuma na sua tabela.)*

A tabela existe e está exposta no schema, mas **nenhum papel tem privilégio**. Ou seja: hoje
os eventos deste arco também não chegariam ao motor de conquistas, por mais correto que
esteja o código do app. Não apliquei DDL em produção — é sua decisão e não dá para fazer pelo
REST. **O SQL para rodar no editor do kinu-beta:**

```sql
-- privilégio (é o que está faltando)
grant insert on public.events to authenticated;
grant select on public.events to authenticated;              -- o motor vai querer ler
grant usage, select on sequence public.events_id_seq to authenticated;  -- id é bigserial

-- e a política, para o privilégio não virar porta escancarada
alter table public.events enable row level security;

create policy events_insert_own on public.events
  for insert to authenticated
  with check (user_id = auth.uid());

create policy events_select_own on public.events
  for select to authenticated
  using (user_id = auth.uid());
```

Rodou? Nada precisa ser deployado do lado do app: **o primeiro evento emitido depois do
grant leva a fila acumulada junto**. É exatamente para isso que o anel existe.

### 5.4 O emissor (`src/lib/kinuEvents.ts`)

Um só lugar que conhece o schema, um só que decide o que fazer quando a gravação falha.
`trackOnboarding` delega para cá — os 7 pontos de chamada (Dashboard, Conta, HintBalloon)
não mudaram uma linha.

| Evento | Quando | Props |
|---|---|---|
| `hotel.reasons_viewed` | bloco monta com motivos visíveis | `hotel, city, curated, reasons, author` |
| `hotel.detail_opened` | ficha abre | `hotel, city, from: 'block' \| 'swap'` |
| `hotel.swapped` | troca aplicada (modal ou ficha) | `from, to, city, surface` |

Decisões que valeram linha extra:

- **Dedupe no emissor, não em cada tela.** React remonta e o roteiro re-renderiza a cada
  troca de dia: sem guarda, um `reasons_viewed` viraria 50 cópias e o anel de 50 morreria no
  nascimento. Só o evento *idêntico ao último* é descartado — dois iguais separados por
  qualquer outro são dois eventos de verdade.
- **`from` lido antes da troca.** Depois do `applyHotelSwap`, o "hotel atual" já é o novo;
  `hotel.swapped {from,to}` gravaria o mesmo nome nos dois campos.
- **`break`, não `continue`, na drenagem.** A fila é cronológica; pular o que falhou
  entregaria o evento novo antes do velho.
- **Duas superfícies, nunca dois eventos.** A ficha aberta de dentro do modal fecha o modal
  antes de escolher, então `hotel.swapped` sai de um caminho só por clique.
- **Nada de preço, id de usuário além do `user_id`, ou conteúdo de viagem** nas props: nome
  de hotel e cidade.

### 5.5 Dois defeitos que os testes acharam antes de você

1. **Storage bloqueado = telemetria zero.** A primeira versão gravava no anel e drenava o
   anel. Em navegador privado (ou cota estourada) o anel não grava, a fila fica vazia e
   *nada* era enviado. Agora, quando o `setItem` recusa, o evento vai **direto** para o
   kinu-beta, sem passar pela fila.
2. **Ordem de entrega.** A versão inicial `continue`-ava no erro, o que entregaria eventos
   fora de ordem quando um falhasse. Virou `break`, com teste que prova que a cabeça da fila
   é retentada e a cauda nunca a ultrapassa.

---

## 6. Um drawer aberto por vez

`vaul` aninhado exige `NestedRoot`, que não é o que o modal usa. O bloco é uma máquina de
três posições (`none` / `swap` / `detail`) mais o `detailFrom`: a ficha aberta pela lista
**devolve o usuário para a lista** ao fechar. Fechar a ficha não custa o contexto.

`HotelSwapModal` ganhou `onOpenDetail` **opcional**: sem ele — `TripPanel` e `DraftCockpit`,
que abrem o modal por conta própria — a linha segue selecionando no toque, como sempre fez.
Com ele, o cartão tem dois destinos (ficha no corpo, "Escolher este" no rodapé), porque botão
dentro de botão não existe em HTML.

O conteúdo da ficha é um componente separado da casca (`HotelDetailContent`): nenhum teste da
suíte monta um `Drawer`, e testar pela casca custaria mockar pointer/resize do jsdom e
perseguir portal. A lógica ficou testável; a casca, que não tem lógica, ficou de fora.

---

## 7. O que eu não toquei (como combinado)

- `src/data/**` — curadoria intocada.
- `src/types/**` — nenhum campo novo em `SavedTrip`/`TripActivity`. O `chosenBy` vive em
  `AccommodationLike` (`hotelSwap.ts`), por fora do tipo, como o `curatedHotelId`.
- **Gerador de roteiro** — `GeneratedItineraryStage`, `economicGenerator`: zero linhas. O
  bloco entra *acima* do estágio, no `DraftCockpit`. Em `createTrip.ts` mexi **só** no objeto
  `accommodation` (+12/−4) para gravar a autoria, que era item aprovado do escopo.
- Edge functions / `supabase/**` — nada. **Nada foi deployado.**
- DDL em produção — o SQL do §5.3 está escrito, não executado.
- `/smoke` — painel de eventos não feito (Q3).

---

## 8. Pendências

- **O GRANT do §5.3 é bloqueante para a medição.** Sem ele, `reasons_viewed`,
  `detail_opened` e `swapped` ficam no anel local do navegador de cada usuário e o motor de
  conquistas não vê nada. O código do app está pronto para os dois mundos.
- **O motivo de zona não existe em 6 das 16 cidades curadas.** Cartagena, Gramado e Orlando
  não têm entrada em `HOTEL_ZONES`; Nova York, Porto Seguro e Salvador têm, mas os nomes das
  zonas não casam com os da curadoria de hotéis. Nessas cidades o bônus de +10 nunca é
  somado e o bloco mostra um motivo menos — honesto, mas é curadoria faltando, não conserto
  de código. Está travado num teste que documenta a lista.
- **`src/components/HotelCard.tsx` é código morto** (zero referências). Não mexi: apagar
  arquivo não era escopo. Fica anotado.
- **Validação em navegador é sua.** Rodei suíte, tipos, lint e build; o que não fiz foi ver o
  bloco no celular. O cartão tem ~140 px e os motivos embrulham em chips, mas altura no
  aparelho de verdade só você confirma.
- **Publish é seu.**

---

## 9. Push

```
$ git push origin main
To https://github.com/PedroContrucci/kinus-clan-compass
   30cf23c..4bf404f  main -> main
```
