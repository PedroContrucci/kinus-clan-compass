# Auditoria mobile — KINU

**Data:** 2026-07-31 · **Escopo:** `src/` + `index.html` · **Viewport de referência:** 390 × 844 (iPhone 14/15)
**Status:** diagnóstico apenas — **nenhuma correção aplicada**, nenhum arquivo de código tocado.

Cinco eixos pedidos: (1) larguras/alturas fixas, (2) alvos de toque < 44px, (3) Leaflet/touch,
(4) `navegar_para`, (5) overflow horizontal.

---

## Veredito rápido

| # | Achado | Eixo | Gravidade |
|---|---|---|---|
| 1 | `navegar_para` nunca chega ao destino — `?trip=` é lido por ninguém | (4) | 🔴 quebra a função |
| 2 | "✓ Ver no mapa" não navega — por construção, não por bug | (4) | 🔴 quebra a promessa do rótulo |
| 3 | Mapas Leaflet sequestram o scroll vertical da página | (3) | 🔴 trecho intransponível |
| 4 | Botões de ação do agente têm ~21px de altura | (2) | 🟠 alvo 2× menor que o mínimo |
| 5 | Chat em `75vh` + `user-scalable=no` — teclado cobre o input | (1) | 🟠 entrada de texto inutilizável |

O eixo (5), overflow horizontal, saiu **essencialmente limpo** — ver
[§6](#6-overflow-horizontal--o-eixo-que-passou).

---

## 1) 🔴 `navegar_para` nunca chega ao destino

O rótulo do botão é **"Abrir"** (`KinuAIMessage.tsx:89`). Ele não abre.

### A cadeia, passo a passo

**Passo 1** — `src/contexts/KinuAIContext.tsx:277-284` valida o destino e publica a intenção:

```ts
if (action.type === 'navegar_para') {
  const destino = String((action.params as any)?.destino ?? '').toLowerCase();
  const valid = ['painel', 'roteiro', 'financeiro', 'preparacao', 'planejar'];
  if (!valid.includes(destino)) { toast.error('Destino de navegação inválido.'); return; }
  setPendingNavigation({ destino, ts: Date.now() });
  setActionStatus(messageId, actionIndex, 'applied');
  setIsOpen(false);   // ← fecha o chat: o usuário vê "Aplicada ✓" e o painel sumir
  return;
}
```

**Passo 2** — `src/App.tsx:28-42` roteia e agenda a limpeza:

```ts
if (tripId) {
  navigate(`/viagens?trip=${tripId}`);
} else if (destino === 'planejar') {
  navigate('/planejar');
} else {
  navigate('/viagens');
}
// Viagens will pick up the tab from pendingNavigation before clearing.
const t = setTimeout(() => clearPendingNavigation(), 300);
```

**Passo 3** — `src/pages/Viagens.tsx:283-290` é quem deveria consumir:

```ts
useEffect(() => {
  if (!pendingNavigation || !selectedTrip) return;   // ← o guard
  const { destino } = pendingNavigation;
  if (destino === 'painel' || destino === 'roteiro' || destino === 'financeiro' || destino === 'preparacao') {
    setActiveTab(destino);
    clearPendingNavigation();
  }
}, [pendingNavigation, selectedTrip, clearPendingNavigation]);
```

### A evidência que fecha o caso

**`Viagens.tsx` nunca lê a query string.** O `?trip=${tripId}` que o `App.tsx:32` monta
não é lido por ninguém:

```
$ grep -n "location.search\|URLSearchParams\|searchParams" src/pages/Viagens.tsx
(nenhum resultado)

$ grep -n "location\." src/pages/Viagens.tsx
(nenhum resultado)
```

`useLocation()` é importado e atribuído (`Viagens.tsx:252`) e **nunca usado**.

E `selectedTrip` só sai de `null` por toque humano. Das 20 chamadas a `setSelectedTrip`,
a única alcançável na chegada à rota é `Viagens.tsx:1562` — o `onClick` do card na lista:

```ts
onClick={() => {
  setSelectedTrip(trip);
  setSelectedDay(1);
  setActiveTab('painel');   // ← e ainda reseta a aba para 'painel'
}}
```

O effect de montagem (`Viagens.tsx:330-344`) carrega `kinu_trips` do localStorage e chama
`setTrips(...)` — **nunca** `setSelectedTrip`.

### Consequência

| Cenário | O que acontece |
|---|---|
| Usuário **sem** viagem aberta pede "abre o financeiro" | Cai na **lista** de viagens. `selectedTrip === null` → guard barra → `pendingNavigation` é descartado em 300ms. Nada acontece. |
| `criar_viagem` (`KinuAIContext.tsx:371`, único caminho que envia `tripId`) | `navigate('/viagens?trip=<id>')` → param ignorado → **sempre** cai na lista, nunca na viagem recém-criada. |
| Usuário **já** com a viagem aberta | Funciona. |

Nota sobre o `setTimeout` de 300ms (`App.tsx:40`): mesmo que o `?trip=` passasse a ser lido,
a janela é frágil — mas **não é ela** a causa raiz aqui. O guard nunca passa, então o timeout
é irrelevante. Corrigir só o timeout não resolveria nada.

**Por que dói mais no mobile:** no desktop (`lg:`) a lista de viagens vira sidebar
(`Viagens.tsx:1527-1529`, `isSidebar`) e a viagem selecionada fica visível ao lado — o usuário
percebe o estado e toca. No mobile é lista **ou** detalhe, tela cheia: fechar o chat e cair na
lista é indistinguível de "o botão não fez nada".

---

## 2) 🔴 "✓ Ver no mapa" não navega — por construção

O botão rotulado **"✓ Ver no mapa"** (`KinuAIMessage.tsx:89`) pertence a `sugerir_destinos`,
não a `navegar_para`. E `sugerir_destinos` **não tem passo de navegação nenhum**:

`src/contexts/KinuAIContext.tsx:395-413`:

```ts
if (action.type === 'sugerir_destinos') {
  ...
  setSuggestedDestinations(valid);
  setActionStatus(messageId, actionIndex, 'applied');
  setMessages(prev => [...prev, {
    ...
    content: `🗺️ Acendi ${valid.join(', ')} no mapa em dourado — vai na aba Planejar e toca na sua escolhida!`,
  }]);
  setIsOpen(false);
  return;
}
```

Não há `setPendingNavigation`. Não há `navigate`. A mensagem de confirmação **instrui o
usuário a navegar manualmente** ("vai na aba Planejar").

O mapa que recebe `suggestedDestinations` é o `DestinationWorldMap`, renderizado em
`/planejar` — outra rota. Ou seja: o botão diz "ver no mapa", marca `Aplicada ✓`, fecha o
chat, e devolve o usuário exatamente à tela onde ele já estava.

**Assimetria mobile.** No mobile o chat é bottom sheet em tela cheia (`KinuAIChat.tsx:70`).
O `setIsOpen(false)` é a única mudança visual perceptível. Sem barra de navegação visível
durante o chat, "vai na aba Planejar" custa: fechar o chat → achar a `BottomNav` → tocar
Planejar → rolar até o mapa. Quatro passos manuais para uma ação anunciada como um toque.

---

## 3) 🔴 Mapas Leaflet sequestram o scroll vertical

`src/components/cockpit/DailyRouteMap.tsx:317-324` — o mapa da rota do dia, embutido no meio
do roteiro rolável:

```tsx
<div className="relative z-0 isolate h-[250px] rounded-xl border border-border/50 overflow-hidden">
  <MapContainer
    center={[points[0].lat, points[0].lng]}
    zoom={13}
    style={{ height: '100%', width: '100%' }}
    zoomControl={false}
    attributionControl={false}
  >
```

**Nenhuma opção de touch é passada.** Os defaults do Leaflet valem: `dragging: true`,
`touchZoom: true`, `tap: true`, `scrollWheelZoom: true`.

Um bloco de 250px × largura total, no meio de uma página vertical. O dedo que começa o swipe
dentro do mapa **panora o mapa** em vez de rolar a página. Como o mapa ocupa 100% da largura,
não sobra corredor lateral para o gesto de scroll passar. No iPhone 14 (844px de altura, ~800
úteis), 250px são **31% da tela** — é bem provável que o polegar caia ali.

Confirmação de que não há mitigação em lugar nenhum:

```
$ grep -rn "touch-action\|touchAction\|gestureHandling" src/
(nenhum resultado)
```

Nem CSS `touch-action`, nem o plugin `leaflet-gesture-handling`. `src/index.css` tem 85 linhas
e nenhuma regra para `.leaflet-container`.

`src/components/planejar/DestinationWorldMap.tsx:288-296` — mesmo problema, mitigação parcial:

```tsx
<div className="h-[300px] lg:h-[380px] rounded-2xl border border-emerald-500/20 overflow-hidden">
  <MapContainer
    center={[15, -10]} zoom={2} minZoom={2} maxZoom={6}
    worldCopyJump
    scrollWheelZoom={false}     // ← resolve a roda do mouse (desktop). Não toca no touch.
```

`scrollWheelZoom={false}` desativa **wheel**, evento de desktop. `dragging` e `touchZoom`
continuam `true`. E aqui o bloco é **300px** — 37% da tela. É a tela de escolher destino, um
dos primeiros passos do funil.

---

## 4) 🟠 Alvos de toque abaixo de 44px

Referência: 44 × 44 pt (Apple HIG) / 48 × 48 dp (Material) / WCAG 2.5.8 AA = 24px mínimo absoluto.

### O pior caso: os botões que executam os achados 1 e 2

`src/components/ai/KinuAIMessage.tsx:84-97`:

```tsx
<button
  type="button"
  onClick={() => applyProposedAction(message.id, idx)}
  className="px-3 py-1 text-[11px] font-semibold rounded-lg bg-emerald-500 text-white ..."
>
  {action.type === 'sugerir_destinos' ? '✓ Ver no mapa' : ...}
</button>
<button
  type="button"
  onClick={() => dismissProposedAction(message.id, idx)}
  className="px-3 py-1 text-[11px] font-semibold rounded-lg bg-[#334155] ..."
>
  ✗ Recusar
</button>
```

Altura calculada: `py-1` = 4px + 4px; `text-[11px]` é utilitário arbitrário do Tailwind e
**não define `line-height`** — cai no `normal` do browser, ≈ 13px para 11px de fonte.

> **4 + 13 + 4 ≈ 21px de altura.** Menos da metade dos 44px, e abaixo até do piso WCAG de 24px.

Agravante: são **dois botões adjacentes** com `gap-2` (8px) — "✓ Aplicar" e "✗ Recusar", ações
opostas e irreversíveis, a 8px um do outro, ambos com 21px de alvo. É a receita para recusar
uma ação que se queria aplicar.

E são os únicos botões da UI de ações do agente: todo o achado 1 e 2 passa por aqui.

### Demais alvos subdimensionados

| Local | Classe / config | Alvo | Papel |
|---|---|---|---|
| `ai/KinuAIChat.tsx:96-101` | `p-2` + `Trash2 size={16}` | **32px** | limpar conversa |
| `ai/KinuAIChat.tsx:102-107` | `p-2` + `X size={18}` | **34px** | fechar o chat |
| `cockpit/ActivityDetailDrawer.tsx:179` | `p-1` + `X size={18}` | **26px** | fechar o drawer |
| `shared/FeedbackButton.tsx:182` | `p-1` + `Star size={24}` | **32px** | 5 estrelas, `gap-1` (4px) entre si |
| `cockpit/DailyRouteMap.tsx:68` | `iconSize: [22, 22]` | **22px** | marcador numerado do mapa |

O marcador de 22px do `DailyRouteMap` merece nota: é o alvo que abre o `<Popup>` com o nome e
horário da atividade (`DailyRouteMap.tsx:340-345`) — a única forma de identificar um ponto no
mapa. 22px é metade do mínimo.

**Contraste justo:** o `DestinationWorldMap` **fez isso certo**. `makeIcon` separa o alvo do
visual:

```ts
function makeIcon(size: number, color: string, glow: string, pulse: boolean) {
  const touch = Math.max(size + 12, 28);   // ← área de toque expandida
  ...
  iconSize: [touch, touch],
```

Pontos de 18/20/22px viram alvos de 30/32/34px. Ainda abaixo de 44, mas há intenção
explícita — e o padrão a replicar no `DailyRouteMap` já existe no próprio repositório.

**Fora de suspeita:** a `BottomNav` (`shared/BottomNav.tsx:31-46`) — `py-2` + ícone
`text-xl` (28px) + rótulo `text-xs` com `mt-1` ≈ **64px de altura**. Correta.

---

## 5) 🟠 Chat em `75vh` + zoom bloqueado

### 5a. O teclado virtual cobre o campo de digitação

`src/components/ai/KinuAIChat.tsx:70`:

```tsx
className={`fixed bottom-0 left-0 right-0 z-[60] max-h-[75vh] bg-[#1E293B] rounded-t-3xl border-t ...`}
```

`vh` no iOS Safari é medido contra o **layout viewport**, que ignora o teclado. Quando o
`<textarea>` (`KinuAIChat.tsx:146-170`) recebe foco — e ele recebe automaticamente, via
`setTimeout(() => inputRef.current?.focus(), 300)` em `:31` — o teclado ocupa ~40% da tela e o
form, ancorado em `bottom-0` do layout viewport, fica **atrás dele**.

Não há mitigação:

```
$ grep -rn "dvh\|svh\|visualViewport" src/ --include="*.tsx" --include="*.css"
src/components/ui/sidebar.tsx:119,185,195,277,278     ← primitivo shadcn não usado no app
```

Zero uso de `dvh`/`svh` em código de aplicação; zero uso da API `visualViewport`. Os outros 8
modais do app compartilham o padrão (`70vh`–`95vh`): `Viagens.tsx:2619`, `FeedbackButton.tsx:151`,
`ItineraryDetailModal.tsx:147`, `ActivityDetailModal.tsx:100`, `AddLuggageModal.tsx:116`,
`ActivityDetailDrawer.tsx:144`, `ReverseAuctionModal.tsx:202,218`.

### 5b. Zoom desativado globalmente

`index.html:5`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
```

`maximum-scale=1.0` + `user-scalable=no` bloqueiam o pinch-zoom. Falha **WCAG 2.1 SC 1.4.4
(Resize Text, AA)**. Num app cheio de `text-[10px]` e `text-[11px]` — os próprios botões do
achado 4 — o zoom é o recurso que resta ao usuário, e ele está desligado.

### 5c. PWA declarada, safe-area ausente

`index.html:10-11` declara modo standalone com barra de status translúcida:

```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

`black-translucent` faz a webview ocupar a área do notch. A compensação seria
`env(safe-area-inset-*)`:

```
$ grep -rn "safe-area\|env(safe" src/ index.html
(nenhum resultado)
```

Nenhuma ocorrência. Instalada na tela de início do iPhone, o cabeçalho fica sob o relógio /
Dynamic Island. (No browser comum o impacto é nulo — o `viewport` não tem `viewport-fit=cover`,
então o Safari já insere as margens. O problema é exclusivo do modo instalado.)

---

## 6) Overflow horizontal — o eixo que passou

Varredura sem achado de gravidade. Registrando o que foi verificado, para não parecer omissão:

| Verificação | Resultado |
|---|---|
| `<table>` / `<Table>` em telas | **Nenhuma.** Só `components/ui/table.tsx`, primitivo shadcn com **zero consumidores** |
| `w-screen` / `100vw` | **Nenhuma ocorrência** |
| Larguras fixas em `px` que estourem 390px | **Nenhuma.** As 35 ocorrências de `w-[…px]`/`min-w-[…px]` são todas ≤ 200px (chips 50–100px, tooltips ≤ 220px) |
| 18 linhas roláveis horizontais | Todas com `overflow-x-auto`; 9 usam o padrão correto de sangria `-mx-4 px-4` |
| `grid-cols-*` sem prefixo responsivo | Só 2 casos (abaixo) |

### Ressalvas menores encontradas no caminho

**`scrollbar-hide` não existe.** Usada em 15 componentes; não está em `src/index.css` (85
linhas, verificadas na íntegra) e `tailwind.config.ts` carrega só `tailwindcss-animate` — não
`tailwind-scrollbar-hide`. É uma classe morta. Impacto real ≈ zero no mobile (scrollbars de
toque já são overlay); é ruído visual no desktop.

**`grid-cols-4` fixo em `cockpit/EnhancedExchangeRates.tsx:279`.** A 390px:
390 − 32 (`px-4` da página) = 358; menos `gap-2` × 3 = 24 → 83px por célula; menos `p-2` → **67px
úteis**. Cabe `R$ 5.43`; **não** cabe um valor de 4+ dígitos (`R$ 1234.56` ≈ 75px). Risco
condicional ao par de moedas, não quebra garantida. O outro caso, `LuggageVisualization.tsx:109`,
é grade de ícones — sem texto, sem risco.

**`pb-20` vs `BottomNav` de 81px.** A nav mede `py-2`(16) + botão 64 + borda 1 = **81px**.
`Viagens.tsx:1530` e `:1666` e `Conta.tsx:92` reservam `pb-20` = **80px** → 1px de folga, o
último elemento encosta na barra. `Dashboard.tsx:110` e `Cla.tsx:233` usam `pb-24` (96px) e
ficam corretos. Inconsistência de 4 unidades entre páginas irmãs.

---

## Limites desta auditoria

- **Análise estática.** Nada foi executado num dispositivo ou emulador; as medidas de altura
  são derivadas das classes Tailwind e dos defaults do browser, não de `getBoundingClientRect`.
  Os cálculos estão explicitados para serem conferidos.
- **O achado 3 não foi reproduzido num touchscreen.** Está fundamentado nos defaults
  documentados do Leaflet (`dragging`/`touchZoom`/`tap` = `true`) e na ausência comprovada de
  qualquer mitigação no repositório — não na observação do gesto.
- Os achados 1 e 2, em contrapartida, são **verificáveis só por leitura**: `?trip=` não ter
  leitor e `sugerir_destinos` não chamar `setPendingNavigation` são fatos do código, não
  inferências.
- Não auditados: performance (bundle, LCP), contraste de cores, leitores de tela, orientação
  landscape.

## Ordem sugerida de correção

Nenhuma correção foi aplicada. Se for para atacar, esta é a ordem por relação impacto/custo:

1. **Achado 1** — ler `?trip=` em `Viagens.tsx` e selecionar a viagem antes do guard. Destrava
   também o `criar_viagem`, que hoje nunca entrega o usuário na viagem criada.
2. **Achado 4** — trocar `py-1 text-[11px]` por algo ≥ 44px em `KinuAIMessage.tsx:84-97`. Uma
   linha, e é o gargalo por onde passam os achados 1 e 2.
3. **Achado 3** — `dragging={false}` ou `leaflet-gesture-handling` nos dois `MapContainer`.
4. **Achado 2** — decidir o contrato: ou `sugerir_destinos` navega para `/planejar`, ou o rótulo
   deixa de prometer "Ver no mapa".
5. **Achado 5** — `75vh` → `75dvh` e remover `maximum-scale`/`user-scalable` do `index.html`.
