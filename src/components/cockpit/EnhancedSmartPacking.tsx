// EnhancedSmartPacking — Complete packing with airline rules, carry-on/checked separation

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Check, Trash2, AlertTriangle, ChevronDown, ChevronUp, Snowflake, Sun, Cloud } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface PackingItem {
  id: string;
  name: string;
  weight: number;
  quantity: number;
  category: 'roupas' | 'calcados' | 'eletronicos' | 'higiene' | 'documentos' | 'outros';
  bagType: 'carry_on' | 'checked';
  isChecked: boolean;
  isLocked?: boolean; // For documents
}

interface AirlineRules {
  id: string;
  name: string;
  carryOnWeight: number;
  carryOnDimensions: string;
  checkedWeight: number;
  checkedIncluded: boolean;
  extraBagFee: number;
}

interface WeatherTip {
  temperature: string;
  icon: React.ReactNode;
  recommended: string[];
  notNeeded: string[];
  warnings: string[];
}

interface EnhancedSmartPackingProps {
  tripId: string;
  destination: string;
  duration: number;
  month?: number; // 1-12
  onUpdate?: (data: any) => void;
}

// Popular airlines and their rules
const AIRLINES: AirlineRules[] = [
  { id: 'tap', name: 'TAP Portugal', carryOnWeight: 8, carryOnDimensions: '55x40x20cm', checkedWeight: 23, checkedIncluded: true, extraBagFee: 60 },
  { id: 'latam', name: 'LATAM', carryOnWeight: 10, carryOnDimensions: '55x35x25cm', checkedWeight: 23, checkedIncluded: true, extraBagFee: 50 },
  { id: 'gol', name: 'GOL', carryOnWeight: 10, carryOnDimensions: '55x35x25cm', checkedWeight: 23, checkedIncluded: false, extraBagFee: 80 },
  { id: 'azul', name: 'Azul', carryOnWeight: 10, carryOnDimensions: '55x35x25cm', checkedWeight: 23, checkedIncluded: true, extraBagFee: 60 },
  { id: 'airfrance', name: 'Air France', carryOnWeight: 12, carryOnDimensions: '55x35x25cm', checkedWeight: 23, checkedIncluded: true, extraBagFee: 70 },
  { id: 'emirates', name: 'Emirates', carryOnWeight: 7, carryOnDimensions: '55x38x20cm', checkedWeight: 30, checkedIncluded: true, extraBagFee: 100 },
];

// Weather tips by destination and month
const getWeatherTips = (destination: string, month: number = new Date().getMonth() + 1): WeatherTip => {
  const isEurope = ['Paris', 'Roma', 'Lisboa', 'Barcelona', 'Londres', 'Amsterdã'].includes(destination);
  const isWinter = isEurope && (month >= 11 || month <= 3);
  const isSummer = isEurope && (month >= 6 && month <= 8);
  
  if (destination.includes('Paris') || destination.includes('França')) {
    if (isWinter) {
      return {
        temperature: '2-8°C',
        icon: <Snowflake className="text-blue-400" size={20} />,
        recommended: ['Casaco pesado impermeável', 'Cachecol e luvas', 'Camadas térmicas', 'Sapatos impermeáveis', 'Guarda-chuva compacto'],
        notNeeded: ['Roupa de praia', 'Protetor solar forte', 'Shorts', 'Sandálias'],
        warnings: ['Adaptador tomada tipo C/E', 'Chove bastante nessa época'],
      };
    }
    if (isSummer) {
      return {
        temperature: '18-28°C',
        icon: <Sun className="text-amber-400" size={20} />,
        recommended: ['Roupas leves', 'Protetor solar', 'Óculos de sol', 'Tênis confortável', 'Camisa manga longa (sol)'],
        notNeeded: ['Casaco pesado', 'Botas de neve', 'Muitas camadas'],
        warnings: ['Pode ter ondas de calor', 'Metro pode ser quente'],
      };
    }
    return {
      temperature: '10-18°C',
      icon: <Cloud className="text-gray-400" size={20} />,
      recommended: ['Jaqueta leve', 'Camadas', 'Sapato fechado', 'Guarda-chuva', 'Cachecol leve'],
      notNeeded: ['Casaco muito pesado', 'Roupa de praia'],
      warnings: ['Tempo variável', 'Sempre tenha uma camada extra'],
    };
  }
  
  // Default tropical
  return {
    temperature: '22-32°C',
    icon: <Sun className="text-amber-400" size={20} />,
    recommended: ['Roupas leves', 'Protetor solar', 'Óculos de sol', 'Chapéu/boné', 'Repelente'],
    notNeeded: ['Casaco pesado', 'Botas', 'Muitas camadas'],
    warnings: ['Hidrate-se bastante'],
  };
};

// Default packing items
const getDefaultItems = (): PackingItem[] => [
  // Roupas
  { id: 'r1', name: 'Camisetas', weight: 0.16, quantity: 5, category: 'roupas', bagType: 'checked', isChecked: true },
  { id: 'r2', name: 'Calças jeans', weight: 0.6, quantity: 2, category: 'roupas', bagType: 'checked', isChecked: true },
  { id: 'r3', name: 'Casaco de inverno', weight: 1.5, quantity: 1, category: 'roupas', bagType: 'checked', isChecked: true },
  { id: 'r4', name: 'Moletom', weight: 0.6, quantity: 1, category: 'roupas', bagType: 'carry_on', isChecked: true },
  { id: 'r5', name: 'Pijama', weight: 0.3, quantity: 1, category: 'roupas', bagType: 'checked', isChecked: true },
  { id: 'r6', name: 'Cuecas/Calcinhas', weight: 0.025, quantity: 8, category: 'roupas', bagType: 'checked', isChecked: true },
  { id: 'r7', name: 'Meias', weight: 0.04, quantity: 8, category: 'roupas', bagType: 'checked', isChecked: true },
  { id: 'r8', name: 'Roupa social', weight: 0.8, quantity: 1, category: 'roupas', bagType: 'checked', isChecked: true },
  
  // Calçados
  { id: 'c1', name: 'Tênis confortável', weight: 0.8, quantity: 1, category: 'calcados', bagType: 'checked', isChecked: true },
  { id: 'c2', name: 'Sapato social', weight: 0.7, quantity: 1, category: 'calcados', bagType: 'checked', isChecked: true },
  { id: 'c3', name: 'Chinelo', weight: 0.2, quantity: 1, category: 'calcados', bagType: 'carry_on', isChecked: true },
  
  // Eletrônicos
  { id: 'e1', name: 'Notebook', weight: 1.5, quantity: 1, category: 'eletronicos', bagType: 'carry_on', isChecked: true },
  { id: 'e2', name: 'Carregador notebook', weight: 0.3, quantity: 1, category: 'eletronicos', bagType: 'carry_on', isChecked: true },
  { id: 'e3', name: 'Celular + carregador', weight: 0.3, quantity: 1, category: 'eletronicos', bagType: 'carry_on', isChecked: true },
  { id: 'e4', name: 'Adaptador tomada EU', weight: 0.1, quantity: 1, category: 'eletronicos', bagType: 'carry_on', isChecked: true },
  { id: 'e5', name: 'Power bank', weight: 0.3, quantity: 1, category: 'eletronicos', bagType: 'carry_on', isChecked: true },
  { id: 'e6', name: 'Fone de ouvido', weight: 0.2, quantity: 1, category: 'eletronicos', bagType: 'carry_on', isChecked: true },
  
  // Higiene
  { id: 'h1', name: 'Nécessaire completa', weight: 0.8, quantity: 1, category: 'higiene', bagType: 'checked', isChecked: true },
  { id: 'h2', name: 'Kit líquidos <100ml', weight: 0.3, quantity: 1, category: 'higiene', bagType: 'carry_on', isChecked: true },
  { id: 'h3', name: 'Medicamentos', weight: 0.2, quantity: 1, category: 'higiene', bagType: 'carry_on', isChecked: true },
  { id: 'h4', name: 'Protetor solar', weight: 0.2, quantity: 1, category: 'higiene', bagType: 'checked', isChecked: true },
  
  // Documentos
  { id: 'd1', name: 'Passaporte', weight: 0.1, quantity: 1, category: 'documentos', bagType: 'carry_on', isChecked: true, isLocked: true },
  { id: 'd2', name: 'Carteira + cartões', weight: 0.1, quantity: 1, category: 'documentos', bagType: 'carry_on', isChecked: true, isLocked: true },
  { id: 'd3', name: 'Comprovantes impressos', weight: 0.1, quantity: 1, category: 'documentos', bagType: 'carry_on', isChecked: true },
];

const categoryConfig = {
  roupas: { icon: '👕', label: 'Roupas' },
  calcados: { icon: '👟', label: 'Calçados' },
  eletronicos: { icon: '💻', label: 'Eletrônicos' },
  higiene: { icon: '🧴', label: 'Higiene' },
  documentos: { icon: '📄', label: 'Documentos' },
  outros: { icon: '📦', label: 'Outros' },
};

export const EnhancedSmartPacking = ({
  tripId,
  destination,
  duration,
  month,
  onUpdate,
}: EnhancedSmartPackingProps) => {
  const [selectedAirline, setSelectedAirline] = useState<AirlineRules>(AIRLINES[0]);
  const [items, setItems] = useState<PackingItem[]>(getDefaultItems());
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['roupas', 'eletronicos']);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', weight: 0.3, category: 'outros' as PackingItem['category'], bagType: 'checked' as PackingItem['bagType'] });
  
  const weatherTips = useMemo(() => getWeatherTips(destination, month), [destination, month]);
  
  // Calculate weights
  const carryOnWeight = useMemo(() => {
    return items
      .filter(i => i.isChecked && i.bagType === 'carry_on')
      .reduce((acc, item) => acc + item.weight * item.quantity, 0);
  }, [items]);
  
  const checkedWeight = useMemo(() => {
    return items
      .filter(i => i.isChecked && i.bagType === 'checked')
      .reduce((acc, item) => acc + item.weight * item.quantity, 0);
  }, [items]);
  
  const carryOnPercentage = (carryOnWeight / selectedAirline.carryOnWeight) * 100;
  const checkedPercentage = (checkedWeight / selectedAirline.checkedWeight) * 100;
  
  const carryOnStatus = carryOnPercentage > 100 ? 'overweight' : carryOnPercentage > 90 ? 'warning' : 'ok';
  const checkedStatus = checkedPercentage > 100 ? 'overweight' : checkedPercentage > 90 ? 'warning' : 'ok';
  
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  const toggleItem = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id && !item.isLocked ? { ...item, isChecked: !item.isChecked } : item
    ));
  };
  
  const updateQuantity = (id: string, delta: number) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };
  
  const changeBagType = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id && !item.isLocked
        ? { ...item, bagType: item.bagType === 'carry_on' ? 'checked' : 'carry_on' }
        : item
    ));
  };
  
  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id || item.isLocked));
  };
  
  const addItem = () => {
    if (!newItem.name) return;
    setItems(prev => [...prev, {
      id: `custom-${Date.now()}`,
      ...newItem,
      quantity: 1,
      isChecked: true,
    }]);
    setNewItem({ name: '', weight: 0.3, category: 'outros', bagType: 'checked' });
    setShowAddItem(false);
  };
  
  const addSuggestedItem = (name: string, weight: number) => {
    setItems(prev => [...prev, {
      id: `suggested-${Date.now()}`,
      name,
      weight,
      quantity: 1,
      category: 'outros',
      bagType: 'checked',
      isChecked: true,
    }]);
  };
  
  const categories = ['roupas', 'calcados', 'eletronicos', 'higiene', 'documentos', 'outros'] as const;
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Airline Selection */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-4"
      >
        <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
          📦 Configuração da Bagagem
        </h3>
        
        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground">Cia aérea:</label>
            <select
              value={selectedAirline.id}
              onChange={(e) => setSelectedAirline(AIRLINES.find(a => a.id === e.target.value) || AIRLINES[0])}
              className="w-full mt-1 bg-muted border border-border rounded-xl px-3 py-2 text-foreground"
            >
              {AIRLINES.map(airline => (
                <option key={airline.id} value={airline.id}>{airline.name}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-muted/50 rounded-xl">
              <p className="text-muted-foreground">Bagagem de mão:</p>
              <p className="font-medium text-foreground">1x até {selectedAirline.carryOnWeight}kg</p>
              <p className="text-xs text-muted-foreground">{selectedAirline.carryOnDimensions}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-xl">
              <p className="text-muted-foreground">Despachada:</p>
              <p className="font-medium text-foreground">1x até {selectedAirline.checkedWeight}kg</p>
              <p className="text-xs text-muted-foreground">
                {selectedAirline.checkedIncluded ? '✅ Inclusa' : `+€${selectedAirline.extraBagFee}`}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Weight Status */}
      <div className="grid grid-cols-2 gap-3">
        {/* Carry-on */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            "p-4 rounded-2xl border",
            carryOnStatus === 'overweight' ? 'bg-red-500/10 border-red-500/30' :
            carryOnStatus === 'warning' ? 'bg-amber-500/10 border-amber-500/30' :
            'bg-card border-border'
          )}
        >
          <p className="text-sm text-muted-foreground">🎒 Mala de Mão</p>
          <p className="text-xl font-bold text-foreground">
            {carryOnWeight.toFixed(1)}kg / {selectedAirline.carryOnWeight}kg
          </p>
          <Progress 
            value={Math.min(carryOnPercentage, 100)} 
            className={cn(
              "h-2 mt-2",
              carryOnStatus === 'overweight' ? '[&>div]:bg-red-500' :
              carryOnStatus === 'warning' ? '[&>div]:bg-amber-500' : ''
            )}
          />
          <p className="text-xs mt-1 text-muted-foreground">
            {carryOnStatus === 'ok' ? `✅ OK` : carryOnStatus === 'warning' ? '⚠️ Quase no limite' : '🔴 Excesso'}
          </p>
        </motion.div>
        
        {/* Checked */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            "p-4 rounded-2xl border",
            checkedStatus === 'overweight' ? 'bg-red-500/10 border-red-500/30' :
            checkedStatus === 'warning' ? 'bg-amber-500/10 border-amber-500/30' :
            'bg-card border-border'
          )}
        >
          <p className="text-sm text-muted-foreground">🧳 Despachada</p>
          <p className="text-xl font-bold text-foreground">
            {checkedWeight.toFixed(1)}kg / {selectedAirline.checkedWeight}kg
          </p>
          <Progress 
            value={Math.min(checkedPercentage, 100)} 
            className={cn(
              "h-2 mt-2",
              checkedStatus === 'overweight' ? '[&>div]:bg-red-500' :
              checkedStatus === 'warning' ? '[&>div]:bg-amber-500' : ''
            )}
          />
          <p className="text-xs mt-1 text-muted-foreground">
            {checkedStatus === 'ok' ? `✅ OK` : checkedStatus === 'warning' ? '⚠️ Quase no limite' : '🔴 Excesso'}
          </p>
        </motion.div>
      </div>
      
      {/* Weather Tips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-primary/5 border border-primary/20 rounded-2xl p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          {weatherTips.icon}
          <h3 className="font-medium text-foreground">
            KINU diz: {destination} em {month ? new Date(2024, month - 1).toLocaleString('pt-BR', { month: 'long' }) : 'breve'}
          </h3>
          <span className="text-sm text-muted-foreground ml-auto">{weatherTips.temperature}</span>
        </div>
        
        <div className="space-y-2 text-sm">
          <div>
            <p className="text-emerald-500 font-medium">✅ Recomendado:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {weatherTips.recommended.map((item, i) => (
                <span key={i} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full text-xs">
                  {item}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <p className="text-red-500 font-medium">❌ Não precisa:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {weatherTips.notNeeded.map((item, i) => (
                <span key={i} className="px-2 py-0.5 bg-red-500/10 text-red-500 rounded-full text-xs">
                  {item}
                </span>
              ))}
            </div>
          </div>
          
          {weatherTips.warnings.length > 0 && (
            <div className="flex items-start gap-1 mt-2 p-2 bg-amber-500/10 rounded-lg">
              <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-500">{weatherTips.warnings.join(' • ')}</p>
            </div>
          )}
        </div>
        
        {/* Quick add suggested items */}
        <div className="flex flex-wrap gap-1 mt-3">
          {weatherTips.recommended.slice(0, 3).map((item, i) => (
            <button
              key={i}
              onClick={() => addSuggestedItem(item, 0.3)}
              className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
            >
              + {item}
            </button>
          ))}
        </div>
      </motion.div>
      
      {/* Items by Category */}
      {categories.map((category) => {
        const categoryItems = items.filter(i => i.category === category);
        if (categoryItems.length === 0 && category !== 'outros') return null;
        
        const isExpanded = expandedCategories.includes(category);
        const config = categoryConfig[category];
        const catWeight = categoryItems.filter(i => i.isChecked).reduce((acc, i) => acc + i.weight * i.quantity, 0);
        
        return (
          <motion.div
            key={category}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card border border-border rounded-2xl overflow-hidden"
          >
            <button
              onClick={() => toggleCategory(category)}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{config.icon}</span>
                <span className="font-medium text-foreground">{config.label}</span>
                <span className="text-sm text-muted-foreground">({categoryItems.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{catWeight.toFixed(1)}kg</span>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>
            
            {isExpanded && (
              <div className="border-t border-border divide-y divide-border">
                {categoryItems.map((item) => (
                  <div key={item.id} className="p-3 flex items-center gap-3">
                    <button
                      onClick={() => toggleItem(item.id)}
                      disabled={item.isLocked}
                      className={cn(
                        "w-5 h-5 rounded flex items-center justify-center border-2 transition-colors",
                        item.isChecked
                          ? "bg-primary border-primary"
                          : "border-border hover:border-primary",
                        item.isLocked && "opacity-50"
                      )}
                    >
                      {item.isChecked && <Check size={12} className="text-primary-foreground" />}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-sm", !item.isChecked && "text-muted-foreground line-through")}>
                          {item.name}
                        </span>
                        {item.isLocked && <span className="text-xs">🔒</span>}
                      </div>
                    </div>
                    
                    {/* Quantity */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded bg-muted text-muted-foreground hover:text-foreground text-sm"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-sm">×{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded bg-muted text-muted-foreground hover:text-foreground text-sm"
                      >
                        +
                      </button>
                    </div>
                    
                    {/* Bag Type */}
                    <button
                      onClick={() => changeBagType(item.id)}
                      disabled={item.isLocked}
                      className={cn(
                        "px-2 py-1 rounded text-xs",
                        item.bagType === 'carry_on' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                        item.isLocked && "opacity-50"
                      )}
                    >
                      {item.bagType === 'carry_on' ? 'Mão' : 'Desp'}
                    </button>
                    
                    {/* Weight */}
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {(item.weight * item.quantity).toFixed(1)}kg
                    </span>
                    
                    {/* Remove */}
                    {!item.isLocked && (
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
                
                {/* Add item button */}
                <button
                  onClick={() => setShowAddItem(true)}
                  className="w-full p-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center justify-center gap-1"
                >
                  <Plus size={14} />
                  Adicionar item
                </button>
              </div>
            )}
          </motion.div>
        );
      })}
      
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
                  <label className="text-xs text-muted-foreground">Mala</label>
                  <select
                    value={newItem.bagType}
                    onChange={(e) => setNewItem(prev => ({ ...prev, bagType: e.target.value as 'carry_on' | 'checked' }))}
                    className="w-full mt-1 bg-muted border border-border rounded-xl px-3 py-2 text-foreground"
                  >
                    <option value="carry_on">Mão</option>
                    <option value="checked">Despachada</option>
                  </select>
                </div>
              </div>
              
              <button
                onClick={addItem}
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

export default EnhancedSmartPacking;
