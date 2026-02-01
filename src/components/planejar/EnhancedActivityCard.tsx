import { format } from 'date-fns';
import { Tag, Pin, RotateCcw, Trash2, Plus, MapPin, Star, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActivityIntensity, getIntensityBadge, ACTIVITY_IMAGES } from '@/types/trip';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface CostItem {
  name: string;
  unitPrice: number;
  quantity: number;
  currency?: string;
}

interface EnhancedActivityCardProps {
  activity: {
    id: string;
    time: string;
    endTime?: string;
    name: string;
    description: string;
    duration: string;
    type: string;
    intensity: ActivityIntensity;
    cost: {
      items: CostItem[];
      total: number;
      totalBRL: number;
      currency: string;
    };
    status: 'planned' | 'pinned' | 'bidding' | 'confirmed';
    rating?: number;
    reviewCount?: number;
    distanceFromHotel?: string;
    clanTip?: { text: string; author: string };
    auctionOffer?: { label: string; price: string };
  };
  date: Date;
  isPinned: boolean;
  isJetLagFriendly: boolean;
  onTogglePin: () => void;
  onOpenAuction: () => void;
  onSwap?: () => void;
  onRemove?: () => void;
}

export const getActivityImage = (name: string, type: string): string => {
  const nameKey = name.toLowerCase()
    .replace(/torre eiffel/i, 'torre-eiffel')
    .replace(/louvre/i, 'louvre')
    .replace(/montmartre/i, 'montmartre')
    .replace(/cruzeiro.*sena/i, 'sena-cruzeiro')
    .replace(/notre.?dame/i, 'notre-dame')
    .replace(/versailles|versalhes/i, 'versailles')
    .replace(/marais/i, 'marais')
    .replace(/café|cafe|coffee/i, 'cafe-paris')
    .replace(/hotel|check.?in/i, 'hotel')
    .replace(/transfer|taxi|uber/i, 'transfer')
    .replace(/restaurante|jantar|almoço|breizh|ristorante|trattoria/i, 'restaurante')
    .replace(/aeroporto|cdg|gru|fiumicino/i, 'aeroporto')
    .replace(/shibuya/i, 'shibuya')
    .replace(/senso.?ji/i, 'senso-ji')
    .replace(/meiji/i, 'meiji')
    .replace(/belém|belem/i, 'belem')
    .replace(/alfama/i, 'alfama')
    // Roma specific
    .replace(/vaticano|vatican/i, 'vaticano')
    .replace(/capela sistina|sistine/i, 'capela-sistina')
    .replace(/basílica.*pedro|st.*peter/i, 'basilica-sao-pedro')
    .replace(/museus.*vaticano|vatican.*museum/i, 'museus-vaticano')
    .replace(/coliseu|colosseum|colosseo/i, 'coliseu')
    .replace(/forum.*romano|roman.*forum/i, 'forum-romano')
    .replace(/palatino|palatine/i, 'palatino')
    .replace(/trastevere/i, 'trastevere')
    .replace(/villa.*este|villa d'este/i, 'villa-este')
    .replace(/villa.*adriana|hadrian/i, 'villa-adriana')
    .replace(/fontana.*trevi|trevi.*fountain/i, 'fontana-trevi')
    .replace(/piazza.*navona/i, 'piazza-navona')
    .replace(/panteão|pantheon|panteao/i, 'panteao')
    .replace(/escadaria.*espanhola|spanish.*steps/i, 'escadaria-espanhola')
    .replace(/castel.*sant.*angelo/i, 'castel-santangelo')
    .replace(/via.*del.*corso/i, 'via-del-corso')
    .replace(/carbonara/i, 'carbonara')
    .replace(/cacio.*pepe/i, 'cacio-pepe')
    .replace(/gelato|sorvete/i, 'gelato-roma')
    .replace(/pizza/i, 'pizza-roma')
    .replace(/pasta|massa/i, 'pasta-roma');
  
  for (const key of Object.keys(ACTIVITY_IMAGES)) {
    if (nameKey.includes(key)) {
      return ACTIVITY_IMAGES[key];
    }
  }
  
  // Fallback by type
  if (type === 'food') return ACTIVITY_IMAGES['restaurante'];
  if (type === 'relax') return ACTIVITY_IMAGES['hotel'];
  if (type === 'transport') return ACTIVITY_IMAGES['transfer'];
  
  return ACTIVITY_IMAGES['default'];
};

export const getActivityIcon = (type: string) => {
  switch (type) {
    case 'food': return '🍽️';
    case 'culture': return '🏛️';
    case 'transport': return '🚕';
    case 'photo': return '📸';
    case 'relax': return '🏨';
    case 'attraction': return '🎯';
    default: return '📍';
  }
};

export const EnhancedActivityCard = ({
  activity,
  date,
  isPinned,
  isJetLagFriendly,
  onTogglePin,
  onOpenAuction,
  onSwap,
  onRemove,
}: EnhancedActivityCardProps) => {
  const intensityBadge = getIntensityBadge(activity.intensity);
  const activityImage = getActivityImage(activity.name, activity.type);
  
  const statusColors = {
    planned: { border: 'border-border', label: '⚪ Planejado' },
    pinned: { border: 'border-primary ring-2 ring-primary/30', label: '📌 Fixado' },
    bidding: { border: 'border-[#eab308]', label: '🟡 Em Leilão' },
    confirmed: { border: 'border-primary', label: '🟢 Confirmado' },
  };
  
  const status = statusColors[isPinned ? 'pinned' : activity.status];

  return (
    <div 
      className={cn(
        "bg-card border rounded-2xl overflow-hidden transition-all hover:border-primary/50",
        status.border
      )}
    >
      {/* Activity Image */}
      <div className="relative">
        <AspectRatio ratio={16 / 9}>
          <img 
            src={activityImage} 
            alt={activity.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </AspectRatio>
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        
        {/* Badges overlay */}
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
          {/* Intensity Badge */}
          <span className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            intensityBadge.bgColor, intensityBadge.textColor
          )}>
            {intensityBadge.icon} {intensityBadge.label}
          </span>
          
          {/* Jet Lag Friendly Badge */}
          {isJetLagFriendly && (activity.intensity === 'light' || activity.intensity === 'moderate') && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/30 text-emerald-300">
              🧘 Jet Lag Friendly
            </span>
          )}
        </div>
        
        {/* Pinned indicator */}
        {isPinned && (
          <div className="absolute top-3 right-3">
            <span className="text-xs bg-primary text-white px-2 py-1 rounded-full flex items-center gap-1">
              <Pin size={10} /> Fixado
            </span>
          </div>
        )}
        
        {/* Time & Date overlay */}
        <div className="absolute bottom-3 left-3 flex items-center gap-3">
          <span className="text-white text-lg font-semibold font-['Outfit'] flex items-center gap-1">
            {getActivityIcon(activity.type)} {activity.time}
            {activity.endTime && <span className="text-sm font-normal"> - {activity.endTime}</span>}
          </span>
          <span className="text-white/70 text-sm bg-black/30 px-2 py-0.5 rounded-full">
            {format(date, 'EEE dd/MM')}
          </span>
        </div>
      </div>
      
      {/* Activity Content */}
      <div className="p-4">
        {/* Title & Rating */}
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-foreground font-['Outfit'] text-lg">
            {activity.name}
          </h4>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3">{activity.description}</p>
        
        {/* Meta info */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 flex-wrap">
          <span className="flex items-center gap-1">
            <Clock size={12} /> {activity.duration}
          </span>
          {activity.rating && (
            <span className="flex items-center gap-1">
              <Star size={12} className="text-[#eab308]" /> {activity.rating} ({activity.reviewCount} reviews)
            </span>
          )}
          {activity.distanceFromHotel && (
            <span className="flex items-center gap-1">
              <MapPin size={12} /> {activity.distanceFromHotel} do hotel
            </span>
          )}
        </div>
        
        {/* Cost Breakdown */}
        {activity.cost.items.length > 0 && (
          <div className="bg-muted/30 rounded-xl p-3 mb-3">
            <div className="flex items-center gap-1 text-sm font-medium text-foreground mb-2">
              💰 CUSTO
            </div>
            <div className="space-y-1 text-sm">
              {activity.cost.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-muted-foreground">
                  <span>{item.name}</span>
                  <span>
                    {item.currency || '€'}{item.unitPrice} × {item.quantity} = {item.currency || '€'}{item.unitPrice * item.quantity}
                    <span className="text-foreground ml-1">
                      (R$ {Math.round(item.unitPrice * item.quantity * 5.6)})
                    </span>
                  </span>
                </div>
              ))}
              <div className="border-t border-border pt-2 mt-2 flex justify-between font-medium text-foreground">
                <span>Total atividade:</span>
                <span>R$ {activity.cost.totalBRL.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Simple cost display */}
        {activity.cost.items.length === 0 && activity.cost.totalBRL > 0 && (
          <div className="flex items-center justify-between mb-3 text-sm">
            <span className="text-muted-foreground">💰 Custo estimado:</span>
            <span className="font-medium text-primary">R$ {activity.cost.totalBRL.toLocaleString()}</span>
          </div>
        )}
        
        {activity.cost.totalBRL === 0 && (
          <div className="flex items-center gap-2 mb-3 text-sm text-primary">
            💰 Gratuito
          </div>
        )}
        
        {/* Clan Tip */}
        {activity.clanTip && (
          <div className="bg-[#eab308]/10 border-l-2 border-[#eab308] rounded-r-lg p-3 mb-3">
            <p className="text-foreground text-sm">
              💡 <span className="text-[#eab308] font-medium">Dica de Ouro:</span>{' '}
              {activity.clanTip.text} — {activity.clanTip.author}
            </p>
          </div>
        )}
        
        {/* Activity Actions */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={onTogglePin}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors",
              isPinned
                ? "bg-primary text-white"
                : "bg-background border border-border text-foreground hover:border-primary"
            )}
          >
            <Pin size={12} />
            {isPinned ? 'Fixado' : 'Fixar'}
          </button>
          
          <button
            onClick={onOpenAuction}
            className="flex items-center gap-1 px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground hover:border-primary transition-colors"
          >
            <Tag size={12} />
            {activity.auctionOffer ? `Ver Ofertas — ${activity.auctionOffer.label}` : 'Ver Ofertas'}
          </button>
          
          {onSwap && (
            <button 
              onClick={onSwap}
              className="flex items-center gap-1 px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground hover:border-primary transition-colors"
            >
              <RotateCcw size={12} />
              Trocar
            </button>
          )}
          
          {onRemove && (
            <button 
              onClick={onRemove}
              className="flex items-center gap-1 px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground hover:border-destructive/50 transition-colors"
            >
              <Trash2 size={12} />
            </button>
          )}
          
          <button className="flex items-center gap-1 px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground hover:border-primary transition-colors">
            <Plus size={12} />
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedActivityCard;
