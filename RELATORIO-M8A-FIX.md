# RELATORIO M8a-fix + diagnóstico M6 (Paris)

## Parte 1 — culinária em PT na dica por atividade (commit 87281d7)
- Causa: `draftItinerary.ts:85` converte `tips[0]` em `description`; o PDF imprime a descrição
  (`tripPdfExport.ts`, linha de descrição) sem passar por `localizeCuisineTip`. O ponto da narrativa (L540) já localizava.
- Fix: `tripPdfExport.ts:1369` → `cleanText(localizeCuisineTip(String(act.description || '')))`.
- Teste: 2 asserções novas em `src/test/pdfText.test.ts` (só a função; PDF real não foi gerado).
- Engine e dados intocados.
- Verificação: vitest 769 passed | 3 skipped | 1 todo; tsc limpo. Build e eslint não rodados.

## Parte 2 — por que `paris-tour-eiffel-top` não entrou (sem correção)
Parâmetros: 2026-12-10→12-15, SP, 2 viajantes, gastronomia+cultura, midrange, MODERADO, voo 23:00/14:00.
- Dias de exploração 3–5: Louvre; Sainte-Chapelle + Sena; Montmartre + Champs-Élysées. Eiffel fora.
- Eiffel não foi filtrado: elegível, fresco, `fits=true` e dentro de `byTier` nas manhãs.
- `force` disparou no dia 5 (último de exploração), sem efeito.
- Causa (`itineraryEngine.ts:906-910`): `byTier` mantém a ordem do sort geral e `candidates[0]` vence.
  Eiffel ficou em 6º/5º/4º no `byTier` (dias 3/4/5), atrás de Louvre, Sainte-Chapelle, Orsay, Montmartre, Notre-Dame.
- `itineraryEngine.ts:807`: nos 3 primeiros dias `want` = icon+essential; `force` só relaxa `hopKey`, não restringe a `icon`.
- Dia 5 tarde: `want`=icon e `force`=true, mas Eiffel é `category: 'morning'` → inelegível, `byTier` vazio.
  A última chance real foi a manhã do dia 5 (Montmartre ganhou).
- Sugestão (missão própria): com `force`, restringir `byTier` ao tier `icon` se houver algum.
- Instrumentação e teste temporário removidos.

## Push
```
To https://github.com/PedroContrucci/kinus-clan-compass
   f7b1a27..87281d7  main -> main
```
