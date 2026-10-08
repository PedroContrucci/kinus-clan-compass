// C.2 — cockpit = card + um só Ativar; sheet de confirmar voo; hotel sem reasons; SAO→FOR doméstico;
// itens que não couberam; duração "3h25".
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

vi.mock('@/integrations/kinu-beta/client', () => ({
  kinuBeta: {
    from: () => ({ insert: async () => ({ data: null, error: { code: '42501', message: 'denied' } }) }),
    auth: { getSession: async () => ({ data: { session: null }, error: null }) },
  },
}));
vi.mock('@/hooks/useFlightSearch', () => ({
  useFlightSearch: () => ({ isSuccess: false, isError: false, isLoading: false, data: [] }),
  useFlexibleFlightSearch: () => ({ isSuccess: false, isError: false, isLoading: false, data: [] }),
}));
// Casca do vaul por div (mesmo padrão do hotelSwapEvent.test): o Drawer não tem lógica.
vi.mock('@/components/ui/drawer', () => {
  const Passthrough = ({ children, ...p }: { children?: ReactNode }) => <div {...p}>{children}</div>;
  return {
    Drawer: ({ open, children }: { open?: boolean; children?: ReactNode }) => (open ? <div data-testid="drawer">{children}</div> : null),
    DrawerContent: Passthrough, DrawerHeader: Passthrough, DrawerTitle: Passthrough, DrawerFooter: Passthrough,
    DrawerClose: ({ children }: { children?: ReactNode }) => <>{children}</>,
  };
});

import { buildDraftTrip, type DraftTripInput } from '@/lib/createTrip';
import { addTrip, type StoredTrip } from '@/lib/tripStore';
import { DraftCockpit } from '@/components/cockpit/DraftCockpit';
import { TripPanel } from '@/components/cockpit/TripPanel';
import { kinuDidLines } from '@/lib/onboardingFlow';
import { offerToSelected, formatDurationHM, durationTextToMinutes } from '@/lib/flightModel';
import { buildItineraryForTrip } from '@/lib/draftItinerary';
import { tryPlaceUnplaced } from '@/lib/cockpitLines';

const input = (city: string, code: string): DraftTripInput => ({
  originCity: 'São Paulo', originAirportCode: 'GRU', destinationCity: city, destinationAirportCode: code,
  departureDate: new Date(2026, 10, 10, 12), returnDate: new Date(2026, 10, 15, 12),
  adults: 2, children: [], infants: 0, budgetTier: 'comfort', travelStyle: 'comfort', budgetAmount: 20000,
  travelInterests: ['gastronomy', 'culture'], priorities: [],
});
const draft = async (city: string, code: string, id: string) => addTrip({ ...(await buildDraftTrip(input(city, code))), id } as StoredTrip);

const wrap = (ui: ReactNode) => render(
  <QueryClientProvider client={new QueryClient()}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>,
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cockpit = (trip: any) => wrap(
  <DraftCockpit trip={trip} onSave={() => {}} onActivate={() => {}} onClose={() => {}} onUpdateTrip={() => {}} />,
);

describe('C.2 — cockpit = card + Ativar', () => {
  it('rascunho novo: card, exatamente 1 Ativar e nenhum estágio montado', async () => {
    const trip = await draft('Lisboa', 'LIS', 'c2-cockpit');
    cockpit(trip);
    expect(screen.getByText('O que o KINU fez')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /Ativar/ })).toHaveLength(1);
    expect(screen.queryByText('Defina seus voos')).toBeNull();
    expect(screen.queryByText('Roteiro gerado')).toBeNull();
    expect(screen.queryByText(/Confirmar voos e iniciar gestão operacional/)).toBeNull();
    expect(document.querySelector('[data-panel]')).toBeNull();
    expect(screen.getByText(/^Análise:/)).toBeTruthy();
  });

  it('unplacedEdits vazio não renderiza a linha; com 2, renderiza', async () => {
    const trip = await draft('Lisboa', 'LIS', 'c2-unplaced');
    const { unmount } = cockpit({ ...trip, unplacedEdits: [] });
    expect(screen.queryByTestId('unplaced-row')).toBeNull();
    unmount();
    cockpit({ ...trip, unplacedEdits: [{ id: 'day-2-x', name: 'A', day: 2 }, { id: 'day-3-y', name: 'B', day: 3 }] });
    expect(screen.getByText('2 itens seus não couberam')).toBeTruthy();
  });

  it('tentar encaixar: fora da janela R16 o item PERMANECE em unplacedEdits', async () => {
    const trip = await draft('Lisboa', 'LIS', 'c2-place');
    const last = trip.days.length;
    // Volta às 09:00 (internacional): janela do último dia = 0 h → nada cabe.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t: any = { ...trip, returnFlight: { ...trip.returnFlight, option: { ...(trip as any).returnFlight.option, departureTime: '09:00' } },
      unplacedEdits: [{ id: `day-${last}-custom-1`, name: 'Museu longo', day: last + 5 }] };
    t.days = t.days.map((d: { activities: unknown[] }, i: number) => i === last - 1 ? { ...d, activities: [{ id: 'x', name: 'Passeio', duration: '2h', timeSlot: 'morning' }] } : d);
    const r = tryPlaceUnplaced(t);
    expect(r.placed).toHaveLength(0);
    expect(r.left).toHaveLength(1);
    expect(r.trip.unplacedEdits).toHaveLength(1);
    expect(r.trip.days[last - 1].activities).toHaveLength(1);
  });
});

describe('C.2 — confirmar voo é bottom-sheet', () => {
  it('visíveis: Valor pago + Horário de ida e volta; companhia em Detalhes; Confirmar presente', async () => {
    const trip = await draft('Lisboa', 'LIS', 'c2-sheet');
    wrap(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <TripPanel trip={trip as any} onConfirm={() => {}} onUnconfirm={() => {}} onOpenAuction={() => {}} onNavigateTab={() => {}}
        pendingConfirmRequest={{ tipo: 'voo', ts: 1 }} />,
    );
    const sheet = screen.getByTestId('drawer');
    expect(within(sheet).getByText('Valor pago (R$)')).toBeTruthy();
    expect(within(sheet).getByText('Horário da ida')).toBeTruthy();
    expect(within(sheet).getByText('Horário da volta')).toBeTruthy();
    expect(within(sheet).getByRole('button', { name: 'Confirmar' })).toBeTruthy();
    const details = sheet.querySelector('details');
    expect(details).toBeTruthy();
    expect(details?.open).toBe(false);
    expect(within(details as HTMLElement).getAllByText('Companhia')).toHaveLength(2);
  });
});

describe('C.2 — hotel e voo', () => {
  it('hotel sem reasons → "tier <X> · <zona>", nunca "melhor opção"', () => {
    const l = kinuDidLines({
      destination: 'Lisboa', budgetType: 'comfort', travelers: 2, days: [],
      accommodation: { name: 'Hotel Inventado', neighborhood: 'Chiado' },
    });
    expect(l.hotel).toBe('Hotel Inventado: tier Conforto · Chiado');
    expect(l.hotel).not.toMatch(/melhor opção/);
  });

  it('SAO→FOR é doméstico e a ida pro aeroporto sai 2h antes da volta', async () => {
    const trip = await draft('Fortaleza', 'FOR', 'c2-sao');
    const offer = (from: string, to: string, at: string) => ({
      id: `${from}-${to}`, airline: 'LATAM', route: `${from} → ${to}`, isDirect: true, duration: '3h 25m', durationMinutes: 205,
      price: 900, departureTime: at.slice(11), arrivalTime: '', segments: [{ departure: { iataCode: from, at }, arrival: { iataCode: to, at } }],
    });
    const out = offerToSelected(offer('SAO', 'FOR', '2026-11-10T08:00'), { date: new Date(2026, 10, 10, 12) });
    const ret = offerToSelected(offer('FOR', 'SAO', '2026-11-15T18:00'), { date: new Date(2026, 10, 15, 12) });
    expect(out.international).toBe(false);
    expect(ret.international).toBe(false);
    expect(out.tzKnown).toBe(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const built = buildItineraryForTrip(trip as any, { outbound: out, return: ret });
    const lastDay = built.days[built.days.length - 1];
    const transfer = lastDay.activities.find((a: { name: string }) => a.name === 'Transfer para Aeroporto');
    expect(transfer?.time).toBe('16:00');
  });

  it('duração na tela: "3h25", nunca "3.42h"', () => {
    expect(formatDurationHM(205)).toBe('3h25');
    expect(formatDurationHM(180)).toBe('3h');
    expect(formatDurationHM(durationTextToMinutes('3.42h'))).toBe('3h25');
    expect(durationTextToMinutes('3h 25m')).toBe(205);
  });
});
