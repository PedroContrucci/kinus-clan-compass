// M22b-3 — importar_roteiro: handler puro, cartão e leitura do kinu-ai/index.ts. Sem rede, cena fixa.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildAgentImport, importCardLines, normalizeImportDays, type ImportAgentParams } from '@/lib/importAgent';
import { kinuDidLines } from '@/lib/onboardingFlow';

const noRoute = async () => null;
const item = (nome: string, hora?: string, tipo = 'passeio') => ({ nome, hora, tipo });
const PARIS: ImportAgentParams = {
  destino: 'Paris', data_ida: '2026-12-07', data_volta: '2026-12-11', viajantes: 4, adultos: 2, criancas_idades: [8, 12], origem: 'São Paulo',
  dias: [
    { dia: 1, itens: [item('Marais', '16:00'), item('Breizh Café', '19:30', 'refeicao')] },
    { dia: 2, itens: [item('Museu do Louvre', '09:00'), item('Bouillon Chartier', '12:30', 'refeicao'), item('Jardim das Tulherias', '15:00'), item("Le Relais de l'Entrecôte", '19:30', 'refeicao')] },
    { dia: 3, itens: [item('Torre Eiffel', '10:00'), item('Café Constant', '12:30', 'refeicao'), item('cruzeiro no Sena', '15:00')] },
    { dia: 4, itens: [item("Museu d'Orsay", '09:30'), item("L'As du Fallafel", '12:30', 'refeicao'), item('Sainte-Chapelle', '15:00'), item('Notre-Dame', '16:30'), item('Angelina', '17:30', 'refeicao')] },
    { dia: 5, itens: [item('Montmartre e Sacré-Cœur', '09:00')] },
  ],
};

describe('M22b-3 — importar_roteiro', () => {
  it('cena de Paris: 12 reconhecidos, 3 do seu roteiro, Louvre fechado; textos do cartão', async () => {
    const out = await buildAgentImport(PARIS, 'São Paulo', { routeLookup: noRoute });
    if (out.ok === false) throw new Error(out.message);
    expect(out.resumo.itens).toBe(15);
    expect(out.resumo.reconhecidos).toHaveLength(12);
    expect(out.resumo.livres).toHaveLength(3);
    expect(out.resumo.emDiaFechado.map((x) => x.nome.toLowerCase()).join()).toContain('louvre');
    expect(out.trip.importedFrom).toBe('user');
    expect(out.trip.createdVia).toBe('kinu');
    const { lines } = importCardLines(PARIS);
    expect(lines[0]).toBe('Importar roteiro · Paris · 07/12 → 11/12 · 2 adultos + 2 crianças (8 e 12 anos) · saindo de São Paulo');
    expect(lines[1]).toBe('5 dias · 15 itens · 12 reconhecidos no catálogo KINU · 3 do seu roteiro');
    expect(lines[2]).toMatch(/^1 em dia fechado$/);
    expect(lines).toHaveLength(3);
    // "O que o KINU fez": dias da viagem (6, com o dia do voo), não do roteiro; só muda para viagem importada
    expect(kinuDidLines(out.trip).itinerary).toBe('15 itens do seu roteiro em 5 dias · 12 reconhecidos no catálogo');
  });

  it('Cusco → recusa, nada criado', async () => {
    const out = await buildAgentImport({ ...PARIS, destino: 'Cusco' }, 'São Paulo', { routeLookup: noRoute });
    expect(out.ok).toBe(false);
    if (out.ok === false) { expect(out.kind).toBe('fora_da_lista'); expect(out.message).toContain('Cusco'); }
  });

  it('41 itens → corta em 40 e sinaliza', async () => {
    const dias = Array.from({ length: 6 }, (_, i) => ({ dia: i + 1, itens: Array.from({ length: i === 5 ? 6 : 7 }, (_, k) => item(`Lugar ${i}-${k}`)) }));
    expect(dias.reduce((n, d) => n + d.itens.length, 0)).toBe(41);
    const n = normalizeImportDays(dias);
    expect(n.days.reduce((a, d) => a + d.itens.length, 0)).toBe(40);
    expect(n.cut).toBe(true);
    expect(importCardLines({ ...PARIS, dias }).lines.at(-1)).toBe('roteiro cortado em 40 itens');
    expect(normalizeImportDays(PARIS.dias).cut).toBe(false);
  });
});

describe('M22b-3 — kinu-ai/index.ts (texto)', () => {
  const src = readFileSync('supabase/functions/kinu-ai/index.ts', 'utf8');
  it('ferramenta, limites e regra nova', () => {
    expect(src).toContain('name: "importar_roteiro"');
    expect(src).toContain('max_tokens: 2048');
    expect(src).not.toContain('max_tokens: 1024');
    expect(src).toContain('const MAX_MESSAGE_CHARS = 6000');
    expect(src).toContain('10b. ROTEIRO PRONTO');
    expect(src).toContain('É PROIBIDO afirmar quais lugares existem no catálogo');
    expect(src).toContain('maxItems: 10');
    expect(src).toContain('maxItems: 8');
    expect(src).toContain('11. ');
    expect(src).toContain('13. ORÇAMENTO SEM NÚMERO DE MEMÓRIA');
    expect(src).toContain('16. DECISÃO DE ORÇAMENTO');
  });
  it('importar_roteiro não é resolvida no servidor', () => {
    const m = /SERVER_RESOLVED_TOOLS\s*=\s*new Set\(\[([^\]]*)\]/.exec(src);
    expect(m![1]).not.toContain('importar_roteiro');
  });
});
