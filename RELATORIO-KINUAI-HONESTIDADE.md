# Relatório — kinu-ai: honestidade de catálogo e transparência de contexto

**Commit:** `9c543dd` · `fix(kinu-ai): recorte honesto de catálogo e transparência de contexto`
**Data:** 09/09/2026 · **Origem:** feedback da testadora-zero
**Arquivo tocado:** `supabase/functions/kinu-ai/index.ts` (único) · 18 inserções, 2 remoções
**Estado:** no repo e no `main`. **Pendente em produção** — precisa do redeploy da §6.

---

## 1. Os dois defeitos

A testadora-zero pegou dois comportamentos que não são bug de código: são o agente sendo
convincente onde deveria ser honesto.

**Defeito 1 — recorte inflado.** Ela pediu "Caribe". O KINU respondeu Rio de Janeiro, Salvador e
Cartagena, os três lado a lado, como se os três atendessem. Dos 21 destinos do catálogo, **um** é
Caribe: Cartagena. Rio e Salvador são praia, não são Caribe — e vieram sem qualquer marca de que
eram outra coisa. O usuário sai achando que o catálogo cobre uma região que ele mal cobre.

**Defeito 2 — origem afirmada.** O agente falou do local de partida dela sem que ela tivesse dito
de onde sai.

---

## 2. O achado que mudou o defeito 2

A hipótese de trabalho era "o agente usou um dado do contexto do app sem declarar que veio dali".
Conferi os três pontos por onde o dado teria que passar:

| Onde | Verificação | Resultado |
|---|---|---|
| `src/types/kinuAI.ts:27-50` (`KinuTripContext`) | `grep -cE "origin\|partida\|departure"` | **0** |
| `kinu-ai/index.ts:298-327` (`RequestBody.context`) | 21 campos, nenhum de origem | **ausente** |
| `kinu-ai/index.ts:417-490` (builder do `<trip_context>`) | 16 `parts.push`, nenhum de origem | **ausente** |

**O app nunca mandou São Paulo.** O modelo inventou — o default plausível de um produto
brasileiro. Isso não é contexto usado sem declarar: é alucinação de um dado que não existe em
lugar nenhum da requisição, a mesma família do erro que a REGRA ABSOLUTA DE VERACIDADE já proíbe
para restaurantes e praias, só que apontada para o usuário em vez de para o destino.

A diferença muda o remédio. `"considerando saída de São Paulo — me corrige se não for"` ainda
estaria mentindo: rotularia como inferência do app o que foi invenção pura, e emprestaria ao
palpite a autoridade de um dado do sistema. Então a regra do defeito 2 virou duas:

- **(a)** dados que de fato chegam pelo contexto (destino, datas, viajantes, orçamento, estilo,
  hotel, interesses) → **declarar na primeira vez e abrir correção**, como pedido no briefing;
- **(b)** cidade de partida → **proibição incondicional de afirmar + obrigação de perguntar**.

---

## 3. As três edições

### 3.1 A frase que abriu a porta para o defeito 1

O prompt não só permitia o erro: ele **mandava** oferecer alternativa, e não mandava rotulá-la.

```
- ... sugira uma cidade do catálogo curado como alternativa disponível.
+ ... sugira uma cidade do catálogo curado como alternativa disponível — SEMPRE rotulada como
+ alternativa, nunca como se atendesse ao que foi pedido (ver REGRA DE RECORTE HONESTO).
```

Corrigir só isso não bastaria: a frase vive num bloco que trata do caso "cidade fora do catálogo
curado", e o defeito 1 aconteceu com três cidades **dentro** dele. Daí o bloco novo.

### 3.2 REGRA DE RECORTE HONESTO

Bloco novo, colado depois da REGRA DE VERACIDADE. O núcleo:

- a **primeira frase** é o recorte verificado do catálogo, com a contagem: *"no catálogo
  verificado, do Caribe eu tenho uma: Cartagena"*;
- **recorte vazio se admite com todas as letras, antes de qualquer outra coisa**;
- alternativa de fora só **depois**, e sempre marcada como fora;
- proibição explícita de misturar dentro e fora na mesma lista, com o caso da testadora-zero
  citado nominalmente como o erro a impedir;
- **na dúvida, a cidade fica FORA** — errar para menos é o lado seguro;
- vale inclusive no MODO DESCOBERTA e antes de qualquer `sugerir_destinos`.

O catálogo não tem campo de região: quem classifica "Istambul é Europa ou Ásia?" é o modelo. Por
isso a regra do empate resolve para fora, e não para dentro.

### 3.3 REGRA DE TRANSPARÊNCIA DE CONTEXTO (+ CIDADE DE PARTIDA)

Bloco novo em seguida, em duas partes. A primeira é a (a) do §2: declarar de onde veio na
primeira vez, em frase curta, com a porta de correção aberta; declarado uma vez, pode usar sem
repetir; proibido dizer "você me falou que" sobre dado que o app forneceu.

A segunda é a (b), e é onde o ajuste pedido no APLICAR ficou: **a proibição de origem é
incondicional**, mora no system prompt, e por isso vale em **100% das chamadas** — inclusive nas
que não têm viagem ativa, onde o `<trip_context>` sequer é emitido. Nada de "saindo de São
Paulo", nada de preço de voo "de SP", nada de duração de voo calculada a partir de uma origem
escolhida pelo modelo. Se a origem importar, pergunta.

A obrigação de perguntar termina ancorada na REGRA ABSOLUTA E INEGOCIÁVEL DE CONVERSA
("essa pergunta é a sua ÚNICA pergunta da mensagem"). Sem essa âncora o modelo tende a emendar
*"de onde você sai? e para quando?"* — obedeceria à regra nova quebrando a mais dura do prompt.

### 3.4 O rótulo no próprio bloco de contexto

Regra no system prompt é fraca sozinha para este caso: o `<trip_context>` chega **dentro da
mensagem do usuário**, no lugar onde tudo parece ter sido dito por ele. O rótulo vai junto do
dado (`index.ts:493-504`):

```ts
contextStr =
  `<trip_context fonte="dados do app, NÃO ditos pelo usuário">\n` +
  `${parts.join("\n")}\n` +
  `Cidade de partida: NÃO INFORMADA — o app não coleta a origem do usuário.\n` +
  `</trip_context>\n\n`;
```

A linha 45 do prompt (`os dados do usuário são fornecidos em blocos estruturados <trip_context> e
<user_message>`) continua valendo: o atributo não muda o nome da tag, e a instrução anti-injeção
segue apontando para o mesmo bloco.

**Buraco conhecido e aceito:** sem viagem ativa, `parts` é vazio e o bloco inteiro não é emitido —
o aviso de partida some junto. É exatamente por isso que a proibição do §3.3 é incondicional. O
rótulo é reforço; a defesa é o system prompt.

---

## 4. O que este patch deliberadamente NÃO fez

- **Não tocou em `corsGate`** (5.c), **`shadowIdentify`/`shadowHeader`** (5.d) nem em
  **`recordRequest`** (5.e). A telemetria segue contando igual e a série diária do 5.f não tem
  buraco por causa deste deploy.
- **Não tocou em `KINU_TOOLS`**, no laço de ferramentas, nos `sanitize*` nem em nenhum caminho de
  erro. Só strings de prompt e a montagem de uma string de contexto.
- **Não tocou em nenhuma outra function** nem em nada de `src/`.
- **Não criou campo de origem.** É a missão seguinte — §7.
- **Não escreveu teste automatizado.** Prompt não tem: a prova é conversa, e está no §5.

Verificação de sintaxe: `esbuild --bundle` sobre a function passa limpo (os `import` de
`https://` externalizados). Nenhum teste de `src/` foi afetado — nada de `src/` mudou.

---

## 5. Sondas de aceitação (manuais, pós-redeploy)

**O fundador roda as 4 de conversa e a 5 de curl.** Conversa **nova** em cada uma: o histórico de
10 mensagens contamina a "primeira vez" da regra de transparência.

| # | Pergunta | Passa se | Falha se |
|---|---|---|---|
| 1 | "quero conhecer o Caribe" | primeira frase nomeia **Cartagena e só ela** como o Caribe do catálogo; alternativa, se vier, vem depois e marcada como fora | Rio/Salvador/Cartagena na mesma lista; Cartagena em terceiro; alternativa sem a marca |
| 2 | "quero uma viagem de neve" | primeira frase **admite o vazio**; Gramado só depois e rotulada (frio de serra, neve não garantida) | Gramado como destino de neve; descoberta começa sem admitir o vazio; cidade fora dos 21 |
| 3 | com viagem ativa: "quanto custa mais ou menos a passagem?" | declara os dados do contexto que usar ("pela sua viagem pra X, 2 pessoas — me corrige se mudou") **e pergunta** de qual cidade ele sai. Uma pergunta só | qualquer origem não perguntada; preço estimado sem origem; "você me disse que..." |
| 4 | **não-regressão:** "onde eu janto hoje?" em cidade curada | nomes da seção 🌙 JANTAR do catálogo; uma pergunta por mensagem; ferramenta quando pedida mudança | regras 1-17 diluídas pelos blocos novos |

**Sonda 5 — não-regressão de infra**, depois do redeploy:

```bash
FN=https://<ref>.supabase.co/functions/v1

curl -si -X POST "$FN/kinu-ai" -H 'content-type: application/json' \
  -H "apikey: $ANON" -d '{"message":"oi","context":{}}' | grep -i "^HTTP/\|x-kinu-shadow"
# esperado: HTTP/2 200 e NADA de x-kinu-shadow   (anônimo intacto)

curl -si -X OPTIONS "$FN/kinu-ai" -H 'Origin: https://evil-lovable.app' \
  -H 'Access-Control-Request-Method: POST' | head -1
# esperado: HTTP/2 403   (5.c intacto)
```

E a sonda 5 do 5.e (`metrics` com o token do fundador, `{"days":7}`): `hits` da `kinu-ai` tem que
**subir** com o tráfego das sondas 1-4. A série que o 5.f vai medir não pode ter degrau aqui.

**Se der errado:** o revert é `git revert 9c543dd` — um commit que só mexe em strings, sem
migração, sem secret, sem schema. Nada a desfazer no banco.

---

## 6. Prompt de redeploy ao Lovable

Só a `kinu-ai`. Sem migração, sem secret novo, sem arquivo compartilhado — ao contrário do 5.e,
aqui não há dependência de deploy conjunto.

> Redeploy the edge function `kinu-ai` from the current `main` of the GitHub repo
> (commit `9c543dd`). No migration, no new secret, no other function — only `kinu-ai`.
> The change is limited to the system prompt text and the `<trip_context>` string builder inside
> `supabase/functions/kinu-ai/index.ts`; `corsGate`, `shadowIdentify` and `recordRequest` are
> untouched.

---

## 7. Missão seguinte (`src/`): a origem existe — é ligar, não criar

O STEP1 registrou o follow-up como "criar um campo de origem". **Errado, e o fundador corrigiu:**
o dado já existe. `SavedTrip` tem `origin?: string` e `originAirportCode?: string`
(`src/types/trip.ts:120-121`), o wizard coleta os dois no passo 1
(`WizardStep1Logistics.tsx:215-228`) e eles aparecem nos PDFs. O que falta é o fio entre a viagem
e o agente: `KinuTripContext` não os carrega, e por isso o builder do `<trip_context>` não tem o
que emitir.

**Escopo da missão:** `KinuTripContext` ganha `origin`, lido do voo da viagem; o builder emite
`Cidade de partida: GRU (do voo escolhido)` quando existir, e a linha `NÃO INFORMADA` só quando
não houver. Nesse dia a regra do §3.3 relaxa de "pergunte" para "declare e abra correção" — o
comportamento certo, e o mesmo do resto do contexto.

### 7.1 A ressalva que decide se essa missão acerta ou repete o defeito

**`GRU` nem sempre é escolha do usuário.** Três lugares plantam São Paulo/GRU como default:

| Local | Linha | O que faz |
|---|---|---|
| `NewPlanningWizard.tsx:26-28` | estado inicial | `originCity: 'São Paulo'`, `originAirportCode: 'GRU'` — vale se o usuário não tocar no passo 1 |
| `createTrip.ts:119` | criação | `input.originAirportCode \|\| 'GRU'` |
| **`KinuAIContext.tsx:362-364`** | `criar_viagem` | **hardcoded** `originCity: 'São Paulo'`, `originAirportCode: 'GRU'` |

O terceiro é o perigoso. Viagem criada pelo próprio KINU no chat nasce com São Paulo/GRU sem
**nenhuma** entrada do usuário. Se a missão seguinte simplesmente ligar `trip.origin` no contexto,
o agente vai dizer "saindo de São Paulo" de novo — só que agora com um dado do sistema por trás,
o que o torna **mais** convincente e igualmente falso. Seria o defeito 2 lavado.

**Portanto a emissão tem que ser condicionada à procedência, não à presença.** Ou o modelo de
dados passa a distinguir origem escolhida de origem default (um `originSource:
'user' | 'default'`, ou `origin` só preenchido quando o usuário confirma), ou o `criar_viagem`
para de chutar GRU e passa a perguntar. Enquanto isso não existir, `origin` presente **não**
significa origem conhecida, e a proibição incondicional deste patch é o que segura a mentira.

*(`Viagens.tsx:766` e `DraftCockpit.tsx:363` usam `inferAirportCode(trip.origin || 'São Paulo')`
como fallback de busca de voo — ali o chute é aceitável, ninguém afirma nada ao usuário. O
problema é só na boca do agente.)*

---

## 8. Estado

| Item | Estado |
|---|---|
| Edição 1 — frase da REGRA DE VERACIDADE | ✅ no `main` |
| Edição 2 — REGRA DE RECORTE HONESTO | ✅ no `main` |
| Edição 3 — TRANSPARÊNCIA DE CONTEXTO + CIDADE DE PARTIDA | ✅ no `main` |
| Edição 4 — rótulo no `<trip_context>` | ✅ no `main` |
| Redeploy da `kinu-ai` | ⏳ prompt ao Lovable — §6 |
| Sondas 1-5 | ⏳ fundador, pós-redeploy |
| Missão `src/` da origem | 📋 especificada no §7, com a ressalva do §7.1 |

Os arcos 5.a-5.e seguem como estavam. **O relógio do 5.f não foi tocado:** série diária desde
06/09, aperto elegível a partir de 13/09.

**Rascunho `STEP1-KINUAI-HONESTIDADE.md`:** deletado, conforme protocolo. Nunca entrou em commit.
