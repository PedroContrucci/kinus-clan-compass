// M22b-4 — as marcas dos itens importados sobrevivem ao CAMINHO REAL:
// buildAgentImport → addTrip (localStorage) → listTrips → RoteiroDia. Sem rede.
import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { RoteiroDia } from '@/components/cockpit/RoteiroDia';
import { buildAgentImport, type ImportAgentParams } from '@/lib/importAgent';
import { addTrip, listTrips } from '@/lib/tripStore';
import { kinuDidLines } from '@/lib/onboardingFlow';
import type { TripActivity } from '@/types/trip';

afterEach(cleanup);
const noRoute = async () => null;
const it_ = (nome: string, tipo = 'passeio', hora?: string) => ({ nome, tipo, ...(hora ? { hora } : {}) });

const PARAMS: ImportAgentParams = {
  destino: 'Paris', data_ida: '2026-12-07', data_volta: '2026-12-11', viajantes: 4, adultos: 2, criancas_idades: [8, 12], origem: 'São Paulo',
  dias: [
    { dia: 1, itens: [it_('Passeio leve no Marais'), it_('Breizh Café', 'refeicao')] },
    { dia: 2, itens: [it_('Museu do Louvre', 'passeio', '09:00'), it_('Bouillon Chartier', 'refeicao'), it_('Jardim das Tulherias', 'passeio', '15:00'), it_("Le Relais de l'Entrecôte", 'refeicao')] },
    { dia: 3, itens: [it_('Torre Eiffel', 'passeio', '10:00'), it_('Café Constant', 'refeicao'), it_('cruzeiro no Sena', 'passeio', '15:00')] },
    { dia: 4, itens: [it_("Museu d'Orsay", 'passeio', '09:30'), it_("L'As du Fallafel", 'refeicao'), it_('Sainte-Chapelle', 'passeio', '15:00'), it_('Angelina', 'refeicao')] },
    { dia: 5, itens: [it_('Montmartre e Sacré-Cœur')] },
  ],
};

type Trip = ReturnType<typeof listTrips>[number];
let trip: Trip;
let resumo: Awaited<ReturnType<typeof buildAgentImport>> & { ok: true };

beforeAll(async () => {
  localStorage.clear();
  const out = await buildAgentImport(PARAMS, 'São Paulo', { routeLookup: noRoute });
  if (out.ok === false) throw new Error(out.message);
  resumo = out;
  addTrip(out.trip);
  trip = listTrips().find((t) => t.id === out.trip.id)!;
});

const flat = () => trip.days.flatMap((d) => d.activities.map((a) => ({ d, a: a as TripActivity & Record<string, unknown> })));
const mountDay = (idx: number) => {
  const d = trip.days[idx];
  return render(
    <RoteiroDia dayNumber={d.day} date={new Date(d.date as string)} activities={d.activities as TripActivity[]} destination="Paris" liveLegs={null}
      expandedIds={new Set()} onToggleExpand={() => {}} onCollapseAll={() => {}}
      renderMap={() => null} routeOpen={false} onRouteToggle={() => {}} onSwap={() => {}} />,
  );
};

describe('M22b-4 — marcas após criação → store → tela', () => {
  it('resumo da biblioteca: 14 itens, 11 reconhecidos, 3 do seu roteiro', () => {
    expect(resumo.resumo.itens).toBe(14);
    expect(resumo.resumo.reconhecidos).toHaveLength(11);
    expect(resumo.resumo.livres).toHaveLength(3);
  });

  it('as marcas sobrevivem à leitura da store', () => {
    const all = flat();
    expect(trip.importedFrom).toBe('user');
    expect(all.filter(({ a }) => a.importedFrom === 'user')).toHaveLength(3);
    expect(all.filter(({ a }) => a.semValor === true)).toHaveLength(3);
    expect(all.filter(({ a }) => typeof a.importedName === 'string')).toHaveLength(14);
    expect(all.filter(({ a }) => a.foraDaJanela === true).map(({ a }) => a.name)).toContain('Montmartre & Sacré-Cœur');
  });

  it('tela: selo e "sem valor" nos 3 livres, "· N sem valor" no cabeçalho, aviso de janela no dia da volta', () => {
    const livres = flat().filter(({ a }) => a.importedFrom === 'user');
    let selos = 0, semValor = 0, janela = 0;
    trip.days.forEach((d, idx) => {
      if (!d.activities.some((a) => (a as unknown as Record<string, unknown>).importedName)) return;
      const { container, unmount } = mountDay(idx);
      const text = container.textContent ?? '';
      const nLivres = livres.filter((l) => l.d === d).length;
      selos += (text.match(/Do seu roteiro/g) ?? []).length;
      semValor += (text.match(/· sem valor/g) ?? []).length;
      if (nLivres > 0) expect(container.querySelector('[data-roteiro-line="header"]')!.textContent).toContain(`${nLivres} sem valor`);
      janela += container.querySelectorAll('[data-testid="roteiro-aviso-janela"]').length;
      unmount();
    });
    expect(selos).toBe(3);
    expect(semValor).toBe(3);
    expect(janela).toBe(1);
  });

  it('linha de resumo: itens e dias do roteiro do usuário', () => {
    expect(kinuDidLines(trip).itinerary).toBe('14 itens do seu roteiro em 5 dias · 11 reconhecidos no catálogo');
  });
});
