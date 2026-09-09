// O bloco do hotel no roteiro — os dois estados, o rótulo honesto e a ficha completa.
//
// O que estes testes protegem não é layout: é a promessa. Um hotel curado tem que mostrar
// POR QUE foi escolhido; um hotel de fallback tem que ADMITIR que não tem curadoria em vez
// de simular um porquê; e a ficha tem que mostrar a curadoria inteira, não a primeira dica.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Cliente mockado: `client.ts` roda `createClient` no import, e telemetria não bate em
// rede dentro de teste. O anel local segue real — é ele que os testes de evento leem.
vi.mock('@/integrations/kinu-beta/client', () => ({
  kinuBeta: {
    from: () => ({ insert: async () => ({ data: null, error: { code: '42501', message: 'denied' } }) }),
    auth: { getSession: async () => ({ data: { session: null }, error: null }) },
  },
}));

import { HotelPlanBlock } from '@/components/hotel/HotelPlanBlock';
import { HotelDetailContent } from '@/components/hotel/HotelDetailDrawer';
import { readEvents } from '@/lib/kinuEvents';
import { curatedHotels } from '@/data/curatedHotels';
import type { AccommodationLike, SwapTripLike } from '@/lib/hotelSwap';

const CASA_LOLA = curatedHotels['Cartagena'].find((h) => h.id === 'ctg-h-casa-lola')!;
const SOFITEL = curatedHotels['Cartagena'].find((h) => h.id === 'ctg-h-sofitel')!;

function tripWith(acc: AccommodationLike | undefined, over: Partial<SwapTripLike> = {}): SwapTripLike {
  return {
    destination: 'Cartagena',
    budgetTier: 'comfort',
    travelers: 2,
    travelInterests: [],
    accommodation: acc,
    ...over,
  };
}

/** Hospedagem curada como o gerador grava (nome puro, zona, proveniência e autoria). */
const curada = (chosenBy: 'kinu' | 'user'): AccommodationLike => ({
  id: 'hotel-main',
  name: CASA_LOLA.name,
  neighborhood: CASA_LOLA.zone,
  curatedHotelId: CASA_LOLA.id,
  chosenBy,
  nightlyRate: 800,
  totalNights: 7,
  totalPrice: 5600,
  status: 'planned',
});

/** Hospedagem do HOTEL_RECOMMENDATIONS — o caso de ~92% das viagens antigas. */
const fallback: AccommodationLike = {
  id: 'hotel-main',
  name: 'Novotel Cartagena — Centro, Cartagena',
  neighborhood: 'Centro',
  nightlyRate: 450,
  totalNights: 7,
  totalPrice: 3150,
  status: 'planned',
};

beforeEach(() => {
  localStorage.clear();
});

describe('estado curado — o porquê aparece', () => {
  it('mostra nome, zona, faixa da curadoria, noites e os motivos', () => {
    render(<HotelPlanBlock trip={tripWith(curada('kinu'))} onSelectHotel={() => {}} />);

    expect(screen.getByText('ONDE VOCÊ FICA')).toBeInTheDocument();
    expect(screen.getByText(CASA_LOLA.name)).toBeInTheDocument();

    // A faixa vem da CURADORIA (R$ 600-1.000), não do nightlyRate gravado.
    const linha = screen.getByText(/Getsemaní/);
    expect(linha).toHaveTextContent(CASA_LOLA.priceRangeBRL);
    expect(linha).toHaveTextContent('7 noites');

    expect(screen.getByText('tier Conforto ✓')).toBeInTheDocument();
    expect(screen.getByText('perfil casal ✓')).toBeInTheDocument();
    expect(screen.getByText(`nota ${CASA_LOLA.rating}`)).toBeInTheDocument();
  });

  it("chosenBy 'kinu' assina a escolha; 'user' devolve o crédito ao usuário", () => {
    const { unmount } = render(<HotelPlanBlock trip={tripWith(curada('kinu'))} onSelectHotel={() => {}} />);
    expect(screen.getByText('Escolhido porque:')).toBeInTheDocument();
    unmount();

    render(<HotelPlanBlock trip={tripWith(curada('user'))} onSelectHotel={() => {}} />);
    expect(screen.getByText('Sua escolha · combina porque:')).toBeInTheDocument();
    expect(screen.queryByText('Escolhido porque:')).not.toBeInTheDocument();
  });

  it('oferece a porta de saída', () => {
    render(<HotelPlanBlock trip={tripWith(curada('kinu'))} onSelectHotel={() => {}} />);
    expect(screen.getByRole('button', { name: 'Ver curadoria e trocar' })).toBeInTheDocument();
  });

  it('sem onSelectHotel o bloco informa, mas não promete o que não pode cumprir', () => {
    render(<HotelPlanBlock trip={tripWith(curada('kinu'))} />);
    expect(screen.getByText(CASA_LOLA.name)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ver curadoria e trocar' })).not.toBeInTheDocument();
  });

  it('emite hotel.reasons_viewed uma vez, com o hotel, a cidade e a autoria', () => {
    render(<HotelPlanBlock trip={tripWith(curada('kinu'))} onSelectHotel={() => {}} />);

    const vistos = readEvents().filter((e) => e.name === 'hotel.reasons_viewed');
    expect(vistos).toHaveLength(1);
    expect(vistos[0].props).toMatchObject({
      hotel: CASA_LOLA.name,
      city: 'Cartagena',
      curated: true,
      author: 'kinu',
    });
  });
});

describe('estado fallback — o bloco admite o que não sabe', () => {
  it('cidade COM curadoria: diz que o tier não está coberto, e não finge um porquê', () => {
    render(<HotelPlanBlock trip={tripWith(fallback)} onSelectHotel={() => {}} />);

    expect(screen.getByText('Novotel Cartagena')).toBeInTheDocument();
    expect(screen.getByText(/ainda sem curadoria KINU neste tier/)).toBeInTheDocument();
    expect(screen.queryByText('Escolhido porque:')).not.toBeInTheDocument();
    expect(screen.queryByText('Sua escolha · combina porque:')).not.toBeInTheDocument();
    // Diária estimada, rotulada como estimativa — não é faixa de curadoria.
    expect(screen.getByText(/R\$ 450\/noite \(estimativa\)/)).toBeInTheDocument();
  });

  it('cidade SEM curadoria: nomeia a cidade e oferece o caminho externo', () => {
    const trip = tripWith({ ...fallback, name: 'Hotel Qualquer' }, { destination: 'Singapura' });
    render(<HotelPlanBlock trip={trip} onSelectHotel={() => {}} onOpenOffers={() => {}} />);

    expect(screen.getByText(/ainda sem curadoria KINU em Singapura/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Buscar ofertas/ })).toBeInTheDocument();
  });

  it('não emite reasons_viewed quando não há motivo nenhum para mostrar', () => {
    render(<HotelPlanBlock trip={tripWith(fallback)} onSelectHotel={() => {}} />);
    expect(readEvents().filter((e) => e.name === 'hotel.reasons_viewed')).toHaveLength(0);
  });
});

describe('sem hospedagem', () => {
  it('não renderiza nada — placeholder vazio no topo do roteiro é ruído', () => {
    const { container } = render(<HotelPlanBlock trip={tripWith(undefined)} onSelectHotel={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('viagem nula também não derruba a tela', () => {
    const { container } = render(<HotelPlanBlock trip={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('ficha do hotel', () => {
  it('mostra TODAS as dicas da curadoria, não só a primeira', () => {
    expect(SOFITEL.tips.length).toBeGreaterThan(1); // a fixture precisa ter o que provar
    render(<HotelDetailContent hotel={SOFITEL} city="Cartagena" />);

    for (const tip of SOFITEL.tips) {
      expect(screen.getByText(tip)).toBeInTheDocument();
    }
  });

  it('mostra tier, personas, nota, faixa com o valor usado no orçamento e o mapa da zona', () => {
    render(<HotelDetailContent hotel={SOFITEL} city="Cartagena" />);

    expect(screen.getByText('Resort')).toBeInTheDocument();
    expect(screen.getByText('família · casal')).toBeInTheDocument();
    expect(screen.getByText(String(SOFITEL.rating))).toBeInTheDocument();
    expect(screen.getByText(/usamos R\$ 3\.500 no orçamento/)).toBeInTheDocument();

    const mapa = screen.getByRole('link', { name: /Ver Centro Histórico no mapa/ });
    expect(decodeURIComponent(mapa.getAttribute('href') ?? '')).toContain(
      `${SOFITEL.name}, ${SOFITEL.zone}, Cartagena`,
    );
  });

  it('escolher devolve o hotel; o hotel atual não é escolhível de novo', () => {
    const onSelect = vi.fn();
    const { unmount } = render(
      <HotelDetailContent hotel={CASA_LOLA} city="Cartagena" onSelect={onSelect} />,
    );
    screen.getByRole('button', { name: /Escolher este hotel/ }).click();
    expect(onSelect).toHaveBeenCalledWith(CASA_LOLA);
    unmount();

    render(<HotelDetailContent hotel={CASA_LOLA} city="Cartagena" isCurrent onSelect={onSelect} />);
    const botao = screen.getByRole('button', { name: /Já é o seu hotel/ });
    expect(botao).toBeDisabled();
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('sem faixa parseável, diz que não tem — não inventa número', () => {
    render(
      <HotelDetailContent
        hotel={{ ...CASA_LOLA, priceRangeBRL: 'sob consulta' }}
        city="Cartagena"
      />,
    );
    expect(screen.getByText('faixa de preço indisponível')).toBeInTheDocument();
  });
});
