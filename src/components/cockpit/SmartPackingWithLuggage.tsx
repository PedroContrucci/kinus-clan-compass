// SmartPackingWithLuggage — Correct flow: Add luggage first, then items

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Check, Trash2, ChevronDown, ChevronUp, Sparkles, AlertTriangle, Briefcase, Package } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { AddLuggageModal } from './AddLuggageModal';
import { LuggageVisualization } from './LuggageVisualization';

// Interfaces
interface PackingItem {
  id: string;
  name: string;
  weight: number;
  quantity: number;
  category: 'roupas' | 'calcados' | 'eletronicos' | 'higiene' | 'documentos' | 'outros';
  bagType: 'carry_on' | 'checked';
  isChecked: boolean;
  isLocked?: boolean;
}

interface Luggage {
  id: string;
  type: {
    id: string;
    name: string;
    icon: string;
    dimensions: { height: number; width: number; depth: number };
  };
  airline: {
    id: string;
    name: string;
  };
  weightLimit: number;
  isCarryOn: boolean;
  items: PackingItem[];
}

interface WeatherTip {
  temperature: string;
  icon: React.ReactNode;
  recommended: string[];
  notNeeded: string[];
}

interface SmartPackingWithLuggageProps {
  tripId: string;
  destination: string;
  duration: number;
  month?: number;
  onUpdate?: (data: any) => void;
}

const categoryConfig = {
  roupas: { icon: '👕', label: 'Roupas' },
  calcados: { icon: '👟', label: 'Calçados' },
  eletronicos: { icon: '💻', label: 'Eletrônicos' },
  higiene: { icon: '🧴', label: 'Higiene' },
  documentos: { icon: '📄', label: 'Documentos' },
  outros: { icon: '📦', label: 'Outros' },
};

// Weather tips based on destination
const getWeatherTips = (destination: string, month: number = new Date().getMonth() + 1): WeatherTip => {
  const isEurope = ['Paris', 'Roma', 'Lisboa', 'Barcelona', 'Londres', 'Amsterdã'].some(
    city => destination.toLowerCase().includes(city.toLowerCase())
  );
  const isWinter = isEurope && (month >= 11 || month <= 3);
  const isSummer = isEurope && (month >= 6 && month <= 8);
  
  if (isWinter) {
    return {
      temperature: '2-10°C',
      icon: '❄️',
      recommended: ['Casaco pesado', 'Cachecol', 'Luvas', 'Botas impermeáveis', 'Camadas térmicas'],
      notNeeded: ['Roupa de banho', 'Shorts', 'Sandálias'],
    };
  }
  
  if (isSummer) {
    return {
      temperature: '20-30°C',
      icon: '☀️',
      recommended: ['Roupas leves', 'Protetor solar', 'Óculos de sol', 'Chapéu', 'Tênis confortável'],
      notNeeded: ['Casaco pesado', 'Botas de neve', 'Muitas camadas'],
    };
  }
  
  return {
    temperature: '15-25°C',
    icon: '🌤️',
    recommended: ['Jaqueta leve', 'Camadas', 'Guarda-chuva', 'Tênis confortável'],
    notNeeded: ['Casaco muito pesado'],
  };
};

// Suggested items to add
const SUGGESTED_ITEMS: { name: string; weight: number; category: PackingItem['category']; bagType: PackingItem['bagType'] }[] = [
  { name: 'Camisetas (×5)', weight: 0.75, category: 'roupas', bagType: 'checked' },
  { name: 'Calças (×3)', weight: 1.2, category: 'roupas', bagType: 'checked' },
  { name: 'Casaco', weight: 0.8, category: 'roupas', bagType: 'checked' },
  { name: 'Roupas íntimas (×7)', weight: 0.35, category: 'roupas', bagType: 'checked' },
  { name: 'Tênis', weight: 0.8, category: 'calcados', bagType: 'checked' },
  { name: 'Chinelo', weight: 0.2, category: 'calcados', bagType: 'checked' },
  { name: 'Carregador celular', weight: 0.1, category: 'eletronicos', bagType: 'carry_on' },
  { name: 'Power bank', weight: 0.4, category: 'eletronicos', bagType: 'carry_on' },
  { name: 'Adaptador tomada', weight: 0.1, category: 'eletronicos', bagType: 'carry_on' },
  { name: 'Nécessaire', weight: 0.5, category: 'higiene', bagType: 'checked' },
  { name: 'Passaporte', weight: 0.05, category: 'documentos', bagType: 'carry_on' },
  { name: 'Carteira', weight: 0.1, category: 'documentos', bagType: 'carry_on' },
];

export const SmartPackingWithLuggage = ({
  tripId,
  destination,
  duration,
  month,
  onUpdate,
}: SmartPackingWithLuggageProps) => {
  const [luggages, setLuggages] = useState<Luggage[]>([]);
  const [showAddLuggage, setShowAddLuggage] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedLuggageId, setSelectedLuggageId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['roupas']);
  const [newItem, setNewItem] = useState({ 
    name: '', 
    weight: 0.3, 
    category: 'outros' as PackingItem['category'] 
  });

  const weatherTips = useMemo(() => getWeatherTips(destination, month), [destination, month]);

  // Calculate totals for all luggages
  const luggageStats = useMemo(() => {
    return luggages.map(luggage => {
      const totalWeight = luggage.items
        .filter(i => i.isChecked)
        .reduce((acc, i) => acc + i.weight * i.quantity, 0);
      const percentage = (totalWeight / luggage.weightLimit) * 100;
      const status = percentage > 100 ? 'overweight' : percentage > 90 ? 'warning' : 'ok';
      return { ...luggage, totalWeight, percentage, status };
    });
  }, [luggages]);

  const handleAddLuggage = (luggageData: any) => {
    const newLuggage: Luggage = {
      id: `luggage-${Date.now()}`,
      type: luggageData.type,
      airline: luggageData.airline,
      weightLimit: luggageData.weightLimit,
      isCarryOn: luggageData.isCarryOn,
      items: [],
    };
    setLuggages(prev => [...prev, newLuggage]);
    setSelectedLuggageId(newLuggage.id);
  };

  const handleAddItem = () => {
    if (!newItem.name || !selectedLuggageId) return;
    
    const item: PackingItem = {
      id: `item-${Date.now()}`,
      ...newItem,
      quantity: 1,
      bagType: luggages.find(l => l.id === selectedLuggageId)?.isCarryOn ? 'carry_on' : 'checked',
      isChecked: true,
    };
    
    setLuggages(prev => prev.map(l => 
      l.id === selectedLuggageId 
        ? { ...l, items: [...l.items, item] }
        : l
    ));
    
    setNewItem({ name: '', weight: 0.3, category: 'outros' });
    setShowAddItem(false);
  };

  const handleToggleItem = (luggageId: string, itemId: string) => {
    setLuggages(prev => prev.map(l => 
      l.id === luggageId 
        ? { 
            ...l, 
            items: l.items.map(i => 
              i.id === itemId && !i.isLocked ? { ...i, isChecked: !i.isChecked } : i
            )
          }
        : l
    ));
  };

  const handleRemoveItem = (luggageId: string, itemId: string) => {
    setLuggages(prev => prev.map(l => 
      l.id === luggageId 
        ? { ...l, items: l.items.filter(i => i.id !== itemId || i.isLocked) }
        : l
    ));
  };

  const handleRemoveLuggage = (luggageId: string) => {
    setLuggages(prev => prev.filter(l => l.id !== luggageId));
    if (selectedLuggageId === luggageId) {
      setSelectedLuggageId(luggages[0]?.id || null);
    }
  };

  const handleAddSuggestedItem = (suggestion: typeof SUGGESTED_ITEMS[0], luggageId: string) => {
    const item: PackingItem = {
      id: `suggested-${Date.now()}-${Math.random()}`,
      name: suggestion.name,
      weight: suggestion.weight,
      category: suggestion.category,
      bagType: suggestion.bagType,
      quantity: 1,
      isChecked: true,
    };
    
    setLuggages(prev => prev.map(l => 
      l.id === luggageId 
        ? { ...l, items: [...l.items, item] }
        : l
    ));
  };

  // EMPTY STATE - No luggage yet
  if (luggages.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Empty State */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border-2 border-dashed border-border rounded-2xl p-8 text-center"
        >
          <div className="text-5xl mb-4">🧳</div>
          <h3 className="font-semibold text-xl text-foreground mb-2">
            Sua mala está vazia
          </h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Adicione uma bagagem para começar a organizar seus itens para a viagem.
          </p>
          <button
            onClick={() => setShowAddLuggage(true)}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium flex items-center gap-2 mx-auto hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} />
            Adicionar Bagagem
          </button>
        </motion.div>

        {/* KINU Weather Tips */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-primary/5 border border-primary/20 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-primary" />
            <h4 className="font-medium text-foreground">
              KINU diz: {destination}
            </h4>
            <span className="ml-auto text-lg">{weatherTips.icon}</span>
            <span className="text-sm text-muted-foreground">{weatherTips.temperature}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-emerald-500 font-medium mb-1">✅ Recomendado:</p>
              <ul className="space-y-0.5">
                {weatherTips.recommended.slice(0, 4).map((item, i) => (
                  <li key={i} className="text-muted-foreground">• {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-red-400 font-medium mb-1">❌ Não precisa:</p>
              <ul className="space-y-0.5">
                {weatherTips.notNeeded.map((item, i) => (
                  <li key={i} className="text-muted-foreground">• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Add Luggage Modal */}
        <AddLuggageModal
          isOpen={showAddLuggage}
          onClose={() => setShowAddLuggage(false)}
          onAddLuggage={handleAddLuggage}
        />
      </div>
    );
  }

  // HAS LUGGAGE - Show luggage management
  const selectedLuggage = luggages.find(l => l.id === selectedLuggageId) || luggages[0];
  const selectedStats = luggageStats.find(l => l.id === selectedLuggage.id);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Luggage Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {luggages.map((luggage) => {
          const stats = luggageStats.find(l => l.id === luggage.id);
          const isSelected = selectedLuggageId === luggage.id || (!selectedLuggageId && luggage.id === luggages[0]?.id);
          
          return (
            <button
              key={luggage.id}
              onClick={() => setSelectedLuggageId(luggage.id)}
              className={cn(
                "flex-shrink-0 p-3 rounded-xl border transition-all",
                isSelected 
                  ? "bg-card border-primary ring-2 ring-primary/30" 
                  : "bg-card border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{luggage.type.icon}</span>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{luggage.type.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.totalWeight.toFixed(1)}kg / {luggage.weightLimit}kg
                  </p>
                </div>
              </div>
              <Progress 
                value={Math.min(stats?.percentage || 0, 100)} 
                className={cn(
                  "h-1.5 mt-2",
                  stats?.status === 'overweight' ? '[&>div]:bg-red-500' :
                  stats?.status === 'warning' ? '[&>div]:bg-amber-500' : ''
                )}
              />
            </button>
          );
        })}
        
        {/* Add New Luggage Button */}
        <button
          onClick={() => setShowAddLuggage(true)}
          className="flex-shrink-0 p-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex items-center gap-2"
        >
          <Plus size={18} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Nova bagagem</span>
        </button>
      </div>

      {/* Selected Luggage Details */}
      {selectedLuggage && selectedStats && (
        <motion.div
          key={selectedLuggage.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card border border-border rounded-2xl p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium text-foreground flex items-center gap-2">
                <span className="text-xl">{selectedLuggage.type.icon}</span>
                {selectedLuggage.type.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedLuggage.airline.name} • Limite: {selectedLuggage.weightLimit}kg
              </p>
            </div>
            <button
              onClick={() => handleRemoveLuggage(selectedLuggage.id)}
              className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>

          {/* Weight Progress */}
          <div className={cn(
            "p-3 rounded-xl mb-4",
            selectedStats.status === 'overweight' ? 'bg-red-500/10' :
            selectedStats.status === 'warning' ? 'bg-amber-500/10' : 'bg-muted/50'
          )}>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Peso total</span>
              <span className={cn(
                "font-medium",
                selectedStats.status === 'overweight' ? 'text-red-500' :
                selectedStats.status === 'warning' ? 'text-amber-500' : 'text-foreground'
              )}>
                {selectedStats.totalWeight.toFixed(1)}kg / {selectedLuggage.weightLimit}kg
              </span>
            </div>
            <Progress 
              value={Math.min(selectedStats.percentage, 100)} 
              className={cn(
                "h-2",
                selectedStats.status === 'overweight' ? '[&>div]:bg-red-500' :
                selectedStats.status === 'warning' ? '[&>div]:bg-amber-500' : ''
              )}
            />
            {selectedStats.status === 'overweight' && (
              <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                <AlertTriangle size={14} />
                <span>Excesso de {(selectedStats.totalWeight - selectedLuggage.weightLimit).toFixed(1)}kg! Taxa extra: ~R$ 150</span>
              </div>
            )}
          </div>

          {/* 2D Luggage Visualization */}
          <LuggageVisualization
            items={selectedLuggage.items}
            bagType={selectedLuggage.isCarryOn ? 'carry_on' : 'checked'}
            maxWeight={selectedLuggage.weightLimit}
            dimensions={`${selectedLuggage.type.dimensions.height}x${selectedLuggage.type.dimensions.width}x${selectedLuggage.type.dimensions.depth}cm`}
          />
        </motion.div>
      )}

      {/* Items List */}
      {selectedLuggage && selectedLuggage.items.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-foreground flex items-center gap-2">
            <Package size={16} />
            Itens na bagagem ({selectedLuggage.items.length})
          </h4>
          
          <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
            {selectedLuggage.items.map((item) => (
              <div key={item.id} className="p-3 flex items-center gap-3">
                <button
                  onClick={() => handleToggleItem(selectedLuggage.id, item.id)}
                  className={cn(
                    "w-5 h-5 rounded flex items-center justify-center border-2 transition-colors",
                    item.isChecked
                      ? "bg-primary border-primary"
                      : "border-border hover:border-primary"
                  )}
                >
                  {item.isChecked && <Check size={12} className="text-primary-foreground" />}
                </button>
                
                <span className="text-lg">{categoryConfig[item.category].icon}</span>
                
                <div className="flex-1 min-w-0">
                  <span className={cn(
                    "text-sm",
                    !item.isChecked && "text-muted-foreground line-through"
                  )}>
                    {item.name}
                  </span>
                </div>
                
                <span className="text-xs text-muted-foreground">
                  {(item.weight * item.quantity).toFixed(1)}kg
                </span>
                
                <button
                  onClick={() => handleRemoveItem(selectedLuggage.id, item.id)}
                  className="p-1 text-muted-foreground hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Item Button */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowAddItem(true)}
          className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          Adicionar Item
        </button>
      </div>

      {/* Quick Suggestions */}
      {selectedLuggage && selectedLuggage.items.length < 5 && (
        <div className="bg-muted/50 rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
            <Sparkles size={14} className="text-primary" />
            Sugestões rápidas:
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_ITEMS.slice(0, 6).map((item, i) => (
              <button
                key={i}
                onClick={() => handleAddSuggestedItem(item, selectedLuggage.id)}
                className="text-xs px-3 py-1.5 bg-card border border-border rounded-full hover:border-primary/50 transition-colors"
              >
                + {item.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add Luggage Modal */}
      <AddLuggageModal
        isOpen={showAddLuggage}
        onClose={() => setShowAddLuggage(false)}
        onAddLuggage={handleAddLuggage}
      />

      {/* Add Item Modal */}
      {showAddItem && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={() => setShowAddItem(false)}
        >
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="w-full max-w-md bg-background rounded-t-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-medium text-foreground mb-4">Adicionar Item</h3>
            
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nome do item"
                value={newItem.name}
                onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground"
              />
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newItem.weight}
                    onChange={(e) => setNewItem(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                    className="w-full mt-1 bg-muted border border-border rounded-xl px-3 py-2 text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Categoria</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value as PackingItem['category'] }))}
                    className="w-full mt-1 bg-muted border border-border rounded-xl px-3 py-2 text-foreground"
                  >
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.icon} {config.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <button
                onClick={handleAddItem}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium"
              >
                Adicionar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default SmartPackingWithLuggage;
