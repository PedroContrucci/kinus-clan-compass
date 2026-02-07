// AddLuggageModal — Modal to add luggage before adding items

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

interface LuggageType {
  id: string;
  name: string;
  icon: string;
  dimensions: { height: number; width: number; depth: number };
  defaultWeight: number;
  description: string;
}

interface Airline {
  id: string;
  name: string;
  carryOnWeight: number;
  checkedWeight: number;
}

interface AddLuggageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLuggage: (luggage: {
    type: LuggageType;
    airline: Airline;
    customDimensions?: { height: number; width: number; depth: number };
    weightLimit: number;
    isCarryOn: boolean;
  }) => void;
}

const LUGGAGE_TYPES: LuggageType[] = [
  {
    id: 'backpack',
    name: 'Mochila pessoal',
    icon: '🎒',
    dimensions: { height: 40, width: 30, depth: 15 },
    defaultWeight: 5,
    description: 'Dimensões padrão: 40x30x15cm | Peso: até 5kg',
  },
  {
    id: 'carry_on',
    name: 'Mala de mão',
    icon: '🧳',
    dimensions: { height: 55, width: 40, depth: 20 },
    defaultWeight: 10,
    description: 'Dimensões padrão: 55x40x20cm | Peso: até 10kg',
  },
  {
    id: 'checked_medium',
    name: 'Mala despachada média',
    icon: '🧳',
    dimensions: { height: 70, width: 45, depth: 25 },
    defaultWeight: 23,
    description: 'Dimensões padrão: 70x45x25cm | Peso: até 23kg',
  },
  {
    id: 'checked_large',
    name: 'Mala despachada grande',
    icon: '🧳',
    dimensions: { height: 80, width: 50, depth: 30 },
    defaultWeight: 32,
    description: 'Dimensões padrão: 80x50x30cm | Peso: até 32kg',
  },
];

const AIRLINES: Airline[] = [
  { id: 'tap', name: 'TAP Portugal', carryOnWeight: 8, checkedWeight: 23 },
  { id: 'latam', name: 'LATAM', carryOnWeight: 10, checkedWeight: 23 },
  { id: 'gol', name: 'GOL', carryOnWeight: 10, checkedWeight: 23 },
  { id: 'azul', name: 'Azul', carryOnWeight: 10, checkedWeight: 23 },
  { id: 'airfrance', name: 'Air France', carryOnWeight: 12, checkedWeight: 23 },
  { id: 'emirates', name: 'Emirates', carryOnWeight: 7, checkedWeight: 30 },
  { id: 'iberia', name: 'Iberia', carryOnWeight: 10, checkedWeight: 23 },
  { id: 'lufthansa', name: 'Lufthansa', carryOnWeight: 8, checkedWeight: 23 },
  { id: 'alitalia', name: 'ITA Airways', carryOnWeight: 8, checkedWeight: 23 },
  { id: 'other', name: 'Outra', carryOnWeight: 10, checkedWeight: 23 },
];

export const AddLuggageModal = ({
  isOpen,
  onClose,
  onAddLuggage,
}: AddLuggageModalProps) => {
  const [selectedType, setSelectedType] = useState<string>('carry_on');
  const [selectedAirline, setSelectedAirline] = useState<string>('tap');
  const [useCustomDimensions, setUseCustomDimensions] = useState(false);
  const [customDimensions, setCustomDimensions] = useState({ height: 55, width: 40, depth: 20 });

  const luggageType = LUGGAGE_TYPES.find(t => t.id === selectedType) || LUGGAGE_TYPES[1];
  const airline = AIRLINES.find(a => a.id === selectedAirline) || AIRLINES[0];
  
  const isCarryOn = selectedType === 'backpack' || selectedType === 'carry_on';
  const weightLimit = isCarryOn ? airline.carryOnWeight : airline.checkedWeight;

  const handleSubmit = () => {
    onAddLuggage({
      type: luggageType,
      airline,
      customDimensions: useCustomDimensions ? customDimensions : undefined,
      weightLimit,
      isCarryOn,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Adicionar Bagagem</DialogTitle>
          <DialogDescription>
            Escolha o tipo de bagagem e a companhia aérea para calcular os limites corretamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Luggage Type Selection */}
          <div className="space-y-3">
            <Label>Tipo de bagagem</Label>
            <RadioGroup
              value={selectedType}
              onValueChange={setSelectedType}
              className="space-y-2"
            >
              {LUGGAGE_TYPES.map((type) => (
                <label
                  key={type.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                    selectedType === type.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <RadioGroupItem value={type.id} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{type.icon}</span>
                      <span className="font-medium text-foreground">{type.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {type.description}
                    </p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Custom Dimensions Toggle */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useCustomDimensions}
                onChange={(e) => setUseCustomDimensions(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm text-foreground">
                Usar dimensões personalizadas
              </span>
            </label>

            {useCustomDimensions && (
              <div className="grid grid-cols-3 gap-3 p-3 bg-muted/50 rounded-xl">
                <div>
                  <Label className="text-xs">Altura (cm)</Label>
                  <Input
                    type="number"
                    value={customDimensions.height}
                    onChange={(e) => setCustomDimensions(prev => ({ ...prev, height: Number(e.target.value) }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Largura (cm)</Label>
                  <Input
                    type="number"
                    value={customDimensions.width}
                    onChange={(e) => setCustomDimensions(prev => ({ ...prev, width: Number(e.target.value) }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Profundidade (cm)</Label>
                  <Input
                    type="number"
                    value={customDimensions.depth}
                    onChange={(e) => setCustomDimensions(prev => ({ ...prev, depth: Number(e.target.value) }))}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Airline Selection */}
          <div className="space-y-3">
            <Label htmlFor="airline">Companhia aérea</Label>
            <select
              id="airline"
              value={selectedAirline}
              onChange={(e) => setSelectedAirline(e.target.value)}
              className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-foreground"
            >
              {AIRLINES.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <div className="p-3 bg-muted/50 rounded-xl">
              <p className="text-sm text-muted-foreground">
                Limite de peso: <span className="font-medium text-foreground">{weightLimit}kg</span>
                {' '}({isCarryOn ? 'bagagem de mão' : 'despachada'})
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="flex-1">
            Adicionar Bagagem
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddLuggageModal;
