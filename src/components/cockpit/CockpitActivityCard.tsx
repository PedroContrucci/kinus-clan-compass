import { useState } from 'react';
import { Clock, Tag, Check, FileText } from 'lucide-react';
import { TripActivity, ActivityStatus } from '@/types/trip';
import ConfirmActivityModal from './ConfirmActivityModal';

interface CockpitActivityCardProps {
  activity: TripActivity;
  dayIndex: number;
  actIndex: number;
  onActivateAuction: (activity: TripActivity, dayIndex: number, actIndex: number) => void;
  onConfirm: (activityId: string, data: { amount: number; link?: string; date?: string }) => void;
}

const CockpitActivityCard = ({ 
  activity, 
  dayIndex, 
  actIndex, 
  onActivateAuction, 
  onConfirm 
}: CockpitActivityCardProps) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const getStatusBadge = () => {
    switch (activity.status) {
      case 'confirmed':
        return <span className="status-badge confirmed">🟢 Confirmado</span>;
      case 'bidding':
        return <span className="status-badge bidding">🟡 Em Leilão</span>;
      case 'cancelled':
        return <span className="status-badge cancelled">🔴 Cancelado</span>;
      default:
        return <span className="status-badge pending">⚪ Pendente</span>;
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

  return (
    <>
      <div className={`cockpit-card status-${activity.status}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{getActivityIcon(activity.type)}</span>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock size={14} />
              {activity.time}
            </span>
          </div>
          {getStatusBadge()}
        </div>
        
        <div className="mb-3">
          <h4 className="font-medium text-foreground font-['Outfit']">{activity.name}</h4>
          <p className="text-sm text-muted-foreground">{activity.description}</p>
        </div>
        
        {/* Cost */}
        <div className="mb-3">
          {activity.status === 'confirmed' && activity.paidAmount ? (
            <div className="flex items-center gap-2">
              <span className="text-primary font-semibold font-['Outfit']">
                💰 R$ {activity.paidAmount.toLocaleString()}
              </span>
              {activity.paidAmount < activity.cost && (
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                  💚 Economizou R$ {(activity.cost - activity.paidAmount).toLocaleString()}
                </span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground font-['Outfit']">
              💰 R$ {activity.cost.toLocaleString()} <span className="text-xs">(estimado)</span>
            </span>
          )}
        </div>
        
        {/* Actions based on status */}
        <div className="flex gap-2 flex-wrap">
          {(activity.status === 'planned' || !activity.status) && (
            <>
              <button 
                onClick={() => onActivateAuction(activity, dayIndex, actIndex)}
                className="btn-auction"
              >
                <Tag size={14} />
                🏷️ Ativar Leilão
              </button>
              <button 
                onClick={() => setShowConfirm(true)}
                className="btn-confirm-activity"
              >
                <Check size={14} />
                ✅ Já Reservei
              </button>
            </>
          )}
          
          {activity.status === 'bidding' && (
            <>
              <button 
                onClick={() => onActivateAuction(activity, dayIndex, actIndex)}
                className="btn-auction active"
              >
                <Tag size={14} />
                🏷️ Ver Leilão
              </button>
              <button 
                onClick={() => setShowConfirm(true)}
                className="btn-confirm-activity"
              >
                <Check size={14} />
                ✅ Fechar Negócio
              </button>
            </>
          )}
          
          {activity.status === 'confirmed' && activity.confirmationLink && (
            <a 
              href={activity.confirmationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-voucher"
            >
              <FileText size={14} />
              📎 Ver Comprovante
            </a>
          )}
        </div>
      </div>
      
      {/* Confirm Modal */}
      {showConfirm && (
        <ConfirmActivityModal
          activity={activity}
          onClose={() => setShowConfirm(false)}
          onConfirm={(data) => {
            onConfirm(activity.id, data);
            setShowConfirm(false);
          }}
        />
      )}
    </>
  );
};

export default CockpitActivityCard;
