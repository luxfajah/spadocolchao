"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Target, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  User, 
  TrendingUp,
  AlertCircle 
} from "lucide-react"
import { getSellerGoals, upsertSellerGoal } from "@/app/(admin)/configuracoes/regras-de-comissao/actions"
import { useToast } from "@/hooks/use-toast"

interface GoalManagementProps {
  sellers: any[]
}

export function GoalManagement({ sellers }: GoalManagementProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  const [goals, setGoals] = useState<Record<string, number>>({})

  const loadGoals = async () => {
    setLoading(true)
    const data = await getSellerGoals(month, year)
    const goalMap: Record<string, number> = {}
    data.forEach((g: any) => {
      goalMap[g.sellerId] = g.targetAmount
    })
    setGoals(goalMap)
    setLoading(false)
  }

  useEffect(() => {
    loadGoals()
  }, [month, year])

  const handleSave = async (sellerId: string) => {
    const amount = goals[sellerId] || 0
    const result = await upsertSellerGoal({
      sellerId,
      referenceMonth: month,
      referenceYear: year,
      targetAmount: amount
    })
    if (result.success) {
      toast({ title: "Meta salva com sucesso" })
    } else {
      toast({ title: "Erro ao salvar meta", variant: "destructive" })
    }
  }

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ]

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1)
      setYear(year + 1)
    } else {
      setMonth(month + 1)
    }
  }

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12)
      setYear(year - 1)
    } else {
      setMonth(month - 1)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
         <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight italic">Metas Mensais</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Defina os objetivos financeiros para cada vendedor.</p>
         </div>
         
         <div className="flex items-center gap-4 bg-white p-2 rounded-full border border-slate-100 shadow-sm">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-full h-10 w-10">
               <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-4 text-center min-w-[140px]">
               <span className="block font-black text-xs uppercase tracking-widest text-primary">{months[month - 1]}</span>
               <span className="block font-bold text-[10px] text-slate-400 uppercase tracking-widest">{year}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-full h-10 w-10">
               <ChevronRight className="h-4 w-4" />
            </Button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {sellers.map((seller) => (
            <Card key={seller.id} className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
               <div className="p-8 space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <User className="h-6 w-6" />
                     </div>
                     <div>
                        <h4 className="font-black text-slate-800 uppercase tracking-tight italic">{seller.name}</h4>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{seller.type}</span>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Meta de Vendas (R$)</Label>
                     <div className="relative">
                        <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                        <Input 
                           type="number"
                           value={goals[seller.id] || 0}
                           onChange={e => setGoals({...goals, [seller.id]: Number(e.target.value)})}
                           className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/50 font-black text-lg focus-visible:ring-primary/20"
                           placeholder="0,00"
                        />
                     </div>
                  </div>

                  <Button 
                     onClick={() => handleSave(seller.id)}
                     disabled={loading}
                     className="w-full h-12 rounded-xl bg-slate-950 hover:bg-primary transition-all font-black text-[10px] uppercase tracking-widest gap-2"
                  >
                     <Save className="h-3 w-3" /> Salvar Meta
                  </Button>
               </div>
            </Card>
         ))}
      </div>

      {sellers.length === 0 && (
         <div className="bg-white rounded-[3rem] p-20 border border-slate-100 shadow-sm text-center space-y-4">
            <AlertCircle className="h-10 w-10 text-slate-200 mx-auto" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">Nenhum vendedor cadastrado no sistema.</p>
         </div>
      )}
    </div>
  )
}
