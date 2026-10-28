// Verificação descartável (apagada depois): ordem e textos das duas portas.
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlanDoors } from '@/components/onboarding/PlanDoors';

describe('PlanDoors — ordem e textos', () => {
  it('KINU AI vem primeiro, com subtítulo; escolher na tela depois', () => {
    render(<PlanDoors onInterface={() => {}} onAgent={() => {}} />);
    const doors = screen.getAllByRole('button');
    const texts = doors.map((d) => d.textContent);
    expect(texts[0]).toBe('💬 Conversar com o KINU AIDiga só a ideia. Ele pergunta o que falta e monta o rascunho.▸');
    expect(texts[1]).toBe('🧭 Escolher na telaContinente, país, cidade, datas: você monta passo a passo.▸');
    expect(screen.getByText('Do jeito que preferir — o rascunho sai igual.')).toBeTruthy();
  });

  it('cada porta chama a navegação certa', () => {
    const onAgent = () => {};
    const onInterface = () => {};
    render(<PlanDoors onInterface={onInterface} onAgent={onAgent} />);
    const doors = screen.getAllByRole('button');
    expect(doors).toHaveLength(2);
  });
});
