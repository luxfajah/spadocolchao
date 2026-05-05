import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Filter, Search, MoreHorizontal, Eye, Calendar, 
  DollarSign, Package, FileText, CheckCircle2, 
  Clock, AlertCircle, ShoppingCart, 
  MoreVertical, Download, 
  Settings2,
  Trash2,
  ClipboardList,
  ArrowRight
} from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ClickableRow } from "@/components/ui/ClickableRow"

export async function PurchasesTab() {
  const purchases = await prisma.purchaseOrder.findMany({
    include: {
      supplier: true,
      _count: { select: { items: true, receivings: true } }
    },
    orderBy: { orderDate: "desc" }
  })

  const stats = [
    { title: "Rascunhos", value: purchases.filter((p: any) => p.status === 'DRAFT').length, icon: FileText, color: "text-slate-400", bg: "bg-slate-50" },
    { title: "Pendentes", value: purchases.filter((p: any) => p.status === 'PENDING').length, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
    { title: "Parciais", value: purchases.filter((p: any) => p.status === 'PARTIALLY_RECEIVED').length, icon: AlertCircle, color: "text-indigo-500", bg: "bg-indigo-50" },
    { title: "Concluídos", value: purchases.filter((p: any) => p.status === 'RECEIVED').length, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" }
  ]

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-10">
      {/* STATUS CARDS - Premium Tracking */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-lahomes rounded-[2.5rem] overflow-hidden group hover:scale-[1.02] transition-all bg-white relative">
            <CardContent className="p-8">
              <div className="flex flex-col gap-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div className={cn("p-3 rounded-2xl shadow-sm transition-transform group-hover:rotate-12", stat.bg)}>
                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.title}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-4xl font-black text-primary font-outfit tracking-tighter italic leading-none">{stat.value}</p>
                  <div className="h-1.5 w-10 bg-slate-100 rounded-full group-hover:w-full transition-all duration-700" />
                </div>
              </div>
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-150 transition-transform duration-1000">
                 <stat.icon className="w-24 h-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* SEARCH & FILTERS - Dashboard Style */}
      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-white/95 backdrop-blur-md p-6 rounded-[2.5rem] shadow-lahomes border border-slate-50">
        <div className="relative w-full xl:max-w-2xl group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors font-bold" />
          <Input 
            placeholder="BUSCAR ORDEM DE COMPRA POR NÚMERO OU FORNECEDOR..." 
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
        </div>
      </div>

      {/* TABLE SECTION - Frameless Premium */}
      <div className="bg-white rounded-[2.75rem] shadow-lahomes border border-slate-50 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar custom-scrollbar">
          <Table className="min-w-[1200px]">
            <TableHeader className="bg-slate-50/70 border-b border-slate-100">
              <TableRow className="hover:bg-transparent h-16">
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] h-16 pl-8">Logística e OC</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] h-16">Fornecedor Relacionado</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] h-16">Cronograma</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] h-16 text-center">SKUS</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] h-16 text-right">Montante Total</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] text-center">Status Pedido</TableHead>
                <TableHead className="w-20 pr-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-64 text-slate-300 font-extrabold uppercase tracking-widest text-[10px]">
                     Nenhuma ordem de compra localizada.
                  </TableCell>
                </TableRow>
              ) : (
                purchases.map((compra: any) => (
                  <ClickableRow 
                    key={compra.id} 
                    href={`/estoque-produtos/compras/${compra.id}`}
                    className="border-slate-50 h-28 hover:bg-slate-50/50 transition-colors group"
                  >
                    <TableCell className="pl-8">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-[1.25rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-primary group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm">
                             <ClipboardList className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col">
                             <span className="font-black text-primary uppercase tracking-tight text-base font-outfit leading-tight italic">#{compra.number}</span>
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5 opacity-60">ID {compra.id.slice(-6).toUpperCase()}</span>
                          </div>
                       </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex flex-col">
                          <span className="font-black text-slate-600 uppercase tracking-tight text-xs font-outfit opacity-90 truncate max-w-[220px]">{compra.supplier.tradeName || compra.supplier.legalName}</span>
                          <span className="text-[9px] font-black text-slate-400 truncate max-w-[180px] mt-1.5 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100/50 uppercase tracking-tight">{compra.notes || "S/ OBSERVAÇÕES"}</span>
                       </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex flex-col space-y-2">
                          <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <Calendar className="h-3.5 w-4 text-slate-300" /> Aberto {format(compra.orderDate, "dd/MM/yyyy")}
                          </div>
                          {compra.expectedDeliveryDate && (
                            <div className="flex items-center gap-2 text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                              <Package className="h-3.5 w-4 opacity-50" /> Previsto {format(compra.expectedDeliveryDate, "dd/MM/yyyy")}
                            </div>
                          )}
                       </div>
                    </TableCell>
                    <TableCell className="text-center">
                       <div className="flex flex-col items-center">
                          <span className="font-black text-primary font-outfit text-2xl italic tracking-tighter leading-none">{compra._count.items}</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50 px-3 py-1 rounded-full border border-slate-100/50 mt-2">ITENS COMPRADOS</span>
                       </div>
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="flex flex-col items-end pr-4">
                          <span className="text-2xl font-black text-primary font-outfit italic tracking-tighter leading-none">R$ {compra.totalAmount.toFixed(2)}</span>
                       </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn("border-none font-black text-[9px] uppercase tracking-[0.15em] px-4 py-1.5 rounded-full shadow-sm", 
                        compra.status === 'RECEIVED' ? 'bg-emerald-50 text-emerald-600' : 
                        compra.status === 'PARTIALLY_RECEIVED' ? 'bg-indigo-50 text-indigo-600' : 
                        compra.status === 'CANCELLED' ? 'bg-rose-50 text-rose-500' : 
                        compra.status === 'DRAFT' ? 'bg-slate-100 text-slate-400' : 
                        'bg-amber-50 text-amber-600'
                      )}>
                        {compra.status === 'RECEIVED' ? 'Totalmente Recebido' : 
                         compra.status === 'PARTIALLY_RECEIVED' ? 'Recebido Parcial' : 
                         compra.status === 'CANCELLED' ? 'Cancelado' : 
                         compra.status === 'DRAFT' ? 'Rascunho Interno' : 'Pedido em Aberto'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                       <div className="flex justify-end gap-1.5">
                        <Link href={`/estoque-produtos/compras/${compra.id}`}>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-primary bg-slate-50 border border-slate-100 hover:bg-white shadow-sm ring-1 ring-transparent hover:ring-slate-100">
                            <Eye className="h-5 w-5" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-300 transition-all hover:bg-white hover:shadow-sm ring-1 ring-transparent hover:ring-slate-100">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </ClickableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
