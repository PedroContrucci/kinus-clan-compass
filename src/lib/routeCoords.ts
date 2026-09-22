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
import { getCuratedHotelsForCity } from '@/lib/hotelSwap';
import { normalizePlaceName } from '@/lib/placeIdentity';

export type { CuratedCoord };

/** A coordenada curada de um id de item de roteiro, de catálogo ou de hotel. */
export function curatedCoordOf(itemId: unknown): CuratedCoord | null {
  const id = catalogIdOf(itemId);
  if (!id) return null;
  return CURATED_COORDS[id] ?? null;
}

/** O nome puro da hospedagem: sem o sufixo " — bairro, cidade" que a UI acrescenta. */
function baseAccommodationName(name: string | undefined | null): string {
  return String(name ?? '').split('—')[0].split(',')[0].trim();
}

/**
 * A chave de comparação de hotel. O curado é gravado sem o genérico ("Gran Marquise"),
 * a hospedagem da viagem quase sempre chega com ele ("Hotel Gran Marquise"). Comparar
 * cru fazia o casamento por nome falhar em silêncio e devolver o pino ao Nominatim.
 */
function hotelKey(name: string): string {
  return normalizePlaceName(name)
    .replace(/^(hotel|hotél|pousada|resort|hostel|inn)\s+/, '')
    .replace(/\s+(hotel|resort)$/, '')
    .trim();
}

/**
 * A coordenada do pino do hotel, do mais confiável para o menos:
 *   1. `curatedHotelId` — casamento por id, como todo o resto deste arquivo.
 *   2. nome do hotel × hotéis curados da cidade — viagens nascidas do
 *      HOTEL_RECOMMENDATIONS não têm id, mas às vezes são a mesma casa curada.
 *   3. `null` — o chamador cai no Nominatim/bairro, como antes.
 *
 * O degrau 2 existe porque sem ele o Gran Marquise de Fortaleza, escolhido pelo
 * fallback e portanto sem id, voltava a ser geocodificado por texto e aterrissava
 * longe da Beira-Mar.
 */
export function resolveHotelPin(
  hotelId: string | undefined | null,
  hotelName: string | undefined | null,
  city: string | undefined | null
): { coord: CuratedCoord; source: 'curated' | 'name-match' } | null {
  const byId = curatedCoordOf(hotelId);
  if (byId) return { coord: byId, source: 'curated' };

  const base = hotelKey(baseAccommodationName(hotelName));
  if (!base) return null;
  for (const hotel of getCuratedHotelsForCity(city)) {
    const key = hotelKey(hotel.name);
    if (!key) continue;
    if (key === base || base.includes(key) || key.includes(base)) {
      const coord = CURATED_COORDS[hotel.id];
      if (coord) return { coord, source: 'name-match' };
    }
  }
  return null;
}

export function resolveHotelCoord(
  hotelId: string | undefined | null,
  hotelName: string | undefined | null,
  city: string | undefined | null
): CuratedCoord | null {
  return resolveHotelPin(hotelId, hotelName, city)?.coord ?? null;
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
