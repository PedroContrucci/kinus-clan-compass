// DraftCockpit — Draft trip editing interface with horizontal calendar and activity cards

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { 
  ArrowLeft, Save, PlayCircle, Plus, Pencil, Trash2, 
  Plane, Hotel, MapPin, Sparkles, Brain, GripVertical,
  ChevronLeft, ChevronRight, AlertTriangle
} from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import kinuLogo from '@/assets/KINU_logo.png';

// Types
interface DraftActivity {
  id: string;
  name: string;
  type: 'flight' | 'hotel' | 'experience' | 'transport' | 'restaurant' | 'rest';
  estimatedCost: number;
  duration?: number;
  location?: string;
  source: 'kinu' | 'clan' | 'custom';
  isConfirmed?: boolean;
  notes?: string;
}

interface DraftDay {
  dayNumber: number;
  date: Date;
  activities: DraftActivity[];
}

interface DraftTrip {
  id: string;
  destination: string;
  origin: string;
  emoji: string;
  startDate: string;
  endDate: string;
  budget: number;
  travelers: number;
  priorities: string[];
  travelInterests?: string[];
  biologyAIEnabled?: boolean;
  hasDirectFlight?: boolean;
  connections?: string[];
  totalDays: number;
  days?: DraftDay[];
}

interface DraftCockpitProps {
  trip: DraftTrip;
  onSave: (trip: DraftTrip) => void;
  onActivate: (trip: DraftTrip) => void;
  onClose: () => void;
}

// Generate mock days with activities
function generateDraftDays(trip: DraftTrip): DraftDay[] {
  const startDate = new Date(trip.startDate);
  const endDate = new Date(trip.endDate);
  const totalDays = differenceInDays(endDate, startDate) + 1;
  
  const days: DraftDay[] = [];
  
  for (let i = 0; i < totalDays; i++) {
    const date = addDays(startDate, i);
    const activities: DraftActivity[] = [];
    
    // Day 1: Flight + Rest (if biology AI enabled)
    if (i === 0) {
      activities.push({
        id: `act-${i}-flight`,
        name: 'Voo de Ida',
        type: 'flight',
        estimatedCost: Math.round(trip.budget * 0.25),
        source: 'kinu',
        location: `${trip.origin} → ${trip.destination}`,
      });
      
      if (trip.biologyAIEnabled) {
        activities.push({
          id: `act-${i}-rest`,
          name: 'Descanso (Biology AI)',
          type: 'rest',
          estimatedCost: 0,
          source: 'kinu',
          notes: 'Dia de adaptação ao fuso horário',
        });
      }
    }
    
    // Day 2: Hotel check-in
    if (i === 1) {
      activities.push({
        id: `act-${i}-hotel`,
        name: 'Check-in Hotel',
        type: 'hotel',
        estimatedCost: Math.round(trip.budget * 0.20),
        source: 'kinu',
        location: 'Hotel sugerido pelo KINU',
        notes: `${totalDays - 1} diárias`,
      });
    }
    
    // Last day: Flight back
    if (i === totalDays - 1) {
      activities.push({
        id: `act-${i}-checkout`,
        name: 'Check-out Hotel',
        type: 'hotel',
        estimatedCost: 0,
        source: 'kinu',
      });
      
      activities.push({
        id: `act-${i}-return`,
        name: 'Voo de Volta',
        type: 'flight',
        estimatedCost: 0, // Already included in outbound
        source: 'kinu',
        location: `${trip.destination} → ${trip.origin}`,
      });
    }
    
    // Middle days: Experiences
    if (i > 1 && i < totalDays - 1) {
      const experienceNames = [
        'Passeio turístico',
        'Restaurante local',
        'Museu ou atração',
        'Compras',
        'Experiência cultural',
      ];
      
      const randomExp = experienceNames[i % experienceNames.length];
      activities.push({
        id: `act-${i}-exp`,
        name: randomExp,
        type: 'experience',
        estimatedCost: Math.round((trip.budget * 0.15) / (totalDays - 3)),
        source: 'kinu',
      });
    }
    
    days.push({
      dayNumber: i + 1,
      date,
      activities,
    });
  }
  
  return days;
}

const activityIcons: Record<string, React.ReactNode> = {
  flight: <Plane size={18} />,
  hotel: <Hotel size={18} />,
  experience: <Sparkles size={18} />,
  transport: <MapPin size={18} />,
  restaurant: <MapPin size={18} />,
  rest: <Brain size={18} />,
};

const activityColors: Record<string, string> = {
  flight: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  hotel: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  experience: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  transport: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  restaurant: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  rest: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
};

export const DraftCockpit = ({ trip, onSave, onActivate, onClose }: DraftCockpitProps) => {
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState(1);
  const [days, setDays] = useState<DraftDay[]>(() => 
    trip.days || generateDraftDays(trip)
  );
  const [addActivityModal, setAddActivityModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<{ dayIndex: number; activity: DraftActivity } | null>(null);

  const totalDays = days.length;
  const startDate = new Date(trip.startDate);
  
  // Calculate totals
  const { totalEstimated, trustZonePercent } = useMemo(() => {
    let total = 0;
    days.forEach(day => {
      day.activities.forEach(act => {
        total += act.estimatedCost;
      });
    });
    return {
      totalEstimated: total,
      trustZonePercent: trip.budget > 0 ? Math.round((total / trip.budget) * 100) : 0,
    };
  }, [days, trip.budget]);

  const currentDay = days[selectedDay - 1];
  
  const handleDayChange = (day: number) => {
    if (day >= 1 && day <= totalDays) {
      setSelectedDay(day);
    }
  };

  const handleRemoveActivity = (activityId: string) => {
    const updatedDays = days.map(day => ({
      ...day,
      activities: day.activities.filter(act => act.id !== activityId),
    }));
    setDays(updatedDays);
    toast({ title: "Atividade removida", description: "A atividade foi removida do roteiro." });
  };

  const handleSaveDraft = () => {
    const updatedTrip = { ...trip, days };
    onSave(updatedTrip);
    toast({ title: "Rascunho salvo! 📝", description: "Suas alterações foram salvas." });
  };

  const handleActivateTrip = () => {
    const updatedTrip = { ...trip, days, status: 'active' };
    onActivate(updatedTrip as any);
    toast({ title: "Viagem ativada! 🚀", description: "Sua viagem está pronta para acompanhamento." });
  };

  const getDayLabel = (dayNum: number) => {
    const date = addDays(startDate, dayNum - 1);
    return format(date, 'EEE', { locale: ptBR });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft size={20} className="text-foreground" />
            </button>
            <span className="text-2xl">{trip.emoji}</span>
            <div>
              <h1 className="font-bold text-lg font-['Outfit'] text-foreground">
                {trip.destination}
              </h1>
              <p className="text-xs text-muted-foreground">Rascunho</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSaveDraft}>
              <Save size={16} className="mr-1" />
              Salvar
            </Button>
            <Button size="sm" onClick={handleActivateTrip}>
              <PlayCircle size={16} className="mr-1" />
              Ativar
            </Button>
          </div>
        </div>

        {/* Trip Info Bar */}
        <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
          <span>📅 {format(startDate, 'dd MMM', { locale: ptBR })} - {format(new Date(trip.endDate), 'dd MMM yyyy', { locale: ptBR })}</span>
          <span>• {totalDays} dias</span>
          <span>• R$ {trip.budget.toLocaleString('pt-BR')}</span>
        </div>

        {/* Trust Zone */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Trust Zone</span>
            <span className={cn(
              'font-medium',
              trustZonePercent <= 100 ? 'text-emerald-500' : 'text-amber-500'
            )}>
              {trustZonePercent}%
            </span>
          </div>
          <Progress value={Math.min(trustZonePercent, 100)} className="h-2" />
        </div>
      </header>

      {/* Day Navigator - Horizontal scroll */}
      <div className="bg-card/50 border-b border-border px-4 py-3 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {Array.from({ length: totalDays }, (_, i) => i + 1).map((dayNum) => (
            <button
              key={dayNum}
              onClick={() => handleDayChange(dayNum)}
              className={cn(
                'flex flex-col items-center px-4 py-2 rounded-xl transition-all min-w-[60px]',
                selectedDay === dayNum
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              )}
            >
              <span className="text-xs font-medium uppercase">{getDayLabel(dayNum)}</span>
              <span className="text-lg font-bold">D{dayNum}</span>
              <span className="text-[10px]">{format(addDays(startDate, dayNum - 1), 'dd/MM')}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Day Content */}
      <main className="flex-1 px-4 py-6 pb-24 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Day Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-foreground font-['Outfit']">
                Dia {selectedDay} - {format(currentDay.date, 'dd/MM (EEEE)', { locale: ptBR })}
              </h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleDayChange(selectedDay - 1)}
                  disabled={selectedDay <= 1}
                  className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} />
                </button>
                <button 
                  onClick={() => handleDayChange(selectedDay + 1)}
                  disabled={selectedDay >= totalDays}
                  className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Activities */}
            <div className="space-y-3">
              {currentDay.activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma atividade neste dia</p>
                  <p className="text-sm">Adicione atividades abaixo</p>
                </div>
              ) : (
                currentDay.activities.map((activity) => (
                  <motion.div
                    key={activity.id}
                    layout
                    className={cn(
                      'p-4 rounded-xl border',
                      activityColors[activity.type]
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {activityIcons[activity.type]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground">{activity.name}</h3>
                          {activity.source === 'kinu' && (
                            <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] rounded-full">
                              KINU
                            </span>
                          )}
                          {activity.source === 'clan' && (
                            <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded-full">
                              Clã
                            </span>
                          )}
                        </div>
                        
                        {activity.location && (
                          <p className="text-sm text-muted-foreground mt-0.5">{activity.location}</p>
                        )}
                        {activity.notes && (
                          <p className="text-sm text-muted-foreground mt-0.5 italic">{activity.notes}</p>
                        )}
                        
                        {activity.estimatedCost > 0 && (
                          <p className="text-sm font-medium text-foreground mt-2">
                            Estimativa: R$ {activity.estimatedCost.toLocaleString('pt-BR')}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingActivity({ dayIndex: selectedDay - 1, activity })}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                        >
                          <Pencil size={14} className="text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleRemoveActivity(activity.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}

              {/* Add Activity Button */}
              <button
                onClick={() => setAddActivityModal(true)}
                className="w-full p-4 rounded-xl border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                <span>Adicionar atividade ao Dia {selectedDay}</span>
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Budget Summary Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-lg border-t border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total estimado</p>
            <p className="font-bold text-lg text-foreground font-['Outfit']">
              R$ {totalEstimated.toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Disponível</p>
            <p className={cn(
              'font-bold text-lg font-["Outfit"]',
              (trip.budget - totalEstimated) >= 0 ? 'text-emerald-500' : 'text-red-500'
            )}>
              R$ {(trip.budget - totalEstimated).toLocaleString('pt-BR')}
            </p>
          </div>
        </div>
      </footer>

      {/* Add Activity Modal */}
      <Dialog open={addActivityModal} onOpenChange={setAddActivityModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Atividade</DialogTitle>
            <DialogDescription>
              Escolha uma atividade para adicionar ao Dia {selectedDay}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <button
              onClick={() => {
                // Add custom activity logic
                setAddActivityModal(false);
                toast({ title: "Em breve!", description: "Busca de atividades do Clã em desenvolvimento." });
              }}
              className="w-full p-4 rounded-xl border border-border hover:border-primary/50 text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">👥</span>
                <div>
                  <p className="font-medium text-foreground">Buscar no Clã</p>
                  <p className="text-sm text-muted-foreground">Atividades recomendadas pela comunidade</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => {
                setAddActivityModal(false);
                toast({ title: "Em breve!", description: "Sugestões KINU em desenvolvimento." });
              }}
              className="w-full p-4 rounded-xl border border-border hover:border-primary/50 text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">✨</span>
                <div>
                  <p className="font-medium text-foreground">Sugestões KINU</p>
                  <p className="text-sm text-muted-foreground">Baseadas no seu estilo de viagem</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => {
                const newActivity: DraftActivity = {
                  id: `custom-${Date.now()}`,
                  name: 'Nova atividade',
                  type: 'experience',
                  estimatedCost: 0,
                  source: 'custom',
                };
                const updatedDays = [...days];
                updatedDays[selectedDay - 1].activities.push(newActivity);
                setDays(updatedDays);
                setAddActivityModal(false);
                toast({ title: "Atividade adicionada!", description: "Edite os detalhes da atividade." });
              }}
              className="w-full p-4 rounded-xl border border-border hover:border-primary/50 text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">➕</span>
                <div>
                  <p className="font-medium text-foreground">Criar personalizada</p>
                  <p className="text-sm text-muted-foreground">Adicione sua própria atividade</p>
                </div>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DraftCockpit;