// Hook para Dashboard de Viagem (4 KPIs)

import { useMemo } from 'react';
import { SavedTrip } from '@/types/trip';
import { useCountdown } from './useCountdown';

export interface TripDashboardData {
  countdown: {
    daysLeft: number;
    hoursLeft: number;
    departureDate: Date | null;
    isUrgent: boolean;
    isPast: boolean;
  };
  checklist: {
    total: number;
    completed: number;
    percent: number;
    pendingItems: { id: string; label: string }[];
  };
  payments: {
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    biddingAmount: number;
    paidPercent: number;
  };
  auctionSavings: {
    totalSaved: number;
    percentSaved: number;
    auctionCount: number;
  };
}

export const useTripDashboard = (trip: SavedTrip | null): TripDashboardData | null => {
  const countdownData = useCountdown(trip?.startDate ?? null);

  return useMemo(() => {
    if (!trip) return null;

    // ═══════════════════════════════════════════════════════
    // COUNTDOWN
    // ═══════════════════════════════════════════════════════
    const countdown = {
      daysLeft: countdownData.daysLeft,
      hoursLeft: countdownData.hoursLeft,
      departureDate: trip.startDate ? new Date(trip.startDate) : null,
      isUrgent: countdownData.isUrgent,
      isPast: countdownData.isPast
    };

    // ═══════════════════════════════════════════════════════
    // CHECKLIST
    // ═══════════════════════════════════════════════════════
    const checklist = {
      total: trip.checklist?.length ?? 0,
      completed: trip.checklist?.filter(item => item.checked).length ?? 0,
      percent: trip.checklist?.length 
        ? Math.round((trip.checklist.filter(item => item.checked).length / trip.checklist.length) * 100)
        : 0,
      pendingItems: trip.checklist
        ?.filter(item => !item.checked)
        .map(item => ({ id: item.id, label: item.label })) ?? []
    };

    // ═══════════════════════════════════════════════════════
    // PAYMENTS
    // ═══════════════════════════════════════════════════════
    const payments = {
      totalAmount: trip.finances?.total ?? trip.budget,
      paidAmount: trip.finances?.confirmed ?? 0,
      pendingAmount: trip.finances?.planned ?? 0,
      biddingAmount: trip.finances?.bidding ?? 0,
      paidPercent: trip.finances?.total 
        ? Math.round((trip.finances.confirmed / trip.finances.total) * 100)
        : 0
    };

    // ═══════════════════════════════════════════════════════
    // AUCTION SAVINGS
    // ═══════════════════════════════════════════════════════
    // Calcular economia de leilões baseado nas atividades com status 'confirmed' que tinham 'bidding'
    let totalOriginalCost = 0;
    let totalFinalCost = 0;
    let auctionCount = 0;

    trip.days?.forEach(day => {
      day.activities?.forEach(activity => {
        if (activity.status === 'confirmed' && activity.paidAmount) {
          // Se pagou menos que o custo estimado, houve economia
          if (activity.paidAmount < activity.cost) {
            totalOriginalCost += activity.cost;
            totalFinalCost += activity.paidAmount;
            auctionCount++;
          }
        }
      });
    });

    const totalSaved = totalOriginalCost - totalFinalCost;
    const percentSaved = totalOriginalCost > 0 
      ? Math.round((totalSaved / totalOriginalCost) * 100)
      : 0;

    const auctionSavings = {
      totalSaved,
      percentSaved,
      auctionCount
    };

    return {
      countdown,
      checklist,
      payments,
      auctionSavings
    };
  }, [trip, countdownData]);
};

export default useTripDashboard;
