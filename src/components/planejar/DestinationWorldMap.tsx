import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { CITY_COORDINATES } from '@/data/cityCoordinates';
import { CURATED_CITIES } from '@/lib/curatedCities';

export interface DestinationWorldMapProps {
  onSelectCity: (cityName: string) => void;
  highlightedCities?: string[];
}

type RegionKey = 'mundo' | 'brasil' | 'americas' | 'europa' | 'asia' | 'africa';

interface RegionChip {
  key: RegionKey;
  label: string;
  bounds?: [[number, number], [number, number]];
  world?: boolean;
}

const REGION_CHIPS: RegionChip[] = [
  { key: 'mundo', label: '🌍 Mundo', world: true },
  { key: 'brasil', label: '🇧🇷 Brasil', bounds: [[-34, -74], [3, -34]] },
  { key: 'americas', label: '🌎 Américas', bounds: [[-36, -125], [52, -30]] },
  { key: 'europa', label: '🌍 Europa', bounds: [[35, -12], [60, 32]] },
  { key: 'asia', label: '🌏 Ásia & Oriente Médio', bounds: [[-2, 25], [46, 145]] },
  { key: 'africa', label: '🌍 África', bounds: [[-36, -20], [38, 52]] },
];

interface CameraControllerProps {
  region: RegionKey;
}

function CameraController({ region }: CameraControllerProps) {
  const map = useMap();

  useEffect(() => {
    const chip = REGION_CHIPS.find((c) => c.key === region);
    if (!chip) return;
    if (chip.world) {
      map.flyTo([15, -10], 2, { duration: 1.2 });
      return;
    }
    if (chip.bounds) {
      map.flyToBounds(chip.bounds, { padding: [20, 20], duration: 1.2 });
    }
  }, [region, map]);

  return null;
}

interface ZoomMarkerProps {
  city: string;
  lat: number;
  lng: number;
  isCurated: boolean;
  isHighlighted: boolean;
  anyHighlighted: boolean;
  onSelect: (city: string) => void;
}

function CityMarker({
  city,
  lat,
  lng,
  isCurated,
  isHighlighted,
  anyHighlighted,
  onSelect,
}: ZoomMarkerProps) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    const handler = () => setZoom(map.getZoom());
    map.on('zoomend', handler);
    return () => {
      map.off('zoomend', handler);
    };
  }, [map]);

  const zoomedIn = zoom >= 3;

  const icon = useMemo(() => {
    const baseSize = zoomedIn ? 16 : 10;
    const size = isHighlighted ? baseSize + 4 : baseSize;
    const color = isHighlighted ? '#eab308' : isCurated ? '#10b981' : '#64748b';
    const glow = isHighlighted ? '0 0 18px #eab308' : '0 0 12px #10b981';
    const opacity = anyHighlighted && !isHighlighted ? 0.4 : 1;
    const pulseClass = isCurated ? 'kinu-map-pulse' : '';

    return L.divIcon({
      className: 'kinu-map-marker',
      html: `
        <div class="kinu-map-touch" style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
          <div class="${pulseClass}" style="
            width:${size}px;
            height:${size}px;
            border-radius:50%;
            background:${color};
            box-shadow:${glow};
            opacity:${opacity};
            transition:opacity 0.2s ease;
          "></div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  }, [isCurated, isHighlighted, anyHighlighted, zoomedIn]);

  return (
    <Marker
      position={[lat, lng]}
      icon={icon}
      eventHandlers={{
        click: () => onSelect(city),
      }}
    >
      {zoomedIn && (
        <Tooltip
          direction="top"
          offset={[0, -12]}
          className="kinu-map-tooltip"
          permanent
        >
          {city}
        </Tooltip>
      )}
    </Marker>
  );
}

export function DestinationWorldMap({
  onSelectCity,
  highlightedCities = [],
}: DestinationWorldMapProps) {
  const [activeRegion, setActiveRegion] = useState<RegionKey>('mundo');

  const highlightedSet = useMemo(
    () => new Set(highlightedCities.map((c) => c.toLowerCase())),
    [highlightedCities]
  );
  const curatedSet = useMemo(
    () => new Set(CURATED_CITIES.map((c) => c.toLowerCase())),
    []
  );

  const anyHighlighted = highlightedCities.length > 0;

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

      <div className="kinu-region-chips flex gap-2 overflow-x-auto pb-2 mb-2 -mx-1 px-1">
        {REGION_CHIPS.map((chip) => {
          const isActive = chip.key === activeRegion;
          const classes = isActive
            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
            : 'bg-[#1e293b] border-emerald-500/20 text-slate-300 hover:text-emerald-300';
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => setActiveRegion(chip.key)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium font-['Outfit'] transition-colors ${classes}`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <div className="h-[300px] lg:h-[380px] rounded-2xl border border-emerald-500/20 overflow-hidden">
        <MapContainer
          center={[15, -10]}
          zoom={2}
          minZoom={2}
          maxZoom={5}
          worldCopyJump
          scrollWheelZoom={false}
          className="h-full w-full"
          attributionControl={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          <CameraController region={activeRegion} />
          {Object.entries(CITY_COORDINATES).map(([city, coord]) => {
            const cityLower = city.toLowerCase();
            const isCurated = curatedSet.has(cityLower);
            const isHighlighted = highlightedSet.has(cityLower);
            return (
              <CityMarker
                key={city}
                city={city}
                lat={coord.lat}
                lng={coord.lng}
                isCurated={isCurated}
                isHighlighted={isHighlighted}
                anyHighlighted={anyHighlighted}
                onSelect={onSelectCity}
              />
            );
          })}
        </MapContainer>
      </div>

      <p className="text-[11px] text-muted-foreground mt-2 text-center font-['Outfit']">
        Mais destinos acendem em breve ✨
      </p>
    </div>
  );
}
