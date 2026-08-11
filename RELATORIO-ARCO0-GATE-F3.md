# Relatório — Arco 0: Gate de entrada da F3 (A Fábrica)
**Data:** 09-10/ago/2026
**Status:** ✅ FECHADO — gate aprovado, F3 autorizada a começar no Arco 1 (tripStore)

## O que o Arco 0 verificou e entregou

| Item | Resultado |
|---|---|
| Working tree | Limpo — housekeeping commitado (2043b9e: 5 relatórios de segurança, writeback-catalog.ts, .gitignore, package.json) |
| Commits do Lovable | 7 commits integrados via `git pull --rebase` (remoção do botão digest + correções de import) |
| Sincronização | Local = origin/main (push 9ae79aa) |
| Merge fix/rio-catalog-shadowing | **Já estava na main** — feito em sessão anterior; doc de retomada estava desatualizado. Confirmado: 39220a6 na história, .js fóssil inexistente no tree |
| Sync + Publish Lovable | Executados |
| Prova dos nove — sonda catálogo Rio | ✅ 16 jantares, turma nova, Ferro e Farinha presente |
| Prova dos nove — troféu pizza | ✅ Ferro e Farinha no topo com veredito do catálogo |
| Prova dos nove — /smoke | ✅ 319/320 (1 WARN intencional Rio R8) |

## Interlúdio (mesma janela): bugs da /cla
Entre o gate e o Arco 1, feedbacks do beta renderam a cadeia fotos-/cla — hardcode
Porto/Tailândia no modal, cover morto do Salvador, capa alpina, capoeira no Pelourinho
e blindagem onError. Documentado em relatórios próprios:
RELATORIO-DIAGNOSTICO-FOTOS-CLA.md · RELATORIO-PATCH-FOTOS-CLA.md ·
RELATORIO-DIAGNOSTICO-COVER-SALVADOR.md · RELATORIO-CANDIDATAS-SALVADOR.md ·
RELATORIO-PATCH-ONERROR-COVERS.md

## Lições novas gravadas no contrato operacional
1. **O Lovable pusha na main sozinho** (migrations, correções). Todo início de sessão
   Git começa com `git fetch origin && git status` antes de qualquer trabalho.
2. **STEP 1 REPORT vira arquivo .md na raiz** (STEP1-*.md, não commitado, deletado após
   APLICAR) — print de terminal não é protocolo de transferência.
3. **`git config --global core.pager cat`** aplicado no Codespace — saída de git nunca
   mais presa no pager.
4. **Rótulo não é verificação:** destinationPdfData.ts desclassificado como fonte
   confiável de mídia (URL morta + URL viva com conteúdo trocado). Busca do Unsplash
   devolve erro geográfico no topo do ranking (Paraty em 1º para "Pelourinho").
   Automação de mídia sem arbitragem visual humana repete o erro da capa alpina.
5. **Devcontainer já existe e funciona**; a peça que faltava era o secret
   ANTHROPIC_API_KEY nos Codespaces Secrets — configurado em 10/ago. Novela da
   reinstalação encerrada.

## Backlog alimentado nesta janela
- Feedback beta #2: Top Roteiros navegam para /planejar sem parâmetro (causa já
  localizada: Cla.tsx:436)
- Feedback beta #3: mapa não renderiza após decisão no chat (precisa repro)
- Feedback beta #4: datas não propagam para busca de voos
- Correção B: 48 cidades sem chave em DESTINATION_PHOTO_HINTS
- Auditoria de mídia estática: URLs mortas + conteúdo trocado (checar conteúdo, não
  só HTTP)
- Teste automatizado do fallback onError (lacuna declarada)
- Avisos Radix (DialogTitle/Description) na /cla — cosmético/acessibilidade

## Próximo passo
**Arco 1 — src/lib/tripStore.ts:** funil único de leitura/escrita de trips sobre
localStorage, sem banco ainda. Saída verificável: app idêntico, /smoke limpo.