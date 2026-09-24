import { describe, it, expect, beforeEach } from 'vitest';
import { findDuplicate } from '@/lib/claDedupe';
import { CLA_DAILY_CAP, canSuggestToday, markSuggestionToday } from '@/lib/claDailyCap';
import { buildSuggestionRow } from '@/lib/cla';

describe('findDuplicate', () => {
  const catalog = [{ name: 'Le Baratin' }];
  const pending = [
    { id: 's1', name: 'Cantina do Zé', status: 'pending' },
    { id: 's2', name: 'Bar Velho', status: 'rejected' },
  ];
  it('casa catálogo ignorando acento/caixa', () => {
    expect(findDuplicate('  le baratin ', catalog, pending)).toEqual({ kind: 'catalog', name: 'Le Baratin' });
  });
  it('casa sugestão pendente', () => {
    expect(findDuplicate('cantina do ze', catalog, pending)).toEqual({ kind: 'suggested', name: 'Cantina do Zé', suggestionId: 's1' });
  });
  it('ignora recusadas e inéditos', () => {
    expect(findDuplicate('Bar Velho', catalog, pending)).toBeNull();
    expect(findDuplicate('Novo Lugar', catalog, pending)).toBeNull();
  });
});

describe('claDailyCap', () => {
  beforeEach(() => localStorage.clear());
  it('bloqueia após 5 no dia', () => {
    const now = new Date('2026-09-24T12:00:00Z');
    for (let i = 0; i < CLA_DAILY_CAP; i++) markSuggestionToday('u', now);
    expect(canSuggestToday('u', now)).toBe(false);
    expect(canSuggestToday('u', new Date('2026-09-25T12:00:00Z'))).toBe(true);
  });
});

describe('buildSuggestionRow', () => {
  it('sem coordenada vira coord_source none', () => {
    const r = buildSuggestionRow('u', { city: 'Paris', name: ' X y z ', category: 'other', coordSource: 'gps', lat: null, lng: null });
    expect(r).toMatchObject({ name: 'X y z', lat: null, lng: null, coord_source: 'none', status: 'pending', lived: false, family_ok: false });
  });
  it('mantém pin', () => {
    const r = buildSuggestionRow('u', { city: 'Paris', name: 'Abc', category: 'other', coordSource: 'pin', lat: 1, lng: 2, priceRange: 'ate50' });
    expect(r).toMatchObject({ lat: 1, lng: 2, coord_source: 'pin', price_range: 'ate50' });
  });
});
