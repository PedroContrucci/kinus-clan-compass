# RELATORIO-M7 — Michelin por faixa (C.21)

Commit: `64b97c8` feat(engine): Michelin por faixa (M7 / C.21)

## O que mudou
- `michelinForTier(city, level)` (exportado do engine): Econômico = nenhum; Conforto = só 1★; Luxo = 2–3★.
  Sem queda entre faixas (cidade sem 1★ no Conforto = sem Michelin). Usa a lista inteira, não o top-10.
- Causa raiz de Paris: o filtro 1★ rodava sobre top-10 por estrelas (10× 3★) e o fallback devolvia L'Ambroisie.
- Conforto: Michelin 1★ no **almoço** (13:00, "menu de almoço"), piso R$ 850/pp mantido → R9 intacta.
  Luxo: jantar 2–3★ como antes. Cap de 1 por viagem preservado.
- Catálogo-Michelin (nome/dica): vai para o fim da fila no Econômico e, no Conforto, no jantar acima de 2× o ticket.
  Não some (trava no-repeat do gerador).
- Jantar de chegada: barra só Michelin injetado (nome) e jantar > 2× o ticket; fallback sem teto, nunca Michelin.
  **Decisão do fundador (opção 2):** Septime (R$ 350) segue válido.
- PDF: mesma faixa via `michelinForTier`, até 5, subtítulo indica a faixa; seção omitida se vazia.
- Teste novo `michelinTier.test.ts` (Paris × 3 faixas, Tóquio sem 1★, chegada).

## Fixture `itineraryEngine.before.json` (regravada)
Saem: Sukiyabashi Jiro ⭐⭐⭐ (Tóquio, sem 1★); Cartagena: Muralhas, Passeio de barco, Di Silvio, Convento de la Popa;
Tóquio: Sushi Dai/Senso-ji/Skytree/Zauo/Bills/Kamakura/Yanaka etc. de dias originais; Lisboa: Zé da Mouraria.
Entram: Cartagena Day-trip Islas del Rosario; Lisboa Cervejaria Ramiro (jantar); Tóquio Izakaya em Yurakucho,
Café de l'Ambre. Os demais itens (La Mulata, A Cevicheria, Time Out Market, Hakone, teamLab etc.) só trocaram de
dia/slot por cascata (corrente geográfica e `usedPlaces`). Fortaleza inalterada. (Comparação por id+dia+nome.)

## Verificação
- `npx tsc -p tsconfig.app.json --noEmit`: limpo.
- `npx vitest run`: 67 arquivos, 777 passed | 3 skipped | 1 todo.
- `npm run build`: ok.
- eslint nos 3 arquivos: 31 problemas (baseline 32; nenhum novo — um `as any` meu foi trocado por cast tipado).
- Intocáveis: `michelinData`, `src/data/*`, `types/trip.ts` não tocados.

## Edge functions
Nenhuma tocada; sem redeploy.

## git push (commit de código)
```
To https://github.com/PedroContrucci/kinus-clan-compass
   26e727e..64b97c8  main -> main
```
