// C.5a — o que a viagem mostra é decidido pelo recorte doméstica/internacional, e número
// sem origem não aparece: câmbio só fora do Brasil (e fechado), checklist sem passaporte
// em viagem doméstica, clima só com previsão real, alerta/resposta de preço só com real vs real.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { defaultChecklist } from '@/types/trip';

vi.mock('@/hooks/useExchangeRates', () => ({
  useExchangeRates: () => ({
    rates: { USD: 1 / 5.09 },
    history: [],
    statistics: null,
    loading: false,
    error: null,
    lastUpdated: null,
    refresh: vi.fn(),
    getInsight: () => ({ type: 'neutral', message: 'Cotação estável' }),
    targetCurrency: 'USD',
    updatedAgo: 'Atualizado agora',
  }),
}));

vi.mock('@/hooks/useWeather', () => ({
  useWeather: () => ({ forecast: null, isLoading: false, error: null, fetchWeather: vi.fn(), getRainAlert: () => null }),
}));

import { CambioBlock, ChecklistBlocks } from '@/components/viagens/TripScopeBlocks';
import { SmartPackingWithLuggage } from '@/components/cockpit/SmartPackingWithLuggage';
import { buildOfferCheckReply, formatTileBRL, isDomesticTrip, scopeChecklist, NO_COMPARABLE_PRICE_REPLY } from '@/lib/tripScope';

const fortaleza = { destination: 'Fortaleza', country: 'Brasil', budget: 8000 };
const lisboa = { destination: 'Lisboa', country: 'Portugal', budget: 20000 };

describe('C.5a — viagem doméstica', () => {
  it('não mostra câmbio nem itens de viagem internacional no checklist', () => {
    expect(isDomesticTrip(fortaleza)).toBe(true);
    const { container } = render(<CambioBlock trip={fortaleza} destinationCurrency="BRL" />);
    expect(container.innerHTML).toBe('');

    const scoped = scopeChecklist(defaultChecklist, true);
    const visible = scoped.items.filter((i) => !scoped.hiddenIds.includes(i.id));
    render(<ChecklistBlocks items={visible.map((i) => ({ ...i, checked: true }))} onToggle={() => {}} />);
    // tudo completo → nenhum aberto; abre Documentos e Packing para ler os rótulos
    fireEvent.click(screen.getByText('📄 Documentos'));
    expect(screen.queryByText('Passaporte válido')).toBeNull();
    expect(screen.getByText('3/3')).toBeTruthy();
    fireEvent.click(screen.getByText('🧳 Packing'));
    expect(screen.getByText('Carregadores')).toBeTruthy();
    expect(screen.queryByText('Carregadores e adaptadores')).toBeNull();
    fireEvent.click(screen.getByText('✈️ Pré-Viagem'));
    expect(screen.queryByText('Chip internacional ou roaming')).toBeNull();
    expect(screen.queryByText('Avisar banco sobre viagem')).toBeNull();
  });

  it('o voo decide antes do catálogo', () => {
    const lisboaVooDomestico = { ...lisboa, outboundFlight: { international: false } };
    const fortalezaVooInternacional = { ...fortaleza, outboundFlight: { international: true } };
    expect(isDomesticTrip(lisboaVooDomestico)).toBe(true);
    expect(isDomesticTrip(fortalezaVooInternacional)).toBe(false);
  });
});

describe('C.5a — viagem internacional', () => {
  it('mostra o câmbio fechado numa linha; o detalhe só ao abrir', () => {
    expect(isDomesticTrip(lisboa)).toBe(false);
    render(<CambioBlock trip={lisboa} destinationCurrency="USD" />);
    expect(screen.getByText(/1 USD = R\$ 5,09/)).toBeTruthy();
    expect(screen.queryByText(/Cotação Atual/)).toBeNull();
    fireEvent.click(screen.getByText('ver ▸'));
    expect(screen.getByText(/Cotação Atual/)).toBeTruthy();
    expect(screen.queryByText(/Predição/)).toBeNull();
  });
});

describe('C.5a — clima sem fonte', () => {
  it('sem previsão real não há bloco de clima (nem faixa padrão)', () => {
    render(<SmartPackingWithLuggage tripId="t1" destination="Fortaleza" duration={5} />);
    expect(screen.queryByText(/KINU diz/)).toBeNull();
    expect(screen.queryByText(/°C/)).toBeNull();
    expect(screen.queryByText(/previsão · OpenWeather/)).toBeNull();
    expect(screen.getByText('adicionar ▸')).toBeTruthy();
  });
});

describe('C.5a — tiles do Financeiro', () => {
  it('inteiro até 10 mil; k só acima', () => {
    expect(formatTileBRL(0)).toBe('R$ 0');
    expect(formatTileBRL(9016)).toBe('R$ 9.016');
    expect(formatTileBRL(12345)).toBe('R$ 12,3k');
    expect(formatTileBRL(-500)).toBe('-R$ 500');
  });
});

describe('C.5a — verificar_ofertas sem fonte comparável', () => {
  it('não devolve número quando a consulta não é real vs real', () => {
    const trip = { ...fortaleza, outboundFlight: { source: 'estimate', priceSource: 'route' } };
    const reply = buildOfferCheckReply(trip, { price: 1200, delta: -9016 }, 10216, 'https://kiwi.example/x');
    expect(reply.startsWith(NO_COMPARABLE_PRICE_REPLY)).toBe(true);
    expect(reply).not.toMatch(/R\$\s?\d/);
  });
});
