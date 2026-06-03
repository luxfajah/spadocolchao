"use server"

import { prisma } from "@/lib/prisma"

export interface IdleStop {
  startAt: string;
  endAt: string;
  durationMinutes: number;
  latitude: number;
  longitude: number;
}

export interface RouteHistoryData {
  totalDistanceKm: number;
  totalIdleMinutes: number;
  stops: IdleStop[];
  points: { lat: number; lng: number }[];
}

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function getUserRouteHistory(userId: string, dateStr: string): Promise<RouteHistoryData> {
  const startOfDay = new Date(dateStr + 'T00:00:00.000-03:00'); // Fuso horário do Brasil
  const endOfDay = new Date(dateStr + 'T23:59:59.999-03:00');

  const history = await prisma.userLocationHistory.findMany({
    where: {
      userId,
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  let totalDistanceKm = 0;
  let totalIdleMinutes = 0;
  const stops: IdleStop[] = [];
  const points: { lat: number; lng: number }[] = [];

  let currentStop: IdleStop | null = null;

  for (let i = 0; i < history.length; i++) {
    const loc = history[i];
    points.push({ lat: loc.latitude, lng: loc.longitude });

    // Distance calculation
    if (i > 0) {
      const prevLoc = history[i - 1];
      const dist = calculateHaversineDistance(prevLoc.latitude, prevLoc.longitude, loc.latitude, loc.longitude);
      
      // Se tiver um pulo bizarro (ex: > 50km de distância em < 1 minuto), podemos ignorar (GPS glitch). 
      // Mas para simplificar, somamos tudo.
      if (dist < 50) {
        totalDistanceKm += dist;
      }
    }

    // Idle Calculation
    if (loc.isIdle) {
      if (!currentStop) {
        currentStop = {
          startAt: loc.createdAt.toISOString(),
          endAt: loc.createdAt.toISOString(),
          durationMinutes: 0,
          latitude: loc.latitude,
          longitude: loc.longitude,
        };
      } else {
        currentStop.endAt = loc.createdAt.toISOString();
        const start = new Date(currentStop.startAt).getTime();
        const end = new Date(currentStop.endAt).getTime();
        currentStop.durationMinutes = Math.round((end - start) / 60000);
      }
    } else {
      if (currentStop) {
        // Se a parada foi maior que 2 minutos, registramos
        if (currentStop.durationMinutes >= 2) {
          stops.push({ ...currentStop });
          totalIdleMinutes += currentStop.durationMinutes;
        }
        currentStop = null;
      }
    }
  }

  // Se terminou o dia parado, fecha a última parada
  if (currentStop && currentStop.durationMinutes >= 2) {
    stops.push({ ...currentStop });
    totalIdleMinutes += currentStop.durationMinutes;
  }

  return {
    totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
    totalIdleMinutes,
    stops,
    points
  };
}
