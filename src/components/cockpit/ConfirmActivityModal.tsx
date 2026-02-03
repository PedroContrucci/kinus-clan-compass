import { useState } from 'react';
import { X } from 'lucide-react';
import { TripActivity } from '@/types/trip';

interface ConfirmActivityModalProps {
  activity: TripActivity;
  onClose: () => void;
  onConfirm: (data: { amount: number; link?: string; date?: string }) => void;
}

const ConfirmActivityModal = ({ activity, onClose, onConfirm }: ConfirmActivityModalProps) => {
  const [amount, setAmount] = useState(activity.cost.toString());
  const [link, setLink] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const parsedAmount = parseFloat(amount) || 0;
  const savings = activity.cost - parsedAmount;
  const hasSavings = savings > 0;

  const handleSubmit = () => {
    onConfirm({
      amount: parsedAmount,
      link: link || undefined,
      date,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground font-['Outfit']">
            ✅ CONFIRMAR RESERVA
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-xl p-3">
            <p className="text-sm text-muted-foreground">Atividade:</p>
            <p className="text-foreground font-medium">{activity.name}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Valor estimado: R$ {activity.cost.toLocaleString()}
            </p>
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              Quanto você pagou?
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="0"
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              Link do comprovante/voucher (opcional)
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://..."
            />
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              Data da reserva
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          {hasSavings && (
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-3">
              <p className="text-primary font-medium">
                💚 Economia: R$ {savings.toLocaleString()} em relação ao estimado!
              </p>
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-muted text-muted-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 px-4 btn-primary font-medium"
            >
              ✅ Confirmar Reserva
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmActivityModal;
