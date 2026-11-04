# RELATORIO-M8B — PDF parte b (acentos, corpo +2 pt, culinárias)

Commit: `52fffd8` feat(pdf): acentos nos literais, corpo +2 pt, culinárias em PT (M8b)

## O que mudou
- **Acentos:** ~250 literais exibidos corrigidos em `tripPdfExport.ts` (tabelas de descrição, narrativas por
  tema, `DEST_INFO`, dicas/frases/gorjeta/água, rótulos, protocolo, emergência, rodapé), incl. "Fuso horário",
  "Francês", "até 90 dias", "Protocolo de Adaptação", "Água", "Metrô", "Olá", "Fala inglês", "Emergência geral",
  "padrão internacional", "central do cartão", "Números de Emergência", "cópia digital", "inteligência artificial",
  "S'il vous plaît", "Econômico", "Disponível", "Acima do orçamento". Também "é" (verbo) e "à" nos textos fixos.
  Intactos: ids, chaves, regex, comparações (`'cafe da manha'`, `'manha'|'tarde'`) e texto vindo de dados.
- **Fonte:** `FS_BODY=12.5`, `FS_SMALL=11`, `LH_SMALL=4.8`. Corpo (descrição, dica, narrativa, checklist, docs,
  protocolo, emergência, Michelin) sobe; títulos, capa e rodapé ficam. Passo de linha proporcional; blocos
  multilinha agora chamam `checkPage()` com a altura real (narrativa linha a linha; box do consulado dinâmico).
- **pdfText.ts:** +french-chinese/lebanese/asian; `modern french` → "Francesa contemporânea";
  `steakhouse` → "Churrascaria". Testes: +3 casos, nenhum assert antigo alterado.

## Verificação
tsc limpo · vitest 67 arquivos, 780 passed | 3 skipped | 1 todo · build ok · eslint 29 problemas nos 3 arquivos
(nenhum novo). Não gerei PDF visual (sem navegador aqui): conferir paginação/overflow num PDF real.

## Pendências
- `src/data/destinationPdfData.ts` ("Sobre o destino" sem acento): dado intocável, não corrigido.
- `Casa Batllo`/`Mila` ficaram sem acento (nomes próprios; revisar com o catálogo).
- Cobertura de "é"/"à" nas narrativas foi por regra + exceções; revisar leitura no PDF.

## git push
```
To https://github.com/PedroContrucci/kinus-clan-compass
   d15eea7..52fffd8  main -> main
```
