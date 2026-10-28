import { fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const ROWS: [string, Record<string, number>][] = [
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
];

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
const buracosDaLinha = async (city: string) => {
  const r = await screen.findByRole('row', { name: new RegExp(city) });
  const cells = within(r).getAllByRole('cell');
  return cells[cells.length - 1].textContent;
};

describe('Catálogo — células "não se aplica"', () => {
  it('Praia e Noite fora de jogo não entram na conta de buracos', async () => {
    render(<CatalogoTab />);
    await screen.findByText('Interesses do wizard');

    // Só 3 buracos de verdade: Lisboa praia 2, Bangkok compras 2, Buenos Aires noite 3.
    expect(within(tile('Buracos')).getByText('3')).toBeInTheDocument();
    expect(screen.getByText('3 buracos')).toBeInTheDocument();

    expect(await buracosDaLinha('Lisboa')).toBe('1');
    expect(await buracosDaLinha('Bangkok')).toBe('1');
    expect(await buracosDaLinha('Buenos Aires')).toBe('1');
    for (const city of ['Gramado', 'Orlando', 'Porto Seguro', 'Rome', 'Tokyo', 'Istambul', 'Nova York']) {
      expect(await buracosDaLinha(city), city).toBe('0');
    }

    // Gramado e Orlando: praia E noite riscadas. Porto Seguro: só noite (praia se aplica).
    expect(within(await screen.findByRole('row', { name: /Gramado/ })).getAllByText('—')).toHaveLength(2);
    expect(within(await screen.findByRole('row', { name: /Orlando/ })).getAllByText('—')).toHaveLength(2);
    expect(within(await screen.findByRole('row', { name: /Porto Seguro/ })).getAllByText('—')).toHaveLength(1);
    // Rome/Tokyo/Istambul/Nova York/Bangkok: praia riscada, mas o resto continua valendo.
    expect(within(await screen.findByRole('row', { name: /Rome/ })).getAllByText('—')).toHaveLength(1);
    expect(within(await screen.findByRole('row', { name: /Nova York/ })).getAllByText('—')).toHaveLength(1);
    expect(within(await screen.findByRole('row', { name: /Buenos Aires/ })).getAllByText('—')).toHaveLength(1);

    // Buracos por coluna: Praia e Noite não somam as cidades riscadas.
    const totals = await screen.findByRole('row', { name: /Buracos por coluna/ });
    expect(within(totals).getAllByRole('cell').map(c => c.textContent))
      .toEqual(['', '0', '0', '0', '1', '0', '1', '1', '0', '3']);
  });

  it('as listas de buracos não citam as cidades riscadas', async () => {
    render(<CatalogoTab />);
    await screen.findByText('Interesses do wizard');
    const gatilho = screen.getAllByRole('button', { name: 'Buracos' }).find(b => !b.closest('th'))!;
    const box = gatilho.closest('div')!;
    fireEvent.click(gatilho);
    await waitFor(() => expect(within(box).getByText('Por interesse')).toBeInTheDocument());

    for (const city of ['Gramado', 'Orlando', 'Porto Seguro', 'Rome', 'Tokyo', 'Istambul', 'Nova York']) {
      expect(within(box).queryByText(new RegExp(city)), city).not.toBeInTheDocument();
    }
    expect(within(box).getByText(/Buenos Aires \(3\)/)).toBeInTheDocument();
    expect(within(box).getByText(/Lisboa \(2\)/)).toBeInTheDocument();
    expect(within(box).getByText(/Bangkok \(2\)/)).toBeInTheDocument();
    // Bangkok não aparece na lista de Praia, mesmo com praia 0.
    expect(within(box).queryByText(/Bangkok \(0\)/)).not.toBeInTheDocument();
  });
});
