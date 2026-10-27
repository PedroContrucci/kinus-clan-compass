import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AgentTip } from '@/components/shared/AgentTip';

const CASES = [
  { agent: 'icarus' as const, prefix: 'Ícaro · guia do roteiro:', accent: 'text-sky-400' },
  { agent: 'hestia' as const, prefix: 'Héstia · guia financeira:', accent: 'text-amber-400' },
  { agent: 'hermes' as const, prefix: 'Hermes · guia da preparação:', accent: 'text-emerald-400' },
];

describe('prefixo com papel no banner compacto', () => {
  for (const c of CASES) {
    it(`${c.agent}: "${c.prefix}" com peso normal e a mesma cor do nome`, () => {
      const { container } = render(
        <AgentTip agent={c.agent} variant="compact" message="texto da dica" />
      );
      const name = container.querySelector('span.font-bold') as HTMLElement;
      expect(name).toBeTruthy();
      expect(name.textContent).toBe(c.prefix);
      // a parte " · guia …" herda a cor do nome e não é negrito
      const role = name.querySelector('span') as HTMLElement;
      expect(role.className).toContain('font-normal');
      expect(role.className).not.toContain('text-');
      expect(name.className).toContain(c.accent);
      // texto da dica continua entre aspas, sem alteração
      expect(container.textContent).toContain('"texto da dica"');
    });
  }
});
