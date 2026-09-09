// Trava de deriva do artefato de catálogo da edge function.
//
// `supabase/functions/kinu-ai/catalog.ts` é gerado a partir de src/data/ e viaja
// com o deploy da function. Se alguém rodar o sync (ou editar o catálogo à mão) e
// esquecer de regerar, o agente passa a servir catálogo velho com cara de novo —
// que é o defeito de 09/09/2026 ao contrário: em vez de negar o que existe, afirmar
// o que não existe mais.
//
// Este teste não reimplementa o gerador: chama o próprio, em modo --check.
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { CURATED_CITIES } from '@/lib/curatedCities';

const ROOT = resolve(__dirname, '../..');
const ARTIFACT = resolve(ROOT, 'supabase/functions/kinu-ai/catalog.ts');

describe('artefato de catálogo da kinu-ai', () => {
  it('existe', () => {
    expect(existsSync(ARTIFACT)).toBe(true);
  });

  it('está em dia com src/data/ (npx tsx scripts/build-kinu-catalog.ts)', () => {
    // Falha com a mensagem do gerador, que já diz o comando para consertar.
    expect(() =>
      execFileSync('npx', ['tsx', 'scripts/build-kinu-catalog.ts', '--check'], {
        cwd: ROOT,
        stdio: 'pipe',
      }),
    ).not.toThrow();
  }, 60_000);

  it('cobre as 21 cidades curadas e traz os hotéis junto', () => {
    const src = readFileSync(ARTIFACT, 'utf8');
    for (const city of CURATED_CITIES) {
      expect(src).toContain(`"city": ${JSON.stringify(city)}`);
    }
    // Os hotéis são a fundação da missão seguinte (o agente propor troca de hotel):
    // se o gerador parar de emiti-los, quero saber aqui e não lá.
    expect(src).toContain('"hotels"');
    expect(src).toContain('personaTags');
  });

  it('não é editado à mão', () => {
    expect(readFileSync(ARTIFACT, 'utf8')).toContain('GERADO por scripts/build-kinu-catalog.ts');
  });
});
