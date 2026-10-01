import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { KinuDidCard } from '@/components/onboarding/KinuDidCard';

describe('KinuDidCard — trocar do voo', () => {
  it('(3) abre o passo 06 Voo', () => {
    const onOpenFlights = vi.fn();
    const trip = { destination: 'Cartagena', startDate: '2026-11-10', endDate: '2026-11-15', travelers: 2, days: [] };
    render(<MemoryRouter><KinuDidCard trip={trip} onActivate={() => {}} onUpdateTrip={() => {}} onOpenFlights={onOpenFlights} /></MemoryRouter>);
    expect(screen.getByText(/Voo estimado · ida 10\/11 · volta 15\/11/)).toBeTruthy();
    fireEvent.click(screen.getByLabelText('trocar ✈️'));
    expect(onOpenFlights).toHaveBeenCalledTimes(1);
  });
});
