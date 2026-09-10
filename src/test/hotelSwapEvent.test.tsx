// `hotel.swapped`: UMA linha por troca, nas três superfícies.
//
// O bug que trouxe estes testes: uma troca feita pela ficha gravou DUAS linhas idênticas
// na tabela `events`, e trocas feitas na lista do modal não gravaram nenhuma. A entrega
// dobrada tem teste próprio no emissor (kinuEvents.test.ts, "uma drenagem por vez"); aqui
// o que se conta é EMISSÃO — quantas vezes cada superfície chama o emissor por troca.
//
// A casca do vaul é mockada por div. Não é atalho: o `Drawer` não tem lógica nenhuma, e
// montá-lo de verdade no jsdom custa mockar pointer/resize e perseguir portal para testar
// exatamente as mesmas chamadas. O que este arquivo protege mora nos handlers.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import type { ReactNode } from 'react';

vi.mock('@/integrations/kinu-beta/client', () => ({
  kinuBeta: {
    from: () => ({ insert: async () => ({ data: null, error: { code: '42501', message: 'denied' } }) }),
    auth: { getSession: async () => ({ data: { session: null }, error: null }) },
  },
}));

vi.mock('@/components/ui/drawer', () => {
  const Passthrough = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return {
    Drawer: ({ open, children }: { open?: boolean; children?: ReactNode }) =>
      open ? <div data-testid="drawer">{children}</div> : null,
    DrawerContent: Passthrough,
    DrawerHeader: Passthrough,
    DrawerTitle: Passthrough,
    DrawerClose: ({ children }: { children?: ReactNode }) => <>{children}</>,
  };
});

import { HotelPlanBlock } from '@/components/hotel/HotelPlanBlock';
import { HotelSwapModal } from '@/components/hotel/HotelSwapModal';
import { readEvents } from '@/lib/kinuEvents';
import { curatedHotels } from '@/data/curatedHotels';
import type { AccommodationLike, SwapTripLike } from '@/lib/hotelSwap';

const CASA_LOLA = curatedHotels['Cartagena'].find((h) => h.id === 'ctg-h-casa-lola')!;
const SOFITEL = curatedHotels['Cartagena'].find((h) => h.id === 'ctg-h-sofitel')!;

const acc = (over: Partial<AccommodationLike> = {}): AccommodationLike => ({
  id: 'hotel-main',
  name: CASA_LOLA.name,
  neighborhood: CASA_LOLA.zone,
  curatedHotelId: CASA_LOLA.id,
  chosenBy: 'kinu',
  nightlyRate: 800,
  totalNights: 7,
  totalPrice: 5600,
  status: 'planned',
  ...over,
});

const trip = (over: Partial<SwapTripLike> = {}): SwapTripLike => ({
  destination: 'Cartagena',
  budgetTier: 'comfort',
  travelers: 2,
  travelInterests: [],
  accommodation: acc(),
  ...over,
});

/** Só os `hotel.swapped` do anel — o bloco emite `reasons_viewed` e `detail_opened` junto. */
const trocas = () => readEvents().filter((e) => e.name === 'hotel.swapped');

/** O cartão do Sofitel dentro do modal, para separar "abrir ficha" de "escolher". */
const cartaoSofitel = () => screen.getByText(SOFITEL.name).closest('div.rounded-xl') as HTMLElement;

beforeEach(() => {
  localStorage.clear();
});

describe('uma emissão por troca, em qualquer superfície', () => {
  it('bloco → modal → escolher: uma linha, surface swap', () => {
    const onSelectHotel = vi.fn();
    render(<HotelPlanBlock trip={trip()} onSelectHotel={onSelectHotel} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ver curadoria e trocar' }));
    fireEvent.click(within(cartaoSofitel()).getByRole('button', { name: 'Escolher este' }));

    expect(onSelectHotel).toHaveBeenCalledTimes(1);
    expect(trocas()).toHaveLength(1);
    expect(trocas()[0].props).toEqual({
      from: CASA_LOLA.name,
      to: SOFITEL.name,
      city: 'Cartagena',
      surface: 'swap',
    });
  });

  it('modal direto (sem ficha, TripPanel e DraftCockpit): uma linha, surface swap', () => {
    // Sem `onOpenDetail` a linha inteira é o botão de escolher — é o modal do stepper.
    const onSelect = vi.fn();
    render(<HotelSwapModal open onClose={() => {}} trip={trip()} onSelect={onSelect} />);

    fireEvent.click(screen.getByText(SOFITEL.name));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(trocas()).toHaveLength(1);
    expect(trocas()[0].props).toMatchObject({ to: SOFITEL.name, surface: 'swap' });
  });

  it('a ficha aberta pelo bloco é a do hotel ATUAL — não há troca para emitir', () => {
    const onSelectHotel = vi.fn();
    render(<HotelPlanBlock trip={trip()} onSelectHotel={onSelectHotel} />);

    fireEvent.click(screen.getByText('ONDE VOCÊ FICA')); // o bloco abre a ficha do atual

    expect(screen.getByRole('button', { name: /Já é o seu hotel/ })).toBeDisabled();
    expect(trocas()).toHaveLength(0);
    expect(onSelectHotel).not.toHaveBeenCalled();
  });

  it('bloco → modal → ficha → escolher: UMA linha, e não uma por handler encadeado', () => {
    // O caminho que gravou duas linhas em produção. A ficha aberta de dentro do modal fecha
    // o modal, então o `handlePick` de lá não roda junto — uma troca, uma superfície.
    const onSelectHotel = vi.fn();
    render(<HotelPlanBlock trip={trip()} onSelectHotel={onSelectHotel} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ver curadoria e trocar' }));
    fireEvent.click(within(cartaoSofitel()).getByRole('button', { name: `Ver detalhes de ${SOFITEL.name}` }));
    fireEvent.click(screen.getByRole('button', { name: /Escolher este hotel/ }));

    expect(onSelectHotel).toHaveBeenCalledTimes(1);
    expect(trocas()).toHaveLength(1);
    expect(trocas()[0].props).toMatchObject({ from: CASA_LOLA.name, to: SOFITEL.name, surface: 'detail' });
  });

  it('hotel confirmado: o primeiro toque só pergunta, quem emite é a confirmação', () => {
    const onSelect = vi.fn();
    render(
      <HotelSwapModal
        open
        onClose={() => {}}
        trip={trip({ accommodation: acc({ status: 'confirmed' }) })}
        onSelect={onSelect}
        onOpenDetail={() => {}}
      />,
    );

    fireEvent.click(within(cartaoSofitel()).getByRole('button', { name: 'Escolher este' }));
    expect(trocas()).toHaveLength(0);
    expect(onSelect).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Trocar mesmo assim/ }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(trocas()).toHaveLength(1);
    expect(trocas()[0].props).toMatchObject({ to: SOFITEL.name, surface: 'swap' });
  });

  it('dois cliques no mesmo botão são uma troca só — o dedupe do emissor segura', () => {
    render(<HotelSwapModal open onClose={() => {}} trip={trip()} onSelect={() => {}} />);

    const linha = screen.getByText(SOFITEL.name);
    fireEvent.click(linha);
    fireEvent.click(linha);

    expect(trocas()).toHaveLength(1);
  });
});
