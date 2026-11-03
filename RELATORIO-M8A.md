# RELATORIO-M8A — PDF apresentável (parte a)

## O que entrou (commit 55d868d)
- `src/lib/pdfText.ts` (novo, puro, sem imports): `pdfSafe`, `cuisinePt`, `localizeCuisineTip`, `plural`, `stopsLabel`, `baggageLabel`, `packingClimate`, `monthOf`.
- `tripPdfExport.ts` (patch cirúrgico):
  - (a)(b) wrapper único em `doc.text`/`splitTextToSize`/`textWithLink`/`getTextWidth` passando por `pdfSafe` (NFC, ⭐→`*`, seta→`>`, emoji removido); linha de rota também sanitizada antes do corte de 20 chars.
  - (c) mala por clima: frio = norte nov–mar / sul jun–ago (país via `findCityInfo`, só leitura); roupa de banho/chinelo/canga só em `BEACH_CITIES` (lista da decisão); guarda-chuva fica. Mês lido de `YYYY-MM` sem `Date`/UTC.
  - (d) culinária: página Michelin usa `cuisinePt`; dica "Cozinha French" → "Cozinha Francesa" na narrativa do dia. Fallback = valor original.
  - (e) "1 viajante / 2 viajantes".
  - (f) hero de voo: "direto" / "1 escala (XXX)" / "escala a confirmar" + "bagagem a confirmar" (nenhum tipo de voo tem franquia; o helper lê `option.baggage` se um dia existir). Linha "Voo ida e volta" do resumo também ganhou a escala.
  - Acentos restaurados só em: mala/checklist, hero ("duração a confirmar"), títulos "FRASES ÚTEIS" e "EMERGÊNCIA".
- Intocados: `src/data/*`, `hotelZones.ts`, `michelinData.ts`, `types/trip.ts`.

## Ficou para M8b
- (g) fonte maior (~+2 pt).
- Acentos nos demais literais do arquivo (~150).
- Bagagem real (depende de dado de franquia na fonte do voo).

## Testes
- Novo `src/test/pdfText.test.ts` (12 testes, incl. jsPDF real: `Tj` legível em 8 bits, sem "R o t a").
- 1 iteração vermelha: meu próprio teste esperava `•` preservado e o helper o trocava por `·`; removi a troca desnecessária do helper (nenhum assert alterado).
- `cockpitCard.test.tsx`: nenhum assert mudou.
- vitest: 65 arquivos, 769 passam (3 skipped, 1 todo). tsc limpo. build ok. eslint: sem problema novo (tripPdfExport 30 → 30, baseline).
- Sem edge function tocada → sem prompt de redeploy.

## git push
```
To https://github.com/PedroContrucci/kinus-clan-compass
   4f74ed5..55d868d  main -> main
```
