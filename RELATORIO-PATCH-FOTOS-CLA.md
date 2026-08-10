# Relatório de Patch — Fotos hardcoded no ItineraryDetailModal

**Data:** 2026-08-10
**Missão:** Correção A / Opção mínima do diagnóstico das fotos erradas na `/cla`.
**Arquivos alterados:** 1 (`src/components/community/ItineraryDetailModal.tsx`) — 10 inserções, 7 remoções.

---

## 1. O bug corrigido

O carrossel de fotos do modal de roteiro era um array literal: apenas a primeira foto
derivava do roteiro; a 2ª e a 3ª eram **constantes fixas, idênticas para todos os
roteiros do app**.

A 3ª foto (`photo-1555881400-74d7acaacd8b`) é, comprovadamente, a foto de capa do
**Porto** catalogada no próprio repositório em `src/data/destinationPdfData.ts:478`. Era
a causa direta do sintoma relatado pelo tester ao abrir o roteiro do Japão.

---

## 2. O que mudou

### 2.1 Array de fotos derivado do roteiro (causa raiz)

As duas URLs hardcoded foram removidas. `photos` agora deriva exclusivamente de
`itinerary.cover_image_url`, com fallback garantido para nunca produzir array vazio.

### 2.2 Reset do índice ao trocar de roteiro

`currentPhotoIndex` não era resetado entre roteiros. Com o array de tamanho 3 constante o
problema ficava mascarado; com tamanho variável, viraria índice fora de range. Adicionado
`useEffect` que zera o índice quando `itinerary?.id` muda.

**Nota de implementação:** o `useEffect` foi posicionado **antes** do
`if (!itinerary) return null;` (linha 101), junto ao `useMemo` já existente. Colocá-lo
depois do early return violaria as regras de hooks do React — chamada condicional de
hook, erro em runtime. Por isso a dependência usa `itinerary?.id` com optional chaining.

### 2.3 O que deliberadamente NÃO mudou

- As guardas `photos.length > 1` (hero e lightbox) — intocadas, conforme escopo.
- `nextPhoto` / `prevPhoto`, os dots de navegação e o lightbox `showFullGallery`.
- Nenhum outro arquivo. `src/data/`, `src/lib/hotelZones.ts`, `src/lib/michelinData.ts`
  e `src/types/trip.ts` não foram tocados.

---

## 3. Diff aplicado

```diff
--- a/src/components/community/ItineraryDetailModal.tsx
+++ b/src/components/community/ItineraryDetailModal.tsx
@@ -1,5 +1,5 @@
 // Itinerary Detail Modal — Full itinerary with day breakdown, budget, comments
-import { useState, useMemo } from 'react';
+import { useEffect, useState, useMemo } from 'react';

@@ -77,7 +77,10 @@ const budgetBreakdown = {
   alimentacao: 0.12,
 };

-export const ItineraryDetailModal = ({
+/** Último recurso quando o roteiro não tem cover_image_url. */
+const FALLBACK_PHOTO = 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200';
+
+export const ItineraryDetailModal = ({
   itinerary,
   activities = [],

@@ -95,6 +98,9 @@ export const ItineraryDetailModal = ({
     [itinerary?.duration_days]
   );

+  // Roteiros diferentes têm galerias de tamanhos diferentes: zera o índice ao trocar.
+  useEffect(() => { setCurrentPhotoIndex(0); }, [itinerary?.id]);
+
   if (!itinerary) return null;

@@ -105,11 +111,8 @@ export const ItineraryDetailModal = ({
   ];

-  const photos = [
-    itinerary.cover_image_url || 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200',
-    'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200',
-    'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200',
-  ];
+  const coverPhotos = [itinerary.cover_image_url].filter(Boolean) as string[];
+  const photos = coverPhotos.length > 0 ? coverPhotos : [FALLBACK_PHOTO];
```

Alteração incidental: o whitespace à direita na assinatura `ItineraryDetailModal = ({ `
foi removido pelo editor. Cosmético, sem efeito.

---

## 4. Resultado dos testes

| Verificação | Comando | Resultado |
|---|---|---|
| Testes | `npx vitest run` | ✅ 2 arquivos, 6 testes, todos passando (12.56s) |
| Typecheck | `npx tsc --noEmit -p tsconfig.app.json` | ✅ exit 0, zero erros |
| Build | `npx vite build` | ✅ built in 23.81s, exit 0 |

```
 ✓ src/test/flight-fallback.test.tsx (5 tests) 756ms
 ✓ src/test/example.test.ts (1 test) 3ms

 Test Files  2 passed (2)
      Tests  6 passed (6)
```

⚠️ **A suíte de testes não cobre este componente.** Os 6 testes existentes são de
`flight-fallback` e um `example.test.ts`. O verde acima significa "não quebrei nada que
já era testado" — **não** é validação do comportamento corrigido. A validação real do
patch é o typecheck + build limpos e a verificação visual manual descrita abaixo.

---

## 5. Verificação manual pendente (recomendada antes de considerar fechado)

1. Abrir `/cla` → seção "📍 Roteiros Completos" → clicar num roteiro.
2. Confirmar que **não** aparecem mais as fotos de Porto/praia no carrossel.
3. Confirmar que setas e dots sumiram (esperado — ver §6).
4. Abrir um roteiro, fechar, abrir outro: confirmar que a foto exibida é a do roteiro
   correto (regressão do índice obsoleto).
5. Abrir um roteiro **sem** `cover_image_url`: deve exibir a foto de fallback, sem
   imagem quebrada.

---

## 6. Efeitos colaterais conhecidos

**O carrossel deixa de existir na prática.** Com apenas `cover_image_url`, `photos` tem
sempre tamanho 1, então `photos.length > 1` é sempre falso: setas, dots e as funções
`nextPhoto`/`prevPhoto` viram código morto. Isso é a correção funcionando — as fotos 2 e 3
eram justamente as erradas — mas é uma **mudança de produto** que vale alinhar com
design. O código do carrossel foi mantido intacto e volta a funcionar sozinho no dia em
que a tabela de roteiros ganhar um campo de galeria real.

**O fallback é uma foto do Japão.** `FALLBACK_PHOTO` é a mesma constante que já era o
fallback original, preservando o comportamento atual conforme especificado. Porém ela
está catalogada como `'kyoto'` em `src/data/destinationPdfData.ts:605` — ou seja,
roteiros sem `cover_image_url` continuam exibindo uma foto do Japão independentemente do
destino. Resíduo menor do bug original, fora do escopo desta correção.

---

## 7. Pendências não endereçadas (do diagnóstico original)

Continuam abertas, por estarem fora do escopo fechado desta missão:

1. **Lacuna em `DESTINATION_PHOTO_HINTS`** — 48 das 82 cidades do catálogo não têm chave,
   incluindo Phuket, Porto, Kyoto e Osaka. Roteiros nesses destinos caem numa busca
   textual solta no Unsplash, com resultado imprevisível. Afeta o thumbnail do
   `ItineraryCard`, não o modal.
2. **`ItineraryCard.tsx:35`** usa `city || country`, então roteiros de nível país
   (ex.: `'Japão'`) não encontram hint — o mapa é indexado só por cidade.
3. **`Cla.tsx:436`** — todos os cards de "Top Roteiros Curados" navegam para
   `/planejar` sem parâmetro, ignorando o destino clicado.

---

## 8. Commit

```
fix(cla): fotos do modal de roteiro derivadas do proprio roteiro (remove hardcode Porto/Phuket)
```

Branch: `main` · push para `origin main`.
