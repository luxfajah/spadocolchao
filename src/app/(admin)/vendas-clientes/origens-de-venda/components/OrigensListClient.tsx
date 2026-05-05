"use client"

import { useState, useMemo } from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Search, 
  Edit, 
  Trash2, 
  MoreVertical, 
  Plus, 
  Filter,
  CheckCircle2,
  XCircle,
  BarChart3,
  TrendingUp,
  Target,
  ShoppingCart,
  Award,
  DollarSign
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { LeadSourceDialog } from "./LeadSourceDialog"
import { toggleLeadSourceStatus, deleteLeadSource } from "../actions"
import { useToast } from "@/hooks/use-toast"
import { PageHeader } from "@/components/layout/PageHeader"
import { MapPin, Download, FileBarChart } from "lucide-react"

interface OrigensListClientProps {
  initialData: any[]
  stats: any
}

export function OrigensListClient({ initialData, stats }: OrigensListClientProps) {
  const { toast } = useToast()
  const [data, setData] = useState(initialData)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  
  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSource, setEditingSource] = useState<any>(null)

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.code.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
      return matchesSearch && matchesCategory
    }).sort((a, b) => (b.priority || 0) - (a.priority || 0))
  }, [data, searchTerm, categoryFilter])

  const handleToggleStatus = async (id: string, current: boolean) => {
    const result = await toggleLeadSourceStatus(id, current)
    if (result.success) {
      setData(prev => prev.map(item => item.id === id ? { ...item, isActive: !current } : item))
      toast({ title: current ? "Origem desativada" : "Origem ativada" })
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta origem? Esta ação não pode ser desfeita.")) {
      const result = await deleteLeadSource(id)
      if (result.success) {
        setData(prev => prev.filter(item => item.id !== id))
        toast({ title: "Origem excluída com sucesso" })
      } else {
        toast({ title: "Erro ao excluir", description: result.error, variant: "destructive" })
      }
    }
  }

  const openEdit = (source: any) => {
    setEditingSource(source)
    setIsDialogOpen(true)
  }

  const openCreate = () => {
    setEditingSource(null)
    setIsDialogOpen(true)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <div className="space-y-10">
      <PageHeader 
        title="Origens de Venda"
        subtitle="Mapeamento de canais de captação e origens de leads comerciais."
        icon={
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
             <MapPin className="h-6 w-6 text-indigo-600 font-bold" />
          </div>
        }
        actions={
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-2xl h-11 px-6 gap-2 border-slate-200 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-all shadow-sm">
              <Download className="h-4 w-4 text-slate-500" /> Exportar
            </Button>
            <Button variant="outline" className="rounded-2xl h-11 px-6 gap-2 border-slate-200 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-all shadow-sm">
              <FileBarChart className="h-4 w-4 text-slate-500" /> Relatório
            </Button>
            <Button 
              onClick={openCreate}
              className="rounded-2xl h-11 px-8 gap-2 bg-slate-900 hover:bg-black font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/10 transition-all hover:scale-[1.02]"
            >
              <Plus className="h-4 w-4" /> Nova Origem
            </Button>
          </div>
        }
      />

      {/* Modernized Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {[
          { label: "Ativas", value: stats.totalActive, icon: Target, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Vendas (30d)", value: stats.periodSalesCount, icon: ShoppingCart, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Faturamento", value: formatCurrency(stats.periodTotalValue), icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Campeã", value: stats.championSource, icon: Award, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Ticket Médio", value: stats.highestTicketSource, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Performance", value: stats.bestPerformance, icon: BarChart3, color: "text-rose-600", bg: "bg-rose-50" }
        ].map((card, i) => (
          <Card key={i} className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-white group hover:scale-[1.05] transition-all duration-500 overflow-hidden">
             <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                   <div className="flex justify-between items-center">
                      <div className={`w-10 h-10 rounded-2xl ${card.bg} flex items-center justify-center`}>
                         <card.icon className={`h-5 w-5 ${card.color}`} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{card.label}</span>
                   </div>
                   <h3 className="text-xl font-black italic tracking-tighter text-slate-800 truncate">{card.value}</h3>
                </div>
             </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-center justify-between">
         <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
            <div className="relative group w-full md:w-96">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
               <Input 
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 placeholder="Buscar por nome ou código..." 
                 className="h-14 pl-12 rounded-[1.5rem] border-slate-100 bg-white shadow-xl shadow-slate-200/50 focus:ring-indigo-500 font-bold text-xs"
               />
            </div>
            
            <div className="flex items-center gap-2">
               {[
                 { id: "all", label: "Todas" },
                 { id: "Digital paga", label: "Digital Paga" },
                 { id: "Digital orgânica", label: "Orgânica" },
                 { id: "Loja física", label: "Lojas" },
                 { id: "Indicação", label: "Indicações" }
               ].map(cat => (
                 <Button 
                   key={cat.id} 
                   variant={categoryFilter === cat.id ? 'default' : 'ghost'} 
                   size="sm"
                   onClick={() => setCategoryFilter(cat.id)}
                   className={`rounded-xl h-10 px-4 font-black text-[10px] uppercase tracking-widest transition-all ${categoryFilter === cat.id ? 'bg-indigo-600 shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                 >
                    {cat.label}
                 </Button>
               ))}
            </div>
         </div>
      </div>

      <Card className="rounded-[3rem] border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <Table className="min-w-[1000px]">
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-100">
                <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[9px] h-16 pl-10">Origem / Identificador</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[9px]">Categoria</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[9px]">Vendas (30d)</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[9px]">Faturamento</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[9px]">Ticket Médio</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[9px]">Última Venda</TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[9px]">Status</TableHead>
                <TableHead className="text-right pr-10 font-black text-slate-400 uppercase tracking-widest text-[9px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-50">
              {filteredData.map((o) => (
                <TableRow 
                  key={o.id} 
                  className="group hover:bg-slate-50/50 transition-all h-24 cursor-pointer"
                  onClick={() => openEdit(o)}
                >
                  <TableCell className="pl-10">
                    <div className="flex flex-col gap-1">
                      <span className="font-black text-sm text-slate-800 uppercase italic tracking-tight group-hover:text-indigo-600 transition-colors uppercase">{o.name}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{o.code}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest px-3 py-1 bg-white">
                      {o.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <span className="font-black text-sm text-slate-700">{o.periodSalesCount}</span>
                       <span className="text-[9px] font-bold text-slate-300 uppercase italic">vendas</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-black text-lg text-slate-800 italic tracking-tighter">
                      {formatCurrency(o.periodTotalValue)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-black text-sm text-emerald-600 italic">
                      {formatCurrency(o.ticketMedio)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                      {o.lastSale ? new Date(o.lastSale).toLocaleDateString('pt-BR') : '---'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div onClick={(e) => { e.stopPropagation(); handleToggleStatus(o.id, o.isActive); }} className="cursor-pointer">
                       {o.isActive ? (
                         <Badge className="bg-emerald-100 text-emerald-600 border-none font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-xl shadow-sm">
                            <CheckCircle2 className="h-3 w-3 mr-1.5" /> Ativo
                         </Badge>
                       ) : (
                         <Badge className="bg-slate-100 text-slate-400 border-none font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-xl">
                            <XCircle className="h-3 w-3 mr-1.5" /> Inativo
                         </Badge>
                       )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-10" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-all">
                             <MoreVertical className="h-4 w-4" />
                          </Button>
                       </DropdownMenuTrigger>
                       <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 shadow-2xl p-2 min-w-[180px]">
                          <DropdownMenuItem onClick={() => openEdit(o)} className="rounded-xl h-11 px-4 gap-3 font-bold text-xs text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
                             <Edit className="h-4 w-4 text-indigo-500" /> Editar Origem
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(o.id, o.isActive)} className="rounded-xl h-11 px-4 gap-3 font-bold text-xs text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
                             {o.isActive ? <XCircle className="h-4 w-4 text-amber-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />} 
                             {o.isActive ? 'Desativar' : 'Ativar'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-50" />
                          <DropdownMenuItem onClick={() => handleDelete(o.id)} className="rounded-xl h-11 px-4 gap-3 font-bold text-xs text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all cursor-pointer">
                             <Trash2 className="h-4 w-4" /> Excluir Registro
                          </DropdownMenuItem>
                       </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-40">
                     <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center">
                           <MapPin className="h-8 w-8 text-slate-200" />
                        </div>
                        <div>
                           <h4 className="font-black text-xs uppercase tracking-widest text-slate-400 italic">Vazio por aqui</h4>
                           <p className="text-[10px] font-bold text-slate-300 uppercase mt-1">Nenhuma origem encontrada com esses critérios.</p>
                        </div>
                     </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <LeadSourceDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        source={editingSource}
        onSuccess={() => {
           // Refresh logic if needed or just rely on revalidatePath
           window.location.reload() 
        }}
      />
    </div>
  )
}
