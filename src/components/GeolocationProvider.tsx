'use client';

import { useBackgroundGeolocation } from '@/hooks/useBackgroundGeolocation';

export function GeolocationProvider({ userId }: { userId: string | null }) {
  useBackgroundGeolocation(userId);
  return null; // Apenas injeta a lógica, não renderiza nada visualmente.
}
