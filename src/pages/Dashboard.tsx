// Dashboard — Unified view merging Planejar + Viagens (Supabase connected)

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, LogOut, Loader2 } from 'lucide-react';
import { TripCard, NewPlanningButton, CompletedTripStats } from '@/components/dashboard';
import { KinuAssistant } from '@/components/ai/KinuAssistant';
import { BottomNav } from '@/components/shared/BottomNav';
import { useUserTrips } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import kinuLogo from '@/assets/KINU_logo.png';
import { differenceInDays } from 'date-fns';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, logout } = useAuth();
  const [showCompleted, setShowCompleted] = useState(false);

  // Fetch trips from Supabase
  const { data: supabaseTrips, isLoading: tripsLoading } = useUserTrips(user?.id);

  // Also check localStorage for backwards compatibility
  const [localTrips, setLocalTrips] = useState<any[]>([]);
  
  useEffect(() => {
    if (!user && !authLoading) {
      navigate('/');
      return;
    }
    const savedTrips = JSON.parse(localStorage.getItem('kinu_trips') || '[]');
    setLocalTrips(savedTrips);
  }, [user, authLoading, navigate]);

  // Merge trips from both sources
  const allTrips = [...(localTrips || [])];
  
  // Transform Supabase trips to match local format
  if (supabaseTrips) {
    supabaseTrips.forEach((trip: any) => {
      const transformedTrip = {
        id: trip.id,
        destination: trip.destination_city?.name_pt || trip.name,
        emoji: getDestinationEmoji(trip.destination_city?.name_pt || trip.name),
        country: trip.destination_city?.country?.name_pt || '',
        startDate: trip.departure_date,
        endDate: trip.return_date,
        budget: trip.budget_total || 0,
        finances: {
          total: trip.budget_total || 0,
          confirmed: trip.budget_used || 0,
        },
        progress: calculateProgress(trip.checklist || []),
        status: trip.status || 'draft',
      };
      
      // Avoid duplicates
      if (!allTrips.find(t => t.id === trip.id)) {
        allTrips.push(transformedTrip);
      }
    });
  }

  const activeTrips = allTrips.filter((t) => 
    t.status === 'active' || t.status === 'ongoing' || t.status === 'draft'
  );
  const completedTrips = allTrips.filter((t) => t.status === 'completed');

  // Calculate KPIs for active trips
  const tripKPIs = activeTrips.map((trip) => {
    const daysUntil = trip.startDate 
      ? differenceInDays(new Date(trip.startDate), new Date())
      : 0;
    return {
      ...trip,
      daysUntil,
      isUrgent: daysUntil > 0 && daysUntil < 7,
    };
  });

  const handleTripClick = (tripId: string) => {
    navigate(`/viagens?trip=${tripId}`);
  };

  // Mock completed stats (will be enhanced with real data later)
  const completedStats = {
    countriesVisited: completedTrips.length,
    restaurantsCurated: completedTrips.length * 4,
    totalSaved: completedTrips.reduce((acc, t) => acc + (t.finances?.available || 0) * 0.1, 0),
    highlights: ['Sakura em Kyoto', 'Pasta em Roma', 'Sunset em Santorini'],
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={kinuLogo} alt="KINU" className="w-10 h-10" />
            <div>
              <h1 className="font-bold text-lg font-['Outfit'] text-foreground">
                Olá, {user.name.split(' ')[0]}
              </h1>
              <p className="text-sm text-muted-foreground">Bora planejar? ✨</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <LogOut size={20} className="text-muted-foreground" />
          </button>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* CTA Button */}
        <NewPlanningButton />

        {/* Active Trips */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Viagens Ativas {tripsLoading && <Loader2 size={14} className="inline animate-spin ml-2" />}
          </h2>

          {activeTrips.length > 0 ? (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 },
                },
              }}
              className="space-y-4"
            >
              {tripKPIs.map((trip) => (
                <motion.div
                  key={trip.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <TripCard
                    trip={trip}
                    onClick={() => handleTripClick(trip.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <p className="text-muted-foreground mb-2">Nenhuma viagem em andamento</p>
              <p className="text-sm text-muted-foreground/70">
                Clique em "Novo Planejamento" para começar
              </p>
            </div>
          )}
        </section>

        {/* Completed Trips */}
        {completedTrips.length > 0 && (
          <section>
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center justify-between w-full mb-4"
            >
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Viagens Concluídas ({completedTrips.length})
              </h2>
              {showCompleted ? (
                <ChevronUp size={18} className="text-muted-foreground" />
              ) : (
                <ChevronDown size={18} className="text-muted-foreground" />
              )}
            </button>

            {showCompleted && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4"
              >
                <CompletedTripStats stats={completedStats} />
                
                {completedTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    onClick={() => handleTripClick(trip.id)}
                  />
                ))}
              </motion.div>
            )}
          </section>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* KINU AI Assistant */}
      <KinuAssistant />
    </div>
  );
};

// Helper functions
function getDestinationEmoji(destination: string): string {
  const emojiMap: Record<string, string> = {
    'Tóquio': '🏯',
    'Tokyo': '🏯',
    'Paris': '🗼',
    'Roma': '🏛️',
    'Rome': '🏛️',
    'Lisboa': '🚃',
    'Lisbon': '🚃',
    'Barcelona': '🏖️',
    'Nova York': '🗽',
    'New York': '🗽',
    'Londres': '🎡',
    'London': '🎡',
    'Dubai': '🏙️',
    'Bangkok': '🛕',
    'Singapore': '🌆',
    'Singapura': '🌆',
    'Sydney': '🦘',
  };
  
  return emojiMap[destination] || '✈️';
}

function calculateProgress(checklist: any[]): number {
  if (!checklist || checklist.length === 0) return 0;
  const completed = checklist.filter(item => item.is_completed).length;
  return Math.round((completed / checklist.length) * 100);
}

export default Dashboard;
