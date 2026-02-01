import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, Check, X, Tag, Plus, ChevronRight, Plane, Building, MapPin, Utensils, Car } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import ReverseAuctionModal from '@/components/ReverseAuctionModal';
import { SavedTrip, TripActivity, ChecklistItem } from '@/types/trip';
import kinuLogo from '@/assets/KINU_logo.png';

const Viagens = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<SavedTrip | null>(null);
  const [activeTab, setActiveTab] = useState<'roteiro' | 'finops' | 'checklist'>('roteiro');
  const [selectedDay, setSelectedDay] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [auctionModal, setAuctionModal] = useState<{ isOpen: boolean; activityName: string; activityType: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; activity: TripActivity; dayIndex: number; actIndex: number } | null>(null);
  const [confirmAmount, setConfirmAmount] = useState('');
  const [confirmLink, setConfirmLink] = useState('');
  const [manualExpenseModal, setManualExpenseModal] = useState(false);
  const [manualExpense, setManualExpense] = useState({ name: '', amount: 0, category: 'outros' });

  useEffect(() => {
    const savedUser = localStorage.getItem('kinu_user');
    if (!savedUser) {
      navigate('/');
      return;
    }
    setUser(JSON.parse(savedUser));

    // Load trips
    const savedTrips = JSON.parse(localStorage.getItem('kinu_trips') || '[]');
    setTrips(savedTrips);
  }, [navigate]);

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

  const getStatusIcon = (status: TripActivity['status']) => {
    switch (status) {
      case 'confirmed':
        return <span className="text-[#10b981]">🟢</span>;
      case 'cancelled':
        return <span className="text-red-500">🔴</span>;
      default:
        return <span className="text-[#eab308]">🟡</span>;
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

    // Update finances
    updatedTrip.finances.confirmed += amount;
    updatedTrip.finances.pending = Math.max(0, updatedTrip.finances.pending - amount);
    updatedTrip.finances.available = updatedTrip.budget - updatedTrip.finances.confirmed;

    // Update category
    const category = activity.category || 'outros';
    if (category === 'voo') updatedTrip.finances.byCategory.voos += amount;
    else if (category === 'hotel') updatedTrip.finances.byCategory.hoteis += amount;
    else if (category === 'passeio') updatedTrip.finances.byCategory.passeios += amount;
    else if (category === 'comida') updatedTrip.finances.byCategory.comida += amount;
    else updatedTrip.finances.byCategory.outros += amount;

    // Update progress
    updatedTrip.progress = calculateProgress(updatedTrip);

    // Save
    setSelectedTrip(updatedTrip);
    const updatedTrips = trips.map((t) => (t.id === updatedTrip.id ? updatedTrip : t));
    setTrips(updatedTrips);
    localStorage.setItem('kinu_trips', JSON.stringify(updatedTrips));

    toast({
      title: "Atividade confirmada! ✅",
      description: `R$ ${amount.toLocaleString()} registrado.`,
    });

    setConfirmModal(null);
    setConfirmAmount('');
    setConfirmLink('');
  };

  const handleAddManualExpense = () => {
    if (!selectedTrip || !manualExpense.name || manualExpense.amount <= 0) return;

    const updatedTrip = { ...selectedTrip };
    const amount = manualExpense.amount;
    
    updatedTrip.finances.confirmed += amount;
    updatedTrip.finances.available = updatedTrip.budget - updatedTrip.finances.confirmed;
    
    const expenseCategory = manualExpense.category as string;
    if (expenseCategory === 'voos') updatedTrip.finances.byCategory.voos += amount;
    else if (expenseCategory === 'hoteis') updatedTrip.finances.byCategory.hoteis += amount;
    else if (expenseCategory === 'passeios') updatedTrip.finances.byCategory.passeios += amount;
    else if (expenseCategory === 'comida') updatedTrip.finances.byCategory.comida += amount;
    else updatedTrip.finances.byCategory.outros += amount;

    setSelectedTrip(updatedTrip);
    const updatedTrips = trips.map((t) => (t.id === updatedTrip.id ? updatedTrip : t));
    setTrips(updatedTrips);
    localStorage.setItem('kinu_trips', JSON.stringify(updatedTrips));

    toast({
      title: "Gasto adicionado! 💰",
      description: `${manualExpense.name}: R$ ${amount.toLocaleString()}`,
    });

    setManualExpenseModal(false);
    setManualExpense({ name: '', amount: 0, category: 'outros' });
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'voos': return <Plane size={16} />;
      case 'hoteis': return <Building size={16} />;
      case 'passeios': return <MapPin size={16} />;
      case 'comida': return <Utensils size={16} />;
      default: return <Car size={16} />;
    }
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

  if (!user) return null;

  // Trip Dashboard View
  if (selectedTrip) {
    const currentDay = selectedTrip.days.find((d) => d.day === selectedDay);
    const totalBudget = selectedTrip.budget;
    const confirmedAmount = selectedTrip.finances.confirmed;
    const pendingAmount = selectedTrip.finances.pending;
    const availableAmount = selectedTrip.finances.available;

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
          <div className="flex gap-2">
            {[
              { id: 'roteiro' as const, label: '📋 Roteiro' },
              { id: 'finops' as const, label: '💰 FinOps' },
              { id: 'checklist' as const, label: '🧳 Checklist' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
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
                            </div>
                            <h4 className="font-medium text-[#f8fafc] font-['Outfit']">{activity.name}</h4>
                            <p className="text-sm text-[#94a3b8]">{activity.description}</p>

                            {/* Actions */}
                            {activity.status !== 'confirmed' && (
                              <div className="flex gap-2 mt-3 flex-wrap">
                                <button
                                  onClick={() => setAuctionModal({ isOpen: true, activityName: activity.name, activityType: activity.type })}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-[#0f172a] border border-[#334155] rounded-lg text-xs text-[#f8fafc] hover:border-[#10b981] transition-colors"
                                >
                                  <Tag size={12} />
                                  Ver Ofertas
                                </button>
                                <button
                                  onClick={() => setConfirmModal({ isOpen: true, activity, dayIndex, actIndex })}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-[#10b981] rounded-lg text-xs text-white hover:bg-[#10b981]/80 transition-colors"
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
          {activeTab === 'finops' && (
            <div className="animate-fade-in space-y-6">
              {/* Summary Cards */}
              <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-[#94a3b8]">💰 Orçamento Total</p>
                    <p className="text-2xl font-bold text-[#f8fafc] font-['Outfit']">R$ {totalBudget.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#94a3b8]">✅ Confirmado</p>
                    <p className="text-2xl font-bold text-[#10b981] font-['Outfit']">R$ {confirmedAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#94a3b8]">🟡 Pendente</p>
                    <p className="text-2xl font-bold text-[#eab308] font-['Outfit']">R$ {pendingAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#94a3b8]">💚 Disponível</p>
                    <p className="text-2xl font-bold text-[#0ea5e9] font-['Outfit']">R$ {availableAmount.toLocaleString()}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#94a3b8]">Utilizado</span>
                    <span className="text-[#f8fafc]">{Math.round((confirmedAmount / totalBudget) * 100)}%</span>
                  </div>
                  <Progress value={(confirmedAmount / totalBudget) * 100} className="h-2 bg-[#334155]" />
                </div>
              </div>

              {/* By Category */}
              <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-4">
                <h3 className="font-semibold text-[#f8fafc] mb-4 font-['Outfit']">Por Categoria</h3>
                <div className="space-y-4">
                  {[
                    { key: 'voos', label: 'Voos', icon: Plane, amount: selectedTrip.finances.byCategory.voos },
                    { key: 'hoteis', label: 'Hotéis', icon: Building, amount: selectedTrip.finances.byCategory.hoteis },
                    { key: 'passeios', label: 'Passeios', icon: MapPin, amount: selectedTrip.finances.byCategory.passeios },
                    { key: 'comida', label: 'Comida', icon: Utensils, amount: selectedTrip.finances.byCategory.comida },
                    { key: 'outros', label: 'Outros', icon: Car, amount: selectedTrip.finances.byCategory.outros },
                  ].map((cat) => {
                    const percentage = totalBudget > 0 ? (cat.amount / totalBudget) * 100 : 0;
                    return (
                      <div key={cat.key}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 text-[#f8fafc]">
                            <cat.icon size={16} className="text-[#94a3b8]" />
                            <span className="font-['Outfit']">{cat.label}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[#f8fafc] font-medium">R$ {cat.amount.toLocaleString()}</span>
                            <span className="text-[#94a3b8] text-sm ml-2">{percentage.toFixed(0)}%</span>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2 bg-[#334155]" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add Manual Expense */}
              <button
                onClick={() => setManualExpenseModal(true)}
                className="w-full py-4 bg-[#1e293b] border border-dashed border-[#334155] rounded-2xl text-[#94a3b8] font-['Outfit'] flex items-center justify-center gap-2 hover:border-[#10b981] hover:text-[#f8fafc] transition-colors"
              >
                <Plus size={20} />
                Adicionar Gasto Manual
              </button>
            </div>
          )}

          {/* Checklist Tab */}
          {activeTab === 'checklist' && (
            <div className="animate-fade-in space-y-6">
              {['documentos', 'reservas', 'packing', 'pre-viagem'].map((category) => {
                const items = selectedTrip.checklist.filter((i) => i.category === category);
                const categoryLabels: Record<string, string> = {
                  documentos: '📄 Documentos',
                  reservas: '🎫 Reservas',
                  packing: '🧳 Packing',
                  'pre-viagem': '✈️ Pré-Viagem',
                };
                
                return (
                  <div key={category} className="bg-[#1e293b] border border-[#334155] rounded-2xl p-4">
                    <h3 className="font-semibold text-[#f8fafc] mb-3 font-['Outfit']">{categoryLabels[category]}</h3>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleToggleChecklist(item.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                            item.checked ? 'bg-[#10b981]/10' : 'bg-[#0f172a]'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            item.checked ? 'bg-[#10b981] border-[#10b981]' : 'border-[#334155]'
                          }`}>
                            {item.checked && <Check size={14} className="text-white" />}
                          </div>
                          <span className={`text-sm font-['Plus_Jakarta_Sans'] ${
                            item.checked ? 'text-[#94a3b8] line-through' : 'text-[#f8fafc]'
                          }`}>
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Bottom Nav */}
        <BottomNav currentPath={location.pathname} />

        {/* Reverse Auction Modal */}
        {auctionModal && (
          <ReverseAuctionModal
            isOpen={auctionModal.isOpen}
            onClose={() => setAuctionModal(null)}
            activityName={auctionModal.activityName}
            activityType={auctionModal.activityType}
            destination={selectedTrip.destination}
          />
        )}

        {/* Confirm Activity Modal */}
        <Dialog open={confirmModal?.isOpen || false} onOpenChange={() => setConfirmModal(null)}>
          <DialogContent className="bg-[#1e293b] border-[#334155] text-[#f8fafc] max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="font-['Outfit']">✅ Confirmar Atividade</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-[#94a3b8] text-sm">{confirmModal?.activity.name}</p>
              <div>
                <label className="block text-sm text-[#94a3b8] mb-2">Valor pago (R$)</label>
                <input
                  type="number"
                  value={confirmAmount}
                  onChange={(e) => setConfirmAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-xl text-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#94a3b8] mb-2">Link/Confirmação (opcional)</label>
                <input
                  type="text"
                  value={confirmLink}
                  onChange={(e) => setConfirmLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-xl text-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                />
              </div>
              <button
                onClick={handleConfirmActivity}
                className="w-full py-3 bg-gradient-to-r from-[#10b981] to-[#0ea5e9] text-white rounded-xl font-semibold"
              >
                Confirmar
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Manual Expense Modal */}
        <Dialog open={manualExpenseModal} onOpenChange={setManualExpenseModal}>
          <DialogContent className="bg-[#1e293b] border-[#334155] text-[#f8fafc] max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="font-['Outfit']">💰 Adicionar Gasto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#94a3b8] mb-2">Descrição</label>
                <input
                  type="text"
                  value={manualExpense.name}
                  onChange={(e) => setManualExpense((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Uber do aeroporto"
                  className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-xl text-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#94a3b8] mb-2">Valor (R$)</label>
                <input
                  type="number"
                  value={manualExpense.amount || ''}
                  onChange={(e) => setManualExpense((prev) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-xl text-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#94a3b8] mb-2">Categoria</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'voos', label: '✈️ Voo' },
                    { id: 'hoteis', label: '🏨 Hotel' },
                    { id: 'passeios', label: '🎯 Passeio' },
                    { id: 'comida', label: '🍽️ Comida' },
                    { id: 'outros', label: '📦 Outro' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setManualExpense((prev) => ({ ...prev, category: cat.id as any }))}
                      className={`py-2 px-3 rounded-lg text-xs transition-colors ${
                        manualExpense.category === cat.id
                          ? 'bg-[#10b981] text-white'
                          : 'bg-[#0f172a] text-[#94a3b8] border border-[#334155]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleAddManualExpense}
                disabled={!manualExpense.name || manualExpense.amount <= 0}
                className="w-full py-3 bg-gradient-to-r from-[#10b981] to-[#0ea5e9] text-white rounded-xl font-semibold disabled:opacity-50"
              >
                Adicionar
              </button>
            </div>
          </DialogContent>
        </Dialog>

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

      {/* Content */}
      <main className="px-4 py-6">
        <h1 className="text-2xl font-bold mb-2 font-['Outfit'] text-[#f8fafc]">Minhas Viagens 💼</h1>
        <p className="text-[#94a3b8] mb-6 font-['Plus_Jakarta_Sans']">Teus roteiros salvos aparecem aqui.</p>

        {trips.length > 0 ? (
          <div className="space-y-4">
            {trips.map((trip) => {
              const progress = calculateProgress(trip);
              const totalActivities = trip.days.reduce((acc, day) => acc + day.activities.length, 0);
              const confirmedActivities = trip.days.reduce((acc, day) => acc + day.activities.filter((a) => a.status === 'confirmed').length, 0);

              return (
                <button
                  key={trip.id}
                  onClick={() => {
                    setSelectedTrip(trip);
                    setSelectedDay(1);
                    setActiveTab('roteiro');
                  }}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-2xl p-4 text-left hover:border-[#10b981]/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg text-[#f8fafc] font-['Outfit']">
                        {trip.emoji} {trip.destination}, {trip.country}
                      </h3>
                      <p className="text-sm text-[#94a3b8]">
                        {trip.startDate && format(new Date(trip.startDate), "dd MMM", { locale: ptBR })} - {trip.endDate && format(new Date(trip.endDate), "dd MMM yyyy", { locale: ptBR })} • {trip.days.length} dias
                      </p>
                    </div>
                    <ChevronRight size={20} className="text-[#94a3b8]" />
                  </div>
                  <p className="text-sm text-[#94a3b8] mb-3">Orçamento: R$ {trip.budget.toLocaleString()}</p>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#94a3b8]">Progresso</span>
                      <span className="text-[#f8fafc]">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-[#334155]" />
                  </div>
                  <p className="text-xs text-[#94a3b8]">{confirmedActivities} de {totalActivities} itens fechados</p>
                </button>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl mb-4">🗺️</div>
            <p className="text-[#f8fafc] font-['Outfit'] text-lg mb-2">Nenhuma viagem salva ainda</p>
            <p className="text-[#94a3b8] text-center mb-6">Cria teu primeiro roteiro no Nexo!</p>
            <button
              onClick={() => navigate('/planejar')}
              className="px-6 py-3 bg-gradient-to-r from-[#10b981] to-[#0ea5e9] text-white rounded-xl font-semibold font-['Outfit']"
            >
              🧭 Ir para O Nexo
            </button>
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
