import { Plane, Building, MapPin, Utensils, Car, ShoppingBag } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { TripFinances, CategoryBudget, ActivityStatus } from '@/types/trip';

interface FinOpsDashboardProps {
  finances: TripFinances;
  destination: string;
}

interface CategoryInfo {
  key: keyof TripFinances['categories'];
  label: string;
  icon: React.ElementType;
  budget: CategoryBudget;
  allocatedBudget: number;
}

const getStatusLabel = (budget: CategoryBudget): { label: string; color: string } => {
  if (budget.confirmed > 0 && budget.bidding === 0 && budget.planned === 0) {
    return { label: '🟢 Confirmado', color: 'text-[#10b981]' };
  }
  if (budget.bidding > 0) {
    return { label: `🟡 ${Math.ceil(budget.bidding / 100)} em leilão`, color: 'text-[#eab308]' };
  }
  return { label: '⚪ Estimativa', color: 'text-[#64748b]' };
};

const FinOpsDashboard = ({ finances, destination }: FinOpsDashboardProps) => {
  // Default empty budget for null safety
  const emptyBudget: CategoryBudget = { confirmed: 0, bidding: 0, planned: 0 };
  
  // Safe destructuring with defaults
  const total = finances?.total ?? 0;
  const confirmed = finances?.confirmed ?? 0;
  const bidding = finances?.bidding ?? 0;
  const planned = finances?.planned ?? 0;
  const available = finances?.available ?? 0;
  const categories = finances?.categories ?? {} as TripFinances['categories'];

  // Calculate allocated budgets (example allocation based on typical trip)
  const categoryAllocations: Record<keyof TripFinances['categories'], number> = {
    flights: Math.round(total * 0.38),
    accommodation: Math.round(total * 0.30),
    tours: Math.round(total * 0.14),
    food: Math.round(total * 0.10),
    transport: Math.round(total * 0.05),
    shopping: Math.round(total * 0.03),
  };

  const categoryList: CategoryInfo[] = [
    { key: 'flights', label: 'Voos', icon: Plane, budget: categories.flights ?? emptyBudget, allocatedBudget: categoryAllocations.flights },
    { key: 'accommodation', label: 'Hospedagem', icon: Building, budget: categories.accommodation ?? emptyBudget, allocatedBudget: categoryAllocations.accommodation },
    { key: 'tours', label: 'Passeios & Tours', icon: MapPin, budget: categories.tours ?? emptyBudget, allocatedBudget: categoryAllocations.tours },
    { key: 'food', label: 'Alimentação', icon: Utensils, budget: categories.food ?? emptyBudget, allocatedBudget: categoryAllocations.food },
    { key: 'transport', label: 'Transporte Local', icon: Car, budget: categories.transport ?? emptyBudget, allocatedBudget: categoryAllocations.transport },
    { key: 'shopping', label: 'Compras & Extras', icon: ShoppingBag, budget: categories.shopping ?? emptyBudget, allocatedBudget: categoryAllocations.shopping },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Summary */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-4">
        <h3 className="font-semibold text-[#f8fafc] mb-4 font-['Outfit'] flex items-center gap-2">
          💰 Controle Financeiro — {destination}
        </h3>

        {/* Total Budget */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#94a3b8]">Orçamento Total</span>
            <span className="text-2xl font-bold text-[#f8fafc] font-['Outfit']">R$ {total.toLocaleString()}</span>
          </div>
          <div className="h-3 bg-[#334155] rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-[#10b981] transition-all"
              style={{ width: `${(confirmed / total) * 100}%` }}
            />
            <div 
              className="h-full bg-[#eab308] transition-all"
              style={{ width: `${(bidding / total) * 100}%` }}
            />
            <div 
              className="h-full bg-[#64748b] transition-all"
              style={{ width: `${(planned / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0f172a] rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-[#10b981]" />
              <span className="text-xs text-[#94a3b8]">Confirmado</span>
            </div>
            <p className="text-lg font-bold text-[#10b981]">R$ {confirmed.toLocaleString()}</p>
            <p className="text-xs text-[#94a3b8]">{Math.round((confirmed / total) * 100)}%</p>
          </div>
          <div className="bg-[#0f172a] rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-[#eab308] animate-pulse" />
              <span className="text-xs text-[#94a3b8]">Em Leilão</span>
            </div>
            <p className="text-lg font-bold text-[#eab308]">R$ {bidding.toLocaleString()}</p>
            <p className="text-xs text-[#94a3b8]">{Math.round((bidding / total) * 100)}%</p>
          </div>
          <div className="bg-[#0f172a] rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-[#64748b]" />
              <span className="text-xs text-[#94a3b8]">Planejado</span>
            </div>
            <p className="text-lg font-bold text-[#64748b]">R$ {planned.toLocaleString()}</p>
            <p className="text-xs text-[#94a3b8]">{Math.round((planned / total) * 100)}%</p>
          </div>
          <div className="bg-[#0f172a] rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-[#0ea5e9]" />
              <span className="text-xs text-[#94a3b8]">Disponível</span>
            </div>
            <p className="text-lg font-bold text-[#0ea5e9]">R$ {available.toLocaleString()}</p>
            <p className="text-xs text-[#94a3b8]">{Math.round((available / total) * 100)}%</p>
          </div>
        </div>
      </div>

      {/* By Category */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-4">
        <h3 className="font-semibold text-[#f8fafc] mb-4 font-['Outfit']">Orçamento por Categoria</h3>
        <div className="space-y-4">
          {categoryList.map((cat) => {
            const spent = cat.budget.confirmed + cat.budget.bidding;
            const percentage = cat.allocatedBudget > 0 ? (spent / cat.allocatedBudget) * 100 : 0;
            const status = getStatusLabel(cat.budget);
            const Icon = cat.icon;

            return (
              <div key={cat.key} className="bg-[#0f172a] rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#334155] flex items-center justify-center">
                      <Icon size={16} className="text-[#94a3b8]" />
                    </div>
                    <span className="text-[#f8fafc] font-['Outfit']">{cat.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#f8fafc] font-medium">R$ {spent.toLocaleString()}</span>
                    <span className="text-[#94a3b8] text-sm"> / R$ {cat.allocatedBudget.toLocaleString()}</span>
                  </div>
                </div>
                <Progress 
                  value={Math.min(percentage, 100)} 
                  className="h-2 bg-[#334155] mb-2"
                />
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${status.color}`}>{status.label}</span>
                  <span className="text-xs text-[#94a3b8]">{Math.round(percentage)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FinOpsDashboard;
