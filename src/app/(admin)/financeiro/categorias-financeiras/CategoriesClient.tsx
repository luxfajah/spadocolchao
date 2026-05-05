"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog"
import { 
  PlusCircle, 
  Edit, 
  Power, 
  LayoutDashboard, 
  Layers, 
  Tag, 
  ArrowUpRight, 
  ArrowDownLeft,
  Search
} from "lucide-react"
import { saveCategory, toggleCategoryStatus } from "./actions"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import Link from "next/link"
import { PageHeader } from "@/components/layout/PageHeader"
import { useRouter } from "next/navigation"

export function CategoriesClient({ initialData }: { initialData: any[] }) {
  const { toast } = useToast()
  const router = useRouter()
  const [categories, setCategories] = useState(initialData)
  const [showDialog, setShowDialog] = useState(false)
  const [selectedCat, setSelectedCat] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [formData, setFormData] = useState({ 
    id: "", 
    name: "", 
    type: "EXIT",
    description: "" 
  })

  const handleOpenEdit = (cat?: any) => {
    if (cat) {
      setSelectedCat(cat)
      setFormData({ 
        id: cat.id, 
        name: cat.name, 
        type: cat.type || "EXIT",
        description: cat.description || ""
      })
    } else {
      setSelectedCat(null)
      setFormData({ 
        id: "", 
        name: "", 
        type: "EXIT",
        description: "" 
      })
    }
    setShowDialog(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await saveCategory(formData)
      toast({ title: "Sucesso", description: "Categoria salva com sucesso." })
      setShowDialog(false)
      router.refresh()
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await toggleCategoryStatus(id, current)
      toast({ title: "Status alterado" })
      router.refresh()
    } catch (e: any) {
      toast({ title: "Erro ao alterar", description: e.message, variant: "destructive" })
    }
  }

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-1 font-outfit">
      <PageHeader
        title="Categorias Financeiras"
        subtitle="Classifique suas receitas e despesas para um DRE preciso."
        icon={<Layers className="h-8 w-8 text-primary" />}
        actions={
          <div className="flex flex-wrap gap-4">
            <Link href="/financeiro/dashboard">
              <Button
                variant="outline"
                className="rounded-full gap-2 border-slate-200 hover:bg-slate-50 transition-all font-bold text-xs px-6 h-12 shadow-sm uppercase tracking-wider"
              >
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Button>
            </Link>
            <Button 
              onClick={() => handleOpenEdit()}
              className="rounded-full gap-2 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all px-8 h-12 font-black text-xs uppercase tracking-[0.1em]"
            >
              <PlusCircle className="h-4 w-4" /> Nova Categoria
            </Button>
          </div>
        }
      />

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Pesquisar categoria..." 
            className="h-14 pl-12 rounded-2xl border-none shadow-lahomes font-bold text-slate-700 placeholder:text-slate-400 focus-visible:ring-primary/20"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-lahomes overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 border-none">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome da Categoria</TableHead>
              <TableHead className="py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Tipo</TableHead>
              <TableHead className="py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Registros</TableHead>
              <TableHead className="py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</TableHead>
              <TableHead className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.map((cat) => (
              <TableRow key={cat.id} className="group border-slate-50 hover:bg-slate-50/50 transition-colors">
                <TableCell className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                      cat.type === 'ENTRY' ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
                    )}>
                      {cat.type === 'ENTRY' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                    </div>
                    <div>
                       <span className="font-bold text-sm text-slate-800 uppercase tracking-tight block">{cat.name}</span>
                       {cat.description && <span className="text-[10px] text-slate-400 font-medium block truncate max-w-[200px]">{cat.description}</span>}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-6 text-center">
                  <Badge variant="outline" className={cn(
                    "rounded-full px-3 py-0.5 font-black text-[9px] uppercase tracking-widest border-none",
                    cat.type === 'ENTRY' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  )}>
                    {cat.type === 'ENTRY' ? 'Receita' : 'Despesa'}
                  </Badge>
                </TableCell>
                <TableCell className="py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {cat._count?.accountsPayable + cat._count?.accountsReceivable + cat._count?.transactions || 0} vínculos
                </TableCell>
                <TableCell className="py-6 text-center">
                  <Badge variant="outline" className={cn(
                    "rounded-full px-3 py-0.5 font-black text-[9px] uppercase tracking-widest border-none shadow-sm shadow-black/5",
                    cat.isActive ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-300"
                  )}>
                    {cat.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-10 w-10 rounded-2xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all opacity-0 group-hover:opacity-100" 
                      onClick={() => handleOpenEdit(cat)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-10 w-10 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all opacity-0 group-hover:opacity-100" 
                      onClick={() => handleToggle(cat.id, cat.isActive)}
                    >
                      <Power className={cat.isActive ? "w-4 h-4 text-rose-500" : "w-4 h-4 text-emerald-500"} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md rounded-[2.5rem] border-none p-0 overflow-hidden shadow-2xl bg-white">
          <div className="bg-slate-950 p-8 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
             <div className="relative z-10">
                <DialogTitle className="text-xl font-black uppercase italic leading-none tracking-tight">
                  {selectedCat ? 'Editar Categoria' : 'Nova Categoria'}
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
                  Gestão Estrutural de Classificação
                </DialogDescription>
             </div>
          </div>

          <form onSubmit={handleSave} className="p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Tag className="w-3 h-3" /> Nome da Categoria
              </Label>
              <Input 
                required 
                className="h-14 rounded-2xl border-none bg-slate-50 font-bold text-slate-800 focus-visible:ring-primary/20" 
                placeholder="Ex: Aluguel, Vendas, Manutenção..."
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                Tipo de Fluxo
              </Label>
              <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                <SelectTrigger className="h-12 rounded-2xl border-none bg-slate-50 font-bold text-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl font-outfit">
                  <SelectItem value="EXIT" className="font-bold uppercase text-[10px] tracking-widest py-3 text-rose-500">Despesa (Saída)</SelectItem>
                  <SelectItem value="ENTRY" className="font-bold uppercase text-[10px] tracking-widest py-3 text-emerald-500">Receita (Entrada)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Descrição Opcional</Label>
              <Input 
                className="h-14 rounded-2xl border-none bg-slate-50 font-medium text-slate-700 focus-visible:ring-primary/20" 
                placeholder="O que esta categoria contempla..."
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
              />
            </div>

            <DialogFooter className="pt-4">
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 rounded-full bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20"
              >
                {loading ? "Processando..." : "Salvar Categoria"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
