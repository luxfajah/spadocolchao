import { useEffect, useRef, useState } from 'react';
import { registerPlugin, Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import type { BackgroundGeolocationPlugin, Location } from '@capacitor-community/background-geolocation';
import { createClient } from '@/utils/supabase/client';

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');

export function useBackgroundGeolocation(userId: string | null) {
  const [isTracking, setIsTracking] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const watcherIdRef = useRef<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;
    if (!Capacitor.isNativePlatform()) return; // Ignora no desktop web para não quebrar a tela

    let isComponentMounted = true;

    const startTracking = async () => {
      try {
        // Remove watcher anterior se existir
        if (watcherIdRef.current) {
          await BackgroundGeolocation.removeWatcher({ id: watcherIdRef.current });
        }

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
              console.error("BG_GEO_ERROR:", error);
              if (error.code === 'NOT_AUTHORIZED') {
                setLocationError("NOT_AUTHORIZED");
              } else {
                setLocationError("UNKNOWN_ERROR");
              }
              return;
            }

            if (location) {
              setLocationError(null); // GPS is working
              const speedKmH = location.speed != null ? (location.speed * 3.6) : 0;
              const isIdle = speedKmH < 2.0;

              // Upsert na tabela UserLocation (Posição em Tempo Real)
              const { data: existingLoc, error: selErr } = await supabase.from('UserLocation').select('id').eq('userId', userId).single();
              if (selErr && selErr.code !== 'PGRST116') {
                 console.error("Select Error:", JSON.stringify(selErr));
              }

              if (existingLoc) {
                const { error: updErr } = await supabase.from('UserLocation').update({
                  latitude: location.latitude,
                  longitude: location.longitude,
                  speed: speedKmH,
                  heading: location.bearing,
                  accuracy: location.accuracy,
                  updatedAt: new Date().toISOString()
                }).eq('userId', userId);
                if (updErr) console.error("Update Error:", JSON.stringify(updErr));
              } else {
                const { error: insErr } = await supabase.from('UserLocation').insert({
                  id: crypto.randomUUID(),
                  userId,
                  latitude: location.latitude,
                  longitude: location.longitude,
                  speed: speedKmH,
                  heading: location.bearing,
                  accuracy: location.accuracy,
                  updatedAt: new Date().toISOString()
                });
                if (insErr) console.error("Insert Error:", JSON.stringify(insErr));
              }

              // Insert na tabela UserLocationHistory (Histórico para cálculo de quilometragem e ociosidade)
              const { error: histErr } = await supabase.from('UserLocationHistory').insert({
                id: crypto.randomUUID(),
                userId,
                latitude: location.latitude,
                longitude: location.longitude,
                speed: speedKmH,
                heading: location.bearing,
                accuracy: location.accuracy,
                isIdle,
                createdAt: new Date().toISOString()
              });
              if (histErr) console.error("History Insert Error:", JSON.stringify(histErr));
            }
          }
        );
        
        if (isComponentMounted) {
          watcherIdRef.current = watcherId;
          setIsTracking(true);
        } else {
          BackgroundGeolocation.removeWatcher({ id: watcherId });
        }
      } catch (err) {
        console.error("Erro ao iniciar rastreamento", err);
        setLocationError("NOT_AUTHORIZED");
      }
    };

    startTracking();

    // Listen to app state changes (e.g. user went to settings and returned)
    const appStateListener = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        // App resumed, re-try starting tracker to see if permissions/GPS are now granted
        startTracking();
      }
    });

    return () => {
      isComponentMounted = false;
      appStateListener.then(listener => listener.remove());
      if (watcherIdRef.current) {
        BackgroundGeolocation.removeWatcher({ id: watcherIdRef.current });
        watcherIdRef.current = null;
        setIsTracking(false);
      }
    };
  }, [userId]);

  const openSettings = () => {
    BackgroundGeolocation.openSettings();
  };

  return { isTracking, locationError, openSettings };
}
