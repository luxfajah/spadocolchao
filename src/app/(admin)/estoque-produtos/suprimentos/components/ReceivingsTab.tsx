import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Filter, Search, ArrowDownToLine, Calendar, 
  ExternalLink, Clock, User, ArrowUpRight,
  MoreVertical, Download, ClipboardCheck,
  CheckCircle2
} from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { ClickableRow } from "@/components/ui/ClickableRow"

export async function ReceivingsTab() {
  const receivings = await prisma.purchaseReceiving.findMany({
    include: {
      purchaseOrder: {
        include: { supplier: true }
      },
      receivedBy: true,
      _count: { select: { items: true } }
    },
    orderBy: { receiptDate: "desc" }
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* SEARCH & FILTERS - Dashboard Style */}
      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-white/95 backdrop-blur-md p-6 rounded-[2.5rem] shadow-lahomes border border-slate-50">
        <div className="relative w-full xl:max-w-2xl group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors font-bold" />
          <Input 
            placeholder="PESQUISAR NO HISTÓRICO DE RECEBIMENTO DE CARGA..." 
            className="pl-12 rounded-2xl border-slate-100 bg-slate-50/50 h-14 text-sm font-medium shadow-inner focus-visible:ring-indigo-500/10 tracking-tight" 
          />
        </div>
        <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
          <Button variant="outline" className="rounded-2xl h-14 gap-2 border-slate-100 hover:bg-slate-50 transition-all font-black text-[10px] px-8 shadow-sm uppercase tracking-widest text-slate-500">
            <Filter className="h-4 w-4" /> Período
          </Button>
          <Button variant="outline" className="rounded-2xl h-14 w-14 p-0 border-slate-100 hover:bg-slate-50 transition-all shadow-sm">
            <Download className="h-5 w-5 text-slate-400" />
          </Button>
        </div>
      </div>

      {/* TABLE SECTION - Frameless Premium */}
      <div className="bg-white rounded-[2.75rem] shadow-lahomes border border-slate-50 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar custom-scrollbar">
          <Table className="min-w-[1100px]">
            <TableHeader className="bg-slate-50/70 border-b border-slate-100">
              <TableRow className="hover:bg-transparent h-16">
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] h-16 pl-8">Data de Entrada</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] h-16">Referência Compra</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] h-16">Origem / Fornecedor</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] h-16 text-center">Conferência</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] h-16">Responsável</TableHead>
                <TableHead className="w-20 pr-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receivings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-64 text-slate-300 font-extrabold uppercase tracking-widest text-[10px]">
                     Nenhum histórico de recebimento localizado.
                  </TableCell>
                </TableRow>
              ) : (
                receivings.map((rec: any) => (
                  <ClickableRow 
                    key={rec.id} 
                    href={`/estoque-produtos/recebimentos/${rec.id}`}
                    className="border-slate-50 h-28 hover:bg-slate-50/50 transition-colors group"
                  >
                    <TableCell className="pl-8">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm">
                             <ClipboardCheck className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col">
                             <span className="font-black text-primary uppercase tracking-tight text-base font-outfit leading-none italic">{format(rec.receiptDate, "dd/MM/yyyy")}</span>
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5 opacity-60 flex items-center gap-1.5">
                                <Clock className="h-3 w-3" /> {format(rec.receiptDate, "HH:mm")}
                             </span>
                          </div>
                       </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/estoque-produtos/compras/${rec.purchaseOrderId}`}>
                        <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[9px] uppercase tracking-widest px-4 h-7 rounded-full hover:bg-indigo-600 hover:text-white transition-all">
                          OC #{rec.purchaseOrder.number}
                        </Badge>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="font-black text-slate-600 uppercase tracking-tight text-xs font-outfit opacity-80 truncate max-w-[200px]">{rec.purchaseOrder.supplier.tradeName || rec.purchaseOrder.supplier.legalName}</span>
                    </TableCell>
                    <TableCell className="text-center">
                       <div className="flex flex-col items-center">
                          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full border border-emerald-100 shadow-sm">
                             <CheckCircle2 className="h-3.5 w-3.5" />
                             <span className="font-black text-[10px] uppercase tracking-widest">{rec._count.items} Insumos Lançados</span>
                          </div>
                       </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase shadow-inner">
                            {rec.receivedBy?.name ? rec.receivedBy.name.charAt(0) : "S"}
                          </div>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60 truncate max-w-[120px]">{rec.receivedBy?.name || "LOGÍSTICA"}</span>
                       </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                       <div className="flex justify-end gap-1.5">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-300 group-hover:text-primary transition-all hover:bg-white hover:shadow-sm ring-1 ring-transparent hover:ring-slate-100">
                          <ArrowUpRight className="h-5 w-5" />
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
