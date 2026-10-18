// Apresentação de item do roteiro (C.4.1): derivado na renderização, nada gravado.
import { formatDurationHM, durationTextToMinutes } from '@/lib/flightModel';

/** Check-in, check-out, transfer e voo são "Logística" a qualquer hora — pela natureza, não pelo slot. */
export function isLogisticsItem(a: { id?: string; type?: string }): boolean {
  return ['flight', 'checkin', 'checkout', 'transport'].includes(a.type ?? '')
    || /slot-(checkin|checkout|transfer)$/.test(a.id ?? '');
}

/** Duração gravada ("0.5h") na tela: < 60 → "30 min"; senão formatDurationHM ("1h30", "5h"). Ilegível → como veio. */
export function durationLabel(text: unknown): string {
  const m = durationTextToMinutes(text);
  if (m <= 0) return String(text ?? '');
  return m < 60 ? `${m} min` : formatDurationHM(m);
}
