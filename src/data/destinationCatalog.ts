// Destination Catalog — All supported destinations organized by region

export interface CityEntry {
  name: string;
  airports: string[];
  currency: string;
  timezone: string;
}

export interface CountryEntry {
  country: string;
  flag: string;
  cities: CityEntry[];
}

export type RegionName = 'Europa' | 'Américas' | 'Ásia & Oriente Médio' | 'África' | 'Oceania' | 'Brasil';

export const REGIONS: { id: RegionName; emoji: string }[] = [
  { id: 'Europa', emoji: '🌍' },
  { id: 'Américas', emoji: '🌎' },
  { id: 'Ásia & Oriente Médio', emoji: '🌏' },
  { id: 'África', emoji: '🌍' },
  { id: 'Oceania', emoji: '🌏' },
  { id: 'Brasil', emoji: '🇧🇷' },
];

export const DESTINATION_CATALOG: Record<RegionName, CountryEntry[]> = {
  'Europa': [
    { country: 'Itália', flag: '🇮🇹', cities: [
      { name: 'Roma', airports: ['FCO'], currency: 'EUR', timezone: 'Europe/Rome' },
      { name: 'Milão', airports: ['MXP', 'LIN'], currency: 'EUR', timezone: 'Europe/Rome' },
      { name: 'Florença', airports: ['FLR'], currency: 'EUR', timezone: 'Europe/Rome' },
      { name: 'Veneza', airports: ['VCE'], currency: 'EUR', timezone: 'Europe/Rome' },
    ]},
    { country: 'França', flag: '🇫🇷', cities: [
      { name: 'Paris', airports: ['CDG', 'ORY'], currency: 'EUR', timezone: 'Europe/Paris' },
      { name: 'Nice', airports: ['NCE'], currency: 'EUR', timezone: 'Europe/Paris' },
      { name: 'Lyon', airports: ['LYS'], currency: 'EUR', timezone: 'Europe/Paris' },
    ]},
    { country: 'Portugal', flag: '🇵🇹', cities: [
      { name: 'Lisboa', airports: ['LIS'], currency: 'EUR', timezone: 'Europe/Lisbon' },
      { name: 'Porto', airports: ['OPO'], currency: 'EUR', timezone: 'Europe/Lisbon' },
    ]},
    { country: 'Espanha', flag: '🇪🇸', cities: [
      { name: 'Barcelona', airports: ['BCN'], currency: 'EUR', timezone: 'Europe/Madrid' },
      { name: 'Madri', airports: ['MAD'], currency: 'EUR', timezone: 'Europe/Madrid' },
      { name: 'Sevilha', airports: ['SVQ'], currency: 'EUR', timezone: 'Europe/Madrid' },
    ]},
    { country: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', cities: [
      { name: 'Londres', airports: ['LHR', 'LGW'], currency: 'GBP', timezone: 'Europe/London' },
    ]},
    { country: 'Holanda', flag: '🇳🇱', cities: [
      { name: 'Amsterdã', airports: ['AMS'], currency: 'EUR', timezone: 'Europe/Amsterdam' },
    ]},
    { country: 'Alemanha', flag: '🇩🇪', cities: [
      { name: 'Berlim', airports: ['BER'], currency: 'EUR', timezone: 'Europe/Berlin' },
      { name: 'Munique', airports: ['MUC'], currency: 'EUR', timezone: 'Europe/Berlin' },
    ]},
    { country: 'Rep. Tcheca', flag: '🇨🇿', cities: [
      { name: 'Praga', airports: ['PRG'], currency: 'CZK', timezone: 'Europe/Prague' },
    ]},
    { country: 'Áustria', flag: '🇦🇹', cities: [
      { name: 'Viena', airports: ['VIE'], currency: 'EUR', timezone: 'Europe/Vienna' },
    ]},
    { country: 'Turquia', flag: '🇹🇷', cities: [
      { name: 'Istambul', airports: ['IST', 'SAW'], currency: 'TRY', timezone: 'Europe/Istanbul' },
    ]},
    { country: 'Grécia', flag: '🇬🇷', cities: [
      { name: 'Atenas', airports: ['ATH'], currency: 'EUR', timezone: 'Europe/Athens' },
      { name: 'Santorini', airports: ['JTR'], currency: 'EUR', timezone: 'Europe/Athens' },
    ]},
    { country: 'Suíça', flag: '🇨🇭', cities: [
      { name: 'Zurique', airports: ['ZRH'], currency: 'CHF', timezone: 'Europe/Zurich' },
      { name: 'Genebra', airports: ['GVA'], currency: 'CHF', timezone: 'Europe/Zurich' },
    ]},
    { country: 'Irlanda', flag: '🇮🇪', cities: [
      { name: 'Dublin', airports: ['DUB'], currency: 'EUR', timezone: 'Europe/Dublin' },
    ]},
    { country: 'Croácia', flag: '🇭🇷', cities: [
      { name: 'Dubrovnik', airports: ['DBV'], currency: 'EUR', timezone: 'Europe/Zagreb' },
    ]},
    { country: 'Hungria', flag: '🇭🇺', cities: [
      { name: 'Budapeste', airports: ['BUD'], currency: 'HUF', timezone: 'Europe/Budapest' },
    ]},
  ],
  'Américas': [
    { country: 'Estados Unidos', flag: '🇺🇸', cities: [
      { name: 'Nova York', airports: ['JFK', 'EWR'], currency: 'USD', timezone: 'America/New_York' },
      { name: 'Miami', airports: ['MIA'], currency: 'USD', timezone: 'America/New_York' },
      { name: 'Orlando', airports: ['MCO'], currency: 'USD', timezone: 'America/New_York' },
      { name: 'Los Angeles', airports: ['LAX'], currency: 'USD', timezone: 'America/Los_Angeles' },
      { name: 'San Francisco', airports: ['SFO'], currency: 'USD', timezone: 'America/Los_Angeles' },
      { name: 'Las Vegas', airports: ['LAS'], currency: 'USD', timezone: 'America/Los_Angeles' },
    ]},
    { country: 'Argentina', flag: '🇦🇷', cities: [
      { name: 'Buenos Aires', airports: ['EZE'], currency: 'ARS', timezone: 'America/Argentina/Buenos_Aires' },
      { name: 'Bariloche', airports: ['BRC'], currency: 'ARS', timezone: 'America/Argentina/Buenos_Aires' },
      { name: 'Mendoza', airports: ['MDZ'], currency: 'ARS', timezone: 'America/Argentina/Buenos_Aires' },
    ]},
    { country: 'Chile', flag: '🇨🇱', cities: [
      { name: 'Santiago', airports: ['SCL'], currency: 'CLP', timezone: 'America/Santiago' },
      { name: 'Atacama', airports: ['CJC'], currency: 'CLP', timezone: 'America/Santiago' },
    ]},
    { country: 'Peru', flag: '🇵🇪', cities: [
      { name: 'Lima', airports: ['LIM'], currency: 'PEN', timezone: 'America/Lima' },
      { name: 'Cusco', airports: ['CUZ'], currency: 'PEN', timezone: 'America/Lima' },
    ]},
    { country: 'Colômbia', flag: '🇨🇴', cities: [
      { name: 'Bogotá', airports: ['BOG'], currency: 'COP', timezone: 'America/Bogota' },
      { name: 'Cartagena', airports: ['CTG'], currency: 'COP', timezone: 'America/Bogota' },
      { name: 'Medellín', airports: ['MDE'], currency: 'COP', timezone: 'America/Bogota' },
    ]},
    { country: 'México', flag: '🇲🇽', cities: [
      { name: 'Cancún', airports: ['CUN'], currency: 'MXN', timezone: 'America/Cancun' },
      { name: 'Cidade do México', airports: ['MEX'], currency: 'MXN', timezone: 'America/Mexico_City' },
    ]},
    { country: 'Uruguai', flag: '🇺🇾', cities: [
      { name: 'Montevidéu', airports: ['MVD'], currency: 'UYU', timezone: 'America/Montevideo' },
      { name: 'Punta del Este', airports: ['PDP'], currency: 'UYU', timezone: 'America/Montevideo' },
    ]},
    { country: 'Canadá', flag: '🇨🇦', cities: [
      { name: 'Toronto', airports: ['YYZ'], currency: 'CAD', timezone: 'America/Toronto' },
      { name: 'Vancouver', airports: ['YVR'], currency: 'CAD', timezone: 'America/Vancouver' },
    ]},
    { country: 'Cuba', flag: '🇨🇺', cities: [
      { name: 'Havana', airports: ['HAV'], currency: 'CUP', timezone: 'America/Havana' },
    ]},
  ],
  'Ásia & Oriente Médio': [
    { country: 'Japão', flag: '🇯🇵', cities: [
      { name: 'Tóquio', airports: ['NRT', 'HND'], currency: 'JPY', timezone: 'Asia/Tokyo' },
      { name: 'Osaka', airports: ['KIX'], currency: 'JPY', timezone: 'Asia/Tokyo' },
      { name: 'Kyoto', airports: ['KIX'], currency: 'JPY', timezone: 'Asia/Tokyo' },
    ]},
    { country: 'Tailândia', flag: '🇹🇭', cities: [
      { name: 'Bangkok', airports: ['BKK'], currency: 'THB', timezone: 'Asia/Bangkok' },
      { name: 'Phuket', airports: ['HKT'], currency: 'THB', timezone: 'Asia/Bangkok' },
    ]},
    { country: 'Emirados Árabes', flag: '🇦🇪', cities: [
      { name: 'Dubai', airports: ['DXB'], currency: 'AED', timezone: 'Asia/Dubai' },
      { name: 'Abu Dhabi', airports: ['AUH'], currency: 'AED', timezone: 'Asia/Dubai' },
    ]},
    { country: 'Singapura', flag: '🇸🇬', cities: [
      { name: 'Singapura', airports: ['SIN'], currency: 'SGD', timezone: 'Asia/Singapore' },
    ]},
    { country: 'Coreia do Sul', flag: '🇰🇷', cities: [
      { name: 'Seul', airports: ['ICN'], currency: 'KRW', timezone: 'Asia/Seoul' },
    ]},
    { country: 'China', flag: '🇨🇳', cities: [
      { name: 'Xangai', airports: ['PVG'], currency: 'CNY', timezone: 'Asia/Shanghai' },
      { name: 'Pequim', airports: ['PEK'], currency: 'CNY', timezone: 'Asia/Shanghai' },
    ]},
    { country: 'Índia', flag: '🇮🇳', cities: [
      { name: 'Nova Délhi', airports: ['DEL'], currency: 'INR', timezone: 'Asia/Kolkata' },
    ]},
    { country: 'Vietnã', flag: '🇻🇳', cities: [
      { name: 'Hanói', airports: ['HAN'], currency: 'VND', timezone: 'Asia/Ho_Chi_Minh' },
    ]},
    { country: 'Israel', flag: '🇮🇱', cities: [
      { name: 'Tel Aviv', airports: ['TLV'], currency: 'ILS', timezone: 'Asia/Jerusalem' },
    ]},
    { country: 'Maldivas', flag: '🇲🇻', cities: [
      { name: 'Malé', airports: ['MLE'], currency: 'MVR', timezone: 'Indian/Maldives' },
    ]},
  ],
  'África': [
    { country: 'Egito', flag: '🇪🇬', cities: [
      { name: 'Cairo', airports: ['CAI'], currency: 'EGP', timezone: 'Africa/Cairo' },
    ]},
    { country: 'Marrocos', flag: '🇲🇦', cities: [
      { name: 'Marrakech', airports: ['RAK'], currency: 'MAD', timezone: 'Africa/Casablanca' },
    ]},
    { country: 'África do Sul', flag: '🇿🇦', cities: [
      { name: 'Cidade do Cabo', airports: ['CPT'], currency: 'ZAR', timezone: 'Africa/Johannesburg' },
      { name: 'Joanesburgo', airports: ['JNB'], currency: 'ZAR', timezone: 'Africa/Johannesburg' },
    ]},
    { country: 'Quênia', flag: '🇰🇪', cities: [
      { name: 'Nairóbi', airports: ['NBO'], currency: 'KES', timezone: 'Africa/Nairobi' },
    ]},
  ],
  'Oceania': [
    { country: 'Austrália', flag: '🇦🇺', cities: [
      { name: 'Sydney', airports: ['SYD'], currency: 'AUD', timezone: 'Australia/Sydney' },
      { name: 'Melbourne', airports: ['MEL'], currency: 'AUD', timezone: 'Australia/Sydney' },
    ]},
    { country: 'Nova Zelândia', flag: '🇳🇿', cities: [
      { name: 'Auckland', airports: ['AKL'], currency: 'NZD', timezone: 'Pacific/Auckland' },
    ]},
  ],
  'Brasil': [
    { country: 'Brasil', flag: '🇧🇷', cities: [
      { name: 'Rio de Janeiro', airports: ['GIG', 'SDU'], currency: 'BRL', timezone: 'America/Sao_Paulo' },
      { name: 'Salvador', airports: ['SSA'], currency: 'BRL', timezone: 'America/Bahia' },
      { name: 'Florianópolis', airports: ['FLN'], currency: 'BRL', timezone: 'America/Sao_Paulo' },
      { name: 'Recife', airports: ['REC'], currency: 'BRL', timezone: 'America/Recife' },
      { name: 'Fortaleza', airports: ['FOR'], currency: 'BRL', timezone: 'America/Fortaleza' },
      { name: 'Foz do Iguaçu', airports: ['IGU'], currency: 'BRL', timezone: 'America/Sao_Paulo' },
      { name: 'Natal', airports: ['NAT'], currency: 'BRL', timezone: 'America/Fortaleza' },
      { name: 'Manaus', airports: ['MAO'], currency: 'BRL', timezone: 'America/Manaus' },
      { name: 'Gramado', airports: ['POA'], currency: 'BRL', timezone: 'America/Sao_Paulo' },
      { name: 'Jericoacoara', airports: ['JJD'], currency: 'BRL', timezone: 'America/Fortaleza' },
    ]},
  ],
};

// Helper: get all cities flat
export function getAllCities(): CityEntry[] {
  return Object.values(DESTINATION_CATALOG).flatMap(countries =>
    countries.flatMap(c => c.cities)
  );
}

// Helper: find country info for a city name
export function findCityInfo(cityName: string): { city: CityEntry; country: CountryEntry; region: RegionName } | null {
  for (const [region, countries] of Object.entries(DESTINATION_CATALOG)) {
    for (const country of countries) {
      const city = country.cities.find(c => c.name === cityName);
      if (city) return { city, country, region: region as RegionName };
    }
  }
  return null;
}
