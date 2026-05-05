"use client"

import { useState, useEffect } from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Trophy, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  TrendingUp, 
  DollarSign, 
  Percent,
  AlertCircle
} from "lucide-react"
import { getGoalPolicies, upsertGoalPolicy, deleteGoalPolicy } from "@/app/(admin)/configuracoes/regras-de-comissao/actions"
import { useToast } from "@/hooks/use-toast"

export function PolicyManagement() {
  const { toast } = useToast()
  const [policies, setPolicies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [newPolicy, setNewPolicy] = useState({
    name: "",
    minGoalPercent: 0,
    maxGoalPercent: 0,
    multiplier: 1.0,
    bonusPercentage: 0,
    bonusFixedAmount: 0
  })

  const loadPolicies = async () => {
    setLoading(true)
    const data = await getGoalPolicies()
    setPolicies(data)
    setLoading(false)
  }

  useEffect(() => {
    loadPolicies()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await upsertGoalPolicy(null, newPolicy)
    if (result.success) {
      toast({ title: "Política criada com sucesso" })
      setIsAdding(false)
      loadPolicies()
    } else {
      toast({ title: "Erro ao criar política", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta política?")) {
      const result = await deleteGoalPolicy(id)
      if (result.success) {
        toast({ title: "Política excluída" })
        loadPolicies()
      }
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
      <div className="flex justify-between items-center">
         <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight italic">Políticas de Atingimento</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Defina bônus por faixas de performance de meta.</p>
         </div>
         <Button 
            onClick={() => setIsAdding(true)}
            className="rounded-full h-12 px-8 gap-2 bg-amber-500 hover:bg-amber-600 shadow-xl shadow-amber-500/20 font-black text-xs uppercase tracking-widest"
         >
            <Plus className="h-4 w-4" /> Nova Faixa
         </Button>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
             <TableRow className="bg-slate-50/50 border-b border-slate-100">
                <TableHead className="h-16 px-8 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 italic">Faixa de Atingimento (%)</TableHead>
                <TableHead className="h-16 px-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 italic">Descrição / Nome</TableHead>
                <TableHead className="h-16 px-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 italic">Multiplicador</TableHead>
                <TableHead className="h-16 px-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 italic">Bônus Adicional</TableHead>
                <TableHead className="h-16 px-4 text-right font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 italic">Ações</TableHead>
             </TableRow>
          </TableHeader>
          <TableBody>
             {isAdding && (
                <TableRow className="bg-amber-50/30 animate-in slide-in-from-top-4 duration-300">
                   <TableCell className="px-8 flex items-center gap-2">
                      <Input 
                        type="number" placeholder="Min" 
                        value={newPolicy.minGoalPercent}
                        onChange={e => setNewPolicy({...newPolicy, minGoalPercent: Number(e.target.value)})}
                        className="w-20 rounded-xl h-10 font-bold border-amber-200" 
                      />
                      <span className="text-slate-300 font-black">~</span>
                      <Input 
                        type="number" placeholder="Max" 
                        value={newPolicy.maxGoalPercent}
                        onChange={e => setNewPolicy({...newPolicy, maxGoalPercent: Number(e.target.value)})}
                        className="w-20 rounded-xl h-10 font-bold border-amber-200" 
                      />
                   </TableCell>
                   <TableCell className="px-4">
                      <Input 
                         placeholder="Ex: Superação" 
                         value={newPolicy.name}
                         onChange={e => setNewPolicy({...newPolicy, name: e.target.value})}
                         className="rounded-xl h-10 font-bold border-amber-200" 
                      />
                   </TableCell>
                   <TableCell className="px-4">
                      <div className="relative">
                         <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                         <Input 
                            type="number" step="0.1" 
                            value={newPolicy.multiplier}
                            onChange={e => setNewPolicy({...newPolicy, multiplier: Number(e.target.value)})}
                            className="pl-10 rounded-xl h-10 font-black border-amber-200" 
                         />
                      </div>
                   </TableCell>
                   <TableCell className="px-4 space-x-2 flex">
                      <div className="relative">
                         <Percent className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-300" />
                         <Input 
                            type="number" placeholder="%" 
                            value={newPolicy.bonusPercentage}
                            onChange={e => setNewPolicy({...newPolicy, bonusPercentage: Number(e.target.value)})}
                            className="pl-7 w-24 rounded-xl h-10 font-black border-amber-200" 
                         />
                      </div>
                      <div className="relative">
                         <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-300" />
                         <Input 
                            type="number" placeholder="R$" 
                            value={newPolicy.bonusFixedAmount}
                            onChange={e => setNewPolicy({...newPolicy, bonusFixedAmount: Number(e.target.value)})}
                            className="pl-7 w-28 rounded-xl h-10 font-black border-amber-200" 
                         />
                      </div>
                   </TableCell>
                   <TableCell className="px-4 text-right">
                      <div className="flex justify-end gap-2">
                         <Button size="icon" variant="ghost" onClick={() => setIsAdding(false)} className="rounded-full h-10 w-10 text-slate-400">
                            <Trash2 className="h-4 w-4" />
                         </Button>
                         <Button size="icon" onClick={handleSave} className="rounded-full h-10 w-10 bg-emerald-500 hover:bg-emerald-600 text-white">
                            <CheckCircle2 className="h-4 w-4" />
                         </Button>
                      </div>
                   </TableCell>
                </TableRow>
             )}
             
             {policies.map((policy) => (
                <TableRow key={policy.id} className="group hover:bg-slate-50/50 transition-all border-b border-slate-50">
                   <TableCell className="px-8 h-16">
                      <Badge variant="outline" className="rounded-full px-4 py-1.5 border-slate-100 bg-white font-black text-xs uppercase tracking-tight text-slate-600 shadow-sm">
                         {policy.minGoalPercent}% - {policy.maxGoalPercent}%
                      </Badge>
                   </TableCell>
                   <TableCell className="px-4 font-black text-slate-800 uppercase italic tracking-tight italic text-sm group-hover:text-amber-500 transition-colors">
                      {policy.name}
                   </TableCell>
                   <TableCell className="px-4 font-black text-sm text-slate-500 tracking-widest">
                      x {policy.multiplier.toFixed(2)}
                   </TableCell>
                   <TableCell className="px-4">
                      <div className="flex gap-1.5">
                         {policy.bonusPercentage > 0 && <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[10px] uppercase tracking-widest">+ {policy.bonusPercentage}%</Badge>}
                         {policy.bonusFixedAmount > 0 && <Badge className="bg-blue-500/10 text-blue-600 border-none font-black text-[10px] uppercase tracking-widest">+ R$ {policy.bonusFixedAmount}</Badge>}
                         {policy.bonusPercentage === 0 && policy.bonusFixedAmount === 0 && <span className="text-[10px] font-bold text-slate-300 uppercase italic tracking-widest">Nenhum adicional</span>}
                      </div>
                   </TableCell>
                   <TableCell className="px-4 text-right pr-8">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(policy.id)} className="h-10 w-10 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all">
                         <Trash2 className="h-4 w-4" />
                      </Button>
                   </TableCell>
                </TableRow>
             ))}

             {policies.length === 0 && !isAdding && (
                <TableRow>
                   <TableCell colSpan={5} className="h-40 text-center space-y-2 py-10">
                      <AlertCircle className="h-8 w-8 text-slate-200 mx-auto" />
                      <p className="text-sm font-bold text-slate-300 uppercase tracking-widest italic">Nenhuma política de atingimento configurada.</p>
                   </TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
      </div>

      <div className="bg-amber-50 rounded-[2.5rem] p-8 border border-amber-100 flex gap-6 items-center">
         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm border border-amber-100 shrink-0">
            <Trophy className="h-6 w-6" />
         </div>
         <div className="space-y-1">
            <h4 className="font-black text-amber-950 uppercase italic tracking-tight text-sm">Como funciona o Multiplicador?</h4>
            <p className="text-[10px] text-amber-800/70 font-bold uppercase tracking-widest leading-relaxed max-w-2xl">
               O multiplicador é aplicado sobre o valor final da comissão calculada. Se um vendedor tem comissão de R$ 1.000 e bate 120% da meta com um multiplicador de 1.5x, a comissão final será de R$ 1.500.
            </p>
         </div>
      </div>
    </div>
  )
}
