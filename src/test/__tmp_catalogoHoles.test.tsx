import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const ROWS = [
  ['Gramado', { praia: 0, noite: 0 }],
  ['Porto Seguro', { noite: 0 }],
  ['Orlando', { praia: 0, noite: 0 }],
  ['Rome', { praia: 0 }],
  ['Tokyo', { praia: 0 }],
  ['Istambul', { praia: 0 }],
  ['Nova York', { praia: 0 }],
  ['Bangkok', { praia: 0, compras: 2 }],
  ['Buenos Aires', { praia: 0, noite: 3 }],
  ['Lisboa', { praia: 2 }],
] as const;

const row = (city: string, over: Record<string, number>) => ({
  city, total: 100, hoteis: 10, familia: 10, gastro: 10, cultura: 10, arte: 10, praia: 10, natureza: 10,
  noite: 10, compras: 10, romantico: 10, aventura: 10, relax: 10, bate_volta: 10, cafe: 10, almoco: 10,
  jantar: 10, passeios: 30, cat_noite: 10, ...over,
});

vi.mock('@/integrations/kinu-beta/client', () => ({
  kinuBeta: { rpc: vi.fn(async () => ({ data: ROWS.map(([c, o]) => row(c, o)), error: null })) },
}));

import CatalogoTab from '@/components/onda/CatalogoTab';

const tile = (label: string) => screen.getAllByText(label).find(el => el.tagName === 'P')!.parentElement!;

describe('Catálogo — células "não se aplica"', () => {
  it(' Praia e Noite fora de jogo não entram na conta de buracos', async () => {
    render(<CatalogoTab />);
    await screen.findByText('Interesses do wizard');

    // Lisboa: praia 0 vale; Gramado/Orlando: praia e noite 0 não valem.
    expect(within(tile('Buracos')).getByText('2')).toBeInTheDocument();
    expect(screen.getByText('2 buracos')).toBeInTheDocument();

    // Lisboa continua buraco de praia; Nova York/Rome/Tokyo/Istambul/Bangkok não.
    const lisboa = await screen.findByRole('row', { name: /Lisboa/ });
    expect(within(lisboa).getByText('0')).toBeInTheDocument();
    for (const city of ['Gramado', 'Orlando', 'Rome', 'Tokyo', 'Istambul', 'Nova York']) {
      const r = await screen.findByRole('row', { name: new RegExp(city) });
      expect(within(r).queryByText('0'), city).not.toBeInTheDocument();
    }

    // Gramado: praia E noite riscadas; Orlando idem.
    expect(within(await screen.findByRole('row', { name: /Gramado/ })).getAllByText('—')).toHaveLength(2);
    expect(within(await screen.findByRole('row', { name: /Orlando/ })).getAllByText('—')).toHaveLength(2);
    // Porto Seguro: só noite riscada (praia se aplica lá).
    expect(within(await screen.findByRole('row', { name: /Porto Seguro/ })).getAllByText('—')).toHaveLength(1);

    // Buenos Aires: praia riscada, mas noite 0 é buraco de verdade.
    const ba = await screen.findByRole('row', { name: /Buenos Aires/ });
    expect(within(ba).getAllByText('—')).toHaveLength(1);
    expect(within(ba).getByText('3')).toBeInTheDocument();

    // Contagem por coluna: Praia e Noite não somam as cidades riscadas.
    const totals = await screen.findByRole('row', { name: /Buracos por coluna/ });
    const cells = within(totals).getAllByRole('cell').concat(within(totals).getAllByRole('columnheader'));
    expect(cells.length).toBeGreaterThan(0);
  });

  it('as listas de buracos não citam as cidades riscadas', async () => {
    render(<CatalogoTab />);
    await screen.findByText('Interesses do wizard');
    await userEvent.click(screen.getByRole('button', { name: 'Buracos' }));
    await waitFor(() => expect(screen.getByText('Por interesse')).toBeInTheDocument());

    expect(screen.queryByText(/Gramado/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Orlando/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Porto Seguro/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Nova York/)).not.toBeInTheDocument();
    expect(screen.getByText(/Buenos Aires \(3\)/)).toBeInTheDocument();
    expect(screen.getByText(/Lisboa \(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/Bangkok \(2\)/)).toBeInTheDocument();
  });
});
