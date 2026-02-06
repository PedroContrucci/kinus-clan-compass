// LuggageVisualization - 2D top-view of luggage with items
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PackingItem {
  id: string;
  name: string;
  weight: number;
  quantity: number;
  category: 'roupas' | 'calcados' | 'eletronicos' | 'higiene' | 'documentos' | 'outros';
  bagType: 'carry_on' | 'checked';
  isChecked: boolean;
}

interface LuggageVisualizationProps {
  items: PackingItem[];
  bagType: 'carry_on' | 'checked';
  maxWeight: number;
  dimensions: string;
}

const categoryColors: Record<string, string> = {
  roupas: 'bg-blue-500/70',
  calcados: 'bg-amber-500/70',
  eletronicos: 'bg-purple-500/70',
  higiene: 'bg-emerald-500/70',
  documentos: 'bg-red-500/70',
  outros: 'bg-gray-500/70',
};

const categoryLabels: Record<string, string> = {
  roupas: '👕',
  calcados: '👟',
  eletronicos: '💻',
  higiene: '🧴',
  documentos: '📄',
  outros: '📦',
};

export const LuggageVisualization = ({
  items,
  bagType,
  maxWeight,
  dimensions,
}: LuggageVisualizationProps) => {
  const filteredItems = items.filter(i => i.isChecked && i.bagType === bagType);
  const totalWeight = filteredItems.reduce((acc, i) => acc + i.weight * i.quantity, 0);
  const occupancy = Math.min((totalWeight / maxWeight) * 100, 100);
  
  // Group items by category for visualization
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PackingItem[]>);
  
  const categories = Object.keys(groupedItems);
  
  // Calculate grid positions for items
  const getItemSize = (weight: number): string => {
    if (weight > 1) return 'col-span-2 row-span-2';
    if (weight > 0.5) return 'col-span-2';
    return '';
  };
  
  const isOverweight = totalWeight > maxWeight;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card border border-border rounded-2xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-foreground flex items-center gap-2">
          {bagType === 'carry_on' ? '🎒' : '🧳'} 
          {bagType === 'carry_on' ? 'Mala de Mão' : 'Mala Despachada'}
        </h4>
        <span className="text-xs text-muted-foreground">{dimensions}</span>
      </div>
      
      {/* Luggage visualization - top view */}
      <div className="relative">
        {/* Luggage outline */}
        <div 
          className={cn(
            "relative border-4 rounded-xl overflow-hidden transition-colors",
            isOverweight 
              ? "border-red-500 bg-red-500/5" 
              : "border-primary/30 bg-muted/30"
          )}
          style={{ aspectRatio: bagType === 'carry_on' ? '55/40' : '70/50' }}
        >
          {/* Handle */}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-12 h-3 bg-muted rounded-t-lg border-2 border-b-0 border-muted-foreground/30" />
          
          {/* Wheels indicator */}
          <div className="absolute -bottom-1 left-3 w-4 h-2 bg-muted-foreground/30 rounded-full" />
          <div className="absolute -bottom-1 right-3 w-4 h-2 bg-muted-foreground/30 rounded-full" />
          
          {/* Items grid */}
          {filteredItems.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Vazio</p>
            </div>
          ) : (
            <div className="p-2 grid grid-cols-4 gap-1 h-full auto-rows-fr">
              {filteredItems.slice(0, 12).map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "rounded flex items-center justify-center text-xs font-medium text-white shadow-sm",
                    categoryColors[item.category] || categoryColors.outros,
                    getItemSize(item.weight * item.quantity)
                  )}
                  title={`${item.name} (${(item.weight * item.quantity).toFixed(1)}kg)`}
                >
                  <span className="text-base">{categoryLabels[item.category]}</span>
                </motion.div>
              ))}
              
              {/* Extra items indicator */}
              {filteredItems.length > 12 && (
                <div className="rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                  +{filteredItems.length - 12}
                </div>
              )}
              
              {/* Free space */}
              {filteredItems.length < 8 && Array(Math.max(0, 8 - filteredItems.length)).fill(0).map((_, i) => (
                <div 
                  key={`empty-${i}`} 
                  className="rounded border border-dashed border-muted-foreground/20"
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Occupancy indicator */}
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Ocupação</span>
            <span className={cn(
              "font-medium",
              isOverweight ? "text-red-500" : occupancy > 90 ? "text-amber-500" : "text-foreground"
            )}>
              {occupancy.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${occupancy}%` }}
              className={cn(
                "h-full rounded-full",
                isOverweight ? "bg-red-500" : occupancy > 90 ? "bg-amber-500" : "bg-primary"
              )}
            />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className={cn(
              "font-semibold",
              isOverweight ? "text-red-500" : "text-foreground"
            )}>
              {totalWeight.toFixed(1)}kg
            </span>
            <span className="text-muted-foreground">/ {maxWeight}kg</span>
          </div>
        </div>
      </div>
      
      {/* Category legend */}
      {categories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map(cat => (
            <div key={cat} className="flex items-center gap-1">
              <div className={cn("w-3 h-3 rounded", categoryColors[cat])} />
              <span className="text-xs text-muted-foreground capitalize">
                {cat} ({groupedItems[cat].length})
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default LuggageVisualization;
