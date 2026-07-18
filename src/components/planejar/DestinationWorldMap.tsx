import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { CITY_COORDINATES } from '@/data/cityCoordinates';
import { CURATED_CITIES } from '@/lib/curatedCities';

export interface DestinationWorldMapProps {
  onSelectCity: (cityName: string) => void;
  highlightedCities?: string[];
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

  const icon = useMemo(() => {
    const size = isHighlighted ? 18 : 14;
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
  }, [isCurated, isHighlighted, anyHighlighted]);

  return (
    <Marker
      position={[lat, lng]}
      icon={icon}
      eventHandlers={{
        click: () => onSelect(city),
      }}
    >
      <Tooltip
        direction="top"
        offset={[0, -12]}
        className="kinu-map-tooltip"
        permanent={zoom >= 3}
      >
        {city}
      </Tooltip>
    </Marker>
  );
}

export function DestinationWorldMap({
  onSelectCity,
  highlightedCities = [],
}: DestinationWorldMapProps) {
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
      `}</style>

      <p className="text-xs text-muted-foreground mb-2 font-['Outfit']">
        🌍 Toque em um destino aceso para começar
      </p>

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
