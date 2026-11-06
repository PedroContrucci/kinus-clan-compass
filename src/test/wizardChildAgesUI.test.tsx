// O seletor de idade abaixo do contador de Crianças: um por criança, rótulo
// "Idade da criança N", começa vazio (2–17) e grava em children[i].age.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { WizardStep2Travelers } from '@/components/wizard/WizardStep2Travelers';
import type { WizardData } from '@/components/wizard/types';

const data = (over: Partial<WizardData> = {}): WizardData =>
  ({ adults: 2, children: [], infants: 0, ...over } as WizardData);

// O Radix abre no "click" (o ponteiro sem tipo é tratado como toque), então um clique
// simples no gatilho basta para abrir a lista de idades.
const openAgeSelect = (n: number) => {
  const trigger = screen.getByRole('combobox', { name: `Idade da criança ${n}` });
  fireEvent.click(trigger);
  return trigger;
};

describe('seletor de idade das crianças no passo Viajantes', () => {
  it('um seletor por criança, com rótulo e vazio por padrão', () => {
    render(
      <WizardStep2Travelers
        data={data({ children: [{ id: 'c1', type: 'child' }, { id: 'c2', type: 'child' }] })}
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Idade da criança 1')).toBeTruthy();
    expect(screen.getByText('Idade da criança 2')).toBeTruthy();
    const triggers = screen.getAllByRole('combobox');
    expect(triggers).toHaveLength(2);
    for (const t of triggers) expect(t.textContent).toContain('Selecione');
  });

  it('escolher a idade grava em children[i].age', () => {
    const onChange = vi.fn();
    render(
      <WizardStep2Travelers
        data={data({ children: [{ id: 'c1', type: 'child' }, { id: 'c2', type: 'child', age: 3 }] })}
        onChange={onChange}
      />,
    );
    openAgeSelect(1);
    const list = screen.getByRole('listbox');
    fireEvent.click(within(list).getByRole('option', { name: '7 anos' }));
    expect(onChange).toHaveBeenCalledWith({
      children: [{ id: 'c1', type: 'child', age: 7 }, { id: 'c2', type: 'child', age: 3 }],
    });
  });

  it('o seletor vai de 2 a 17 anos', () => {
    render(
      <WizardStep2Travelers
        data={data({ children: [{ id: 'c1', type: 'child' }] })}
        onChange={() => {}}
      />,
    );
    openAgeSelect(1);
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(16);
    expect(options[0].textContent).toContain('2 anos');
    expect(options[15].textContent).toContain('17 anos');
  });
});
