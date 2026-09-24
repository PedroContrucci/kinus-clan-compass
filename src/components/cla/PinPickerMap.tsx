// Mini-mapa para "Marcar no mapa": toque solta o pino.
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  center: [number, number];
  value: { lat: number; lng: number } | null;
  onPick: (p: { lat: number; lng: number }) => void;
}

function ClickCatcher({ onPick }: { onPick: Props['onPick'] }) {
  useMapEvents({
    click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
}

export const PinPickerMap = ({ center, value, onPick }: Props) => (
  <div className="h-48 rounded-xl overflow-hidden border border-border">
    <MapContainer center={center} zoom={13} maxZoom={19} className="h-full w-full" scrollWheelZoom={false}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap"
        maxZoom={19}
      />
      <ClickCatcher onPick={onPick} />
      {value && (
        <CircleMarker
          center={[value.lat, value.lng]}
          radius={9}
          pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#10b981', fillOpacity: 1 }}
        />
      )}
    </MapContainer>
  </div>
);

export default PinPickerMap;
