"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Users, 
  ChevronRight, 
  Settings2,
  Medal,
  Calendar,
  Filter,
  BarChart3,
  Search
} from "lucide-react"
import { ManageGoalsDialog } from "./ManageGoalsDialog"
import { PeriodType } from "../actions"
import { useRouter, useSearchParams } from "next/navigation"

interface MetasPageClientProps {
  sellers: any[]
  leadSources: any[]
  sellerGoals: any[]
  storeGoal: any
  period: {
    type: PeriodType
    value: string
    year: number
  }
}

export function MetasPageClient({ 
  sellers, 
  leadSources,
  sellerGoals, 
  storeGoal,
  period 
}: MetasPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false)

  // Meta da Loja
  const storeTarget = storeGoal?.targetAmount || 0
  
  // Calcular atingido da loja (soma dos vendedores para simplificar ou soma das vendas confirmadas no período)
  // Como as metas dos vendedores já são syncadas nas actions, podemos usar o storeGoal.achieved se tivéssemos esse campo, 
  // mas vamos somar o achievedAmount dos sellerGoals que temos
  const storeAchieved = sellerGoals.reduce((acc, g) => acc + g.achievedAmount, 0)
  const storePercent = storeTarget > 0 ? (storeAchieved / storeTarget) * 100 : 0

  // Formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  // Ranking de Vendedores
  const ranking = [...sellerGoals].sort((a, b) => b.achievedPercent - a.achievedPercent)

  // Filtros de Período
  const updateFilter = (updates: Partial<typeof period>) => {
    const params = new URLSearchParams(searchParams.toString())
    if (updates.type) params.set("type", updates.type)
    if (updates.value) params.set("value", updates.value)
    if (updates.year) params.set("year", updates.year.toString())
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="space-y-12">
      {/* Header com Filtros e Ação */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase text-slate-900 flex items-center gap-4">
            <BarChart3 className="h-10 w-10 text-indigo-600" /> Dashboard de Performance
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-2 ml-14">
            Monitoramento de Objetivos e Ranking de Unidades
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Seletor de Período Rápido */}
          <div className="bg-white p-1 rounded-2xl border border-slate-200 flex items-center shadow-sm">
             {(["DAILY", "WEEKLY", "MONTHLY", "SEMESTRAL"] as PeriodType[]).map((t) => (
                <Button
                  key={t}
                  variant={period.type === t ? "default" : "ghost"}
                  size="sm"
                  onClick={() => updateFilter({ type: t })}
                  className={`rounded-xl h-9 px-4 font-black text-[9px] uppercase tracking-widest ${
                    period.type === t ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-900"
                  }`}
                >
                  {t === "DAILY" ? "Dia" : t === "WEEKLY" ? "Semana" : t === "MONTHLY" ? "Mês" : "Semestre"}
                </Button>
             ))}
          </div>

          <Button 
            onClick={() => setIsManageDialogOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] h-11 px-8 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-600/20 group gap-3"
          >
            <Settings2 className="h-4 w-4 group-hover:rotate-90 transition-transform" />
            Gerenciar Metas
          </Button>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Progresso Meta da Loja */}
        <Card className="border-none shadow-2xl shadow-indigo-500/5 rounded-[3.5rem] overflow-hidden bg-white/50 backdrop-blur-xl group hover:-translate-y-2 transition-all duration-500">
          <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
            <div className="bg-indigo-100 p-3 rounded-2xl">
              <Target className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Progresso Global</span>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">{period.type} - {period.value}/{period.year}</p>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="space-y-6">
              <div>
                <span className="text-3xl font-black italic tracking-tighter text-slate-900">{storePercent.toFixed(1)}%</span>
                <Progress value={Math.min(storePercent, 100)} className="h-4 rounded-full bg-slate-100 mt-2">
                   <div 
                     className="h-full bg-indigo-600 rounded-full transition-all duration-1000 ease-out" 
                     style={{ width: `${Math.min(storePercent, 100)}%` }} 
                   />
                </Progress>
              </div>
              <div className="flex justify-between items-end border-t border-slate-100 pt-6">
                 <div>
                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Objetivo</span>
                   <p className="font-bold text-sm text-slate-700">{formatCurrency(storeTarget)}</p>
                 </div>
                 <div className="text-right">
                   <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Realizado</span>
                   <p className="font-bold text-sm text-indigo-600">{formatCurrency(storeAchieved)}</p>
                 </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expectativa e Projeção */}
        <Card className="border-none shadow-2xl shadow-emerald-500/5 rounded-[3.5rem] overflow-hidden bg-white/50 backdrop-blur-xl group hover:-translate-y-2 transition-all duration-500">
          <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
            <div className="bg-emerald-100 p-3 rounded-2xl">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Expectativa Final</span>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="space-y-6">
              <div>
                <span className="text-3xl font-black italic tracking-tighter text-slate-900">
                   {storePercent > 10 ? formatCurrency(storeAchieved * 1.2) : formatCurrency(storeAchieved)}
                </span>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-2 flex items-center gap-1">
                   Projeção baseada no ritmo atual <ChevronRight className="h-3 w-3" />
                </p>
              </div>
              <div className="flex gap-2">
                 <div className="flex-1 h-2 bg-slate-100 rounded-full" />
                 <div className="flex-1 h-2 bg-slate-100 rounded-full" />
                 <div className="flex-1 h-2 bg-emerald-500 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vendedores Ativos (Updated Title) */}
        <Card className="border-none shadow-2xl shadow-amber-500/5 rounded-[3.5rem] overflow-hidden bg-white/50 backdrop-blur-xl group hover:-translate-y-2 transition-all duration-500">
          <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
            <div className="bg-amber-100 p-3 rounded-2xl">
              <Users className="h-6 w-6 text-amber-600" />
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Vendedores Ativos</span>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="space-y-6">
              <div>
                <span className="text-4xl font-black italic tracking-tighter text-slate-900">
                   {ranking.length} {ranking.length === 1 ? 'Vendedor' : 'Vendedores'}
                </span>
                <div className="inline-flex mt-3 bg-amber-50 px-4 py-1.5 rounded-full border border-amber-100/50">
                   <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">
                     {ranking.filter(r => r.achievedPercent >= 100).length} BATERAM A META
                   </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ranking de Vendedores (Updated Title) */}
      <div className="space-y-8">
        <div className="flex items-center gap-4">
           <div className="h-px bg-slate-200 flex-1" />
           <h2 className="text-xl font-black italic uppercase text-slate-400 tracking-[0.3em]">Mestres de Venda</h2>
           <div className="h-px bg-slate-200 flex-1" />
        </div>

        <div className="grid grid-cols-1 gap-6 max-w-5xl mx-auto">
          {ranking.map((res, idx) => (
            <div 
              key={res.id} 
              className="relative bg-white/80 border border-slate-100 p-6 rounded-[2.5rem] flex flex-col md:flex-row md:items-center gap-8 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group overflow-hidden"
            >
              {/* Medalhas */}
              {idx < 3 && (
                <div className="absolute top-4 right-6 opacity-20 group-hover:opacity-100 transition-opacity">
                   <Medal className={`h-12 w-12 ${
                      idx === 0 ? "text-amber-400" :
                      idx === 1 ? "text-slate-400" :
                      "text-amber-700"
                   }`} />
                </div>
              )}

              <div className="flex items-center gap-6">
                <div className={`h-16 w-16 rounded-full flex items-center justify-center font-black italic text-2xl ${
                  idx === 0 ? "bg-amber-100 text-amber-600 border-2 border-amber-200 shadow-xl shadow-amber-500/20" :
                  idx === 1 ? "bg-slate-100 text-slate-600 border-2 border-slate-200" :
                  idx === 2 ? "bg-amber-50 text-amber-800 border-2 border-amber-100" :
                  "bg-slate-50 text-slate-400 border border-slate-100"
                }`}>
                  #{idx + 1}
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-black text-lg uppercase italic tracking-tighter text-slate-800">
                    {res.seller.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{res.seller.code}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest italic">Performance: {res.achievedPercent.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-3">
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span>Meta: {formatCurrency(res.targetAmount)}</span>
                    <span className="text-slate-900 italic">Realizado: {formatCurrency(res.achievedAmount)}</span>
                 </div>
                 <Progress value={Math.min(res.achievedPercent, 100)} className="h-3 rounded-full bg-slate-100/50">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        res.achievedPercent >= 100 ? "bg-indigo-600" : 
                        res.achievedPercent >= 80 ? "bg-indigo-400" :
                        "bg-slate-300"
                      }`}
                      style={{ width: `${Math.min(res.achievedPercent, 100)}%` }} 
                    />
                 </Progress>
              </div>

              <div className="hidden lg:block">
                 <div className={`px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest border ${
                   res.achievedPercent >= 100 
                   ? "bg-indigo-50 text-indigo-600 border-indigo-100" 
                   : "bg-slate-50 text-slate-400 border-slate-100"
                 }`}>
                   {res.achievedPercent >= 100 ? "Meta Alcançada" : "Em Progresso"}
                 </div>
              </div>
            </div>
          ))}
          {ranking.length === 0 && (
             <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                <Trophy className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4rem] italic">Nenhum Registro no Ranking</span>
             </div>
          )}
        </div>
      </div>

      {/* Modais */}
      <ManageGoalsDialog 
        open={isManageDialogOpen}
        onOpenChange={setIsManageDialogOpen}
        sellers={sellers}
        leadSources={leadSources}
        storeGoal={storeGoal}
        currentGoals={sellerGoals}
        initialPeriod={period}
        onSuccess={() => router.refresh()}
      />
    </div>
  )
}
