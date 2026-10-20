// C.7 — uma aba só: Início = suas viagens em linhas + "Planejar nova viagem" (fluxo curto).
// Rotas antigas redirecionam para /inicio com query e state; barra com 3 abas; chips do chat (0b).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

vi.mock('@/integrations/kinu-beta/client', () => ({
  kinuBeta: {
    from: () => ({ insert: async () => ({ data: null, error: { code: '42501', message: 'denied' } }) }),
    auth: { getSession: async () => ({ data: { session: null }, error: null }) },
  },
}));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u-c7', name: 'Rachel Teste', email: 'r@t.dev' }, isLoading: false }),
}));
const kinu = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
vi.mock('@/contexts/KinuAIContext', () => ({
  useKinuAI: () => kinu.value,
  tripChipLabel: (t: { destination: string }) => t.destination,
  NO_TRIP: 'none',
}));
vi.mock('@/lib/onboarding', () => ({ readCachedPrefs: () => ({}), fetchOnboardingPrefs: async () => ({}) }));
vi.mock('@/components/shared/PlacePhoto', () => ({ PlacePhoto: () => null }));
vi.mock('@/components/shared/DestinationImage', () => ({ DestinationImage: () => null }));
vi.mock('@/components/viagens/ViagensVividas', () => ({ ViagensVividas: () => <div data-testid="vividas" /> }));
vi.mock('@/components/cla/ClaSuggestHost', () => ({ openClaSuggest: () => {} }));
// A tela da viagem (2k linhas) fica de fora: aqui interessa que o Início a abre com o id certo.
vi.mock('@/pages/Viagens', () => ({
  default: ({ tripId }: { tripId?: string }) => <div data-testid="viagem-aberta">{tripId}</div>,
}));

import Inicio, { RedirectInicio } from '@/pages/Inicio';
import { orderTrips } from '@/lib/inicioTrips';
import { BottomNav } from '@/components/shared/BottomNav';
import { KinuQuickActions } from '@/components/ai/KinuQuickActions';
import { buildDraftTrip, type DraftTripInput } from '@/lib/createTrip';
import { addTrip, clearTrips, listTrips, type StoredTrip } from '@/lib/tripStore';
import { razaoLines, razaoTotals } from '@/lib/razaoLines';
import { formatTileBRL } from '@/lib/tripScope';

const input = (city: string, code: string, m: number): DraftTripInput => ({
  originCity: 'São Paulo', originAirportCode: 'GRU', destinationCity: city, destinationAirportCode: code,
  departureDate: new Date(2026, m, 10, 12), returnDate: new Date(2026, m, 15, 12),
  adults: 2, children: [], infants: 0, budgetTier: 'comfort', travelStyle: 'comfort', budgetAmount: 20000,
  travelInterests: [], priorities: [],
});
const make = async (id: string, city: string, code: string, m: number, status: string) =>
  addTrip({ ...(await buildDraftTrip(input(city, code, m))), id, status } as StoredTrip);

const Where = () => {
  const l = useLocation();
  return <div data-testid="where">{l.pathname + l.search}|{JSON.stringify(l.state)}</div>;
};
const at = (url: string | { pathname: string; search?: string; state?: unknown }) => render(
  <MemoryRouter initialEntries={[url]}>
    <Routes>
      <Route path="/inicio" element={<><Inicio /><Where /></>} />
      <Route path="/viagens" element={<RedirectInicio />} />
      <Route path="/planejar" element={<RedirectInicio />} />
      <Route path="/dashboard" element={<RedirectInicio />} />
    </Routes>
  </MemoryRouter>,
);

beforeEach(() => {
  clearTrips();
  kinu.value = { wizardPrefill: null };
});

describe('C.7 — aba Início', () => {
  it('0 viagens → a aba é o fluxo curto (sem lista vazia)', () => {
    at('/inicio');
    expect(screen.getByText('Para onde vamos?')).toBeTruthy();
    expect(screen.queryAllByTestId('trip-linha')).toHaveLength(0);
    expect(screen.queryByText('Minhas viagens')).toBeNull();
  });

  it('1 ativa + 1 rascunho → 2 linhas, ativa primeiro, Planejado = razaoTotals', async () => {
    await make('c7-draft', 'Lisboa', 'LIS', 11, 'draft');
    await make('c7-active', 'Fortaleza', 'FOR', 10, 'active');
    at('/inicio');
    expect(screen.getByTestId('inicio-estado').textContent).toBe('1 viagem ativa · 1 rascunho');
    const rows = screen.getAllByTestId('trip-linha');
    expect(rows.map((r) => r.getAttribute('data-trip-id'))).toEqual(['c7-active', 'c7-draft']);
    for (const r of rows) {
      const t = listTrips().find((x) => x.id === r.getAttribute('data-trip-id'))!;
      expect(r.textContent).toContain(`Planejado ${formatTileBRL(razaoTotals(razaoLines(t)).planned)}`);
    }
    expect(within(rows[0]).getByText('abrir ▸')).toBeTruthy();
    expect(within(rows[1]).getByText('continuar ▸')).toBeTruthy();
    expect(screen.getByText('➕ Planejar nova viagem')).toBeTruthy();
  });

  it('ordem: ativas pela data mais próxima, rascunhos, concluídas', () => {
    const t = (id: string, status: string, startDate: string) => ({ id, status, startDate }) as unknown as StoredTrip;
    const out = orderTrips([t('c', 'completed', '2025-01-01'), t('d', 'draft', '2026-01-01'), t('a2', 'active', '2026-12-01'), t('a1', 'ongoing', '2026-11-01')]);
    expect(out.map((x) => x.id)).toEqual(['a1', 'a2', 'd', 'c']);
  });

  it('"continuar ▸" e "abrir ▸" abrem a viagem pelo id (/inicio?trip=)', async () => {
    await make('c7-draft', 'Lisboa', 'LIS', 11, 'draft');
    await make('c7-active', 'Fortaleza', 'FOR', 10, 'active');
    const { unmount } = at('/inicio');
    fireEvent.click(screen.getByText('continuar ▸'));
    expect(screen.getByTestId('viagem-aberta').textContent).toBe('c7-draft');
    unmount();
    at('/inicio');
    fireEvent.click(screen.getByText('abrir ▸'));
    expect(screen.getByTestId('viagem-aberta').textContent).toBe('c7-active');
  });

  it('a tela da viagem seleciona pelo tripId e o rascunho é o DraftCockpit', () => {
    const src = readFileSync(resolve(__dirname, '../pages/Viagens.tsx'), 'utf8');
    expect(src).toMatch(/useState<SavedTrip \| null>\(\(\) => findTrip\(tripId\)\)/);
    expect(src).toMatch(/selectedTrip\.status === 'draft'[\s\S]{0,400}<DraftCockpit/);
    expect(src).not.toMatch(/renderTripList|Reiniciar Jornada/);
  });

  it('"…" → 🗑 → sim exclui a viagem', async () => {
    await make('c7-draft', 'Lisboa', 'LIS', 11, 'draft');
    await make('c7-active', 'Fortaleza', 'FOR', 10, 'active');
    at('/inicio');
    fireEvent.click(screen.getByRole('button', { name: 'Mais opções de Lisboa' }));
    fireEvent.click(screen.getByRole('button', { name: 'Excluir Lisboa' }));
    fireEvent.click(screen.getByRole('button', { name: 'sim' }));
    expect(listTrips().map((t) => t.id)).toEqual(['c7-active']);
  });

  it('/viagens e /planejar redirecionam para /inicio levando query e state', async () => {
    await make('c7-active', 'Fortaleza', 'FOR', 10, 'active');
    const { unmount } = at('/viagens?trip=c7-active');
    expect(screen.getByTestId('viagem-aberta').textContent).toBe('c7-active');
    unmount();
    const r2 = at({ pathname: '/planejar', state: { openWizardFor: 'Lisboa' } });
    expect(screen.getByTestId('where').textContent).toBe('/inicio|{"openWizardFor":"Lisboa"}');
    expect(screen.getByRole('heading', { name: 'Lisboa' })).toBeTruthy();
    r2.unmount();
    at('/dashboard?guia=1');
    expect(screen.getByTestId('where').textContent).toBe('/inicio?guia=1|null');
    expect(screen.getByText('Para onde vamos?')).toBeTruthy();
  });

  it('BottomNav com 3 itens: Início · Clã · Perfil', () => {
    render(<MemoryRouter initialEntries={['/inicio']}><BottomNav /></MemoryRouter>);
    expect(screen.getAllByRole('button').map((b) => b.querySelectorAll('span')[1]?.textContent)).toEqual(['Início', 'Clã', 'Perfil']);
  });
});

describe('C.7 (0b) — chips por viagem enquanto não há escolha', () => {
  const trips = [{ id: 't1', destination: 'Fortaleza', status: 'active' }, { id: 't2', destination: 'Lisboa', status: 'draft' }];
  const base = { sendMessage: () => {}, tripContext: null, accountTrips: trips, chooseTrip: () => {} };

  it('com mensagens na conversa e sem escolha: chips por viagem + "Pergunta geral"', () => {
    kinu.value = { ...base, chosenTripId: null, messages: [{ id: 'm1', role: 'user', content: 'oi' }, { id: 'm2', role: 'assistant', content: 'qual?' }] };
    render(<KinuQuickActions />);
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['✈️Fortaleza', '📝Lisboa', '💬Pergunta geral']);
  });

  it('escolha feita na sessão: os chips de escolha somem', () => {
    kinu.value = { ...base, chosenTripId: 't1', messages: [{ id: 'm1', role: 'assistant', content: 'Beleza' }] };
    render(<KinuQuickActions />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('cada envio recarrega a conta dos chips (viagem criada com o chat aberto entra)', () => {
    const src = readFileSync(resolve(__dirname, '../contexts/KinuAIContext.tsx'), 'utf8');
    expect(src).toMatch(/const visible = accountTripsOf\(allTrips\);[\s\S]{0,200}setAccountTrips\(visible\)/);
  });
});

describe('C.7 (D3) — teto do fluxo curto vira orçamento do usuário', () => {
  it('cap → budgetAmount; budgetSource "user" não é reescrito pelo envelope do plano', async () => {
    const { buildFlowInput } = await import('@/lib/onboardingFlow');
    const { followPlanEnvelope } = await import('@/lib/planTotals');
    const base = { city: 'Lisboa', origin: 'São Paulo', from: new Date(2026, 11, 10, 12), to: new Date(2026, 11, 15, 12), adults: 2, children: 0, tier: 'comfort' as const };
    const capped = buildFlowInput({ ...base, cap: 12345, interests: ['gastronomy'] });
    expect(capped.budgetAmount).toBe(12345);
    expect(capped.travelInterests).toEqual(['gastronomy']);
    expect(buildFlowInput(base).budgetAmount).not.toBe(12345);
    const trip = { ...(await buildDraftTrip(capped)), budgetSource: 'user' } as StoredTrip;
    expect(followPlanEnvelope(trip).budget).toBe(trip.budget);
  });
});
