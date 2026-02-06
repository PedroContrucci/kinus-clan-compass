// Itinerary Detail Modal — Full itinerary with day breakdown, budget, comments
import { useState, useMemo } from 'react';
import { X, Star, MapPin, Clock, DollarSign, Heart, Copy, ChevronLeft, ChevronRight, Bookmark, Plane, Hotel, Utensils, Sparkles, MessageCircle, Send, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';

interface ItineraryDetailModalProps {
  itinerary: {
    id: string;
    title: string;
    description: string | null;
    cover_image_url: string | null;
    duration_days: number | null;
    estimated_budget_brl: number | null;
    likes_count: number | null;
    copies_count: number | null;
    travel_style: string | null;
    tags: string[] | null;
    destination_city?: { name_pt: string } | null;
    destination_country?: { name_pt: string } | null;
  } | null;
  activities?: any[];
  isOpen: boolean;
  onClose: () => void;
  onCopyToTrip?: (itinerary: any) => void;
}

// Mock day breakdown data (in real app, fetch from related activities)
const mockDayBreakdown = (days: number) => {
  const activities = [
    { day: 1, title: 'Chegada e Check-in', description: 'Chegada no aeroporto, transfer para hotel, descanso', icon: '✈️' },
    { day: 1, title: 'Jantar de boas-vindas', description: 'Restaurante tradicional local', icon: '🍜' },
    { day: 2, title: 'Exploração Matinal', description: 'Visita aos principais pontos turísticos', icon: '🏛️' },
    { day: 2, title: 'Almoço Local', description: 'Culinária típica da região', icon: '🍱' },
    { day: 2, title: 'Tarde Cultural', description: 'Museu ou experiência cultural', icon: '🎭' },
  ];
  
  const result: Record<number, typeof activities> = {};
  for (let d = 1; d <= days; d++) {
    result[d] = activities.filter(a => a.day <= 2).map(a => ({ ...a, day: d }));
    if (d === days) {
      result[d] = [
        { day: d, title: 'Check-out e Despedida', description: 'Últimas compras e transfer ao aeroporto', icon: '✈️' },
      ];
    }
  }
  return result;
};

// Mock comments
const mockComments = [
  {
    id: '1',
    author: 'Marina S.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    date: '2 dias atrás',
    text: 'Roteiro incrível! Segui exatamente assim e foi perfeito. Recomendo adicionar o mercado de rua no dia 3.',
    likes: 12,
  },
  {
    id: '2',
    author: 'Pedro L.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    date: '1 semana atrás',
    text: 'Usei esse roteiro na minha viagem de lua de mel. Perfeito para casais!',
    likes: 8,
  },
];

// Budget breakdown percentages (mock)
const budgetBreakdown = {
  voos: 0.40,
  hospedagem: 0.30,
  experiencias: 0.18,
  alimentacao: 0.12,
};

export const ItineraryDetailModal = ({ 
  itinerary, 
  activities = [],
  isOpen, 
  onClose, 
  onCopyToTrip 
}: ItineraryDetailModalProps) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showFullGallery, setShowFullGallery] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const dayBreakdown = useMemo(() => 
    mockDayBreakdown(itinerary?.duration_days || 7), 
    [itinerary?.duration_days]
  );

  if (!itinerary) return null;

  const budget = itinerary.estimated_budget_brl || 0;
  const budgetItems = [
    { icon: '✈️', label: 'Voos', value: budget * budgetBreakdown.voos },
    { icon: '🏨', label: 'Hospedagem', value: budget * budgetBreakdown.hospedagem },
    { icon: '🎭', label: 'Experiências', value: budget * budgetBreakdown.experiencias },
    { icon: '🍜', label: 'Alimentação', value: budget * budgetBreakdown.alimentacao },
  ];

  const photos = [
    itinerary.cover_image_url || 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200',
    'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200',
    'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200',
  ];

  const handleCopyToTrip = () => {
    toast.success('Roteiro copiado!', {
      description: 'O roteiro completo foi adicionado às suas viagens.',
    });
    onCopyToTrip?.(itinerary);
    onClose();
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    toast.success(isSaved ? 'Removido dos favoritos' : 'Salvo nos favoritos!');
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const styleLabels: Record<string, { label: string; emoji: string }> = {
    cultural: { label: 'Cultural', emoji: '🏛️' },
    adventure: { label: 'Aventura', emoji: '🧗' },
    relaxed: { label: 'Relaxado', emoji: '🌴' },
    romantic: { label: 'Romântico', emoji: '💕' },
    family: { label: 'Família', emoji: '👨‍👩‍👧‍👦' },
  };

  const style = itinerary.travel_style ? styleLabels[itinerary.travel_style] : null;

  const nextPhoto = () => setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  const prevPhoto = () => setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-card border-border max-w-2xl p-0 overflow-hidden max-h-[95vh] flex flex-col">
          {/* Hero Image */}
          <div className="relative h-64 md:h-80 flex-shrink-0">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentPhotoIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                src={photos[currentPhotoIndex]}
                alt={itinerary.title}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setShowFullGallery(true)}
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/20" />

            {/* Navigation */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                >
                  <ChevronLeft size={20} className="text-white" />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                >
                  <ChevronRight size={20} className="text-white" />
                </button>
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-1">
                  {photos.map((_, idx) => (
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

            {/* Badges */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              {style && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full">
                  <span>{style.emoji}</span>
                  <span className="text-sm font-medium text-white">{style.label}</span>
                </span>
              )}
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/90 rounded-full">
                <Calendar size={14} className="text-primary-foreground" />
                <span className="text-sm font-medium text-primary-foreground">{itinerary.duration_days} dias</span>
              </span>
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            >
              <X size={20} className="text-white" />
            </button>

            {/* Title on image */}
            <div className="absolute bottom-4 left-4 right-4">
              <h2 className="text-2xl md:text-3xl font-bold text-white font-['Outfit'] leading-tight">
                {itinerary.title}
              </h2>
              <p className="text-white/80 flex items-center gap-1 mt-1">
                <MapPin size={14} />
                {itinerary.destination_city?.name_pt}, {itinerary.destination_country?.name_pt}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-5 space-y-6">
              {/* Tags */}
              {itinerary.tags && itinerary.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {itinerary.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-sm px-3 py-1 bg-primary/10 text-primary rounded-full font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              {itinerary.description && (
                <p className="text-muted-foreground leading-relaxed">
                  {itinerary.description}
                </p>
              )}

              {/* Budget Breakdown */}
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    💰 Orçamento Estimado
                  </h3>
                  <span className="text-2xl font-bold text-primary font-['Outfit']">
                    R$ {budget.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {budgetItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-background/50 rounded-xl p-3">
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className="font-semibold text-foreground font-['Outfit']">
                          R$ {item.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Day by Day */}
              <div>
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  📅 Dia a Dia
                </h3>
                <Accordion type="single" collapsible className="space-y-2">
                  {Object.entries(dayBreakdown).slice(0, 5).map(([day, items]) => (
                    <AccordionItem key={day} value={`day-${day}`} className="border border-border rounded-xl overflow-hidden">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                        <span className="font-medium">
                          Dia {day}: {items[0]?.title || 'Exploração'}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-3">
                          {items.map((activity, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                              <span className="text-xl">{activity.icon}</span>
                              <div>
                                <p className="font-medium text-foreground">{activity.title}</p>
                                <p className="text-sm text-muted-foreground">{activity.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              {/* Comments */}
              <div>
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MessageCircle size={18} />
                  Comentários do Clã ({mockComments.length})
                </h3>
                <div className="space-y-4">
                  {mockComments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <img
                        src={comment.avatar}
                        alt={comment.author}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{comment.author}</span>
                          <span className="text-xs text-muted-foreground">{comment.date}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{comment.text}</p>
                        <button className="flex items-center gap-1 text-xs text-muted-foreground mt-2 hover:text-foreground">
                          <Heart size={12} />
                          {comment.likes}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add comment */}
                <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-medium">V</span>
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      placeholder="Adicione um comentário..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 bg-muted rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button className="p-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors">
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 border-t border-border flex gap-3 flex-shrink-0 bg-card">
            <button
              onClick={handleLike}
              className={`p-3 rounded-xl border transition-colors ${
                isLiked 
                  ? 'bg-red-500/10 border-red-500/30 text-red-500' 
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <Heart size={20} className={isLiked ? 'fill-current' : ''} />
            </button>
            <button
              onClick={handleSave}
              className={`p-3 rounded-xl border transition-colors ${
                isSaved 
                  ? 'bg-primary/10 border-primary/30 text-primary' 
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <Bookmark size={20} className={isSaved ? 'fill-current' : ''} />
            </button>
            <button
              onClick={handleCopyToTrip}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              <Copy size={18} />
              Copiar Roteiro para Minha Viagem
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
              src={photos[currentPhotoIndex]}
              alt=""
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {photos.length > 1 && (
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ItineraryDetailModal;
