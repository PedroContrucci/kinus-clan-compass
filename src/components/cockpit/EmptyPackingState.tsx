// EmptyPackingState — Shows when packing list is empty

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Luggage, Plus, Sparkles, Plane, Briefcase, ShoppingBag } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LuggageType {
  id: string;
  name: string;
  icon: string;
  dimensions: string;
  defaultWeight: number;
  isCarryOn: boolean;
}

const LUGGAGE_TYPES: LuggageType[] = [
  { id: 'carry-on', name: 'Mala de Mão', icon: '🧳', dimensions: '55x40x20cm', defaultWeight: 8, isCarryOn: true },
  { id: 'medium', name: 'Mala Média', icon: '🛄', dimensions: '70x45x25cm', defaultWeight: 23, isCarryOn: false },
  { id: 'large', name: 'Mala Grande', icon: '🛅', dimensions: '80x50x30cm', defaultWeight: 32, isCarryOn: false },
  { id: 'backpack', name: 'Mochila', icon: '🎒', dimensions: '45x35x20cm', defaultWeight: 10, isCarryOn: true },
];

const AIRLINES_LIMITS: Record<string, { carryOn: number; checked: number }> = {
  'LATAM': { carryOn: 10, checked: 23 },
  'GOL': { carryOn: 10, checked: 23 },
  'Azul': { carryOn: 10, checked: 23 },
  'TAP Portugal': { carryOn: 8, checked: 23 },
  'Air France': { carryOn: 12, checked: 23 },
  'Emirates': { carryOn: 7, checked: 30 },
  'American Airlines': { carryOn: 10, checked: 23 },
  'Outra': { carryOn: 10, checked: 23 },
};

interface EmptyPackingStateProps {
  onAddLuggage: (luggage: { type: LuggageType; airline: string; weightLimit: number }) => void;
  destination?: string;
}

export const EmptyPackingState = ({ onAddLuggage, destination }: EmptyPackingStateProps) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState<LuggageType | null>(null);
  const [selectedAirline, setSelectedAirline] = useState('TAP Portugal');
  
  const handleAddLuggage = () => {
    if (!selectedType) return;
    
    const limits = AIRLINES_LIMITS[selectedAirline] || AIRLINES_LIMITS['Outra'];
    const weightLimit = selectedType.isCarryOn ? limits.carryOn : limits.checked;
    
    onAddLuggage({
      type: selectedType,
      airline: selectedAirline,
      weightLimit,
    });
    
    setShowModal(false);
    setSelectedType(null);
  };
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12 px-6"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <Luggage size={40} className="text-primary" />
        </motion.div>
        
        {/* Title */}
        <h3 className="text-xl font-bold text-foreground font-['Outfit'] mb-2">
          Sua mala está vazia
        </h3>
        
        {/* Description */}
        <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
          Adicione uma bagagem para começar a organizar seus itens de viagem.
        </p>
        
        {/* CTA Button */}
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          Adicionar Bagagem
        </button>
        
        {/* KINU Tip */}
        {destination && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-xl max-w-sm mx-auto text-left"
          >
            <div className="flex items-start gap-2">
              <Sparkles size={16} className="text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-primary mb-1">Dica do KINU</p>
                <p className="text-xs text-muted-foreground">
                  Depois de adicionar sua bagagem, vou sugerir itens essenciais baseados no clima e duração da sua viagem para {destination}!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
      
      {/* Add Luggage Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Luggage size={20} className="text-primary" />
              Adicionar Bagagem
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Luggage Type Selection */}
            <div>
              <label className="text-sm font-medium text-foreground mb-3 block">
                Tipo de bagagem:
              </label>
              <div className="grid grid-cols-2 gap-3">
                {LUGGAGE_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type)}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all text-left",
                      selectedType?.id === type.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="text-2xl mb-2">{type.icon}</div>
                    <div className="font-medium text-foreground text-sm">{type.name}</div>
                    <div className="text-xs text-muted-foreground">{type.dimensions}</div>
                    <div className="text-xs text-primary mt-1">
                      {type.isCarryOn ? 'Mão' : 'Despachada'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Airline Selection */}
            <div>
              <label className="text-sm font-medium text-foreground mb-3 block">
                Companhia aérea:
              </label>
              <select
                value={selectedAirline}
                onChange={(e) => setSelectedAirline(e.target.value)}
                className="w-full p-3 bg-muted border border-border rounded-xl text-foreground"
              >
                {Object.keys(AIRLINES_LIMITS).map((airline) => (
                  <option key={airline} value={airline}>{airline}</option>
                ))}
              </select>
              {selectedType && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Plane size={12} />
                  Limite: {selectedType.isCarryOn 
                    ? `${AIRLINES_LIMITS[selectedAirline]?.carryOn || 10}kg (mão)` 
                    : `${AIRLINES_LIMITS[selectedAirline]?.checked || 23}kg (despachada)`}
                </p>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddLuggage}
                disabled={!selectedType}
                className="flex-1"
              >
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EmptyPackingState;
