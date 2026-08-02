# Relatório — Deploy da edge `kinu-ai` via Supabase CLI

**Data:** 2026-08-02
**Escopo:** tirar o deploy das edge functions do Lovable e passá-lo para a CLI do Supabase.

> **Estado deste relatório (02/08, 2ª tentativa): deploy TENTADO E FALHADO — 403.** O token foi
> fornecido e é válido, mas pertence a uma conta que **não tem acesso ao projeto da aplicação**.
> A camada de hotéis já está commitada e no `origin/main` (`d50c8c8`). Ver
> [Bloqueio](#bloqueio-atual-o-token-é-de-outro-projeto).

## 1) O repo contém `HOTÉIS CURADOS` — confirmado

```
$ grep -n "HOTÉIS CURADOS" supabase/functions/kinu-ai/index.ts
531:          // 🏨 HOTÉIS CURADOS — seção final, quando a cidade tem curadoria de hotel.
558:                `🏨 HOTÉIS CURADOS\n` +
```

2 ocorrências. O ficheiro está **modificado e ainda não commitado** (` M supabase/functions/kinu-ai/index.ts`).

## 2) A produção NÃO contém — confirmado empiricamente

A `kinu-ai` não escreve em nenhuma tabela e tem `verify_jwt = false`, portanto dá para sondar com a
chave anon, sem persistir nada. Enviei um payload com o campo `hotels` preenchido (os 10 hotéis de
Cartagena) e a instrução de responder `SEM_HOTEIS_NO_CONTEXTO` caso não recebesse lista de hotéis:

```
HTTP 200
--- resposta ---
SEM_HOTEIS_NO_CONTEXTO

canários encontrados (0/4): nenhum
=> PROD NÃO tem o código novo (campo hotels ignorado)
```

Canários procurados: `Life is Good`, `R$ 80-200`, `Casa Lola`, `R$ 2.500-4.500` — strings que só
existem no catálogo curado e que a versão nova teria injetado no prompt.

**Conclusão: o Lovable não deployou a versão atual.** Repo ≠ produção, confirmado dos dois lados.

## 3) Ambiente

| Item | Valor | Origem |
|---|---|---|
| Supabase CLI | **2.111.0** | `npx supabase --version` |
| Project ref | **`lnhbamzhturwkhcwiohr`** | `supabase/config.toml:1`, bate com `VITE_SUPABASE_URL` |
| `verify_jwt` da `kinu-ai` | `false` | `supabase/config.toml` — a CLI respeita o config no deploy |

O project ref **não precisou ser fornecido** — está no repo.

## 4) Comando de deploy

```bash
set -a; . ~/.supabase-kinu.env; set +a
npx supabase functions deploy kinu-ai --project-ref lnhbamzhturwkhcwiohr
```

**Resultado: FALHOU com 403.**

```json
{"_tag":"Error","error":{"code":"UnknownError","message":"unexpected list functions status 403:
{\"message\":\"Your account does not have the necessary privileges to access this endpoint.\"}"}}
```

### Bloqueio atual: o token é de **outro projeto**

O token está gravado (`~/.supabase-kinu.env`, `chmod 600`, 44 chars, prefixo `sbp_` — PAT bem
formado) e **autentica sem problema**. O 403 não é de token inválido: é de conta sem acesso ao
projeto. Sondagem da Management API com esse token:

| Chamada | Status | Resultado |
|---|---|---|
| `GET /v1/organizations` | ✅ 200 | 1 org: `PedroContrucci's Org` (`amwzahfmmdcsudadxypf`) |
| `GET /v1/projects` | ✅ 200 | **1 projeto: `qbhcrwndkfzqeviiayvq` — "Kinu-beta"** (sa-east-1, healthy) |
| `GET /v1/projects/lnhbamzhturwkhcwiohr/functions` | ❌ 403 | sem privilégios |

**São dois projetos Supabase diferentes, e o token é do errado:**

| Projeto | Ref | Papel | Onde está declarado | Token tem acesso? |
|---|---|---|---|---|
| App / produção | `lnhbamzhturwkhcwiohr` | serve a `kinu-ai`; é a quem o app chama | `supabase/config.toml:1`, `VITE_SUPABASE_URL` | ❌ **não** |
| Kinu-beta (banco) | `qbhcrwndkfzqeviiayvq` | banco de conteúdo (`curated_activities`, `curated_hotels`) | `.env.sync` → `KINU_BETA_URL` | ✅ sim |

Confirmação de que o `Kinu-beta` **não** é o alvo: ele tem **1 única function, `quick-endpoint`** —
não existe `kinu-ai` lá. Fazer deploy nesse ref criaria uma function órfã no projeto errado e
deixaria a produção exatamente na mesma. **Por isso o deploy não foi redirecionado.**

**Causa provável:** o projeto da app foi criado pelo Lovable sob uma conta/organização diferente da
conta pessoal que gerou este PAT.

**Como destravar** — é preciso um token de uma conta com acesso a `lnhbamzhturwkhcwiohr`:

1. Entrar no [dashboard](https://supabase.com/dashboard/project/lnhbamzhturwkhcwiohr) — confirmar com
   que conta/email o projeto abre (provavelmente não é a mesma que gerou o token atual).
2. Ou **convidar** a conta atual (`PedroContrucci's Org`) como membro da org dona do projeto, com
   permissão de deploy — aí o token existente passa a servir e nada mais muda.
3. Ou gerar um PAT novo já logado na conta dona, em Account → Access Tokens, e regravar:

```bash
read -rs TOKEN && printf 'SUPABASE_ACCESS_TOKEN=%s\n' "$TOKEN" > ~/.supabase-kinu.env \
  && chmod 600 ~/.supabase-kinu.env && unset TOKEN && echo gravado
```

Teste rápido de que o token novo serve, **antes** de tentar o deploy:

```bash
set -a; . ~/.supabase-kinu.env; set +a
curl -s -o /dev/null -w '%{http_code}\n' -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  https://api.supabase.com/v1/projects/lnhbamzhturwkhcwiohr/functions   # tem de dar 200
```

### Verificação pós-deploy (a correr assim que destravar)

Re-executar a sonda. Sucesso = a resposta passa a nomear `Life is Good Hostel` / `R$ 80-200`
em vez de `SEM_HOTEIS_NO_CONTEXTO`. Como a sonda usa só a chave anon, ela também prova que o
`verify_jwt = false` sobreviveu ao deploy — se a CLI tivesse ligado a verificação de JWT, a chamada
falharia com 401 e o agente estaria partido para os utilizadores.

**Estado atual da sonda (re-executada em 02/08, depois do push do `d50c8c8`):**

```
HTTP 200
--- resposta ---
SEM_HOTEIS_NO_CONTEXTO

canários encontrados (0/4): nenhum
=> PROD NÃO tem o código novo (campo hotels ignorado)
```

Canário **vermelho**, como esperado — nenhum deploy chegou a acontecer. Isto também reconfirma a
regra 1 abaixo: o push do `d50c8c8` para o `origin/main` não mudou nada em produção.

## 5) Novo contrato operacional

**As edge functions passam a ser deployadas via Supabase CLI pelo Claude Code. O Lovable deixa de
ser o caminho de deploy das functions.**

| Camada | Antes | Agora |
|---|---|---|
| Front-end / app | Lovable | Lovable (inalterado) |
| `supabase/functions/**` | Lovable (não confiável — provado acima) | **`npx supabase functions deploy <fn> --project-ref lnhbamzhturwkhcwiohr`** |

Regras que passam a valer:

1. **Alterou `supabase/functions/**`? O push não basta.** É preciso o deploy explícito pela CLI —
   caso contrário o repo diverge silenciosamente da produção, exatamente o que aconteceu aqui.
2. **Sempre verificar depois do deploy.** Um deploy "sem erro" não prova que o código novo está a
   servir. A sonda de produção é o teste real.
3. **Degradação é silenciosa.** Enquanto a edge está velha, o app manda campos novos no payload
   (`hotels`) e a função antiga ignora-os sem erro — não há sintoma visível, só ausência de
   funcionalidade. Só um teste ativo apanha isto.
4. **O token nunca entra no repo nem no chat.** Vive em `~/.supabase-kinu.env` (`chmod 600`) ou no
   `~/.supabase/access-token`. Se algum dia for para um ficheiro do projeto, acrescentar ao
   `.gitignore` **antes** de o criar.

5. **Um token de Supabase não é global.** Vale só para os projetos da conta que o gerou. Este repo
   toca **dois** projetos (app e banco de conteúdo) e eles não estão sob a mesma conta — ver a
   tabela no [bloqueio](#bloqueio-atual-o-token-é-de-outro-projeto).

## Pendências

- [x] ~~Commitar a camada de hotéis~~ — feito: **`d50c8c8`**, `origin/main`
      (`curatedHotels.ts`, `sync-hotels.ts`, `KinuAIContext.tsx`, `kinu-ai/index.ts`,
      `RELATORIO-HOTEIS.md`). `tsc -p tsconfig.app.json --noEmit` ✅ antes do commit.
- [x] ~~Fornecer o `SUPABASE_ACCESS_TOKEN`~~ — gravado, mas **da conta errada** (403).
- [ ] **Obter um token com acesso ao ref `lnhbamzhturwkhcwiohr`** (ou dar acesso à conta atual) —
      é o único bloqueio que resta. Testar com o `curl` da secção 4 antes de tentar o deploy.
- [ ] Correr o deploy e a sonda; atualizar a secção 4 com o resultado real.

Até lá, produção continua a servir a `kinu-ai` antiga: o app manda `hotels` no payload e a função
ignora o campo. Sem sintoma visível para o utilizador, só ausência de recomendação de hotel.
