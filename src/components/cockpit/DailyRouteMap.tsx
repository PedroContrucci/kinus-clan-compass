import { memo, useEffect, useState, useRef, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ATTRACTION_COORDS } from '@/data/attractionCoordinates';
import { DayMapLink } from './DayMapLink';

class MapErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Map render error:', error, info);
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

interface DailyRouteMapProps {
  destination: string;
  activities: { name: string; time?: string; category?: string }[];
  hotelNeighborhood?: string;
}

interface GeoPoint {
  name: string;
  time?: string;
  lat: number;
  lng: number;
  isHotel?: boolean;
}

const LOGISTICS_KEYWORDS = [
  'café da manhã', 'transfer', 'check-in', 'check-out', 'voo',
  'embarque', 'desembarque', 'imigração', 'aeroporto', 'bagagem',
  'retorno', 'volta'
];

const LOGISTICS_CATEGORIES = ['voo', 'transporte', 'hotel'];

function isLogistics(activity: { name: string; category?: string }): boolean {
  const nameLower = activity.name.toLowerCase();
  if (LOGISTICS_CATEGORIES.includes(activity.category || '')) return true;
  return LOGISTICS_KEYWORDS.some(kw => nameLower.includes(kw));
}

function createNumberedIcon(num: number): L.DivIcon {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: linear-gradient(135deg, hsl(160, 84%, 39%), hsl(199, 89%, 48%));
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
      font-family: 'Outfit', sans-serif;
      border: 2px solid hsl(210, 40%, 98%);
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    ">${num}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

function FitBounds({ points }: { points: GeoPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
  }, [points, map]);
  return null;
}

const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

interface RouteSegment {
  path: [number, number][];
  durationMin: number;
  distanceKm: string;
}

export const DailyRouteMap = memo(({ destination, activities, hotelNeighborhood }: DailyRouteMapProps) => {
  const [points, setPoints] = useState<GeoPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [segments, setSegments] = useState<RouteSegment[]>([]);
  const abortRef = useRef(false);

  const filteredActivities = activities.filter(a => !isLogistics(a));

  const geocode = useCallback(async (name: string, dest: string): Promise<{ lat: number; lng: number } | null> => {
    const key = `${name}|${dest}`;
    const cached = geocodeCache.get(key);
    if (cached) return cached;

    const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    // Clean activity name: strip leading emojis, meal prefixes, parentheticals, " & ..." / " e ..." trailing
    const cleanName = (raw: string) => {
      let n = raw
        // strip leading emoji/symbols (non-letters/digits at start)
        .replace(/^[^\p{L}\p{N}]+/u, '')
        .replace(/^(almoço|almoco|jantar|café|cafe)\s*:\s*/i, '')
        .replace(/\s*\(.*?\)/g, '')
        .replace(/\s+[&e]\s+.*$/i, '')
        .replace(/\s*\+\s*.*/g, '')
        .trim();
      return n;
    };

    const actClean = cleanName(name);
    const actNorm = norm(actClean);
    const destNorm = norm(dest);

    // Exact match (normalized)
    const exactEntry = Object.entries(ATTRACTION_COORDS).find(([k]) => {
      const kNorm = norm(k);
      return kNorm === `${actNorm}, ${destNorm}`;
    });
    if (exactEntry) {
      geocodeCache.set(key, exactEntry[1]);
      return exactEntry[1];
    }

    // Partial / reverse-partial match (normalized)
    const partialMatch = Object.entries(ATTRACTION_COORDS).find(([k]) => {
      const parts = k.split(',');
      const keyAttractionPart = norm(parts[0] || '');
      const keyCity = norm(parts[1] || '');
      if (!keyCity.includes(destNorm) && !destNorm.includes(keyCity)) return false;
      if (!actNorm || !keyAttractionPart) return false;
      return actNorm.includes(keyAttractionPart) || keyAttractionPart.includes(actNorm);
    });
    if (partialMatch) {
      geocodeCache.set(key, partialMatch[1]);
      return partialMatch[1];
    }

    // Fallback to Nominatim (rate-limited)
    try {
      await new Promise(r => setTimeout(r, 400));
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(actClean + ', ' + dest)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'KINU-TravelOS/1.0' }, signal: AbortSignal.timeout(8000) }
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (data.length > 0) {
        const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        geocodeCache.set(key, result);
        return result;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    abortRef.current = false;
    setLoading(true);
    setPoints([]);

    if (filteredActivities.length === 0) {
      setLoading(false);
      return;
    }

    (async () => {
      const results: GeoPoint[] = [];
      if (hotelNeighborhood) {
        const hotelCoords = await geocode(hotelNeighborhood, destination);
        if (hotelCoords) {
          results.push({ name: `Hotel (${hotelNeighborhood})`, ...hotelCoords, isHotel: true });
        }
      }
      for (const act of filteredActivities) {
        if (abortRef.current) return;
        const coords = await geocode(act.name, destination);
        if (coords) {
          results.push({ name: act.name, time: act.time, ...coords });
        }
      }
      if (!abortRef.current) {
        setPoints(results);
        setLoading(false);
      }
    })();

    return () => { abortRef.current = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination, hotelNeighborhood, JSON.stringify(filteredActivities.map(a => a.name)), geocode]);

  // Fetch real walking routes from OSRM between consecutive points
  useEffect(() => {
    if (points.length < 2) {
      setSegments([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const results: RouteSegment[] = [];
      for (let i = 0; i < points.length - 1; i++) {
        const a = points[i], b = points[i + 1];
        try {
          const url = `https://router.project-osrm.org/route/v1/foot/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;
          const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
          if (!res.ok) continue;
          const data = await res.json();
          const route = data?.routes?.[0];
          if (!route?.geometry?.coordinates) continue;
          const path = (route.geometry.coordinates as [number, number][]).map(
            ([lng, lat]) => [lat, lng] as [number, number]
          );
          results.push({
            path,
            durationMin: Math.round(route.duration / 60),
            distanceKm: (route.distance / 1000).toFixed(1),
          });
        } catch {
          // skip segment
        }
      }
      if (!cancelled) setSegments(results);
    })();
    return () => { cancelled = true; };
  }, [points]);

  if (filteredActivities.length === 0) return null;

  if (loading) {
    return (
      <div className="mb-4">
        <p className="text-xs font-medium text-muted-foreground mb-2 font-['Outfit']">🗺️ Rota do Dia</p>
        <div className="h-[250px] rounded-xl border border-border/50 bg-card/50 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Carregando mapa...
          </div>
        </div>
      </div>
    );
  }

  // Fallback to Google Maps link if no points resolved
  if (points.length === 0) {
    return (
      <div className="mb-4">
        <p className="text-xs font-medium text-muted-foreground mb-2 font-['Outfit']">🗺️ Rota do Dia</p>
        <DayMapLink destination={destination} dayActivities={filteredActivities} />
      </div>
    );
  }

  const polylinePositions = points.map(p => [p.lat, p.lng] as [number, number]);

  return (
    <div className="mb-4">
      <p className="text-xs font-medium text-muted-foreground mb-2 font-['Outfit']">🗺️ Rota do Dia</p>
      <MapErrorBoundary fallback={
        <DayMapLink destination={destination} dayActivities={filteredActivities} />
      }>
        <div className="h-[250px] rounded-xl border border-border/50 overflow-hidden">
          <MapContainer
            center={[points[0].lat, points[0].lng]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <FitBounds points={points} />
            {points.map((point, idx) => (
              <Marker key={idx} position={[point.lat, point.lng]} icon={createNumberedIcon(idx + 1)}>
                <Popup>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#1e293b' }}>
                    <strong>{idx + 1}. {point.name}</strong>
                    {point.time && <div style={{ fontSize: '12px', color: '#64748b' }}>🕐 {point.time}</div>}
                  </div>
                </Popup>
              </Marker>
            ))}
            {segments.length > 0 ? (
              <>
                {segments.map((seg, i) => (
                  <Polyline
                    key={`seg-${i}`}
                    positions={seg.path}
                    pathOptions={{
                      color: 'hsl(199, 89%, 48%)',
                      weight: 3,
                      opacity: 0.8,
                    }}
                  />
                ))}
                {segments.map((seg, i) => {
                  if (seg.path.length === 0) return null;
                  const mid = seg.path[Math.floor(seg.path.length / 2)];
                  const icon = L.divIcon({
                    className: 'route-time-pill',
                    html: `<div style="background:#0f172a;color:#fff;border-radius:9999px;padding:2px 6px;font-size:10px;font-family:'Outfit',sans-serif;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.4);">${seg.durationMin} min</div>`,
                    iconSize: [40, 16],
                    iconAnchor: [20, 8],
                  });
                  return <Marker key={`pill-${i}`} position={mid} icon={icon} interactive={false} />;
                })}
              </>
            ) : (
              polylinePositions.length > 1 && (
                <Polyline
                  positions={polylinePositions}
                  pathOptions={{
                    color: 'hsl(199, 89%, 48%)',
                    weight: 3,
                    dashArray: '8, 6',
                    opacity: 0.8,
                  }}
                />
              )
            )}
          </MapContainer>
        </div>
        {segments.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2 font-['Outfit']">
            🚶 Tempo total de deslocamento: ~{segments.reduce((s, x) => s + x.durationMin, 0)} min
          </p>
        )}
      </MapErrorBoundary>
    </div>
  );
});
