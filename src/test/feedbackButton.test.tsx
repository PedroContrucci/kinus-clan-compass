// `cla.feedback_sent`: UMA emissão por feedback enviado, com a tela que o usuário escolheu.
//
// O que este arquivo protege é a fiação do handler, não a entrega — o emissor tem suíte
// própria. Por isso o `readEvents()` do anel é a asserção: é o que o `trackEvent` grava
// antes de qualquer rede, e é exatamente o que a análise vai contar.
//
// Os dois clientes são mockados pelo motivo de sempre (`createClient` no import) e porque o
// handler faz um insert e um invoke que não têm nada a ver com o evento.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const insert = vi.fn();
const invoke = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({ insert: (row: unknown) => insert(row) }),
    functions: { invoke: (...args: unknown[]) => invoke(...args) },
  },
}));

vi.mock('@/integrations/kinu-beta/client', () => ({
  kinuBeta: {
    from: () => ({ insert: async () => ({ data: null, error: { code: '42501', message: 'denied' } }) }),
    auth: { getSession: async () => ({ data: { session: null }, error: null }) },
  },
}));

import { FeedbackButton } from '@/components/shared/FeedbackButton';
import { readEvents } from '@/lib/kinuEvents';

const feedbackEvents = () => readEvents().filter((e) => e.name === 'cla.feedback_sent');

beforeEach(() => {
  localStorage.clear();
  insert.mockReset();
  invoke.mockReset();
  insert.mockResolvedValue({ error: null });
  invoke.mockResolvedValue({ data: null, error: null });
});

/** Preenche o mínimo que o handler exige e clica em enviar. */
async function enviarFeedback() {
  render(<FeedbackButton />);
  fireEvent.click(screen.getByLabelText('Enviar feedback'));

  fireEvent.change(screen.getByPlaceholderText('Como podemos te chamar?'), {
    target: { value: 'Pedro' },
  });
  fireEvent.click(screen.getByText('🐛 Bug'));
  fireEvent.change(screen.getByRole('combobox'), { target: { value: '/cla' } });
  fireEvent.change(screen.getByPlaceholderText(/O botão de confirmar não apareceu/), {
    target: { value: 'o mapa não abriu' },
  });

  fireEvent.click(screen.getByText('Enviar Feedback'));
}

describe('cla.feedback_sent', () => {
  it('sai uma vez, com a tela escolhida no seletor', async () => {
    await enviarFeedback();

    await waitFor(() => expect(feedbackEvents()).toHaveLength(1));
    expect(feedbackEvents()[0].props).toEqual({ page: '/cla' });
  });

  it('sai mesmo quando o insert do feedback falha — o feedback foi salvo no aparelho', async () => {
    insert.mockResolvedValue({ error: { message: 'sem rede' } });

    await enviarFeedback();

    await waitFor(() => expect(feedbackEvents()).toHaveLength(1));
  });
});
