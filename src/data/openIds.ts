// M18d-2 — feriado duro: nestas datas (dd/mm), manhã/tarde só aceita id em OPEN_AIR (sem porta nem bilheteria)
// ou em OPEN_CONFIRMED (confirmado aberto, com fonte). O resto é tratado como fechado. `closedIds` sempre vence.
// Chaves = nome da cidade como o app a recebe (`Roma`, `Tóquio`); `Rome`/`Tokyo` entram como apelidos.

export const HARD_HOLIDAYS: Record<string, string[]> = {
  'Paris': ['25/12', '01/01'],
  'Lisboa': ['25/12', '01/01'],
  'Porto': ['25/12', '01/01'],
  'Roma': ['25/12', '01/01'],
  'Rio de Janeiro': ['25/12', '01/01'],
  'Salvador': ['25/12', '01/01'],
  'Fortaleza': ['25/12', '01/01'],
  'Tóquio': ['01/01'],
};

export const HARD_HOLIDAY_ALIASES: Record<string, string> = { Rome: 'Roma', Tokyo: 'Tóquio' };

/** Lugares sem porta nem bilheteria: abertos em feriado duro. */
export const OPEN_AIR: Record<string, string[]> = {
  'Paris': [
    'par-bois-vincennes', 'par3-coulee-verte', 'paris-montmartre', 'paris-notre-dame', 'paris-notre-dame-exterior', 'par-buttes-chaumont', 'paris-luxembourg', 'paris-quartier-latin', 'paris-tuileries', 'par3-canal-picnic', 'paris-marais-walk',
  ],
  'Lisboa': [
    'lis-alfama-walk', 'lis-baixa-chiado', 'lis-jardim-estrela', 'lis-miradouros', 'lis-monsanto-montes-claros', 'lis-parque-eduardo-vii', 'lis-ribeira-cais', 'lis2-miradouro-catarina', 'lis2-cascais',
  ],
  'Roma': [
    'rom-villa-pamphili', 'rom-giardino-aranci', 'rom-parco-acquedotti', 'rom2-pincio', 'rome-aventino', 'rome-gianicolo', 'rome-trastevere-tarde', 'rome-trevi', 'rome-escadaria-espanha', 'rome-villa-borghese',
  ],
  'Tóquio': [
    'tok3-nezu', 'tokyo-meiji-shrine', 'tokyo-senso-ji', 'tokyo-shibuya-crossing', 'tok3-inokashira', 'tok3-meguro', 'tokyo-odaiba',
  ],
  'Porto': [
    'opo-parque-da-cidade', 'opo-sao-bento', 'opo-foz-do-douro', 'opo-jardins-palacio-cristal', 'opo-ponte-luis-i', 'opo-ribeira',
  ],
  'Salvador': [
    'ssa-bonfim', 'ssa-parque-cidade', 'ssa-parque-pituacu', 'ssa-pelourinho', 'ssa-porto-barra', 'ssa-praia-flamengo', 'ssa-dique-tororo', 'ssa-ponta-de-humaita', 'ssa-praia-jaguaribe', 'ssa-rio-vermelho', 'ssa-santo-antonio', 'ssa-praia-itapua', 'ssa-stella-maris', 'ssa-farol-barra', 'ssa-lagoa-abaete', 'ssa-ribeira-fim-de-tarde',
  ],
  'Fortaleza': [
    'for-parque-coco', 'for-praia-futuro-manha', 'for-praia-iracema', 'for-catedral-metropolitana', 'for-jardim-japones', 'for-beira-mar', 'for-cumbuco-manha', 'for-sabiaguaba', 'for-lagoinha', 'for-canoa-quebrada', 'for-morro-branco', 'for-aguas-belas', 'for-taiba',
  ],
  'Rio de Janeiro': [
    'rio-praia-barra', 'rio-praia-copacabana', 'rio-praia-ipanema', 'rio-praia-leblon', 'rio-praia-vermelha', 'rio-arpoador', 'rio-escadaria-selaron', 'rio-prainha', 'rio-mirante-dona-marta', 'rio-mureta-urca', 'rio-lagoa-pedalinho',
  ],
};

export interface OpenConfirmedItem {
  id: string;
  /** onde se confirmou */
  source: string;
  /** AAAA-MM-DD da conferência */
  verifiedAt: string;
}

/** Confirmados abertos no feriado duro, com fonte. */
export const OPEN_CONFIRMED: Record<string, OpenConfirmedItem[]> = {
  'Paris': [
    { id: 'paris-tour-eiffel-top', source: "toureiffel.paris, règlement de visite (mai/2026), art. 1: ouverte tous les jours de l'année", verifiedAt: '2026-11-10' },
  ],
  'Rio de Janeiro': [
    { id: 'rio-cristo-redentor', source: 'diariodorio.com 16/12/2025: Trem do Corcovado 8h–18h em 25/12 e 01/01 (programação 2025/26; reconfirmar em dez/2026)', verifiedAt: '2026-11-10' },
    { id: 'rio-pao-acucar', source: 'diariodorio.com 16/12/2025: operação normal em 25/12, 9h–22h em 01/01 (programação 2025/26; reconfirmar em dez/2026)', verifiedAt: '2026-11-10' },
  ],
  'Tóquio': [
    { id: 'tok3-skytree', source: 'haveagood-holiday.com: 01/01/2027 das 8h às 22h (programação 28/12/2026–03/01/2027)', verifiedAt: '2026-11-10' },
  ],
};
