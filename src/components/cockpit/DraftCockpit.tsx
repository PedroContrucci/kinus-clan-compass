// DraftCockpit — Draft trip editing interface with 3-stage flow:
// Stage 1: Flight Selection → Stage 2: Generated Itinerary → Stage 3: Active Trip

import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { FlightSelectionStage, FlightOption, SelectedFlight } from './FlightSelectionStage';
import { GeneratedItineraryStage } from './GeneratedItineraryStage';
import { syncTripFlightPlannedFinances } from '@/lib/flightFinance';

// Types
interface DraftTrip {
  id: string;
  destination: string;
  origin: string;
  emoji: string;
  startDate: string;
  endDate: string;
  budget: number;
  travelers: number;
  priorities: string[];
  travelInterests?: string[];
  biologyAIEnabled?: boolean;
  hasDirectFlight?: boolean;
  connections?: string[];
  jetLagSeverity?: 'BAIXO' | 'MODERADO' | 'ALTO' | 'SEVERO';
  totalDays: number;
  originAirportCode?: string;
  destinationAirportCode?: string;
  flightsSelected?: boolean;
  outboundFlight?: SelectedFlight;
  returnFlight?: SelectedFlight;
  budgetType?: 'backpacker' | 'economic' | 'comfort' | 'luxury';
  days?: any[];
  createdVia?: string;
  flights?: any;
}

interface DraftCockpitProps {
  trip: DraftTrip;
  onSave: (trip: DraftTrip) => void;
  onActivate: (trip: DraftTrip) => void;
  onClose: () => void;
}

function getTravelers(trip: DraftTrip): number {
  return trip.travelers || 1;
}

// Infer airport codes from city names
function inferAirportCode(city: string): string {
  const codeMap: Record<string, string> = {
    'São Paulo': 'GRU',
    'Rio de Janeiro': 'GIG',
    'Paris': 'CDG',
    'Tóquio': 'NRT',
    'Tokyo': 'NRT',
    'Londres': 'LHR',
    'London': 'LHR',
    'Nova York': 'JFK',
    'New York': 'JFK',
    'Lisboa': 'LIS',
    'Barcelona': 'BCN',
    'Roma': 'FCO',
    'Bangkok': 'BKK',
    'Dubai': 'DXB',
    'Cidade do México': 'MEX',
    'Lima': 'LIM',
    'Buenos Aires': 'EZE',
    'Santiago': 'SCL',
    'Florianópolis': 'FLN',
    'Salvador': 'SSA',
    'Recife': 'REC',
    'Fortaleza': 'FOR',
    'Manaus': 'MAO',
    'Brasília': 'BSB',
    'Curitiba': 'CWB',
    'Porto Alegre': 'POA',
    'Natal': 'NAT',
    'Maceió': 'MCZ',
    'Montevidéu': 'MVD',
    'Cartagena': 'CTG',
    'Cusco': 'CUZ',
    'Bariloche': 'BRC',
    'Havana': 'HAV',
  };
  
  return codeMap[city] || city.substring(0, 3).toUpperCase();
}

// Convert a planned flight (as created by buildDraftTrip) into a SelectedFlight
// so the itinerary summary stage can render for KINU-created trips.
function plannedFlightToSelected(flight: any, date: Date): SelectedFlight {
  const route = `${flight.origin} → ${flight.destination}`;
  const duration = flight.duration || '0h';
  const durationMinutes = (() => {
    const m = duration.match(/(\d+)h\s*(\d+)?/);
    if (!m) return 0;
    const hours = parseInt(m[1], 10) || 0;
    const minutes = parseInt(m[2], 10) || 0;
    return hours * 60 + minutes;
  })();

  const option: FlightOption = {
    id: flight.id,
    airline: flight.airline,
    route,
    isDirect: flight.stops === 0,
    duration,
    durationMinutes,
    price: flight.price,
    departureTime: flight.departureTime,
    arrivalTime: flight.arrivalTime,
    segments: [{
      departure: { iataCode: flight.origin, at: flight.departureDate },
      arrival: { iataCode: flight.destination, at: flight.arrivalDate },
    }],
  };

  return { option, date };
}

// Get emoji from destination
function getDestinationEmoji(destination: string): string {
  const emojiMap: Record<string, string> = {
    'Tóquio': '🏯',
    'Tokyo': '🏯',
    'Paris': '🗼',
    'Roma': '🏛️',
    'Lisboa': '🚃',
    'Bangkok': '🛕',
    'Barcelona': '🏖️',
    'Nova York': '🗽',
    'New York': '🗽',
    'Londres': '🎡',
    'London': '🎡',
    'Dubai': '🏗️',
    'Rio de Janeiro': '🏖️',
    'Florianópolis': '🏖️',
    'Salvador': '🎭',
    'Buenos Aires': '💃',
    'Cusco': '🏔️',
    'Machu Picchu': '🏔️',
  };
  return emojiMap[destination] || '✈️';
}

export const DraftCockpit = ({ trip, onSave, onActivate, onClose }: DraftCockpitProps) => {
  // KINU-created trips arrive with a pre-generated itinerary, so we jump straight
  // to the itinerary summary stage while keeping the flight stage reachable.
  const isKinuCreated = (trip as any).createdVia === 'kinu';

  const [stage, setStage] = useState<'flights' | 'itinerary'>(() => 
    (trip.flightsSelected || isKinuCreated) ? 'itinerary' : 'flights'
  );
  
  const [selectedOutbound, setSelectedOutbound] = useState<SelectedFlight | undefined>(() => {
    if (trip.outboundFlight) return trip.outboundFlight;
    if (isKinuCreated && trip.flights?.outbound) {
      return plannedFlightToSelected(trip.flights.outbound, new Date(trip.startDate));
    }
    return undefined;
  });
  const [selectedReturn, setSelectedReturn] = useState<SelectedFlight | undefined>(() => {
    if (trip.returnFlight) return trip.returnFlight;
    if (isKinuCreated && trip.flights?.return) {
      return plannedFlightToSelected(trip.flights.return, new Date(trip.endDate));
    }
    return undefined;
  });
  const [generatedDays, setGeneratedDays] = useState<any[] | null>(null);

  // If the trip already carries a complete generated itinerary (from the wizard /
  // createTrip), we hand it off to GeneratedItineraryStage as `existingDays` and
  // preserve its original shape on activate — never overwriting with a re-generated one.
  const totalDaysExpected =
    trip.totalDays ||
    (Math.round((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86400000) + 1);
  const hasExistingDays = Array.isArray(trip.days)
    && trip.days.length === totalDaysExpected
    && trip.days.every((d: any) => Array.isArray(d?.activities) && d.activities.length > 0);

  // Infer airport codes
  const originCode = trip.originAirportCode || inferAirportCode(trip.origin || 'São Paulo');
  const destinationCode = trip.destinationAirportCode || inferAirportCode(trip.destination);
  const emoji = trip.emoji || getDestinationEmoji(trip.destination);

  const handleFlightsSelected = useCallback((outbound: SelectedFlight, returnFlight: SelectedFlight) => {
    setSelectedOutbound(outbound);
    setSelectedReturn(returnFlight);

    // Update trip with selected flights + sync finances.planned so the flight
    // anchor matches the actual Amadeus price shown in the hero card.
    const updatedTrip: any = {
      ...trip,
      flightsSelected: true,
      outboundFlight: outbound,
      returnFlight: returnFlight,
    };
    syncTripFlightPlannedFinances(updatedTrip);

    onSave(updatedTrip);
    setStage('itinerary');
    
    toast({
      title: "Voos selecionados! ✈️",
      description: "Gerando seu roteiro inteligente...",
    });
  }, [trip, onSave]);

  const handleSave = useCallback(() => {
    const updatedTrip: any = {
      ...trip,
      flightsSelected: stage === 'itinerary',
      outboundFlight: selectedOutbound,
      returnFlight: selectedReturn,
    };
    syncTripFlightPlannedFinances(updatedTrip);
    onSave(updatedTrip);
    toast({ title: "Rascunho salvo! 📝" });
  }, [trip, stage, selectedOutbound, selectedReturn, onSave]);

  const handleActivate = useCallback(() => {
    if (!selectedOutbound || !selectedReturn) {
      toast({ 
        title: "Selecione os voos primeiro", 
        description: "Você precisa definir ida e volta antes de ativar.",
        variant: "destructive" 
      });
      return;
    }
    
    const updatedTrip: any = {
      ...trip,
      status: 'active',
      flightsSelected: true,
      outboundFlight: selectedOutbound,
      returnFlight: selectedReturn,
      days: hasExistingDays ? trip.days : (generatedDays || trip.days),
    };
    syncTripFlightPlannedFinances(updatedTrip);

    onActivate(updatedTrip as any);
    toast({ title: "Viagem ativada! 🚀", description: "Sua viagem está pronta para acompanhamento." });
  }, [trip, selectedOutbound, selectedReturn, onActivate]);

  const handleBackFromItinerary = useCallback(() => {
    setStage('flights');
  }, []);

  const tierToPriceLevel = { backpacker: 'budget', economic: 'budget', comfort: 'midrange', luxury: 'luxury' } as const;
  const chosenPriceLevel = trip.budgetType ? tierToPriceLevel[trip.budgetType] : undefined;

  // Stage 1: Flight Selection
  if (stage === 'flights') {
    return (
      <FlightSelectionStage
        destination={trip.destination}
        origin={trip.origin || 'São Paulo'}
        originCode={originCode}
        destinationCode={destinationCode}
        departureDate={new Date(trip.startDate)}
        returnDate={new Date(trip.endDate)}
        budget={trip.budget}
        emoji={emoji}
        onFlightsSelected={handleFlightsSelected}
        onSave={handleSave}
        onBack={onClose}
      />
    );
  }

  // Stage 2: Generated Itinerary
  if (stage === 'itinerary' && selectedOutbound && selectedReturn) {
    return (
      <GeneratedItineraryStage
        destination={trip.destination}
        origin={trip.origin || 'São Paulo'}
        emoji={emoji}
        departureDate={new Date(trip.startDate)}
        returnDate={new Date(trip.endDate)}
        budget={trip.budget}
        travelers={getTravelers(trip)}
        outboundFlight={selectedOutbound}
        returnFlight={selectedReturn}
        travelInterests={trip.travelInterests}
        jetLagSeverity={trip.jetLagSeverity}
        priceLevel={chosenPriceLevel}
        onActivate={handleActivate}
        onSave={handleSave}
        onBack={handleBackFromItinerary}
        onDaysGenerated={hasExistingDays ? undefined : setGeneratedDays}
        existingDays={hasExistingDays ? trip.days : undefined}
      />
    );
  }

  // Fallback to flights if no flights selected
  return (
    <FlightSelectionStage
      destination={trip.destination}
      origin={trip.origin || 'São Paulo'}
      originCode={originCode}
      destinationCode={destinationCode}
      departureDate={new Date(trip.startDate)}
      returnDate={new Date(trip.endDate)}
      budget={trip.budget}
      emoji={emoji}
      onFlightsSelected={handleFlightsSelected}
      onSave={handleSave}
      onBack={onClose}
    />
  );
};

export default DraftCockpit;
