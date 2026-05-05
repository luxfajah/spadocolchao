"use client"

import { useState, useTransition, useMemo } from "react"
import Link from "next/link"
import { ProductService, ProductRecipe } from "@prisma/client"
import { 
  Plus, PlusCircle, Search, Edit, Copy, Trash2, 
  MoreVertical, CheckSquare, Square, Package, Activity, 
  CheckCircle2, LayoutGrid, List, X, Filter, Settings2,
  PackageSearch, Sparkles, ArrowUpRight, ImageIcon
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { toggleProdutoServicoStatus, duplicateProduct, deleteProduct, massActionProducts } from "./actions"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/PageHeader"

type ProductWithRelations = ProductService & {
  recipes: ProductRecipe[]
  primarySupplier: { legalName: string, tradeName: string | null } | null
  imageUrl?: string | null
}

const getTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    SERVICE: "Serviço",
    PRODUCT: "Produto final",
    INSUMO: "Insumo",
    TECIDO: "Tecido",
    ESPUMA: "Espuma",
    ESTRUTURA: "Estrutura",
    LIMPEZA: "Limpeza"
  }
  return map[type] || type
}

export function ProdutosServicosClient({ items }: { items: ProductWithRelations[] }) {
  const [q, setQ] = useState("")
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const [typeFilter, setTypeFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [pdvFilter, setPdvFilter] = useState("ALL")

  const filteredItems = useMemo(() => {
    return items.filter(i => {
      const matchQ = i.name.toLowerCase().includes(q.toLowerCase()) || 
                     (i.code && i.code.toLowerCase().includes(q.toLowerCase()))
      const matchType = typeFilter === "ALL" ? true : i.type === typeFilter
      const matchStatus = statusFilter === "ALL" ? true : 
                          statusFilter === "ACTIVE" ? i.isActive : !i.isActive
      const matchPdv = pdvFilter === "ALL" ? true :
                       pdvFilter === "YES" ? i.highlightInPDV : !i.highlightInPDV
      
      return matchQ && matchType && matchStatus && matchPdv
    })
  }, [items, q, typeFilter, statusFilter, pdvFilter])

  const total = items.length
  const ativados = items.filter(i => i.isActive).length
  const inativos = total - ativados
  const destaquesPdv = items.filter(i => i.highlightInPDV).length

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredItems.map(i => i.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedIds(newSet)
  }

  const handleAction = (actionFn: () => Promise<any>, successMsg: string) => {
    startTransition(async () => {
      try {
        const result = await actionFn()
        if (result && result.error) throw new Error(result.error)
        toast({ title: "Sucesso", description: successMsg })
      } catch (e: any) {
        toast({ title: "Erro", description: e.message || "Ação falhou", variant: "destructive" })
      }
    })
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <section className="relative overflow-hidden rounded-[2.75rem] border border-slate-900 bg-slate-950 text-white shadow-[0_30px_80px_-32px_rgba(15,23,42,0.85)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.15),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.1),transparent_35%)]" />
        <div className="relative p-8 md:p-10 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="min-w-0 max-w-[42rem] space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                Catálogo Operacional
              </div>
              <div className="min-w-0 space-y-3">
                <h2 className="text-3xl leading-[0.95] md:text-5xl font-black uppercase italic tracking-tight font-outfit">
                  Produtos & Serviços
                </h2>
                <p className="max-w-3xl text-sm text-slate-300 leading-relaxed font-medium">
                  Gestão centralizada de itens finais, serviços e materiais de produção com indicadores de status e visibilidade no PDV.
                </p>
              </div>
            </div>

            <div className="flex w-full min-w-0 flex-col items-start gap-4 lg:w-auto lg:items-end">
              <Link href="/estoque-produtos/produtos-servicos/new">
                <Button className="rounded-full gap-3 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all px-10 h-14 font-black text-xs uppercase tracking-[0.1em]">
                  <Plus className="h-5 w-5" /> Novo Cadastro
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total cadastrado", value: total, icon: Package, color: "text-blue-400" },
              { label: "Itens ativos", value: ativados, icon: CheckCircle2, color: "text-emerald-400" },
              { label: "Itens inativos", value: inativos, icon: X, color: "text-rose-400" },
              { label: "Destaque no PDV", value: destaquesPdv, icon: Activity, color: "text-amber-400" }
            ].map((stat, i) => (
              <div key={i} className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5 group hover:bg-white/10 transition-colors">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{stat.label}</p>
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                </div>
                <p className="text-3xl font-black italic font-outfit tracking-tighter text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FILTER BAR - Sales Sector Style */}
      <div className="sticky top-6 z-10 flex flex-col xl:flex-row gap-4 items-center justify-between bg-white/95 backdrop-blur-md p-6 rounded-[2.5rem] shadow-lahomes border border-slate-50">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
          <div className="relative w-full md:w-[28rem] group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors font-bold" />
            <Input 
              placeholder="Buscar por nome ou código..." 
              value={q} onChange={e => setQ(e.target.value)}
              className="pl-12 rounded-2xl border-slate-100 focus-visible:ring-primary h-12 text-sm font-medium bg-slate-50/50"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar py-1">
            <select 
              value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="h-12 px-5 rounded-2xl border-slate-100 bg-slate-50/80 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-primary/5 cursor-pointer hover:bg-slate-100 transition-all shadow-sm border"
            >
              {["ALL", "PRODUCT", "SERVICE", "INSUMO"].map(o => (
                <option key={o} value={o}>{o === "ALL" ? "TIPOS" : getTypeLabel(o)}</option>
              ))}
            </select>
            
            <select 
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="h-12 px-5 rounded-2xl border-slate-100 bg-slate-50/80 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-primary/5 cursor-pointer hover:bg-slate-100 transition-all shadow-sm border"
            >
              {[
                { val: "ALL", label: "STATUS (TODOS)" },
                { val: "ACTIVE", label: "ATIVOS" },
                { val: "INACTIVE", label: "INATIVOS" }
              ].map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
          <div className="flex bg-slate-100/60 p-1.5 rounded-2xl ring-1 ring-slate-100">
            <Button 
              variant="ghost" 
              onClick={() => setViewMode("table")} 
              className={cn("h-9 w-12 rounded-xl transition-all p-0", viewMode === 'table' ? 'bg-white shadow-sm text-primary border border-slate-50' : 'text-slate-400')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setViewMode("cards")} 
              className={cn("h-9 w-12 rounded-xl transition-all p-0", viewMode === 'cards' ? 'bg-white shadow-sm text-primary border border-slate-50' : 'text-slate-400')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" className="rounded-2xl h-12 w-12 p-0 border-slate-100 hover:bg-slate-50 shadow-sm text-slate-400">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="rounded-2xl h-12 w-12 p-0 border-slate-100 hover:bg-slate-50 shadow-sm text-slate-400 font-black">
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* RENDERER */}
      {viewMode === "table" ? (
        <div className="bg-white rounded-[2.75rem] shadow-lahomes border border-slate-50 overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <Table>
              <TableHeader className="bg-slate-50/70 border-b border-slate-100">
                <TableRow className="hover:bg-transparent h-16">
                  <TableHead className="w-16 pl-8">
                    <button onClick={toggleSelectAll} className="p-2 transition-all hover:bg-slate-100 rounded-xl">
                      {selectedIds.size === filteredItems.length && filteredItems.length > 0 ? (
                        <CheckSquare className="h-5 w-5 text-primary" />
                      ) : (
                        <Square className="h-5 w-5 text-slate-200" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Identificação</TableHead>
                  <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Tipo / Classe</TableHead>
                  <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] text-right pr-12">Valor Base</TableHead>
                  <TableHead className="w-20 pr-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((i) => (
                  <TableRow key={i.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors group h-24">
                    <TableCell className="pl-8">
                      <button onClick={() => toggleSelect(i.id)} className="p-3 rounded-xl transition-all">
                        {selectedIds.has(i.id) ? (
                          <CheckSquare className="h-5 w-5 text-primary animate-in zoom-in-50 duration-300" />
                        ) : (
                          <Square className="h-5 w-5 text-slate-200 group-hover:text-slate-300" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                          {i.imageUrl ? (
                            <img src={i.imageUrl} alt={i.name} className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-5 w-5 text-slate-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-black text-primary text-sm uppercase tracking-tight font-outfit truncate block">{i.name}</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{i.code || "S/ COD"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <Badge className="w-fit bg-slate-100 text-slate-500 hover:bg-slate-200 border-none px-3 font-black text-[9px] uppercase tracking-wider rounded-lg">
                          {getTypeLabel(i.type)}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-1.5 h-1.5 rounded-full", i.isActive ? "bg-emerald-500 ring-4 ring-emerald-50" : "bg-slate-300")} />
                          <span className="text-[9px] font-black uppercase text-slate-400">{i.isActive ? "Ativo" : "Inativo"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-12 font-black text-emerald-600 font-outfit italic text-xl">
                      {i.defaultPrice ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(i.defaultPrice) : "R$ 0,00"}
                    </TableCell>
                    <TableCell className="pr-8 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-300 group-hover:text-primary transition-all hover:bg-white hover:shadow-sm ring-1 ring-transparent hover:ring-slate-100">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-60 p-2 rounded-3xl border-slate-100 shadow-2xl mt-1">
                          <DropdownMenuLabel className="text-[10px] font-black text-slate-400 px-4 py-2 uppercase tracking-[0.2em]">Gestão de Item</DropdownMenuLabel>
                          <Link href={`/estoque-produtos/produtos-servicos/${i.id}`}>
                            <DropdownMenuItem className="rounded-2xl gap-3 px-4 py-3 cursor-pointer focus:bg-slate-50 font-bold text-xs text-slate-600 focus:text-primary">
                              <Edit className="h-4 w-4" /> Editar Registro
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem onClick={() => handleAction(() => duplicateProduct(i.id), "Duplicado")} className="rounded-2xl gap-3 px-4 py-3 cursor-pointer focus:bg-slate-50 font-bold text-xs text-slate-600">
                            <Copy className="h-4 w-4" /> Duplicar Cadastro
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-50 mx-2" />
                          <DropdownMenuItem onClick={() => handleAction(() => deleteProduct(i.id), "Excluído")} className="rounded-2xl gap-3 px-4 py-3 cursor-pointer text-rose-500 focus:bg-rose-50 focus:text-rose-600 font-bold text-xs">
                            <Trash2 className="h-4 w-4" /> Remover Item
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
           {filteredItems.map(i => (
             <Card key={i.id} className="group relative flex flex-col min-h-[460px] rounded-[2.75rem] border-none bg-white shadow-lahomes overflow-hidden hover:-translate-y-2 transition-all duration-500">
                {/* Header (Image placeholder or real image) */}
                <div className="relative h-60 bg-slate-50 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent z-10" />
                  {i.imageUrl ? (
                    <img src={i.imageUrl} alt={i.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-200">
                      <ImageIcon className="h-16 w-16 opacity-40" />
                    </div>
                  )}
                  
                  <div className="absolute top-6 left-6 z-20 flex flex-wrap gap-2">
                    <Badge className="bg-white/95 backdrop-blur-sm text-primary border-none px-3 font-black text-[9px] uppercase tracking-widest rounded-full shadow-sm">
                      {getTypeLabel(i.type)}
                    </Badge>
                  </div>

                  <div className="absolute top-6 right-6 z-20">
                    <div className={cn("h-4 w-4 rounded-full shadow-lg ring-4 ring-white/30", i.isActive ? "bg-emerald-500" : "bg-slate-300")} />
                  </div>
                </div>

                <div className="flex-1 p-8 space-y-6 flex flex-col justify-between relative">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                       <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.18em]">{i.code || "SEM CÓDIGO"}</span>
                       <div className="h-1 w-1 bg-slate-200 rounded-full" />
                       <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.18em]">{i.operationalCategory || "Geral"}</span>
                    </div>
                    <h3 className="text-2xl font-black text-primary font-outfit uppercase italic tracking-tighter leading-[0.9] group-hover:text-primary/80 transition-colors">
                      {i.name}
                    </h3>
                  </div>

                  <div className="space-y-6">
                    <div className="flex flex-col">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Preço base operacional</p>
                      <div className="flex items-end gap-1">
                        <span className="text-4xl font-black text-emerald-600 font-outfit italic tracking-tighter">
                          {i.defaultPrice ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(i.defaultPrice) : "R$ 0,00"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Link href={`/estoque-produtos/produtos-servicos/${i.id}`} className="w-full">
                        <Button className="w-full bg-slate-900 hover:bg-primary text-white rounded-2xl font-black uppercase text-[10px] tracking-widest h-14 shadow-xl border-none transition-all">
                          Ver Detalhes
                        </Button>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="h-14 rounded-2xl border-slate-100 text-slate-400 hover:text-primary transition-all font-black">
                            Ações
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="rounded-3xl p-2 border-slate-50 shadow-2xl w-52">
                          <DropdownMenuItem onClick={() => handleAction(() => duplicateProduct(i.id), "Duplicado")} className="rounded-2xl gap-3 px-4 py-3 font-bold text-xs">
                             <Copy className="h-4 w-4" /> Duplicar Item
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-50" />
                          <DropdownMenuItem onClick={() => handleAction(() => deleteProduct(i.id), "Excluído")} className="rounded-2xl gap-3 px-4 py-3 text-rose-500 font-bold text-xs">
                             <Trash2 className="h-4 w-4" /> Excluir Registro
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
             </Card>
           ))}
        </div>
      )}
    </div>
  )
}
