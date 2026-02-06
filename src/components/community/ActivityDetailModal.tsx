// Activity Detail Modal with full information and photo gallery
import { useState } from 'react';
import { X, Star, MapPin, Clock, DollarSign, Plus, ChevronLeft, ChevronRight, Copy, ExternalLink, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Photo {
  id: string;
  url: string;
  thumbnail_url: string | null;
  caption: string | null;
}

interface ActivityDetailModalProps {
  activity: {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    estimated_cost_brl: number | null;
    cost_level: string | null;
    rating_average: number | null;
    rating_count: number | null;
    duration_minutes: number | null;
    is_top_pick: boolean | null;
    best_time_to_visit: string | null;
    tips: string[] | null;
    address: string | null;
    phone: string | null;
    website_url: string | null;
    city?: { name_pt: string } | null;
    country?: { name_pt: string } | null;
  } | null;
  photos?: Photo[];
  isOpen: boolean;
  onClose: () => void;
  onAddToTrip?: (activity: any) => void;
}

const defaultImages: Record<string, string[]> = {
  restaurant: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200',
  ],
  hotel: [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200',
  ],
  experience: [
    'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=1200',
    'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=1200',
    'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200',
  ],
  default: [
    'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1200',
  ],
};

export const ActivityDetailModal = ({ 
  activity, 
  photos = [], 
  isOpen, 
  onClose, 
  onAddToTrip 
}: ActivityDetailModalProps) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showFullGallery, setShowFullGallery] = useState(false);

  if (!activity) return null;

  const allPhotos = photos.length > 0 
    ? photos.map(p => ({ url: p.url, caption: p.caption }))
    : (defaultImages[activity.category || 'default'] || defaultImages.default).map(url => ({ url, caption: null }));

  const handleAddToTrip = () => {
    // Save to localStorage for now
    const savedActivities = JSON.parse(localStorage.getItem('kinu_saved_activities') || '[]');
    if (!savedActivities.find((a: any) => a.id === activity.id)) {
      savedActivities.push(activity);
      localStorage.setItem('kinu_saved_activities', JSON.stringify(savedActivities));
      toast.success('Adicionado à sua viagem!', {
        description: 'Esta atividade foi salva no seu roteiro.',
      });
    } else {
      toast.info('Já está no seu roteiro!');
    }
    onAddToTrip?.(activity);
  };

  const nextPhoto = () => setCurrentPhotoIndex((prev) => (prev + 1) % allPhotos.length);
  const prevPhoto = () => setCurrentPhotoIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-card border-border max-w-lg p-0 overflow-hidden max-h-[90vh] flex flex-col">
          {/* Photo Gallery */}
          <div className="relative h-56 flex-shrink-0">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentPhotoIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                src={allPhotos[currentPhotoIndex]?.url}
                alt={activity.title}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setShowFullGallery(true)}
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

            {/* Navigation Arrows */}
            {allPhotos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                >
                  <ChevronLeft size={20} className="text-white" />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                >
                  <ChevronRight size={20} className="text-white" />
                </button>

                {/* Photo Indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                  {allPhotos.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPhotoIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        idx === currentPhotoIndex ? 'bg-white' : 'bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Badges on photo */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              {activity.is_top_pick && (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-primary/90 rounded-full">
                  <Sparkles size={12} className="text-primary-foreground" />
                  <span className="text-xs font-medium text-primary-foreground">Top Pick</span>
                </span>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            >
              <X size={18} className="text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Header */}
            <div>
              <h2 className="text-xl font-bold text-foreground font-['Outfit']">{activity.title}</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin size={12} />
                {activity.city?.name_pt}, {activity.country?.name_pt}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-muted/50 rounded-xl">
              {activity.estimated_cost_brl && (
                <div className="text-center">
                  <DollarSign size={18} className="mx-auto text-primary mb-1" />
                  <p className="text-sm font-semibold text-foreground font-['Outfit']">
                    R$ {activity.estimated_cost_brl.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Custo médio</p>
                </div>
              )}
              {activity.duration_minutes && (
                <div className="text-center">
                  <Clock size={18} className="mx-auto text-accent mb-1" />
                  <p className="text-sm font-semibold text-foreground font-['Outfit']">
                    {formatDuration(activity.duration_minutes)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Duração</p>
                </div>
              )}
              {activity.rating_average && (
                <div className="text-center">
                  <Star size={18} className="mx-auto text-yellow-500 fill-yellow-500 mb-1" />
                  <p className="text-sm font-semibold text-foreground font-['Outfit']">
                    {activity.rating_average.toFixed(1)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {activity.rating_count || 0} avaliações
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            {activity.description && (
              <div>
                <h3 className="font-medium text-foreground mb-2">Sobre</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {activity.description}
                </p>
              </div>
            )}

            {/* Tips */}
            {activity.tips && activity.tips.length > 0 && (
              <div>
                <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                  💡 Dicas do Clã
                </h3>
                <ul className="space-y-2">
                  {activity.tips.map((tip, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Best time */}
            {activity.best_time_to_visit && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl">
                <Clock size={16} className="text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Melhor horário</p>
                  <p className="text-sm font-medium text-foreground">{activity.best_time_to_visit}</p>
                </div>
              </div>
            )}

            {/* Contact Info */}
            {(activity.address || activity.phone || activity.website_url) && (
              <div className="space-y-2">
                <h3 className="font-medium text-foreground mb-2">Informações</h3>
                {activity.address && (
                  <p className="text-sm text-muted-foreground flex items-start gap-2">
                    <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                    {activity.address}
                  </p>
                )}
                {activity.website_url && (
                  <a
                    href={activity.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary flex items-center gap-2 hover:underline"
                  >
                    <ExternalLink size={14} />
                    Visitar site
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-4 border-t border-border flex gap-3 flex-shrink-0">
            <button
              onClick={handleAddToTrip}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus size={18} />
              Adicionar à Viagem
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Gallery */}
      <AnimatePresence>
        {showFullGallery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
            onClick={() => setShowFullGallery(false)}
          >
            <button
              onClick={() => setShowFullGallery(false)}
              className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
            >
              <X size={24} className="text-white" />
            </button>

            <img
              src={allPhotos[currentPhotoIndex]?.url}
              alt=""
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {allPhotos.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  <ChevronLeft size={32} className="text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  <ChevronRight size={32} className="text-white" />
                </button>
              </>
            )}

            {allPhotos[currentPhotoIndex]?.caption && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 rounded-full">
                <p className="text-white text-sm">{allPhotos[currentPhotoIndex].caption}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

function formatDuration(minutes: number): string {
  if (minutes >= 1440) {
    const days = Math.floor(minutes / 1440);
    return `${days} dia${days > 1 ? 's' : ''}`;
  }
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}m` : `${hours}h`;
  }
  return `${minutes}min`;
}

export default ActivityDetailModal;
