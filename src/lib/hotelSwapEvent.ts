// hotelSwapEvent — UMA emissão de `hotel.swapped` por troca, com UM formato.
//
// O evento nasce em duas superfícies (a lista do modal e a ficha do hotel) e a análise só
// consegue comparar as duas se as props tiverem exatamente o mesmo formato: `surface` com
// vocabulário fechado, `from` sempre string (a viagem pode não ter hotel), e nenhuma tela
// inventando um campo a mais. Por isso as duas chamam esta função em vez de montarem as
// props na mão.
//
// A REGRA que este módulo carrega: cada superfície emite por si, e uma troca passa por uma
// superfície só. A ficha aberta de dentro do modal FECHA o modal antes de escolher — não é
// detalhe de UI, é o que garante que o clique não caia em dois emissores encadeados.
//
// Vive fora do `hotelSwap.ts` de propósito: aquele módulo é domínio puro e é importado por
// testes que não mockam o cliente do kinu-beta — puxar o emissor para lá levaria junto o
// `createClient` do import de `client.ts`.
import { trackEvent } from '@/lib/kinuEvents';

/**
 * Onde a troca aconteceu.
 * - `swap`: a lista do modal de troca, aberta pelo bloco do roteiro ou pelo stepper.
 * - `detail`: o botão dentro da ficha do hotel.
 */
export type SwapSurface = 'swap' | 'detail';

export interface HotelSwapEvent {
  /** Nome do hotel ANTES da troca — lido antes de aplicar, senão já é o novo. */
  from: string;
  to: string;
  city: string;
  surface: SwapSurface;
}

export function trackHotelSwap({ from, to, city, surface }: HotelSwapEvent): void {
  trackEvent('hotel.swapped', { from, to, city, surface });
}
