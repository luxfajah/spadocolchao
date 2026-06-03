import { prisma } from "@/lib/prisma";
import { getUserRouteHistory } from "./actions";
import { MapIcon, Clock, Route as RouteIcon, Search, Calendar as CalendarIcon, User as UserIcon } from "lucide-react";
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Leaflet map needs to be dynamically imported with SSR disabled
const HistoryMapClient = dynamic(() => import("./HistoryMapClient"), { 
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[400px] bg-slate-100 animate-pulse flex items-center justify-center rounded-lg border">Carregando mapa...</div>
});

export const metadata = {
  title: 'Histórico de Rastreamento',
};

export default async function HistoricoRastreamentoPage({
  searchParams
}: {
  searchParams: { userId?: string; date?: string }
}) {
  // Padrão: hoje
  const today = new Date().toISOString().split('T')[0];
  const dateStr = searchParams.date || today;
  const selectedUserId = searchParams.userId || "";

  // Busca lista de usuários para o select
  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true, roles: { include: { role: true } } },
    orderBy: { name: 'asc' }
  });

  // Busca histórico se um usuário foi selecionado
  let historyData = null;
  if (selectedUserId) {
    historyData = await getUserRouteHistory(selectedUserId, dateStr);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <RouteIcon className="w-6 h-6 text-blue-600" />
            Histórico de Rotas
          </h1>
          <p className="text-slate-500">Visualize a quilometragem percorrida e as paradas ociosas de cada funcionário.</p>
        </div>
      </div>

      <Card className="border-blue-100 shadow-sm">
        <CardContent className="p-6">
          <form className="flex flex-col md:flex-row gap-4 items-end" method="GET">
            <div className="flex-1 w-full space-y-2">
              <label htmlFor="userId" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                Funcionário
              </label>
              <select 
                id="userId"
                name="userId" 
                defaultValue={selectedUserId}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                required
              >
                <option value="" disabled>Selecione um funcionário...</option>
                {users.map(u => {
                  const roleName = u.roles?.[0]?.role?.name || 'Sem cargo';
                  return (
                    <option key={u.id} value={u.id}>{u.name} ({roleName})</option>
                  );
                })}
              </select>
            </div>

            <div className="w-full md:w-64 space-y-2">
              <label htmlFor="date" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Data
              </label>
              <input 
                type="date" 
                id="date"
                name="date" 
                defaultValue={dateStr}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                required
              />
            </div>

            <Button type="submit" className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 h-[46px] px-8">
              <Search className="w-4 h-4 mr-2" />
              Buscar Histórico
            </Button>
          </form>
        </CardContent>
      </Card>

      {!historyData && selectedUserId && (
        <div className="bg-white p-12 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-slate-400">
          <RouteIcon className="w-12 h-12 mb-4 text-slate-200" />
          <p>Nenhum histórico encontrado para este usuário na data selecionada.</p>
        </div>
      )}

      {!selectedUserId && (
        <div className="bg-blue-50 p-12 rounded-xl border border-blue-100 flex flex-col items-center justify-center text-blue-600/70">
          <MapIcon className="w-16 h-16 mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-blue-800">Selecione um funcionário</h3>
          <p className="text-blue-600/80 mt-1">Para visualizar o trajeto e a quilometragem percorrida no dia.</p>
        </div>
      )}

      {historyData && (
        <div className="space-y-6">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-none text-white shadow-md">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-blue-100 font-medium mb-1">Quilometragem Percorrida</p>
                  <h3 className="text-4xl font-bold">{historyData.totalDistanceKm} <span className="text-xl font-normal opacity-80">km</span></h3>
                </div>
                <div className="p-4 bg-white/10 rounded-full">
                  <RouteIcon className="w-8 h-8 text-white" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 border-none text-white shadow-md">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-orange-100 font-medium mb-1">Tempo Total Ocioso (Parado)</p>
                  <h3 className="text-4xl font-bold">{historyData.totalIdleMinutes} <span className="text-xl font-normal opacity-80">min</span></h3>
                </div>
                <div className="p-4 bg-white/10 rounded-full">
                  <Clock className="w-8 h-8 text-white" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Mapa ocupando 2/3 da tela no desktop */}
            <div className="lg:col-span-2">
              <HistoryMapClient points={historyData.points} stops={historyData.stops} />
            </div>

            {/* Lista de Paradas */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Paradas Longas ({historyData.stops.length})
              </h3>
              
              <div className="flex-1 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar space-y-3">
                {historyData.stops.length === 0 ? (
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-lg text-center text-slate-500">
                    Nenhuma parada longa registrada. O funcionário esteve em movimento.
                  </div>
                ) : (
                  historyData.stops.map((stop, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:border-orange-300 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-slate-700">Parada #{idx + 1}</span>
                        <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded-full">
                          {stop.durationMinutes} min
                        </span>
                      </div>
                      <div className="text-sm text-slate-500 flex flex-col gap-1">
                        <div><strong className="text-slate-600">Início:</strong> {new Date(stop.startAt).toLocaleTimeString()}</div>
                        <div><strong className="text-slate-600">Fim:</strong> {new Date(stop.endAt).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
