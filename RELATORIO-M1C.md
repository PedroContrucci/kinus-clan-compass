# RELATORIO-M1C — "Alterar senha" dentro da Conta

## Resumo
Seção colapsada "Alterar senha" em `src/pages/Conta.tsx` (único arquivo tocado), usando `updatePassword` de `useAuth` (adicionada na M1). Missão de 1 arquivo, sem STEP1.

## O que mudou
1. Card "Alterar senha", fechado por padrão; abre ao clicar (ícone `KeyRound`, `ChevronDown` que gira). Fica entre os itens do menu e "Sair da Conta".
2. Campos "Nova senha" e "Confirmar nova senha" (`type="password"`, `autoComplete="new-password"`) e botão "Salvar nova senha" com spinner. Estilo reaproveitado do diálogo de exclusão e dos cards do menu.
3. Validação antes de chamar: mínimo 6 caracteres e senhas iguais.
4. Sucesso: "Senha alterada com sucesso" e campos limpos.
5. Erro: "Não foi possível alterar a senha. Tente de novo."; o erro real vai só ao `console.error`.

Mensagens aparecem inline no card (não em toast). Estados novos declarados antes dos early returns (regra dos hooks).

## Verificação
- `npx tsc -p tsconfig.app.json --noEmit`: limpo.
- `npx vitest run`: 64 arquivos, 760 passed | 3 skipped | 1 todo.
- `npm run build` e eslint: não rodados (a missão pediu só tsc e vitest).
- Não testado no navegador.

## Intocáveis
Nenhum arquivo de `src/data/`, `hotelZones.ts`, `michelinData.ts` ou `types/trip.ts` foi tocado. Nenhuma edge function tocada: sem prompt de redeploy.

## Commit da feature
```
To https://github.com/PedroContrucci/kinus-clan-compass
   1f6a1cf..27cd236  main -> main
```

## Push deste relatório
(preenchido abaixo)
