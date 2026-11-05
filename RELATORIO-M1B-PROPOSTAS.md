# RELATORIO — M1b (propostas): esconder navegação e widgets em /redefinir-senha

**Status:** parado antes de editar. Nada alterado, nada commitado. A missão previa parar se o grep achasse mais de 4 pontos, e achou 5.

## Achados (grep, sem edição)

| # | Arquivo | Linha | Condição atual | O que esconde |
|---|---|---|---|---|
| 1 | `src/App.tsx` (`KinuAIWrapper`) | 96 | `pathname === "/"` → `null` | agente KINU AI (botão + chat) |
| 2 | `src/App.tsx` (`BetaFeedbackWrapper`) | 107 | `pathname === "/"` → `null` | botão flutuante de feedback |
| 3 | `src/components/shared/TopNav.tsx` | 13 | `isLoginPage = pathname === '/'` | TopNav |
| 4 | `src/components/shared/TripAdoptionDialog.tsx` | 46 | `pathname === '/'` → `null` | modal de adoção de viagem |
| 5 | `src/components/conquistas/AchievementCelebration.tsx` | 20 | `onLogin = pathname === '/'` | toast de troféu |

- Não existe lista ou constante compartilhada. Cada ponto repete a comparação.
- **BottomNav** não é excluído por rota. Cada página o renderiza sozinha (`Viagens`, `Cla`, `Inicio`, `Conta`). `RedefinirSenha.tsx` não o importa nem importa o TopNav (grep vazio). O BottomNav não deve aparecer nessa rota por esse caminho.
- Os pontos 4 e 5 têm comentário "mesma regra do KinuAIWrapper". Sem eles, modal ou toast podem aparecer por cima de `/redefinir-senha`.

## Propostas

**A (recomendada):** criar `src/lib/publicRoutes.ts` com `isAuthScreen(pathname)`, que retorna true para `/` e `/redefinir-senha`. Usar nos 5 pontos.
- Prós: uma só fonte da regra, e a próxima rota pública entra em um lugar só.
- Contras: 1 arquivo novo e 5 editados.
- Nenhum arquivo intocável é tocado.

**B:** acrescentar `|| pathname === '/redefinir-senha'` nos 5 pontos.
- Prós: menor diff e nenhum arquivo novo.
- Contras: a lógica fica duplicada em 5 lugares, e um sexto ponto esquecido vira bug.

**C:** só os pontos 1–3 (agente, feedback, TopNav).
- Prós: segue a letra da missão.
- Contras: deixa o modal de adoção e o toast de conquista aparecerem sobre a tela de redefinição.

## Decisões abertas
1. Escolher A, B ou C.
2. Confirmar que o BottomNav não precisa de tratamento. O grep indica que não.

## Plano de execução (após a escolha)
`npx tsc -p tsconfig.app.json --noEmit` → `npx vitest run` (esperado 785 verdes) → eslint nos arquivos tocados → `git pull --ff-only origin main` → commit `feat(auth): esconde navegação e widgets em /redefinir-senha (M1b)` → `git push`, com a saída literal colada aqui.

## Saída do push
Não se aplica: nenhum commit ou push foi feito, então a missão segue aberta.
