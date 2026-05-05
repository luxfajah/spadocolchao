import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Filter, Search, MoreHorizontal, FileText, CheckCircle2, 
  AlertTriangle, AlertCircle, Package, ArrowUpRight,
  MoreVertical, Download, Settings2, ImageIcon
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { ClickableRow } from "@/components/ui/ClickableRow"

export async function SupplyItemsTab() {
  const items = await prisma.supplyItem.findMany({
    include: {
      category: true,
      primarySupplier: true
    },
    orderBy: { name: "asc" }
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* SEARCH & FILTERS - Dashboard Style */}
      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-white/95 backdrop-blur-md p-6 rounded-[2.5rem] shadow-lahomes border border-slate-50">
        <div className="relative w-full xl:max-w-2xl group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors font-bold" />
          <Input 
            placeholder="BUSCAR INSUMOS POR NOME, CÓDIGO OU CATEGORIA..." 
            className="pl-12 rounded-2xl border-slate-100 bg-slate-50/50 h-14 text-sm font-medium shadow-inner focus-visible:ring-indigo-500/10 tracking-tight" 
          />
        </div>
        <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
          <Button variant="outline" className="rounded-2xl h-14 gap-2 border-slate-100 hover:bg-slate-50 transition-all font-black text-[10px] px-8 shadow-sm uppercase tracking-widest text-slate-500">
            <Filter className="h-4 w-4" /> Filtros
          </Button>
          <Button variant="outline" className="rounded-2xl h-14 w-14 p-0 border-slate-100 hover:bg-slate-50 transition-all shadow-sm">
            <Download className="h-5 w-5 text-slate-400" />
          </Button>
          <Button variant="outline" className="rounded-2xl h-14 w-14 p-0 border-slate-100 hover:bg-slate-50 transition-all shadow-sm">
            <Settings2 className="h-5 w-5 text-slate-400" />
          </Button>
        </div>
      </div>

      {/* TABLE SECTION - Frameless Premium */}
      <div className="bg-white rounded-[2.75rem] shadow-lahomes border border-slate-50 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar custom-scrollbar">
          <Table className="min-w-[1200px]">
            <TableHeader className="bg-slate-50/70 border-b border-slate-100">
              <TableRow className="hover:bg-transparent h-16">
                <TableHead className="w-28 text-center pl-8 font-black text-slate-400 uppercase tracking-widest text-[9px]">Mídia</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Insumo e Identificação</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Fornecedor</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] text-center">Estoque Atual</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] text-right">Custo Médio</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] text-center">Status</TableHead>
                <TableHead className="w-20 pr-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-64 text-slate-300 font-black uppercase tracking-[0.2em] text-[10px]">
                     Nenhum insumo localizado para exibição.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const hasLowStock = item.currentStock < item.minimumStock
                  return (
                    <ClickableRow 
                      key={item.id} 
                      href={`/estoque-produtos/insumos/${item.id}`}
                      className="border-slate-50 h-28 hover:bg-slate-50/50 transition-colors group"
                    >
                      <TableCell className="pl-8 text-center">
                        <div className="relative w-16 h-16 rounded-[1.25rem] overflow-hidden border border-slate-100 shadow-sm mx-auto group-hover:scale-105 transition-transform duration-500 bg-slate-50 flex items-center justify-center">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-slate-200" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                             <span className="font-black text-primary uppercase tracking-tight text-base font-outfit truncate">{item.name}</span>
                             {hasLowStock && (
                               <div className="bg-rose-100 p-1 rounded-full animate-pulse shadow-sm shadow-rose-200/50">
                                 <AlertCircle className="h-3 w-3 text-rose-600" />
                               </div>
                             )}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            {item.code && <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-100/50">{item.code}</span>}
                            {item.category?.name && <span className="text-[9px] font-black text-indigo-400/70 uppercase tracking-widest">• {item.category.name}</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.primarySupplier ? (
                          <div className="flex flex-col">
                            <span className="font-black text-slate-600 uppercase tracking-tight text-[11px] truncate max-w-[180px]">{item.primarySupplier.tradeName || item.primarySupplier.legalName}</span>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-60">Parceiro Homologado</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-black text-slate-300 uppercase italic tracking-widest">Pendente</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <div className={cn("text-2xl font-black font-outfit italic tracking-tighter leading-none", hasLowStock ? 'text-rose-500' : 'text-primary')}>
                            {item.currentStock.toFixed(2)}
                            <span className="text-[10px] uppercase font-black text-slate-400 opacity-40 ml-1.5 not-italic">{item.unit}</span>
                          </div>
                          <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.25em] bg-slate-50 px-3 py-1 rounded-full border border-slate-100/50 mt-2">Segurança: {item.minimumStock.toFixed(2)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end pr-4">
                          <span className="text-xl font-black text-emerald-600 font-outfit italic tracking-tighter">R$ {item.averageCost.toFixed(2)}</span>
                          {item.lastPurchaseCost && (
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Última: R$ {item.lastPurchaseCost.toFixed(2)}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn("border-none font-black text-[9px] uppercase tracking-[0.15em] px-4 py-1.5 rounded-full shadow-sm", item.isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400')}>
                          {item.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-300 group-hover:text-primary transition-all hover:bg-white hover:shadow-sm ring-1 ring-transparent hover:ring-slate-100">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
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
