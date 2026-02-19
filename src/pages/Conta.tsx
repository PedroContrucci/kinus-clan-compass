import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, HelpCircle, Star, Info } from 'lucide-react';
import { BottomNav } from '@/components/shared/BottomNav';
import { toast } from '@/hooks/use-toast';
import kinuLogo from '@/assets/KINU_logo.png';
import { SavedTrip } from '@/types/trip';

const Conta = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [stats, setStats] = useState({ trips: 0, countries: 0, activities: 0 });

  useEffect(() => {
    const savedUser = localStorage.getItem('kinu_user');
    if (!savedUser) {
      navigate('/');
      return;
    }
    setUser(JSON.parse(savedUser));

    const savedTrips: SavedTrip[] = JSON.parse(localStorage.getItem('kinu_trips') || '[]');
    const uniqueCountries = new Set(savedTrips.map(t => t.country).filter(Boolean));
    const totalActivities = savedTrips.reduce((acc, trip) => {
      return acc + (trip.days || []).reduce((dayAcc, day) => dayAcc + (day.activities?.length || 0), 0);
    }, 0);
    setStats({
      trips: savedTrips.length,
      countries: uniqueCountries.size,
      activities: totalActivities,
    });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('kinu_user');
    navigate('/');
  };

  const handleComingSoon = (feature: string) => {
    toast({
      title: "Em breve! 🚀",
      description: `${feature} estará disponível na próxima versão.`,
    });
  };

  if (!user) return null;

  const menuItems = [
    { icon: User, label: 'Editar Perfil', action: () => handleComingSoon('Edição de perfil') },
    { icon: Star, label: 'Meus Favoritos', action: () => handleComingSoon('Favoritos') },
    { icon: HelpCircle, label: 'Ajuda e Suporte', action: () => handleComingSoon('Suporte') },
    { icon: Info, label: 'Sobre o KINU', action: () => {
      toast({
        title: "KINU — The Travel OS 🌿",
        description: "v0.1.0 POC • Onde a sabedoria do clã encontra a precisão da engenharia.",
      });
    }},
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <img src={kinuLogo} alt="KINU" className="h-8 w-8 object-contain" />
          <span className="font-bold text-xl font-['Outfit'] text-foreground">KINU</span>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6">
        <h1 className="text-2xl font-bold mb-6 font-['Outfit'] text-foreground">Minha Conta 👤</h1>

        {/* Profile Card */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-2xl text-primary-foreground">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-lg text-foreground font-['Outfit']">{user.name}</p>
              <p className="text-muted-foreground text-sm">{user.email}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-primary text-xs">🌿 Membro do Clã</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground font-['Outfit']">{stats.trips}</p>
            <p className="text-xs text-muted-foreground">Viagens</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground font-['Outfit']">{stats.countries}</p>
            <p className="text-xs text-muted-foreground">Países</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground font-['Outfit']">{stats.activities}</p>
            <p className="text-xs text-muted-foreground">Atividades</p>
          </div>
        </div>

        {/* Menu */}
        <div className="space-y-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className="w-full flex items-center gap-3 p-4 bg-card border border-border rounded-xl text-left hover:bg-card/80 transition-colors"
            >
              <item.icon size={20} className="text-muted-foreground" />
              <span className="text-foreground font-['Plus_Jakarta_Sans']">{item.label}</span>
            </button>
          ))}
          
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-left hover:bg-destructive/20 transition-colors mt-4"
          >
            <LogOut size={20} className="text-destructive" />
            <span className="text-destructive font-['Plus_Jakarta_Sans']">Sair da Conta</span>
          </button>
        </div>

        {/* Version */}
        <p className="text-center text-xs text-muted-foreground/50 mt-8 font-['Plus_Jakarta_Sans']">
          KINU v0.1.0 • The Travel OS
        </p>
      </main>
      <BottomNav />
    </div>
  );
};

export default Conta;
