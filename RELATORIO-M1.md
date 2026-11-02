# RELATORIO-M1 — "Esqueci a senha" (kinu-beta Auth)

Commit de código: `3074186` — `feat(auth): esqueci a senha + rota /redefinir-senha (M1)`.

## O que mudou
- `src/hooks/useAuth.ts`: `resetPassword(email)` (`resetPasswordForEmail`, `redirectTo` = `origin/redefinir-senha`)
  e `updatePassword(password)` (`updateUser`). Ambas devolvem `{ error }` (as demais lançam) e saem no objeto do hook.
- `src/pages/Login.tsx`: link "Esqueci minha senha" abaixo da senha, só no modo de entrar. Abre formulário inline
  (e-mail pré-preenchido, "Enviar link", "Voltar"). Mensagem sempre igual, com ou sem erro; erro real só no console.
  No modo reset o toggle "Junte-se a nós" fica oculto.
- `src/pages/RedefinirSenha.tsx` (nova): "Nova senha" + "Confirmar nova senha", mínimo 6 (igual ao cadastro) e iguais,
  validados antes de chamar `updatePassword`. Sucesso: "Senha redefinida com sucesso" e `navigate('/inicio')` após 2 s
  (timer limpo no unmount). Erro: mensagem de link expirado/inválido + link para "/".
  `onAuthStateChange` só registra `PASSWORD_RECOVERY` (`console.info`); não bloqueia o formulário.
- `src/App.tsx`: rota pública `/redefinir-senha` ao lado de `/privacidade`, sem guard.
- Intocáveis (`src/data/*`, `hotelZones`, `michelinData`, `types/trip.ts`): não tocados.

## Verificação
- `npx tsc -p tsconfig.app.json --noEmit`: limpo.
- `npx vitest run`: 63 arquivos, 741 passando (3 skipped, 1 todo).
- `npm run build`: ok.
- `eslint` nos 4 arquivos tocados: sem problemas.

## Decisões aceitas
- Novas funções devolvem `{ error }` em vez de lançar (divergem de signIn/signUp/signInWithGoogle).
- Trailer `Co-Authored-By` com o modelo que implementou (Sonnet 5.5); `Claude-Session` mantido.
- Mínimo de senha 6 (ajuste do fundador sobre a proposta de 8).

## Pendências
- **M1b (adiada):** em `/redefinir-senha` aparecem TopNav, botão do agente, feedback e possivelmente o
  `TripAdoptionDialog`, pois hoje só se escondem em "/". O link do e-mail cria sessão (implicit flow).
- Não há teste automatizado para as telas novas; verificação foi estática (tsc/lint/build) + suíte existente.
- Sem edge function tocada: nenhum prompt de redeploy. Sem Publish: fica com o fundador pelo Lovable.
- Painel kinu-beta já tinha Site URL e Redirect URLs corretas (informado na missão, não reverificado).
- Nota de processo: a missão pediu "não escreva RELATORIO"; este relatório foi criado depois, a pedido do fundador.

## Push do commit de código (3074186)
```
To https://github.com/PedroContrucci/kinus-clan-compass
   e637be9..3074186  main -> main
```
