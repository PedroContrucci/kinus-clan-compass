# RELATORIO M6-fix — ícone da cidade garantido

## O que mudou (commit 2999495)
1. `itineraryEngine.ts` ~L906-912: dentro de `byTier`, se `want` tem 'icon' e `iconPlaced` é falso, ícones vêm antes dos essenciais (ordem geral preservada entre eles). Fora do `byTier` nada mudou.
2. Com `force` (último dia de exploração sem ícone), `byTier` fica só com ícones se houver algum. O `force` já valia na manhã (confirmado no diagnóstico); só faltava restringir o tier.
3. Teste novo em `itineraryTiers.test.ts`: Paris 10→15/12, voo 23:00/14:00 → `paris-tour-eiffel-top` em dia de exploração. O teste "≥ 1 ícone" foi mantido.
4. Fixture `itineraryEngine.before.json` regravada via zz-regen temporário (removido). Nenhum assert existente alterado.

## Saem / entram na fixture (ids de catálogo; dia:id)
- Cartagena: troca de dia — ctg-castillo 2→3 e ctg-cidade-murada 3→2.
- Lisboa: saem castelo-sao-jorge(2), jeronimos(3), torre-belem(4), ponto-final(4), oceanario(6), timeout-market(6), gulbenkian(7); entram torre-belem(2), castelo-sao-jorge(3), oceanario(4), timeout-market(4), botanico-tropical(6), ponto-final(6), jeronimos(7). Quase tudo é reordenação; novo de fato: botanico-tropical.
- Tóquio: novos tok3-yadoroku, tok3-teamlab-planets, tok3-yanaka; saem tokyo-akihabara, tokyo-maisen, tok-teamlab-planets (outro id), demais reordenados.
- Fortaleza: sem mudança.

## Verificação
tsc limpo; vitest 770 passed | 3 skipped | 1 todo; build ok; eslint: 2 erros `no-explicit-any` em itineraryEngine.ts:682, já existentes, fora do trecho tocado.

## Push (commit do fix)
```
To https://github.com/PedroContrucci/kinus-clan-compass
   a2705b1..2999495  main -> main
```
