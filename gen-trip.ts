import { buildDraftTrip } from './src/lib/createTrip';

async function main() {
  const trip = await buildDraftTrip({
    originCity: 'São Paulo',
    originAirportCode: 'GRU',
    destinationCity: 'Roma',
    destinationAirportCode: 'FCO',
    selectedCountry: 'Itália',
    departureDate: new Date('2026-08-01'),
    returnDate: new Date('2026-08-05'),
    adults: 2,
    children: [],
    infants: 0,
    budgetTier: 'comfort',
    travelStyle: 'balance',
    budgetAmount: 15000,
    travelInterests: ['culture', 'gastronomy'],
    priorities: ['cultura', 'gastronomia'],
    biologyAIEnabled: true,
  });
  console.log(JSON.stringify(trip, null, 2));
}
main();
