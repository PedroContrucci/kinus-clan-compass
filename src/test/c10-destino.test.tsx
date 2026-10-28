// C.10 — escolha do destino (continente → país → cidade) + duas portas de planejar.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { DESTINATION_CATALOG, REGIONS } from '@/data/destinationCatalog';
import { CURATED_CITIES } from '@/lib/curatedCities';
import { interestsFor } from '@/lib/interestsFor';
import {
  agentCity, nearestCatalogCities, pickerCities, pickerCountries, pickerRegions, planFromAgent, searchDestinations,
} from '@/lib/destinationPicker';
import { buildFlowInput } from '@/lib/onboardingFlow';
import { addTrip, clearTrips, listTrips, type StoredTrip } from '@/lib/tripStore';
import { PlanDoors } from '@/components/onboarding/PlanDoors';

const sb = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke: sb.invoke } } }));
vi.mock('@/lib/kinuAuthHeader', () => ({ kinuAuthHeaders: async () => ({}) }));
vi.mock('@/lib/kinuEvents', () => ({ trackEvent: () => {} }));
vi.mock('@/lib/onboarding', () => ({ readCachedPrefs: () => ({ home_city: 'Recife' }), fetchOnboardingPrefs: async () => ({}) }));
const spy = vi.hoisted(() => ({ inputs: [] as unknown[] }));
vi.mock('@/lib/createTrip', async (orig) => {
  const real = await orig<typeof import('@/lib/createTrip')>();
  return { ...real, buildDraftTrip: vi.fn(async (i: Parameters<typeof real.buildDraftTrip>[0]) => { spy.inputs.push(i); return real.buildDraftTrip(i); }) };
});

const { KinuAIProvider, useKinuAI } = await import('@/contexts/KinuAIContext');

const catalogCities = () => Object.values(DESTINATION_CATALOG).flat().flatMap((c) => c.cities.map((x) => x.name));

describe('C.10 — seletor a partir do catálogo', () => {
  it('contagens = catálogo (82 cidades, 41 países, 6 regiões) + Porto Seguro', () => {
    expect(pickerRegions().map((r) => r.id)).toEqual(REGIONS.map((r) => r.id));
    const total = pickerRegions().reduce((s, r) => s + r.count, 0);
    expect(total).toBe(catalogCities().length + 1);
    const countries = REGIONS.flatMap((r) => pickerCountries(r.id).map((c) => c.country));
    expect(new Set(countries).size).toBe(new Set(Object.values(DESTINATION_CATALOG).flat().map((c) => c.country)).size);
    for (const r of REGIONS) expect(pickerCountries(r.id).length).toBe(DESTINATION_CATALOG[r.id].length);
    const brasil = pickerCities('Brasil', 'Brasil').map((c) => c.name);
    expect(brasil).toContain('Porto Seguro');
  });

  it('as 21 curadas aparecem marcadas "✓ curado" e no topo do país', () => {
    const all = REGIONS.flatMap((r) => pickerCountries(r.id).flatMap((c) => c.cities));
    expect(all.filter((c) => c.curated).map((c) => c.name).sort()).toEqual([...CURATED_CITIES].sort());
    const fr = pickerCities('Europa', 'França');
    expect(fr[0]).toEqual({ name: 'Paris', curated: true });
    expect(fr.slice(1).every((c) => !c.curated)).toBe(true);
  });

  it('busca filtra por cidade ou país, sem acento', () => {
    expect(searchDestinations('lisb').map((h) => h.name)).toEqual(['Lisboa']);
    expect(searchDestinations('toquio').map((h) => h.name)).toContain('Tóquio');
    expect(searchDestinations('italia').map((h) => h.name).sort()).toEqual(['Florença', 'Milão', 'Roma', 'Veneza']);
    expect(searchDestinations('  ')).toEqual([]);
  });
});

describe('C.10 — seletor no fluxo curto', () => {
  it('continente → país → cidade alimenta o mesmo campo da grade', async () => {
    const { MemoryRouter } = await import('react-router-dom');
    const { FirstTripFlow } = await import('@/components/onboarding/FirstTripFlow');
    render(<MemoryRouter><FirstTripFlow userId="u" /></MemoryRouter>);
    fireEvent.click(screen.getByText(/Europa/));
    fireEvent.click(screen.getByText(/Portugal/));
    expect(screen.getByTestId('picker-cities').textContent).toContain('✓ curado');
    fireEvent.click(screen.getByText('Lisboa'));
    expect(await screen.findByRole('heading', { name: 'Lisboa' })).toBeTruthy();
  });

  it('a busca no topo também escolhe a cidade', async () => {
    const { MemoryRouter } = await import('react-router-dom');
    const { FirstTripFlow } = await import('@/components/onboarding/FirstTripFlow');
    render(<MemoryRouter><FirstTripFlow userId="u" /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText('Buscar destino'), { target: { value: 'milao' } });
    fireEvent.click(screen.getByText('Milão'));
    expect(await screen.findByRole('heading', { name: 'Milão' })).toBeTruthy();
  });
});

describe('C.10 — porta KINU AI', () => {
  const params = { destino: 'lisboa', data_ida: '2026-12-10', data_volta: '2026-12-15', viajantes: 2, estilo: 'econômico', interesses: ['gastronomia', 'surf no deserto'], orcamento_total: 15000 };

  it('planFromAgent = buildFlowInput do fluxo (origem do perfil, tier, teto, prioridades ⊂ interestsFor)', () => {
    const plan = planFromAgent(params, 'Recife')!;
    expect(plan.origin).toEqual({ city: 'Recife', source: 'profile' });
    const flow = buildFlowInput({ city: 'Lisboa', origin: 'Recife', from: new Date(2026, 11, 10), to: new Date(2026, 11, 15), adults: 2, children: 0, tier: 'economic', interests: ['gastronomy'], cap: 15000 });
    expect(plan.input).toEqual(flow);
    const offered = interestsFor('Lisboa').map((c) => c.id);
    expect(plan.input.travelInterests.every((i) => offered.includes(i))).toBe(true);
    expect(planFromAgent(params, undefined)!.origin).toEqual({ city: 'São Paulo', source: 'default' });
    expect(planFromAgent({ ...params, data_ida: 'amanhã' }, null)).toBeNull();
  });

  it('fora da lista: sem cidade do agente; alternativas do catálogo, mesmo país primeiro', () => {
    expect(agentCity('Milão')).toBeNull();
    expect(nearestCatalogCities('Milão')).toEqual(['Roma', 'Paris', 'Lisboa']);
    const far = nearestCatalogCities('Atlantis');
    expect(far).toHaveLength(3);
    expect(far.every((c) => CURATED_CITIES.includes(c))).toBe(true);
  });

  type Ctx = ReturnType<typeof useKinuAI>;
  const mount = () => {
    const ref: { current: Ctx | null } = { current: null };
    const Probe = () => { const c = useKinuAI(); useEffect(() => { ref.current = c; }); return null; };
    render(<KinuAIProvider><Probe /></KinuAIProvider>);
    return ref;
  };

  beforeEach(() => { clearTrips(); spy.inputs = []; sb.invoke.mockReset(); });

  it('openPlanning abre o chat com fala DO ASSISTENTE, sem chamar a function', () => {
    const ref = mount();
    act(() => ref.current!.openPlanning());
    expect(ref.current!.isOpen).toBe(true);
    expect(ref.current!.messages).toHaveLength(1);
    expect(ref.current!.messages[0].role).toBe('assistant');
    expect(sb.invoke).not.toHaveBeenCalled();
  });

  it('C.10.1: com 2 viagens, a porta de planejar fixa NO_TRIP e o account vai "geral" (sem gate)', async () => {
    const t = (id: string, destination: string) => ({
      id, status: 'active', destination, country: 'Brasil', emoji: '🏖️', startDate: '2026-11-10', endDate: '2026-11-15',
      budget: 6000, budgetType: 'total', travelers: 2, priorities: [], progress: 0, days: [],
    } as unknown as StoredTrip);
    addTrip(t('trip-for', 'Fortaleza')); addTrip(t('trip-lis', 'Lisboa'));
    sb.invoke.mockResolvedValue({ data: { message: 'Bora.' }, error: null });
    const ref = mount();
    act(() => ref.current!.openPlanning());
    expect(ref.current!.chosenTripId).toBe('none');
    await act(async () => { await ref.current!.sendMessage('quero viajar em dezembro'); });
    const body = sb.invoke.mock.calls[0][1].body as { account: { activeTripId?: string; trips: unknown[] } };
    expect(body.account.trips).toHaveLength(2);
    expect(body.account.activeTripId).toBe('none');
  });

  it('criar_viagem → buildDraftTrip (mock) com os campos do fluxo → rascunho na conta + navegação', async () => {
    sb.invoke.mockResolvedValue({ data: { message: 'Montando.', proposedActions: [{ type: 'criar_viagem', params }] }, error: null });
    const ref = mount();
    await act(async () => { await ref.current!.sendMessage('Lisboa de 10 a 15/12, nós dois, econômico, R$ 15 mil'); });
    const msg = ref.current!.messages.find((m) => m.proposedActions)!;
    await act(async () => { ref.current!.applyProposedAction(msg.id, 0); });
    await waitFor(() => expect(listTrips()).toHaveLength(1));
    expect(spy.inputs[0]).toEqual(planFromAgent(params, 'Recife')!.input);
    const t = listTrips()[0] as Record<string, unknown>;
    expect(t.destination).toBe('Lisboa');
    expect(t.createdVia).toBe('kinu');
    expect(t.budgetSource).toBe('user');
    expect(t.originSource).toBe('profile');
    expect(t.onboardingFlow).toBe('v2');
    expect(ref.current!.pendingNavigation?.tripId).toBe(t.id);
  });

  it('criar_viagem fora da lista → recusa com alternativas, sem rascunho', async () => {
    sb.invoke.mockResolvedValue({ data: { message: 'ok', proposedActions: [{ type: 'criar_viagem', params: { ...params, destino: 'Milão' } }] }, error: null });
    const ref = mount();
    await act(async () => { await ref.current!.sendMessage('Milão em dezembro'); });
    const msg = ref.current!.messages.find((m) => m.proposedActions)!;
    await act(async () => { ref.current!.applyProposedAction(msg.id, 0); });
    const last = ref.current!.messages.at(-1)!;
    expect(last.role).toBe('assistant');
    expect(last.content).toContain('Ainda não cubro Milão');
    expect(last.content).toContain('Roma, Paris, Lisboa');
    expect(spy.inputs).toHaveLength(0);
    expect(listTrips()).toHaveLength(0);
  });
});

describe('C.10 — duas portas', () => {
  it('renderiza 🧭 interface e 💬 KINU AI', () => {
    const onI = vi.fn(), onA = vi.fn();
    render(<PlanDoors onInterface={onI} onAgent={onA} />);
    fireEvent.click(screen.getByText('🧭 Escolher na tela'));
    fireEvent.click(screen.getByText('💬 Conversar com o KINU AI'));
    expect(onI).toHaveBeenCalledOnce();
    expect(onA).toHaveBeenCalledOnce();
  });
});
