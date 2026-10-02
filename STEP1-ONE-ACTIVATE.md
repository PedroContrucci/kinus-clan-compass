# STEP1 — ONE-ACTIVATE (não commitar)

## Achados que mudam o plano
1. **As edições manuais NÃO chegam ao trip.days.** No GeneratedItineraryStage, remover (:293–298), trocar (:358) e
   adicionar (:815) só fazem `setDays` (estado local). O disco só recebe os dias no Salvar/Ativar (`toTripDays(days)`
   → `onActivate(tripDays, buckets)`). Por isso o Ativar do cockpit precisa de `daysFromStage` hoje: sem ele perderia as
   edições. O item 3 é pré-requisito do item 1, não limpeza.
2. **O Ativar do card pula tudo** (Viagens:1487 → `handleActivateDraft({...selectedTrip})`): sem checagem de voo, sem
   toast, e cai no `generateBasicDays` se não houver dias. O do cockpit (DraftCockpit:534–563) checa voo, faz o toast,
   e grava `outboundFlight: selectedOutbound` — que é `undefined` quando o voo é a estimativa salva? Não: a estimativa
   já está em `trip.outboundFlight` desde o open (applyEstimatedFlights), mas o spread sobrescreve com o estado local.
   O caminho único lê sempre de `trip`, nunca do estado do cockpit.
3. **Já existem 2 emissões de ativação**: handleActivateDraft:1067 e a promoção implícita (:356). `trackTripActivated`
   é idempotente pela marca na viagem (activatedEventAt). O eventWiring.test exige exatamente 2 `trackTripActivated(`
   em Viagens.tsx — fica 2 (função única + promoção implícita) se a função nova morar em Viagens; se morar em lib, o
   teste de fiação muda (ver decisão A).
4. `buildPlaceholderFlight` (DraftCockpit:530–532) inventa voo para drafts com dias e sem voo — continua só como
   critério de checagem? Proposta: removê-lo do caminho de ativação; "voo presente" = `trip.outboundFlight && trip.returnFlight`
   (estimativa conta). Drafts antigos sem voo e sem ser kinu-built recebem "Escolha o voo".

## Diff proposto
- **Novo `src/lib/activateDraft.ts`** (puro): `checkActivation(trip) → { ok } | { ok:false, reason:'no_days'|'no_flight', message }`
  e `activateDraft(id) → { ok, trip } | { ok:false, reason, message }`: relê pelo tripStore, checa, grava
  `{ ...trip, status:'active' }` via `updateTrip` (sem tocar days/finances/voos/hotel; normalizeTrip do store só),
  chama `trackTripActivated(id)` uma vez e a marca de onboarding (`onboardingActivatedAt` + `onboarding.activated`).
  Mensagens: no_days → "Este rascunho não tem roteiro. Toque em “Regerar roteiro” e ative de novo."; no_flight →
  "Escolha os voos de ida e volta antes de ativar."
- **Viagens.tsx**: `handleActivateDraft(tripId)` vira casca: chama `activateDraft`, toast "Viagem ativada! 🚀" ou
  destrutivo com a mensagem, `setSelectedTrip`. Card e cockpit chamam essa casca com o id. **Deletar `generateBasicDays`**
  (~1164–1465) e o ramo "preencher dias".
- **DraftCockpit.tsx**: `handleActivate()` sem argumentos → `onActivate(trip.id)`; remove `generatedDays`/`setGeneratedDays`,
  `daysFromStage`, o toast próprio (passa a ser da casca) e `buildPlaceholderFlight` no caminho de ativação.
  `onDaysGenerated` sai. `handleSave(daysFromStage)` fica como está (fora do escopo) — ver decisão C.
- **GeneratedItineraryStage.tsx**: remover/trocar/adicionar passam a persistir: depois do `setDays`, chamar nova prop
  `onDaysChanged(itineraryToTripDays(next))` → DraftCockpit → `updateTrip(id, t => ({...t, days}))`. Finanças já seguem
  pelo effect de recompute existente. `handleActivateWithFinances` → `onActivate()` sem dias nem buckets.
- **KinuDidCard**: sem mudança (já chama `onActivate()`).

## Testes — novo `src/test/oneActivate.test.ts`
(a) mesmo draft (buildDraftTrip Cartagena) ativado pela casca do card e pela do cockpit → days e finances deep-equal;
(b) `activateDraft` não muda trip.days (deep-equal antes/depois, 4 cidades);
(c) draft com `days: []` → `ok:false, reason:'no_days'`, status continua 'draft';
(d) `trackTripActivated` chamado 1× por ativação; ativar de novo não reemite (marca).
+ ajustar `eventWiring.test.ts` à nova contagem/local.

## Arquivos
Novo: `src/lib/activateDraft.ts`, `src/test/oneActivate.test.ts`. Editados: `src/pages/Viagens.tsx`,
`src/components/cockpit/DraftCockpit.tsx`, `src/components/cockpit/GeneratedItineraryStage.tsx`, `src/test/eventWiring.test.ts`.
Intocáveis não tocados.

## Decisões abertas
A. Função única em `src/lib/activateDraft.ts` (testável sem montar Viagens) e eventWiring passa a checar lá? (recomendo)
B. Draft legado sem voo e não kinu-built: recusar com "Escolha os voos" (proposta) ou manter o voo inventado?
C. Com edições persistindo na hora, o "Salvar" do cockpit também deixa de passar dias — incluir aqui ou próximo passo?
D. Edição grava a cada toque (proposta) — aceitável, ou debounce?
