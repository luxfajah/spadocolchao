import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { AlertCircle, ShoppingCart, TrendingDown, ArrowRight, ShieldAlert, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { ClickableRow } from "@/components/ui/ClickableRow"

export async function LowStockTab() {
  const lowStockItems = await prisma.supplyItem.findMany({
    where: {
      isActive: true,
      currentStock: {
        lt: prisma.supplyItem.fields.minimumStock
      }
    },
    include: {
      category: true,
      primarySupplier: true
    },
    orderBy: { currentStock: "asc" }
  })

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-10">
      {/* HIGHLIGHT ALERT PANEL */}
      <div className={cn(
        "relative overflow-hidden rounded-[2.75rem] p-10 shadow-lahomes border-none transition-all duration-700 group",
        lowStockItems.length > 0 ? "bg-rose-600 text-white shadow-rose-200/40" : "bg-white border border-slate-50"
      )}>
        {/* Background Decorative Element */}
        <div className="absolute -right-10 -top-10 opacity-10 group-hover:scale-110 transition-transform duration-1000">
          {lowStockItems.length > 0 ? <ShieldAlert className="w-80 h-80 text-white" /> : <CheckCircle2 className="w-80 h-80 text-emerald-50" />}
        </div>

        <div className="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 text-center md:text-left">
            <div className={cn(
              "p-6 rounded-[2rem] shadow-xl flex items-center justify-center transition-transform group-hover:rotate-12 duration-500",
              lowStockItems.length > 0 ? "bg-white text-rose-600 shadow-rose-900/10" : "bg-emerald-50 text-emerald-500"
            )}>
              {lowStockItems.length > 0 ? <AlertCircle className="h-10 w-10 font-black" /> : <CheckCircle2 className="h-10 w-10" />}
            </div>
            <div className="space-y-3">
              <h3 className={cn(
                "text-3xl md:text-5xl font-black font-outfit uppercase italic tracking-tighter leading-[0.9]",
                lowStockItems.length > 0 ? "text-white" : "text-primary"
              )}>
                {lowStockItems.length > 0 ? `${lowStockItems.length} Alertas de Ruptura` : "Estoque em Conformidade"}
              </h3>
              <p className={cn(
                "font-bold text-xs uppercase tracking-[0.2em] max-w-2xl leading-relaxed",
                lowStockItems.length > 0 ? "text-rose-100" : "text-slate-400"
              )}>
                {lowStockItems.length > 0 
                  ? "Identificamos itens operacionais abaixo do nível de segurança. A falta destes insumos pode causar atrasos críticos na produção e paradas de linha."
                  : "Todos os seus insumos ativos estão com saldos acima da margem de segurança configurada. Operação estável e sem riscos de ruptura detectados."}
              </p>
            </div>
          </div>
          
          {lowStockItems.length > 0 && (
            <Button className="rounded-full gap-4 bg-white text-rose-600 hover:bg-white/90 shadow-2xl shadow-rose-900/20 transition-all px-12 h-16 font-black text-xs uppercase tracking-[0.2em] group/btn shrink-0">
               Reposição Automática <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-2 transition-transform" />
            </Button>
          )}
        </div>
      </div>

      {/* TABLE SECTION - Frameless Premium */}
      <div className="bg-white rounded-[2.75rem] shadow-lahomes border border-slate-50 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar custom-scrollbar">
          <Table className="min-w-[1100px]">
            <TableHeader className="bg-slate-50/70 border-b border-slate-100">
              <TableRow className="hover:bg-transparent h-16">
                <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[9px] h-16 pl-8">Insumo e Categoria</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[9px] h-16">Fornecedor Principal</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[9px] h-16 text-center">Déficit Crítico</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[9px] h-16 text-center">Saldo Atual</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[9px] h-16 text-center">Segurança (Mín)</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[9px] h-16 text-right pr-8">Estimativa Reposição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-64 text-slate-300 font-extrabold uppercase tracking-widest text-[10px]">
                    Nenhum alerta pendente no momento. Excelente gestão!
                  </TableCell>
                </TableRow>
              ) : (
                lowStockItems.map(item => {
                  const deficit = item.minimumStock - item.currentStock
                  const estimatedCost = deficit * (item.lastPurchaseCost || item.averageCost || 0)
                  
                  return (
                    <ClickableRow 
                      key={item.id} 
                      href={`/estoque-produtos/insumos/${item.id}`}
                      className="hover:bg-rose-50/30 border-slate-50 h-28 group"
                    >
                      <TableCell className="pl-8">
                        <div className="flex flex-col min-w-0">
                          <span className="font-black text-primary uppercase tracking-tight text-base font-outfit truncate">{item.name}</span>
                          <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                             CÓD {item.code || '---'} • {item.category?.name || "GERAL"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                         <span className="font-black text-slate-600 uppercase tracking-tight text-xs font-outfit opacity-80">{item.primarySupplier?.tradeName || item.primarySupplier?.legalName || 'NÃO DEFINIDO'}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-600 px-4 py-1.5 rounded-full border border-rose-100 shadow-sm">
                           <TrendingDown className="h-3.5 w-3.5" />
                           <span className="font-black text-[10px] uppercase tracking-widest">-{deficit.toFixed(2)} {item.unit}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                         <span className={cn("text-2xl font-black font-outfit italic tracking-tighter leading-none", item.currentStock <= 0 ? 'text-rose-600' : 'text-amber-500')}>
                           {item.currentStock.toFixed(2)}
                         </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
                          {item.minimumStock.toFixed(2)} {item.unit}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex flex-col items-end">
                           <span className="text-xl font-black text-rose-600 font-outfit italic tracking-tighter leading-none">R$ {estimatedCost.toFixed(2)}</span>
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 opacity-60 italic">Custo Ref.</span>
                        </div>
                      </TableCell>
                    </ClickableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
