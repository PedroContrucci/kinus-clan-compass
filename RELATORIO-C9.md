# RELATÓRIO C.9 — Preparação por destino + 0a/0b

**Commit:** `14fea25` feat (C.9). Suíte 62 arquivos / 727 verdes (rodada inteira 1×) · tsc zero · build ok · eslint sem problema novo (Viagens.tsx: 37 antes = 37 depois).

## O que mudou
- **`destinationRules(trip)`** (puro, `tripScope.ts`). País: `getDocsForDestination` → catálogo (`findCityInfo().country`, alias Inglaterra→Reino Unido) → `trip.country` → `DESTINATION_DOCS`.
  Fontes: international = `!isDomesticTrip` · visto = docs `vistoIsento`, senão pdfData `info.visa` (D1) · vacina = só docs `vacinaObrigatoria`/`vacina` · tomada = docs `tomada`, senão pdfData `info.voltage` · seguro obrigatório = "Schengen" no texto de visto · moeda = docs `moeda`, senão catálogo `currency`. Sem dado → `undefined`.
- **`scopeChecklist(items, rules)`**: Passaporte, câmbio, chip e aviso ao banco só em viagem internacional · "Visto ou autorização de entrada" só com `visaRequired===true` (ETA/eVisa/NZeTA contam, D2) · "Vacina obrigatória — febre amarela (CIVP)" só com `vaccineRequired===true` · `pack-3` vira "Adaptador de tomada (tipo G · 230 V) e carregadores" só se nenhum tipo do destino aceita o plugue BR (C/E/F/N, D3), senão "Carregadores" · Seguro: "obrigatório (Schengen)" ou "(recomendado)". Itens escondidos saem do contador.
- **Achado corrigido:** `Viagens.tsx` mostrava Visto/Vacina quando o país não tinha dado (default "sim") e Visto em viagem doméstica. Essa lógica saiu da página.
- **Bloco "📋 Regras do destino"** (topo da Preparação, fechado): "Portugal · sem visto até 90 dias · sem vacina · tomada C/F 230 V · seguro obrigatório ▸". Aberto, mostra o texto do docs, o mesmo que o PDF imprime em DOCUMENTAÇÃO, com a fonte declarada.
- **0b:** chips do KINU AI ficam no topo com a conversa vazia. Com mensagens, ficam logo acima do campo de digitar (prop `placement`). Emergência não mudou. Sem teste de render nem browser (economia).

## Testes (tripScopeBlocks.test.tsx)
Fortaleza: sem passaporte, visto, vacina, adaptador nem câmbio · Lisboa: passaporte, sem visto, sem vacina, **sem adaptador**, seguro obrigatório, câmbio, linha-resumo exata · Nova York (A/B · 120 V) e Londres (G · 230 V): com adaptador · Cidade do Cabo: vacina com o nome (febre amarela) · Porto via catálogo, Praga via pdfData (vacina undefined) · Cancún sem dado: item ausente. Teste do C.5a ajustado: a categoria Pré-Viagem some em Fortaleza.

## Provedor × kind (`buildCloseLinks`)
| kind | provedores (ordem) | rótulo |
|---|---|---|
| voo | Kiwi (Travelpayouts) · **Decolar** `/shop/flights/results/roundtrip/{O}/{D}/{ida}/{volta}/{pax}/0/0` · Skyscanner · LATAM (se for a cia) | parceiro KINU · link direto ×3 |
| hotel | Booking · Hoteis.com · Airbnb | link direto |
| passeio (online/partner) | Site oficial · Klook · GetYourGuide | site oficial / parceiro · link direto |
Google Flights saiu (a URL por texto não leva data nem pax no celular).

## Lacuna de dado (insumo da esteira; a aba não mostra o item)
- **Sem vacina** (país fora do `destinationDocs`): Holanda, Alemanha, Rep. Tcheca, Áustria, Grécia, Suíça, Irlanda, Croácia, Hungria, Chile, Peru, Colômbia, México, Uruguai, Canadá, Cuba, Coreia do Sul, China, Índia, Vietnã, Israel, Maldivas, Egito, Quênia, Austrália, Nova Zelândia.
- **Sem visto nem tomada** (nem docs nem pdfData): Amsterdã, Zurique, Genebra, Atacama, Cancún, Cidade do México, Punta del Este, Vancouver, Havana, Xangai, Tel Aviv, Cairo, Melbourne.

Nenhuma edge function tocada, então não há redeploy. Publish fica com o fundador.

## Push
```
To https://github.com/PedroContrucci/kinus-clan-compass
   c9371ab..14fea25  main -> main
```
