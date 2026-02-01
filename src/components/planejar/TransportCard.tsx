import { format } from 'date-fns';
import { RotateCcw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransportOption {
  id: string;
  type: 'metro' | 'taxi' | 'walk' | 'bus' | 'train';
  icon: string;
  name: string;
  duration: string;
  priceEUR: number;
  priceBRL: number;
  note?: string;
  isRecommended?: boolean;
}

interface TransportCardProps {
  time: string;
  date: Date;
  origin: string;
  destination: string;
  options: TransportOption[];
  selectedOptionId: string;
  onSelectOption: (optionId: string) => void;
  travelers: number;
  clanTip?: { text: string; author: string };
}

export const TransportCard = ({
  time,
  date,
  origin,
  destination,
  options,
  selectedOptionId,
  onSelectOption,
  travelers,
  clanTip,
}: TransportCardProps) => {
  const selectedOption = options.find(o => o.id === selectedOptionId);
  
  return (
    <div className="bg-card border border-border rounded-2xl p-4 transition-all hover:border-primary/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>🚕 {time}</span>
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
            {format(date, 'EEE dd/MM')}
          </span>
        </div>
      </div>
      
      {/* Route */}
      <h4 className="font-semibold text-foreground font-['Outfit'] mb-4">
        Transfer: {origin} → {destination}
      </h4>
      
      {/* Options */}
      <div className="bg-muted/30 rounded-xl p-3 mb-4">
        <div className="text-sm font-medium text-foreground mb-3">Opções:</div>
        <div className="space-y-2">
          {options.map((option) => {
            const isSelected = option.id === selectedOptionId;
            return (
              <button
                key={option.id}
                onClick={() => onSelectOption(option.id)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg transition-all text-left",
                  isSelected 
                    ? "bg-primary/20 border border-primary" 
                    : "bg-background border border-border hover:border-primary/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{option.icon}</span>
                  <div>
                    <div className="font-medium text-foreground text-sm">{option.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {option.duration}
                      {option.note && <span> • {option.note}</span>}
                      {option.isRecommended && (
                        <span className="text-[#eab308] ml-1">⭐</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {option.priceEUR > 0 ? (
                    <>
                      <div className="text-sm font-medium text-foreground">
                        €{option.priceEUR}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        R$ {option.priceBRL}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm font-medium text-primary">Grátis</div>
                  )}
                </div>
                {isSelected && (
                  <Check size={16} className="text-primary ml-2" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Clan Tip */}
      {clanTip && (
        <div className="bg-[#eab308]/10 border-l-2 border-[#eab308] rounded-r-lg p-3 mb-3">
          <p className="text-foreground text-sm">
            💡 {clanTip.text} — {clanTip.author} 🌿
          </p>
        </div>
      )}
      
      {/* Selected Summary */}
      {selectedOption && (
        <div className="flex items-center justify-between text-sm pt-3 border-t border-border">
          <span className="text-muted-foreground">
            Selecionado: {selectedOption.icon} {selectedOption.name}
          </span>
          <span className="font-medium text-foreground">
            R$ {selectedOption.priceBRL * travelers} ({travelers} pessoas)
          </span>
        </div>
      )}
      
      {/* Change Option */}
      <button className="flex items-center gap-1 mt-3 text-xs text-muted-foreground hover:text-primary transition-colors">
        <RotateCcw size={12} />
        Mudar opção
      </button>
    </div>
  );
};

export default TransportCard;
