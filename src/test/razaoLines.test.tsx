// C.5c — Financeiro como livro-razão: linhas, origens, status, ações e Σ = tiles.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { buildDraftTrip, type DraftTripInput } from '@/lib/createTrip';
import { razaoLines, razaoTotals, razaoBreakdown, razaoDesembolso } from '@/lib/razaoLines';
import { planBreakdown, reserveFor } from '@/lib/planTotals';
import { computeBuckets, type ItineraryDay } from '@/lib/itineraryEngine';
import { FinanceiroRazao, FinanceiroTiles, QuandoDinheiroSai } from '@/components/cockpit/FinanceiroRazao';

const input: DraftTripInput = {
  originCity: 'São Paulo', originAirportCode: 'GRU', destinationCity: 'Fortaleza', destinationAirportCode: 'FOR',
  departureDate: new Date(2026, 10, 10, 12), returnDate: new Date(2026, 10, 15, 12),
  adults: 2, children: [], infants: 0, budgetTier: 'comfort', travelStyle: 'comfort', budgetAmount: 0,
  travelInterests: ['gastronomy', 'culture'], priorities: [],
};

/** Fortaleza 10→15/11, 2 adultos, volta 02:30 e rota injetada (economyAvg 1.200). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fortaleza(): Promise<any> {
  return buildDraftTrip(input, {
    routeLookup: async (origin, destination) => ({
      origin, destination, economyMin: 0, economyAvg: 1200, economyMax: 0, businessAvg: 0, typicalReturnDeparture: '02:30',
    }),
  });
}

// As mesmas escritas dos handlers de Viagens.tsx (handleConfirmActivity / handleHeroConfirm hotel).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function confirmActivity(trip: any, dayIndex: number, actIndex: number, amount: number) {
  const t = structuredClone(trip);
  const a = t.days[dayIndex].activities[actIndex];
  a.status = 'confirmed';
  a.paidAmount = amount;
  t.finances.confirmed += amount;
  t.finances.planned = Math.max(0, t.finances.planned - amount);
  return t;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function confirmHotel(trip: any, amount: number) {
  const t = structuredClone(trip);
  t.accommodation.status = 'confirmed';
  t.accommodation.totalPrice = amount;
  t.finances.confirmed += amount;
  t.finances.categories.accommodation.confirmed += amount;
  t.finances.planned = Math.max(0, t.finances.planned - amount);
  return t;
}

describe('C.5c — razaoLines (Fortaleza 02:30)', () => {
  it('ordem, valores, origens, status e ação por linha', async () => {
    const t = await fortaleza();
    const lines = razaoLines(t);
    expect(lines.map((l) => l.title)).toEqual([
      'Voo ida', 'Voo volta', 'Hotel (4 noites)', 'Dia 1', 'Dia 2', 'Dia 3', 'Dia 4', 'Dia 5', 'Reserva (15%)',
    ]);
    const [ida, volta, hotel] = lines;
    expect([ida.value, volta.value, hotel.value]).toEqual([994, 1160, 6000]);
    expect(ida).toMatchObject({ origin: 'estimativa', status: 'pending', actions: ['confirmar', 'parceiro'], confirmTipo: 'voo' });
    expect(ida.partnerUrl).toMatch(/kiwi|travelpayouts/i);
    expect(hotel).toMatchObject({ origin: 'estimativa', status: 'pending', actions: ['confirmar', 'ofertas'], confirmTipo: 'hotel' });
    for (const d of lines.filter((l) => l.kind === 'dia')) {
      expect(d).toMatchObject({ origin: 'estimativa do catálogo', status: 'pending', actions: ['roteiro'] });
    }
    const reserva = lines.at(-1)!;
    expect(reserva).toMatchObject({ status: 'na', actions: [], planned: 0, confirmed: 0 });
    expect(reserva.value).toBe(reserveFor(planBreakdown(t).total));
  });

  it('Σ linhas = Planejado (= planBreakdown = finances.planned na viagem nova); reserva fora', async () => {
    const t = await fortaleza();
    const p = planBreakdown(t);
    expect(razaoTotals(razaoLines(t))).toEqual({ planned: p.total, confirmed: 0 });
    expect(p.total).toBe(11004);
    expect(t.finances.planned).toBe(p.total);
    const days = razaoLines(t).filter((l) => l.kind === 'dia').reduce((s, l) => s + l.value, 0);
    expect(days).toBe(p.food + p.tours);
  });

  it('confirmar hotel e atividade com valor ≠ estimado: razão e tiles seguem as linhas (o acumulador derivava)', async () => {
    const t0 = await fortaleza();
    const before = razaoTotals(razaoLines(t0));
    const day2 = t0.days[1];
    const idx = day2.activities.findIndex((a: { cost: number; category: string }) => a.cost > 0 && a.category === 'passeio');
    const cost = day2.activities[idx].cost;
    const t1 = confirmActivity(t0, 1, idx, cost + 55);
    const t2 = confirmHotel(t1, 5400);
    const lines = razaoLines(t2);
    const tot = razaoTotals(lines);
    expect(tot.confirmed).toBe(cost + 55 + 5400);
    expect(tot.planned).toBe(before.planned - cost - 6000);
    expect(tot.confirmed).toBe(lines.filter((l) => l.status === 'confirmed' || l.confirmed > 0).reduce((s, l) => s + l.confirmed, 0));
    // o acumulador gravado não bate (é por isso que a aba deixou de lê-lo)
    expect(t2.finances.planned).not.toBe(tot.planned);
    const hotel = lines.find((l) => l.kind === 'hotel')!;
    expect(hotel).toMatchObject({ value: 5400, origin: 'confirmado', status: 'confirmed', actions: [] });
    const d2 = lines.find((l) => l.title === 'Dia 2')!;
    expect(d2.day!.confirmedCount).toBe(1);
  });

  it('D3: voo confirmado = uma linha "Voo ida e volta · valor registrado", sem ação', async () => {
    const t = structuredClone(await fortaleza());
    t.flights.outbound.status = 'confirmed';
    t.flights.return.status = 'confirmed';
    t.finances.categories.flights = { planned: 0, confirmed: 2300, bidding: 0 };
    const voos = razaoLines(t).filter((l) => l.kind === 'voo');
    expect(voos).toHaveLength(1);
    expect(voos[0]).toMatchObject({ title: 'Voo ida e volta', value: 2300, origin: 'valor registrado', status: 'confirmed', actions: [] });
  });

  it('D1: "Outros gastos registrados" só com valor gravado > 0 e sem item confirmado da categoria', async () => {
    const t = structuredClone(await fortaleza());
    expect(razaoLines(t).some((l) => l.kind === 'outros')).toBe(false);
    t.finances.categories.shopping.confirmed = 180;
    const outros = razaoLines(t).find((l) => l.kind === 'outros')!;
    expect(outros).toMatchObject({ title: 'Outros gastos registrados', value: 180, confirmed: 180, origin: 'valor registrado' });
  });

  it('D2: computeBuckets conta transport com custo (transfer)', () => {
    const day = { dayNumber: 1, date: new Date(), label: '', totalCost: 0, activities: [
      { id: 't', name: 'Transfer para Aeroporto', type: 'transport', timeSlot: 'afternoon', estimatedCost: 220, status: 'suggestion', source: 'kinu' },
      { id: 'c', name: 'Check-out do hotel', type: 'transport', timeSlot: 'morning', estimatedCost: 0, status: 'suggestion', source: 'kinu' },
      { id: 'h', name: 'Check-in', type: 'checkin', timeSlot: 'hotel', estimatedCost: 999, status: 'suggestion', source: 'kinu' },
    ] } as ItineraryDay;
    const b = computeBuckets([day], { flights: { amount: 0 }, hotel: { amount: 0 } } as never);
    expect(b.toursPlanned + b.foodPlanned).toBe(220);
  });
});

describe('C.5c — FinanceiroRazao (UI)', () => {
  it('dia fechado em uma linha; aberto lista ☐ que chama o confirmModal; ações por linha', async () => {
    const t = await fortaleza();
    const lines = razaoLines(t);
    const h = { onConfirm: vi.fn(), onHotelOffers: vi.fn(), onOpenDay: vi.fn(), onCheck: vi.fn() };
    const { container } = render(<FinanceiroRazao lines={lines} {...h} />);
    expect(screen.getByText('📒 Compromissos')).toBeTruthy();
    const dia3 = lines.find((l) => l.title === 'Dia 3')!;
    const row = screen.getByRole('button', { name: /Dia 3 · \d+ itens · R\$ .* · 0\/\d+ confirmados/ });
    expect(screen.queryByRole('button', { name: /ver no Roteiro/ })).toBeNull();
    fireEvent.click(row);
    const boxes = screen.getAllByRole('checkbox');
    expect(boxes).toHaveLength(dia3.day!.checkableCount);
    fireEvent.click(boxes[0]);
    const first = dia3.day!.items.find((i) => i.checkable)!;
    expect(h.onCheck).toHaveBeenCalledWith(first.activity, dia3.day!.dayIndex, first.actIndex);
    fireEvent.click(screen.getByRole('button', { name: /ver no Roteiro/ }));
    expect(h.onOpenDay).toHaveBeenCalledWith(3);
    expect(screen.queryByRole('button', { name: /Reservar|Trocar/ })).toBeNull();

    const ida = container.querySelector<HTMLElement>('[data-razao-line="voo"]')!;
    expect(within(ida).getByText('○ a confirmar')).toBeTruthy();
    expect(within(ida).getByRole('link', { name: /Reservar com parceiro/ })).toBeTruthy();
    fireEvent.click(within(ida).getByRole('button', { name: /Confirmar/ }));
    expect(h.onConfirm).toHaveBeenCalledWith('voo');
    const hotel = container.querySelector<HTMLElement>('[data-razao-line="hotel"]')!;
    fireEvent.click(within(hotel).getByRole('button', { name: /Buscar ofertas/ }));
    expect(h.onHotelOffers).toHaveBeenCalled();
    const reserva = container.querySelector<HTMLElement>('[data-razao-line="reserva"]')!;
    expect(within(reserva).getByText('—')).toBeTruthy();
    expect(within(reserva).queryByRole('button')).toBeNull();
  });

  it('linha confirmada: ✓ verde e nenhuma ação', async () => {
    const t = confirmHotel(await fortaleza(), 5400);
    const { container } = render(<FinanceiroRazao lines={razaoLines(t)} onConfirm={vi.fn()} onHotelOffers={vi.fn()} onOpenDay={vi.fn()} onCheck={vi.fn()} />);
    const hotel = container.querySelector<HTMLElement>('[data-razao-line="hotel"]')!;
    expect(within(hotel).getByText('✓ confirmado')).toBeTruthy();
    expect(within(hotel).queryByRole('button')).toBeNull();
  });
});

describe('C.5d — tiles clicáveis e "Quando o dinheiro sai"', () => {
  const sum = (xs: { value: number }[]) => xs.reduce((s, x) => s + x.value, 0);

  it('(e) Planejado/Confirmado abrem a quebra (Σ = tile, um por vez); Orçamento abre o editor; Disponível → reserva', async () => {
    const t = confirmActivity(await fortaleza(), 2, 2, 150);
    const lines = razaoLines(t);
    const { planned, confirmed } = razaoTotals(lines);
    expect(sum(razaoBreakdown(lines, 'planned'))).toBe(planned);
    expect(sum(razaoBreakdown(lines, 'confirmed'))).toBe(confirmed);
    expect(razaoBreakdown(lines, 'planned').map((b) => b.label)).toEqual(['Voo', 'Hotel', 'Passeios', 'Alimentação', 'Transfer']);

    const onEditBudget = vi.fn();
    const { container } = render(<FinanceiroTiles budget={t.budget} lines={lines} onEditBudget={onEditBudget} />);
    const tile = (k: string) => container.querySelector<HTMLElement>(`[data-tile="${k}"]`)!;
    const detail = () => container.querySelectorAll<HTMLElement>('[data-tile-detail]');
    expect(detail()).toHaveLength(0);
    fireEvent.click(tile('planejado'));
    expect(detail()).toHaveLength(1);
    expect(detail()[0].dataset.tileDetail).toBe('planejado');
    expect(within(detail()[0]).getByText('Hotel')).toBeTruthy();
    fireEvent.click(tile('confirmado'));
    expect(detail()).toHaveLength(1);
    expect(detail()[0].dataset.tileDetail).toBe('confirmado');
    fireEvent.click(tile('confirmado'));
    expect(detail()).toHaveLength(0);
    fireEvent.click(tile('disponivel'));
    const reserva = lines.find((l) => l.kind === 'reserva')!.value;
    expect(detail()[0].textContent).toBe(`Reserva 15% · fora do planoR$ ${reserva.toLocaleString('pt-BR')}`);
    fireEvent.click(tile('orcamento'));
    expect(onEditBudget).toHaveBeenCalled();
  });

  it('(f) desembolso: Σ marcos = Planejado; reserva aparece fora da soma; datas do trip', async () => {
    const t = confirmActivity(await fortaleza(), 2, 2, 150);
    const lines = razaoLines(t);
    const marcos = razaoDesembolso(t, lines);
    expect(sum(marcos.filter((m) => !m.outOfPlan))).toBe(razaoTotals(lines).planned);
    expect(marcos[0]).toMatchObject({ id: 'voo', label: 'Ao confirmar o voo · hoje' });
    expect(marcos.find((m) => m.id === 'hotel')!.label).toBe('No check-in (10/nov) · Hotel');
    expect(marcos.find((m) => m.id === 'dia-2')!.label).toBe('Dia 2 (11/nov)');
    expect(marcos.at(-1)).toMatchObject({ id: 'reserva', label: 'Reserva', outOfPlan: true });

    render(<QuandoDinheiroSai trip={t} lines={lines} />);
    const btn = screen.getByRole('button', { name: /Quando o dinheiro sai/ });
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('Ao confirmar o voo · hoje')).toBeNull();
    fireEvent.click(btn);
    expect(screen.getByText('Ao confirmar o voo · hoje')).toBeTruthy();
    expect(screen.getByText(/\(não planejado\)/)).toBeTruthy();
  });

  it('voo e hotel confirmados saem do desembolso (já saiu)', async () => {
    const t = confirmHotel(await fortaleza(), 5400);
    const marcos = razaoDesembolso(t, razaoLines(t));
    expect(marcos.find((m) => m.id === 'hotel')).toBeUndefined();
  });

  it('razão: item do dia não mostra texto de como fechar (fica no Roteiro)', async () => {
    const t = await fortaleza();
    render(<FinanceiroRazao lines={razaoLines(t)} onConfirm={vi.fn()} onHotelOffers={vi.fn()} onOpenDay={vi.fn()} onCheck={vi.fn()} />);
    for (const b of screen.getAllByRole('button', { name: /Dia \d+ · / })) fireEvent.click(b);
    expect(screen.queryByText(/número a cadastrar|ordem de chegada|Sem reserva/)).toBeNull();
  });
});
