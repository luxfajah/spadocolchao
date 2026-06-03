'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { createClient } from '@/utils/supabase/client';

// Correção para ícones do leaflet no Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

interface UserLocation {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  updatedAt: string;
  user?: {
    name: string;
    roles?: { role: { name: string } }[];
  };
}

export default function MapClient() {
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const supabase = createClient();
  const mapRef = useRef<L.Map>(null);

  useEffect(() => {
    // 1. Busca inicial das posições
    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from('UserLocation')
        .select(`
          *,
          user:User(
            name,
            roles:UserRole(
              role:Role(name)
            )
          )
        `);
      
      if (data) {
        setLocations(data as unknown as UserLocation[]);
      }
    };

    fetchLocations();

    // 2. Inscrever-se para mudanças em tempo real
    const channel = supabase
      .channel('realtime_locations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'UserLocation' },
        async (payload) => {
          const newLoc = payload.new as UserLocation;
          
          setLocations((prev) => {
            const exists = prev.find(l => l.userId === newLoc.userId);
            if (exists) {
              return prev.map(l => l.userId === newLoc.userId ? { ...newLoc, user: exists.user } : l);
            } else {
              // Se for um usuário novo no mapa, busca os detalhes dele
              supabase.from('User')
                .select('name, roles:UserRole(role:Role(name))')
                .eq('id', newLoc.userId)
                .single()
                .then(({data}) => {
                  if (data) {
                    setLocations(current => current.map(l => l.userId === newLoc.userId ? { ...l, user: data as any } : l));
                  }
                });
              return [...prev, newLoc];
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={[-25.5478, -54.5880]} // Foz do Iguaçu
        zoom={13} 
        className="w-full h-full"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {locations.map((loc) => {
          // Tentar pegar o nome da role principal (Vendedor ou Entregador)
          const roleName = loc.user?.roles?.[0]?.role?.name || 'Funcionário';
          
          return (
            <Marker key={loc.userId} position={[loc.latitude, loc.longitude]}>
              <Popup className="rounded-lg">
                <div className="flex flex-col gap-1 min-w-[200px]">
                  <div className="font-bold text-slate-800 text-lg border-b pb-1">
                    {loc.user?.name || 'Carregando...'}
                  </div>
                  
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-slate-500 font-medium">Cargo:</span>
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-xs font-semibold">
                      {roleName}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Velocidade:</span>
                    <span className="font-semibold text-slate-700">
                      {loc.speed != null ? loc.speed.toFixed(1) : 0} km/h
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 mt-2 text-right">
                    Atualizado às {new Date(loc.updatedAt).toLocaleTimeString()}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
