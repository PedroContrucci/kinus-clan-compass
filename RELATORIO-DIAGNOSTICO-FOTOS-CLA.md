MISSÃO DE PATCH — ItineraryDetailModal, fotos hardcoded (Correção A / Opção mínima).
Base: RELATORIO-DIAGNOSTICO-FOTOS-CLA.md (já na raiz).

PROTOCOLO OBRIGATÓRIO:
STEP 1 REPORT primeiro — antes de editar qualquer coisa, me mostra:
  a) O trecho ATUAL de src/components/community/ItineraryDetailModal.tsx
     nas linhas ~87 (state currentPhotoIndex), ~108-112 (array photos)
     e ~150-170 (consumo no hero), colado literalmente.
  b) O diff PROPOSTO, completo, sem aplicar.
Só aplica depois que eu confirmar com "APLICAR".

O PATCH (escopo fechado, nada além disto):
1. Substituir o array hardcoded (linhas 108-112) por:
   const photos = [itinerary.cover_image_url].filter(Boolean);
   com fallback genérico se vazio — usar a foto neutra que já era o
   fallback original (photo-1493976040374-85c8e12f0c0e) como último recurso,
   de modo que photos NUNCA seja array vazio.
2. Adicionar useEffect que reseta currentPhotoIndex para 0 quando
   itinerary.id mudar (mitigação do índice obsoleto).
3. NÃO tocar nas guardas photos.length > 1 existentes (linhas ~165 e ~415)
   — elas passam a esconder setas/dots sozinhas.
4. NENHUM outro arquivo. Proibido: src/data/, src/lib/hotelZones.ts,
   src/lib/michelinData.ts, src/types/trip.ts.

Após meu "APLICAR" e o patch feito:
- rodar build/teste local se disponível (vitest run)
- commit na main com mensagem:
  fix(cla): fotos do modal de roteiro derivadas do proprio roteiro (remove hardcode Porto/Phuket)
- push origin main
- relatório final RELATORIO-PATCH-FOTOS-CLA.md na raiz (o que mudou, diff aplicado, resultado do teste)