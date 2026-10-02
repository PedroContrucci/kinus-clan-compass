import { it } from 'vitest';
import { buildDraftTrip } from '@/lib/createTrip';
import { tripDaysToItinerary } from '@/lib/draftItinerary';
import { computeBuckets } from '@/lib/itineraryEngine';
it('x', async () => {
  const t:any = await buildDraftTrip({originCity:'São Paulo',originAirportCode:'GRU',destinationCity:'Cartagena',destinationAirportCode:'CTG',departureDate:new Date(2026,10,1,12),returnDate:new Date(2026,10,6,12),adults:2,children:[],infants:0,budgetTier:'comfort',travelStyle:'comfort',budgetAmount:0,travelInterests:[],priorities:[]});
  const d = tripDaysToItinerary(t.days,new Date(t.startDate),2);
  const bd:any={flights:{amount:0},hotel:{amount:0}};
  console.log('FIN', JSON.stringify(t.finances.categories), JSON.stringify(computeBuckets(d,bd)));
  console.log('ACC', t.accommodation.name, t.accommodation.neighborhood, JSON.stringify(t.days[0].activities));
});
