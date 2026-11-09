// M18 — Sazonalidade por cidade e mês (rascunho 05/11/2026, escrito por Claude, a revisar por Pedro e Rachel).
// Arquivo NOVO em src/data/ (adicionar é permitido pela trava). Consumidores previstos: bloco "Nesta época"
// no PDF (tripPdfExport) e no Painel; aviso no dia que cair em `closures`.
//
// Regras do dado:
//   · Só fato estável (feriado fixo, clima médio, evento que acontece todo ano). Nada com data que muda a cada
//     ano vai em `events` sem a palavra "confirmar" — essas entram em `verify`, para o rito anual (outubro).
//   · Nomes próprios de lugares só os que já existem no catálogo. Sem preço.
//   · `closures` = o motor NÃO agenda EXP pago nesses dias; `verify` = checklist humano, nunca vai ao usuário.
//
// Cobertura desta primeira entrega: as 8 cidades com dia de fechamento já conferido (M19a) × dezembro e janeiro.
// Restantes 20 cidades: próximo lote, mesmo formato.

export interface SeasonalNote {
  /** chave canônica de CURATED_CITIES (ex.: 'Paris', 'Rio de Janeiro', 'Tóquio') */
  city: string;
  /** 1–12 */
  month: number;
  /** clima médio em uma frase, com luz do dia quando importa */
  climate: string;
  /** datas em que museus/monumentos fecham ou a cidade para — formato 'DD/MM: o quê' */
  closures: string[];
  /** M18b: ids do catálogo da cidade fechados por cada linha de `closures` (chave = índice da linha). Linha sem
   *  entrada = só aviso, o motor não agenda nem tira nada. Vale para toda data da linha (e todo o mês em "Mês inteiro"). */
  closedIds?: Record<number, string[]>;
  /** o que a cidade tem nesse mês, todo ano */
  events: string[];
  /** dica prática de planejamento (reserva, lotação, roupa) */
  tips: string[];
  /** o que precisa ser conferido a cada ano antes de publicar (não vai ao usuário) */
  verify: string[];
}

export const SEASONAL_NOTES: SeasonalNote[] = [
  // ───────────────────────── Paris ─────────────────────────
  {
    city: 'Paris', month: 12,
    climate: 'Frio úmido: médias de 3 a 8 °C, chuva em cerca de um terço dos dias, anoitece por volta das 17h.',
    closures: [
      '25/12: Louvre, Orsay e Versalhes fechados; quase todos os museus nacionais também',
      '01/01: Louvre e Versalhes fechados',
      '24/12 e 31/12: muitos restaurantes só com menu fechado de festa ou fechados — reservar com antecedência',
      'Mês inteiro: Giverny (casa e jardins de Monet) fechado de novembro a março — bate-volta só de abril a outubro',
    ],
    closedIds: { 0: ['paris-louvre', 'paris-orsay', 'par3-versailles'], 1: ['paris-louvre', 'par3-versailles'], 3: ['par3-giverny'] },
    events: [
      'Iluminação de Natal dos Champs-Élysées (de fim de novembro até início de janeiro)',
      'Vitrines de Natal das grandes lojas do Boulevard Haussmann',
      'Mercados de Natal nos jardins e praças da cidade',
    ],
    tips: [
      'Museus pagos lotam entre 20/12 e 03/01 (férias escolares francesas): reservar horário online',
      'Com crianças: menores de 18 anos não pagam nos museus nacionais — levar documento com foto',
      'Dias curtos: agendar o passeio ao ar livre pela manhã e museu à tarde',
    ],
    verify: [
      'Datas de início e fim dos mercados de Natal (Tulherias, Saint-Germain, La Défense) no site da prefeitura',
      'Data de início das férias escolares de Natal (zona C) — muda a cada ano',
      'Horários especiais de 24/12 e 31/12 da Torre Eiffel',
    ],
  },
  {
    city: 'Paris', month: 1,
    climate: 'O mês mais frio: médias de 2 a 7 °C, dias curtos (anoitece perto das 17h30), chuva frequente, neve rara.',
    closures: [
      '01/01: Louvre e Versalhes fechados; transporte em horário reduzido',
      'Mês inteiro: Giverny (casa e jardins de Monet) fechado de novembro a março',
    ],
    closedIds: { 0: ['paris-louvre', 'par3-versailles'], 1: ['par3-giverny'] },
    events: [
      'Saldos de inverno (soldes) a partir da segunda semana do mês — lojas lotadas no primeiro fim de semana',
      'Galette des Rois nas padarias durante todo o mês (Epifania, 06/01)',
      'Iluminações de Natal ainda acesas na primeira semana',
    ],
    tips: [
      'Melhor mês para museus: filas curtas depois de 05/01',
      'Casaco impermeável e calçado fechado; cachecol e luvas para todos',
    ],
    verify: [
      'Data exata do início dos soldes (publicada pelo governo francês no fim do ano)',
    ],
  },

  // ───────────────────────── Lisboa ─────────────────────────
  {
    city: 'Lisboa', month: 12,
    climate: 'Ameno e chuvoso: médias de 9 a 15 °C, anoitece por volta das 17h15; sol entre as frentes.',
    closures: [
      '25/12 e 01/01: Mosteiro dos Jerónimos, Torre de Belém e museus nacionais fechados',
      '24/12 à tarde e 31/12 à noite: comércio e muitos restaurantes fecham cedo ou só com menu de festa',
    ],
    closedIds: { 0: ['lis-jeronimos', 'lis-torre-belem'] },
    events: [
      'Iluminação de Natal e árvore na Praça do Comércio',
      'Réveillon com fogos no Terreiro do Paço (31/12)',
    ],
    tips: [
      'Jerónimos fecha às segundas o ano inteiro — não é só feriado',
      'Chuva não para a cidade: alternar miradouro pela manhã com museu à tarde',
    ],
    verify: [
      'Programação do Réveillon na Praça do Comércio (concertos) — anual',
    ],
  },
  {
    city: 'Lisboa', month: 1,
    climate: 'Mês mais chuvoso: médias de 8 a 15 °C, dias curtos, vento no rio.',
    closures: [
      '01/01: monumentos e museus nacionais fechados',
    ],
    closedIds: { 0: ['lis-jeronimos', 'lis-torre-belem'] },
    events: [
      'Saldos de inverno no comércio a partir da primeira semana',
      'Bolo-rei nas pastelarias até 06/01 (Dia de Reis)',
    ],
    tips: [
      'Baixa temporada: hotéis mais baratos e Sintra sem fila',
      'Calçado antiderrapante — a calçada portuguesa molhada escorrega',
    ],
    verify: [],
  },

  // ───────────────────────── Porto ─────────────────────────
  {
    city: 'Porto', month: 12,
    climate: 'Frio e chuvoso: médias de 6 a 14 °C, o mês mais úmido do ano, anoitece cerca de 17h.',
    closures: [
      '25/12 e 01/01: museus, Palácio da Bolsa e caves de vinho do Porto fechados ou com horário reduzido',
    ],
    closedIds: { 0: ['opo-palacio-bolsa'] },
    events: [
      'Árvore e iluminação de Natal na Avenida dos Aliados',
      'Réveillon na Avenida dos Aliados com fogos sobre o Douro (31/12)',
    ],
    tips: [
      'Caves de Gaia: reservar a visita com prova; horários encurtam no inverno',
      'Guarda-chuva não basta — vento do mar; capa impermeável',
    ],
    verify: [
      'Horários de Natal das caves de Vila Nova de Gaia — anual',
    ],
  },
  {
    city: 'Porto', month: 1,
    climate: 'Frio e úmido: médias de 5 a 13 °C; dias de céu limpo e frio seco alternam com chuva.',
    closures: [
      '01/01: museus e caves fechados',
    ],
    closedIds: { 0: ['opo-palacio-bolsa'] },
    events: [
      'Saldos de inverno',
      'Cidade vazia de turistas — o Douro e a Ribeira sem fila',
    ],
    tips: [
      'Cruzeiro das seis pontes opera o ano todo, mas com menos saídas — conferir o horário no dia',
    ],
    verify: [],
  },

  // ───────────────────────── Roma ─────────────────────────
  {
    city: 'Roma', month: 12,
    climate: 'Frio moderado: médias de 4 a 13 °C, chuva frequente, anoitece por volta das 16h45.',
    closures: [
      '08/12: feriado da Imaculada Conceição — comércio fechado, Piazza di Spagna lotada pela homenagem papal',
      '25/12 e 26/12: Museus Vaticanos fechados; Coliseu e Fórum fechados em 25/12',
      '01/01: Museus Vaticanos, Coliseu e Fórum fechados',
    ],
    closedIds: { 1: ['rome-vaticano', 'rome-colosseo'], 2: ['rome-vaticano', 'rome-colosseo'] },
    events: [
      'Presépios nas igrejas e mercado de Natal na Piazza Navona',
      'Missa do Galo e bênção Urbi et Orbi na Praça de São Pedro (24/12 e 25/12)',
    ],
    tips: [
      'Vaticano: reservar online com semanas de antecedência em dezembro; conferir o calendário de fechamentos do museu, que tem muitas datas próprias',
      'Igrejas exigem ombros e joelhos cobertos mesmo no frio — casaco resolve',
    ],
    verify: [
      'Calendário anual de fechamentos dos Museus Vaticanos (publicado no site oficial)',
      'Datas e horário das celebrações papais de Natal',
    ],
  },
  {
    city: 'Roma', month: 1,
    climate: 'O mês mais frio: médias de 3 a 12 °C, chuva em cerca de um terço dos dias.',
    closures: [
      '01/01: Museus Vaticanos, Coliseu e Fórum fechados',
      '06/01: Epifania (feriado) — Museus Vaticanos fechados, comércio fechado',
    ],
    closedIds: { 0: ['rome-vaticano', 'rome-colosseo'], 1: ['rome-vaticano'] },
    events: [
      'Befana na Piazza Navona (até 06/01) — festa das crianças',
      'Saldos de inverno a partir da primeira semana',
    ],
    tips: [
      'Melhor mês para o Coliseu e o Vaticano: menor lotação do ano depois de 07/01',
    ],
    verify: [
      'Primeiro domingo do mês: museus estatais gratuitos — confirmar se a gratuidade continua vigente',
    ],
  },

  // ───────────────────────── Tóquio ─────────────────────────
  {
    city: 'Tóquio', month: 12,
    climate: 'Frio seco e ensolarado: médias de 5 a 12 °C, pouca chuva, anoitece cedo (por volta das 16h30).',
    closures: [
      '28/12 a 03/01 (aprox.): museus nacionais, muitos restaurantes e lojas de bairro fecham para o Ano-Novo',
      '31/12: transporte funciona a noite toda só em algumas linhas; templos lotados a partir da meia-noite',
    ],
    events: [
      'Iluminações de inverno em Marunouchi, Roppongi e Shibuya (de novembro a fevereiro)',
      'Joya no Kane: 108 badaladas nos templos na virada do ano',
    ],
    tips: [
      'Evitar programar museu entre 28/12 e 03/01; priorizar parques, bairros, iluminações e templos',
      'Museu Ghibli: ingressos vendidos no dia 10 do mês anterior, às 10h de Tóquio — esgotam em minutos',
      'Roupa em camadas: dias de sol com 12 °C e noites perto de 3 °C',
    ],
    verify: [
      'Datas exatas de fechamento de fim de ano de cada museu (variam 1–2 dias por instituição)',
      'Datas das iluminações de Marunouchi/Roppongi — anual',
    ],
  },
  {
    city: 'Tóquio', month: 1,
    climate: 'O mês mais frio e mais seco: médias de 2 a 10 °C, céu limpo quase todo dia, Fuji visível com frequência.',
    closures: [
      '01/01 a 03/01: museus nacionais e muitas lojas fechados; o que abre está lotado',
      'Segunda segunda-feira do mês: Dia da Maioridade (feriado) — transporte e templos cheios',
    ],
    events: [
      'Hatsumode (primeira visita do ano ao templo) em Meiji Jingu e Senso-ji, 01 a 03/01 — multidões de milhões',
      '02/01: Palácio Imperial abre o pátio interno ao público para a saudação de Ano-Novo (um dos dois dias do ano)',
      'Fukubukuro (sacolas-surpresa) e saldos nas lojas a partir de 01/01',
    ],
    tips: [
      'A partir de 04/01 a cidade volta ao normal e o mês fica ótimo: seco, claro e sem filas',
      'Ar muito seco: hidratante e protetor labial para todos',
    ],
    verify: [
      'Horário da abertura do Palácio Imperial em 02/01 — anual',
    ],
  },

  // ───────────────────────── Rio de Janeiro ─────────────────────────
  {
    city: 'Rio de Janeiro', month: 12,
    climate: 'Verão: médias de 24 a 32 °C, sensação acima de 35 °C, pancadas de chuva no fim da tarde; sol forte das 10h às 16h.',
    closures: [
      '25/12: museus fechados e quase todo o comércio parado; praias e trilhas abertas',
      '31/12: a cidade para à tarde para o Réveillon; restaurantes de Copacabana só com pacote de festa',
    ],
    events: [
      'Réveillon de Copacabana (31/12): fogos na praia, mais de dois milhões de pessoas de branco',
      'Árvore de Natal flutuante e iluminação na Lagoa (quando montada)',
    ],
    tips: [
      'Hotéis da orla esgotam e cobram diária mínima no Réveillon — reservar com meses de antecedência ou evitar 29/12 a 02/01',
      'Passeios ao ar livre (Cristo, Pão de Açúcar, trilhas) de manhã cedo; chuva da tarde é curta mas forte',
      'Com crianças: protetor solar, boné e água; evitar praia das 11h às 15h',
    ],
    verify: [
      'Se a árvore da Lagoa será montada este ano (não é todo ano)',
      'Esquema de trânsito e metrô do Réveillon — anual',
    ],
  },
  {
    city: 'Rio de Janeiro', month: 1,
    climate: 'Pico do verão: médias de 25 a 34 °C, chuva de verão forte e curta à tarde, mar quente.',
    closures: [
      '01/01: museus fechados; praias lotadas',
      '20/01: feriado municipal de São Sebastião — comércio fechado, museus podem fechar',
    ],
    events: [
      'Ensaios técnicos das escolas de samba no Sambódromo (fins de semana, gratuitos)',
      'Blocos de pré-carnaval nas ruas a partir da segunda quinzena',
    ],
    tips: [
      'Alta temporada: diárias mais caras do ano com o Réveillon; segunda quinzena melhora',
      'Trilhas e Pão de Açúcar ao amanhecer: calor e nuvem de tarde escondem a vista',
    ],
    verify: [
      'Calendário dos ensaios técnicos no Sambódromo — divulgado pela Liesa em dezembro',
    ],
  },

  // ───────────────────────── Fortaleza ─────────────────────────
  {
    city: 'Fortaleza', month: 12,
    climate: 'Seco e ventoso: médias de 24 a 31 °C, vento forte na praia à tarde, quase sem chuva; sol o dia inteiro.',
    closures: [
      '25/12 e 01/01: museus e Centro Dragão do Mar fechados; praias e barracas abertas',
    ],
    closedIds: { 0: ['for-dragao-do-mar'] },
    events: [
      'Réveillon no Aterro da Praia de Iracema com fogos e shows (31/12)',
      'Alta temporada de kitesurf em Cumbuco (vento constante de agosto a janeiro)',
    ],
    tips: [
      'Mês mais cheio nas praias do litoral leste e oeste: bate-volta a Canoa Quebrada e Jericoacoara exige reserva',
      'Vento à tarde derruba guarda-sol: praia de manhã, passeio coberto à tarde',
    ],
    verify: [
      'Programação do Réveillon do Aterro — anual',
    ],
  },
  {
    city: 'Fortaleza', month: 1,
    climate: 'Fim da estação seca: médias de 24 a 31 °C, primeiras chuvas isoladas no fim do mês, vento diminui.',
    closures: [
      '01/01: museus e comércio fechados',
    ],
    closedIds: { 0: ['for-dragao-do-mar'] },
    events: [
      'Férias escolares: parques aquáticos e praias urbanas no pico de lotação',
    ],
    tips: [
      'Beach Park: comprar ingresso online e chegar na abertura; filas longas em janeiro',
      'Melhor mês para a Praia do Futuro: mar calmo e barracas abertas todos os dias',
    ],
    verify: [],
  },

  // ───────────────────────── Salvador ─────────────────────────
  {
    city: 'Salvador', month: 12,
    climate: 'Verão: médias de 24 a 30 °C, sol forte e chuva rápida ocasional; mar morno.',
    closures: [
      '08/12: feriado municipal de Nossa Senhora da Conceição da Praia — comércio fechado, procissão no Comércio',
      '25/12 e 01/01: museus fechados; o Pelourinho funciona em ritmo de festa',
    ],
    events: [
      '04/12: Festa de Santa Bárbara (Iansã) no Pelourinho — abertura do ciclo de festas populares',
      '08/12: Conceição da Praia, com missa e festa na igreja da Cidade Baixa',
      'Réveillon no Farol da Barra com fogos e shows (31/12)',
    ],
    tips: [
      'Dezembro a fevereiro é o ciclo de festas de largo: cada fim de semana tem uma — planejar o Pelourinho em dia de festa',
      'Elevador Lacerda e Mercado Modelo lotam no feriado de 08/12',
    ],
    verify: [
      'Programação do Réveillon da Barra — anual',
    ],
  },
  {
    city: 'Salvador', month: 1,
    climate: 'Verão: médias de 24 a 30 °C, chuva de verão isolada, sol forte.',
    closures: [
      '01/01: museus fechados; Cidade Baixa tomada pela procissão',
      'Segunda quinta-feira do mês: Lavagem do Bonfim — comércio e repartições param, trânsito fechado do Comércio ao Bonfim',
    ],
    events: [
      '01/01: Procissão marítima de Bom Jesus dos Navegantes, da Praia da Boa Viagem à Igreja',
      'Lavagem do Bonfim (segunda quinta-feira de janeiro): 8 km de cortejo das baianas, uma das maiores festas da cidade',
      '06/01: Festa de Reis na Lapinha',
    ],
    tips: [
      'A Lavagem do Bonfim é o dia mais bonito do mês para quem gosta de cultura — e o pior para quem quer museu',
      'Fitinha do Bonfim: dar três nós e três pedidos; o passeio à Colina Sagrada vale fora do dia da festa também',
    ],
    verify: [
      'Data da Lavagem do Bonfim deste ano (segunda quinta-feira, mas a prefeitura confirma)',
    ],
  },
];

/** Notas de uma cidade num mês (1–12). Vazio = sem dado; nunca inferir. */
export function seasonalNotesFor(city: string, month: number): SeasonalNote | undefined {
  return SEASONAL_NOTES.find((n) => n.city === city && n.month === month);
}
