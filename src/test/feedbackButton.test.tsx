// `cla.feedback_sent`: UMA emissão por feedback enviado, com a tela que o usuário escolheu.
//
// O que este arquivo protege é a fiação do handler, não a entrega — o emissor tem suíte
// própria. Por isso o `readEvents()` do anel é a asserção: é o que o `trackEvent` grava
// antes de qualquer rede, e é exatamente o que a análise vai contar.
//
// Também protege o destino do insert: o feedback vai para o cliente kinu-beta (o mesmo
// de profiles/trips/eventos), tabela public.feedback, com message = só o texto do
// usuário e os metadados dentro do context jsonb. Os dois clientes são mockados pelo
// motivo de sempre (`createClient` no import).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// O kinuBeta é compartilhado: o trackEvent também insere por ele (tabela de eventos).
// Por isso o mock registra (tabela, row) e as asserções filtram por 'feedback'.
const insert = vi.fn();
const invoke = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: (...args: unknown[]) => invoke(...args) },
  },
}));

vi.mock('@/integrations/kinu-beta/client', () => ({
  kinuBeta: {
    from: (table: string) => ({
      insert: (row: unknown) => insert(table, row),
    }),
    auth: {
      getSession: async () => ({
        data: { session: { user: { id: 'user-123' }, access_token: 'tok' } },
        error: null,
      }),
    },
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

/** Só as linhas inseridas na tabela feedback (o trackEvent insere em outra tabela). */
const feedbackRows = () =>
  insert.mock.calls.filter(([table]) => table === 'feedback').map(([, row]) => row as Record<string, unknown>);

/** Preenche o mínimo que o handler exige e clica em enviar. */
async function enviarFeedback() {
  render(<FeedbackButton />);
  fireEvent.click(screen.getByLabelText('Enviar feedback'));

  fireEvent.change(screen.getByPlaceholderText('Como podemos te chamar?'), {
    target: { value: 'Pedro' },
  });
  fireEvent.click(screen.getByText('🐛 Bug'));
  fireEvent.click(screen.getByText('😕 Confuso'));
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

describe('insert no kinu-beta, tabela feedback', () => {
  it('vai para public.feedback do cliente kinu-beta, com as colunas do contrato', async () => {
    await enviarFeedback();

    await waitFor(() => expect(feedbackRows()).toHaveLength(1));

    const row = feedbackRows()[0];
    expect(row.user_id).toBe('user-123');
    expect(row.tester_name).toBe('Pedro');
    // message = só o texto do usuário, sem os campos opcionais embutidos
    expect(row.message).toBe('o mapa não abriu');
    // rating não preenchido vai como null, nunca 0
    expect(row.rating).toBeNull();
    expect(row.wanted_destination).toBeNull();
    // metadados dentro do context jsonb
    const context = row.context as Record<string, unknown>;
    expect(context.category).toBe('confusing');
    expect(context.page).toBe('/cla');
    expect(context).toHaveProperty('user_agent');
    expect(context).toHaveProperty('screen_size');
    expect(context).toHaveProperty('app_version');
  });

  it('rating preenchido vai como número; campos de pesquisa entram no context', async () => {
    render(<FeedbackButton />);
    fireEvent.click(screen.getByLabelText('Enviar feedback'));
    fireEvent.change(screen.getByPlaceholderText('Como podemos te chamar?'), {
      target: { value: 'Pedro' },
    });
    fireEvent.click(screen.getByText('💡 Sugestão'));
    fireEvent.change(screen.getByPlaceholderText(/O botão de confirmar não apareceu/), {
      target: { value: 'quero exportar em PDF' },
    });
    // 4 estrelas: os botões de estrela são os únicos com um svg Star dentro do grid de rating
    const starButtons = screen.getAllByRole('button').filter((b) => b.className.includes('hover:scale-110'));
    fireEvent.click(starButtons[3]);
    fireEvent.change(screen.getByPlaceholderText('ex.: Recife, Buenos Aires, Punta Cana'), {
      target: { value: 'Recife' },
    });
    fireEvent.click(screen.getByText('Enviar Feedback'));

    await waitFor(() => expect(insert).toHaveBeenCalledTimes(1));
    const row = insert.mock.calls[0][0] as Record<string, unknown>;
    expect(row.rating).toBe(4);
    expect(row.wanted_destination).toBe('Recife');
  });

  it('notify sai mesmo quando o insert falha, com o texto composto de hoje', async () => {
    insert.mockResolvedValue({ error: { message: 'denied' } });

    render(<FeedbackButton />);
    fireEvent.click(screen.getByLabelText('Enviar feedback'));
    fireEvent.change(screen.getByPlaceholderText('Como podemos te chamar?'), {
      target: { value: 'Pedro' },
    });
    fireEvent.click(screen.getByText('🐛 Bug'));
    fireEvent.change(screen.getByPlaceholderText(/O botão de confirmar não apareceu/), {
      target: { value: 'o mapa não abriu' },
    });
    fireEvent.change(screen.getAllByPlaceholderText('Opcional')[0], {
      target: { value: 'modo offline' },
    });
    fireEvent.click(screen.getByText('Enviar Feedback'));

    await waitFor(() => expect(invoke).toHaveBeenCalledTimes(1));
    const [fnName, opts] = invoke.mock.calls[0] as [string, { body: Record<string, unknown> }];
    expect(fnName).toBe('feedback-notify');
    // payload do notify inalterado: texto composto com [Sente falta]
    expect(opts.body.message).toBe('o mapa não abriu\n\n[Sente falta]: modo offline');
    expect(opts.body.category).toBe('bug');
  });
});
