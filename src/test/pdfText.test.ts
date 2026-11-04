import { describe, it, expect } from 'vitest';
import { jsPDF } from 'jspdf';
import { pdfSafe, cuisinePt, localizeCuisineTip, plural, stopsLabel, baggageLabel, packingClimate, monthOf } from '@/lib/pdfText';

describe('pdfSafe', () => {
  it('troca ⭐ por * e preserva acentos/WinAnsi', () => {
    expect(pdfSafe('Le Jules Verne ⭐ Michelin')).toBe('Le Jules Verne * Michelin');
    expect(pdfSafe('ã ç é — € •')).toBe('ã ç é — € •');
  });
  it('NFD vira NFC e emoji some', () => {
    expect(pdfSafe('Café 🍷')).toBe('Café ');
    expect(pdfSafe('a → b')).toBe('a > b');
  });
  it('jsPDF real: string com ⭐ sai em 8 bits (Tj legível)', () => {
    const doc = new jsPDF();
    doc.text(pdfSafe('Rota: Louvre › Jules Verne ⭐ Michelin ã'), 10, 10);
    const tj = doc.output().split('\n').find((l) => l.includes('Tj')) ?? '';
    expect(tj).toContain('Rota: Louvre');
    expect(tj).not.toMatch(/R o t a/);
  });
});

describe('culinária / plural', () => {
  it('mapeia e cai no próprio valor', () => {
    expect(cuisinePt('French')).toBe('Francesa');
    expect(cuisinePt('Japanese')).toBe('Japonesa');
    expect(cuisinePt('Klingon')).toBe('Klingon');
    expect(localizeCuisineTip('Cozinha French')).toBe('Cozinha Francesa');
    expect(localizeCuisineTip('Cozinha Klingon')).toBe('Cozinha Klingon');
    // dica por atividade chega ao PDF como description (draftItinerary: tips[0]); L'Ambroisie = 'French'
    expect(localizeCuisineTip(' Cozinha French ')).toBe('Cozinha Francesa');
    expect(localizeCuisineTip('Reserve com 2-3 semanas')).toBe('Reserve com 2-3 semanas');
  });
  it('M8b: culinárias novas e valores revisados', () => {
    expect(cuisinePt('French-Chinese')).toBe('Franco-chinesa');
    expect(cuisinePt('Lebanese')).toBe('Libanesa');
    expect(cuisinePt('Asian')).toBe('Asiática');
  });
  it('M8b: Modern French → Francesa contemporânea; Steakhouse → Churrascaria', () => {
    expect(cuisinePt('Modern French')).toBe('Francesa contemporânea');
    expect(localizeCuisineTip('Cozinha Steakhouse')).toBe('Cozinha Churrascaria');
  });
  it('M8b: culinária desconhecida segue intacta', () => {
    expect(cuisinePt('Ethiopian')).toBe('Ethiopian');
  });
  it('plural', () => {
    expect(plural(1, 'viajante', 'viajantes')).toBe('1 viajante');
    expect(plural(2, 'viajante', 'viajantes')).toBe('2 viajantes');
  });
});

describe('escala e bagagem', () => {
  it('direto / 1 escala / sem dado', () => {
    expect(stopsLabel({ isDirect: true })).toBe('direto');
    expect(stopsLabel({ isDirect: false, segments: [{ arrival: { iataCode: 'MAD' } }, { arrival: { iataCode: 'CDG' } }] })).toBe('1 escala (MAD)');
    expect(stopsLabel({ isDirect: false, connectionCity: 'LIS' })).toBe('1 escala (LIS)');
    expect(stopsLabel(undefined)).toBe('escala a confirmar');
    expect(baggageLabel({})).toBe('bagagem a confirmar');
  });
});

describe('mala por clima', () => {
  it('Paris nov: frio sem praia; Phuket jul: praia', () => {
    expect(packingClimate({ destination: 'Paris', country: 'França', month: 11 })).toEqual({ cold: true, beach: false });
    expect(packingClimate({ destination: 'Phuket', country: 'Tailândia', month: 7 }).cold).toBe(false);
    expect(packingClimate({ destination: 'Barcelona', country: 'Espanha', month: 7 }).beach).toBe(true);
  });
  it('hemisfério sul', () => {
    expect(packingClimate({ destination: 'Buenos Aires', country: 'Argentina', month: 7 }).cold).toBe(true);
    expect(packingClimate({ destination: 'Buenos Aires', country: 'Argentina', month: 1 }).cold).toBe(false);
    expect(packingClimate({ destination: 'Rio de Janeiro', country: 'Brasil', month: 2 })).toEqual({ cold: false, beach: true });
  });
  it('monthOf sem UTC', () => {
    expect(monthOf('2026-11-01')).toBe(11);
    expect(monthOf(undefined)).toBe(7);
  });
});
