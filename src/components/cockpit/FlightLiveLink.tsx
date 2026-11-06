// FlightLiveLink — "Ver preço de hoje ↗": busca viva da Aviasales com o marker de afiliado do KINU (M10-0).
import { ExternalLink } from 'lucide-react';
import { buildAviasalesSearchLink } from '@/lib/aviasalesLink';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trip: any;
  origin: string;
  destination: string;
}

export function FlightLiveLink({ trip, origin, destination }: Props) {
  const roundTrip = trip?.endDate;
  const href = buildAviasalesSearchLink({
    origin, destination,
    startDate: String(trip?.startDate ?? '').slice(0, 10),
    endDate: roundTrip ? String(trip.endDate).slice(0, 10) : null,
    trip,
  });
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="flight-live-link"
      className="inline-flex items-center gap-1 text-xs font-medium text-sky-400 mt-2 hover:underline"
    >
      Ver preço de hoje <ExternalLink size={11} aria-hidden />
    </a>
  );
}
