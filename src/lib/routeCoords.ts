// routeCoords — a coordenada curada vem antes de qualquer geocoding por texto.
//
// O MOTIVO É UM HOTEL NO LUGAR ERRADO. A Rota do Dia geocodificava tudo por nome no Nominatim;
// o Gran Marquise, que fica na Beira-Mar do Mucuripe, aparecia seis quadras para dentro do
// Meireles. Buscar "Gran Marquise, Fortaleza" num índice mundial de texto é pedir o lugar mais
// parecido, não o lugar certo — e o mais parecido erra em silêncio, com a mesma cara de acerto.
//
// A PRECEDÊNCIA, do mais confiável para o menos:
//   1. `CURATED_COORDS` — Google Places, casado por **id**, gravado pelo enrich no kinu-beta.
//   2. `ATTRACTION_COORDS` — 419 linhas escritas à mão, casadas por nome normalizado.
//   3. Nominatim — busca por texto livre, em runtime.
// O curado ganha do manual porque o manual também é um palpite, só que nosso e mais antigo.
//
// O CASAMENTO É POR ID, NUNCA POR NOME — mesma regra do motor de conquistas. O id do item de
// roteiro embute o id do catálogo (`day-3-for-mercado-peixes` É `for-mercado-peixes`), e é o
// `catalogIdOf` de `localAchievements.ts` que o extrai; nome é texto de tela e muda com uma
// correção de acento. Ids de hotel curado (`for-h-gran-marquise`) passam inteiros pelo mesmo
// `catalogIdOf`, que só corta o prefixo `day-N-`.
import { CURATED_COORDS, type CuratedCoord } from '@/data/generated/coords';
import { catalogIdOf } from '@/lib/localAchievements';

export type { CuratedCoord };

/** A coordenada curada de um id de item de roteiro, de catálogo ou de hotel. */
export function curatedCoordOf(itemId: unknown): CuratedCoord | null {
  const id = catalogIdOf(itemId);
  if (!id) return null;
  return CURATED_COORDS[id] ?? null;
}

/**
 * A coordenada de uma parada do dia: curada quando existe, `fallback` quando não.
 *
 * O `fallback` é a cadeia antiga inteira (`ATTRACTION_COORDS` exato -> parcial -> Nominatim),
 * injetada em vez de importada para esta função poder ser exercitada sem rede e sem Leaflet —
 * é assim que o teste prova que o Nominatim **não** é chamado quando há coordenada curada.
 */
export async function resolveStopCoord(
  stop: { id?: string; name: string },
  destination: string,
  fallback: (name: string, destination: string) => Promise<CuratedCoord | null>
): Promise<CuratedCoord | null> {
  const curated = curatedCoordOf(stop.id);
  if (curated) return curated;
  return fallback(stop.name, destination);
}
