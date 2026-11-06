// FlightPriceLines — texto sob o preço do hero de voo (M20b). Nunca diz "total": o preço é uma
// estimativa por pagante (preço de referência de 1 adulto × adultos + crianças), com fonte e data.
import { airfarePaxOf, paxLabel } from '@/lib/pax';
import { formatFoundAt, tripFoundAt } from '@/lib/aviasalesLink';

const fmt = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });

function consultaDate(iso: unknown): string | null {
  if (typeof iso !== 'string') return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('pt-BR');
}

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trip: any;
  /** Valor exibido acima (já multiplicado por pagante). */
  amount: number;
  confirmed: boolean;
}

export function FlightPriceLines({ trip, amount, confirmed }: Props) {
  const pax = airfarePaxOf(trip);
  const label = paxLabel(pax);
  const payers = `${pax.payers} ${pax.payers === 1 ? 'pagante' : 'pagantes'}`;
  const perPerson = Math.round(amount / pax.payers);
  const isReference = trip?.outboundFlight?.source === 'reference' && trip?.returnFlight?.source === 'reference';
  // M10-0: com found_at → "visto em DD/MM às HH:MM". Sem → data da consulta como sempre (o assert da
  // M20b fixa "(Aviasales, DD/MM/AAAA)"; a palavra "consultado" ficou de fora por isso — ver relatório).
  const seen = formatFoundAt(tripFoundAt(trip));
  const queried = consultaDate(trip?.kinuFlightSearch?.searchedAt);
  const when = seen ?? queried;

  let line: string;
  if (confirmed) line = `confirmado para ${label}`;
  else if (isReference) line = `estimativa para ${label} · preço de referência por adulto (Aviasales${when ? `, ${when}` : ''}) × ${payers}`;
  else line = `estimativa para ${label} · estimativa do KINU por adulto × ${payers}`;

  return (
    <>
      <p className="text-xs text-muted-foreground mt-1" data-testid="flight-price-basis">{line}</p>
      <p className="text-xs text-muted-foreground" data-testid="flight-price-pp">por pessoa ≈ R$ {fmt(perPerson)}</p>
      {pax.infants > 0 && (
        <p className="text-[10px] text-muted-foreground" data-testid="flight-infant-note">bebê de colo: tarifa à parte</p>
      )}
    </>
  );
}
