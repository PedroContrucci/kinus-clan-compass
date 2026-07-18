// City center coordinates for the interactive destination map

export interface CityCoordinate {
  name: string;
  lat: number;
  lng: number;
}

export const CITY_COORDINATES: Record<string, CityCoordinate> = {
  'Paris':          { name: 'Paris',          lat: 48.8566,  lng: 2.3522 },
  'Fortaleza':      { name: 'Fortaleza',      lat: -3.7319,  lng: -38.5267 },
  'Rio de Janeiro': { name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729 },
  'Lisboa':         { name: 'Lisboa',         lat: 38.7223,  lng: -9.1393 },
  'Orlando':        { name: 'Orlando',        lat: 28.5383,  lng: -81.3792 },
  'Tóquio':         { name: 'Tóquio',         lat: 35.6762,  lng: 139.6503 },
  'Roma':           { name: 'Roma',           lat: 41.9028,  lng: 12.4964 },
  'Salvador':       { name: 'Salvador',       lat: -12.9777, lng: -38.5016 },
  'Buenos Aires':   { name: 'Buenos Aires',   lat: -34.6037, lng: -58.3816 },
  'Nova York':      { name: 'Nova York',      lat: 40.7128,  lng: -74.0060 },
  'Gramado':        { name: 'Gramado',        lat: -29.3747, lng: -50.8764 },
  'Londres':        { name: 'Londres',        lat: 51.5074,  lng: -0.1278 },
  'Barcelona':      { name: 'Barcelona',      lat: 41.3874,  lng: 2.1686 },
  'Porto Seguro':   { name: 'Porto Seguro',   lat: -16.4435, lng: -39.0643 },
  'Dubai':          { name: 'Dubai',          lat: 25.2048,  lng: 55.2708 },
  'Cidade do Cabo': { name: 'Cidade do Cabo', lat: -33.9249, lng: 18.4241 },
  'Istambul':       { name: 'Istambul',       lat: 41.0082,  lng: 28.9784 },
  'Bangkok':        { name: 'Bangkok',        lat: 13.7563,  lng: 100.5018 },
  'Marrakech':      { name: 'Marrakech',      lat: 31.6295,  lng: -7.9811 },
  'Singapura':      { name: 'Singapura',      lat: 1.3521,   lng: 103.8198 },
};
