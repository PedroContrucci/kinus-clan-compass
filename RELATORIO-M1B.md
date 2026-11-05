# RELATORIO — M1b: esconder navegação e widgets em /redefinir-senha

**Status:** aplicado e no ar na `main` (commit `be32dc1`). Decisão do fundador: opção A.
Histórico das propostas: `RELATORIO-M1B-PROPOSTAS.md` (mantido sem edição).

## O que mudou
- Novo `src/lib/publicRoutes.ts`: `AUTH_SCREENS = ['/', '/redefinir-senha']` e `isAuthScreen(pathname)`.
- `pathname === '/'` virou `isAuthScreen(pathname)` nos 5 pontos. Só a condição mudou; `isLoginPage` e `onLogin` mantidos.

| Arquivo | O que esconde |
|---|---|
| `src/App.tsx` (`KinuAIWrapper`) | agente KINU AI |
| `src/App.tsx` (`BetaFeedbackWrapper`) | botão de feedback |
| `src/components/shared/TopNav.tsx` | TopNav |
| `src/components/shared/TripAdoptionDialog.tsx` | modal de adoção |
| `src/components/conquistas/AchievementCelebration.tsx` | toast de troféu |

- BottomNav: sem mudança. Cada página o renderiza sozinha e `RedefinirSenha.tsx` não o importa.
- Nenhum arquivo intocável foi tocado. Nenhuma function foi tocada, então não há prompt de redeploy.

## Verificação
- `npx tsc -p tsconfig.app.json --noEmit`: limpo.
- `npx vitest run`: 67 arquivos, 785 passaram, 3 pulados, 1 todo. Nenhum assert alterado.
- eslint nos 5 arquivos: sem problemas.
- Não rodado: `npm run build` (a missão não listou) e checagem visual da rota no navegador.
- Publish (front) continua com o fundador, pelo botão do Lovable.

## Saída do push (commit be32dc1)
```
To https://github.com/PedroContrucci/kinus-clan-compass
   f3b597b..be32dc1  main -> main
```
