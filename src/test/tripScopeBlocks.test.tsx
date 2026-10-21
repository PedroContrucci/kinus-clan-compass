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

import { CambioBlock, ChecklistBlocks, DestinationRulesBlock } from '@/components/viagens/TripScopeBlocks';
import { SmartPackingWithLuggage } from '@/components/cockpit/SmartPackingWithLuggage';
import { buildOfferCheckReply, destinationRules, formatTileBRL, isDomesticTrip, rulesSummary, scopeChecklist, NO_COMPARABLE_PRICE_REPLY } from '@/lib/tripScope';

const fortaleza = { destination: 'Fortaleza', country: 'Brasil', budget: 8000 };
const lisboa = { destination: 'Lisboa', country: 'Portugal', budget: 20000 };

describe('C.5a — viagem doméstica', () => {
  it('não mostra câmbio nem itens de viagem internacional no checklist', () => {
    expect(isDomesticTrip(fortaleza)).toBe(true);
    const { container } = render(<CambioBlock trip={fortaleza} destinationCurrency="BRL" />);
    expect(container.innerHTML).toBe('');

    const scoped = scopeChecklist(defaultChecklist, destinationRules(fortaleza));
    const visible = scoped.items.filter((i) => !scoped.hiddenIds.includes(i.id));
    render(<ChecklistBlocks items={visible.map((i) => ({ ...i, checked: true }))} onToggle={() => {}} />);
    // tudo completo → nenhum aberto; abre Documentos e Packing para ler os rótulos
    fireEvent.click(screen.getByText('📄 Documentos'));
    expect(screen.queryByText('Passaporte válido')).toBeNull();
    // C.9: sem passaporte e sem visto (Brasil não exige) → Seguro + Cópias
    expect(screen.queryByText('Visto ou autorização de entrada')).toBeNull();
    expect(screen.getByText('2/2')).toBeTruthy();
    fireEvent.click(screen.getByText('🧳 Packing'));
    expect(screen.getByText('Carregadores')).toBeTruthy();
    expect(screen.queryByText('Carregadores e adaptadores')).toBeNull();
    // C.9: sem câmbio, chip, banco e vacina (Brasil não exige) → a categoria some inteira
    expect(screen.queryByText('✈️ Pré-Viagem')).toBeNull();
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

// C.9 — o checklist lê o destino: item sem regra que o exija não aparece (nunca default "sim").
const visibleLabels = (trip: Parameters<typeof destinationRules>[0]) => {
  const scoped = scopeChecklist(defaultChecklist, destinationRules(trip));
  return scoped.items.filter((i) => !scoped.hiddenIds.includes(i.id)).map((i) => i.label);
};

describe('C.9 — Preparação por destino', () => {
  it('Fortaleza: sem passaporte, visto, vacina, adaptador nem câmbio', () => {
    const r = destinationRules(fortaleza);
    expect(r.currencyDiffers).toBe(false);
    const labels = visibleLabels(fortaleza);
    expect(labels).not.toContain('Passaporte válido');
    expect(labels.some((l) => /Visto|Vacina|Adaptador|Câmbio|Chip|banco/.test(l))).toBe(false);
    expect(labels).toContain('Carregadores');
    expect(labels).toContain('Seguro viagem (recomendado)');
  });

  it('Lisboa: passaporte, sem visto, sem vacina, sem adaptador (C/F aceita o plugue BR), seguro obrigatório, câmbio', () => {
    const r = destinationRules(lisboa);
    expect(r).toMatchObject({ international: true, visaRequired: false, vaccineRequired: false, plugDiffers: false, insuranceMandatory: true, currency: 'EUR', source: 'docs' });
    const labels = visibleLabels(lisboa);
    expect(labels).toContain('Passaporte válido');
    expect(labels).toContain('Seguro viagem obrigatório (Schengen)');
    expect(labels).toContain('Câmbio/cartão internacional');
    expect(labels).toContain('Carregadores');
    expect(labels.some((l) => /Visto|Vacina|Adaptador/.test(l))).toBe(false);
    expect(rulesSummary(r)).toBe('Portugal · sem visto até 90 dias · sem vacina · tomada C/F 230 V · seguro obrigatório');
  });

  it('Nova York (A/B) e Londres (G): adaptador com tipo e voltagem; visto/ETA vira "autorização de entrada"', () => {
    const ny = { destination: 'Nova York', country: 'Estados Unidos' };
    expect(visibleLabels(ny)).toContain('Adaptador de tomada (tipo A/B · 120 V) e carregadores');
    expect(visibleLabels(ny)).toContain('Visto ou autorização de entrada');
    const londres = { destination: 'Londres', country: 'Inglaterra' };
    expect(visibleLabels(londres)).toContain('Adaptador de tomada (tipo G · 230 V) e carregadores');
    expect(visibleLabels(londres)).toContain('Seguro viagem (recomendado)');
  });

  it('Cidade do Cabo: a vacina obrigatória do docs aparece com o nome', () => {
    expect(visibleLabels({ destination: 'Cidade do Cabo' })).toContain('Vacina obrigatória — febre amarela (CIVP)');
  });

  it('país pelo catálogo (Porto → Portugal) e fallback pdfData só para visto/tomada/Schengen (Praga)', () => {
    expect(destinationRules({ destination: 'Porto' })).toMatchObject({ country: 'Portugal', source: 'docs' });
    const praga = destinationRules({ destination: 'Praga' });
    expect(praga).toMatchObject({ source: 'pdf', visaRequired: false, insuranceMandatory: true, plugDiffers: false, currency: 'CZK' });
    expect(praga.vaccineRequired).toBeUndefined();
  });

  it('país sem dado (Cancún): sem visto, vacina nem adaptador — ausente, nunca default', () => {
    const r = destinationRules({ destination: 'Cancún' });
    expect(r).toMatchObject({ international: true, source: undefined });
    expect(r.visaRequired).toBeUndefined();
    const labels = visibleLabels({ destination: 'Cancún' });
    expect(labels.some((l) => /Visto|Vacina|Adaptador/.test(l))).toBe(false);
    expect(labels).toContain('Passaporte válido');
  });

  it('bloco "Regras do destino": uma linha fechado; aberto, o texto do docs (o mesmo do PDF)', () => {
    render(<DestinationRulesBlock rules={destinationRules(lisboa)} />);
    expect(screen.getByText(/Portugal · sem visto até 90 dias/)).toBeTruthy();
    expect(screen.queryByText(/validade mínima de 6 meses/)).toBeNull();
    fireEvent.click(screen.getByText('Regras do destino'));
    expect(screen.getByText(/validade mínima de 6 meses/)).toBeTruthy();
  });
});
