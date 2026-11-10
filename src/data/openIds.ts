// M18d — feriado duro: nestas datas (dd/mm), manhã/tarde só aceita (a) atividade livre (custo 0, sem compras)
// ou (b) id confirmado aberto em OPEN_CONFIRMED. O resto é tratado como fechado, pelo caminho dos closedIds.
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

export interface OpenConfirmed {
  /** ids do catálogo da cidade confirmados abertos no feriado duro */
  ids: string[];
  /** onde se confirmou (URL do site oficial do espaço) */
  source: string;
  /** AAAA-MM-DD da conferência */
  verifiedAt: string;
}

/** Vazio para todas as cidades: nada confirmado ainda (curadoria do fundador). `closedIds` sempre vence. */
export const OPEN_CONFIRMED: Record<string, OpenConfirmed> = {
  'Paris': { ids: [], source: '', verifiedAt: '' },
  'Lisboa': { ids: [], source: '', verifiedAt: '' },
  'Porto': { ids: [], source: '', verifiedAt: '' },
  'Roma': { ids: [], source: '', verifiedAt: '' },
  'Rio de Janeiro': { ids: [], source: '', verifiedAt: '' },
  'Salvador': { ids: [], source: '', verifiedAt: '' },
  'Fortaleza': { ids: [], source: '', verifiedAt: '' },
  'Tóquio': { ids: [], source: '', verifiedAt: '' },
};
