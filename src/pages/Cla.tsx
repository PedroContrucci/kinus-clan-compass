import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, LogOut } from 'lucide-react';
import { destinations, type Destination } from '@/data/destinations';

const filters = ['Todos', 'Romântico', 'Cultura', 'Aventura', 'Gastronômico', 'Econômico', 'Praia', 'Família'];

const Cla = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [user, setUser] = useState<{ name: string } | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('kinu_user');
    if (!savedUser) {
      navigate('/');
      return;
    }
    setUser(JSON.parse(savedUser));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('kinu_user');
    navigate('/');
  };

  const filteredDestinations = activeFilter === 'Todos'
    ? destinations
    : destinations.filter(d => d.tags.includes(activeFilter));

  const getPriceLabel = (level: number) => '€'.repeat(level);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌿</span>
            <span className="font-bold text-xl font-['Outfit']">KINU</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-card rounded-lg transition-colors"
          >
            <LogOut size={20} className="text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6">
        <h1 className="text-2xl font-bold mb-2 font-['Outfit']">Sabedoria do Clã 🌿</h1>
        <p className="text-muted-foreground mb-6">Roteiros testados por quem já foi</p>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 -mx-4 px-4 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                activeFilter === filter
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:bg-card/80'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Destinations Grid */}
        <div className="grid grid-cols-2 gap-4">
          {filteredDestinations.map((destination) => (
            <DestinationCard 
              key={destination.id} 
              destination={destination}
              priceLabel={getPriceLabel(destination.priceLevel)}
              onClick={() => navigate(`/destino/${destination.id}`)}
            />
          ))}
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-lg border-t border-border px-4 py-3">
        <div className="flex justify-around items-center">
          <NavItem icon="🌿" label="Clã" active />
          <NavItem icon="🧭" label="Planejar" />
          <NavItem icon="💼" label="Viagens" />
          <NavItem icon="👤" label="Conta" />
        </div>
      </nav>
    </div>
  );
};

const DestinationCard = ({ 
  destination, 
  priceLabel, 
  onClick 
}: { 
  destination: Destination; 
  priceLabel: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="glass-card overflow-hidden text-left transition-transform hover:scale-[1.02] active:scale-[0.98]"
  >
    <div className="relative">
      <img
        src={destination.heroImage}
        alt={destination.name}
        className="w-full aspect-[4/3] object-cover"
      />
      <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
        🌿 Aprovado
      </div>
    </div>
    <div className="p-3">
      <h3 className="font-semibold flex items-center gap-1">
        {destination.emoji} {destination.name}
      </h3>
      <p className="text-sm text-muted-foreground">{destination.country}</p>
      <div className="flex items-center gap-1 mt-1 text-sm">
        <Star size={14} className="text-yellow-500 fill-yellow-500" />
        <span>{destination.rating}</span>
        <span className="text-muted-foreground">({destination.reviewCount})</span>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {destination.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="text-xs bg-card px-2 py-0.5 rounded-full text-muted-foreground">
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-2 text-sm text-muted-foreground">
        📅 {destination.duration} dias • {priceLabel}
      </div>
    </div>
  </button>
);

const NavItem = ({ icon, label, active = false }: { icon: string; label: string; active?: boolean }) => (
  <div className={`flex flex-col items-center gap-1 ${active ? 'text-primary' : 'text-muted-foreground'}`}>
    {active && <div className="w-8 h-0.5 bg-primary rounded-full mb-1" />}
    <span className="text-xl">{icon}</span>
    <span className="text-xs">{label}</span>
  </div>
);

export default Cla;
