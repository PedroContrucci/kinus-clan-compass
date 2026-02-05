// Dashboard — Unified view merging Planejar + Viagens

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, LogOut } from 'lucide-react';
import { TripCard, NewPlanningButton, CompletedTripStats } from '@/components/dashboard';
import { KinuAssistant } from '@/components/ai/KinuAssistant';
import kinuLogo from '@/assets/KINU_logo.png';
import type { SavedTrip } from '@/types/trip';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('kinu_user');
    if (!savedUser) {
      navigate('/');
      return;
    }
    setUser(JSON.parse(savedUser));

    const savedTrips = JSON.parse(localStorage.getItem('kinu_trips') || '[]');
    setTrips(savedTrips);
  }, [navigate]);

  const activeTrips = trips.filter((t) => t.status === 'active' || t.status === 'ongoing' || t.status === 'draft');
  const completedTrips = trips.filter((t) => t.status === 'completed');

  const handleLogout = () => {
    localStorage.removeItem('kinu_user');
    navigate('/');
  };

  const handleTripClick = (tripId: string) => {
    navigate(`/viagens?trip=${tripId}`);
  };

  // Mock completed stats
  const completedStats = {
    countriesVisited: completedTrips.length,
    restaurantsCurated: completedTrips.length * 4,
    totalSaved: completedTrips.reduce((acc, t) => acc + (t.finances?.available || 0) * 0.1, 0),
    highlights: ['Sakura em Kyoto', 'Pasta em Roma', 'Sunset em Santorini'],
  };

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
            onClick={handleLogout}
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
            Viagens Ativas
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
              {activeTrips.map((trip) => (
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
            <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-8 text-center">
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
      <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border px-4 py-2">
        <div className="flex justify-around">
          {[
            { id: 'dashboard', label: '🏠 Home', path: '/dashboard' },
            { id: 'planejar', label: '✨ Planejar', path: '/planejar' },
            { id: 'cla', label: '👥 Clã', path: '/cla' },
            { id: 'conta', label: '👤 Perfil', path: '/conta' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                item.id === 'dashboard'
                  ? 'text-emerald-400'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="text-lg">{item.label.split(' ')[0]}</span>
              <span className="text-xs mt-0.5">{item.label.split(' ')[1]}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* KINU AI Assistant */}
      <KinuAssistant />
    </div>
  );
};

export default Dashboard;
