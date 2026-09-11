// GERADO por scripts/sync-catalog.ts --apply — não edite à mão.
//
// A coordenada de um lugar curado vive nas colunas `lat`/`lng` de `curated_activities` e
// `curated_hotels`, no kinu-beta, preenchidas pelo enrich a partir do Google Places (ver
// `supabase-beta/ENRICH-COORDS.md`). O mapa da Rota do Dia roda no cliente, sem falar com o
// banco. Este arquivo é a ponte — e é a única.
//
// POR QUE UM ARQUIVO GERADO E NÃO UM CAMPO EM `SuggestedActivity`: coordenada não é campo de
// roteiro, é geometria — a mesma razão pela qual `landmark_tier` mora em `landmarkTiers.ts`. E
// `SuggestedActivity` é intocável: `lat:` dentro do literal de `destinationActivities.ts` seria
// erro de excess-property no `tsc`, não "campo por fora do tipo".
//
// ATIVIDADES E HOTÉIS NO MESMO MAPA. O consumidor (`src/lib/routeCoords.ts`) faz um lookup só,
// por id, e os prefixos não colidem (`for-h-gran-marquise` vs `for-mercado-peixes`). O script
// aborta se algum dia colidirem, em vez de deixar um hotel virar atividade em silêncio.
//
// NASCE VAZIO E CRESCE. Não há guarda de piso aqui: a cobertura era 0 no dia em que o arquivo
// entrou e sobe a cada lote de enrich. O `--apply` imprime a contagem para a cobertura ser um
// número visto, não uma suposição. A trava de deriva é `src/test/routeCoords.test.ts`.

export interface CuratedCoord {
  lat: number;
  lng: number;
}

/** Chaveado pelo id do catálogo (`for-mercado-peixes`) ou do hotel (`for-h-gran-marquise`). */
export const CURATED_COORDS: Record<string, CuratedCoord> = {
};
