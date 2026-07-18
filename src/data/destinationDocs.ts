// destinationDocs.ts — Documentação de viagem para brasileiros
// Cobre os países das 20 cidades curadas (CURATED_CITIES).
// Fonte: regras vigentes para passaporte brasileiro comum (jul/2026).
// Sempre revalidar no consulado antes de viajar.

export interface DestinationDocInfo {
  country: string;
  visto: string;
  vacina: string;
  passaporte: string;
  moeda: string;
  tomada: string;
  vistoIsento: boolean;        // true = não requer visto para brasileiros
  vacinaObrigatoria: boolean;  // true = existe vacina exigida por lei
}

// Chave = nome do país em pt-BR
export const DESTINATION_DOCS: Record<string, DestinationDocInfo> = {
  'Brasil': {
    country: 'Brasil',
    visto: 'Não aplicável — viagem doméstica',
    vacina: 'Nenhuma vacina obrigatória. Febre amarela recomendada para regiões de mata.',
    passaporte: 'Não obrigatório. RG (até 10 anos de emissão) ou CNH válida são aceitos em voos domésticos.',
    moeda: 'Real brasileiro (BRL)',
    tomada: '127V/220V · Tomada tipo N (padrão brasileiro)',
    vistoIsento: true,
    vacinaObrigatoria: false,
  },
  'Portugal': {
    country: 'Portugal',
    visto: 'Isento de visto até 90 dias (Schengen).',
    vacina: 'Nenhuma vacina obrigatória.',
    passaporte: 'Passaporte com validade mínima de 6 meses após a data de retorno.',
    moeda: 'Euro (EUR)',
    tomada: '230V · Tomada tipo C/F',
    vistoIsento: true,
    vacinaObrigatoria: false,
  },
  'França': {
    country: 'França',
    visto: 'Isento de visto até 90 dias (Schengen).',
    vacina: 'Nenhuma vacina obrigatória.',
    passaporte: 'Passaporte com validade mínima de 6 meses após a data de retorno.',
    moeda: 'Euro (EUR)',
    tomada: '230V · Tomada tipo C/E',
    vistoIsento: true,
    vacinaObrigatoria: false,
  },
  'Itália': {
    country: 'Itália',
    visto: 'Isento de visto até 90 dias (Schengen).',
    vacina: 'Nenhuma vacina obrigatória.',
    passaporte: 'Passaporte com validade mínima de 6 meses após a data de retorno.',
    moeda: 'Euro (EUR)',
    tomada: '230V · Tomada tipo C/F/L',
    vistoIsento: true,
    vacinaObrigatoria: false,
  },
  'Espanha': {
    country: 'Espanha',
    visto: 'Isento de visto até 90 dias (Schengen).',
    vacina: 'Nenhuma vacina obrigatória.',
    passaporte: 'Passaporte com validade mínima de 6 meses após a data de retorno.',
    moeda: 'Euro (EUR)',
    tomada: '230V · Tomada tipo C/F',
    vistoIsento: true,
    vacinaObrigatoria: false,
  },
  'Reino Unido': {
    country: 'Reino Unido',
    visto: 'ETA obrigatório (autorização eletrônica, ~£10) até 6 meses de estadia.',
    vacina: 'Nenhuma vacina obrigatória.',
    passaporte: 'Passaporte com validade para todo o período da viagem.',
    moeda: 'Libra esterlina (GBP)',
    tomada: '230V · Tomada tipo G (3 pinos retangulares)',
    vistoIsento: false, // ETA não é visto formal, mas exige aplicação prévia — trata como pendente
    vacinaObrigatoria: false,
  },
  'Estados Unidos': {
    country: 'Estados Unidos',
    visto: 'Visto obrigatório — B1/B2 consular. Agendamento no consulado dos EUA.',
    vacina: 'Nenhuma vacina obrigatória.',
    passaporte: 'Passaporte com validade mínima de 6 meses após a data de retorno.',
    moeda: 'Dólar americano (USD)',
    tomada: '120V · Tomada tipo A/B',
    vistoIsento: false,
    vacinaObrigatoria: false,
  },
  'Argentina': {
    country: 'Argentina',
    visto: 'Isento de visto. RG (até 10 anos) ou passaporte são aceitos — Mercosul.',
    vacina: 'Nenhuma vacina obrigatória.',
    passaporte: 'Não obrigatório com RG válido em bom estado.',
    moeda: 'Peso argentino (ARS)',
    tomada: '220V · Tomada tipo C/I',
    vistoIsento: true,
    vacinaObrigatoria: false,
  },
  'Japão': {
    country: 'Japão',
    visto: 'Isento de visto até 90 dias (turismo).',
    vacina: 'Nenhuma vacina obrigatória.',
    passaporte: 'Passaporte com validade para todo o período da viagem.',
    moeda: 'Iene japonês (JPY)',
    tomada: '100V · Tomada tipo A/B',
    vistoIsento: true,
    vacinaObrigatoria: false,
  },
  'Tailândia': {
    country: 'Tailândia',
    visto: 'Isento de visto até 60 dias (extensível para 90 dias no local).',
    vacina: 'Nenhuma vacina obrigatória. Recomendadas: hepatite A, tifoide, febre amarela se vier do Brasil endêmico.',
    passaporte: 'Passaporte com validade mínima de 6 meses após a data de entrada.',
    moeda: 'Baht tailandês (THB)',
    tomada: '220V · Tomada tipo A/B/C/O',
    vistoIsento: true,
    vacinaObrigatoria: false,
  },
  'Singapura': {
    country: 'Singapura',
    visto: 'Isento de visto até 30 dias.',
    vacina: 'Nenhuma vacina obrigatória.',
    passaporte: 'Passaporte com validade mínima de 6 meses após a data de entrada.',
    moeda: 'Dólar de Singapura (SGD)',
    tomada: '230V · Tomada tipo G',
    vistoIsento: true,
    vacinaObrigatoria: false,
  },
  'Emirados Árabes': {
    country: 'Emirados Árabes',
    visto: 'Isento de visto até 90 dias.',
    vacina: 'Nenhuma vacina obrigatória.',
    passaporte: 'Passaporte com validade mínima de 6 meses após a data de entrada.',
    moeda: 'Dirham (AED)',
    tomada: '220V · Tomada tipo G (padrão britânico)',
    vistoIsento: true,
    vacinaObrigatoria: false,
  },
  'África do Sul': {
    country: 'África do Sul',
    visto: 'Isento de visto até 90 dias.',
    vacina: 'Comprovante de febre amarela OBRIGATÓRIO para quem vem do Brasil (aplicar 10+ dias antes).',
    passaporte: 'Passaporte com validade mínima de 30 dias após o retorno e 2 páginas em branco.',
    moeda: 'Rand (ZAR)',
    tomada: '230V · Tomada tipo M/N (adaptador necessário)',
    vistoIsento: true,
    vacinaObrigatoria: true,
  },
  'Turquia': {
    country: 'Turquia',
    visto: 'Isento de visto até 90 dias.',
    vacina: 'Nenhuma vacina obrigatória.',
    passaporte: 'Passaporte com validade mínima de 6 meses após a data de entrada.',
    moeda: 'Lira turca (TRY)',
    tomada: '230V · Tomada tipo C/F',
    vistoIsento: true,
    vacinaObrigatoria: false,
  },
  'Marrocos': {
    country: 'Marrocos',
    visto: 'Isento de visto até 90 dias.',
    vacina: 'Nenhuma vacina obrigatória.',
    passaporte: 'Passaporte com validade mínima de 6 meses após a data de entrada.',
    moeda: 'Dirham marroquino (MAD)',
    tomada: '220V · Tomada tipo C/E',
    vistoIsento: true,
    vacinaObrigatoria: false,
  },
};

// Cidade → País (cobre todas as 20 CURATED_CITIES)
const CITY_TO_COUNTRY: Record<string, string> = {
  'Paris': 'França',
  'Fortaleza': 'Brasil',
  'Rio de Janeiro': 'Brasil',
  'Lisboa': 'Portugal',
  'Orlando': 'Estados Unidos',
  'Tóquio': 'Japão',
  'Roma': 'Itália',
  'Salvador': 'Brasil',
  'Buenos Aires': 'Argentina',
  'Nova York': 'Estados Unidos',
  'Gramado': 'Brasil',
  'Londres': 'Reino Unido',
  'Barcelona': 'Espanha',
  'Porto Seguro': 'Brasil',
  'Dubai': 'Emirados Árabes',
  'Cidade do Cabo': 'África do Sul',
  'Istambul': 'Turquia',
  'Bangkok': 'Tailândia',
  'Marrakech': 'Marrocos',
  'Singapura': 'Singapura',
};

export const getDocsForDestination = (destinationCity: string): DestinationDocInfo | null => {
  if (!destinationCity) return null;
  const lower = destinationCity.toLowerCase();
  const matchedCity = Object.keys(CITY_TO_COUNTRY).find((c) => lower.includes(c.toLowerCase()));
  if (!matchedCity) return null;
  const country = CITY_TO_COUNTRY[matchedCity];
  return DESTINATION_DOCS[country] || null;
};
