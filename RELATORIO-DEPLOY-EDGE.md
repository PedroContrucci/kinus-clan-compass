# Relatório — Deploy da edge `kinu-ai` via Supabase CLI

**Data:** 2026-08-02
**Escopo:** tirar o deploy das edge functions do Lovable e passá-lo para a CLI do Supabase.

> **Estado deste relatório: deploy PREPARADO E BLOQUEADO, não executado.** Tudo o que depende só
> do repo está verificado; falta a credencial. Ver [Bloqueio](#bloqueio-atual).

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

**Resultado: não executado.** Ver bloqueio abaixo.

### Bloqueio atual

O `SUPABASE_ACCESS_TOKEN` não está acessível ao agente:

| Local verificado | Resultado |
|---|---|
| `~/.supabase-kinu.env` (`HOME=/home/codespace`) | ❌ não existe |
| `$SUPABASE_ACCESS_TOKEN` no ambiente | ❌ não setada |
| `~/.supabase/access-token` (de um `supabase login`) | ❌ não existe |
| `find / -maxdepth 4 -name .supabase-kinu.env` | ❌ sem resultados |

**Causa provável:** o comando de gravação do token correu no **terminal local da máquina**, que é um
filesystem distinto deste container. O agente corre dentro do codespace (`HOME=/home/codespace`);
um ficheiro no `~` da máquina local é invisível daqui.

**Como destravar** — qualquer uma serve, no terminal **integrado do codespace** (confirmar com
`echo $HOME` → tem de dar `/home/codespace`):

```bash
# A) ficheiro fora do repo
read -rs TOKEN && printf 'SUPABASE_ACCESS_TOKEN=%s\n' "$TOKEN" > ~/.supabase-kinu.env \
  && chmod 600 ~/.supabase-kinu.env && unset TOKEN && echo gravado

# B) login da CLI (guarda em ~/.supabase/access-token, dispensa o ficheiro)
npx supabase login
```

`read -rs` não ecoa e não entra no `~/.bash_history`. O `~/` fica **fora do repo** — nota que o
`.gitignore` só cobre `.env.sync`, então um `.env.deploy` na raiz **seria commitável**; por isso o
token vive no home, não no projeto.

### Verificação pós-deploy (a correr assim que destravar)

Re-executar a mesma sonda. Sucesso = a resposta passa a nomear `Life is Good Hostel` / `R$ 80-200`
em vez de `SEM_HOTEIS_NO_CONTEXTO`. Como a sonda usa só a chave anon, ela também prova que o
`verify_jwt = false` sobreviveu ao deploy — se a CLI tivesse ligado a verificação de JWT, a chamada
falharia com 401 e o agente estaria partido para os utilizadores.

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

## Pendências

- [ ] Fornecer o `SUPABASE_ACCESS_TOKEN` no codespace.
- [ ] Correr o deploy e a sonda de verificação; atualizar as secções 4 e 5 com o resultado real.
- [ ] Commitar a camada de hotéis (`src/data/curatedHotels.ts`, `scripts/sync-hotels.ts`,
      `KinuAIContext.tsx`, `kinu-ai/index.ts`, `RELATORIO-HOTEIS.md`) — continua fora do git.
      Enquanto isso, um deploy põe em produção código que não está no histórico.
