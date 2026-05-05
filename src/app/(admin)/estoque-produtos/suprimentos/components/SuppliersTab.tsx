import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Filter, Search, MoreHorizontal, ExternalLink, Mail, Phone, 
  ShoppingBag, Building2, Globe, User, ArrowUpRight,
  MoreVertical, Download, Settings2, Building,
  CheckCircle2
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { ClickableRow } from "@/components/ui/ClickableRow"

export async function SuppliersTab() {
  const suppliers = await prisma.supplier.findMany({
    include: {
      _count: {
        select: {
          supplierSupplyItems: true,
          purchaseOrders: true
        }
      }
    },
    orderBy: { legalName: "asc" }
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* SEARCH & FILTERS - Dashboard Style */}
      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-white/95 backdrop-blur-md p-6 rounded-[2.5rem] shadow-lahomes border border-slate-50">
        <div className="relative w-full xl:max-w-2xl group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors font-bold" />
          <Input 
            placeholder="BUSCAR FORNECEDOR POR NOME, CNPJ OU CIDADE..." 
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
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] pl-8">Parceiro Comercial</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Canais de Contato</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Localidade</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] text-center">Mix de Itens</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] text-center">Pedidos</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] text-center">Status</TableHead>
                <TableHead className="w-20 pr-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-64 text-slate-300 font-black uppercase tracking-[0.2em] text-[10px]">
                     Nenhum fornecedor localizado na base.
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((sup) => (
                  <ClickableRow 
                    key={sup.id} 
                    href={`/estoque-produtos/fornecedores/${sup.id}`}
                    className="border-slate-50 h-28 hover:bg-slate-50/50 transition-colors group"
                  >
                    <TableCell className="pl-8">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-sm font-black text-primary uppercase shadow-inner group-hover:bg-white transition-all duration-500 group-hover:scale-105">
                           {sup.tradeName?.substring(0, 2) || sup.legalName.substring(0, 2)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-black text-primary uppercase tracking-tight text-base font-outfit truncate max-w-[240px] leading-tight">{sup.tradeName || sup.legalName}</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{sup.document || "SEM IDENTIFICAÇÃO"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5 min-w-[180px]">
                        <div className="flex items-center gap-2 font-black text-slate-600 text-[10px] uppercase tracking-tight truncate">
                          <User className="h-3 w-3 text-indigo-400" /> {sup.contactPerson || "CONTATO GERAL"}
                        </div>
                        <div className="flex flex-col space-y-0.5">
                          {sup.phone && <span className="text-[10px] font-bold text-slate-400 tracking-tight flex items-center gap-1.5"><Phone className="h-3 w-3 opacity-40 text-emerald-500" /> {sup.phone}</span>}
                          {sup.email && <span className="text-[10px] font-bold text-slate-400 tracking-tight flex items-center gap-1.5 italic truncate max-w-[160px]"><Mail className="h-3 w-3 opacity-40 text-blue-500" /> {sup.email}</span>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5 group/loc transition-all">
                        <div className="p-2 rounded-xl bg-slate-50 group-hover/loc:bg-slate-100 transition-colors">
                          <Globe className="h-4 w-4 text-slate-300 group-hover/loc:text-indigo-500" />
                        </div>
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight truncate">
                          {sup.city ? `${sup.city} • ${sup.state}` : "Localidade não informada"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xl font-black font-outfit italic tracking-tighter text-indigo-600 leading-none">
                          {sup._count.supplierSupplyItems}
                        </span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50 px-3 py-1 rounded-full border border-slate-100/50 mt-2">ITENS MIPEADOS</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-black text-primary font-outfit text-xl italic tracking-tighter leading-none">{sup._count.purchaseOrders}</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50 px-3 py-1 rounded-full border border-slate-100/50 mt-2">TOTAL PEDIDOS</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn("border-none font-black text-[9px] uppercase tracking-[0.15em] px-4 py-1.5 rounded-full shadow-sm", sup.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500')}>
                        {sup.isActive ? "Parceiro Ativo" : "Bloqueado"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                       <div className="flex justify-end gap-1.5">
                          <Link href={`/estoque-produtos/fornecedores/${sup.id}`}>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-300 hover:text-blue-500 hover:bg-white shadow-sm ring-1 ring-transparent hover:ring-slate-100">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-300 group-hover:text-primary transition-all hover:bg-white hover:shadow-sm ring-1 ring-transparent hover:ring-slate-100">
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
