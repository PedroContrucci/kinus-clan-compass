import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { buildCloseLinks, CLOSE_DISCLOSURE } from '@/lib/offersLinks';
import { prontidao, requiresBooking } from '@/lib/roteiroBlocks';
import { applyOriginChange, returnForDeparture } from '@/lib/onboardingFlow';
import { RoteiroDia } from '@/components/cockpit/RoteiroDia';
import { KinuDidCard } from '@/components/onboarding/KinuDidCard';
import type { TripActivity } from '@/types/trip';

// O banco ainda não tem online/partner — entradas de teste somadas ao gerado real.
vi.mock('@/data/generated/booking', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/data/generated/booking')>();
  return {
    CURATED_BOOKING: {
      ...real.CURATED_BOOKING,
      'tst-online': { mode: 'online', url: 'https://exemplo.com/reserva' },
      'tst-walk': { mode: 'walk_in', note: 'Sem reserva' },
    },
  };
});

const ida = new Date('2026-11-10T12:00:00');
const volta = new Date('2026-11-15T12:00:00');
const act = (id: string, over: Partial<TripActivity> = {}): TripActivity => ({
  id, time: '10:00', name: 'Passeio de buggy', description: '', duration: '', cost: 200, type: 'activity', status: 'planned', category: 'passeio', ...over,
});

describe('C.8 — buildCloseLinks', () => {
  it('voo: rota + datas + pax em todas as URLs; Kiwi parceiro; LATAM só quando é a cia', () => {
    const links = buildCloseLinks('voo', { origin: 'GRU', destination: 'FOR', start: ida, end: volta, pax: 2, airline: 'LATAM Airlines' });
    expect(links.map((l) => [l.provider, l.label, l.partner])).toEqual([
      ['Kiwi', 'parceiro KINU', true], ['Decolar', 'link direto', false], ['Skyscanner', 'link direto', false], ['LATAM', 'link direto', false],
    ]);
    for (const l of links) {
      const u = decodeURIComponent(decodeURIComponent(l.url));
      expect(u).toMatch(/GRU/i);
      expect(u).toMatch(/FOR/i);
      expect(u).toMatch(/2026-11-10|261110/);
      expect(u).toMatch(/2026-11-15|261115/);
      expect(u).toMatch(/adults=2|adt=2|\/2\/0\/0$/);
    }
    // C.9 (0a): Decolar com o padrão datado; Google Flights (URL por texto) não volta.
    expect(links.find((l) => l.provider === 'Decolar')!.url)
      .toBe('https://www.decolar.com/shop/flights/results/roundtrip/GRU/FOR/2026-11-10/2026-11-15/2/0/0');
    expect(links.some((l) => /google/.test(l.url))).toBe(false);
    // Azul/GOL/TAP: sem padrão datado conhecido → fora (nunca a home).
    expect(buildCloseLinks('voo', { origin: 'GRU', destination: 'FOR', start: ida, end: volta, airline: 'Azul' }).map((l) => l.provider))
      .toEqual(['Kiwi', 'Decolar', 'Skyscanner']);
    expect(buildCloseLinks('voo', { origin: 'GRU', destination: 'FOR', start: ida })).toEqual([]);
  });

  it('hotel: cidade + datas + pax (+ nome quando existe), todos "link direto"', () => {
    const links = buildCloseLinks('hotel', { city: 'Fortaleza', hotelName: 'Gran Marquise', start: ida, end: volta, pax: 2 });
    expect(links.map((l) => l.provider)).toEqual(['Booking', 'Hoteis.com', 'Airbnb']);
    expect(links.every((l) => l.label === 'link direto' && !l.partner)).toBe(true);
    for (const l of links) {
      expect(l.url).toContain('2026-11-10');
      expect(l.url).toContain('2026-11-15');
      expect(l.url).toMatch(/adults=2/);
    }
    expect(decodeURIComponent(links[0].url)).toContain('Gran Marquise Fortaleza');
    expect(decodeURIComponent(links[1].url)).toContain('Gran Marquise Fortaleza');
    expect(buildCloseLinks('hotel', { city: 'Fortaleza' })).toEqual([]);
  });

  it('passeio: booking_url primeiro; Klook/GetYourGuide como busca; walk_in/phone/null → vazio', () => {
    const links = buildCloseLinks('passeio', { city: 'Fortaleza', name: 'Beach Park', mode: 'online', bookingUrl: 'https://beachpark.com.br', start: ida });
    expect(links.map((l) => [l.provider, l.label])).toEqual([['Site oficial', 'site oficial'], ['Klook', 'link direto'], ['GetYourGuide', 'link direto']]);
    expect(links[0].url).toBe('https://beachpark.com.br');
    expect(decodeURIComponent(links[1].url)).toContain('query=Beach Park Fortaleza');
    expect(links[2].url).toContain('date_from=2026-11-10');
    for (const mode of ['walk_in', 'phone', 'included', null]) {
      expect(buildCloseLinks('passeio', { city: 'Fortaleza', name: 'X', mode, bookingUrl: 'https://x' })).toEqual([]);
    }
  });
});

describe('C.8 — Prontidão = voo + hotel + o que exige reserva', () => {
  it('1 voo + 1 hotel + 2 passeios (1 online, 1 walk_in) → denominador 3', () => {
    const trip = {
      flights: { outbound: { status: 'confirmed' } },
      accommodation: { status: 'pending' },
      days: [{ day: 1, activities: [act('day-1-tst-online'), act('day-1-tst-walk')] }],
      checklist: [{ id: 'x', checked: true }],
    };
    expect(requiresBooking(act('day-1-tst-online'))).toBe(true);
    expect(requiresBooking(act('day-1-tst-walk'))).toBe(false);
    expect(prontidao(trip)).toEqual({ done: 1, total: 3, pct: 33 });
  });
});

describe('C.8 — "Onde fechar ▸" no passeio pago do Roteiro', () => {
  it('site oficial primeiro, linha de transparência, "Fechou?" só depois do clique → onCheck', () => {
    const a = act('day-2-tst-online');
    const onCheck = vi.fn();
    const { container } = render(
      <RoteiroDia dayNumber={2} date={ida} activities={[a]} destination="Fortaleza" liveLegs={null}
        expandedIds={new Set([a.id])} onToggleExpand={() => {}} onCollapseAll={() => {}}
        renderMap={null} routeOpen={false} onRouteToggle={() => {}}
        onCheck={onCheck} onSwap={vi.fn()} />,
    );
    const row = container.querySelector<HTMLElement>('[data-roteiro-line="item"]')!;
    expect(within(row).queryByRole('link', { name: /Reservar no site/ })).toBeNull();
    fireEvent.click(within(row).getByRole('button', { name: /Onde fechar/ }));
    expect(within(row).getByText(CLOSE_DISCLOSURE)).toBeTruthy();
    const links = within(row).getAllByRole('link');
    expect(links[0].getAttribute('href')).toBe('https://exemplo.com/reserva');
    expect(links[0].getAttribute('target')).toBe('_blank');
    expect(within(row).queryByRole('button', { name: /Fechou\?/ })).toBeNull();
    fireEvent.click(links[1]);
    fireEvent.click(within(row).getByRole('button', { name: /Fechou\? Registrar valor pago/ }));
    expect(onCheck).toHaveBeenCalledWith(a, 0);
    expect(within(row).getByRole('button', { name: 'Marcar como fechado' })).toBeTruthy();
  });
});

describe('C.8 — 0b calendário e 0c trocar origem/orçamento', () => {
  it('volta: sugestão ida + 5; editada mantém a duração; nunca antes da ida', () => {
    const prev = { from: ida, to: volta, toEdited: false };
    const novaIda = new Date('2027-03-02T12:00:00');
    expect(returnForDeparture(novaIda, prev).toISOString().slice(0, 10)).toBe('2027-03-07');
    const editada = { from: ida, to: new Date('2026-11-18T12:00:00'), toEdited: true };
    expect(returnForDeparture(novaIda, editada).toISOString().slice(0, 10)).toBe('2027-03-10');
    expect(returnForDeparture(novaIda, { from: volta, to: ida, toEdited: true }) >= novaIda).toBe(true);
  });

  it('trocar origem reescreve origem/código/pontas das pernas e limpa os voos escolhidos', () => {
    const t = applyOriginChange({
      origin: 'São Paulo', originAirportCode: 'GRU', originSource: 'default',
      flights: { outbound: { origin: 'GRU', destination: 'FOR' }, return: { origin: 'FOR', destination: 'GRU' } },
      outboundFlight: { price: 1 }, returnFlight: { price: 2 },
    }, 'Curitiba');
    expect(t).toMatchObject({ origin: 'Curitiba', originAirportCode: 'CWB', originSource: 'user', outboundFlight: undefined, returnFlight: undefined });
    expect(t.flights.outbound).toMatchObject({ origin: 'CWB', destination: 'FOR' });
    expect(t.flights.return).toMatchObject({ origin: 'FOR', destination: 'CWB' });
  });

  it('card: "trocar" da origem abre o seletor; "trocar" do 💰 abre o editor', () => {
    const onChangeOrigin = vi.fn();
    const onEditBudget = vi.fn();
    render(<MemoryRouter><KinuDidCard trip={{ destination: 'Fortaleza', origin: 'São Paulo', days: [] }} onActivate={() => {}} onUpdateTrip={() => {}}
      onChangeOrigin={onChangeOrigin} onEditBudget={onEditBudget} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'trocar 🛫' }));
    fireEvent.click(within(screen.getByRole('listbox', { name: 'Cidade de origem' })).getByRole('option', { name: 'Curitiba' }));
    expect(onChangeOrigin).toHaveBeenCalledWith('Curitiba');
    fireEvent.click(screen.getByRole('button', { name: 'trocar 💰' }));
    expect(onEditBudget).toHaveBeenCalled();
  });
});
