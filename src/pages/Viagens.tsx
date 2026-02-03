import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, Check, X, Tag, Plus, ChevronRight, Plane, Building, MapPin, Utensils, Car, ShoppingBag, RotateCcw, Settings, Loader2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import ReverseAuctionModal from '@/components/ReverseAuctionModal';
import FlightCard from '@/components/FlightCard';
import HotelCard from '@/components/HotelCard';
import JetLagAlert from '@/components/JetLagAlert';
import FinOpsDashboard from '@/components/FinOpsDashboard';
import SmartPacking from '@/components/SmartPacking';
import { SavedTrip, TripActivity, ChecklistItem, ActivityStatus, Offer, contextualTips } from '@/types/trip';
import { useAuth } from '@/hooks/useAuth';
import kinuLogo from '@/assets/KINU_logo.png';

const Viagens = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, signOut } = useAuth();
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<SavedTrip | null>(null);
  const [activeTab, setActiveTab] = useState<'roteiro' | 'finops' | 'packing' | 'checklist'>('roteiro');
  const [selectedDay, setSelectedDay] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [auctionModal, setAuctionModal] = useState<{ isOpen: boolean; activityName: string; activityType: string; estimatedPrice?: number } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; activity: TripActivity; dayIndex: number; actIndex: number } | null>(null);
  const [confirmAmount, setConfirmAmount] = useState('');
  const [confirmLink, setConfirmLink] = useState('');
  const [manualExpenseModal, setManualExpenseModal] = useState(false);
  const [manualExpense, setManualExpense] = useState({ name: '', amount: 0, category: 'shopping' as keyof SavedTrip['finances']['categories'] });
  const [resetModal, setResetModal] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      // Load trips from localStorage (could be moved to database later)
      const savedTrips = JSON.parse(localStorage.getItem('kinu_trips') || '[]');
      setTrips(savedTrips);
    }
  }, [authLoading, user]);

  const handleDayChange = (day: number) => {
    if (day === selectedDay) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedDay(day);
      setIsTransitioning(false);
    }, 150);
  };

  const calculateProgress = (trip: SavedTrip) => {
    let total = 0;
    let confirmed = 0;
    trip.days.forEach((day) => {
      day.activities.forEach((act) => {
        total++;
        if (act.status === 'confirmed') confirmed++;
      });
    });
    return total > 0 ? Math.round((confirmed / total) * 100) : 0;
  };

  const getStatusIcon = (status: ActivityStatus) => {
    switch (status) {
      case 'confirmed':
        return <span className="text-[#10b981]">🟢</span>;
      case 'cancelled':
        return <span className="text-red-500">🔴</span>;
      case 'bidding':
        return <span className="text-[#eab308] animate-pulse">🟡</span>;
      default:
        return <span className="text-[#64748b]">⚪</span>;
    }
  };

  const handleConfirmActivity = () => {
    if (!confirmModal || !selectedTrip) return;

    const amount = parseFloat(confirmAmount) || 0;
    const updatedTrip = { ...selectedTrip };
    const activity = updatedTrip.days[confirmModal.dayIndex].activities[confirmModal.actIndex];
    
    activity.status = 'confirmed';
    activity.paidAmount = amount;
    activity.confirmationLink = confirmLink;

    // Update finances with new structure
    updatedTrip.finances.confirmed += amount;
    updatedTrip.finances.planned = Math.max(0, updatedTrip.finances.planned - amount);
    updatedTrip.finances.available = updatedTrip.finances.total - updatedTrip.finances.confirmed - updatedTrip.finances.bidding;

    // Update category
    const category = activity.category || 'passeio';
    const categoryMap: Record<string, keyof typeof updatedTrip.finances.categories> = {
      'voo': 'flights',
      'hotel': 'accommodation',
      'passeio': 'tours',
      'comida': 'food',
      'transporte': 'transport',
      'compras': 'shopping',
    };
    const financeCategory = categoryMap[category] || 'tours';
    updatedTrip.finances.categories[financeCategory].confirmed += amount;

    // Update progress
    updatedTrip.progress = calculateProgress(updatedTrip);
    
    // Update status if needed
    if (updatedTrip.status === 'draft') {
      updatedTrip.status = 'active';
    }

    // Save
    setSelectedTrip(updatedTrip);
    const updatedTrips = trips.map((t) => (t.id === updatedTrip.id ? updatedTrip : t));
    setTrips(updatedTrips);
    localStorage.setItem('kinu_trips', JSON.stringify(updatedTrips));

    // Show contextual tip
    const tip = contextualTips.confirmation[Math.floor(Math.random() * contextualTips.confirmation.length)];
    toast({
      title: "Atividade confirmada! ✅",
      description: tip,
    });

    setConfirmModal(null);
    setConfirmAmount('');
    setConfirmLink('');
  };

  const handleStartBidding = (activity: TripActivity, dayIndex: number, actIndex: number) => {
    if (!selectedTrip) return;

    const updatedTrip = { ...selectedTrip };
    const act = updatedTrip.days[dayIndex].activities[actIndex];
    act.status = 'bidding';

    // Update finances
    updatedTrip.finances.bidding += act.cost;
    updatedTrip.finances.planned = Math.max(0, updatedTrip.finances.planned - act.cost);

    setSelectedTrip(updatedTrip);
    const updatedTrips = trips.map((t) => (t.id === updatedTrip.id ? updatedTrip : t));
    setTrips(updatedTrips);
    localStorage.setItem('kinu_trips', JSON.stringify(updatedTrips));

    setAuctionModal({
      isOpen: true,
      activityName: activity.name,
      activityType: activity.type,
      estimatedPrice: activity.cost,
    });
  };

  const handleAcceptOffer = (offer: Offer) => {
    toast({
      title: "Oferta selecionada! 🎉",
      description: `Fechou a reserva? Confirme para atualizar o FinOps.`,
    });
  };

  const handleAddManualExpense = () => {
    if (!selectedTrip || !manualExpense.name || manualExpense.amount <= 0) return;

    const updatedTrip = { ...selectedTrip };
    const amount = manualExpense.amount;
    
    updatedTrip.finances.confirmed += amount;
    updatedTrip.finances.available = updatedTrip.finances.total - updatedTrip.finances.confirmed - updatedTrip.finances.bidding;
    
    // Update category
    updatedTrip.finances.categories[manualExpense.category].confirmed += amount;

    setSelectedTrip(updatedTrip);
    const updatedTrips = trips.map((t) => (t.id === updatedTrip.id ? updatedTrip : t));
    setTrips(updatedTrips);
    localStorage.setItem('kinu_trips', JSON.stringify(updatedTrips));

    toast({
      title: "Gasto adicionado! 💰",
      description: `${manualExpense.name}: R$ ${amount.toLocaleString()}`,
    });

    setManualExpenseModal(false);
    setManualExpense({ name: '', amount: 0, category: 'shopping' });
  };

  const handleToggleChecklist = (itemId: string) => {
    if (!selectedTrip) return;

    const updatedTrip = { ...selectedTrip };
    const item = updatedTrip.checklist.find((i) => i.id === itemId);
    if (item) item.checked = !item.checked;

    setSelectedTrip(updatedTrip);
    const updatedTrips = trips.map((t) => (t.id === updatedTrip.id ? updatedTrip : t));
    setTrips(updatedTrips);
    localStorage.setItem('kinu_trips', JSON.stringify(updatedTrips));
  };

  const handleResetJourney = () => {
    localStorage.removeItem('kinu_trips');
    setTrips([]);
    setSelectedTrip(null);
    setResetModal(false);
    toast({
      title: "Jornada reiniciada! 🌿",
      description: "Bora planejar de novo?",
    });
    navigate('/planejar');
  };


  const getTripDuration = (trip: SavedTrip): number => {
    if (!trip.startDate || !trip.endDate) return 7;
    return differenceInDays(new Date(trip.endDate), new Date(trip.startDate)) + 1;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'food': return '🍽️';
      case 'culture': return '🏛️';
      case 'transport': return '🚃';
      case 'photo': return '📸';
      case 'relax': return '🏨';
      default: return '📍';
    }
  };

  const getStatusLabel = (status: SavedTrip['status']) => {
    switch (status) {
      case 'draft': return { label: 'Rascunho', color: 'text-[#64748b]' };
      case 'active': return { label: 'Planejando', color: 'text-[#0ea5e9]' };
      case 'ongoing': return { label: 'Em Viagem', color: 'text-[#10b981]' };
      case 'completed': return { label: 'Concluída', color: 'text-[#8b5cf6]' };
      default: return { label: 'Rascunho', color: 'text-[#64748b]' };
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
      </div>
    );
  }

  if (!user) return null;

  // Trip Dashboard View
  if (selectedTrip) {
    const currentDay = selectedTrip.days.find((d) => d.day === selectedDay);
    const showJetLagAlert = selectedTrip.jetLagMode && selectedDay === 1;

    return (
      <div className="min-h-screen bg-[#0f172a] pb-20">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#0f172a]/80 backdrop-blur-lg border-b border-[#334155] px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => setSelectedTrip(null)}
              className="p-2 hover:bg-[#1e293b] rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-[#f8fafc]" />
            </button>
            <div className="flex-1">
              <h1 className="font-bold text-lg font-['Outfit'] text-[#f8fafc]">
                {selectedTrip.emoji} {selectedTrip.destination}, {selectedTrip.country}
              </h1>
              <p className="text-sm text-[#94a3b8]">
                {selectedTrip.startDate && format(new Date(selectedTrip.startDate), "dd MMM", { locale: ptBR })} - {selectedTrip.endDate && format(new Date(selectedTrip.endDate), "dd MMM yyyy", { locale: ptBR })} • R$ {selectedTrip.budget.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { id: 'roteiro' as const, label: '📋 Roteiro' },
              { id: 'finops' as const, label: '💰 FinOps' },
              { id: 'packing' as const, label: '🧳 Packing' },
              { id: 'checklist' as const, label: '✅ Checklist' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#10b981] text-white'
                    : 'bg-[#1e293b] text-[#94a3b8] hover:text-[#f8fafc]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        <main className="px-4 py-6">
          {/* Roteiro Tab */}
          {activeTab === 'roteiro' && (
            <div className="animate-fade-in">
              {/* Fixed Flight Card - Outbound */}
              {selectedTrip.flights?.outbound && (
                <FlightCard
                  flight={selectedTrip.flights.outbound}
                  type="outbound"
                  onOpenAuction={() => setAuctionModal({
                    isOpen: true,
                    activityName: 'Voo de Ida',
                    activityType: 'flight',
                    estimatedPrice: selectedTrip.flights?.outbound?.price,
                  })}
                />
              )}

              {/* Fixed Hotel Card */}
              {selectedTrip.accommodation && (
                <HotelCard
                  hotel={selectedTrip.accommodation}
                  onOpenAuction={() => setAuctionModal({
                    isOpen: true,
                    activityName: selectedTrip.accommodation?.name || 'Hotel',
                    activityType: 'hotel',
                    estimatedPrice: selectedTrip.accommodation?.totalPrice,
                  })}
                />
              )}

              {/* Day Timeline */}
              <div className="mb-6">
                <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                  {selectedTrip.days.map((day) => (
                    <button
                      key={day.day}
                      onClick={() => handleDayChange(day.day)}
                      className={`flex-shrink-0 p-4 rounded-2xl transition-all duration-200 border ${
                        selectedDay === day.day
                          ? 'bg-[#1e293b] border-[#10b981] ring-2 ring-[#10b981]/30'
                          : 'bg-[#1e293b] border-[#334155] hover:border-[#10b981]/50'
                      }`}
                    >
                      <div className="text-2xl mb-1">{day.icon}</div>
                      <div className="font-semibold text-[#f8fafc] font-['Outfit']">Dia {day.day}</div>
                      <div className="text-xs text-[#94a3b8] max-w-[80px] truncate">{day.title}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Jet Lag Alert for Day 1 */}
              {showJetLagAlert && selectedTrip.timezone && (
                <JetLagAlert
                  destination={selectedTrip.destination}
                  timezoneDiff={selectedTrip.timezone.diff}
                />
              )}

              {/* Day Activities */}
              {currentDay && (
                <div
                  className={`bg-[#1e293b] border border-[#334155] rounded-2xl p-4 transition-opacity duration-300 ${
                    isTransitioning ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  <h3 className="font-semibold text-lg mb-4 text-[#f8fafc] font-['Outfit']">
                    Dia {currentDay.day}: {currentDay.title}
                  </h3>
                  <div className="space-y-4">
                    {currentDay.activities.map((activity, actIndex) => {
                      const dayIndex = selectedTrip.days.findIndex((d) => d.day === currentDay.day);
                      
                      return (
                        <div key={activity.id} className={`flex gap-3 ${
                          activity.status === 'confirmed' ? 'bg-[#10b981]/10 -mx-2 px-2 py-2 rounded-xl border border-[#10b981]/30' :
                          activity.status === 'bidding' ? 'bg-[#eab308]/10 -mx-2 px-2 py-2 rounded-xl border border-[#eab308]/30' :
                          activity.status === 'cancelled' ? 'opacity-50' : ''
                        }`}>
                          <div className="flex flex-col items-center">
                            <div className="text-xl">{getActivityIcon(activity.type)}</div>
                            {actIndex < currentDay.activities.length - 1 && (
                              <div className="w-0.5 flex-1 bg-[#334155] mt-2" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2 mb-1">
                              {getStatusIcon(activity.status)}
                              <span className="text-sm text-[#94a3b8]">
                                <Clock size={14} className="inline mr-1" />
                                {activity.time}
                              </span>
                              {activity.status === 'confirmed' && activity.paidAmount && (
                                <span className="text-xs bg-[#10b981] text-white px-2 py-0.5 rounded-full">
                                  R$ {activity.paidAmount.toLocaleString()}
                                </span>
                              )}
                              {activity.jetLagFriendly && (
                                <span className="text-xs bg-[#eab308]/20 text-[#eab308] px-2 py-0.5 rounded-full">
                                  🧘 Jet Lag Friendly
                                </span>
                              )}
                            </div>
                            <h4 className="font-medium text-[#f8fafc] font-['Outfit']">{activity.name}</h4>
                            <p className="text-sm text-[#94a3b8]">{activity.description}</p>

                            {/* Actions */}
                            {activity.status !== 'confirmed' && activity.status !== 'cancelled' && (
                              <div className="flex gap-2 mt-3 flex-wrap">
                                <button
                                  onClick={() => handleStartBidding(activity, dayIndex, actIndex)}
                                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#eab308]/10 text-[#eab308] rounded-lg border border-[#eab308]/30 hover:bg-[#eab308]/20"
                                >
                                  <Tag size={12} />
                                  Leilão
                                </button>
                                <button
                                  onClick={() => setConfirmModal({ isOpen: true, activity, dayIndex, actIndex })}
                                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#10b981]/10 text-[#10b981] rounded-lg border border-[#10b981]/30 hover:bg-[#10b981]/20"
                                >
                                  <Check size={12} />
                                  Confirmar
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FinOps Tab */}
          {activeTab === 'finops' && selectedTrip && (
            <FinOpsDashboard
              finances={selectedTrip.finances}
              destination={selectedTrip.destination}
            />
          )}

          {/* Packing Tab */}
          {activeTab === 'packing' && selectedTrip && (
            <SmartPacking
              tripId={selectedTrip.id}
              destination={selectedTrip.destination}
              duration={getTripDuration(selectedTrip)}
              packingData={null}
              onUpdate={() => {}}
            />
          )}

          {/* Checklist Tab */}
          {activeTab === 'checklist' && selectedTrip && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#f8fafc] font-['Outfit']">
                  ✅ Checklist da Viagem
                </h2>
                <button
                  onClick={() => setResetModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-500/10 text-red-400 rounded-lg border border-red-500/30 hover:bg-red-500/20"
                >
                  <RotateCcw size={12} />
                  Reset
                </button>
              </div>

              {selectedTrip.checklist.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleToggleChecklist(item.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    item.checked
                      ? 'bg-[#10b981]/10 border-[#10b981]/30'
                      : 'bg-[#1e293b] border-[#334155] hover:border-[#10b981]/50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    item.checked ? 'border-[#10b981] bg-[#10b981]' : 'border-[#64748b]'
                  }`}>
                    {item.checked && <Check size={14} className="text-white" />}
                  </div>
                  <span className={`flex-1 text-left font-['Plus_Jakarta_Sans'] ${
                    item.checked ? 'text-[#94a3b8] line-through' : 'text-[#f8fafc]'
                  }`}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </main>

        {/* Bottom Nav */}
        <BottomNav currentPath={location.pathname} />

        {/* Confirm Modal */}
        <Dialog open={confirmModal?.isOpen} onOpenChange={() => setConfirmModal(null)}>
          <DialogContent className="bg-[#1e293b] border-[#334155] text-[#f8fafc]">
            <DialogHeader>
              <DialogTitle className="font-['Outfit']">Confirmar Reserva</DialogTitle>
              <DialogDescription className="text-[#94a3b8]">
                {confirmModal?.activity.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm text-[#94a3b8]">Valor pago (R$)</label>
                <input
                  type="number"
                  value={confirmAmount}
                  onChange={(e) => setConfirmAmount(e.target.value)}
                  placeholder={confirmModal?.activity.cost.toString()}
                  className="w-full mt-1 px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc]"
                />
              </div>
              <div>
                <label className="text-sm text-[#94a3b8]">Link da confirmação (opcional)</label>
                <input
                  type="url"
                  value={confirmLink}
                  onChange={(e) => setConfirmLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full mt-1 px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc]"
                />
              </div>
              <button
                onClick={handleConfirmActivity}
                className="w-full py-3 bg-[#10b981] text-white rounded-lg font-semibold"
              >
                Confirmar
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Manual Expense Modal */}
        <Dialog open={manualExpenseModal} onOpenChange={setManualExpenseModal}>
          <DialogContent className="bg-[#1e293b] border-[#334155] text-[#f8fafc]">
            <DialogHeader>
              <DialogTitle className="font-['Outfit']">Adicionar Gasto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm text-[#94a3b8]">Descrição</label>
                <input
                  type="text"
                  value={manualExpense.name}
                  onChange={(e) => setManualExpense({ ...manualExpense, name: e.target.value })}
                  placeholder="Souvenir, taxi..."
                  className="w-full mt-1 px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc]"
                />
              </div>
              <div>
                <label className="text-sm text-[#94a3b8]">Valor (R$)</label>
                <input
                  type="number"
                  value={manualExpense.amount || ''}
                  onChange={(e) => setManualExpense({ ...manualExpense, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full mt-1 px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc]"
                />
              </div>
              <div>
                <label className="text-sm text-[#94a3b8]">Categoria</label>
                <select
                  value={manualExpense.category}
                  onChange={(e) => setManualExpense({ ...manualExpense, category: e.target.value as any })}
                  className="w-full mt-1 px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc]"
                >
                  <option value="shopping">🛍️ Compras</option>
                  <option value="food">🍽️ Alimentação</option>
                  <option value="transport">🚗 Transporte</option>
                  <option value="tours">🎯 Passeios</option>
                </select>
              </div>
              <button
                onClick={handleAddManualExpense}
                className="w-full py-3 bg-[#10b981] text-white rounded-lg font-semibold"
              >
                Adicionar
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reset Modal */}
        <Dialog open={resetModal} onOpenChange={setResetModal}>
          <DialogContent className="bg-[#1e293b] border-[#334155] text-[#f8fafc]">
            <DialogHeader>
              <DialogTitle className="font-['Outfit']">Reiniciar Jornada?</DialogTitle>
              <DialogDescription className="text-[#94a3b8]">
                Isso vai apagar todas as suas viagens salvas. Tem certeza?
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setResetModal(false)}
                className="flex-1 py-3 bg-[#334155] text-[#f8fafc] rounded-lg font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetJourney}
                className="flex-1 py-3 bg-red-500 text-white rounded-lg font-semibold"
              >
                Reiniciar
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Auction Modal */}
        {auctionModal && (
          <ReverseAuctionModal
            isOpen={auctionModal.isOpen}
            onClose={() => setAuctionModal(null)}
            activityName={auctionModal.activityName}
            activityType={auctionModal.activityType}
            estimatedPrice={auctionModal.estimatedPrice}
            onAcceptOffer={handleAcceptOffer}
          />
        )}

        <Toaster />
      </div>
    );
  }

  // Trips List View
  return (
    <div className="min-h-screen bg-[#0f172a] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0f172a]/80 backdrop-blur-lg border-b border-[#334155] px-4 py-3">
        <div className="flex items-center gap-2">
          <img src={kinuLogo} alt="KINU" className="h-8 w-8 object-contain" />
          <span className="font-bold text-xl font-['Outfit'] text-[#f8fafc]">KINU</span>
        </div>
      </header>

      <main className="px-4 py-6">
        <h1 className="text-2xl font-bold mb-2 font-['Outfit'] text-[#f8fafc]">Minhas Viagens 💼</h1>
        <p className="text-[#94a3b8] mb-6 font-['Plus_Jakarta_Sans']">
          {trips.length === 0 ? 'Nenhuma viagem salva ainda.' : `${trips.length} viagem(ns) planejada(s)`}
        </p>

        {trips.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🧭</div>
            <p className="text-[#94a3b8] mb-6 font-['Plus_Jakarta_Sans']">
              Bora planejar sua próxima aventura?
            </p>
            <button
              onClick={() => navigate('/planejar')}
              className="px-6 py-3 bg-[#10b981] text-white rounded-xl font-semibold font-['Outfit']"
            >
              Criar Roteiro
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {trips.map((trip) => {
              const statusInfo = getStatusLabel(trip.status);
              return (
                <button
                  key={trip.id}
                  onClick={() => setSelectedTrip(trip)}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-2xl p-4 text-left hover:border-[#10b981]/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{trip.emoji}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-[#f8fafc] font-['Outfit']">
                          {trip.destination}, {trip.country}
                        </h3>
                        <span className={`text-xs ${statusInfo.color}`}>• {statusInfo.label}</span>
                      </div>
                      <p className="text-sm text-[#94a3b8] mb-2">
                        {trip.startDate && format(new Date(trip.startDate), "dd MMM", { locale: ptBR })} - {trip.endDate && format(new Date(trip.endDate), "dd MMM", { locale: ptBR })} • R$ {trip.budget.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-2">
                        <Progress value={trip.progress} className="h-2 flex-1" />
                        <span className="text-xs text-[#94a3b8]">{trip.progress}%</span>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-[#64748b]" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <BottomNav currentPath={location.pathname} />
      <Toaster />
    </div>
  );
};

const BottomNav = ({ currentPath }: { currentPath: string }) => {
  const navigate = useNavigate();
  
  const navItems = [
    { path: '/cla', icon: '🌿', label: 'Clã' },
    { path: '/planejar', icon: '🧭', label: 'Planejar' },
    { path: '/viagens', icon: '💼', label: 'Viagens' },
    { path: '/conta', icon: '👤', label: 'Conta' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1e293b]/90 backdrop-blur-lg border-t border-[#334155] px-4 py-3">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 ${isActive ? 'text-[#10b981]' : 'text-[#94a3b8]'}`}
            >
              {isActive && <div className="w-8 h-0.5 bg-[#10b981] rounded-full mb-1" />}
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-['Plus_Jakarta_Sans']">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Viagens;
