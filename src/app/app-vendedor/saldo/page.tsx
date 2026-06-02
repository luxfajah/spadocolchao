import { getSalesSummary } from "@/lib/services/sales"

export default async function AppVendedorSaldoPage() {
  const summary = await getSalesSummary()

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-xl font-bold text-slate-800">Meu Saldo</h1>
      

      <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-col items-center justify-center py-8">
        <span className="text-slate-500 font-medium mb-2">Vendas no Mês</span>
        <span className="text-4xl font-black text-blue-600">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.monthTotal)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-2">
        <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-col">
          <span className="text-slate-500 text-xs font-medium">Vendas Hoje</span>
          <span className="text-lg font-bold text-slate-800 mt-1">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.todayTotal)}
          </span>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-col">
          <span className="text-slate-500 text-xs font-medium">Ticket Médio</span>
          <span className="text-lg font-bold text-slate-800 mt-1">
             {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.ticketMedio)}
          </span>
        </div>
      </div>

      <div className="bg-green-50 rounded-xl shadow-sm border border-green-100 p-4 flex flex-col items-center justify-center py-6 mt-4">
        <span className="text-green-700 font-medium mb-1">Comissão Estimada (Mês)</span>
        <span className="text-2xl font-black text-green-600">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.monthTotal * 0.05)} {/* Estimativa fixa 5% para exemplo */}
        </span>
        <span className="text-[10px] text-green-600/70 mt-1">Aproximadamente 5%</span>
      </div>
    </div>
  )
}
