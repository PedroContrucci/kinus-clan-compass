import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Star, Clock, Euro, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { destinations } from '@/data/destinations';
import { useAuth } from '@/hooks/useAuth';

const DestinationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [selectedDay, setSelectedDay] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);

  const destination = destinations.find((d) => d.id === id);

  // Guard assíncrono (recon §4): o `!authLoading` é o que impede o flash de
  // logout no reload — antes esta leitura era síncrona no localStorage.
  useEffect(() => {
    if (!user && !authLoading) navigate('/');
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <p className="text-[#94a3b8]">Destino não encontrado</p>
      </div>
    );
  }

  const handleDayChange = (day: number) => {
    if (day === selectedDay) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedDay(day);
      setIsTransitioning(false);
    }, 150);
  };

  const scrollGallery = (direction: 'left' | 'right') => {
    if (galleryRef.current) {
      const scrollAmount = 200;
      galleryRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const currentDay = destination.itinerary.find((d) => d.day === selectedDay);

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
    <div className="min-h-screen bg-[#0f172a]">
      {/* Hero */}
      <div className="relative h-72 md:h-96">
        <img
          src={destination.heroImage}
          alt={destination.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/40 to-transparent" />
        
        {/* Header buttons */}
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <button
            onClick={() => navigate('/cla')}
            className="p-2 bg-[#0f172a]/50 backdrop-blur-sm rounded-full transition-colors hover:bg-[#0f172a]/70"
          >
            <ArrowLeft size={24} className="text-[#f8fafc]" />
          </button>
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="p-2 bg-[#0f172a]/50 backdrop-blur-sm rounded-full transition-colors hover:bg-[#0f172a]/70"
          >
            <Heart
              size={24}
              className={isFavorite ? 'text-red-500 fill-red-500' : 'text-[#f8fafc]'}
            />
          </button>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-3xl font-bold font-['Outfit'] text-[#f8fafc]">
            {destination.emoji} {destination.name}, {destination.country}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <SummaryCard icon="📅" label="Duração" value={`${destination.duration} dias`} />
          <SummaryCard icon="💰" label="Orçamento" value={`R$ ${destination.avgBudget.toLocaleString()}`} />
          <SummaryCard
            icon="⭐"
            label="Avaliação"
            value={`${destination.rating} (${(destination.reviewCount / 1000).toFixed(1)}k)`}
          />
          <SummaryCard icon="🎯" label="Destaque" value={destination.highlight} />
        </div>

        {/* Tags */}
        <div className="flex gap-2 mb-6">
          {destination.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-[#1e293b] border border-[#334155] rounded-full text-sm text-[#94a3b8] font-['Plus_Jakarta_Sans']"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Gallery */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 font-['Outfit'] text-[#f8fafc]">📸 Galeria</h2>
          <div className="relative">
            <button
              onClick={() => scrollGallery('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-[#0f172a]/80 rounded-full hover:bg-[#0f172a] transition-colors"
            >
              <ChevronLeft size={20} className="text-[#f8fafc]" />
            </button>
            <div
              ref={galleryRef}
              className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide"
            >
              {destination.galleryImages.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`${destination.name} ${index + 1}`}
                  className="w-40 h-28 md:w-52 md:h-36 rounded-2xl object-cover flex-shrink-0 border border-[#334155]"
                />
              ))}
            </div>
            <button
              onClick={() => scrollGallery('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-[#0f172a]/80 rounded-full hover:bg-[#0f172a] transition-colors"
            >
              <ChevronRight size={20} className="text-[#f8fafc]" />
            </button>
          </div>
        </div>

        {/* Day Timeline */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4 font-['Outfit'] text-[#f8fafc]">📅 Roteiro Dia a Dia</h2>
          
          {/* Day cards - horizontal scroll */}
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
            {destination.itinerary.map((day) => (
              <button
                key={day.day}
                onClick={() => handleDayChange(day.day)}
                className={`flex-shrink-0 p-4 rounded-2xl transition-all duration-200 border ${
                  selectedDay === day.day
                    ? 'bg-[#1e293b] border-[#10b981] ring-2 ring-[#10b981]/30'
                    : 'bg-[#1e293b] border-[#334155] hover:border-[#10b981]/50'
                }`}
              >
                <div className="text-2xl mb-1">{day.icon}</div>
                <div className="font-semibold text-[#f8fafc] font-['Outfit']">Dia {day.day}</div>
                <div className="text-xs text-[#94a3b8] max-w-[80px] truncate font-['Plus_Jakarta_Sans']">
                  {day.title}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Day Details */}
        {currentDay && (
          <div
            className={`bg-[#1e293b] border border-[#334155] rounded-2xl p-4 transition-opacity duration-300 ease-out ${
              isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <h3 className="font-semibold text-lg mb-1 text-[#f8fafc] font-['Outfit']">
              Dia {currentDay.day}: {currentDay.title}
            </h3>
            <p className="text-sm text-[#94a3b8] mb-4 font-['Plus_Jakarta_Sans']">
              {currentDay.activities.length} atividades • R$ {currentDay.activities.reduce((sum, a) => sum + a.cost, 0).toLocaleString()} estimado
            </p>

            <div className="space-y-4">
              {currentDay.activities.map((activity, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="text-xl">{getActivityIcon(activity.type)}</div>
                    {index < currentDay.activities.length - 1 && (
                      <div className="w-0.5 flex-1 bg-[#334155] mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 text-sm text-[#94a3b8] mb-1 font-['Plus_Jakarta_Sans']">
                      <Clock size={14} />
                      {activity.time}
                      {activity.cost > 0 && (
                        <>
                          <span>•</span>
                          <Euro size={14} />
                          {activity.cost}
                        </>
                      )}
                    </div>
                    <h4 className="font-medium text-[#f8fafc] font-['Outfit']">{activity.name}</h4>
                    <p className="text-sm text-[#94a3b8] font-['Plus_Jakarta_Sans']">{activity.description}</p>
                    <p className="text-xs text-[#94a3b8] mt-1 font-['Plus_Jakarta_Sans']">⏱️ {activity.duration}</p>
                    
                    {activity.clanTip && (
                      <div className="mt-2 p-3 bg-[#eab308]/10 border-l-2 border-[#eab308] rounded-r-lg">
                        <p className="text-sm text-[#f8fafc] font-['Plus_Jakarta_Sans']">
                          💡 <span className="text-[#eab308] font-medium">Dica de Ouro:</span> "{activity.clanTip}" 
                          <span className="text-[#94a3b8]"> - @{activity.clanAuthor}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4 font-['Outfit'] text-[#f8fafc]">
            💬 O que o Clã diz
          </h2>
          <div className="space-y-4">
            {destination.reviews.map((review) => (
              <div
                key={review.id}
                className="bg-[#1e293b] border border-[#334155] rounded-2xl p-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={review.avatar}
                    alt={review.author}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-[#f8fafc] font-['Outfit']">{review.author}</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className={
                            i < review.rating
                              ? 'text-[#eab308] fill-[#eab308]'
                              : 'text-[#334155]'
                          }
                        />
                      ))}
                      <span className="text-xs text-[#94a3b8] ml-1 font-['Plus_Jakarta_Sans']">
                        {review.date}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-[#94a3b8] font-['Plus_Jakarta_Sans']">{review.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Use Itinerary Button */}
        <button className="w-full mt-8 py-4 bg-gradient-to-r from-[#10b981] to-[#0ea5e9] text-white rounded-2xl font-semibold font-['Outfit'] text-lg transition-all hover:shadow-lg hover:shadow-[#10b981]/30">
          🌿 Usar Este Roteiro
        </button>
      </div>
    </div>
  );
};

const SummaryCard = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-3">
    <div className="text-xl mb-1">{icon}</div>
    <p className="text-xs text-[#94a3b8] font-['Plus_Jakarta_Sans']">{label}</p>
    <p className="text-sm font-medium text-[#f8fafc] font-['Outfit'] line-clamp-2">{value}</p>
  </div>
);

export default DestinationDetail;
