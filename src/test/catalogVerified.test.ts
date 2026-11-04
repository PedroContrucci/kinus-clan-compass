import { describe, it, expect } from 'vitest';
import { catalogVerifiedLabel } from '@/lib/catalogVerified';
import { CATALOG_VERIFIED_AT } from '@/data/generated/catalogVerified';

const [city, iso] = Object.entries(CATALOG_VERIFIED_AT)[0];
const [y, m, d] = iso.split('-').map(Number);
const dmy = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;

describe('catalogVerifiedLabel', () => {
  it('com data recente: rótulo com dd/mm/aaaa, sem aviso', () => {
    expect(catalogVerifiedLabel(city, new Date(y, m - 1, d + 10))).toBe(`Lugares verificados no Google em ${dmy}`);
  });
  it('exatamente 60 dias: ainda sem aviso; 61: com aviso', () => {
    expect(catalogVerifiedLabel(city, new Date(y, m - 1, d + 60))).not.toContain('reconferência');
    expect(catalogVerifiedLabel(city, new Date(y, m - 1, d + 61))).toBe(
      `Lugares verificados no Google em ${dmy} · reconferência em breve`
    );
  });
  it('sem data (cidade desconhecida ou vazia): null', () => {
    expect(catalogVerifiedLabel('Atlântida')).toBeNull();
    expect(catalogVerifiedLabel(undefined)).toBeNull();
  });
});
