# Auditoria de segurança — KINU Travel OS

**Data:** 2026-08-06
**Escopo:** somente leitura e diagnóstico. Nenhum arquivo de código foi alterado, criado ou removido.
**Alvos:** app React/TS (`src/`), 11 edge functions (`supabase/functions/`), projeto de produção
`lnhbamzhturwkhcwiohr` (Lovable Cloud) e projeto de curadoria `qbhcrwndkfzqeviiayvq` (kinu-beta).
**Testes ao vivo:** todos read-only, exceto 4 tentativas de INSERT anônimo que a RLS **bloqueou**
(nada foi gravado — detalhe em V-07). Nenhum valor de chave aparece neste relatório.

---

## Sumário executivo

O lado do **banco** está bem feito: a RLS do projeto de produção bloqueia leitura e escrita anônima
em todas as tabelas pessoais, e nenhuma chave está hardcoded no bundle do cliente. O lado das
**edge functions** é o oposto: as 11 estão abertas na internet sem qualquer autenticação, e três
delas — `maps-embed`, `kinu-ai` e `feedback-digest` — transformam essa abertura em dano concreto
(chave do Google vazando, custo ilimitado na Anthropic, e feedback de testadores contornando a
própria RLS que o protege).

**Veredito: a superfície de dados está protegida; a superfície de compute está totalmente exposta.**

---

## 🔴 RISCOS ATIVOS

### R-01 — `maps-embed` entrega a chave do Google Places a qualquer um

A função monta a URL do embed **com a chave em texto claro** e devolve isso no corpo da resposta:

`supabase/functions/maps-embed/index.ts:22`
```ts
const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=...`;
```

Confirmado ao vivo, sem nenhum header de autenticação e com `Origin` forjada:

```
POST /functions/v1/maps-embed   -H 'Origin: https://evil.example.com'   {"query":"Torre Eiffel"}
→ HTTP 200 · access-control-allow-origin: *
→ {"embedUrl":"https://www.google.com/maps/embed/v1/place?key=AIza…[chave real devolvida]…"}
```

É a **mesma** `GOOGLE_PLACES_API_KEY` usada pela função `google-places` (`google-places/index.ts:13`),
ou seja, quem extrair a chave passa a faturar a Places API na conta do projeto — sem sequer precisar
da edge function. Um comando `curl` de uma linha basta.

**Correção recomendada (descrita, não aplicada):** a função não deve devolver a URL com a chave. Ou
ela faz proxy do iframe do lado do servidor, ou o front passa a usar um mapa sem chave. Depois disso:
**rotacionar a `GOOGLE_PLACES_API_KEY` imediatamente** (deve ser considerada comprometida) e aplicar
restrições de referrer/API no console do Google Cloud.

---

### R-02 — As 11 edge functions estão abertas, sem exceção

`supabase/config.toml` declara `verify_jwt = false` para as 9 funções listadas:

```
generate-itinerary · kinu-ai · weather · unsplash · amadeus-flights
viator-search · exchange-rates · google-places · maps-embed        → todas verify_jwt = false
```

`feedback-digest` e `feedback-notify` **não constam** do `config.toml` — o que normalmente
significaria `verify_jwt = true`. Testei: também estão abertas.

Prova em produção, custo zero (corpo inválido de propósito, para não disparar nenhuma API paga):

| Função | Requisição sem nenhum header de auth | Resultado |
|---|---|---|
| `kinu-ai` | `POST {}` | **HTTP 400** `{"error":"Mensagem não pode estar vazia."}` → chegou na validação da própria função |
| `exchange-rates` | `POST {}` | **HTTP 200** com as cotações reais |
| `maps-embed` | `POST {query:…}` | **HTTP 200** com a chave do Google |
| `feedback-notify` | `POST` JSON malformado | **HTTP 200** `{"ok":false,"error":"…is not valid JSON"}` → chegou no `JSON.parse` da função |
| `feedback-digest` | `POST` JSON malformado | **HTTP 200** com o digest real (ver R-04) |

Se houvesse verificação de JWT, o gateway devolveria `401` **antes** de a função rodar. Devolveu o
erro interno da função — logo, não há verificação.

Além do JWT, busquei qualquer controle alternativo em todas as 11 funções (`grep` por
`authorization|verify|rate.?limit|origin|referer|secret|token`): **nenhuma valida origem, nenhuma
exige token próprio, nenhuma tem rate limiting.** A única menção a rate limit é
`unsplash/index.ts:119-128`, que apenas trata o 429 que a *Unsplash* devolve — não limita o chamador.

**Conclusão por função — quem tem a URL consegue invocar e consumir cota paga:**

| Função | Invocável por qualquer um | Cota paga que consome |
|---|---|---|
| `kinu-ai` | ✅ | Anthropic + Google Places (via `consultar_lugares`) |
| `generate-itinerary` | ✅ | Anthropic (`max_tokens: 4096`) |
| `feedback-digest` | ✅ | Anthropic (`max_tokens: 2000`) + **lê o banco com service_role** |
| `feedback-notify` | ✅ | Anthropic + Resend (e-mail) + CallMeBot (WhatsApp) |
| `google-places` | ✅ | Google Places API |
| `maps-embed` | ✅ | — (mas vaza a chave, R-01) |
| `amadeus-flights` | ✅ | Travelpayouts |
| `viator-search` | ✅ | Viator |
| `unsplash` | ✅ | Unsplash |
| `weather` | ✅ | OpenWeather |
| `exchange-rates` | ✅ | ExchangeRate-API |

**Correção recomendada:** ver a ordem de correção no fim do relatório — a decisão de fundo é escolher
entre `verify_jwt = true` + Supabase Auth de verdade, ou um segredo compartilhado validado no início
de cada função. Rate limiting por IP é necessário nos dois cenários.

---

### R-03 — `kinu-ai` aberta: exposição financeira sem teto no código

`kinu-ai` chama a API da Anthropic diretamente (`kinu-ai/index.ts:628-641`), modelo
`claude-sonnet-4-6`, dentro de um laço de até **3 turnos** por requisição HTTP
(`kinu-ai/index.ts:626`).

O ponto positivo: **todos os campos do payload têm limite**. `curatedCatalog` é cortado em 80 itens e
30 hotéis, `itineraryDays` em 12 dias × 8 itens, `history` em 10 mensagens × 5.000 caracteres,
`message` em 2.000 caracteres (`kinu-ai/index.ts:480-598`, `sanitizeText`/`sanitizeHistory`). Isso
limita o pior caso — sem esses cortes, a exposição seria ilimitada por requisição.

Montei o payload máximo que esses limites permitem e **medi os tokens de verdade** com
`/v1/messages/count_tokens` (não estimei por caracteres):

```
Entrada, pior caso, por chamada à API:  72.512 tokens
Preço claude-sonnet-4-6:                $3,00/MTok entrada · $15,00/MTok saída
Custo por chamada:                      $0,2175 (entrada) + $0,0154 (saída, max_tokens 1024) = $0,233
Custo por requisição HTTP (3 turnos):   ≈ $0,70
```

Cada turno que aciona `consultar_lugares` ainda chama `google-places` (Places API paga,
`kinu-ai/index.ts:250-263`), somando ~$0,032 por chamada.

**Pior caso agregado.** O código não impõe teto nenhum de frequência. O único limite real é a
concorrência da plataforma Supabase e o rate limit da organização na Anthropic — que não consigo ler
daqui. Com essa ressalva explícita:

| Ritmo do atacante | Custo/hora | Custo/dia |
|---|---|---|
| 1 req/s | ~$2.500 | ~$60.000 |
| 5 req/s | ~$12.600 | ~$302.000 |

Uma requisição típica de usuário real custa bem menos (~$0,05), mas o atacante escolhe o payload —
e portanto escolhe o pior caso. **O rate limit da conta Anthropic é hoje o único freio existente**, o
que significa que o "controle de custo" do sistema é, na prática, a fatura chegar.

**Correção recomendada:** rate limiting por IP na função (contador em tabela ou KV com janela
deslizante), teto de gasto configurado no console da Anthropic, e `verify_jwt` para atribuir consumo
a um usuário.

---

### R-04 — `feedback-digest` vaza o feedback dos testadores, contornando a RLS

A migration `20260723011847_…sql:17` diz, corretamente:

```sql
-- No SELECT/UPDATE/DELETE policies exist for anon/authenticated on beta_feedback,
-- so reads remain restricted to service_role (used by feedback-digest / feedback-notify).
```

E a RLS de fato funciona — testei com a chave publishable: `beta_feedback` devolve **0 linhas**.

Mas `feedback-digest` lê a tabela com `SUPABASE_SERVICE_ROLE_KEY` (`feedback-digest/index.ts:26`),
resume com a Anthropic e devolve o resultado — **sem exigir autenticação**. Uma chamada anônima
minha retornou o digest real, com queixas concretas de testadores sobre o app. Não reproduzo o
conteúdo aqui porque é dado de usuário.

Ou seja: a política de RLS que protege `beta_feedback` está correta, e a função a anula por completo.
Ela é um proxy público de leitura com privilégio de `service_role`. Cada chamada ainda queima tokens
da Anthropic (`max_tokens: 2000`).

**Correção recomendada:** esta função nunca deveria ser pública. Ou vira um cron/job interno, ou
exige um segredo próprio no header validado na primeira linha do handler.

---

### R-05 — `feedback-notify` aberta: spam de WhatsApp e e-mail na conta do dono

Também sem autenticação (confirmado em R-02). Ao receber um corpo válido ela:

- chama a Anthropic para classificar o feedback (`feedback-notify/index.ts:49-61`);
- envia e-mail via Resend (`feedback-notify/index.ts:113`);
- dispara WhatsApp via CallMeBot (`feedback-notify/index.ts:137`).

Qualquer pessoa com a URL pode disparar WhatsApp e e-mail ilimitados para o dono do projeto, com
conteúdo que ela mesma escolhe, além de consumir tokens da Anthropic e cota do Resend.

**Correção recomendada:** mesma de R-04 — segredo próprio ou JWT, e rate limiting agressivo (esta é
uma função de baixa frequência legítima).

---

## Tabela de achados

| ID | Item | Sev. | Evidência (arquivo:linha) | Correção recomendada (descrita, não aplicada) |
|---|---|---|---|---|
| R-01 | `maps-embed` devolve a `GOOGLE_PLACES_API_KEY` em texto claro a chamador anônimo | 🔴 | `supabase/functions/maps-embed/index.ts:22` + teste ao vivo HTTP 200 | Não devolver a URL com chave; fazer proxy server-side. **Rotacionar a chave** e restringi-la no Google Cloud |
| R-02 | 11/11 edge functions sem autenticação, sem validação de origem, sem rate limiting | 🔴 | `supabase/config.toml` (9× `verify_jwt = false`); provas HTTP em R-02 | `verify_jwt = true` + Supabase Auth, ou segredo compartilhado validado no handler; rate limit por IP |
| R-03 | `kinu-ai` aberta: até ~$0,70 por requisição, sem teto de frequência | 🔴 | `kinu-ai/index.ts:628-641`, laço `:626`, `max_tokens :636` | Rate limit por IP, teto de gasto na Anthropic, atribuição de consumo por usuário |
| R-04 | `feedback-digest` lê `beta_feedback` com `service_role` e devolve a qualquer um | 🔴 | `feedback-digest/index.ts:25-26`; migration `20260723011847…:17`; teste anônimo HTTP 200 com dados reais | Tornar interna (cron) ou exigir segredo próprio no header |
| R-05 | `feedback-notify` aberta: WhatsApp + e-mail + Anthropic disparáveis por terceiros | 🔴 | `feedback-notify/index.ts:113` (Resend), `:137` (CallMeBot), `:49-61` (Anthropic) | Segredo próprio ou JWT + rate limit agressivo |
| M-01 | CORS `Access-Control-Allow-Origin: '*'` em 11/11 funções | 🟡 | `kinu-ai:14`, `amadeus-flights:8`, `google-places:4`, `maps-embed:4`, `weather:14`, `exchange-rates:14`, `generate-itinerary:14`, `unsplash:14`, `viator-search:14`, `feedback-digest:14`, `feedback-notify:14` | Restringir a `https://kinu-travel.app`. **Não substitui R-02:** CORS é do navegador; `curl` ignora |
| M-02 | `.env` está **rastreado no git** (confirmado: `git ls-files` e histórico em `23af90c`) | 🟡 | `.env` (3 vars) vs. `.gitignore` — que ignora `.env.sync` mas não `.env` | O conteúdo atual é público por design (M-03), mas o padrão é perigoso: adicionar `.env` ao `.gitignore` antes que um segredo real caia ali |
| M-03 | Variáveis `VITE_*`: 3 no total, todas **públicas por design** | 🟡 | `src/integrations/supabase/client.ts:5-6`; `.env` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY` (JWT `role: anon`) — corretas no bundle. Manter a regra: nenhuma chave nova com prefixo `VITE_` |
| M-04 | Autenticação inexistente: qualquer e-mail + senha ≥6 caracteres entra | 🟡 | `src/hooks/useAuth.ts:1` ("sem Supabase Auth por enquanto"); `src/pages/Login.tsx:30-31` | Hoje o impacto é baixo (as viagens são locais). Vira 🔴 no dia em que os dados forem para o servidor — migrar para Supabase Auth antes disso |
| M-05 | Dados pessoais e **idades de crianças** em `localStorage`, em claro | 🟡 | `WizardTraveler.age` em `src/components/wizard/types.ts:3-8`; gravado em `kinu_trips` via `NewPlanningWizard.tsx:139,155` | Ver §"Dados pessoais" abaixo. Exposição é local ao dispositivo, sem via de exfiltração encontrada — mas é dado de menor sob a LGPD: minimizar (faixa etária em vez de idade exata) e definir retenção |
| M-06 | Dados de viagem enviados à Anthropic (terceiro) | 🟡 | `kinu-ai/index.ts:398-470` monta o contexto; `:628` envia | Destino, datas, orçamento, nome do hotel, bairro. **Não** inclui nomes nem idades (ver V-10). Declarar no aviso de privacidade |
| M-07 | `feedback-notify` põe a apikey do CallMeBot e o texto do feedback na **query string** | 🟡 | `feedback-notify/index.ts:137` | URLs vazam para logs de proxy e histórico. Trocar por um provedor com auth por header |
| M-08 | `curatedCatalog` vindo do cliente é injetado no **system prompt** | 🟡 | `kinu-ai/index.ts:492-570` → concatenado em `systemPrompt` `:603` | Superfície de prompt injection: o atacante escreve parte do system prompt. Os campos são sanitizados e limitados, mas o conteúdo é livre. Mover o catálogo para dentro de um bloco delimitado e marcado como não-confiável, como já é feito com `<user_message>` |
| V-01 | Nenhuma chave hardcoded em `src/` | 🟢 | `grep -rEi "sk-\|AIza\|eyJ\|Bearer \|api_key\|secret\|service_role" src/` → **zero ocorrências** | — |
| V-02 | Todas as chaves de terceiros só em `Deno.env.get()` nas edge functions | 🟢 | 17 ocorrências: `ANTHROPIC_API_KEY`, `GOOGLE_PLACES_API_KEY`, `TRAVELPAYOUTS_TOKEN`, `UNSPLASH_ACCESS_KEY`, `VIATOR_API_KEY`, `OPENWEATHER_API_KEY`, `EXCHANGERATE_API_KEY`, `RESEND_API_KEY`, `CALLMEBOT_APIKEY`, `SUPABASE_SERVICE_ROLE_KEY` | — |
| V-03 | Amadeus/Travelpayouts, Anthropic, Unsplash e Google Places **nunca** aparecem no cliente | 🟢 | `amadeus-flights:138`, `kinu-ai:377`, `unsplash:61`, `google-places:13` — todas server-side | — |
| V-04 | Logs mascaram credenciais em URLs | 🟢 | `sanitizeUrl()` em 9 funções: `.replace(/token=[^&]+/gi,'token=***')` e idem `apikey=` (ex.: `kinu-ai/index.ts:5-6`) | — |
| V-05 | `kinu-ai` **não** loga prompts nem respostas do usuário | 🟢 | 5 `console.*` no arquivo (`:266,288,380,644,703`) — todos registram só status HTTP ou mensagem de erro sanitizada | — |
| V-06 | RLS de produção: leitura anônima bloqueada nas tabelas pessoais | 🟢 | Teste com `VITE_SUPABASE_PUBLISHABLE_KEY`: `user_profiles`, `trips`, `trip_travelers`, `trip_payments`, `beta_feedback`, `price_history`, `clan_members` → HTTP 200 com **0 linhas** | — |
| V-07 | RLS de produção: escrita anônima bloqueada | 🟢 | 4 INSERTs anônimos → HTTP 401 `42501 new row violates row-level security policy` em `trips`, `user_profiles`, `community_activities`, `cities`, `trip_travelers`. **Nada foi gravado, nada precisou ser apagado** | — |
| V-08 | `service_role` do kinu-beta contida | 🟢 | Só em `.env.sync`; `.gitignore:23` a ignora; ausente de `src/`, `scripts/` e de todo o histórico git (`git log -S`) | — |
| V-09 | kinu-beta exige chave válida | 🟢 | Sem `apikey` → 401 `No API key found`; chave inválida → 401; chave publishable de **produção** contra o beta → 401 `Invalid API key` (projetos isolados) | — |
| V-10 | O contexto enviado à IA **não** inclui nomes nem idades de crianças | 🟢 | `RequestBody.context` (`kinu-ai/index.ts:300-322`) só tem `travelers?: number` — a composição familiar detalhada nunca sai do dispositivo | — |
| V-11 | Todo o payload da `kinu-ai` tem teto de tamanho | 🟢 | `slice(0,80)` itens, `slice(0,30)` hotéis, `slice(0,12)` dias, `slice(-10)` histórico, `sanitizeText` em cada campo (`:480-598`) | É o que limita R-03 ao valor medido em vez de infinito |

---

## Dados pessoais no `localStorage`

Grep completo em `src/`. Oito chaves distintas:

| Chave | Conteúdo | Classificação |
|---|---|---|
| `kinu_trips` | destino, país, datas, **orçamento**, estilo, adultos, bebês e **`children: WizardTraveler[]` com `age` e `name` opcionais**, voos e hotel confirmados, itinerário completo | **Dados pessoais — inclui idade de menor** |
| `kinu_user` | `{ email, name }` em texto claro (senha **não** é armazenada) | Dados pessoais |
| `kinu_feedback` | `tester_name`, texto livre do feedback, `navigator.userAgent`, resolução de tela | Dados pessoais |
| `kinu_tester_name` | nome do testador | Dados pessoais |
| `kinu_saved_activities` | atividades salvas | Preferência |
| `kinu_exchange_rates_v2` | cache de cotações | Técnico |
| `kinu_trip_panel_sections` | seções abertas/fechadas do painel | Técnico |
| `kinu_price_history_<tripId>` | histórico de preços por viagem | Técnico |

**Sobre as idades de crianças.** O modelo está em `src/components/wizard/types.ts:3-8`
(`type: 'adult'|'child'|'infant'`, `age?: number`, `name?: string`), preenchido em
`WizardStep2Travelers.tsx:19-25` e persistido em `kinu_trips`
(`NewPlanningWizard.tsx:139` → `:155`). O banco de produção tem o campo correspondente
`trip_travelers.age_at_travel`, hoje inacessível anonimamente (V-06/V-07).

Sendo preciso sobre o risco: **o dado não sai do dispositivo.** Não vai para a `kinu-ai` (V-10), não é
gravado no banco pelo fluxo atual, e o `localStorage` é same-origin — não encontrei vetor de XSS que
o exponha. Por isso classifiquei como 🟡 e não 🔴. O que o torna relevante é a LGPD: dado de menor
tem proteção reforçada, e hoje não há criptografia, política de retenção nem minimização. A
recomendação é guardar faixa etária (`0-2`, `3-11`, `12-17`) em vez da idade exata, que é o que o
cálculo de preço realmente precisa, e definir expiração para viagens antigas.

---

## Logs com dados de usuário

**Na `kinu-ai`:** limpa. Os cinco `console.*` do arquivo registram apenas status HTTP
(`:266`, `:644`) ou mensagem de erro passada por `sanitizeUrl` (`:288`, `:703`); `:380` só informa
que a chave não está configurada. **Nenhum prompt ou resposta é logado**, e não há escrita em
tabela — a conversa não é persistida em lugar nenhum do lado do KINU.

**O que o Supabase registra por padrão nas invocações:** os logs de edge function guardam metadados
por requisição — timestamp, método, path, status, duração, IP de origem e user-agent — mais tudo o
que a função escrever em `stdout`/`stderr`. **O corpo da requisição e da resposta não são
registrados.** Como o código não imprime conteúdo de usuário, o que fica retido nos logs do Supabase
é metadado, não conversa. O ponto de atenção é o **IP**, que é dado pessoal sob a LGPD e fica sujeito
à retenção padrão da plataforma.

**Terceiro com acesso ao conteúdo:** a Anthropic recebe o `systemPrompt` + o contexto de viagem +
a mensagem do usuário (M-06). Isso precisa constar do aviso de privacidade.

---

## Estimativa de exposição financeira — pior caso

Consolidando R-01, R-03 e R-05, com `kinu-ai` como vetor principal:

| Vetor | Custo unitário | Base |
|---|---|---|
| `kinu-ai`, payload máximo, 3 turnos | **~$0,70 / requisição** | 72.512 tokens de entrada medidos via `count_tokens`; $3/MTok entrada + $15/MTok saída |
| `google-places` via `consultar_lugares` | ~$0,032 / chamada | Places API Text Search |
| Google Places com a **chave vazada** (R-01) | ~$32 / 1.000 chamadas | Direto contra o Google, sem passar pelo KINU |
| `generate-itinerary` | ~$0,06 / requisição | `max_tokens: 4096` |
| `feedback-digest` / `feedback-notify` | ~$0,03 / chamada + e-mail + WhatsApp | R-04, R-05 |

**Agregado, com a ressalva de que não consigo ler o rate limit da conta Anthropic daqui:**

| Ritmo sustentado contra `kinu-ai` | Por hora | Por dia |
|---|---|---|
| 1 req/s | ~$2.500 | ~$60.000 |
| 5 req/s | ~$12.600 | ~$302.000 |

O código **não impõe teto nenhum**. Os únicos limites reais hoje são a concorrência da plataforma
Supabase e o rate limit da organização na Anthropic. Em outras palavras: o controle de custo do
sistema é a fatura chegando.

---

## Não verificado

**Teste prático de RLS no kinu-beta com a chave anon: não executado.** O `.env.sync` do Codespace
contém apenas `KINU_BETA_URL` e `KINU_BETA_SERVICE_KEY` (JWT com `role: service_role`, confirmado
decodificando o payload). A chave **anon** do projeto `qbhcrwndkfzqeviiayvq` não existe em lugar
nenhum do repositório nem do ambiente, e não é possível forjá-la sem o JWT secret.

O que **foi** verificado no kinu-beta: sem `apikey` → 401; com chave inválida → 401; com a chave
publishable do projeto de produção → 401 (projetos isolados); com `service_role` → 200 em
`curated_activities` e `curated_hotels` (baseline de leitura, esperado).

Para fechar a lacuna em ~1 minuto, sem código: pegue a chave `anon` em
*Dashboard → qbhcrwndkfzqeviiayvq → Settings → API* e rode

```
curl "$KINU_BETA_URL/rest/v1/curated_activities?select=id&limit=1" -H "apikey: <anon>"
```

`[]` = RLS ativa e sem policy de leitura. Linhas devolvidas = leitura pública (aceitável para um
catálogo, mas deve ser uma decisão consciente). Depois o mesmo com `-X POST -d '{"id":"teste"}'`:
qualquer coisa diferente de `42501` significa escrita anônima permitida — aí é 🔴.

Também não verifiquei se a `GOOGLE_PLACES_API_KEY` tem restrições de referrer/IP no console do
Google Cloud. Se tiver, o impacto de R-01 é menor — mas a chave continua exposta e a Places API
normalmente não respeita restrição de referrer.

---

## Ordem recomendada de correção pós-freeze

1. **`maps-embed` (R-01)** — parar de devolver a chave **e rotacionar a `GOOGLE_PLACES_API_KEY`**.
   Único achado em que a credencial já deve ser considerada comprometida; enquanto não for rotacionada,
   qualquer cópia extraída continua válida.
2. **Fechar `feedback-digest` e `feedback-notify` (R-04, R-05)** — as duas de menor esforço e maior
   retorno: não têm uso legítimo público, então basta um segredo no header. Estanca o vazamento de
   feedback e o spam de WhatsApp.
3. **Rate limiting em `kinu-ai` e `generate-itinerary` (R-03)** — e um teto de gasto no console da
   Anthropic no mesmo dia. O teto é configuração, não código: dá para fazer antes do deploy.
4. **Autenticação nas edge functions (R-02)** — a mudança estrutural. Decidir entre `verify_jwt = true`
   + Supabase Auth (que casa com M-04) ou segredo compartilhado. Depois disso, restringir o CORS
   (M-01) como defesa em profundidade, não como o controle principal.
5. **`.env` no `.gitignore` (M-02)** — trivial; fazer antes que um segredo real caia no arquivo.
6. **Minimização das idades de crianças (M-05)** e delimitação do `curatedCatalog` no system prompt
   (M-08) — dívida de privacidade e de robustez, sem urgência operacional.
7. **Fechar a lacuna do teste anon no kinu-beta** (seção acima) — 1 minuto, e converte a única
   incerteza deste relatório em fato.

---

## Contagem

| | |
|---|---|
| 🔴 Riscos ativos | **5** |
| 🟡 Médios | **8** |
| 🟢 OK | **11** |
