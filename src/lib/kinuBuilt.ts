// isKinuBuilt — viagens que o KINU montou sozinho (KINU AI ou onboarding "Montar minha viagem").
// Elas chegam com roteiro e voo estimado prontos; o cockpit abre no Roteiro. `createdVia`
// continua sendo a origem real nos eventos — este predicado só agrupa os dois valores.
export function isKinuBuilt(trip: { createdVia?: unknown } | null | undefined): boolean {
  const v = trip?.createdVia;
  return v === 'kinu' || v === 'onboarding';
}
