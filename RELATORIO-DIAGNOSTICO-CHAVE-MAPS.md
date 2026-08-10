# Relatório — diagnóstico da leitura de chave em `maps-embed` e `google-places`

**Data:** 2026-08-07
**Escopo:** 100% leitura. Nenhum arquivo de código foi alterado.
**Relatório relacionado:** `AUDITORIA-SEGURANCA.md` (achado R-01)
**Objetivo:** confirmar, com trecho de código exato, qual secret cada uma das duas funções lê e como
a chave é usada na `maps-embed`.

---

## 1. Qual secret a `maps-embed` lê

`supabase/functions/maps-embed/index.ts:13`

```ts
  const API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");
```

Única ocorrência de `Deno.env.get` no arquivo.

## 2. Qual secret a `google-places` lê

`supabase/functions/google-places/index.ts:13`

```ts
  const API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");
```

Também única ocorrência de `Deno.env.get` no arquivo.

## 3. Mesmo secret ou secrets diferentes?

**O mesmo secret: `GOOGLE_PLACES_API_KEY`** — e, por coincidência, na mesma linha (13) dos dois
arquivos.

A consequência prática é que as duas funções compartilham uma credencial só. Não existe uma "chave de
embed" separada de uma "chave de Places": é uma chave única servindo aos dois usos.

## 4. Como a chave é usada na `maps-embed`

O bloco `try` inteiro da função são quatro linhas. A chave é interpolada na URL e essa URL vai no
corpo da resposta, sem nenhum passo intermediário de mascaramento ou substituição.

**Construção da URL** — `supabase/functions/maps-embed/index.ts:22`

```ts
    const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=${encodeURIComponent(query)}&zoom=${zoom || 12}&language=pt-BR`;
```

**Return** — `supabase/functions/maps-embed/index.ts:23-25`

```ts
    return new Response(JSON.stringify({ embedUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
```

Resposta às perguntas do enunciado: **sim** — a chave é concatenada na URL (`key=${API_KEY}`), a URL
é serializada com `JSON.stringify({ embedUrl })` e devolvida no corpo do `Response`. Entre a linha 22
e o `return` da linha 23 não há nada.

Para contexto, o arquivo completo tem 31 linhas; o caminho da chave é:

| Linha | O que acontece |
|---|---|
| 13 | `API_KEY` é lida do ambiente |
| 14-18 | Se ausente, devolve 503 (não vaza nada) |
| 22 | `API_KEY` é interpolada em `embedUrl` |
| 23-25 | `embedUrl` é devolvida no corpo da resposta |

---

## Estado atual da falha (verificado hoje)

Reexecutei a chamada anônima em 2026-08-07 para saber se a situação mudou desde a auditoria:

```
POST https://lnhbamzhturwkhcwiohr.supabase.co/functions/v1/maps-embed
     -H 'Content-Type: application/json'   -d '{"query":"teste","zoom":12}'
     (sem nenhum header de autenticação)

→ {"embedUrl":"https://www.google.com/maps/embed/v1/place?key=[chave real ainda devolvida]&q=teste&…"}
```

**A função continua devolvendo a chave a chamador anônimo.** O achado R-01 da auditoria segue aberto
e a `GOOGLE_PLACES_API_KEY` segue devendo ser tratada como comprometida.

---

## Observação de escopo

Este relatório é diagnóstico. Nenhuma correção foi proposta nem aplicada, conforme pedido.
A recomendação de correção já registrada consta de `AUDITORIA-SEGURANCA.md`, achado R-01.
