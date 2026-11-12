import { describe, it, expect } from 'vitest';
import { describeTravelers, planFromAgent } from '@/lib/destinationPicker';

const base = { destino: 'Paris', data_ida: '2026-12-07', data_volta: '2026-12-11', viajantes: 4 };

describe('M22a — criar_viagem carrega adultos, idades e origem', () => {
  it('2 adultos + crianças de 8 e 12, origem informada (sem "assumido")', () => {
    const plan = planFromAgent({ ...base, adultos: 2, criancas_idades: [8, 12], origem: 'São Paulo' }, undefined)!;
    expect(plan.input.adults).toBe(2);
    expect(plan.input.children).toHaveLength(2);
    expect((plan.input.children as { age?: number }[]).map((c) => c.age)).toEqual([8, 12]);
    expect(plan.children).toBe(2);
    expect(plan.origin).toEqual({ city: 'São Paulo', source: 'user' });
    expect(plan.input.originCity).toBe('São Paulo');
  });

  it('sem adultos: adultos = viajantes − crianças; idades inválidas são descartadas', () => {
    const plan = planFromAgent({ ...base, criancas_idades: [8, 99, 12] }, 'Recife')!;
    expect(plan.input.adults).toBe(2);
    expect(plan.children).toBe(2);
    expect(plan.origin).toEqual({ city: 'Recife', source: 'profile' });
  });

  it('sem os campos novos: igual ao comportamento anterior', () => {
    const plan = planFromAgent(base, undefined)!;
    expect(plan.input.adults).toBe(4);
    expect(plan.input.children).toEqual([]);
    expect(plan.children).toBe(0);
    expect(plan.origin).toEqual({ city: 'São Paulo', source: 'default' });
  });

  it('texto do cartão', () => {
    expect(describeTravelers({ ...base, adultos: 2, criancas_idades: [8, 12] })).toBe('2 adultos + 2 crianças (8 e 12 anos)');
    expect(describeTravelers({ ...base, criancas_idades: [1] })).toBe('3 adultos + 1 criança (1 ano)');
    expect(describeTravelers(base)).toBe('4 viajante(s)');
  });
});
