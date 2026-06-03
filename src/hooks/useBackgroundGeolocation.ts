import { useEffect, useRef, useState } from 'react';
import { registerPlugin } from '@capacitor/core';
import type { BackgroundGeolocationPlugin, Location } from '@capacitor-community/background-geolocation';
import { createSupabaseClient } from '@/utils/supabase/client';

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');

export function useBackgroundGeolocation(userId: string | null) {
  const [isTracking, setIsTracking] = useState(false);
  const watcherIdRef = useRef<string | null>(null);
  const supabase = createSupabaseClient();

  useEffect(() => {
    if (!userId) return;

    let isComponentMounted = true;

    const startTracking = async () => {
      try {
        const watcherId = await BackgroundGeolocation.addWatcher(
          {
            backgroundMessage: "Gravando rota no plano de fundo.",
            backgroundTitle: "Rastreamento Ativo",
            requestPermissions: true,
            stale: false,
            distanceFilter: 15, // Atualiza a cada 15 metros de movimentação
          },
          async function callback(location: Location | undefined, error) {
            if (error) {
              if (error.code === 'NOT_AUTHORIZED') {
                if (window.confirm("O app precisa da permissão 'Permitir o tempo todo' para registrar as rotas em segundo plano. Deseja abrir as configurações?")) {
                  BackgroundGeolocation.openSettings();
                }
              }
              return;
            }

            if (location) {
              const speedKmH = location.speed != null ? (location.speed * 3.6) : 0;
              const isIdle = speedKmH < 2.0; // Menos de 2 km/h é considerado parado ou andando devagar.

              // Upsert na tabela UserLocation (Posição em Tempo Real)
              await supabase.from('UserLocation').upsert({
                userId,
                latitude: location.latitude,
                longitude: location.longitude,
                speed: speedKmH,
                heading: location.bearing,
                accuracy: location.accuracy,
                updatedAt: new Date().toISOString()
              }, { onConflict: 'userId' });

              // Insert na tabela UserLocationHistory (Histórico para cálculo de quilometragem e ociosidade)
              await supabase.from('UserLocationHistory').insert({
                userId,
                latitude: location.latitude,
                longitude: location.longitude,
                speed: speedKmH,
                heading: location.bearing,
                accuracy: location.accuracy,
                isIdle,
                createdAt: new Date().toISOString()
              });
            }
          }
        );
        
        if (isComponentMounted) {
          watcherIdRef.current = watcherId;
          setIsTracking(true);
        } else {
          // Se o componente já desmontou enquanto aguardava a permissão/inicio
          BackgroundGeolocation.removeWatcher({ id: watcherId });
        }
      } catch (err) {
        console.error("Erro ao iniciar rastreamento", err);
      }
    };

    startTracking();

    return () => {
      isComponentMounted = false;
      if (watcherIdRef.current) {
        BackgroundGeolocation.removeWatcher({ id: watcherIdRef.current });
        watcherIdRef.current = null;
        setIsTracking(false);
      }
    };
  }, [userId]);

  return { isTracking };
}
