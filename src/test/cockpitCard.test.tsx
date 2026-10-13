// C.2 — cockpit = card + um só Ativar; sheet de confirmar voo; hotel sem reasons; SAO→FOR doméstico;
// itens que não couberam; duração "3h25".
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

// Toda chamada do hook registra o `enabled` (5º arg): "nenhuma busca" = nenhum true.
const searchEnabled = vi.hoisted(() => [] as unknown[]);

vi.mock('@/integrations/kinu-beta/client', () => ({
  kinuBeta: {
    from: () => ({ insert: async () => ({ data: null, error: { code: '42501', message: 'denied' } }) }),
    auth: { getSession: async () => ({ data: { session: null }, error: null }) },
  },
}));
vi.mock('@/hooks/useFlightSearch', () => ({
  useFlightSearch: (...a: unknown[]) => { searchEnabled.push(a[4]); return { isSuccess: false, isError: false, isLoading: false, data: [] }; },
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
import { offerToSelected, formatDurationHM, durationTextToMinutes, writeFlightsThrough } from '@/lib/flightModel';
import { pickBest, flightSearchKey } from '@/lib/flightRanking';
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

  it('hotel cujo nome já traz a zona não a repete (sem acento/caixa)', () => {
    const l = kinuDidLines({
      destination: 'Lisboa', budgetType: 'comfort', travelers: 2, days: [],
      accommodation: { name: 'Hotel Gran Marquise — Meireles, Fortaleza', neighborhood: 'meirelés' },
    });
    expect(l.hotel).toBe('Hotel Gran Marquise — Meireles, Fortaleza: tier Conforto');
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

describe('C.2.1 — escolha do usuário persiste', () => {
  it('escolher ida → fechar pela linha → reabrir: mesma escolha, chosenBy user, nenhuma busca nova', async () => {
    const base = await draft('Fortaleza', 'FOR', 'c21-persist');
    const leg = (id: string, from: string, to: string, at: string, price: number, date: Date) => offerToSelected({
      id, airline: id.split('-')[0], route: `${from} → ${to}`, isDirect: true, duration: '3h 25m', durationMinutes: 205,
      price, departureTime: '', arrivalTime: '', segments: [{ departure: { iataCode: from, at }, arrival: { iataCode: to, at } }],
    }, { date });
    const d1 = new Date(2026, 10, 10, 12);
    const outs = [leg('Gol-0300', 'GRU', 'FOR', '2026-11-10T23:35', 631, d1), leg('Azul-2105', 'GRU', 'FOR', '2026-11-10T17:40', 676, d1)];
    const rets = [leg('Azul-volta', 'FOR', 'GRU', '2026-11-15T15:00', 897, new Date(2026, 10, 15, 12))];
    const key = flightSearchKey('GRU', 'FOR', String(base.startDate), String(base.endDate));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const start: any = writeFlightsThrough({ ...base, kinuFlightSearch: { key, searchedAt: '', outbound: outs, return: rets } } as never, pickBest(outs)!, pickBest(rets)!);
    expect(start.outboundFlight.option.id).toBe('Azul-2105');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const latest: { trip: any } = { trip: start };
    const Host = () => {
      const [t, setT] = useState(start);
      latest.trip = t;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return <DraftCockpit trip={t} onSave={(n) => setT(n)} onActivate={() => {}} onClose={() => {}} onUpdateTrip={(u) => setT((p: any) => u(p))} />;
    };
    searchEnabled.length = 0;
    wrap(<Host />);
    const row = () => screen.getByRole('button', { name: 'trocar ✈️' });
    const card = (id: string) => Array.from(document.querySelectorAll('div.cursor-pointer')).find(c => c.textContent?.includes(id)) as HTMLElement;

    fireEvent.click(row());
    expect(within(card('Gol')).getByTestId('outside-window').textContent).toBe('fora da janela · chega 03:00 (+1)');
    fireEvent.click(card('Gol'));
    // Gravou na hora, antes de fechar.
    expect(latest.trip.outboundFlight).toMatchObject({ chosenBy: 'user', option: { id: 'Gol-0300' } });
    expect(latest.trip.returnFlight).toMatchObject({ chosenBy: 'kinu', option: { id: 'Azul-volta' } });

    fireEvent.click(row()); // fecha pela linha → replaneja
    expect(document.querySelector('[data-panel="flight"]')).toBeNull();
    expect(screen.getByText('Você escolheu: Gol · direto · chega 03:00 (+1) · R$ 631/pessoa')).toBeTruthy();

    fireEvent.click(row()); // reabre
    expect(latest.trip.outboundFlight).toMatchObject({ chosenBy: 'user', option: { id: 'Gol-0300', price: 631 } });
    expect(within(card('Gol')).getByText('Selecionado')).toBeTruthy();
    expect(screen.getByText('Voltar à sugestão do KINU')).toBeTruthy();
    expect(searchEnabled.length).toBeGreaterThan(0);
    expect(searchEnabled.some(Boolean)).toBe(false);

    fireEvent.click(screen.getByText('Voltar à sugestão do KINU'));
    expect(latest.trip.outboundFlight).toMatchObject({ chosenBy: 'kinu', option: { id: 'Azul-2105' } });
  });
});
