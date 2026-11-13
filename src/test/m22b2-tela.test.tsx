import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { RoteiroDia } from '@/components/cockpit/RoteiroDia';
import { replanFor, needsRegenerateConfirm, replanImportedTrip } from '@/lib/importItinerary';
import { replanTrip } from '@/lib/replanItinerary';
import type { TripActivity } from '@/types/trip';

afterEach(cleanup);

const base = (id: string, over: Record<string, unknown>) => ({
  id, time: '09:00', name: id, description: '', duration: '2h', cost: 0, type: 'activity', status: 'planned', ...over,
}) as unknown as TripActivity;

const cafe = base('day-1-import-cafe-constant', { time: '08:30', name: 'Café Constant', category: 'comida', cost: 0, semValor: true, importedFrom: 'user' });
const louvre = (extra: Record<string, unknown> = {}) => base('day-1-paris-louvre', { time: '10:00', name: 'Museu do Louvre', category: 'passeio', cost: 200, ...extra });
const tarde = base('day-1-import-tarde', { time: '17:00', name: 'Passeio sem tempo', category: 'passeio', cost: 0, semValor: true, importedFrom: 'user', foraDaJanela: true });

function mount(activities: TripActivity[], date: Date) {
  return render(
    <RoteiroDia dayNumber={2} date={date} activities={activities} destination="Paris" liveLegs={null}
      expandedIds={new Set()} onToggleExpand={() => {}} onCollapseAll={() => {}}
      renderMap={() => null} routeOpen={false} onRouteToggle={() => {}} onSwap={() => {}} />,
  );
}

describe('M22b-2 — tela da viagem importada', () => {
  const terca = new Date(2026, 11, 8);

  it('importada: selo, sem valor, aviso de dia fechado, fora da janela e total do dia', () => {
    const { container } = mount([cafe, louvre({ importedFrom: 'user', importedName: 'Museu do Louvre' }), tarde], terca);
    expect(screen.getAllByText('Do seu roteiro')).toHaveLength(3);
    expect(container.textContent).toContain('Café Constant · 2h · sem valor');
    expect(screen.getByTestId('roteiro-aviso-fechado').textContent).toContain('Fechado neste dia da semana (terça)');
    expect(screen.getByTestId('roteiro-aviso-janela').textContent).toContain('Não cabe antes do voo de volta');
    const header = container.querySelector('[data-roteiro-line="header"]')!.textContent!;
    expect(header).toContain('2 sem valor');
    expect(header).toMatch(/R\$\s?200/);
  });

  it('um único item sem valor: "1 sem valor"', () => {
    const { container } = mount([cafe, louvre({ importedFrom: 'user' })], terca);
    expect(container.querySelector('[data-roteiro-line="header"]')!.textContent).toContain('1 sem valor');
  });

  it('não importada, mesmos itens de catálogo: sem selo e sem "sem valor"; fechado vale igual', () => {
    const { container } = mount([louvre(), base('day-1-paris-orsay', { time: '15:00', name: "Museu d'Orsay", category: 'passeio', cost: 100 })], terca);
    expect(screen.queryByText('Do seu roteiro')).toBeNull();
    expect(container.textContent).not.toContain('sem valor');
    expect(screen.getByTestId('roteiro-aviso-fechado').textContent).toContain('(terça)');
    expect(screen.queryByTestId('roteiro-aviso-janela')).toBeNull();
  });

  it('em dia aberto (quarta) não há aviso de fechado', () => {
    mount([louvre()], new Date(2026, 11, 9));
    expect(screen.queryByTestId('roteiro-aviso-fechado')).toBeNull();
  });

  it('decisões puras: troca de voo e confirmação de regerar', () => {
    expect(replanFor({ importedFrom: 'user' })).toBe(replanImportedTrip);
    expect(replanFor({})).toBe(replanTrip);
    expect(replanFor({ importedFrom: 'outro' })).toBe(replanTrip);
    expect(needsRegenerateConfirm({ importedFrom: 'user' })).toBe(true);
    expect(needsRegenerateConfirm({})).toBe(false);
  });
});
