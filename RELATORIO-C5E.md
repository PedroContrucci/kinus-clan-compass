# RELATÓRIO C.5e — roteiro do rascunho em blocos (RoteiroDia)

**Commit:** `125415b` feat (DraftCockpit, RoteiroDia, RoteiroRascunho novo, draftRoteiro novo, teste novo).

## O que mudou
- **"ver ▸" do roteiro no DraftCockpit** → `RoteiroRascunho`: dias empilhados, cada um num `RoteiroDia`.
  Linhas fechadas, um `expandedIds` só e uma rota aberta por vez (o `DailyRouteMap` só monta ao abrir).
- **↻** abre as candidatas de `swapCandidates` dentro do detalhe (`swap-panel`). **🗑 Remover** só em
  passeio e restaurante; voo, hotel e logística nunca (D2). "Regerar roteiro" fica no topo.
- **Saíram do painel (D1):** clima/câmbio, "ORÇAMENTO ESTIMADO", Salvar e "Adicionar atividade".
  O selo do voo também não se repete (D4).
- **`src/lib/draftRoteiro.ts` (puro):** remover, trocar e recalcular as finanças com a lógica do stage
  sem mudança de comportamento. Grava pelo `updateTrip`, o mesmo funil do stage.
- **`RoteiroDia`:** só props opcionais. Sem `onCheck` → sem ☐ e sem "Marcar como fechado";
  sem `onConfirmAnchor`/`onOpenDetails` → sem Confirmar e sem "Mais detalhes"; `onRemove` é novo.
  O Viagens.tsx passa todas: zero mudança na viagem ativa.
- **Intocados:** `GeneratedItineraryStage.tsx`, `SmokeTest.tsx`, `Viagens.tsx` e os intocáveis do CLAUDE.md.

## Comportamento a saber
- Abrir "ver ▸" **não grava mais nada**: o stage recalculava as finanças ao montar. Agora só
  remover/trocar recalcula; regerar já gravava as finanças.
- O café da manhã incluído não tem ↻ (as ações do `roteiroBlocks` só valem para passeio e restaurante).
- A rota só aparece em dia com 2 ou mais paradas (passeio/restaurante).

## Verificação
- `roteiroRascunho.test.tsx`, 5 testes: o painel do cockpit sem ☐ e sem os cards grandes;
  Trocar + Remover e nada de Confirmar no voo; ↻ grava em trip.days; 🗑 recalcula os baldes;
  rota lazy com 1 mapa por vez.
- `roteiroDia.test` 13/13 verde.
- Suíte 59 arquivos, 690 testes passaram, 3 pulados, 1 todo, em 99,8 s (era 90,5 s antes: 1,1×).
- tsc limpo, build ok. eslint limpo nos arquivos novos; DraftCockpit caiu de 4 para 3 problemas
  (todos anteriores a esta missão).
- Nenhuma edge function tocada → sem prompt de redeploy. Publish é do fundador.

## Push
```
To https://github.com/PedroContrucci/kinus-clan-compass
   57e8d64..125415b  main -> main
```
