// Dashboard — Unified view with active trips, drafts, completed, and KINU insights
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, LogOut, Loader2, Plane, Sparkles, Clock, CheckCircle2, TrendingUp, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { BottomNav } from '@/components/shared/BottomNav';
import { useUserTrips } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import kinuLogo from '@/assets/KINU_logo.png';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AgentCards } from '@/components/dashboard/AgentCards';
import { TripCardWithPhoto } from '@/components/dashboard/TripCardWithPhoto';

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
        budgetUsed: trip.budget_used || 0,
        finances: {
          total: trip.budget_total || 0,
          confirmed: trip.budget_used || 0,
        },
        progress: calculateProgress(trip.checklist || []),
        status: trip.status || 'draft',
        checklist: trip.checklist || [],
      };
      
      // Avoid duplicates
      if (!allTrips.find(t => t.id === trip.id)) {
        allTrips.push(transformedTrip);
      }
    });
  }

  const activeTrips = allTrips.filter((t) => 
    t.status === 'active' || t.status === 'ongoing'
  );
  const draftTrips = allTrips.filter((t) => t.status === 'draft');
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
                Olá, {user.name.split(' ')[0]}!
              </h1>
              <p className="text-sm text-muted-foreground">Para onde vamos? ✨</p>
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
        {/* CTA Button — Plan New Trip */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/planejar')}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-5 px-6 rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Plane size={24} className="text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-lg font-['Outfit']">Planejar Nova Viagem</p>
              <p className="text-white/80 text-sm">Comece sua próxima aventura</p>
            </div>
          </div>
          <ArrowRight size={24} className="text-white/80 group-hover:translate-x-1 transition-transform" />
        </motion.button>

        {/* Agent Cards */}
        <AgentCards trips={allTrips} onNavigate={navigate} />

        {/* Active Trips */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
            🗺️ Viagens Ativas 
            {tripsLoading && <Loader2 size={14} className="animate-spin ml-2" />}
          </h2>

          {tripKPIs.length > 0 ? (
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
                <TripCardWithPhoto
                  key={trip.id}
                  trip={trip}
                  onClick={() => handleTripClick(trip.id)}
                />
              ))}
            </motion.div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <p className="text-muted-foreground mb-2">Nenhuma viagem ativa</p>
              <p className="text-sm text-muted-foreground/70">
                Clique em "Planejar Nova Viagem" para começar
              </p>
            </div>
          )}
        </section>

        {/* Draft Trips */}
        {draftTrips.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
              📝 Rascunhos ({draftTrips.length})
            </h2>
            <div className="space-y-3">
              {draftTrips.map((trip) => (
                <DraftTripCard
                  key={trip.id}
                  trip={trip}
                  onClick={() => handleTripClick(trip.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Completed Trips — Collapsible */}
        {completedTrips.length > 0 && (
          <Collapsible open={showCompleted} onOpenChange={setShowCompleted}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center justify-between w-full mb-4">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  ✅ Viagens Concluídas ({completedTrips.length})
                </h2>
                {showCompleted ? (
                  <ChevronUp size={18} className="text-muted-foreground" />
                ) : (
                  <ChevronDown size={18} className="text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {/* Stats Summary */}
                <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-2xl p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-foreground font-['Outfit']">
                        {completedTrips.length}
                      </p>
                      <p className="text-xs text-muted-foreground">Países</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground font-['Outfit']">
                        {completedTrips.length * 4}
                      </p>
                      <p className="text-xs text-muted-foreground">Restaurantes</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-primary font-['Outfit']">
                        R$ {completedTrips.reduce((acc, t) => acc + (t.finances?.available || 0) * 0.1, 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-muted-foreground">Economizados</p>
                    </div>
                  </div>
                </div>

                {completedTrips.map((trip) => (
                  <CompletedTripCard
                    key={trip.id}
                    trip={trip}
                    onClick={() => handleTripClick(trip.id)}
                  />
                ))}
              </motion.div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

// Active Trip Card Component
interface ActiveTripCardProps {
  trip: any;
  onClick: () => void;
}

const ActiveTripCard = ({ trip, onClick }: ActiveTripCardProps) => {
  const progressPercent = trip.progress || 0;
  const budgetPercent = trip.budget > 0 ? Math.round((trip.budgetUsed / trip.budget) * 100) : 0;
  
  return (
    <motion.button
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full bg-card border border-border rounded-2xl p-4 text-left hover:border-primary/30 hover:shadow-lg transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{trip.emoji}</span>
          <div>
            <h3 className="font-bold text-foreground font-['Outfit']">{trip.destination}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar size={12} />
              {trip.startDate && format(new Date(trip.startDate), 'dd/MM', { locale: ptBR })} - 
              {trip.endDate && format(new Date(trip.endDate), 'dd/MM', { locale: ptBR })}
            </p>
          </div>
        </div>
        <ArrowRight size={20} className="text-muted-foreground" />
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-3 gap-3">
        {/* Countdown */}
        <div className={`bg-muted/50 rounded-xl p-3 text-center ${trip.isUrgent ? 'ring-2 ring-red-500/50' : ''}`}>
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock size={14} className={trip.isUrgent ? 'text-red-500' : 'text-muted-foreground'} />
          </div>
          <p className={`text-xl font-bold font-['Outfit'] ${trip.isUrgent ? 'text-red-500' : 'text-foreground'}`}>
            {trip.daysUntil > 0 ? trip.daysUntil : 0}
          </p>
          <p className="text-[10px] text-muted-foreground">dias restam</p>
        </div>

        {/* Checklist Progress */}
        <div className="bg-muted/50 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <CheckCircle2 size={14} className="text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-foreground font-['Outfit']">{progressPercent}%</p>
          <p className="text-[10px] text-muted-foreground">pronto</p>
        </div>

        {/* Budget */}
        <div className="bg-muted/50 rounded-xl p-3">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp size={14} className="text-primary" />
          </div>
          <p className="text-sm font-bold text-foreground font-['Outfit'] text-center">
            R$ {((trip.budgetUsed || 0) / 1000).toFixed(1)}k
          </p>
          <Progress value={budgetPercent} className="h-1.5 mt-1" />
          <p className="text-[10px] text-muted-foreground text-center mt-1">
            de R$ {((trip.budget || 0) / 1000).toFixed(0)}k
          </p>
        </div>
      </div>
    </motion.button>
  );
};

// Draft Trip Card
const DraftTripCard = ({ trip, onClick }: { trip: any; onClick: () => void }) => (
  <motion.button
    whileHover={{ x: 4 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="w-full flex items-center justify-between bg-card/50 border border-dashed border-border rounded-xl p-4 text-left hover:border-primary/30 transition-all"
  >
    <div className="flex items-center gap-3">
      <span className="text-2xl opacity-50">{trip.emoji}</span>
      <div>
        <p className="font-medium text-foreground/70">{trip.destination}</p>
        <p className="text-xs text-muted-foreground">Rascunho • Continuar planejando</p>
      </div>
    </div>
    <ArrowRight size={18} className="text-muted-foreground" />
  </motion.button>
);

// Completed Trip Card
const CompletedTripCard = ({ trip, onClick }: { trip: any; onClick: () => void }) => (
  <motion.button
    whileHover={{ y: -2 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="w-full flex items-center justify-between bg-card border border-border rounded-xl p-4 text-left hover:border-primary/30 transition-all opacity-80"
  >
    <div className="flex items-center gap-3">
      <span className="text-2xl">{trip.emoji}</span>
      <div>
        <p className="font-medium text-foreground">{trip.destination}</p>
        <p className="text-xs text-muted-foreground">
          Concluída • {trip.country || 'Viagem incrível'}
        </p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-sm font-medium text-primary">
        R$ {(trip.finances?.total || 0).toLocaleString('pt-BR')}
      </p>
    </div>
  </motion.button>
);

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
    'Japão': '🇯🇵',
  };
  
  return emojiMap[destination] || '✈️';
}

function calculateProgress(checklist: any[]): number {
  if (!checklist || checklist.length === 0) return 0;
  const completed = checklist.filter(item => item.is_completed).length;
  return Math.round((completed / checklist.length) * 100);
}

export default Dashboard;
