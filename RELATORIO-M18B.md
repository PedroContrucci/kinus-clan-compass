# RELATORIO-M18B — motor respeita fechamentos sazonais (M18b)

Commits: `c2dc889` data(seasonal) · `6a123c0` feat(engine). Decisões aplicadas: `closedIds?: Record<number, string[]>` (índice da linha), eu preenchi a lista verificada, lacuna do Giverny aceita, parser de intervalo novo sem tocar no `closureOnDate`.

## Dado (commit data, antes do feat)
- `closedIds` em seasonalNotes.ts (só adição; 10 notas): Paris dez/jan (Louvre, Orsay, Versalhes; Giverny "Mês inteiro"), Lisboa e Porto, Roma, Fortaleza dez/jan. Rio/Salvador/Tóquio sem ids.
- **Ambiguidade de dado, resolvida do lado seguro:** Roma dez, linha "25/12 e 26/12" — o Coliseu só fecha em 25/12, mas um id vale para as duas datas da linha → o Coliseu fica fechado também em 26/12 (a mais). Para ficar exato, dividir a linha em duas.
- As linhas de dezembro com "01/01" nunca casam em 01/01 (a data procura a nota de **janeiro**); por isso preenchi as notas de janeiro também.
- **Lacuna aceita:** Giverny só está fechado em dez/jan; nov/fev/mar seguem sem nota → continua agendável nesses meses.

## O que mudou
- `seasonal.ts`: `closedIdsOnDate(cidade, data)` — data, "DD/MM e DD/MM", intervalo "DD/MM a DD/MM" (inclusive, atravessa o ano), "Mês inteiro" (todo o mês). `prefixHasDate` exportado. `closureOnDate` (M18a) intocado — continua casando só as pontas de intervalo (lacuna do aviso de dia mantida).
- `itineraryEngine.ts`: `opensToday`/`opensIdx` também recusam fechamento (um `Map` por dia); o pré-passe seco ignora fechamento, a M19c reserva ícone/essencial/âncora para o dia aberto mais próximo; `swapCandidates` recusa item fechado; `thin('feriado')` quando manhã/tarde fica vazia com item inédito cortado só pelo fechamento (3 pontos, incl. a rede da M19d-fix).
- `itineraryValidator.ts`: **R23 FECHAMENTO SAZONAL** (FAIL, espelho do R18). `smokeMatrix.ts`: `r23` + cenário **"Paris Natal 20–27/12 2+2"** (comfort, culture+family).

## Verificação
- Paris 20–27/12 (família e gastronomia): Louvre/Orsay/Versalhes fora do dia 25; Giverny nunca em dezembro.
- Reserva comprovada: 22–28/12 Versalhes cairia no 25 e foi para o 24; 24/12–02/01 o Louvre cairia no 01/01 e foi para o 31/12.
- Cenário Paris Natal: sem erro, R23 PASS, R18 PASS. R23 FAIL no roteiro forçado com o Louvre no dia 25.
- Integridade do dado: toda chave < `closures.length` e todo id existe no catálogo da cidade (teste).
- **Fixture inalterada** (itineraryEngine.before.json fora do diff; sem nota de novembro).
- tsc limpo · build ok · eslint: os mesmos 2 `any` antigos (itineraryEngine.ts:721, antes :717) · vitest: 81 arquivos; 864 passaram + 1 falha corrigida (abaixo) — nova rodada só dos 3 arquivos afetados (46 passed), a suíte inteira não foi repetida.

## Exceção à regra "nenhum assert existente alterado"
- `m6c.test.ts` filtrava os cenários por `city === 'Paris'` e esperava exatamente 2; o cenário Paris Natal virou o 3º. Mudei **só o seletor** (`&& /^Paris (gastrô|família)/`); o `expect` ficou idêntico.

## Limites e riscos
- Versalhes (bate-volta) só é reservado se `daytripOk` (cota, véspera, dia colado) deixar: em 22–28/12 (gastronomia) o Louvre foi para o 24 e Versalhes não reapareceu.
- `thin('feriado')` implementado, **sem teste dedicado** (não achei roteiro que esvazie um slot só por fechamento).
- Em /smoke (hoje+30 ≈ 09/12) as notas de dezembro passam a valer nas cidades com `closedIds`.
- Edge functions: nenhuma tocada. Publish é do fundador. `/cost`: comando local, rode no prompt.

## Push
data:
```
To https://github.com/PedroContrucci/kinus-clan-compass
   4e09fc5..c2dc889  main -> main
```
feat:
```
To https://github.com/PedroContrucci/kinus-clan-compass
   c2dc889..6a123c0  main -> main
```
