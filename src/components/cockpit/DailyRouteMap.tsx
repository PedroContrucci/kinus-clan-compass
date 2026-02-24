import { memo, useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface DailyRouteMapProps {
  destination: string;
  activities: { name: string; time?: string; category?: string }[];
}

interface GeoPoint {
  name: string;
  time?: string;
  lat: number;
  lng: number;
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

// Auto-fit map bounds to markers
function FitBounds({ points }: { points: GeoPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
  }, [points, map]);
  return null;
}

// Geocoding cache shared across renders
const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

export const DailyRouteMap = memo(({ destination, activities }: DailyRouteMapProps) => {
  const [points, setPoints] = useState<GeoPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef(false);

  const filteredActivities = activities.filter(a => !isLogistics(a));

  const geocode = useCallback(async (name: string, dest: string): Promise<{ lat: number; lng: number } | null> => {
    const key = `${name}|${dest}`;
    if (geocodeCache.has(key)) return geocodeCache.get(key)!;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name + ', ' + dest)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'KINU-TravelOS/1.0' } }
      );
      const data = await res.json();
      if (data.length > 0) {
        const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        geocodeCache.set(key, result);
        return result;
      }
      geocodeCache.set(key, null);
      return null;
    } catch {
      geocodeCache.set(key, null);
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
      for (const act of filteredActivities) {
        if (abortRef.current) return;
        const coords = await geocode(act.name, destination);
        if (coords) {
          results.push({ name: act.name, time: act.time, ...coords });
        }
        // Rate limit: 1 second between uncached requests
        if (!geocodeCache.has(`${act.name}|${destination}`)) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
      if (!abortRef.current) {
        setPoints(results);
        setLoading(false);
      }
    })();

    return () => { abortRef.current = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination, JSON.stringify(filteredActivities.map(a => a.name)), geocode]);

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

  if (points.length === 0) return null;

  const polylinePositions = points.map(p => [p.lat, p.lng] as [number, number]);

  return (
    <div className="mb-4">
      <p className="text-xs font-medium text-muted-foreground mb-2 font-['Outfit']">🗺️ Rota do Dia</p>
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
          {polylinePositions.length > 1 && (
            <Polyline
              positions={polylinePositions}
              pathOptions={{
                color: 'hsl(199, 89%, 48%)',
                weight: 3,
                dashArray: '8, 6',
                opacity: 0.8,
              }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
});
