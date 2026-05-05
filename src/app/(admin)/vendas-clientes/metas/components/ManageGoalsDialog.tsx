"use client"

import { useState, useEffect } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { upsertSellerGoal, upsertStoreGoal, syncAllGoals, getGoalsForPeriod, PeriodType } from "../actions"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save, Target, Users, Store, RotateCcw, Plus, Trash2, Calendar } from "lucide-react"
import { format, startOfMonth, startOfWeek, setWeek } from "date-fns"

interface ManageGoalsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sellers: any[]
  leadSources: any[]
  currentGoals: any[] 
  storeGoal: any
  initialPeriod: {
    type: PeriodType
    value: string
    year: number
  }
  onSuccess: () => void
}

export function ManageGoalsDialog({ 
  open, 
  onOpenChange, 
  sellers, 
  leadSources,
  currentGoals, 
  storeGoal,
  initialPeriod,
  onSuccess 
}: ManageGoalsDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)
  
  // Period State - Initialize from current view period
  const [periodType, setPeriodType] = useState<PeriodType>(initialPeriod.type)
  const [periodValue, setPeriodValue] = useState<string>(initialPeriod.value)
  const [year, setYear] = useState<number>(initialPeriod.year)

  // Local Data State
  const [localStoreTarget, setLocalStoreTarget] = useState(0)
  const [localSegments, setLocalSegments] = useState<{leadSourceId: string, target: number}[]>([])
  const [localSellerGoals, setLocalSellerGoals] = useState<Record<string, number>>({})

  const [isLoadingData, setIsLoadingData] = useState(false)

  // Initial Data Load and Reset when Modal Opens
  useEffect(() => {
    if (open) {
      setPeriodType(initialPeriod.type)
      setPeriodValue(initialPeriod.value)
      setYear(initialPeriod.year)
      
      setLocalStoreTarget(storeGoal?.targetAmount || 0)
      setLocalSegments(storeGoal?.segments?.map((s: any) => ({ leadSourceId: s.leadSourceId, target: s.targetAmount })) || [])
      setLocalSellerGoals(currentGoals.reduce((acc, g) => ({ ...acc, [g.sellerId]: g.targetAmount }), {}))
    }
    // We only want to sync from props when the modal is first opened to avoid 
    // overwriting unsaved changes during router.refresh()
  }, [open])

  // Fetch data when period changes inside the dialog
  useEffect(() => {
    // Only fetch if it's NOT the initial period (which we already have in props)
    // or if we want to be safe, always fetch when these change but only if open
    if (!open) return

    const isInitialPeriod = 
      periodType === initialPeriod.type && 
      periodValue === initialPeriod.value && 
      year === initialPeriod.year

    if (isInitialPeriod) return

    const fetchData = async () => {
      setIsLoadingData(true)
      const result = await getGoalsForPeriod(periodType, periodValue, year)
      if (result.success) {
        setLocalStoreTarget(result.storeGoal?.targetAmount || 0)
        setLocalSegments(result.storeGoal?.segments?.map((s: any) => ({ leadSourceId: s.leadSourceId, target: s.targetAmount })) || [])
        setLocalSellerGoals(result.sellerGoals?.reduce((acc: any, g: any) => ({ ...acc, [g.sellerId]: g.targetAmount }), {}) || {})
      }
      setIsLoadingData(false)
    }

    fetchData()
  }, [periodType, periodValue, year, open])

  const handleSaveStoreGoal = async () => {
    setLoading('store')
    const result = await upsertStoreGoal({ 
      type: periodType, 
      value: periodValue, 
      year, 
      target: localStoreTarget,
      segments: localSegments 
    })
    if (result.success) {
      toast({ title: "Meta da loja atualizada!" })
      onSuccess()
    } else {
      toast({ title: "Erro ao salvar", description: result.error, variant: "destructive" })
    }
    setLoading(null)
  }

  const handleSaveSellerGoal = async (sellerId: string) => {
    setLoading(sellerId)
    const target = localSellerGoals[sellerId] || 0
    const result = await upsertSellerGoal({ 
      sellerId, 
      type: periodType, 
      value: periodValue, 
      year, 
      target 
    })
    if (result.success) {
      toast({ title: "Meta individual atualizada!" })
      onSuccess()
    } else {
      toast({ title: "Erro ao salvar", description: result.error, variant: "destructive" })
    }
    setLoading(null)
  }

  const handleSync = async () => {
    setLoading('sync')
    const result = await syncAllGoals(periodType, periodValue, year)
    if (result.success) {
      toast({ title: "Performance sincronizada!" })
      onSuccess()
    }
    setLoading(null)
  }

  const addSegment = () => {
    setLocalSegments([...localSegments, { leadSourceId: "", target: 0 }])
  }

  const removeSegment = (index: number) => {
    setLocalSegments(localSegments.filter((_, i) => i !== index))
  }

  const updateSegment = (index: number, field: string, value: any) => {
    const newSegments = [...localSegments]
    newSegments[index] = { ...newSegments[index], [field]: value }
    setLocalSegments(newSegments)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[850px] rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
        {/* Header / Configuração de Período */}
        <div className="bg-slate-900 p-8 text-white">
           <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                   <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-3">
                     <Target className="h-6 w-6 text-indigo-400" /> Configuração de Objetivos
                   </DialogTitle>
                   <DialogDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">
                     Selecione o período e defina as metas administrativas
                   </DialogDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSync}
                  className="rounded-xl text-white/40 hover:text-white hover:bg-white/10 gap-2 border border-white/10 font-black text-[9px] uppercase tracking-widest h-8 px-4"
                >
                  {loading === 'sync' ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                  Sincronizar
                </Button>
              </div>
           </DialogHeader>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 p-6 bg-white/5 rounded-[2rem] border border-white/10">
              <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo de Período</Label>
                 <Select value={periodType} onValueChange={(val: PeriodType) => {
                    setPeriodType(val)
                    // Reset value based on type if needed
                    if (val === "DAILY") setPeriodValue(format(new Date(), "yyyy-MM-dd"))
                    else if (val === "WEEKLY") setPeriodValue("1")
                    else if (val === "MONTHLY") setPeriodValue((new Date().getMonth() + 1).toString())
                    else if (val === "SEMESTRAL") setPeriodValue("1")
                 }}>
                    <SelectTrigger className="bg-slate-800 border-none rounded-xl h-12 font-black text-xs uppercase tracking-tight italic">
                       <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="DAILY">Meta Diária</SelectItem>
                       <SelectItem value="WEEKLY">Meta Semanal</SelectItem>
                       <SelectItem value="MONTHLY">Meta Mensal</SelectItem>
                       <SelectItem value="SEMESTRAL">Meta Semestral</SelectItem>
                    </SelectContent>
                 </Select>
              </div>

              <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Referência</Label>
                 {periodType === "DAILY" ? (
                    <Input 
                      type="date" 
                      value={periodValue} 
                      onChange={e => setPeriodValue(e.target.value)}
                      className="bg-slate-800 border-none rounded-xl h-12 font-black text-xs text-white" 
                    />
                 ) : periodType === "WEEKLY" ? (
                    <div className="flex gap-2">
                       <Input 
                         type="number" 
                         min="1" 
                         max="53" 
                         value={periodValue} 
                         onChange={e => setPeriodValue(e.target.value)}
                         placeholder="Nº Semana"
                         className="bg-slate-800 border-none rounded-xl h-12 font-black text-xs text-white" 
                       />
                       <span className="flex items-center text-[10px] font-bold text-slate-500 italic">Semana do Ano</span>
                    </div>
                 ) : periodType === "MONTHLY" ? (
                    <Select value={periodValue} onValueChange={setPeriodValue}>
                       <SelectTrigger className="bg-slate-800 border-none rounded-xl h-12 font-black text-xs uppercase italic">
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                          {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map((m, i) => (
                             <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                          ))}
                       </SelectContent>
                    </Select>
                 ) : (
                    <Select value={periodValue} onValueChange={setPeriodValue}>
                       <SelectTrigger className="bg-slate-800 border-none rounded-xl h-12 font-black text-xs uppercase italic">
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                          <SelectItem value="1">1º Semestre</SelectItem>
                          <SelectItem value="2">2º Semestre</SelectItem>
                       </SelectContent>
                    </Select>
                 )}
              </div>

              <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ano</Label>
                 <Input 
                   type="number" 
                   value={year} 
                   onChange={e => setYear(parseInt(e.target.value))}
                   className="bg-slate-800 border-none rounded-xl h-12 font-black text-xs text-white" 
                 />
              </div>
           </div>
        </div>

        <Tabs defaultValue="sellers" className="w-full">
           <div className="px-8 bg-slate-50 border-b border-slate-100">
              <TabsList className="h-14 bg-transparent gap-8">
                 <TabsTrigger value="sellers" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-full px-0 font-black text-[10px] uppercase tracking-[0.2em]">
                    <Users className="h-4 w-4 mr-2" /> Metas de Vendedores
                 </TabsTrigger>
                 <TabsTrigger value="store" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-indigo-600 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-full px-0 font-black text-[10px] uppercase tracking-[0.2em]">
                    <Store className="h-4 w-4 mr-2" /> Metas da Loja
                 </TabsTrigger>
              </TabsList>
           </div>

           <div className="p-8 max-h-[50vh] overflow-y-auto bg-white custom-scrollbar focus-visible:outline-none relative">
              {isLoadingData && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex items-center justify-center flex-col gap-3 transition-all duration-300 rounded-[2.5rem]">
                   <div className="relative">
                      <div className="h-10 w-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                      <Target className="h-4 w-4 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 animate-pulse">Carregando Planejamento...</span>
                </div>
              )}
              <TabsContent value="sellers" className="m-0 space-y-4">
                 {sellers.map(seller => (
                    <div key={seller.id} className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 border border-transparent hover:border-slate-100 transition-all group">
                       <div className="flex flex-col">
                          <span className="font-black text-xs text-slate-700 uppercase italic tracking-tight">{seller.name}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{seller.code || 'SEM CÓDIGO'}</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <div className="relative">
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs italic">R$</span>
                             <Input 
                               type="number"
                               value={localSellerGoals[seller.id] || ""}
                               onChange={e => setLocalSellerGoals({...localSellerGoals, [seller.id]: parseFloat(e.target.value) || 0})}
                               className="w-40 h-11 pl-10 rounded-2xl border-slate-200 bg-white font-black text-sm transition-all focus:ring-indigo-500"
                               placeholder="0,00"
                             />
                          </div>
                          <Button 
                            onClick={() => handleSaveSellerGoal(seller.id)}
                            disabled={loading === seller.id}
                            className="bg-indigo-600 hover:bg-indigo-700 rounded-xl h-11 w-11 p-0 shadow-lg shadow-indigo-600/20"
                          >
                             {loading === seller.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          </Button>
                       </div>
                    </div>
                 ))}
                 {sellers.length === 0 && (
                   <div className="text-center py-10 text-slate-400 font-bold uppercase text-[9px] tracking-widest">Nenhum vendedor disponível</div>
                 )}
              </TabsContent>

              <TabsContent value="store" className="m-0 space-y-10">
                 {/* Meta Global Principal */}
                 <div className="flex flex-col items-center justify-center p-10 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100/50 space-y-6">
                    <div className="text-center space-y-1">
                       <h3 className="font-black text-lg italic uppercase text-slate-800 tracking-tighter">Objetivo Principal de Faturamento</h3>
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Valor acumulado de todas as fontes para o período</p>
                    </div>
                    <div className="relative w-full max-w-sm">
                       <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300 italic">R$</span>
                       <Input 
                         type="number"
                         value={localStoreTarget}
                         onChange={e => setLocalStoreTarget(parseFloat(e.target.value) || 0)}
                         className="w-full h-16 pl-16 rounded-[1.5rem] border-slate-200 bg-white text-3xl font-black font-outfit text-indigo-600 focus:ring-indigo-500 transition-all shadow-sm"
                         placeholder="0,00"
                       />
                    </div>
                 </div>

                 {/* Sub-metas por Origem */}
                 <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                       <div>
                          <h4 className="font-black text-sm italic uppercase text-slate-700 tracking-tighter">Sub-metas por Origem</h4>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Distribua o faturamento esperado por canal</p>
                       </div>
                       <Button 
                         variant="outline" 
                         size="sm" 
                         onClick={addSegment}
                         className="rounded-full h-9 px-4 gap-2 border-indigo-100 text-indigo-600 font-black text-[9px] uppercase tracking-widest hover:bg-indigo-50"
                       >
                          <Plus className="h-3 w-3" /> Adicionar Segmento
                       </Button>
                    </div>

                    <div className="space-y-3">
                       {localSegments.map((segment, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                             <div className="flex-1">
                                <Select value={segment.leadSourceId} onValueChange={(val) => updateSegment(idx, 'leadSourceId', val)}>
                                   <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white font-black text-[10px] uppercase tracking-tight italic">
                                      <SelectValue placeholder="Escolha a Origem" />
                                   </SelectTrigger>
                                   <SelectContent>
                                      {leadSources.map(ls => (
                                         <SelectItem key={ls.id} value={ls.id}>{ls.name}</SelectItem>
                                      ))}
                                   </SelectContent>
                                </Select>
                             </div>
                             <div className="relative w-36">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 italic">R$</span>
                                <Input 
                                  type="number"
                                  value={segment.target}
                                  onChange={e => updateSegment(idx, 'target', parseFloat(e.target.value) || 0)}
                                  className="h-10 pl-8 rounded-xl border-slate-200 bg-white font-black text-xs"
                                  placeholder="0,00"
                                />
                             </div>
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               onClick={() => removeSegment(idx)}
                               className="h-10 w-10 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl"
                             >
                                <Trash2 className="h-4 w-4" />
                             </Button>
                          </div>
                       ))}
                       {localSegments.length === 0 && (
                         <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em] italic">
                            Nenhum segmento customizado definido
                         </div>
                       )}
                    </div>
                    
                    {localSegments.length > 0 && (
                      <div className="flex justify-end pr-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Total Segmentado: <span className="text-indigo-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(localSegments.reduce((sum, s) => sum + s.target, 0))}</span>
                        </p>
                      </div>
                    )}
                 </div>

                 <div className="flex justify-center pt-4">
                    <Button 
                      onClick={handleSaveStoreGoal}
                      disabled={loading === 'store'}
                      className="rounded-2xl h-14 px-12 gap-3 bg-slate-900 hover:bg-black font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10"
                    >
                       {loading === 'store' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                       Salvar Planejamento Global
                    </Button>
                 </div>
              </TabsContent>
           </div>
        </Tabs>

        <DialogFooter className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400">
             <Calendar className="h-4 w-4" />
             <span className="text-[10px] font-bold uppercase tracking-widest">Gestão de Performance Administrativa</span>
          </div>
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="rounded-2xl h-12 px-8 font-black text-[10px] uppercase tracking-widest hover:bg-white border border-transparent hover:border-slate-200"
          >
            Fechar Janela
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
