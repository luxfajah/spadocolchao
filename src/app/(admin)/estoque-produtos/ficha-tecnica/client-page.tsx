"use client"

import { useState } from "react"
import { ProductRecipe, ProductService, ProductRecipeItem } from "@prisma/client"
import { useRouter } from "next/navigation"
import { 
  Plus, Search, MoreHorizontal, FileText, CheckCircle2, 
  AlertCircle, Copy, Edit, Trash2, ShieldAlert,
  ClipboardCheck, Settings2, MoreVertical, LayoutGrid, List
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { duplicateFicha, toggleFichaStatus, setFichaDefault, deleteFicha } from "./actions"
import { PageHeader } from "@/components/layout/PageHeader"
import { cn } from "@/lib/utils"

type RecipeWithRelations = any

interface FichaTecnicaClientProps {
  initialFichas: RecipeWithRelations[]
}

export function FichaTecnicaClient({ initialFichas }: FichaTecnicaClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [fichas, setFichas] = useState(initialFichas)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredFichas = fichas.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.productService.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.variant && f.variant.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleDuplicate = async (id: string) => {
    const res = await duplicateFicha(id)
    if (res.success) {
      toast({ title: "Ficha duplicada com sucesso" })
      router.refresh()
    } else {
      toast({ title: "Erro", description: res.error || "Erro ao duplicar", variant: "destructive" })
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const res = await toggleFichaStatus(id, !currentStatus)
    if (res.success) router.refresh()
  }

  const handleSetDefault = async (id: string, productId: string) => {
    const res = await setFichaDefault(id, productId)
    if (res.success) router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta ficha técnica?")) return
    const res = await deleteFicha(id)
    if (res.success) {
      toast({ title: "Ficha excluída" })
      router.refresh()
    } else {
      toast({ title: "Erro", description: "Erro ao excluir", variant: "destructive" })
    }
  }

  const CompletenessBadge = ({ recipe }: { recipe: RecipeWithRelations }) => {
    if (recipe.items.length === 0) {
      return (
        <Badge className="bg-rose-100 text-rose-500 hover:bg-rose-100 border-none px-3 font-black text-[10px] uppercase tracking-wider rounded-full flex gap-1.5 items-center">
          <AlertCircle className="w-3 h-3" /> Sem insumos
        </Badge>
      )
    }
    if (!recipe.estimatedLaborCost || !recipe.estimatedProductionMinutes) {
      return (
        <Badge className="bg-amber-100 text-amber-600 hover:bg-amber-100 border-none px-3 font-black text-[10px] uppercase tracking-wider rounded-full flex gap-1.5 items-center">
          <ShieldAlert className="w-3 h-3" /> Incompleta
        </Badge>
      )
    }
    return (
      <Badge className="bg-emerald-500 text-white hover:bg-emerald-500 border-none px-3 font-black text-[10px] uppercase tracking-wider rounded-full shadow-sm flex gap-1.5 items-center">
        <CheckCircle2 className="w-3 h-3" /> Pronta
      </Badge>
    )
  }

  return (
    <main className="flex-1 py-10 px-6 max-w-[1700px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <PageHeader 
        title="Fichas Técnicas"
        subtitle="Gerencie a estrutura de produção e regras de consumo de materiais."
        icon={<ClipboardCheck className="h-8 w-8" />}
        actions={
          <Button onClick={() => router.push("/estoque-produtos/ficha-tecnica/nova")} className="rounded-full gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all px-8 h-12 font-black text-xs uppercase tracking-[0.1em]">
            <Plus className="h-4 w-4" /> Nova Ficha
          </Button>
        }
      />

      {/* SUMMARY PILLS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Total de Fichas", value: fichas.length.toString(), icon: FileText, color: "text-blue-500", bg: "bg-blue-50" },
          { title: "Fichas Padrão", value: fichas.filter(f => f.isDefault).length.toString(), icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
          { title: "Sem Insumos", value: fichas.filter(f => f.items.length === 0).length.toString(), icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-50" },
          { title: "Geram OP", value: fichas.filter(f => f.generatesProductionOrder).length.toString(), icon: Settings2, color: "text-amber-500", bg: "bg-amber-50" }
        ].map((stat, i) => (
          <Card key={i} className="border-white/40 shadow-lahomes rounded-[2.5rem] overflow-hidden group hover:scale-[1.02] transition-all bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8 pb-8">
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{stat.title}</p>
                  <div className={`p-2 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className={cn("text-3xl font-black font-outfit tracking-tighter italic", i === 2 && parseInt(stat.value) > 0 ? "text-rose-500" : "text-primary")}>
                    {stat.value}
                  </p>
                  <div className="h-1 w-12 bg-primary/10 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-lahomes border border-slate-50 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="relative w-full max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors font-bold" />
              <Input
                placeholder="Buscar por nome ou produto..."
                className="pl-12 rounded-full border-slate-100 focus-visible:ring-primary h-12 text-sm font-medium shadow-inner bg-slate-50/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex bg-slate-100/50 p-1.5 rounded-full ring-1 ring-slate-100">
              <Button variant="ghost" size="sm" className="rounded-full h-9 w-12 bg-white shadow-sm text-primary p-0">
                <List className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="rounded-full h-9 w-12 text-slate-400 p-0">
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
        </div>
        
        <div className="overflow-x-auto no-scrollbar custom-scrollbar">
          <Table className="min-w-[1200px]">
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] h-16 pl-8">Ficha / Variante</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] h-16">Produto Alvo</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] h-16">Insumos</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] h-16">Tempo / Mão de Obra</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] h-16">Status</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] h-16">Completude</TableHead>
                <TableHead className="text-right pr-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFichas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-40 text-slate-400 font-bold uppercase tracking-widest text-xs">
                    Nenhuma ficha técnica mapeada.
                  </TableCell>
                </TableRow>
              ) : (
                filteredFichas.map((ficha) => (
                  <TableRow key={ficha.id} className="hover:bg-slate-50/50 border-slate-50 h-24 group transition-colors cursor-pointer" onClick={() => router.push(`/estoque-produtos/ficha-tecnica/${ficha.id}`)}>
                    <TableCell className="pl-8">
                      <div className="flex flex-col">
                        <span className="font-black text-primary uppercase tracking-tight text-sm font-outfit">{ficha.name}</span>
                        {ficha.variant && <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">{ficha.variant}</span>}
                        {ficha.isDefault && (
                          <div className="mt-1.5">
                            <Badge className="text-[9px] font-black uppercase tracking-widest bg-primary/5 text-primary border border-primary/20 rounded-full px-2 py-0.5">Padrão Operacional</Badge>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-600 text-sm">{ficha.productService.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{ficha.productService.operationalCategory || ficha.operationalCategory || "Geral"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-slate-50 text-slate-500 border border-slate-100 font-black text-[10px] uppercase rounded-full h-6 px-3">
                        {ficha.items.length} itens
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-primary font-outfit">
                          {ficha.estimatedProductionMinutes ? `${ficha.estimatedProductionMinutes} min` : "--"}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {ficha.estimatedLaborCost ? `R$ ${ficha.estimatedLaborCost.toFixed(2)}` : "--"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`border-none font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-full ${ficha.isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-rose-100 text-rose-500'}`}>
                        {ficha.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <CompletenessBadge recipe={ficha} />
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-300 group-hover:text-primary transition-all hover:bg-white hover:shadow-sm">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-60 p-2 rounded-3xl border-slate-100 shadow-2xl mt-1">
                          <DropdownMenuLabel className="text-[10px] font-black text-slate-400 px-4 py-2 uppercase tracking-[0.2em]">Gestão Produtiva</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => router.push(`/estoque-produtos/ficha-tecnica/${ficha.id}`)} className="rounded-2xl gap-3 px-4 py-3 cursor-pointer focus:bg-slate-50 font-bold text-xs text-slate-600 focus:text-primary">
                            <Edit className="h-4 w-4" /> Editar Ficha
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(ficha.id)} className="rounded-2xl gap-3 px-4 py-3 cursor-pointer focus:bg-slate-50 font-bold text-xs text-slate-600">
                            <Copy className="h-4 w-4" /> Duplicar Estrutura
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-50 mx-2" />
                          <DropdownMenuItem onClick={() => handleSetDefault(ficha.id, ficha.productServiceId)} className="rounded-2xl gap-3 px-4 py-3 cursor-pointer text-blue-600 focus:bg-blue-50 focus:text-blue-700 font-bold text-xs">
                            <CheckCircle2 className="h-4 w-4" /> Tornar Padrão
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(ficha.id, ficha.isActive)} className="rounded-2xl gap-3 px-4 py-3 cursor-pointer font-bold text-xs text-slate-600">
                            <AlertCircle className="h-4 w-4" /> {ficha.isActive ? "Desativar Ficha" : "Ativar Ficha"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-50 mx-2" />
                          <DropdownMenuItem className="rounded-2xl gap-3 px-4 py-3 cursor-pointer text-rose-500 focus:bg-rose-50 focus:text-rose-600 font-bold text-xs" onClick={() => handleDelete(ficha.id)}>
                            <Trash2 className="h-4 w-4" /> Excluir Registro
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </main>
  )
}
