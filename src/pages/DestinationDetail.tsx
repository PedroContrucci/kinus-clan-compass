import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Star, Clock, Euro } from 'lucide-react';
import { destinations } from '@/data/destinations';

const DestinationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const destination = destinations.find((d) => d.id === id);

  useEffect(() => {
    const savedUser = localStorage.getItem('kinu_user');
    if (!savedUser) {
      navigate('/');
    }
  }, [navigate]);

  if (!destination) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Destino não encontrado</p>
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

  const currentDay = destination.itinerary.find((d) => d.day === selectedDay);
  const getPriceLabel = (level: number) => '€'.repeat(level);

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
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative h-64">
        <img
          src={destination.heroImage}
          alt={destination.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        {/* Header buttons */}
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <button
            onClick={() => navigate('/cla')}
            className="p-2 bg-background/50 backdrop-blur-sm rounded-full"
          >
            <ArrowLeft size={24} />
          </button>
          <button className="p-2 bg-background/50 backdrop-blur-sm rounded-full">
            <Heart size={24} />
          </button>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-2xl font-bold font-['Outfit']">
            {destination.emoji} {destination.name}, {destination.country}
          </h1>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="flex items-center gap-1">
              <Star size={16} className="text-yellow-500 fill-yellow-500" />
              {destination.rating} ({destination.reviewCount})
            </span>
            <span>📅 {destination.duration} dias</span>
            <span>💰 €{destination.avgBudget}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {/* Tags */}
        <div className="flex gap-2 mb-6">
          {destination.tags.map((tag) => (
            <span key={tag} className="px-3 py-1 bg-card rounded-full text-sm">
              {tag}
            </span>
          ))}
        </div>

        {/* Day Timeline */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4 font-['Outfit']">📅 Roteiro Dia a Dia</h2>
          
          {/* Day cards - horizontal scroll */}
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4">
            {destination.itinerary.map((day) => (
              <button
                key={day.day}
                onClick={() => handleDayChange(day.day)}
                className={`flex-shrink-0 p-4 rounded-xl transition-all ${
                  selectedDay === day.day
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary'
                    : 'bg-card hover:bg-card/80'
                }`}
              >
                <div className="text-2xl mb-1">{day.icon}</div>
                <div className="font-semibold">Dia {day.day}</div>
                <div className="text-xs opacity-80 max-w-[80px] truncate">{day.title}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Day Details */}
        {currentDay && (
          <div
            className={`glass-card p-4 transition-opacity duration-150 ${
              isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <h3 className="font-semibold text-lg mb-1">
              Dia {currentDay.day}: {currentDay.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {currentDay.activities.length} atividades • €{currentDay.activities.reduce((sum, a) => sum + a.cost, 0)} estimado
            </p>

            <div className="space-y-4">
              {currentDay.activities.map((activity, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="text-xl">{getActivityIcon(activity.type)}</div>
                    {index < currentDay.activities.length - 1 && (
                      <div className="w-0.5 flex-1 bg-border mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
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
                    <h4 className="font-medium">{activity.name}</h4>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">⏱️ {activity.duration}</p>
                    
                    {activity.clanTip && (
                      <div className="mt-2 p-2 bg-primary/10 border-l-2 border-primary rounded-r-lg">
                        <p className="text-sm">
                          🌿 "{activity.clanTip}" - @{activity.clanAuthor}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Use Itinerary Button */}
        <button className="w-full mt-6 py-4 btn-primary font-semibold">
          Usar Este Roteiro
        </button>
      </div>
    </div>
  );
};

export default DestinationDetail;
