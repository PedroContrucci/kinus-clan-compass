# Relatório — folga dos FABs sobre conteúdo rolável

**Data:** 2026-07-31
**Commit:** `acb724ca374012da5d9019c9d0e0c4767beac0b9` — `fix(mobile): FAB clearance over scrollable content`
**Push:** `03f93fe..acb724c  main -> main` — `local == origin/main` ✅
**Origem:** teste em dispositivo real (último card esbarrando na zona dos FABs)
**Escopo:** 4 arquivos, 5 inserções, 5 remoções

---

## Geometria (mobile, a partir da borda inferior)

| Elemento | Classe | Ocupa | Folga |
|---|---|---|---|
| `BottomNav` | `fixed bottom-0`, 81px | 0 → 81 | — |
| KINU FAB (`ai/KinuAIButton.tsx:15`) | `bottom-24 w-14 h-14` | **96 → 152** | 15px acima da nav |
| Feedback FAB (`shared/FeedbackButton.tsx:134`) | `bottom-44 w-12 h-12` | **176 → 224** | 24px acima do KINU FAB |

Ambos são `right-4` — cobrem só a faixa direita do conteúdo, não a largura toda.

## 1) Padding do conteúdo rolável — `pb-24` → `pb-36` (mobile)

`pb-36` = 9rem = **144px**.

| Arquivo | Linha | De | Para |
|---|---|---|---|
| `src/pages/Dashboard.tsx` | `:110` | `pb-24` | `pb-36 lg:pb-24` |
| `src/pages/Cla.tsx` | `:233` | `pb-24` | `pb-36 lg:pb-24` |
| `src/pages/Conta.tsx` | `:92` | `pb-24` | `pb-36 lg:pb-24` |
| `src/pages/Viagens.tsx` | `:1530` | `pb-24` | `pb-36 lg:pb-24` (lista) |
| `src/pages/Viagens.tsx` | `:1666` | `pb-24 lg:pb-0` | `pb-36 lg:pb-0` (detalhe) |

O `lg:` preserva o comportamento desktop anterior de cada página: as quatro primeiras não
tinham variante e mantêm 96px via `lg:pb-24`; o detalhe de Viagens mantém `lg:pb-0`, já que
no desktop tem container de scroll próprio (`lg:h-screen lg:overflow-y-auto`).

### Cobertura de `pb-36`, registrada

| Reserva | Limpa a nav (81) | Limpa o KINU FAB (→152) | Limpa o Feedback FAB (→224) |
|---|---|---|---|
| **`pb-36` = 144px** (escolhido) | ✅ | ❌ faltam 8px | ❌ |
| `pb-40` = 160px | ✅ | ✅ | ❌ |
| `pb-56` = 224px | ✅ | ✅ | ✅ |

**Decisão registrada (do usuário):** `pb-36` cobre a zona ocupada real (nav 81 + FAB ~56 +
gap ~16 ≈ 150px) e `pb-40` desperdiçaria tela útil no mobile. Os 8px residuais afetam apenas
a faixa `right-4` do último card. Se o teste em dispositivo mostrar que ainda encosta, a
subida para `pb-40` é ajuste de um token.

## 2) Posicionamento dos FABs — nenhuma mudança necessária

Verificado, não alterado. O critério pedido já era atendido:

- KINU FAB já está em `bottom-24`, com 15px de folga sobre a `BottomNav` de 81px.
- Não há sobreposição entre os dois: 152 (topo do KINU FAB) < 176 (base do Feedback FAB).
- O gap de **24px** é consistente por construção: `96 + 56 + 24 = 176` = `bottom-44`.

Nota lateral, sem impacto atual: os z-index divergem — KINU FAB `z-[60]`, Feedback FAB `z-40`,
`BottomNav` `z-50`. Como não há interseção geométrica, não há sintoma. Não mexido.

## Verificação

| Verificação | Resultado |
|---|---|
| `npx tsc -p tsconfig.app.json --noEmit` | ✅ OK |
| `npx vitest run` | ✅ 1/1 |

⚠️ Mudança puramente de espaçamento; **não validada em dispositivo** — as medidas vêm da
escala do Tailwind e das dimensões declaradas nas classes.

## Fora de escopo

`/planejar` **não** renderiza `BottomNav`, mas **recebe os dois FABs** (globais, via
`App.tsx:53-54`). O wizard lá usa `pb-28`/`pb-32`/`pb-48` com rodapés fixos próprios
(`NewPlanningWizard.tsx:216,247`, `FlightSelectionStage.tsx:484,720`,
`GeneratedItineraryStage.tsx:1467,1641`) — padrão diferente do das demais páginas, deixado
intacto para avaliação separada.
