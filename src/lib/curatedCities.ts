export const CURATED_CITIES = ['Paris', 'Fortaleza', 'Rio de Janeiro', 'Lisboa', 'Orlando', 'Tóquio', 'Roma', 'Salvador', 'Buenos Aires', 'Cartagena', 'Nova York', 'Gramado', 'Londres', 'Barcelona', 'Porto Seguro', 'Dubai', 'Cidade do Cabo', 'Istambul', 'Bangkok', 'Marrakech', 'Singapura'];

export const isCityCurated = (cityName: string) =>
  CURATED_CITIES.some((c) => cityName.toLowerCase().includes(c.toLowerCase()));
