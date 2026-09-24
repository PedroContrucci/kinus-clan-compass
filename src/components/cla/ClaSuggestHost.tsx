// Host global do "Indicar um lugar ao clã": qualquer tela abre o sheet disparando
// `openClaSuggest({ city, preferGps })` (ex.: chip do modo durante no KINU AI).
import { useEffect, useState } from 'react';
import { IndicarLugarSheet } from './IndicarLugarSheet';

const EVT = 'kinu:open-cla-suggest';

export interface OpenClaSuggestDetail {
  city?: string;
  preferGps?: boolean;
}

export function openClaSuggest(detail: OpenClaSuggestDetail = {}): void {
  window.dispatchEvent(new CustomEvent<OpenClaSuggestDetail>(EVT, { detail }));
}

export const ClaSuggestHost = () => {
  const [state, setState] = useState<OpenClaSuggestDetail | null>(null);

  useEffect(() => {
    const on = (e: Event) => setState((e as CustomEvent<OpenClaSuggestDetail>).detail ?? {});
    window.addEventListener(EVT, on);
    return () => window.removeEventListener(EVT, on);
  }, []);

  return (
    <IndicarLugarSheet
      open={state !== null}
      onOpenChange={(o) => !o && setState(null)}
      defaultCity={state?.city}
      preferGps={state?.preferGps}
      onSent={() => window.dispatchEvent(new Event('kinu:cla-suggested'))}
    />
  );
};

export default ClaSuggestHost;
