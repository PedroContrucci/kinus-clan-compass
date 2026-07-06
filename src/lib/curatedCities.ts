export const CURATED_CITIES = ['Paris', 'Fortaleza', 'Rio de Janeiro'];

export const isCityCurated = (cityName: string) =>
  CURATED_CITIES.some((c) => cityName.toLowerCase().includes(c.toLowerCase()));
