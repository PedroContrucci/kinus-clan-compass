// localAchievements — a Camada Local do §4: 5 moldes × 21 cidades, gerados do catálogo. PURO.
//
// Mora fora do `achievements.ts` por tamanho, não por fronteira: são 42 nomes escritos à mão
// (21 troféus-ícone + 21 garfos) e a leitura defensiva do check-in. Misturar isso com os doze
// critérios da Camada Mundo transformaria o arquivo que responde "por que esta pessoa tem este
// troféu?" num arquivo que ninguém lê inteiro.
//
// A CLASSIFICAÇÃO NÃO É DAQUI. `landmark_tier` vive em `curated_activities`, no kinu-beta, e
// chega em `src/data/generated/landmarkTiers.ts` pelo `sync-catalog.ts --apply`. Aqui não se
// sabe que existe um banco — se uma cidade não está no arquivo gerado, ela simplesmente não
// tem troféus. Cidade sem tier não inventa troféu que nunca destrava.
//
// O CASAMENTO É POR ID, NUNCA POR NOME. O roteiro embute o id do catálogo no id do item
// (`GeneratedItineraryStage.tsx:229`: `day-${dia}-${atividade.id}`), então
// 'day-1-for-mercado-peixes' É 'for-mercado-peixes'. Nome é texto de tela: muda com uma
// correção de acento e levaria o troféu junto.
import { LANDMARKS, type LandmarkTier } from '@/data/generated/landmarkTiers';
import type { Achievement, EventIndex } from '@/lib/achievements';

// ---------------------------------------------------------------------------
// Leitura do que veio do check-in
// ---------------------------------------------------------------------------

/**
 * Uma lista que pode ter chegado como array OU como string com separador.
 *
 * O `trip.checkin` provado em 10/09/2026 manda `lived_ids` como **string** (`'a,b,c'`) e
 * `lived_names` como string com `' | '` — não como array, apesar do que o §1 do desenho
 * desenhou. Aceitar as duas formas não é frouxidão: é o motor sobrevivendo ao dia em que o
 * emissor for corrigido, sem perder o histórico já gravado no formato antigo.
 */
export function splitList(value: unknown, separator = ','): string[] {
  const raw = Array.isArray(value)
    ? value.map((v) => (typeof v === 'string' ? v : ''))
    : typeof value === 'string'
      ? value.split(separator)
      : [];
  return raw.map((s) => s.trim()).filter(Boolean);
}

/**
 * O id do catálogo dentro de um id de item de roteiro.
 *
 * Não há lista de exceções para os itens sintéticos (`breakfast-hotel`, `ambient-walk`,
 * `free-morning`, `flight-out`, `transit`, `checkout`…): quem filtra é a **pertinência** ao
 * mapa da cidade. Lista de exceção envelhece a cada item novo do gerador; pertinência não.
 */
export function catalogIdOf(itemId: unknown): string {
  if (typeof itemId !== 'string') return '';
  return itemId.trim().replace(/^day-\d+-/, '');
}

// ---------------------------------------------------------------------------
// Cidade -> cidade canônica
// ---------------------------------------------------------------------------

/** minúsculo, sem diacríticos, espaços colapsados. Mesma normalização do gerador. */
function normalize(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Toda forma conhecida -> nome canônico. Os apelidos vêm do arquivo gerado, que os colheu do
 *  registry do catálogo — 'Tokyo' e 'Tóquio' são a mesma const lá, então são a mesma cidade aqui. */
const CITY_BY_NAME: Map<string, string> = (() => {
  const index = new Map<string, string>();
  for (const [canonical, data] of Object.entries(LANDMARKS)) {
    index.set(normalize(canonical), canonical);
    for (const alias of data.aliases) index.set(normalize(alias), canonical);
  }
  return index;
})();

/**
 * A cidade canônica de um texto, ou `null`.
 *
 * Casamento EXATO depois de normalizar — nada de `includes`. O destino da viagem é escolhido
 * numa lista (`destinationCatalog.findCityInfo` também casa exato), e casar por pedaço faria
 * 'Porto' virar 'Porto Seguro' na primeira viagem a Portugal.
 */
export function resolveCity(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  return CITY_BY_NAME.get(normalize(raw)) ?? null;
}

/** Os ids classificados desta cidade que estão neste conjunto de vividos. */
function livedWithTier(index: EventIndex, city: string, tier: LandmarkTier): number {
  const lived = index.livedByCity.get(city);
  if (!lived) return 0;
  const tiers = LANDMARKS[city]?.tiers ?? {};
  let count = 0;
  for (const id of lived) if (tiers[id] === tier) count += 1;
  return count;
}

/** Quantos itens gastronômicos do catálogo desta cidade foram vividos. */
function livedFood(index: EventIndex, city: string): number {
  const lived = index.livedByCity.get(city);
  if (!lived) return 0;
  const food = LANDMARKS[city]?.food ?? [];
  let count = 0;
  for (const id of food) if (lived.has(id)) count += 1;
  return count;
}

// ---------------------------------------------------------------------------
// Os nomes — a única parte escrita à mão da Camada Local
// ---------------------------------------------------------------------------

/** Os 21 troféus-ícone batizados no §4 do DESENHO-CONQUISTAS-v2. Nome próprio, não template. */
const ICON_NAMES: Record<string, string> = {
  'Lisboa': 'Guardiã do Tejo',
  'Paris': 'Dama de Ferro',
  'Rio de Janeiro': 'De Braços Abertos',
  'Salvador': 'Coração do Pelô',
  'Fortaleza': 'Rei das Marés',
  'Barcelona': 'Obra Inacabada',
  'Roma': 'Gladiador do Clã',
  'Nova York': 'Chama da Liberdade',
  'Londres': 'Batida do Big Ben',
  'Buenos Aires': 'Alma de Tango',
  'Dubai': 'Toque no Céu',
  'Tóquio': 'Travessia de Shibuya',
  'Gramado': 'Cisne do Lago Negro',
  'Porto Seguro': 'Marco Zero do Brasil',
  'Orlando': 'Reino da Magia',
  'Cartagena': 'Pérola do Caribe',
  'Istambul': 'Sabedoria de Bizâncio',
  'Marrakech': 'Coração da Medina',
  'Singapura': 'Jardim do Futuro',
  'Bangkok': 'Guardião da Esmeralda',
  'Cidade do Cabo': 'Topo da Mesa',
};

/**
 * O gentílico do Garfo. Quatro cidades fogem do gentílico da própria cidade porque ele não
 * canta em português — *fortalezense*, *emiradense*, *orlandense* e *banguecoquense* são
 * palavras que ninguém diz num churrasco, que é a régua do §0.
 */
const FORK_NAMES: Record<string, string> = {
  'Lisboa': 'Garfo Lisboeta',
  'Paris': 'Garfo Parisiense',
  'Rio de Janeiro': 'Garfo Carioca',
  'Salvador': 'Garfo Soteropolitano',
  'Fortaleza': 'Garfo Cearense',
  'Barcelona': 'Garfo Catalão',
  'Roma': 'Garfo Romano',
  'Nova York': 'Garfo Nova-Iorquino',
  'Londres': 'Garfo Londrino',
  'Buenos Aires': 'Garfo Portenho',
  'Dubai': 'Garfo do Golfo',
  'Tóquio': 'Garfo Toquiota',
  'Gramado': 'Garfo Gramadense',
  'Porto Seguro': 'Garfo Porto-Segurense',
  'Orlando': 'Garfo de Orlando',
  'Cartagena': 'Garfo Cartagenero',
  'Istambul': 'Garfo Istambulita',
  'Marrakech': 'Garfo Marroquino',
  'Singapura': 'Garfo Singapurense',
  'Bangkok': 'Garfo Tailandês',
  'Cidade do Cabo': 'Garfo Capetoniano',
};

// ---------------------------------------------------------------------------
// Os 5 moldes
// ---------------------------------------------------------------------------

/** Os sufixos das chaves. CONGELADOS: a chave vai para a tabela `events` e fica lá. */
export const MOLDS = ['carimbo', 'icone', 'coracao', 'garfo', 'segredo'] as const;
export type Mold = (typeof MOLDS)[number];

/** A chave de um troféu local. `local.fortaleza.segredo`. */
export function localKey(slug: string, mold: Mold): string {
  return `local.${slug}.${mold}`;
}

/** Os cinco troféus de uma cidade, na ordem do §4. */
function moldsOf(city: string): Achievement[] {
  const { slug } = LANDMARKS[city];

  return [
    {
      key: localKey(slug, 'carimbo'),
      name: `Carimbo: ${city}`,
      criterion: `Conclua uma viagem em ${city}`,
      emoji: '🛂',
      xp: 25,
      earned: (i) => i.completedCities.has(city),
    },
    {
      // Nome próprio, não template: é o troféu que a pessoa mostra.
      key: localKey(slug, 'icone'),
      name: ICON_NAMES[city] ?? `Ícone de ${city}`,
      criterion: `Viva o cartão-postal de ${city}`,
      emoji: '⭐',
      xp: 25,
      earned: (i) => livedWithTier(i, city, 'icon') >= 1,
    },
    {
      key: localKey(slug, 'coracao'),
      name: `Coração de ${city}`,
      criterion: `Viva 5 essenciais de ${city}`,
      emoji: '❤️',
      xp: 50,
      earned: (i) => livedWithTier(i, city, 'essential') >= 5,
    },
    {
      key: localKey(slug, 'garfo'),
      name: FORK_NAMES[city] ?? `Garfo de ${city}`,
      criterion: `Coma em 3 lugares do catálogo em ${city}`,
      emoji: '🍴',
      xp: 25,
      earned: (i) => livedFood(i, city) >= 3,
    },
    {
      key: localKey(slug, 'segredo'),
      name: `Segredo de ${city}`,
      criterion: `Descubra 1 lugar escondido de ${city}`,
      emoji: '🔑',
      xp: 50,
      earned: (i) => livedWithTier(i, city, 'hidden_gem') >= 1,
    },
  ];
}

/** As cidades com troféu, na ordem do arquivo gerado (que é a de `CURATED_CITIES`). */
export const LOCAL_CITIES: string[] = Object.keys(LANDMARKS);

/** Os 5 × N troféus da Camada Local. N vem do arquivo gerado — o catálogo é dinâmico. */
export const LOCAL_ACHIEVEMENTS: Achievement[] = LOCAL_CITIES.flatMap(moldsOf);

/** Os cinco troféus de uma cidade, para a UI desenhar a seção dela. */
export function localAchievementsOf(city: string): Achievement[] {
  return LANDMARKS[city] ? moldsOf(city) : [];
}
