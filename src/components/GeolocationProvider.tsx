'use client';

import { useBackgroundGeolocation } from '@/hooks/useBackgroundGeolocation';
import { MapPinOff } from 'lucide-react';

export function GeolocationProvider({ userId }: { userId: string | null }) {
  const { locationError, openSettings } = useBackgroundGeolocation(userId);

  if (locationError === 'NOT_AUTHORIZED') {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
        <div className="bg-red-500/10 p-6 rounded-full mb-6">
          <MapPinOff className="w-16 h-16 text-red-500" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Localização Obrigatória
        </h1>
        <p className="text-slate-300 text-lg mb-8 max-w-md">
          O uso do aplicativo só é permitido com o GPS ativado e permissão de localização em tempo integral.
        </p>
        <button 
          onClick={openSettings}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-transform active:scale-95 text-lg"
        >
          Ativar GPS / Permissões
        </button>
      </div>
    );
  }

  return null;
}
