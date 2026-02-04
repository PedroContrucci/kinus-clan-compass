import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Activity {
  id: string;
  name: string;
  image: string;
  cost: number;
  estimatedCost: number;
  duration: string;
  location: string;
  time: string;
  date: string;
  status: 'pending' | 'bidding' | 'confirmed';
  confirmedCost?: number;
}

interface Trip {
  id: string;
  destination: string;
  dates: { start: string; end: string };
  totalCost: number;
  confirmedCost: number;
  inAuctionCost: number;
  daysUntil: number;
  hoursUntil: number;
  activities: Activity[];
  budget: number;
  tier: string;
}

interface TripsStore {
  trips: Trip[];
  loadTrips: () => void;
  addTrip: (trip: Trip) => void;
  removeTrip: (tripId: string) => void;
  updateActivity: (tripId: string, activityId: string, updates: Partial<Activity>) => void;
  startAuction: (tripId: string, activityId: string) => void;
  confirmActivity: (tripId: string, activityId: string, confirmedCost: number) => void;
}

export const useTripsStore = create<TripsStore>()(
  persist(
    (set, get) => ({
      trips: [],
      
      loadTrips: () => {
        const stored = localStorage.getItem('kinu-trips');
        if (stored) {
          set({ trips: JSON.parse(stored) });
        }
      },
      
      addTrip: (trip) => set((state) => ({
        trips: [...state.trips, trip]
      })),
      
      // ═══════════════════════════════════════════════════════════════════
      // REMOVER VIAGEM — OBRIGATÓRIO
      // ═══════════════════════════════════════════════════════════════════
      removeTrip: (tripId) => {
        set((state) => ({
          trips: state.trips.filter(t => t.id !== tripId)
        }));
        // Also update localStorage
        const current = get().trips;
        localStorage.setItem('kinu-trips', JSON.stringify(current.filter(t => t.id !== tripId)));
      },
      
      updateActivity: (tripId, activityId, updates) => set((state) => ({
        trips: state.trips.map(trip => {
          if (trip.id !== tripId) return trip;
          return {
            ...trip,
            activities: trip.activities.map(act => 
              act.id === activityId ? { ...act, ...updates } : act
            )
          };
        })
      })),
      
      startAuction: (tripId, activityId) => set((state) => ({
        trips: state.trips.map(trip => {
          if (trip.id !== tripId) return trip;
          const updatedActivities = trip.activities.map(act => 
            act.id === activityId ? { ...act, status: 'bidding' as const } : act
          );
          const inAuctionCost = updatedActivities
            .filter(a => a.status === 'bidding')
            .reduce((sum, a) => sum + a.estimatedCost, 0);
          return { ...trip, activities: updatedActivities, inAuctionCost };
        })
      })),
      
      confirmActivity: (tripId, activityId, confirmedCost) => set((state) => ({
        trips: state.trips.map(trip => {
          if (trip.id !== tripId) return trip;
          const updatedActivities = trip.activities.map(act => 
            act.id === activityId ? { ...act, status: 'confirmed' as const, confirmedCost } : act
          );
          const totalConfirmed = updatedActivities
            .filter(a => a.status === 'confirmed')
            .reduce((sum, a) => sum + (a.confirmedCost || 0), 0);
          const inAuctionCost = updatedActivities
            .filter(a => a.status === 'bidding')
            .reduce((sum, a) => sum + a.estimatedCost, 0);
          return { 
            ...trip, 
            activities: updatedActivities, 
            confirmedCost: totalConfirmed,
            inAuctionCost 
          };
        })
      }))
    }),
    { name: 'kinu-trips-store' }
  )
);
