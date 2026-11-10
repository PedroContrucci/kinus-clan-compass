// M21a — PDF: o rótulo de deslocamento sob cada item é o trecho do item ANTERIOR do dia até ele ("desde o anterior").
// Dia montado à mão (sem motor, sem SMOKE_SCENARIOS): coords de src/data/generated/coords.ts.
import { describe, it, expect, vi } from 'vitest';

const pdfTexts = vi.hoisted(() => [] as string[]);
vi.mock('jspdf', () => {
  class FakePdf {
    constructor() {
      const proxy: unknown = new Proxy(this, {
        get(_t, p) {
          if (p === 'then') return undefined;
          if (p === 'internal') return { pageSize: { getWidth: () => 210, getHeight: () => 297, width: 210, height: 297 }, getNumberOfPages: () => 1 };
          if (p === 'text') return (t: unknown) => { pdfTexts.push(Array.isArray(t) ? t.join(' ') : String(t)); return proxy; };
          if (p === 'getTextWidth') return (t: unknown) => String(t).length * 2;
          if (p === 'splitTextToSize') return (t: unknown) => [String(t)];
          if (p === 'getNumberOfPages' || p === 'getFontSize') return () => 1;
          return () => proxy;
        },
      });
      return proxy as FakePdf;
    }
  }
  return { default: FakePdf, jsPDF: FakePdf };
});
vi.mock('qrcode', () => ({ default: { toDataURL: async () => '' } }));

import { exportTripPDF } from '@/lib/tripPdfExport';

const act = (id: string, name: string, category: string, time: string) => ({
  id: `day-6-${id}`, name, category, type: category, time, status: 'planned', description: '', cost: 0, location: '',
});

describe('M21a — PDF: rótulo "desde o anterior"', () => {
  it('Lisboa 26/12 (dia à mão): Ponto Final = Jerónimos→Ponto Final; Santa Justa = Ponto Final→Santa Justa (táxi); 1º item sem rótulo', async () => {
    const trip = {
      id: 'm21a', destination: 'Lisboa', origin: 'São Paulo', startDate: '2026-12-20', endDate: '2026-12-27',
      travelers: { adults: 2, children: 0 }, status: 'draft',
      days: [{
        day: 7, date: '2026-12-26', title: 'Belém e Cacilhas',
        activities: [
          act('slot-breakfast', 'Café da manhã no hotel', 'restaurante', '08:00'),
          act('lis-jeronimos', 'Mosteiro dos Jerónimos', 'passeio', '09:30'),
          act('lis-ponto-final', 'Ponto Final (Cacilhas)', 'restaurante', '12:30'),
          act('lis-santa-justa-carmo', 'Elevador de Santa Justa e Convento do Carmo', 'passeio', '15:20'),
          act('lis-pap-acorda', "Pap'Açôrda", 'restaurante', '19:30'),
        ],
      }],
    };
    vi.stubGlobal('fetch', async () => { throw new Error('offline'); });
    vi.stubGlobal('Image', class { onerror?: () => void; onload?: () => void; set src(_u: string) { setTimeout(() => this.onerror?.(), 0); } });
    pdfTexts.length = 0;
    await expect(exportTripPDF(trip as never)).resolves.toBeUndefined();
    vi.unstubAllGlobals();

    const hint = (name: string) => {
      const i = pdfTexts.findIndex((t) => t === name);
      expect(i, name).toBeGreaterThanOrEqual(0);
      // o rótulo é impresso logo abaixo do nome, antes do próximo item
      return pdfTexts.slice(i + 1, i + 3).find((t) => /desde o anterior/.test(t));
    };
    const labels = pdfTexts.filter((t) => /desde o anterior/.test(t));

    // Jerónimos → Ponto Final: 4,50 km = "~20 min de táxi"
    expect(hint('Ponto Final (Cacilhas)')).toBe('~20 min de táxi desde o anterior');
    // Ponto Final → Santa Justa: 3,39 km = "~15 min de táxi", nunca a pé
    const sj = hint('Elevador de Santa Justa e Convento do Carmo');
    expect(sj).toBe('~15 min de táxi desde o anterior');
    expect(sj).not.toMatch(/a pé/);
    // 1º item do dia (sem anterior): nenhum rótulo logo abaixo
    const i0 = pdfTexts.findIndex((t) => t === 'Café da manhã no hotel');
    expect(i0).toBeGreaterThanOrEqual(0);
    expect(pdfTexts.slice(i0 + 1, i0 + 3).some((t) => /desde o anterior/.test(t))).toBe(false);
    // nenhum rótulo "a pé" impróprio nem no sentido antigo
    expect(labels.every((t) => /desde o anterior$/.test(t))).toBe(true);
  }, 60000);
});
