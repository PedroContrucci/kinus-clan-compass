import { describe, it, expect } from 'vitest';
import { placePhotoUrl } from '@/lib/placePhoto';

describe('placePhotoUrl', () => {
  it('tira o prefixo day-N- e usa w=640', () => {
    expect(placePhotoUrl('day-3-for-mercado-peixes')).toMatch(/\/functions\/v1\/place-photo\?id=for-mercado-peixes&w=640$/);
  });
  it('respeita a largura', () => {
    expect(placePhotoUrl('x', 320)).toMatch(/w=320$/);
  });
  it('id vazio → null', () => {
    expect(placePhotoUrl('')).toBeNull();
    expect(placePhotoUrl(undefined)).toBeNull();
  });
});
