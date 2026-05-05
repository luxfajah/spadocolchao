import { prisma } from "@/lib/prisma"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Package, Truck, ShoppingCart, CheckCheck, 
  TrendingDown, DollarSign, BarChart3, 
  History, ArrowRight, Boxes, AlertCircle,
  Warehouse, Timer, ClipboardCheck
} from "lucide-react"
import { cn } from "@/lib/utils"

export async function OverviewTab() {
  const totalInsumos = await prisma.supplyItem.count({ where: { isActive: true } })
  const totalFornecedores = await prisma.supplier.count({ where: { isActive: true } })
  const comprasAbertas = await prisma.purchaseOrder.count({ where: { status: { in: ['DRAFT', 'PENDING'] } } })
  
  const inLowStock = await prisma.supplyItem.count({
    where: {
      isActive: true,
      currentStock: { lt: prisma.supplyItem.fields.minimumStock }
    }
  })

  // Mock value calculation (this would be real in production)
  const estimatedInventoryValue = "R$ 142.580,00"

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-10">
      {/* HIGHLIGHT SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 relative overflow-hidden rounded-[2.75rem] bg-slate-950 p-10 text-white shadow-lahomes group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent_40%)]" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">
                <Warehouse className="h-3.5 w-3.5" />
                Valor em Patrimônio
              </div>
              <h3 className="text-4xl md:text-6xl font-black font-outfit italic tracking-tighter leading-none">
                {estimatedInventoryValue}
              </h3>
              <p className="text-slate-400 font-medium text-sm max-w-md">
                Estimativa total baseada no custo médio atual dos {totalInsumos} insumos ativos em estoque.
              </p>
            </div>
            
            <div className="mt-10 flex gap-8">
               <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Giros de Estoque</p>
                 <p className="text-2xl font-black font-outfit italic">4.2x <span className="text-xs text-emerald-400 not-italic">/mês</span></p>
               </div>
               <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Acuracidade</p>
                 <p className="text-2xl font-black font-outfit italic">98.5%</p>
               </div>
            </div>
          </div>
          <BarChart3 className="absolute -bottom-10 -right-10 w-64 h-64 text-white/5 -rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
        </div>

        <div className="flex flex-col gap-6">
           <Card className="flex-1 rounded-[2.75rem] border-none shadow-lahomes bg-white group hover:scale-[1.02] transition-all">
             <CardContent className="p-8 flex flex-col justify-between h-full">
               <div className="flex justify-between items-start">
                  <div className="p-4 rounded-3xl bg-rose-50 text-rose-500">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <Badge className="bg-rose-100 text-rose-600 border-none font-black text-[9px] uppercase tracking-widest">Alerta Crítico</Badge>
               </div>
               <div className="mt-6 space-y-1">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Itens em Baixa</p>
                 <h4 className="text-4xl font-black font-outfit italic text-primary">{inLowStock}</h4>
                 <p className="text-[11px] font-bold text-slate-500 leading-tight pt-2">Exige reposição imediata para evitar parada na produção.</p>
               </div>
             </CardContent>
           </Card>

           <Card className="flex-1 rounded-[2.75rem] border-none shadow-lahomes bg-indigo-50/50 group hover:scale-[1.02] transition-all border border-indigo-100/50">
             <CardContent className="p-8 flex flex-col justify-between h-full">
               <div className="flex justify-between items-start">
                  <div className="p-4 rounded-3xl bg-white text-indigo-600 shadow-sm">
                    <Timer className="h-6 w-6" />
                  </div>
               </div>
               <div className="mt-6 space-y-1">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Compras Pendentes</p>
                 <h4 className="text-4xl font-black font-outfit italic text-primary">{comprasAbertas}</h4>
                 <p className="text-[11px] font-bold text-slate-500 leading-tight pt-2">Pedidos em aguardo de aprovação ou trânsito.</p>
               </div>
             </CardContent>
           </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Painel de Análise de Compras */}
        <div className="lg:col-span-3 bg-white rounded-[2.75rem] shadow-lahomes border border-slate-50 p-10 flex flex-col relative overflow-hidden group">
           <div className="relative z-10 space-y-8">
             <div>
              <h3 className="text-2xl font-black text-primary font-outfit uppercase italic tracking-tighter mb-1">Previsão de Demanda</h3>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Análise de consumo vs entradas recentes</p>
             </div>
             
             <div className="flex-1 min-h-[340px] bg-slate-50/50 rounded-[2.2rem] border-2 border-dashed border-slate-200/50 flex flex-col items-center justify-center text-center p-8 transition-colors group-hover:bg-slate-50 group-hover:border-slate-300/50">
                <div className="bg-white p-5 rounded-[1.5rem] shadow-sm mb-4">
                  <BarChart3 className="h-7 w-7 text-indigo-400" />
                </div>
                <p className="text-slate-400 font-extrabold uppercase text-[10px] tracking-widest max-w-[240px] leading-relaxed">
                  Sistema de Inteligência Recharts <br/>Processando histórico de movimentações...
                </p>
             </div>
           </div>
        </div>

        {/* Timeline de Movimentações */}
        <div className="lg:col-span-2 bg-white rounded-[2.75rem] shadow-lahomes border border-slate-50 p-0 flex flex-col overflow-hidden group">
           <div className="p-10 pb-8 flex items-center justify-between border-b border-slate-50/80 bg-slate-50/30">
              <div className="flex flex-col line-h-none">
                <h3 className="text-2xl font-black text-primary font-outfit uppercase italic tracking-tighter">Fluxo Recente</h3>
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-1">Conferência e Recebimentos</p>
              </div>
              <div className="p-3 bg-white rounded-2xl shadow-sm">
                <ClipboardCheck className="h-5 w-5 text-indigo-500" />
              </div>
           </div>
           
           <div className="flex-1 p-10 space-y-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex items-center gap-5 p-5 rounded-[1.5rem] bg-white border border-slate-50 hover:border-slate-100 hover:shadow-sm transition-all cursor-pointer group/row">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 group-hover/row:bg-indigo-50 transition-colors flex items-center justify-center text-slate-300 group-hover/row:text-indigo-400">
                    <Package className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Recebimento #{200+i}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700 truncate">Tecido Jaquard Gold • Lote 44{i}</span>
                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-1 italic">Processado com Sucesso</span>
                  </div>
                  <ArrowRight className="h-4 w-4 ml-auto text-slate-200 group-hover/row:text-primary transition-all group-hover/row:translate-x-1" />
                </div>
              ))}
              
              <Button variant="ghost" className="w-full rounded-2xl h-14 border border-slate-100 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50">
                 Ver Histórico Completo
              </Button>
           </div>
        </div>
      </div>
    </div>
  )
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", className)}>
      {children}
    </span>
  )
}
