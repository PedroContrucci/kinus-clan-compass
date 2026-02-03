import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Star, LogOut, Loader2 } from 'lucide-react';
import { destinations, type Destination } from '@/data/destinations';
import { useAuth } from '@/hooks/useAuth';
import kinuLogo from '@/assets/KINU_logo.png';

const filters = ['Todos', 'Romântico', 'Cultura', 'Aventura', 'Gastronômico', 'Econômico', 'Praia', 'Família'];

const Cla = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeFilter, setActiveFilter] = useState('Todos');
  const { user, loading, signOut } = useAuth();

  const filteredDestinations = activeFilter === 'Todos'
    ? destinations
    : destinations.filter(d => d.tags.includes(activeFilter));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
      </div>
    );
  }

  if (!user) return null;

  const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Viajante';

  return (
    <div className="min-h-screen bg-[#0f172a] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0f172a]/80 backdrop-blur-lg border-b border-[#334155] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={kinuLogo} alt="KINU" className="h-8 w-8 object-contain" />
            <span className="font-bold text-xl font-['Outfit'] text-[#f8fafc]">KINU</span>
          </div>
          <button
            onClick={signOut}
            className="p-2 hover:bg-[#1e293b] rounded-lg transition-colors"
          >
            <LogOut size={20} className="text-[#94a3b8]" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6">
        <h1 className="text-2xl font-bold mb-2 font-['Outfit'] text-[#f8fafc]">Sabedoria do Clã 🌿</h1>
        <p className="text-[#94a3b8] mb-6 font-['Plus_Jakarta_Sans']">
          Olá, {userName}! Milhares viajaram. Você herda a sabedoria.
        </p>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 -mx-4 px-4 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all font-['Plus_Jakarta_Sans'] text-sm ${
                activeFilter === filter
                  ? 'bg-[#10b981] text-white'
                  : 'bg-[#1e293b] text-[#94a3b8] hover:bg-[#1e293b]/80 border border-[#334155]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Destinations Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filteredDestinations.map((destination) => (
            <DestinationCard 
              key={destination.id} 
              destination={destination}
              onClick={() => navigate(`/destino/${destination.id}`)}
            />
          ))}
        </div>
      </main>

      {/* Bottom Nav */}
      <BottomNav currentPath={location.pathname} />
    </div>
  );
};

const DestinationCard = ({ 
  destination, 
  onClick 
}: { 
  destination: Destination; 
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="bg-[#1e293b] border border-[#334155] rounded-2xl overflow-hidden text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-[#10b981]/10 active:scale-[0.98]"
  >
    <div className="relative">
      <img
        src={destination.heroImage}
        alt={destination.name}
        className="w-full aspect-[4/3] object-cover"
      />
      <div className="absolute top-2 left-2 bg-[#10b981]/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 font-['Plus_Jakarta_Sans']">
        🌿 Aprovado
      </div>
    </div>
    <div className="p-3">
      <h3 className="font-semibold flex items-center gap-1 text-[#f8fafc] font-['Outfit']">
        {destination.emoji} {destination.name}
      </h3>
      <p className="text-sm text-[#94a3b8] font-['Plus_Jakarta_Sans']">{destination.country}</p>
      <div className="flex items-center gap-1 mt-1 text-sm">
        <Star size={14} className="text-[#eab308] fill-[#eab308]" />
        <span className="text-[#f8fafc]">{destination.rating}</span>
        <span className="text-[#94a3b8]">({destination.reviewCount.toLocaleString()})</span>
      </div>
      <div className="flex flex-wrap gap-1 mt-2">
        {destination.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="text-xs bg-[#0f172a] px-2 py-0.5 rounded-full text-[#94a3b8] font-['Plus_Jakarta_Sans']">
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-2 text-sm text-[#94a3b8] font-['Plus_Jakarta_Sans']">
        📅 {destination.duration} dias • R$ {destination.avgBudget.toLocaleString()}
      </div>
    </div>
  </button>
);

const BottomNav = ({ currentPath }: { currentPath: string }) => {
  const navigate = useNavigate();
  
  const navItems = [
    { path: '/cla', icon: '🌿', label: 'Clã' },
    { path: '/planejar', icon: '🧭', label: 'Planejar' },
    { path: '/viagens', icon: '💼', label: 'Viagens' },
    { path: '/conta', icon: '👤', label: 'Conta' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1e293b]/90 backdrop-blur-lg border-t border-[#334155] px-4 py-3">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 ${isActive ? 'text-[#10b981]' : 'text-[#94a3b8]'}`}
            >
              {isActive && <div className="w-8 h-0.5 bg-[#10b981] rounded-full mb-1" />}
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-['Plus_Jakarta_Sans']">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Cla;
