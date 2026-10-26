// C.5e — o painel "ver ▸" do roteiro no rascunho em blocos (RoteiroDia): linhas fechadas, sem ☐,
// ↻ (swapCandidates) e 🗑 gravando em trip.days, rota lazy com um mapa por vez.
// C.7 (0a) — a mesma tira de dias da viagem ativa (EnhancedDayTimeline): um dia por vez.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
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
// Mapa de mentira: conta montagens (rota lazy = nenhum mapa antes de abrir).
vi.mock('@/components/cockpit/DailyRouteMap', () => ({
  DailyRouteMap: () => <div data-testid="mapa" />,
}));

import { buildDraftTrip, type DraftTripInput } from '@/lib/createTrip';
import { addTrip, getTrip, type StoredTrip } from '@/lib/tripStore';
import { DraftCockpit } from '@/components/cockpit/DraftCockpit';
import { RoteiroRascunho } from '@/components/cockpit/RoteiroRascunho';
import { removeDraftItem, recomputeDraftFinances } from '@/lib/draftRoteiro';
import { roteiroKind } from '@/lib/roteiroBlocks';
import type { TripActivity } from '@/types/trip';

const input = (city: string, code: string): DraftTripInput => ({
  originCity: 'São Paulo', originAirportCode: 'GRU', destinationCity: city, destinationAirportCode: code,
  departureDate: new Date(2026, 10, 10, 12), returnDate: new Date(2026, 10, 15, 12),
  adults: 2, children: [], infants: 0, budgetTier: 'comfort', travelStyle: 'comfort', budgetAmount: 20000,
  travelInterests: ['gastronomy', 'culture'], priorities: [],
});
const draft = async (id: string) => addTrip({ ...(await buildDraftTrip(input('Fortaleza', 'FOR'))), id } as StoredTrip);
const wrap = (ui: ReactNode) => render(
  <QueryClientProvider client={new QueryClient()}><MemoryRouter>{ui}</MemoryRouter></QueryClientProvider>,
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const allItems = (t: any): TripActivity[] => t.days.flatMap((d: { activities: TripActivity[] }) => d.activities);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const firstStop = (t: any) => {
  for (const d of t.days) {
    const a = d.activities.find((x: TripActivity) => roteiroKind(x) === 'passeio' && x.status !== 'cancelled');
    if (a) return { day: d.day as number, a: a as TripActivity };
  }
  throw new Error('sem passeio');
};
const goDay = (n: number) => fireEvent.click(screen.getByRole('button', { name: new RegExp(`^D${n}\\b`) }));
const dayOf = (t: { days: { day: number; activities: TripActivity[] }[] }, id: string) =>
  t.days.find((d) => d.activities.some((x) => x.id === id))!.day;
const rowOf = (name: string) =>
  [...document.querySelectorAll<HTMLElement>('[data-roteiro-line="item"]')].find((el) => el.textContent?.includes(name))!;

describe('C.5e — roteiro do rascunho em blocos', () => {
  it('"ver 🗺️" no cockpit → linhas fechadas do RoteiroDia, sem ☐, sem cards grandes', async () => {
    const trip = await draft('c5e-cockpit');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wrap(<DraftCockpit trip={trip as any} onSave={() => {}} onActivate={() => {}} onClose={() => {}} onUpdateTrip={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'ver 🗺️' }));
    const panel = document.querySelector('[data-panel="itinerary"]') as HTMLElement;
    const rows = panel.querySelectorAll('[data-roteiro-line="item"]');
    expect(rows.length).toBe(trip.days[0].activities.length);
    expect(panel.querySelectorAll('[data-roteiro-line="header"]').length).toBe(1);
    expect(within(panel).queryAllByRole('checkbox')).toHaveLength(0);
    expect(within(panel).getAllByRole('button', { name: /^D\d+\b/ })).toHaveLength(trip.days.length);
    expect(within(panel).queryAllByRole('button', { expanded: true })).toHaveLength(0);
    expect(within(panel).getByRole('button', { name: /Regerar roteiro/ })).toBeTruthy();
    for (const gone of [/ORÇAMENTO ESTIMADO/, /Roteiro gerado/, /Adicionar atividade/, /CALENDÁRIO/]) {
      expect(within(panel).queryByText(gone)).toBeNull();
    }
    expect(within(panel).queryByRole('button', { name: /^Salvar/ })).toBeNull();
    expect(screen.queryByTestId('mapa')).toBeNull();
  });

  it('linha aberta: Trocar + Remover; sem Marcar como fechado, Confirmar ou Mais detalhes', async () => {
    const trip = await draft('c5e-actions');
    wrap(<RoteiroRascunho trip={trip} />);
    const { a, day } = firstStop(trip);
    goDay(day);
    fireEvent.click(within(rowOf(a.name)).getByRole('button', { expanded: false }));
    const row = rowOf(a.name);
    expect(within(row).getByRole('button', { name: /Trocar/ })).toBeTruthy();
    expect(within(row).getByRole('button', { name: /Remover/ })).toBeTruthy();
    expect(within(row).queryByRole('button', { name: /Marcar como fechado|^Confirmar|Mais detalhes/ })).toBeNull();
    // Voo/hotel/logística: nunca 🗑 nem Confirmar.
    const voo = allItems(trip).find((x) => x.category === 'voo')!;
    goDay(dayOf(trip, voo.id));
    fireEvent.click(within(rowOf(voo.name)).getByRole('button', { expanded: false }));
    expect(within(rowOf(voo.name)).queryByRole('button', { name: /Remover|Confirmar|Trocar/ })).toBeNull();
  });

  it('↻ abre as candidatas; tocar troca o item e grava em trip.days', async () => {
    const trip = await draft('c5e-swap');
    wrap(<RoteiroRascunho trip={trip} />);
    const { a, day } = firstStop(trip);
    goDay(day);
    fireEvent.click(within(rowOf(a.name)).getByRole('button', { expanded: false }));
    fireEvent.click(within(rowOf(a.name)).getByRole('button', { name: /Trocar/ }));
    const options = within(screen.getByTestId('swap-panel')).queryAllByRole('button');
    expect(options.length).toBeGreaterThan(0);
    const name = (options[0].querySelector('p')?.textContent ?? '').split(' · ')[0];
    fireEvent.click(options[0]);
    expect(screen.queryByTestId('swap-panel')).toBeNull();
    expect(rowOf(name)).toBeTruthy();
    const saved = getTrip('c5e-swap')!;
    expect(allItems(saved).some((x) => x.name === name)).toBe(true);
    expect(allItems(saved).some((x) => x.id === a.id)).toBe(false);
  });

  it('🗑 remove o item, grava e recalcula os baldes (mesma conta do stage)', async () => {
    const trip = await draft('c5e-remove');
    const before = recomputeDraftFinances(trip);
    wrap(<RoteiroRascunho trip={trip} />);
    const stop = allItems(trip).find((x) => roteiroKind(x) === 'passeio' && x.cost > 0 && x.status !== 'cancelled')!;
    goDay(dayOf(trip, stop.id));
    fireEvent.click(within(rowOf(stop.name)).getByRole('button', { expanded: false }));
    fireEvent.click(within(rowOf(stop.name)).getByRole('button', { name: /Remover/ }));
    const saved = getTrip('c5e-remove')!;
    expect(allItems(saved).some((x) => x.id === stop.id)).toBe(false);
    expect(saved.finances!.categories.tours.planned).toBe(before.finances.categories.tours.planned - stop.cost);
    expect(removeDraftItem(trip, stop.id).finances.planned).toBe(saved.finances!.planned);
  });

  it('rota lazy: nenhum mapa fechado; abrir monta 1; trocar de dia fecha a rota', async () => {
    const trip = await draft('c5e-route');
    wrap(<RoteiroRascunho trip={trip} />);
    expect(screen.queryByTestId('mapa')).toBeNull();
    const withRoute = trip.days.filter((d) => d.activities.filter((x) => ['passeio', 'restaurante'].includes(roteiroKind(x))).length >= 2);
    expect(withRoute.length).toBeGreaterThan(1);
    goDay(withRoute[0].day);
    fireEvent.click(screen.getByRole('button', { name: /→ }));
    expect(screen.getAllByTestId('mapa')).toHaveLength(1);
    goDay(withRoute[1].day);
    expect(screen.queryByTestId('mapa')).toBeNull();
    expect(screen.getByRole('button', { name: /→ }).getAttribute('aria-expanded')).toBe('false');
  });

  it('0a: a tira troca o dia — um RoteiroDia por vez, o do D tocado', async () => {
    const trip = await draft('c7-tira');
    wrap(<RoteiroRascunho trip={trip} />);
    const last = trip.days[trip.days.length - 1];
    goDay(last.day);
    expect(document.querySelectorAll('[data-roteiro-line="header"]')).toHaveLength(1);
    expect(document.querySelectorAll('[data-roteiro-line="item"]')).toHaveLength(last.activities.length);
  });
});
