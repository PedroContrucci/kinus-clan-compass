# RELATORIO-FONTE — fontes da marca pelo index.html

## Passo 0
- src/index.css:5 tinha `@import url(...)` do Google Fonts DEPOIS dos 3 `@tailwind` (posição inválida; build descarta).
- index.html: sem nenhum `<link>` de fonte.
- Pesos pedidos: Outfit 400;500;600;700 · Plus Jakarta Sans 400;500;600 · display=swap.

## Mudança
Acrescentado em index.html (após o `<link rel="manifest">`):
```
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap">
```
Removida de src/index.css: a linha 5 (`@import url(...)`) + a linha em branco que a seguia (2 deleções, nada mais).
Teste novo: src/test/fontsHead.test.ts (lê index.html; link existe, Outfit, Plus+Jakarta+Sans, display=swap; sem rede).

## Gates
- tsc -p tsconfig.app.json --noEmit: limpo
- vitest run: 86 arquivos, 904 passed | 3 skipped | 1 todo, 0 failed
- npm run build: ok
- grep dist/index.html: os 3 links acima presentes; `@import` no CSS do dist: 0

## Push (código)
```
To https://github.com/PedroContrucci/kinus-clan-compass
   21a5e3c..41729e1  main -> main
```
Sem edge function tocada; sem redeploy. Publish do front é do fundador.

## Push (relatório)
```
To https://github.com/PedroContrucci/kinus-clan-compass
   41729e1..4226750  main -> main
```
