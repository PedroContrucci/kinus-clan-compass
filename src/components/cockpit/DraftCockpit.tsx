// DraftCockpit — Draft trip editing interface with 3-stage flow:
// Stage 1: Flight Selection → Stage 2: Generated Itinerary → Stage 3: Active Trip

import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { FlightSelectionStage, SelectedFlight } from './FlightSelectionStage';
import { GeneratedItineraryStage } from './GeneratedItineraryStage';

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
  totalDays: number;
  originAirportCode?: string;
  destinationAirportCode?: string;
  flightsSelected?: boolean;
  outboundFlight?: SelectedFlight;
  returnFlight?: SelectedFlight;
}

interface DraftCockpitProps {
  trip: DraftTrip;
  onSave: (trip: DraftTrip) => void;
  onActivate: (trip: DraftTrip) => void;
  onClose: () => void;
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
  // Determine initial stage based on whether flights are already selected
  const [stage, setStage] = useState<'flights' | 'itinerary'>(() => 
    trip.flightsSelected ? 'itinerary' : 'flights'
  );
  
  const [selectedOutbound, setSelectedOutbound] = useState<SelectedFlight | undefined>(trip.outboundFlight);
  const [selectedReturn, setSelectedReturn] = useState<SelectedFlight | undefined>(trip.returnFlight);

  // Infer airport codes
  const originCode = trip.originAirportCode || inferAirportCode(trip.origin || 'São Paulo');
  const destinationCode = trip.destinationAirportCode || inferAirportCode(trip.destination);
  const emoji = trip.emoji || getDestinationEmoji(trip.destination);

  const handleFlightsSelected = useCallback((outbound: SelectedFlight, returnFlight: SelectedFlight) => {
    setSelectedOutbound(outbound);
    setSelectedReturn(returnFlight);
    
    // Update trip with selected flights
    const updatedTrip = {
      ...trip,
      flightsSelected: true,
      outboundFlight: outbound,
      returnFlight: returnFlight,
    };
    
    onSave(updatedTrip);
    setStage('itinerary');
    
    toast({
      title: "Voos selecionados! ✈️",
      description: "Gerando seu roteiro inteligente...",
    });
  }, [trip, onSave]);

  const handleSave = useCallback(() => {
    const updatedTrip = {
      ...trip,
      flightsSelected: stage === 'itinerary',
      outboundFlight: selectedOutbound,
      returnFlight: selectedReturn,
    };
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
    
    const updatedTrip = {
      ...trip,
      status: 'active',
      flightsSelected: true,
      outboundFlight: selectedOutbound,
      returnFlight: selectedReturn,
    };
    
    onActivate(updatedTrip as any);
    toast({ title: "Viagem ativada! 🚀", description: "Sua viagem está pronta para acompanhamento." });
  }, [trip, selectedOutbound, selectedReturn, onActivate]);

  const handleBackFromItinerary = useCallback(() => {
    setStage('flights');
  }, []);

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
        outboundFlight={selectedOutbound}
        returnFlight={selectedReturn}
        travelInterests={trip.travelInterests}
        onActivate={handleActivate}
        onSave={handleSave}
        onBack={handleBackFromItinerary}
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
