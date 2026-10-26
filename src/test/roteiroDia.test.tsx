import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import { RoteiroDia } from '@/components/cockpit/RoteiroDia';
import { legBetween } from '@/lib/roteiroBlocks';
import type { TripActivity } from '@/types/trip';

// C.5d: o banco ainda não tem online/partner/telefone — entradas de teste somadas ao gerado real.
vi.mock('@/data/generated/booking', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/data/generated/booking')>();
  return {
    CURATED_BOOKING: {
      ...real.CURATED_BOOKING,
      'tst-online': { mode: 'online', url: 'https://exemplo.com/reserva' },
      'tst-partner': { mode: 'partner', url: 'https://parceiro.example/p?aff=kinu' },
      'tst-online-sem-url': { mode: 'online' },
      'tst-tel': { mode: 'phone', phone: '+55 (85) 3242-0000' },
      'tst-walk-sem-note': { mode: 'walk_in' },
      'tst-incluido': { mode: 'included' },
    },
  };
});

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
    onCheck: vi.fn(), onSwap: vi.fn(), onConfirmAnchor: vi.fn(), onOpenDetails: vi.fn(),
  };
  const Harness = () => {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
    const [routeOpen, setRouteOpen] = useState(false);
    return (
      <RoteiroDia
        dayNumber={3}
        date={new Date(2026, 10, 12)}
        activities={dia}
        destination="Fortaleza"
        liveLegs={null}
        expandedIds={expandedIds}
        onToggleExpand={(id) => setExpandedIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id); else next.add(id);
          return next;
        })}
        onCollapseAll={() => setExpandedIds(new Set())}
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

  it('(b) passeio pago aberto → Trocar; sem dado de reserva → nem Reservar nem Marcar como fechado (C.8)', () => {
    const { container, h, renderDetail } = setup();
    openRow('Dia de praia');
    const row = rowOf(container, 'Dia de praia');
    expect(within(row).queryByRole('button', { name: /Reservar/ })).toBeNull();
    expect(within(row).queryByRole('link', { name: /Reservar/ })).toBeNull();
    expect(within(row).getByRole('button', { name: /Trocar/ })).toBeTruthy();
    expect(within(row).queryByRole('button', { name: /^Confirmar/ })).toBeNull();
    expect(screen.getByText(/Chegue cedo/)).toBeTruthy();
    expect(screen.getByText(/estimativa do KINU/)).toBeTruthy();
    expect(renderDetail).toHaveBeenCalledWith(praia);
    expect(within(row).queryByRole('button', { name: 'Marcar como fechado' })).toBeNull();
    expect(within(row).queryByRole('button', { name: /Onde fechar/ })).toBeNull();
    fireEvent.click(within(row).getByRole('checkbox'));
    expect(h.onCheck).toHaveBeenCalledWith(praia, 2);
    openRow('Almoço no Coco Bambu');
    const almocoRow = rowOf(container, 'Coco Bambu');
    expect(within(almocoRow).getByRole('button', { name: /Trocar/ })).toBeTruthy();
    expect(within(almocoRow).queryByRole('link')).toBeNull();
  });

  it('C.5c — abrir 2 linhas → 2 abertas; "fechar tudo" → 0 (e some sem nenhuma aberta)', () => {
    setup();
    expect(screen.queryByRole('button', { name: 'fechar tudo' })).toBeNull();
    openRow('Dia de praia');
    openRow('Almoço no Coco Bambu');
    expect(screen.getAllByRole('button', { expanded: true })).toHaveLength(2);
    expect(screen.getByText(/Chegue cedo/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'fechar tudo' }));
    expect(screen.queryAllByRole('button', { expanded: true })).toHaveLength(0);
    expect(screen.queryByRole('button', { name: 'fechar tudo' })).toBeNull();
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
    fireEvent.click(screen.getByRole('button', { name: /✈️ → ①/ }));
    expect(screen.getByTestId('mapa')).toBeTruthy();
    expect(renderMap).toHaveBeenCalled();
  });

  it('deslocamento: OSRM do mapa quando já calculou (real), senão nada/estimativa — nunca os dois', () => {
    const live = [{ fromName: praia.name, toName: almoco.name, durationMin: 12, distanceKm: '0.9' }];
    expect(legBetween(praia, almoco, live, 'Fortaleza')).toEqual({ text: '~12 min a pé', minutes: 12, source: 'osrm' });
    expect(legBetween(praia, almoco, null, 'Fortaleza')?.source ?? 'estimativa').toBe('estimativa');
  });
});

describe('C.5d — modo de reserva por atividade (catálogo → ação honesta)', () => {
  const one = (a: TripActivity) => {
    const utils = render(
      <RoteiroDia
        dayNumber={2} activities={[a]} destination="Fortaleza" liveLegs={null}
        expandedIds={new Set([a.id])} onToggleExpand={() => {}} onCollapseAll={() => {}}
        renderMap={null} routeOpen={false} onRouteToggle={() => {}}
        onCheck={vi.fn()} onSwap={vi.fn()} onConfirmAnchor={vi.fn()} onOpenDetails={vi.fn()}
      />,
    );
    const row = utils.container.querySelector<HTMLElement>('[data-roteiro-line="item"]')!;
    return { ...utils, row };
  };
  const passeio = (id: string, name = id) => act(`day-2-${id}`, { name, category: 'passeio', cost: 100 });
  const rest = (id: string, name = id) => act(`day-2-${id}`, { name, category: 'comida', type: 'food', cost: 120 });

  it('(a) Crocobeach walk_in → sem botão de reserva; só a note do catálogo, verbatim (nunca os dois textos)', () => {
    const { row } = one(passeio('for-barraca-crocobeach', 'Dia de praia no Crocobeach'));
    expect(within(row).queryByRole('link')).toBeNull();
    expect(within(row).queryByRole('button', { name: /Reservar|Ligar/ })).toBeNull();
    expect(within(row).getByText('Sem reserva — chegue antes das 10h para pegar mesa na frente')).toBeTruthy();
    expect(within(row).queryByText('Sem reserva · ordem de chegada')).toBeNull();
  });

  it('(a2) walk_in sem note → texto padrão "Sem reserva · ordem de chegada"', () => {
    const { row } = one(passeio('tst-walk-sem-note'));
    expect(within(row).getByText('Sem reserva · ordem de chegada')).toBeTruthy();
    expect(within(row).queryByRole('link')).toBeNull();
  });

  it('(b) restaurante phone sem telefone → texto, nenhum botão; com telefone → Ligar (tel:)', () => {
    const { row } = one(rest('for-caravaggio-cucina', 'Jantar no Caravaggio'));
    expect(within(row).getByText('Reserva por telefone · número a cadastrar')).toBeTruthy();
    expect(within(row).queryByRole('link')).toBeNull();
    cleanup();
    const tel = one(rest('tst-tel')).row;
    expect(within(tel).getByRole('link', { name: /Ligar/ }).getAttribute('href')).toBe('tel:+558532420000');
    expect(within(tel).queryByText(/número a cadastrar/)).toBeNull();
  });

  it('(c) item null / included / online sem url → nenhuma ação e nenhum texto de reserva', () => {
    for (const id of ['for-item-sem-modo', 'tst-incluido', 'tst-online-sem-url']) {
      const { row, container } = one(passeio(id));
      expect(within(row).queryByRole('link')).toBeNull();
      expect(container.querySelector('[data-roteiro-line="booking"]')).toBeNull();
      expect(within(row).queryByText(/Reserv|ordem de chegada/)).toBeNull();
      cleanup();
    }
  });

  it('(d) online com url → "Reservar no site"; partner → "Reservar com parceiro"', () => {
    // C.8: passeio pago vai para "Onde fechar ▸" (closeLinks.test); o botão segue no restaurante.
    const site = within(one(rest('tst-online')).row).getByRole('link', { name: /Reservar no site/ });
    expect(site.getAttribute('href')).toBe('https://exemplo.com/reserva');
    expect(site.getAttribute('target')).toBe('_blank');
    cleanup();
    const p = within(one(rest('tst-partner')).row).getByRole('link', { name: /Reservar com parceiro/ });
    expect(p.getAttribute('href')).toBe('https://parceiro.example/p?aff=kinu');
  });

  it('Marcar como fechado → onCheck; linha fechada mantém o ☐ e não mostra o botão nem a reserva', () => {
    const a = passeio('tst-online');
    const onCheck = vi.fn();
    const { row } = (() => {
      const u = render(
        <RoteiroDia
          dayNumber={2} activities={[a]} destination="Fortaleza" liveLegs={null}
          expandedIds={new Set([a.id])} onToggleExpand={() => {}} onCollapseAll={() => {}}
          renderMap={null} routeOpen={false} onRouteToggle={() => {}}
          onCheck={onCheck} onSwap={vi.fn()} onConfirmAnchor={vi.fn()} onOpenDetails={vi.fn()}
        />,
      );
      return { row: u.container.querySelector<HTMLElement>('[data-roteiro-line="item"]')! };
    })();
    fireEvent.click(within(row).getByRole('button', { name: 'Marcar como fechado' }));
    expect(onCheck).toHaveBeenCalledWith(a, 0);
    cleanup();
    const closed = one({ ...a, status: 'confirmed', paidAmount: 100 }).row;
    expect(within(closed).getByRole('checkbox', { checked: true })).toBeTruthy();
    expect(within(closed).queryByRole('button', { name: 'Marcar como fechado' })).toBeNull();
    expect(within(closed).queryByRole('link')).toBeNull();
  });
});
