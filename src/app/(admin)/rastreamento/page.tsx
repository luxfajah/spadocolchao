import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { MapPin, Route as RouteIcon } from 'lucide-react';

const MapClient = dynamic(() => import('./MapClient'), {
  ssr: false, // react-leaflet não funciona no servidor (SSR)
});

export default function RastreamentoPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full">
      <div className="p-6 bg-white border-b shadow-sm z-10 flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="text-emerald-500" />
              Rastreamento ao Vivo
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Acompanhe a localização em tempo real da equipe (Entregadores e Vendedores). O mapa é atualizado automaticamente.
            </p>
          </div>
          <a 
            href="/rastreamento/historico" 
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
          >
            <RouteIcon className="w-4 h-4" />
            Ver Histórico
          </a>
        </div>
      </div>
      <div className="flex-1 relative bg-slate-100">
        <Suspense fallback={<div className="flex items-center justify-center h-full text-slate-500">Carregando mapa...</div>}>
          <MapClient />
        </Suspense>
      </div>
    </div>
  );
}
