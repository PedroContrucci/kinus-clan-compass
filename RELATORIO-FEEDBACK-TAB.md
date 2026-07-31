# Relatório — FeedbackButton: FAB → aba lateral

**Data:** 2026-07-31
**Commit:** `2346549b826cf15cbc7b0a83c4db806f6e87589a` — `fix(mobile): feedback tab instead of FAB + clearance retune`
**Push:** `b7ae1c6..2346549  main -> main` — `local == origin/main` ✅
**Origem:** teste em dispositivo real (FAB de feedback sobrepondo cards)
**Escopo:** 1 arquivo, 8 inserções, 12 remoções

---

## 1) Unificação: aba lateral em todas as larguras

`src/components/shared/FeedbackButton.tsx:131-142`. Os dois botões viraram um.

| | Antes | Depois |
|---|---|---|
| Mobile | FAB redondo `bottom-44 right-4`, 48×48, `lg:hidden` | — removido |
| Desktop | aba vertical `right-0 top-1/2`, `hidden lg:flex` | aba vertical, **`flex`** (todas as larguras) |

Mudanças de fato: `hidden lg:flex` → `flex`; padding `10px 6px` → `12px`; import
`MessageSquare` removido (ficou órfão). Cor âmbar, `rounded-l-lg`, `z-40`, posição e
`aria-label` preservados.

### Área de toque

Em `writing-mode: vertical-rl` o eixo inline é o vertical — quem define a **largura** do
elemento é o padding **horizontal**, não o texto:

```
largura = line-height do text-sm (20px) + 12px + 12px = 44px   ← mínimo do HIG
altura  ≈ "Feedback" (~112px) + 12px + 12px ≈ 136px
```

Antes, com `padding: '10px 6px'`, a largura era `20 + 6 + 6 = 32px`. A aba do desktop também
estava abaixo de 44px, então o fix corrige as duas plataformas.

## 2) Modal de feedback

Intocado. Mesmo `<Dialog>`, mesmos campos, mesmo `handleSubmit` — só mudou o gatilho.

## 3) Retune do `pb-36` — avaliado, **mantido**

Nenhuma mudança de padding neste commit. O racional inverte a premissa da tarefa:

**O Feedback FAB nunca foi a restrição.** Ele ocupava **176 → 224px**, e `pb-36` reserva
**144px** — estava inteiramente *acima* da zona reservada. Conteúdo passava por baixo dele
qualquer que fosse o `pb`; é exatamente por isso que padding nenhum resolveria o card
sobreposto, e a conversão em aba era o fix certo. Removê-lo, portanto, **não libera nada** no
cálculo.

Quem sempre limitou é o **KINU FAB**, cuja geometria não mudou: `bottom-24` (96px) + 56px de
altura → topo em **152px**.

| Reserva | vs. topo do KINU FAB (152px) | Veredito |
|---|---|---|
| `pb-32` = 128px | 24px curto | ❌ regressão |
| **`pb-36` = 144px** | 8px curto | ✅ mantido |
| `pb-40` = 160px | limpa | próximo passo, se necessário |

Sobre a aritmética `nav 81 + FAB 56 = 137 → pb-32`: ela assume o FAB apoiado no topo da nav,
mas ele está em `bottom-24` = 96px, que já embute os 15px de folga sobre a nav de 81px. O topo
real é `96 + 56 = 152px`. Mesmo pelos 137px, `pb-32` (128px) ficaria curto.

Descer para `pb-32` trocaria 8px de déficit por 24px, em troca de 16px verticais de tela. Se
o teste em dispositivo mostrar o último card ainda encostando, o movimento é para `pb-40`.

## Efeito colateral positivo

Com o FAB de feedback extinto, a zona inferior direita fica só com o KINU FAB — some a
concorrência visual entre dois flutuantes empilhados, e a aba lateral não disputa espaço com
a `BottomNav`.

## Verificação

| Verificação | Resultado |
|---|---|
| `npx tsc -p tsconfig.app.json --noEmit` | ✅ OK |
| `npx vitest run` | ✅ 1/1 |
| `grep -rn "bottom-44" src/` | ✅ só a menção no comentário |

⚠️ **Não validado em dispositivo.** As medidas vêm da escala do Tailwind e da semântica de
`writing-mode` — em particular, a largura de 44px depende do `line-height` de 20px do
`text-sm`, que vale conferir no aparelho.

## Pendências relacionadas

- [ ] Confirmar em dispositivo se `pb-36` basta para o KINU FAB (senão → `pb-40`)
- [ ] Demais alvos < 44px do achado 4 da [`AUDITORIA-MOBILE.md`](AUDITORIA-MOBILE.md):
      fechar chat 34px, limpar conversa 32px, fechar drawer 26px, estrelas 32px,
      CTAs do agente ~40px (`leading-5` fecharia em 44px)
