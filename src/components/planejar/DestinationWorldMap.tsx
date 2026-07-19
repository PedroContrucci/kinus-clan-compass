import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { CITY_COORDINATES } from '@/data/cityCoordinates';
import { DESTINATION_CATALOG, type RegionName } from '@/data/destinationCatalog';

export interface DestinationWorldMapProps {
  onSelectCity: (cityName: string) => void;
  highlightedCities?: string[];
}

type Level = 'world' | 'region' | 'country';

interface CityNode {
  name: string;
  lat: number;
  lng: number;
}
interface CountryNode {
  name: string;
  lat: number;
  lng: number;
  cities: CityNode[];
}
interface RegionNode {
  name: RegionName;
  label: string;
  lat: number;
  lng: number;
  countries: CountryNode[];
}

const REGION_META: Record<RegionName, { label: string; lat: number; lng: number }> = {
  'Brasil':               { label: '🇧🇷 Brasil',                 lat: -14, lng: -52 },
  'Américas':             { label: '🌎 Américas',                lat: 23,  lng: -100 },
  'Europa':               { label: '🌍 Europa',                  lat: 48,  lng: 10 },
  'Ásia & Oriente Médio': { label: '🌏 Ásia & Oriente Médio',    lat: 25,  lng: 90 },
  'África':               { label: '🌍 África',                  lat: 2,   lng: 20 },
  'Oceania':              { label: '🌏 Oceania',                 lat: -25, lng: 135 },
};

// Build hierarchy at module level, keeping only cities present in CITY_COORDINATES.
const HIERARCHY: RegionNode[] = (Object.entries(DESTINATION_CATALOG) as [RegionName, typeof DESTINATION_CATALOG[RegionName]][])
  .map(([regionName, countries]) => {
    const countryNodes: CountryNode[] = countries
      .map((c) => {
        const cityNodes: CityNode[] = c.cities
          .map((city) => {
            const coord = CITY_COORDINATES[city.name];
            if (!coord) return null;
            return { name: city.name, lat: coord.lat, lng: coord.lng };
          })
          .filter((v): v is CityNode => v !== null);
        if (cityNodes.length === 0) return null;
        const lat = cityNodes.reduce((s, x) => s + x.lat, 0) / cityNodes.length;
        const lng = cityNodes.reduce((s, x) => s + x.lng, 0) / cityNodes.length;
        return { name: c.country, lat, lng, cities: cityNodes };
      })
      .filter((v): v is CountryNode => v !== null);
    if (countryNodes.length === 0) return null;
    const meta = REGION_META[regionName];
    return { name: regionName, label: meta.label, lat: meta.lat, lng: meta.lng, countries: countryNodes };
  })
  .filter((v): v is RegionNode => v !== null);

function boundsFromCities(cities: CityNode[]): [[number, number], [number, number]] {
  const lats = cities.map((c) => c.lat);
  const lngs = cities.map((c) => c.lng);
  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ];
}

interface CameraTarget {
  kind: 'world' | 'bounds';
  bounds?: [[number, number], [number, number]];
}

function CameraController({ target }: { target: CameraTarget }) {
  const map = useMap();
  useEffect(() => {
    if (target.kind === 'world') {
      map.flyTo([15, -10], 2, { duration: 1.2 });
      return;
    }
    if (target.bounds) {
      map.flyToBounds(target.bounds, { padding: [40, 40], duration: 1.2 });
    }
  }, [target, map]);
  return null;
}

function makeIcon(size: number, color: string, glow: string, pulse: boolean) {
  const touch = Math.max(size + 12, 28);
  return L.divIcon({
    className: 'kinu-map-marker',
    html: `
      <div class="kinu-map-touch" style="width:${touch}px;height:${touch}px;display:flex;align-items:center;justify-content:center;">
        <div class="${pulse ? 'kinu-map-pulse' : ''}" style="
          width:${size}px;
          height:${size}px;
          border-radius:50%;
          background:${color};
          box-shadow:${glow};
          transition:opacity 0.2s ease;
        "></div>
      </div>
    `,
    iconSize: [touch, touch],
    iconAnchor: [touch / 2, touch / 2],
  });
}

interface DotProps {
  name: string;
  lat: number;
  lng: number;
  size: number;
  color: string;
  glow: string;
  pulse?: boolean;
  onClick: () => void;
}

function Dot({ name, lat, lng, size, color, glow, pulse, onClick }: DotProps) {
  const icon = useMemo(
    () => makeIcon(size, color, glow, !!pulse),
    [size, color, glow, pulse]
  );
  return (
    <Marker
      position={[lat, lng]}
      icon={icon}
      eventHandlers={{ click: onClick }}
    >
      <Tooltip direction="top" offset={[0, -size / 2 - 4]} className="kinu-map-tooltip" permanent>
        {name}
      </Tooltip>
    </Marker>
  );
}

export function DestinationWorldMap({
  onSelectCity,
  highlightedCities = [],
}: DestinationWorldMapProps) {
  const [level, setLevel] = useState<Level>('world');
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [activeCountry, setActiveCountry] = useState<string | null>(null);

  const regionNode = useMemo(
    () => HIERARCHY.find((r) => r.name === activeRegion) ?? null,
    [activeRegion]
  );
  const countryNode = useMemo(
    () => regionNode?.countries.find((c) => c.name === activeCountry) ?? null,
    [regionNode, activeCountry]
  );

  // Resolve highlighted cities (KINU suggestions) against CITY_COORDINATES
  const highlightNodes: CityNode[] = useMemo(() => {
    const map = new Map<string, CityNode>();
    for (const raw of highlightedCities) {
      const key = raw.toLowerCase();
      for (const [name, coord] of Object.entries(CITY_COORDINATES)) {
        if (name.toLowerCase() === key) {
          map.set(name, { name, lat: coord.lat, lng: coord.lng });
          break;
        }
      }
    }
    return Array.from(map.values());
  }, [highlightedCities]);
  const anyHighlighted = highlightNodes.length > 0;

  // Camera target
  const cameraTarget: CameraTarget = useMemo(() => {
    if (anyHighlighted) {
      return { kind: 'bounds', bounds: boundsFromCities(highlightNodes) };
    }
    if (level === 'country' && countryNode) {
      return { kind: 'bounds', bounds: boundsFromCities(countryNode.cities) };
    }
    if (level === 'region' && regionNode) {
      const allCities = regionNode.countries.flatMap((c) => c.cities);
      return { kind: 'bounds', bounds: boundsFromCities(allCities) };
    }
    return { kind: 'world' };
  }, [anyHighlighted, highlightNodes, level, regionNode, countryNode]);

  const goWorld = () => {
    setLevel('world');
    setActiveRegion(null);
    setActiveCountry(null);
  };
  const goRegion = () => {
    setLevel('region');
    setActiveCountry(null);
  };

  return (
    <div className="w-full">
      <style>{`
        @keyframes kinu-map-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.35); opacity: 0.75; }
        }
        .kinu-map-pulse {
          animation: kinu-map-pulse 2.2s ease-in-out infinite;
        }
        .kinu-map-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          color: #ffffff !important;
          font-family: 'Outfit', sans-serif !important;
          font-size: 11px !important;
          font-weight: 500 !important;
          text-shadow: 0 1px 3px rgba(0,0,0,0.8);
          padding: 2px 4px !important;
        }
        .kinu-map-tooltip::before {
          display: none !important;
        }
        .leaflet-tooltip-pane {
          z-index: 650 !important;
        }
        .kinu-region-chips::-webkit-scrollbar { display: none; }
        .kinu-region-chips { scrollbar-width: none; }
      `}</style>

      <p className="text-xs text-muted-foreground mb-2 font-['Outfit']">
        🌍 Toque em um destino aceso para começar
      </p>

      {/* Breadcrumb */}
      <div className="kinu-region-chips flex gap-2 overflow-x-auto pb-2 mb-2 -mx-1 px-1 items-center">
        <button
          type="button"
          onClick={goWorld}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium font-['Outfit'] transition-colors ${
            level === 'world'
              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
              : 'bg-[#1e293b] border-emerald-500/20 text-slate-300 hover:text-emerald-300'
          }`}
        >
          🌍 Mundo
        </button>
        {activeRegion && (
          <>
            <span className="text-slate-500 text-xs">›</span>
            <button
              type="button"
              onClick={goRegion}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium font-['Outfit'] transition-colors ${
                level === 'region'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                  : 'bg-[#1e293b] border-emerald-500/20 text-slate-300 hover:text-emerald-300'
              }`}
            >
              {regionNode?.label ?? activeRegion}
            </button>
          </>
        )}
        {activeCountry && (
          <>
            <span className="text-slate-500 text-xs">›</span>
            <button
              type="button"
              onClick={() => setLevel('country')}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium font-['Outfit'] transition-colors ${
                level === 'country'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                  : 'bg-[#1e293b] border-emerald-500/20 text-slate-300 hover:text-emerald-300'
              }`}
            >
              {activeCountry}
            </button>
          </>
        )}
      </div>

      <div className="h-[300px] lg:h-[380px] rounded-2xl border border-emerald-500/20 overflow-hidden">
        <div className="relative z-0 isolate h-full w-full">
          <MapContainer
            center={[15, -10]}
            zoom={2}
            minZoom={2}
            maxZoom={6}
            worldCopyJump
            scrollWheelZoom={false}
            className="h-full w-full"
            attributionControl={true}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            <CameraController target={cameraTarget} />

            {anyHighlighted ? (
              highlightNodes.map((c) => (
                <Dot
                  key={`hl-${c.name}`}
                  name={c.name}
                  lat={c.lat}
                  lng={c.lng}
                  size={20}
                  color="#eab308"
                  glow="0 0 20px #eab308"
                  pulse
                  onClick={() => onSelectCity(c.name)}
                />
              ))
            ) : level === 'world' ? (
              HIERARCHY.map((r) => (
                <Dot
                  key={`r-${r.name}`}
                  name={r.label}
                  lat={r.lat}
                  lng={r.lng}
                  size={22}
                  color="#0ea5e9"
                  glow="0 0 16px #0ea5e9"
                  onClick={() => {
                    setActiveRegion(r.name);
                    setActiveCountry(null);
                    setLevel('region');
                  }}
                />
              ))
            ) : level === 'region' && regionNode ? (
              regionNode.countries.map((c) => (
                <Dot
                  key={`c-${c.name}`}
                  name={c.name}
                  lat={c.lat}
                  lng={c.lng}
                  size={18}
                  color="#e2e8f0"
                  glow="0 0 14px rgba(226,232,240,0.6)"
                  onClick={() => {
                    setActiveCountry(c.name);
                    setLevel('country');
                  }}
                />
              ))
            ) : level === 'country' && countryNode ? (
              countryNode.cities.map((city) => (
                <Dot
                  key={`ci-${city.name}`}
                  name={city.name}
                  lat={city.lat}
                  lng={city.lng}
                  size={16}
                  color="#10b981"
                  glow="0 0 14px #10b981"
                  pulse
                  onClick={() => onSelectCity(city.name)}
                />
              ))
            ) : null}
          </MapContainer>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[10px] text-muted-foreground font-['Outfit']">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: '#0ea5e9' }} />
          Continente
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: '#e2e8f0' }} />
          País
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: '#10b981' }} />
          Cidade
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: '#eab308' }} />
          Sugestão do KINU
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: '#64748b' }} />
          Em breve
        </span>
      </div>

      <p className="text-[11px] text-muted-foreground mt-2 text-center font-['Outfit']">
        Mais destinos acendem em breve ✨
      </p>
    </div>
  );
}
