# Relatório — Patch `onError` nas capas de roteiro (blindagem contra URL morta)

**Data:** 2026-08-10
**Commit:** `2ede66b` — *fix(cla): onError fallback em covers de roteiro (blindagem contra URL morta)*
**Push:** `6299565..2ede66b  main -> main` ✅
**Base:** "Correção secundária" do `RELATORIO-DIAGNOSTICO-COVER-SALVADOR.md` + item 7 do `RELATORIO-CANDIDATAS-SALVADOR.md`

---

## TL;DR

Aplicado nos 3 pontos combinados, 2 arquivos, **+23/−2 linhas**. `tsc --noEmit`, `vitest run`
e `vite build` passaram os três. Commitado e no ar.

A partir de agora, capa que responde 404 vira imagem de fallback (no modal) ou o gradiente
com emoji (no card) — em vez do hero preto com alt text que originou o chamado.

**Limite:** isto cobre URL **morta**, não URL **errada**. Ver §5.

---

## 1. O que mudou

### `src/components/community/ItineraryDetailModal.tsx` (+17/−1)

Handler compartilhado, em escopo de módulo, logo abaixo do `FALLBACK_PHOTO` que já existia:

```tsx
/**
 * Troca a foto pelo fallback quando a URL está morta (404, host fora do ar).
 * O flag em dataset impede loop se o próprio fallback falhar: o React religa o
 * onError a cada render, então zerar img.onerror sozinho não seguraria o retry.
 */
const handlePhotoError = (e: SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  if (img.dataset.fallbackApplied) return;
  img.dataset.fallbackApplied = 'true';
  img.onerror = null;
  img.src = FALLBACK_PHOTO;
};
```

Ligado nos dois `<img>` do escopo — hero (`onError={handlePhotoError}` na `<motion.img>`) e
lightbox. O import passou a trazer `type SyntheticEvent`.

O terceiro `<img>` do arquivo (linha ~330, avatares dos comentários mock) **não foi tocado**:
estava fora do escopo.

### `src/components/community/ItineraryCard.tsx` (+8/−1)

Sem constante nova de foto. A falha derruba o card no fallback gradiente+emoji que o
`useDestinationPhoto` já entrega:

```tsx
  // URL viva não garante imagem viva: se a foto quebrar, cai no gradiente abaixo.
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => { setImageFailed(false); }, [finalImageUrl]);
```

```tsx
        {finalImageUrl && !imageFailed ? (
          <img
            ...
            onError={() => setImageFailed(true)}
          />
        ) : (
```

Justificativa completa da escolha: §3.

---

## 2. A guarda anti-loop — por que não foi só `onerror = null`

O escopo pediu `e.currentTarget.onerror = null` "ou equivalente". Foi implementado o
equivalente, e a razão importa: **`onerror = null` sozinho não seguraria o retry.**

Ele limpa apenas o handler DOM inline. O `onError` do JSX é registrado pelo sistema de
eventos sintéticos do React, que reanexa o listener a cada render — se o próprio
`FALLBACK_PHOTO` morresse, o ciclo recomeçaria.

A guarda efetiva é o flag idempotente em `dataset`: uma vez marcado, o segundo `onError`
retorna antes de tocar em `src`. O `onerror = null` ficou junto — inofensivo, e cobre o caso
de existir handler inline.

No `ItineraryCard` a questão nem se coloca: o fallback é CSS, não faz requisição, não pode
falhar. É um dos motivos da escolha da §3.

---

## 3. Por que o card não usa `FALLBACK_PHOTO`

O escopo deixava em aberto: constante local nova ou o fallback do hook. Ficou o **gradiente
+ emoji do `useDestinationPhoto`**, por quatro razões:

1. **O caminho já existia.** O branch `else` é o que o card renderiza hoje quando não há
   foto — estilizado e consistente. Fazer a falha de rede cair no mesmo estado reusa uma
   decisão de design já tomada, em vez de criar um segundo tipo de "sem foto".
2. **Evita a terceira cópia da URL.** Uma constante local repetiria
   `photo-1493976040374-85c8e12f0c0e` num terceiro lugar do repo — a mesma classe de
   hardcode que o `fcdbf96` removeu deste par de arquivos, e que o
   `RELATORIO-DIAGNOSTICO-COVER-SALVADOR.md` §6 apontou como origem do bug Porto/Phuket.
3. **O gradiente não pode falhar.** CSS puro, sem rede.
4. **Já estava desestruturado** na linha 36. Custo zero de fiação.

**Custo assumido:** o arquivo passou a importar `useState`/`useEffect` e ganhou um item de
estado.

**Sobre o `useEffect`:** zera `imageFailed` quando `finalImageUrl` muda. Sem ele, um card
reaproveitado pelo React numa lista filtrada herdaria o estado de falha do roteiro anterior
e esconderia uma foto boa. No modal isso não é preciso — o `key={currentPhotoIndex}` da
`<motion.img>` já força remontagem e limpa o `dataset`.

---

## 4. Verificação

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ exit 0, zero erros |
| `npx vitest run` | ✅ **6 testes, 2 arquivos, todos passando** (8.45s) |
| `npx vite build` | ✅ built in 24.16s, 4390 módulos |

O aviso de chunk >500 kB no build é **pré-existente** e não tem relação com este patch.

**Cobertura de teste — declaração honesta:** a suíte do projeto tem 6 testes
(`flight-fallback`, `example`) e **nenhum deles exercita estes componentes**. Os três
comandos provam que o patch não quebrou nada e que tipa e compila; **não** provam que o
fallback dispara. Isso exigiria um teste novo, que estava fora do escopo desta missão.
Fica registrado como lacuna real.

---

## 5. Estado do Salvador e o limite desta blindagem

O `UPDATE` do roteiro "Nordeste Brasileiro: Sol, Mar e Cultura" **já foi executado**.
Verificado por leitura direta no banco durante esta missão:

```
id:              a2762135-4323-4cb9-b8e7-946012516895
cover_image_url: https://images.unsplash.com/photo-1583166614297-a97b68d5cead?w=800
HTTP:            200 · image/jpeg ✅
```

É a candidata 1 do `RELATORIO-CANDIDATAS-SALVADOR.md` — **capoeira no Pelourinho**, de Nigel
SB Photography. O ciclo que começou com o hero quebrado está fechado: foto viva, conteúdo
correto, e agora com rede de proteção no código.

**Vale ser explícito sobre o que este patch não faz:** ele reage a `onError`, e `onError` só
dispara quando a imagem **falha ao carregar**. Não detecta imagem que carrega bem mas mostra
a coisa errada — foi exatamente esse o caso da capa dos Alpes, que respondia HTTP 200 e
renderizava sem erro nenhum. Contra troca de conteúdo não existe defesa automática; só
inspeção visual, como a que a missão anterior fez.

Resumindo as duas camadas: o `UPDATE` consertou **este** roteiro; o `onError` impede que a
**próxima** capa que morrer vire outro chamado. Nenhuma das duas cobre capa trocada.

---

## 6. Conformidade de escopo

Arquivos modificados — exatamente os 2 autorizados:

```
src/components/community/ItineraryDetailModal.tsx
src/components/community/ItineraryCard.tsx
```

Não tocados, conforme proibição: `src/data/`, `src/lib/hotelZones.ts`,
`src/lib/michelinData.ts`, `src/types/trip.ts` — e nenhum outro arquivo do projeto.

O rascunho de revisão `STEP1-ONERROR-COVERS.md` foi deletado após a aplicação, como
combinado, e nunca entrou em commit algum.

---

## 7. Pendências

- **Sem cobertura de teste** para o comportamento de fallback (§4). Um teste que renderize
  o card/modal com URL inválida e verifique a troca fecharia a lacuna.
- **Varredura de URLs mortas no catálogo estático** — o `RELATORIO-DIAGNOSTICO-COVER-SALVADOR.md`
  §4 já registrou pelo menos uma URL 404 em `src/data/destinationPdfData.ts`, e a missão de
  candidatas achou naquele mesmo arquivo uma URL viva com conteúdo trocado (Alpes rotulado
  como Salvador). Uma varredura precisaria checar **conteúdo**, não só status HTTP.
