# CLAUDE.md — regras da casa do KINU (lidas em toda missão)

## Protocolo de missão
1. Toda missão começa com `STEP1-<ARCO>.md` na raiz: **máximo 80 linhas** — achados que mudam o plano, diff proposto, decisões abertas. Não repetir contexto que já está nos relatórios; não varrer o app inteiro salvo missão de diagnóstico declarada. Ler os arquivos que a missão aponta.
2. STEP1 **não é commitado**. Aplicar só após o fundador escrever "APLICAR" no chat (ou quando a missão disser explicitamente "aplicar direto").
3. Implementar → `npx vitest run` (suíte inteira verde) → `npx tsc -p tsconfig.app.json --noEmit` limpo → `npm run build` ok → eslint sem problema novo nos arquivos tocados.
4. `git pull --ff-only origin main` antes de commitar. Commit `feat:`/`fix:`/`docs:` conforme o caso. **Nunca** `--amend` após push, **nunca** `--force`/`--force-with-lease` (o Lovable pusha na main sozinho).
5. Push **sempre** e a saída literal do `git push` vai no relatório. Sem ela, a missão não está fechada.
6. `RELATORIO-<ARCO>.md` em commit `docs:` **separado**: **máximo 60 linhas** + a saída do push. Relatórios já commitados recebem adendos em commit novo, nunca edição.
7. Deletar o STEP1 ao fim. Harness e artefatos temporários em `/tmp`, nunca commitados.
8. Nada de Publish nem deploy: Publish (front) é do fundador pelo botão do Lovable; edge functions sobem por prompt do fundador ao Lovable. O relatório entrega o prompt de redeploy quando houver function tocada (nomear TODOS os arquivos, inclusive `_shared/`).

## Intocáveis (só ADICIONAR, nunca modificar)
`src/data/*` (exceto `src/data/generated/`, que é regenerado por script) · `src/lib/hotelZones.ts` · `src/lib/michelinData.ts` · `src/types/trip.ts` (chave nova em tabela = adição; campo em tipo = proibido — usar campo fora do tipo via index signature do `StoredTrip`, como `curatedHotelId`, `chosenBy`, `activatedEventAt`).

## Convenções técnicas
- Controle de segurança **no corpo da function**; `config.toml` não é superfície confiável.
- `supabase/functions/_shared/*` **sem imports** (permite exercitar no Node) — `catalog.ts` importado por módulo é a exceção provada.
- Service key do kinu-beta **nunca** entra nas functions do Lovable. Leitura anônima de `curated_activities` fica fechada.
- Eventos: `trackEvent` de `src/lib/kinuEvents.ts` (fire-and-forget, nunca lança, dedupe no emissor). Fatos de viagem via `src/lib/tripEvents.ts`. Idempotência por chave natural (marca na viagem / leitura do servidor), nunca pelo dedupe.
- Ids de item do roteiro embutem o id do catálogo: `day-N-<id>`.
- Unicidade de lugar por nome normalizado (`src/lib/placeIdentity.ts`); hotel curado por `src/lib/hotelSwap.ts`.
- Sync banco→app: `scripts/sync-catalog.ts --apply` (todas as 21 cidades sempre; emite `src/data/generated/*` e `supabase/functions/kinu-ai/catalog.ts`). App→banco: `writeback-catalog.ts`.
- Datas: chegada é calculada (`calculateArrivalTime`), nunca assumida.

## Produto (regras que valem em código)
- **Transparência:** toda escolha do KINU pelo usuário mostra por que e como trocar.
- **Integridade do catálogo no agente:** nomes próprios só do catálogo verificado; recorte honesto por região; cidade curada nunca é negada; contexto do app é declarado, nunca atribuído ao usuário; origem nunca inventada.
- **Conquistas premiam viagem vivida, nunca tempo de tela.** Check-in substitui confirmado.
- Nada de ranking entre usuários.

## Referências (ler quando a missão tocar o tema)
Segurança/functions: RELATORIO-RECON-ARCO5.md, RELATORIO-F3-ARCO5C/5D/5E.md · Gerador: RELATORIO-NOREPEAT.md, RELATORIO-VOO-D2.md · Hotéis: RELATORIO-TROCAR-HOTEL.md, RELATORIO-HOTEL-UNIFICADO.md, RELATORIO-HOTEL-TRANSPARENTE.md · Eventos/conquistas: RELATORIO-EVENTOS-VIAGEM.md, DESENHO-CONQUISTAS-v2.md · Catálogo: RELATORIO-SYNC-CATALOGO*.md, RELATORIO-CATALOGO-DEMANDA.md · Roadmap: ROADMAP-v2.md
