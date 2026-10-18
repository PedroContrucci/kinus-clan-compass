import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { RoteiroDia } from '@/components/cockpit/RoteiroDia';
import { legBetween } from '@/lib/roteiroBlocks';
import type { TripActivity } from '@/types/trip';

const act = (id: string, over: Partial<TripActivity>): TripActivity => ({
  id, time: '09:00', name: id, description: '', duration: '', cost: 0, type: 'activity', status: 'planned', ...over,
});

const voo = act('day-3-voo', { time: '07:00', name: 'Voo GRU → FOR', category: 'voo', type: 'transport' });
const cafe = act('day-3-cafe', { time: '08:00', name: 'Café da manhã no hotel', category: 'comida', type: 'food', description: 'Incluído na diária' });
const praia = act('day-3-praia', { time: '09:15', name: 'Dia de praia no Crocobeach', duration: '5h', cost: 170, category: 'passeio', description: 'Chegue cedo' });
const almoco = act('day-3-almoco', { time: '14:30', name: 'Almoço no Coco Bambu', cost: 120, category: 'comida', type: 'food' });
const museu = act('day-3-museu', { time: '17:00', name: 'Centro Dragão do Mar', category: 'passeio' });
const dia = [voo, cafe, praia, almoco, museu];

function setup(extra: Partial<Parameters<typeof RoteiroDia>[0]> = {}) {
  const renderMap = vi.fn(() => <div data-testid="mapa" />);
  const renderDetail = vi.fn(() => <div data-testid="place-info" />);
  const h = {
    onCheck: vi.fn(), onOffers: vi.fn(), onSwap: vi.fn(), onConfirmAnchor: vi.fn(), onOpenDetails: vi.fn(),
  };
  const Harness = () => {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [routeOpen, setRouteOpen] = useState(false);
    return (
      <RoteiroDia
        dayNumber={3}
        date={new Date(2026, 10, 12)}
        activities={dia}
        destination="Fortaleza"
        liveLegs={null}
        expandedId={expandedId}
        onExpand={setExpandedId}
        renderMap={renderMap}
        routeOpen={routeOpen}
        onRouteToggle={() => setRouteOpen((o) => !o)}
        renderDetail={renderDetail}
        {...h}
        {...extra}
      />
    );
  };
  const utils = render(<Harness />);
  return { ...utils, renderMap, renderDetail, h };
}

const ACTION = /Reservar com parceiro|Trocar|Confirmar/;
const openRow = (name: string) => fireEvent.click(screen.getByRole('button', { name: new RegExp(name) }));
const rowOf = (container: HTMLElement, name: string) =>
  [...container.querySelectorAll<HTMLElement>('[data-roteiro-line="item"]')].find((el) => el.textContent?.includes(name))!;

describe('C.5b — Roteiro em blocos', () => {
  it('(a) dia com 5 itens → 5 linhas fechadas, nenhum botão de ação, cabe em 390×700', () => {
    const { container, renderDetail } = setup();
    const rows = container.querySelectorAll('[data-roteiro-line="item"]');
    expect(rows).toHaveLength(5);
    expect(screen.queryAllByRole('button', { name: ACTION })).toHaveLength(0);
    expect(screen.queryByText(/Chegue cedo/)).toBeNull();
    expect(renderDetail).not.toHaveBeenCalled();
    expect(screen.getByText('Dia 3 · 12/nov (quinta) · 5 itens · R$ 290')).toBeTruthy();
    expect(rows[2].textContent).toContain('09:15Dia de praia no Crocobeach · 5h · ~R$ 170');
    // Densidade por contagem: cabeçalho + rota + 5 linhas de 44px + conectores de 20px ≤ 700px.
    const lines = container.querySelectorAll('[data-roteiro-line]');
    const legs = container.querySelectorAll('[data-roteiro-line="leg"]').length;
    expect(lines.length).toBeLessThanOrEqual(2 + 5 + 4);
    expect(32 + 40 + 5 * 44 + legs * 20).toBeLessThanOrEqual(700);
  });

  it('(b) passeio pago aberto → Reservar com parceiro + Trocar, sem Confirmar; um aberto por vez', () => {
    const { container, h, renderDetail } = setup();
    openRow('Dia de praia');
    const row = rowOf(container, 'Dia de praia');
    expect(within(row).getByRole('button', { name: /Reservar com parceiro/ })).toBeTruthy();
    expect(within(row).getByRole('button', { name: /Trocar/ })).toBeTruthy();
    expect(within(row).queryByRole('button', { name: /Confirmar/ })).toBeNull();
    expect(screen.getByText(/Chegue cedo/)).toBeTruthy();
    expect(screen.getByText(/estimativa do KINU/)).toBeTruthy();
    expect(renderDetail).toHaveBeenCalledWith(praia);
    fireEvent.click(within(row).getByRole('button', { name: /Reservar com parceiro/ }));
    expect(h.onOffers).toHaveBeenCalledWith(praia);
    openRow('Almoço no Coco Bambu');
    expect(screen.queryByText(/Chegue cedo/)).toBeNull();
    expect(screen.getAllByRole('button', { expanded: true })).toHaveLength(1);
    // restaurante: só Trocar
    const almocoRow = rowOf(container, 'Coco Bambu');
    expect(within(almocoRow).getByRole('button', { name: /Trocar/ })).toBeTruthy();
    expect(within(almocoRow).queryByRole('button', { name: /Reservar/ })).toBeNull();
  });

  it('(c) café do hotel aberto → nenhuma ação; ☐ abre o confirmModal existente', () => {
    const { container, h } = setup();
    openRow('Café da manhã no hotel');
    expect(within(rowOf(container, 'Café da manhã')).queryAllByRole('button', { name: ACTION })).toHaveLength(0);
    fireEvent.click(screen.getByRole('checkbox', { name: /Marcar Dia de praia/ }));
    expect(h.onCheck).toHaveBeenCalledWith(praia, 2);
  });

  it('(d) voo aberto → Confirmar (sheet do TripPanel); sem checkbox na logística', () => {
    const { container, h } = setup();
    const row = rowOf(container, 'Voo GRU');
    expect(within(row).queryByRole('checkbox')).toBeNull();
    openRow('Voo GRU');
    fireEvent.click(within(row).getByRole('button', { name: /Confirmar/ }));
    expect(h.onConfirmAnchor).toHaveBeenCalledWith('voo');
    expect(within(row).queryByRole('button', { name: /Trocar|Reservar/ })).toBeNull();
  });

  it('(e) mapa não montado fechado, montado ao abrir', () => {
    const { renderMap } = setup();
    expect(screen.queryByTestId('mapa')).toBeNull();
    expect(renderMap).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Rota do dia/ }));
    expect(screen.getByTestId('mapa')).toBeTruthy();
    expect(renderMap).toHaveBeenCalled();
  });

  it('deslocamento: OSRM do mapa quando já calculou (real), senão nada/estimativa — nunca os dois', () => {
    const live = [{ fromName: praia.name, toName: almoco.name, durationMin: 12, distanceKm: '0.9' }];
    expect(legBetween(praia, almoco, live, 'Fortaleza')).toEqual({ text: '~12 min a pé', minutes: 12, source: 'osrm' });
    expect(legBetween(praia, almoco, null, 'Fortaleza')?.source ?? 'estimativa').toBe('estimativa');
  });
});
