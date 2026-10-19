# RELATÓRIO — B.3.1 (R18 dia da semana · R17 essenciais · lanche · estrada · PDF · Compromissos)

Commit `f0b894a` (feat). Decisões do APLICAR: D1 icon ∪ essential · D2 tag `snack` · D3 "›" · D4 "Preparado para você" · D5 hopMinutes na estrada + fixture regravada.

## O que mudou
- **Sync (R18):** o SELECT lê `days_of_week` e grava `src/data/generated/daysOfWeek.ts` (valores 0..6 validados, rollback junto com os outros 4 artefatos). Hoje só `for-caranguejada-iate: [4]`. A tag `snack` chegou em 5 itens: Santini, 50 Sabores, Momo Gelato, Sorveteria da Ribeira, Portal de los Dulces.
- **Motor:** `pickActivity` (inclusive na repetição forçada) e `swapCandidates` recusam item fora do dia da semana. Essencial (`essentialsOf` = icon ∪ essential, todas as categorias) entra na ordenação logo depois do salto, só em viagem com ≥ 3 dias de exploração. Lanche entra no fim da tarde, como o pôr do sol: `SUNSET_RULE` e `sacrificeRank` 1, reconhecido pelo id.
- **Estrada:** `travelMinutes(km)` é a fonte única para `logisticsLine`, `hopMinutes` e R19. Até 1,2 km a pé, até 15 km táxi, acima de 15 km carro (km + 10 min). Exemplos: 50 km "~1h de carro", 80 km "~1h30 de carro".
- **Validador:** `validateDaysOfWeek` (R18, item fora do dia = FAIL) e `validateEssentials` (R17 WARN/PASS/SKIP). O `SmokeRow` ganha `r17`/`r18`. `validatePlanRules` continua com 4 regras.
- **PDF:** a capa mostra "Voo: São Paulo › Fortaleza" (`cleanText` aceita "›"). Os títulos têm acento: Orçamento total, INFORMAÇÕES ÚTEIS, DOCUMENTAÇÃO, INFORMAÇÕES DE EMERGÊNCIA. O nome só é dividido onde há espaço, `.`, `_` ou `-`. Quando o nome é igual à parte do e-mail antes do @, sai "Preparado para você": `exportTripPDF(trip, name, email)` nos 3 chamadores e prop `exporterEmail` no TripPanel.
- **Compromissos:** voo, hotel, outros e reserva fecham em uma linha (`título · R$ · a confirmar` ou `· ✓ confirmado`) e abrem a origem e as ações. Usam o mesmo `openDays`; os handlers não mudaram.

## Medido
- Fortaleza 10–15/nov: Caranguejada só em 12/nov (quinta). Em 13–15/nov ela não entra. Numa sexta, o ↻ não oferece a Caranguejada.
- Lisboa (gastronomia + cultura): Torre de Belém, Jerónimos, Pastéis de Belém, Castelo e Time Out entram. Santini às 17:40 e 50 Sabores (Fortaleza) às 17:30, ambos em dia com almoço e jantar.
- Smoke com `SMOKE_FULL=1`: R13 **47/61** · R14 12/12 · R15 57/63 · R16 63/63 · R19 504 P / 0 W / 0 F · R18 0 FAIL · R17 26 PASS / **37 WARN**.
- **R13 caiu de 55/61 para 47/61.** É efeito direto da ordem aprovada (essencial antes do interesse): o essencial ocupa slots que antes iam para o interesse. Se o R13 for o piso, a alternativa é essencial só com empate de interesse. Decisão do fundador.
- **R17 WARN 37/63:** o "cabe" mede só horas no dia (o slot não entra). Os ausentes mais comuns são de fim de tarde (sunset, fonte, Shibuya) ou bate-volta (Cumbuco, Beach Park, Escuna, safari), que o motor só aceita como âncora. Lista completa no log do smoke.
- Suíte 2× (as duas com smoke): **679 passed**, 1 skipped, 1 todo, 57 arquivos. tsc limpo. Build ok. ESLint nos arquivos tocados: 123 problemas agora contra 124 antes, nenhum novo.

## Testes
- Novo `src/test/b31.test.ts` (12): R18 real e sintético, ↻, R17 WARN/PASS/SKIP, lanche, estrada.
- Fixture do motor regravada (4 cidades), com adendo B.3.1 no cabeçalho.
- Testes C.4 de Crocobeach e Aprazível agora acham o dia pelo item, não pelo D2.
- C.3a: a regex de logística passou a exigir "~". A dica do catálogo "15 min a pé" (Torre) é dado, não texto fixo.
- razaoLines: Σ = 11254 (era 11004, roteiro novo). A UI testa as linhas colapsadas.

## Registros (fora do escopo)
- O agente (`kinu-ai/catalog.ts`) não conhece o dia da semana: a Caranguejada pode ser sugerida em outro dia.
- Duplicatas de Fortaleza ficam para a esteira. 22 telefones a cadastrar.
- A linha "Preparado para" do PDF não tem teste unitário (jsPDF). Conferir no PDF exportado.
- Campo "Seu nome" na Conta: missão à parte (`auth.updateUser`).
- Nenhuma edge function tocada: sem redeploy. O Publish do front é do fundador.

## Push
```
To https://github.com/PedroContrucci/kinus-clan-compass
   f2069c1..f0b894a  main -> main
```
