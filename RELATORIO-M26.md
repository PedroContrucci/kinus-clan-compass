# RELATORIO-M26 — chave do Google fora do navegador

## Inventário (key= / variável da chave saindo de function)
- `google-places/index.ts:51` e `:117` (antes): `photoUrl` com `key=${API_KEY}` → ao cliente. **CORRIGIDO.**
- `maps-embed/index.ts:20` (só relato): devolve embedUrl com `key=` de `GOOGLE_MAPS_EMBED_KEY` — chave
  DIFERENTE (Maps Embed API), de uso público por desenho; protegê-la = restrição por referrer no console Google. Não alterada.
- `place-photo/index.ts:51`: chave só na chamada servidor→Google; resposta são bytes. Sem vazamento.
- weather / exchange-rates / amadeus / feedback-digest: `key=` só em URL de saída servidor→terceiro ou em
  máscara de log (`key=***`). Nada vai ao cliente. Chave Places não aparece fora de google-places/place-photo.

## Correção
- Novo `_shared/placesPhoto.ts` (sem imports): `resolvePhotoUrl(name, key, w, h, fetch)` chama
  `places/<..>/photos/<..>/media?...&skipHttpRedirect=true` com a chave no HEADER `X-Goog-Api-Key`;
  devolve `photoUri` (https, sem chave) ou `null` (sem photoUri, erro HTTP, exceção, nome inválido, uri com key=).
- `google-places/index.ts`: `search` e `details` usam o helper. Contrato igual; photoUrl = URL sem chave | null.
- Front intacto: PlaceInfoCard (:44,:78), ActivityDetailDrawer (:212) já renderizam foto só se `photoUrl` truthy.

## Chamadas pagas ao Google por ação
| ação | antes | depois |
|---|---|---|
| search | 1 Text Search (+1 Place Photo quando o navegador carregava a imagem) | 1 Text Search + 1 Place Photo no servidor (só se há foto); imagem vem do CDN sem custo extra |
| search_many | 1 Text Search | 1 Text Search (sem foto, inalterado) |
| details | 1 Place Details (+1 Photo no navegador) | 1 Place Details + 1 Place Photo no servidor (só se há foto) |
Observação: a foto passa a ser cobrada mesmo se o navegador não renderizar a imagem; no uso real (card sempre
mostra a foto) o total é o mesmo. Nenhuma busca ganhou chamada nova além da foto antes cobrada no cliente.

## Testes / gates (sem rede)
- `src/test/googlePlacesPhoto.test.ts` (8): index.ts sem "key="; helper com fetch simulado
  (photoUri→URL sem chave e chave só no header; ausente/erro/exceção/key=/nome inválido→null, sem rede).
- deno check google-places OK · tsc limpo · vitest 96 arquivos, 967 passed, 0 failed (após o último ajuste)
  · build ok · eslint do teste novo limpo. Nenhum teste existente mudou de resultado.

## Redeploy (Lovable) — nomear TODOS
`supabase/functions/google-places/index.ts` · `supabase/functions/_shared/placesPhoto.ts` (novo)
(`_shared/http.ts` já importado, inalterado). Após o deploy, **rotacionar a chave GOOGLE_PLACES_API_KEY**: ela já
circulou em URLs de foto no navegador.

## git log --oneline -15 -- supabase/functions/google-places/ supabase/functions/_shared/
dd6ce8c fix(security): google-places resolve foto no servidor e devolve URL sem chave (M26)
537bb36 Changes
d2400fb Changes
1f16b40 feat(f3): contador persistente + telemetria da sombra (arco 5.e)
95a8d33 feat(f3): arco 5.d - identidade kinu-beta nas functions caras (verifyKinuBetaJwt, modo sombra)
1f2ad08 feat(f3): arco 5.c - CORS allowlist + burst guard (10 functions, helper _shared)
b07ad85 Changes
9e90086 Add Google Places scaffolding
(537bb36/d2400fb: commits do Lovable que também sobem junto no redeploy.)

## Push do fix
To https://github.com/PedroContrucci/kinus-clan-compass
   2f40438..dd6ce8c  main -> main
