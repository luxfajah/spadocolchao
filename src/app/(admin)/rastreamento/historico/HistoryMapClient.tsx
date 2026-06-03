'use client';

import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { IdleStop } from './actions';

// Correção de ícones do Leaflet
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

// Ícone customizado para as paradas (amarelo/laranja)
const stopIcon = typeof window !== 'undefined' ? new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
}) : undefined;

interface HistoryMapClientProps {
  points: { lat: number; lng: number }[];
  stops: IdleStop[];
}

export default function HistoryMapClient({ points, stops }: HistoryMapClientProps) {
  // Center no primeiro ponto da rota, ou Foz do Iguaçu por padrão
  const center: [number, number] = points.length > 0 
    ? [points[0].lat, points[0].lng] 
    : [-25.5478, -54.5880];

  const positions: [number, number][] = points.map(p => [p.lat, p.lng]);

  return (
    <div className="w-full h-full relative z-0 min-h-[400px] lg:min-h-[600px] rounded-lg overflow-hidden shadow-sm border">
      <MapContainer 
        center={center} 
        zoom={13} 
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Linha da rota percorrida */}
        {positions.length > 1 && (
          <Polyline 
            positions={positions} 
            color="#3b82f6" // Azul (tailwind blue-500)
            weight={4}
            opacity={0.8}
          />
        )}

        {/* Marcador de Início da Rota */}
        {positions.length > 0 && (
          <Marker position={positions[0]}>
            <Popup>
              <strong>Início da Rota</strong>
            </Popup>
          </Marker>
        )}

        {/* Marcador de Fim da Rota */}
        {positions.length > 1 && (
          <Marker position={positions[positions.length - 1]}>
            <Popup>
              <strong>Fim da Rota</strong>
            </Popup>
          </Marker>
        )}

        {/* Marcadores das Paradas Ociosas */}
        {stops.map((stop, idx) => (
          <Marker 
            key={idx} 
            position={[stop.latitude, stop.longitude]}
            icon={stopIcon}
          >
            <Popup className="rounded-lg">
              <div className="flex flex-col gap-1 min-w-[200px]">
                <div className="font-bold text-orange-600 text-base border-b pb-1">
                  Parada #{idx + 1}
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-slate-500 font-medium">Início:</span>
                  <span className="text-slate-700">{new Date(stop.startAt).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Fim:</span>
                  <span className="text-slate-700">{new Date(stop.endAt).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between text-sm bg-orange-50 p-1 rounded mt-1">
                  <span className="text-orange-800 font-bold">Duração:</span>
                  <span className="text-orange-800 font-bold">{stop.durationMinutes} min</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
