# Relatório — fixes seguros de mobile

**Data:** 2026-07-31
**Commit:** `144e54716ed660198c0b1cc5bebc0fd3895f6e53` — `fix(mobile): map touch hijack, agent CTA targets, viewport zoom, safe paddings`
**Push:** `27f9001..144e547  main -> main` — `local == origin/main` ✅
**Origem:** [`AUDITORIA-MOBILE.md`](AUDITORIA-MOBILE.md)
**Escopo:** 6 arquivos, 30 inserções, 13 remoções

## Escopo deliberado

Aplicados apenas os fixes **estruturais//de estilo**. Os achados **comportamentais** da
auditoria — 1 (`navegar_para` não chega ao destino), 2 (`sugerir_destinos` não navega) e
5a (chat `75vh` vs teclado) — foram **excluídos por decisão explícita**: mexem em roteamento e
em contrato de ação do agente, e merecem verificação em dispositivo antes de tocar.
Continuam abertos.

---

## Mudanças

### 1. Achado 3 — mapas sequestravam o scroll vertical

| Arquivo | Linha | Mudança |
|---|---|---|
| `src/components/cockpit/DailyRouteMap.tsx` | `:37-42`, `:334` | novo `IS_TOUCH_DEVICE` + `dragging={!IS_TOUCH_DEVICE}` |
| `src/components/planejar/DestinationWorldMap.tsx` | `:7-11`, `:298` | idem |

```ts
const IS_TOUCH_DEVICE = typeof window !== 'undefined' && 'ontouchstart' in window;
```

Detecção em escopo de módulo, avaliada uma vez. O guard `typeof window !== 'undefined'`
protege contra SSR/pré-render.

**Comportamento resultante:**

| Ambiente | Arrasto | Pinch-zoom | Toque em pino / popup |
|---|---|---|---|
| Desktop (mouse) | ✅ mantido | — | ✅ |
| Touch | ❌ desativado | ✅ mantido (`touchZoom` default) | ✅ |

**Sobre a opção `tap`:** não foi passada, e isso é intencional. O projeto usa **Leaflet 1.9.4**,
e o handler `tap` foi **removido na 1.9.0** — não existe mais em `MapOptions`
(`@types/leaflet` só mantém o resíduo `tapTolerance`). Nessa versão o toque em marcador e
popup funciona por evento de clique nativo, sem prop nenhuma. Passar `tap={true}` seria erro
de tipo e no-op.

**Custo assumido, registrado:** com `dragging` desativado no touch, o usuário mobile não
panora os mapas.

- No `DailyRouteMap` o impacto é nulo — o `FitBounds` (`:106-114`) já enquadra todos os pontos
  da rota; não há conteúdo fora da vista para arrastar.
- No `DestinationWorldMap` o custo é real: é mapa-múndi com drill-down mundo → região → país.
  Sem arrasto, a navegação mobile passa a depender dos chips de região (`:238`) e do toque nos
  pinos. O pinch-zoom segue disponível.

Alternativa descartada nesta rodada (registrada para quando houver teste em dispositivo):
manter `dragging` e aplicar `touch-action: pan-y` no `.leaflet-container` — dedo vertical rola
a página, horizontal panora o mapa. Exige CSS novo e validação em iOS/Android reais.

### 2. Achado 4 (parcial) — alvos dos botões de ação do agente

`src/components/ai/KinuAIMessage.tsx:87` e `:94` — `py-1 text-[11px]` → `py-3 text-[13px]`,
nos dois botões (aplicar e recusar). Resto do estilo intacto.

> ⚠️ **O alvo resultante é ~40px, não 44px.** O CSS gerado confirma que utilitário de fonte
> arbitrário do Tailwind emite **só** `font-size`, sem `line-height`:
>
> ```
> .text-\[13px\]{font-size:13px}
> .py-3{padding-top:.75rem;padding-bottom:.75rem}
> ```
>
> Com `line-height: normal` (≈1,2 × 13 ≈ 15,6px): **12 + 15,6 + 12 ≈ 39,6px**.

Progresso concreto — de **21px para ~40px**, e agora acima do piso WCAG 2.5.8 de 24px —, mas
os 44px do HIG **não** foram alcançados. Fechar a conta custa um token, se for desejado:

| Ajuste | Altura | Nota |
|---|---|---|
| `py-3 leading-5` | **44px exatos** | não altera o tamanho da fonte |
| `py-3.5` | 43,6px | aumenta o padding |

Segue em aberto o restante do achado 4 (fechar chat 34px, limpar conversa 32px, fechar drawer
26px, estrelas de feedback 32px, marcador do mapa — este último tratado no item 3c).

### 3. Extras

**(a) Folga da `BottomNav`** — a nav mede 81px; `pb-20` reservava 80px.

| Arquivo | Linha | Mudança |
|---|---|---|
| `src/pages/Viagens.tsx` | `:1530` | `pb-20` → `pb-24` (lista de viagens) |
| `src/pages/Viagens.tsx` | `:1666` | `pb-20` → `pb-24` (detalhe; `lg:pb-0` preservado) |
| `src/pages/Conta.tsx` | `:92` | `pb-20` → `pb-24` |

De 1px de folga para 15px. Alinha as três páginas com `Dashboard.tsx:110` e `Cla.tsx:233`,
que já usavam `pb-24` — a inconsistência entre páginas irmãs deixa de existir.

**(b) Zoom liberado** — `index.html:5`:

```diff
-<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
+<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

Corrige a falha **WCAG 2.1 SC 1.4.4 (Resize Text, AA)**. Relevante num app com vários
`text-[10px]`/`text-[11px]`.

**(c) Alvo de toque do marcador numerado** — `DailyRouteMap.tsx:57-81`, replicando o
`makeIcon` de `DestinationWorldMap.tsx:126`:

```ts
const DOT = 22;
const touch = Math.max(DOT + 12, 28);   // → 34px
```

O disco verde continua com 22px; o `<div>` externo cria o alvo de **34px**. `iconSize` e
`iconAnchor` acompanham (`[touch, touch]`, `[touch/2, touch/2]`); `popupAnchor` permanece
`[0, -13]` — é relativo ao `iconAnchor`, que segue no centro, então o popup não se desloca.

O ícone do hotel não foi tocado: já tem 34px (`:88`).

---

## Verificação

| Verificação | Comando | Resultado |
|---|---|---|
| Type-check | `npx tsc -p tsconfig.app.json --noEmit` | ✅ OK |
| Testes | `npx vitest run` | ✅ 1/1 |
| Build de produção | `npx vite build` | ✅ built in 25.93s |
| CSS gerado das classes novas | inspeção de `dist/assets/index-*.css` | ✅ conforme (ver item 2) |

O aviso de chunk > 500 kB no build é **pré-existente** e não relacionado a estas mudanças.
O `dist/` gerado foi removido após a checagem (já é git-ignorado).

⚠️ **Nada foi validado em dispositivo real nem em emulador.** Todas as alturas citadas são
derivadas do CSS gerado e dos defaults do browser. O achado 3, em particular, foi corrigido
com base nos defaults documentados do Leaflet — o gesto em si não foi observado num
touchscreen.

---

## Arquivos alterados

```
index.html                                      |  2 +-
src/components/ai/KinuAIMessage.tsx             |  4 ++--
src/components/cockpit/DailyRouteMap.tsx        | 25 ++++++++++++++++++-----
src/components/planejar/DestinationWorldMap.tsx |  6 ++++++
src/pages/Conta.tsx                             |  2 +-
src/pages/Viagens.tsx                           |  4 ++--
6 files changed, 30 insertions(+), 13 deletions(-)
```

## Pendências herdadas da auditoria

- [ ] **Achado 1** — `Viagens.tsx` não lê `?trip=`; `navegar_para` e `criar_viagem` nunca
      entregam o usuário na viagem (maior impacto/custo da lista)
- [ ] **Achado 2** — definir o contrato de `sugerir_destinos`: navegar para `/planejar` ou
      mudar o rótulo "Ver no mapa"
- [ ] **Achado 4** — restante dos alvos < 44px; opcionalmente `leading-5` nos CTAs do agente
- [ ] **Achado 5a** — `75vh` → `75dvh` nos 9 modais/sheets
- [ ] **Achado 5c** — `env(safe-area-inset-*)` para o modo PWA instalado
      (`black-translucent` sem compensação)
- [ ] Menores — `scrollbar-hide` é classe morta; `grid-cols-4` em
      `EnhancedExchangeRates.tsx:279` deixa 67px úteis por célula
