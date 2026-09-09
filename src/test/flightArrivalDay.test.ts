// Dia de chegada do voo de ida.
//
// O bug que originou esta suíte (testadora-zero, 09/09/2026): GRU → Cartagena com
// voo diurno aparecia chegando no D2, com o roteiro começando só no dia seguinte.
// A causa era `arrivalDaysLater = flightHours > 18 ? 2 : 1` em buildDraftTrip — uma
// expressão que nunca podia valer 0, enquanto calculateArrivalTime já devolvia a
// resposta certa duas linhas acima e era descartada.
//
// A trava aqui tem dois níveis: a aritmética pura (calculateArrivalTime) e a
// viagem inteira (buildDraftTrip), porque o bug não estava na aritmética.
import { describe, it, expect } from 'vitest';
import { differenceInCalendarDays } from 'date-fns';
import { buildDraftTrip } from '@/lib/createTrip';
import { calculateArrivalTime, FLIGHT_DURATION } from '@/types/trip';
import type { DraftTripInput } from '@/lib/createTrip';

const DEPARTURE = new Date(2026, 9, 5); // 05/10/2026, segunda
const RETURN = new Date(2026, 9, 12);

function draftInput(over: Partial<DraftTripInput> = {}): DraftTripInput {
  return {
    originCity: 'São Paulo',
    originAirportCode: 'GRU',
    destinationCity: 'Cartagena',
    destinationAirportCode: 'CTG',
    hasDirectFlight: false,
    departureDate: DEPARTURE,
    returnDate: RETURN,
    adults: 2,
    children: [],
    infants: 0,
    budgetTier: 'comfort',
    travelStyle: 'conforto',
    budgetAmount: 20000,
    travelInterests: [],
    priorities: [],
    ...over,
  };
}

/** Dias de calendário entre a partida e a chegada do voo de ida. 0 = mesmo dia. */
function arrivalOffset(trip: Awaited<ReturnType<typeof buildDraftTrip>>): number {
  const ob = trip.flights!.outbound!;
  return differenceInCalendarDays(new Date(ob.arrivalDate), new Date(ob.departureDate));
}

describe('calculateArrivalTime — aritmética pura, fuso 0', () => {
  // Os três casos do briefing. Já passavam antes do patch: a aritmética nunca
  // esteve errada. Ficam como trava contra quem reintroduzir um `? 2 : 1`.
  it('08:00 + 4h chega no mesmo dia', () => {
    const r = calculateArrivalTime('08:00', DEPARTURE, 4, 0);
    expect(r.arrivalTime).toBe('12:00');
    expect(r.nextDay).toBe(false);
    expect(differenceInCalendarDays(r.arrivalDate, DEPARTURE)).toBe(0);
  });

  it('23:30 + 9h cruza a meia-noite e chega no dia seguinte', () => {
    const r = calculateArrivalTime('23:30', DEPARTURE, 9, 0);
    expect(r.arrivalTime).toBe('08:30');
    expect(r.nextDay).toBe(true);
    expect(differenceInCalendarDays(r.arrivalDate, DEPARTURE)).toBe(1);
  });

  it('08:00 + 9h ainda chega no mesmo dia', () => {
    // O caso que o `durationMinutes < 240` do cockpit reprovava: nove horas é voo
    // longo, mas saindo de manhã não vira o dia.
    const r = calculateArrivalTime('08:00', DEPARTURE, 9, 0);
    expect(r.arrivalTime).toBe('17:00');
    expect(r.nextDay).toBe(false);
    expect(differenceInCalendarDays(r.arrivalDate, DEPARTURE)).toBe(0);
  });
});

describe('buildDraftTrip — GRU → Cartagena (o caso da testadora-zero)', () => {
  it('tem duração honesta na tabela, não as 4h do fallback por fuso', async () => {
    // O fallback lia America/Bogota (2h de fuso) e devolvia 4h para uma rota de
    // 4.500 km sem voo direto. A chave explícita é o que impede isso.
    expect(FLIGHT_DURATION['São Paulo-Cartagena']).toBe(7.5);
    const trip = await buildDraftTrip(draftInput());
    expect(trip.flights!.outbound!.duration).toBe('7.5h');
  });

  it('sai de dia e chega no MESMO dia', async () => {
    const trip = await buildDraftTrip(draftInput());
    const ob = trip.flights!.outbound!;
    expect(ob.departureTime).toBe('08:00');
    expect(arrivalOffset(trip)).toBe(0);
  });

  it('põe o check-in do hotel no dia da chegada, não no seguinte', async () => {
    const trip = await buildDraftTrip(draftInput());
    expect(differenceInCalendarDays(new Date(trip.accommodation!.checkIn), DEPARTURE)).toBe(0);
  });

  it('começa o roteiro no dia 1, com embarque e chegada juntos', async () => {
    const trip = await buildDraftTrip(draftInput());
    const dia1 = trip.days[0];
    expect(dia1.title).toContain('Chegada');
    const nomes = dia1.activities.map(a => a.name);
    expect(nomes.some(n => n.startsWith('Voo '))).toBe(true);
    expect(nomes.some(n => n.startsWith('Chegada em'))).toBe(true);
    expect(nomes.some(n => n === 'Check-in no hotel')).toBe(true);
    // E o dia 2 já é exploração — não pode ter sobrado uma segunda chegada.
    expect(trip.days[1].title).not.toContain('Chegada');
  });

  it('mantém as atividades do dia 1 em ordem cronológica', async () => {
    const trip = await buildDraftTrip(draftInput());
    const horas = trip.days[0].activities.map(a => a.time);
    expect([...horas]).toEqual([...horas].sort());
  });
});

describe('buildDraftTrip — não-regressão dos voos que já estavam certos', () => {
  it('Tóquio (24h) mantém o dia de trânsito e chega no D3', async () => {
    const trip = await buildDraftTrip(draftInput({ destinationCity: 'Tóquio', destinationAirportCode: 'HND' }));
    expect(arrivalOffset(trip)).toBe(2);
    expect(trip.days[0].title).toContain('Embarque');
    expect(trip.days[1].title).toContain('Trânsito');
    expect(trip.days[2].title).toContain('Chegada');
  });

  it('Paris (11,5h, noturno para leste) continua chegando no D2', async () => {
    const trip = await buildDraftTrip(draftInput({ destinationCity: 'Paris', destinationAirportCode: 'CDG' }));
    expect(trip.flights!.outbound!.departureTime).toBe('23:00');
    expect(arrivalOffset(trip)).toBe(1);
    expect(trip.days[0].title).toContain('Embarque');
    expect(trip.days[0].title).not.toContain('Chegada');
    expect(trip.days[1].title).toContain('Chegada');
  });

  it('Lisboa (9h) segue como voo noturno: leste continua leste', async () => {
    // A regra de direção não pode transformar o transatlântico em voo de dia.
    const trip = await buildDraftTrip(draftInput({ destinationCity: 'Lisboa', destinationAirportCode: 'LIS' }));
    expect(trip.flights!.outbound!.departureTime).toBe('21:00');
    expect(arrivalOffset(trip)).toBe(1);
  });

  it('Buenos Aires (3h) chega no mesmo dia, como sempre deveria', async () => {
    const trip = await buildDraftTrip(draftInput({ destinationCity: 'Buenos Aires', destinationAirportCode: 'EZE' }));
    expect(arrivalOffset(trip)).toBe(0);
    expect(trip.days[0].title).toContain('Chegada');
  });
});
