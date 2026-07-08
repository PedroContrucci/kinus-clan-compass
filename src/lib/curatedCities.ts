export const CURATED_CITIES = ['Paris', 'Fortaleza', 'Rio de Janeiro', 'Lisboa', 'Orlando', 'Tóquio', 'Roma', 'Salvador', 'Buenos Aires', 'Nova York', 'Gramado', 'Londres', 'Barcelona', 'Porto Seguro'];

export const isCityCurated = (cityName: string) =>
  CURATED_CITIES.some((c) => cityName.toLowerCase().includes(c.toLowerCase()));
