import { describe, it, expect } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { createElement } from 'react';
import { seasonalForTrip, closureOnDate, dayAlert, seasonalRows } from '@/lib/seasonal';
import { SeasonalCard } from '@/components/cockpit/SeasonalCard';
import { SEASONAL_NOTES } from '@/data/seasonalNotes';

const paris1 = { destination: 'Paris', startDate: '2026-12-10', endDate: '2026-12-15' };
const paris2 = { destination: 'Paris', startDate: '2026-12-20', endDate: '2026-12-27' };
const madri = { destination: 'Madri', startDate: '2026-12-10', endDate: '2026-12-15' };

describe('M18a sazonalidade', () => {
  it('Paris 10–15/12: bloco presente com Giverny', () => {
    expect(seasonalForTrip(paris1)).toHaveLength(1);
    expect(seasonalRows(paris1).some((r) => r.text.includes('Giverny'))).toBe(true);
    expect(seasonalRows(paris1)[0].text).toBe('NESTA ÉPOCA — dezembro');
  });
  it('Paris 20–27/12: alerta no dia 25/12 e só nele; datas múltiplas batem nas duas', () => {
    expect(dayAlert('Paris', '2026-12-25')).toContain('Louvre, Orsay e Versalhes fechados');
    expect(dayAlert('Paris', '2026-12-25')).toMatch(/^25\/12 — /);
    expect(dayAlert('Paris', '2026-12-26')).toBeNull();
    expect(closureOnDate('Paris', '2026-12-24')).toHaveLength(1);
    expect(closureOnDate('Paris', '2026-12-31')).toHaveLength(1);
    expect(closureOnDate('Paris, França', '2026-12-25')).toHaveLength(1);
    // "Mês inteiro" nunca vira alerta de dia
    expect(closureOnDate('Paris', '2026-12-10').some((l) => l.includes('Giverny'))).toBe(false);
  });
  it('Madri: nada renderizado, sem erro', () => {
    expect(seasonalForTrip(madri)).toEqual([]);
    expect(seasonalRows(madri)).toEqual([]);
    expect(closureOnDate('Madri', '2026-12-25')).toEqual([]);
    expect(dayAlert('Madri', '2026-12-25')).toBeNull();
    expect(seasonalForTrip({} as never)).toEqual([]);
    const { container } = render(createElement(SeasonalCard, { trip: madri }));
    expect(container.innerHTML).toBe('');
    cleanup();
  });
  it('viagem que cruza o mês: dois blocos; 01/01 acha fechamento', () => {
    const t = { destination: 'Paris', startDate: '2026-12-28', endDate: '2027-01-03' };
    expect(seasonalForTrip(t).map((n) => n.month)).toEqual([12, 1]);
    expect(seasonalRows(t).filter((r) => r.kind === 'title')).toHaveLength(2);
    expect(closureOnDate('Paris', '2027-01-01').length).toBeGreaterThan(0);
  });
  it('card fechado por padrão e verify nunca aparece', () => {
    render(createElement(SeasonalCard, { trip: paris1 }));
    expect(screen.getByTestId('painel-seasonal')).toBeTruthy();
    expect(screen.queryByText(/Giverny/)).toBeNull();
    cleanup();
    const all = seasonalRows(paris1).map((r) => r.text).join('\n');
    const verify = SEASONAL_NOTES.find((n) => n.city === 'Paris' && n.month === 12)!.verify;
    verify.forEach((v) => expect(all.includes(v)).toBe(false));
  });
});
