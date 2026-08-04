// Regression guard for the return-flight fallback route swap.
// Bug: the return caller pre-swapped origin/destination into a function that
// already swaps internally when isReturn — the two inversions cancelled and the
// return leg rendered the OUTBOUND route (see DIAGNOSTICO-VOO-VOLTA.md).
// The invariant: callers always pass (tripOrigin, tripDestination, isReturn).

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  FlightSelectionStage,
  generateFallbackFlightOptions,
} from "@/components/cockpit/FlightSelectionStage";

// Force the fallback path: both searches resolve to an empty offer list, which
// is exactly what the upstream returns for a regional route on an uncached date.
vi.mock("@/hooks/useFlightSearch", () => ({
  useFlightSearch: () => ({
    data: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useFlexibleFlightSearch: () => ({ data: [], isLoading: false, error: null }),
  formatFlightPrice: (price: number) => `R$ ${price}`,
}));

describe("generateFallbackFlightOptions", () => {
  it("fallback da volta inverte a rota da ida (doméstico)", () => {
    const ida = generateFallbackFlightOptions("FOR", "REC", false);
    const volta = generateFallbackFlightOptions("FOR", "REC", true);

    expect(ida.every((o) => o.route === "FOR → REC")).toBe(true);
    expect(volta.every((o) => o.route === "REC → FOR")).toBe(true);
  });

  it("fallback da volta inverte a rota da ida (internacional)", () => {
    const ida = generateFallbackFlightOptions("GRU", "CDG", false);
    const volta = generateFallbackFlightOptions("GRU", "CDG", true);

    expect(ida.every((o) => o.route === "GRU → CDG")).toBe(true);
    expect(volta.every((o) => o.route === "CDG → GRU")).toBe(true);
  });

  it("ida e volta não são ofertas idênticas (doméstico)", () => {
    const ida = generateFallbackFlightOptions("FOR", "REC", false);
    const volta = generateFallbackFlightOptions("FOR", "REC", true);

    expect(volta).toHaveLength(ida.length);
    ida.forEach((out, i) => {
      const ret = volta[i];
      expect(ret.id).not.toBe(out.id);
      expect(ret.price).not.toBe(out.price);
      expect(ret.departureTime).not.toBe(out.departureTime);
    });
  });
});

// The unit tests above pin the function's own behaviour. This one pins the
// CALL SITE — it is the test that actually fails if the return caller starts
// pre-swapping origin/destination again (the original bug).
describe("FlightSelectionStage — fallback rendering", () => {
  const renderStage = () =>
    render(
      <FlightSelectionStage
        destination="Recife"
        origin="Fortaleza"
        originCode="FOR"
        destinationCode="REC"
        departureDate={new Date("2026-09-15T12:00:00Z")}
        returnDate={new Date("2026-09-20T12:00:00Z")}
        budget={5000}
        emoji="🏖️"
        onFlightsSelected={vi.fn()}
        onSave={vi.fn()}
        onBack={vi.fn()}
      />
    );

  it("cartões da IDA mostram FOR → REC", () => {
    renderStage();
    // The outbound section is the one expanded on mount.
    expect(screen.getAllByText("FOR → REC").length).toBeGreaterThan(0);
    expect(screen.queryByText("REC → FOR")).toBeNull();
  });

  it("cartões da VOLTA mostram REC → FOR, não a rota da ida", () => {
    renderStage();
    fireEvent.click(screen.getByText("VOO DE VOLTA"));

    // Not a queryByText(...).toBeNull() on the outbound route: the outbound
    // cards stay mounted through framer-motion's exit animation. Counting the
    // return route is guard enough — with the swap bug the return section
    // renders "FOR → REC" and this query matches nothing.
    expect(screen.getAllByText("REC → FOR")).toHaveLength(3);
  });
});
