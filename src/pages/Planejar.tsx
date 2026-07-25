import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  Map,
  List,
  MessageCircle,
  Sparkles,
  ArrowLeft,
  Search,
  ChevronRight,
  Plane,
} from "lucide-react";

import { DestinationWorldMap } from "@/components/planejar/DestinationWorldMap";
import { NewPlanningWizard } from "@/components/wizard/NewPlanningWizard";
import { useKinuAI } from "@/contexts/KinuAIContext";
import {
  DESTINATION_CATALOG,
  REGIONS,
  type RegionName,
  type CountryEntry,
  type CityEntry,
  findCityInfo,
} from "@/data/destinationCatalog";
import { CURATED_CITIES } from "@/lib/curatedCities";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";


type PlanejarMode = "hub" | "map" | "list" | "quiz";

interface HubCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  accent: "emerald" | "gold" | "indigo" | "rose";
}

const ACCENT_STROKES: Record<HubCardProps["accent"], string> = {
  emerald: "border-emerald-500/20 hover:border-emerald-400/50 bg-emerald-500/5",
  gold: "border-amber-500/20 hover:border-amber-400/50 bg-amber-500/5",
  indigo: "border-indigo-500/20 hover:border-indigo-400/50 bg-indigo-500/5",
  rose: "border-rose-500/20 hover:border-rose-400/50 bg-rose-500/5",
};

const ACCENT_ICONS: Record<HubCardProps["accent"], string> = {
  emerald: "text-emerald-400",
  gold: "text-amber-400",
  indigo: "text-indigo-400",
  rose: "text-rose-400",
};

function HubCard({ icon, title, subtitle, onClick, accent }: HubCardProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative w-full text-left rounded-2xl border p-6 transition-colors duration-200 group overflow-hidden",
        "bg-slate-900/60 backdrop-blur-sm",
        ACCENT_STROKES[accent]
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative z-10">
        <div className={cn("mb-4 inline-flex p-3 rounded-xl bg-slate-950/50", ACCENT_ICONS[accent])}>
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-slate-100 mb-2">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{subtitle}</p>
      </div>
    </motion.button>
  );
}

export default function Planejar() {
  const { setIsOpen, sendMessage, setWizardPrefill } = useKinuAI();

  const [mode, setMode] = useState<PlanejarMode>("hub");
  const [wizardActive, setWizardActive] = useState(false);

  // List mode browsing state
  const [listSearch, setListSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<RegionName | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryEntry | null>(null);

  // Reset browse state when leaving list mode
  useEffect(() => {
    if (mode !== "list") {
      setListSearch("");
      setSelectedRegion(null);
      setSelectedCountry(null);
    }
  }, [mode]);


  const handleSelectCity = (cityName: string) => {
    const info = findCityInfo(cityName);
    if (!info) return;

    setWizardPrefill({
      destino: cityName,
      data_ida: "",
      data_volta: "",
      viajantes: 2,
    });
    setWizardActive(true);
  };

  const handleWizardCancel = () => {
    setWizardActive(false);
    setMode("hub");
  };

  const allCities = useMemo(() => {
    const cities: { city: CityEntry; country: CountryEntry; region: RegionName }[] = [];
    for (const [region, countries] of Object.entries(DESTINATION_CATALOG)) {
      for (const country of countries) {
        for (const city of country.cities) {
          cities.push({ city, country, region: region as RegionName });
        }
      }
    }
    return cities;
  }, []);

  const filteredResults = useMemo(() => {
    if (!listSearch.trim()) return null;
    const q = listSearch.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return allCities.filter(
      ({ city, country }) =>
        city.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q) ||
        country.country.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q)
    );
  }, [listSearch, allCities]);

  const renderHub = () => (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-8"
    >
      <div className="max-w-3xl w-full text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-5">
          <Plane className="w-3.5 h-3.5" />
          Nova viagem
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-slate-50 mb-4">
          Como você quer planejar?
        </h1>
        <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto">
          Escolha o caminho que faz mais sentido para sua próxima aventura. O KINU se adapta a você.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl w-full">
        <HubCard
          icon={<Map className="w-7 h-7" />}
          title="Planejar pelo mapa-múndi"
          subtitle="Explore o mundo e escolha visualmente"
          accent="emerald"
          onClick={() => setMode("map")}
        />
        <HubCard
          icon={<List className="w-7 h-7" />}
          title="Planejar pela lista"
          subtitle="Todos os destinos por região, com busca"
          accent="indigo"
          onClick={() => setMode("list")}
        />
        <HubCard
          icon={<MessageCircle className="w-7 h-7" />}
          title="Planejar com o KINU AI"
          subtitle="Converse e o KINU monta com você"
          accent="gold"
          onClick={() => setIsOpen(true)}
        />
        <HubCard
          icon={<Sparkles className="w-7 h-7" />}
          title="Não sei para onde ir"
          subtitle="Responda 5 perguntas e receba sugestões"
          accent="rose"
          onClick={() => {
            setMode("quiz");
            setIsOpen(true);
            sendMessage("Quero ajuda para escolher um destino para minha viagem").catch(() => {});
          }}
        />
      </div>
    </motion.div>
  );

  const renderBackButton = () => (
    <button
      onClick={() => {
        setWizardActive(false);
        setMode("hub");
      }}
      className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-100 transition-colors mb-4"
    >
      <ArrowLeft className="w-4 h-4" />
      Voltar
    </button>
  );

  const renderMapMode = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-[calc(100vh-80px)] flex flex-col"
    >
      <div className="px-4 py-3 md:px-6 md:py-4">
        {renderBackButton()}
        <h2 className="text-xl font-semibold text-slate-100">Mapa-múndi</h2>
        <p className="text-sm text-slate-400">Toque em uma cidade para começar.</p>
      </div>
      <div className="flex-1 min-h-0 px-4 pb-4 md:px-6 md:pb-6">
        <DestinationWorldMap onSelectCity={handleSelectCity} />
      </div>
    </motion.div>
  );

  const renderListMode = () => {
    if (selectedCountry) {
      return (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="min-h-[calc(100vh-80px)] px-4 py-3 md:px-6 md:py-4"
        >
          {renderBackButton()}
          <button
            onClick={() => setSelectedCountry(null)}
            className="text-sm text-slate-400 hover:text-slate-100 flex items-center gap-1 mb-2"
          >
            <ChevronRight className="w-3 h-3 rotate-180" />
            {selectedCountry.country}
          </button>
          <h2 className="text-xl font-semibold text-slate-100 mb-4">
            Cidades em {selectedCountry.country} {selectedCountry.flag}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedCountry.cities.map((city) => (
              <CityCard
                key={city.name}
                city={city}
                country={selectedCountry}
                onSelect={() => handleSelectCity(city.name)}
              />
            ))}
          </div>
        </motion.div>
      );
    }

    if (selectedRegion) {
      const countries = DESTINATION_CATALOG[selectedRegion];
      return (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="min-h-[calc(100vh-80px)] px-4 py-3 md:px-6 md:py-4"
        >
          {renderBackButton()}
          <button
            onClick={() => setSelectedRegion(null)}
            className="text-sm text-slate-400 hover:text-slate-100 flex items-center gap-1 mb-2"
          >
            <ChevronRight className="w-3 h-3 rotate-180" />
            {selectedRegion}
          </button>
          <h2 className="text-xl font-semibold text-slate-100 mb-4">{selectedRegion}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {countries.map((country) => (
              <CountryCard
                key={country.country}
                country={country}
                onSelect={() => setSelectedCountry(country)}
              />
            ))}
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className="min-h-[calc(100vh-80px)] px-4 py-3 md:px-6 md:py-4"
      >
        {renderBackButton()}
        <h2 className="text-xl font-semibold text-slate-100 mb-4">Todos os destinos</h2>

        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            type="text"
            placeholder="Buscar cidade ou país..."
            value={listSearch}
            onChange={(e) => setListSearch(e.target.value)}
            className="pl-10 bg-slate-900/60 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-emerald-500"
          />
        </div>

        {filteredResults && filteredResults.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredResults.map(({ city, country }) => (
              <CityCard
                key={city.name}
                city={city}
                country={country}
                onSelect={() => handleSelectCity(city.name)}
              />
            ))}
          </div>
        ) : filteredResults && listSearch.trim() ? (
          <p className="text-slate-500 text-sm">Nenhum destino encontrado para “{listSearch}”.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {REGIONS.map((region) => (
              <RegionCard
                key={region.id}
                region={region}
                onSelect={() => setSelectedRegion(region.id)}
              />
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  const renderQuizMode = () => (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 text-center"
    >
      {renderBackButton()}
      <div className="max-w-md">
        <Sparkles className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-slate-100 mb-2">Descoberta com o KINU</h2>
        <p className="text-slate-400 mb-6">
          O chat abriu embaixo. Responde umas perguntas rápidas e eu te indico destinos feitos para você.
        </p>
        <Button onClick={() => setIsOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white">
          Abrir KINU AI
        </Button>
      </div>
    </motion.div>
  );

  if (wizardActive) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto">
        <NewPlanningWizard onCancel={handleWizardCancel} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AnimatePresence mode="wait">
        {mode === "hub" && renderHub()}
        {mode === "map" && renderMapMode()}
        {mode === "list" && renderListMode()}
        {mode === "quiz" && renderQuizMode()}
      </AnimatePresence>
    </div>
  );
}

function RegionCard({
  region,
  onSelect,
}: {
  region: { id: RegionName; emoji: string };
  onSelect: () => void;
}) {
  const count = DESTINATION_CATALOG[region.id].reduce((sum, c) => sum + c.cities.length, 0);
  return (
    <button
      onClick={onSelect}
      className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/60 hover:border-emerald-500/30 transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{region.emoji}</span>
        <div>
          <p className="font-medium text-slate-100">{region.id}</p>
          <p className="text-xs text-slate-500">{count} cidades</p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-600" />
    </button>
  );
}

function CountryCard({ country, onSelect }: { country: CountryEntry; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/60 hover:border-emerald-500/30 transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{country.flag}</span>
        <div>
          <p className="font-medium text-slate-100">{country.country}</p>
          <p className="text-xs text-slate-500">{country.cities.length} cidades</p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-600" />
    </button>
  );
}

function CityCard({
  city,
  country,
  onSelect,
}: {
  city: CityEntry;
  country: CountryEntry;
  onSelect: () => void;
}) {
  const isCurated = CURATED_CITIES.includes(city.name);
  return (
    <button
      onClick={onSelect}
      className="relative p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/60 hover:border-emerald-500/30 transition-colors text-left group"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xl">{country.flag}</span>
        {isCurated && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            KINU
          </span>
        )}
      </div>
      <p className="font-medium text-slate-100 group-hover:text-emerald-100 transition-colors">{city.name}</p>
      <p className="text-xs text-slate-500">{country.country}</p>
    </button>
  );
}
