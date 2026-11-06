import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { buildAviasalesSearchLink, aviasalesPaxCode, formatFoundAt, formatFoundAtDate, tripFoundAt } from '@/lib/aviasalesLink';
import { FlightPriceLines } from '@/components/cockpit/FlightPriceLines';
import { FlightLiveLink } from '@/components/cockpit/FlightLiveLink';

describe('found_at (M10-0)', () => {
  const iso = '2026-11-05T14:07:00';
  it('formata "visto em DD/MM às HH:MM" no fuso local', () => {
    expect(formatFoundAt(iso)).toBe('visto em 05/11 às 14:07');
    expect(formatFoundAtDate(iso)).toBe('05/11');
  });
  it('ausente ou inválido → null', () => {
    expect(formatFoundAt(null)).toBeNull();
    expect(formatFoundAt('lixo')).toBeNull();
    expect(tripFoundAt({})).toBeNull();
  });
  it('hero usa found_at, sem a palavra "cotação"', () => {
    const trip = { travelers: 2, outboundFlight: { source: 'reference', foundAt: iso }, returnFlight: { source: 'reference', foundAt: iso } };
    const { container } = render(<FlightPriceLines trip={trip} amount={3000} confirmed={false} />);
    expect(screen.getByTestId('flight-price-basis').textContent).toContain('(Aviasales, visto em 05/11 às 14:07)');
    expect(container.textContent?.toLowerCase()).not.toContain('cotação');
  });
});

describe('link Aviasales (M10-0)', () => {
  const base = { origin: 'gru', destination: 'cdg', startDate: '2026-12-10', endDate: '2026-12-15' };
  it('2 adultos + idades 8 e 12 → 3 adultos 1 criança ("31")', () => {
    const trip = { travelers: 4, adults: 2, children: 2, childrenAges: [8, 12] };
    expect(buildAviasalesSearchLink({ ...base, trip })).toBe('https://www.aviasales.com/search/GRU1012CDG151231?marker=742814');
  });
  it('2 adultos → "2"; bebê sem criança → "201"', () => {
    expect(buildAviasalesSearchLink({ ...base, trip: { travelers: 2 } })).toContain('CDG15122?marker=');
    expect(aviasalesPaxCode({ adults: 2, children: 0, infants: 1 })).toBe('201');
  });
  it('só ida: sem a perna de volta', () => {
    expect(buildAviasalesSearchLink({ ...base, endDate: null, trip: { travelers: 1 } })).toBe('https://www.aviasales.com/search/GRU1012CDG1?marker=742814');
  });
  it('botão abre em nova aba com rel noopener', () => {
    render(<FlightLiveLink trip={{ travelers: 2, startDate: '2026-12-10', endDate: '2026-12-15' }} origin="GRU" destination="CDG" />);
    const a = screen.getByTestId('flight-live-link');
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toContain('noopener');
    expect(a.textContent).toContain('Ver preço de hoje');
  });
});
