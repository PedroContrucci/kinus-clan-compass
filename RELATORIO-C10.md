# RELATORIO-C10 — Escolha do destino + duas portas de planejar

## O que mudou (feat `16b82ee`)
- **Seletor no fluxo curto.** O `FirstTripFlow` troca a grade das 21 por três passos: continente (chips) → país (lista com nº de cidades) → cidade. As curadas vêm marcadas "✓ curado" e ficam no topo do país. A busca sem acento fica no topo. Tudo vem de `src/lib/destinationPicker.ts`, que é puro e lê só o `DESTINATION_CATALOG` filtrado por `hasCatalog`. **82 cidades / 41 países / 6 regiões**, mais Porto Seguro, que é curada mas não está no catálogo e entra em Brasil › Brasil. A cidade escolhida cai no mesmo `pick`, então o `buildFlowInput` é o mesmo. O Clã (`initialCity`) continua pulando direto para os campos.
- **Duas portas.** `PlanDoors` é o único componente novo. "🧭 Planejar pela interface ▸" abre o fluxo curto e "💬 Planejar com o KINU AI ▸" abre o chat. Aparecem no "➕" e na aba Início sem viagem. Clã e `?guia=1` seguem direto para o fluxo.
- **Porta KINU AI.**
  - `openPlanning()` abre o chat com uma fala **do assistente**, local, sem chamar a function. Nada é atribuído ao usuário.
  - O `criar_viagem` agora monta por `planFromAgent`, que é `buildFlowInput`. Origem = `home_city` do perfil (sem perfil, DEFAULT_ORIGIN). Tier sai do estilo. O teto é `orcamento_total`. As prioridades são o fuzzy ∩ `interestsFor(city)`.
  - O pós-processamento é um só, `finishFlowTrip` em `onboardingFlow.ts`, usado pelo fluxo e pelo agente. Ele aplica envelope, `budgetSource`, crianças, `originSource` e `createdVia`.
  - A viagem abre no rascunho, já com o card "O que o KINU fez".
  - `wizardPrefill` ficou só como fallback de erro.
- **Integridade.** Destino fora da lista do agente vira resposta do assistente, sem toast: "Ainda não cubro X por aqui. As mais próximas do catálogo verificado: A, B, C." Quem escolhe as alternativas é `nearestCatalogCities` (mesmo país → mesma região → curadas). Nenhum rascunho é criado.
- **Testes.** `src/test/c10-destino.test.tsx` tem 11 casos:
  - contagens = catálogo + Porto Seguro;
  - as 21 curadas marcadas;
  - busca sem acento;
  - seletor e busca chegando aos campos;
  - `planFromAgent` ≡ `buildFlowInput`;
  - `criar_viagem` → `buildDraftTrip` (mock) com os campos do fluxo e rascunho gravado;
  - Milão → recusa com Roma, Paris, Lisboa;
  - `openPlanning` é fala do assistente;
  - PlanDoors.

  Em `inicio.test.tsx`, o caso "0 viagens" agora passa pelas portas.
- **Verificação.** Suíte inteira **63 arquivos, 738 ok** (rodada 1×), smoke incluso e inalterado. tsc zero, build ok. ESLint sem problema novo nos arquivos tocados: KinuAIContext caiu de 21 para 19, e os arquivos novos estão limpos.
- **Intocados:** `src/data/*`, hotelZones, michelinData, `types/trip.ts` e todas as edge functions. Não há redeploy. Publish fica com o fundador.

## Pendência D2 — o agente conhece 21 cidades, a interface 82
Pela interface dá para montar Milão. No chat, a lista DESTINOS DISPONÍVEIS da function tem as 21, então o agente responde "chega em breve" e o app recusa oferecendo alternativas. Para fechar, o app passaria a mandar as 82 (`curatedCityNames` + uma lista `catalogCityNames`). A function também precisaria deste texto novo, como regra 10b:

> "10b. PLANEJAR: quando a conversa abrir com a fala 'Bora planejar!', conduza o planejamento perguntando, UMA coisa por vez e só o que faltar: destino, datas, quem vai (adultos/crianças), estilo (Econômico/Conforto/Alto padrão), prioridades e teto de orçamento. Destino vale se estiver em DESTINOS DISPONÍVEIS ou em CATÁLOGO DE DESTINOS; cidades do segundo grupo são montadas pelo catálogo do app, mas NUNCA cite nomes próprios de lugares delas — só as curadas têm lugares verificados. Fora dos dois grupos: diga que ainda não cobre e ofereça as mais próximas, rotuladas como alternativa."

O redeploy exigiria `supabase/functions/kinu-ai/index.ts` e `supabase/functions/kinu-ai/catalog.ts` (e `_shared/*`, se a lista for validada lá), mais o ajuste correspondente no `agentCity` do app.

## Push
```
To https://github.com/PedroContrucci/kinus-clan-compass
   0b784fc..16b82ee  main -> main
```
