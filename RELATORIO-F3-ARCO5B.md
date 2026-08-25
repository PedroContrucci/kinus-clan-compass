# RELATÓRIO — F3 / Arco 5.b

## Neutralização de `generate-itinerary` (proxy Claude órfão)

**Data:** 2026-08-25
**Escopo:** `supabase/functions/generate-itinerary/index.ts` — **um arquivo, nada além dele**.
**Base:** `RELATORIO-RECON-ARCO5.md` §1.2 (órfã) e §6.2 (item 5.b).
**Precedente seguido:** `feedback-digest` — commit `d7cbd0d` (403 no topo, código inerte abaixo).
**Regra da casa respeitada:** sem `amend`, sem `force`. Este relatório vai em commit `docs:`
separado.

---

## 0. Veredicto em quatro linhas

1. A função foi neutralizada **no repositório**: 403 duro logo após o handler de `OPTIONS`, com
   corpo JSON explicando o porquê.
2. O código original (linhas 58–193 do arquivo antigo) está **intacto e inerte**. Reversão =
   remover 11 linhas.
3. Orfandade **re-confirmada** antes de aplicar: zero chamadores em `src/`, `scripts/`,
   `package.json`. Nenhum apareceu desde o recon.
4. ⚠️ **Isto ainda não fechou o proxy em produção.** Ver §5 — é a parte que importa deste
   relatório.

---

## 1. O que foi verificado antes de tocar no arquivo

Três varreduras independentes. Nenhuma achou chamador.

**(a) Nome da function em todo o repo** (fora de `node_modules`): só aparece em
`supabase/config.toml:3`, no próprio `index.ts:185` (dentro de um `console.error`), e em
documentação (`AUDITORIA-SEGURANCA.md`, `RELATORIO-RECON-ARCO5.md`). **Zero código de app.**

**(b) Inventário completo de `functions.invoke(` em `src/` + `scripts/` — 19 call sites:**

| Function invocada | Ocorrências |
|---|---|
| `amadeus-flights` | 6 |
| `kinu-ai` | 3 |
| `exchange-rates` | 3 |
| `weather` | 2 |
| `unsplash` | 1 |
| `google-places` | 1 |
| `maps-embed` | 1 |
| `feedback-notify` | 1 |
| **`generate-itinerary`** | **0** |

**(c) Falso positivo tratado.** O grep amplo por `generateItinerary` acende em:

- `src/components/cockpit/GeneratedItineraryStage.tsx:236` — `export function generateItinerary(...)`
- `src/pages/SmokeTest.tsx:3,852` — importa e chama a função acima

**Não é a edge function.** É um gerador local, síncrono, em TypeScript do bundle. Confirmado por
grep dentro de `GeneratedItineraryStage.tsx`: zero ocorrências de `supabase`, `invoke` ou
`fetch(` no arquivo inteiro. Nome parecido, coisa diferente — e por isso foi checado em vez de
descartado no olho.

---

## 2. A mudança aplicada

**Arquivo:** `supabase/functions/generate-itinerary/index.ts` · **+11 / −0** · 193 → 204 linhas.

```diff
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }

+  // Arco 5.b: função desativada. Proxy Claude aberto à internet (~$0,06/req,
+  // max_tokens 4096) sem identidade nem rate limiting — e órfã: zero chamadores
+  // em src/, scripts/ ou package.json. Ver RELATORIO-RECON-ARCO5.md §1.2 e §6.2.
+  // Código abaixo mantido inerte para reversão: basta remover este bloco.
+  return new Response(
+    JSON.stringify({
+      error: "Esta função foi desativada — sem chamadores; ver RELATORIO-RECON-ARCO5.md",
+    }),
+    { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
+  );
+
   try {
     const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
```

### Fidelidade ao padrão `feedback-digest`

| Traço do precedente | Aqui |
|---|---|
| 403 imediatamente após o handler de `OPTIONS` | ✅ mesma posição |
| Corpo JSON com campo `error` | ✅ |
| `Content-Type: application/json` + `corsHeaders` espalhados | ✅ |
| Comentário com o porquê + ponteiro para a fonte | ✅ (aponta o recon; o outro apontava R-04) |
| "Código abaixo mantido inerte para reversão" | ✅ |
| Reversível por remoção do bloco, sem restaurar nada | ✅ |

Única divergência deliberada: **aspas duplas** em vez de simples, porque
`generate-itinerary/index.ts` inteiro usa aspas duplas. Padrão do arquivo vence o do vizinho.

### Notas de comportamento

- **`OPTIONS` continua respondendo 200**, porque o preflight é tratado antes do 403. Um navegador
  recebe preflight OK e só então leva 403 no POST — rejeição da aplicação, não erro de CORS
  mascarado.
- **Código inalcançável não quebra deploy.** O `return` no topo torna o `try` abaixo inalcançável;
  Deno/TS tratam como aviso de lint, não erro. O precedente `feedback-digest` roda em produção
  exatamente assim desde `d7cbd0d`.

### O que NÃO foi tocado

- `supabase/config.toml` — a entrada `[functions.generate-itinerary] verify_jwt = false` continua
  como estava. É outro arco (5.a).
- O diretório da função não foi removido. Neutralizar ≠ deletar.
- As outras 10 functions, `ANTHROPIC_API_KEY` e qualquer outro segredo: intocados.

---

## 3. Verificação pós-aplicação

`tsc` e `build` **não se aplicam**: é função Deno, fora do `tsconfig` do app. A verificação
cabível é o diff.

```
$ git status --porcelain
 M supabase/functions/generate-itinerary/index.ts
?? STEP1-ARCO5B.md          (rascunho, não commitado — deletado ao fim)

$ git diff --stat
 supabase/functions/generate-itinerary/index.ts | 11 +++++++++++
 1 file changed, 11 insertions(+)
```

**Um arquivo. Onze linhas. Nenhuma remoção.** Exatamente o proposto no STEP 1.

---

## 4. Commit e push

```
$ git commit
[main 371f45d] feat(f3): arco 5.b - neutraliza generate-itinerary (proxy claude orfao, 403 padrao feedback-digest)
 1 file changed, 11 insertions(+)

$ git push
To https://github.com/PedroContrucci/kinus-clan-compass
   4eb95f7..371f45d  main -> main
```

Sem `amend`. Sem `force`. Fast-forward limpo de `4eb95f7` para `371f45d`.

---

## 5. ⚠️ RESSALVA DE PRODUÇÃO — o proxy ainda está aberto

**Este commit não fechou nada em produção. Ainda.**

O deploy real das edge functions depende do pipeline do **Lovable**, e o ref do projeto de
produção é **desconhecido** para esta sessão (`RELATORIO-RECON-ARCO5.md` §3.2). O repo conhece
dois refs (`lnhbamzhturwkhcwiohr` no `config.toml`, `qbhcrwndkfzqeviiayvq` do kinu-beta), mas
nenhum deles está confirmado como o runtime que serve os usuários hoje.

Consequência direta:

1. Commitar e dar push muda **o repositório**, não o runtime.
2. A neutralização só passa a valer **depois do próximo publish do Lovable**.
3. **Até lá, a URL de produção de `generate-itinerary` continua servindo Claude de graça** a
   quem souber o endereço — ~$0,06 por requisição, `max_tokens: 4096`, sem identidade nem freio.

### A prova de fechamento é um curl, não este relatório

O item 5.b está **aplicado no repo** e **pendente em produção**. O que fecha o ciclo:

```bash
curl -i -X POST https://<REF-DE-PRODUCAO>.supabase.co/functions/v1/generate-itinerary \
  -H "Content-Type: application/json" \
  -d '{"destination":"Paris","startDate":"2026-09-01","endDate":"2026-09-05","travelers":2,"travelType":"casal","budget":"20000","priorities":["cultura"]}'
```

**Esperado após o publish:**

```
HTTP/2 403
{"error":"Esta função foi desativada — sem chamadores; ver RELATORIO-RECON-ARCO5.md"}
```

Enquanto esse `403` não vier da URL de produção, considerar o proxy **aberto**. Nem o commit, nem
o push, nem o diff limpo substituem essa prova.

**Duas pendências ficam registradas:**

- **P-1** — descobrir o ref de produção (herdada do recon §3.2, bloqueia a verificação de qualquer
  mudança em edge function, não só desta).
- **P-2** — rodar o publish do Lovable e o curl acima. Só então 5.b vira ✅.

Vale lembrar o que o recon já dizia: o freio que mais importa contra abuso de proxy Claude é
**teto de gasto no console da Anthropic** — configuração de painel, independente de código e de
deploy. Continua valendo, e continua valendo *antes* de qualquer linha de código.

---

## 6. Estado dos arcos

| Item | Estado |
|---|---|
| 5.a — identidade via JWKS ES256 | provado (commit `4eb95f7`) |
| **5.b — matar o órfão `generate-itinerary`** | **aplicado no repo (`371f45d`); pendente em produção (P-1, P-2)** |
| `feedback-digest` (precedente) | neutralizado em `d7cbd0d` |

**Rascunho `STEP1-ARCO5B.md`:** deletado, conforme protocolo. Nunca entrou em commit.

## Adendo (25/ago, noite) — Arco 5.b FECHADO EM PRODUCAO + manual de deploy descoberto
- Curl pos-publish inicial: 200 (proxy aberto) → DESCOBERTA: o Publish/git-sync do Lovable NAO redeploya edge functions.
- Solucao provada: prompt de redeploy no chat do Lovable ('redeploy X from current repository code, do not modify') → 'Deployed edge functions: generate-itinerary' → curl 403 ✅.
- P-2 fechada. MANUAL DO ARCO 5: toda missao de function (5.c/5.d/5.e) termina com prompt de redeploy no Lovable + curl de prova.
- Ref de producao confirmado: lnhbamzhturwkhcwiohr (P-1 fechada mais cedo).
- Achado colateral: pipeline de build do Lovable roda tsc e acusa os 4 erros baseline do GeneratedItineraryStage (1099,1106-1108) + 2 novos em flight-fallback.test.tsx (imports screen/fireEvent). Site no ar, mas a divida venceu — pagar antes da proxima missao de front.
