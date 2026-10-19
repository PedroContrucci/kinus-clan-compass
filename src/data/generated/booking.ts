// GERADO por scripts/sync-catalog.ts --apply — não edite à mão.
//
// C.5d — como cada item do catálogo se fecha, das colunas `booking_*` de `curated_activities`
// no kinu-beta. Dado do catálogo, nunca inferência: id ausente aqui = o KINU não sabe, e a UI
// não oferece ação nenhuma. Mesma ponte de `coords.ts` (`SuggestedActivity` é intocável).
// Consumidor: `roteiroBooking` em `src/lib/roteiroBlocks.ts`.

export type BookingMode = 'walk_in' | 'phone' | 'online' | 'partner' | 'included';

export interface CuratedBooking {
  mode: BookingMode;
  url?: string;
  phone?: string;
  note?: string;
}

/** Chaveado pelo id do catálogo (`for-barraca-crocobeach`). */
export const CURATED_BOOKING: Record<string, CuratedBooking> = {
  'for-barraca-chico-praia': { mode: 'walk_in', note: 'Sem reserva — chegue cedo, ordem de chegada' },
  'for-barraca-crocobeach': { mode: 'walk_in', note: 'Sem reserva — chegue antes das 10h para pegar mesa na frente' },
  'for-cabana-del-primo': { mode: 'phone' },
  'for-cantinho-faustino': { mode: 'phone' },
  'for-caranguejada-iate': { mode: 'phone' },
  'for-caravaggio-cucina': { mode: 'phone' },
  'for-carneiro-ordones': { mode: 'phone' },
  'for-cemoara': { mode: 'phone' },
  'for-coco-bambu-beira-mar': { mode: 'phone' },
  'for-coco-bambu-varjota': { mode: 'phone' },
  'for-giz-cozinha': { mode: 'phone' },
  'for-mar-e-terra-varjota': { mode: 'phone' },
  'for-mercado-peixes': { mode: 'walk_in', note: 'Quiosques preparam na hora — sem reserva' },
  'for-picanha-do-cowboy': { mode: 'phone' },
  'for-recanto-praiano': { mode: 'phone' },
  'for-rest-boteco-praia': { mode: 'phone' },
  'for-rest-cabana-del-primo': { mode: 'phone' },
  'for-rest-chico-aldeota': { mode: 'phone' },
  'for-rest-geppos': { mode: 'phone' },
  'for-rest-lo': { mode: 'phone' },
  'for-rest-moleskine': { mode: 'phone' },
  'for-rest-ryori': { mode: 'phone' },
  'for-rest-santa-grelha': { mode: 'phone' },
  'for-rest-vasto': { mode: 'phone' },
  'for-vojnilo': { mode: 'phone' },
};
