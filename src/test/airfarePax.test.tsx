import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { airfarePaxOf } from '@/lib/pax';
import { getSelectedFlightPlannedTotal } from '@/lib/flightFinance';
import { FlightPriceLines } from '@/components/cockpit/FlightPriceLines';

describe('airfarePaxOf — regra da aérea por idade (M20b)', () => {
  it('2 adultos + crianças de 8 e 12 → adults 3, children 1', () => {
    const p = airfarePaxOf({ travelers: 4, adults: 2, children: 2, infants: 0, childrenAges: [8, 12] });
    expect(p).toEqual({ adults: 3, children: 1, infants: 0, payers: 4 });
  });
  it('criança sem idade conta como criança', () => {
    const p = airfarePaxOf({ travelers: 4, adults: 2, children: 2, infants: 0, childrenAges: [] });
    expect(p).toMatchObject({ adults: 2, children: 2, payers: 4 });
  });
  it('idade < 2 vira bebê e não paga; bebê declarado fica fora dos pagantes', () => {
    const p = airfarePaxOf({ travelers: 4, adults: 2, children: 2, infants: 0, childrenAges: [1, 5] });
    expect(p).toMatchObject({ adults: 2, children: 1, infants: 1, payers: 3 });
    expect(airfarePaxOf({ travelers: 3, adults: 2, children: 0, infants: 1 }).payers).toBe(2);
  });
  it('viagem antiga sem pax: tudo adulto (payers = travelers)', () => {
    expect(airfarePaxOf({ travelers: 3 })).toEqual({ adults: 3, children: 0, infants: 0, payers: 3 });
  });
  it('total do voo = ida+volta (1 adulto) × pagantes', () => {
    const trip = { travelers: 5, adults: 2, children: 2, infants: 1, outboundFlight: { option: { price: 1000 } }, returnFlight: { option: { price: 800 } } };
    expect(getSelectedFlightPlannedTotal(trip)).toBe(1800 * 4);
  });
});

describe('FlightPriceLines — hero (M20b)', () => {
  const trip = {
    travelers: 5, adults: 2, children: 2, infants: 1,
    outboundFlight: { source: 'reference', option: { price: 1000 } },
    returnFlight: { source: 'reference', option: { price: 800 } },
    kinuFlightSearch: { searchedAt: '2026-11-05T14:07:00' },
  };
  it('estimativa por pagante, fonte, data, por pessoa e nota do bebê; nunca "total"', () => {
    const { container } = render(<FlightPriceLines trip={trip} amount={7200} confirmed={false} />);
    expect(screen.getByTestId('flight-price-basis').textContent).toBe(
      'estimativa para 2 adultos + 2 crianças + 1 bebê · preço de referência por adulto (Aviasales, consultado em 05/11 às 14:07) × 4 pagantes');
    expect(screen.getByTestId('flight-price-pp').textContent).toBe('por pessoa ≈ R$ 1.800');
    expect(screen.getByTestId('flight-infant-note').textContent).toBe('bebê de colo: tarifa à parte');
    expect(container.textContent?.toLowerCase()).not.toContain('total');
  });
  it('sem bebê, sem nota', () => {
    render(<FlightPriceLines trip={{ travelers: 2, outboundFlight: { source: 'estimate' } }} amount={3000} confirmed={false} />);
    expect(screen.queryByTestId('flight-infant-note')).toBeNull();
    expect(screen.getByTestId('flight-price-basis').textContent).toContain('estimativa do KINU por adulto × 2 pagantes');
  });
});
