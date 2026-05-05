"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/layout/PageHeader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Percent, 
  Target, 
  Trophy, 
  Calculator, 
  History,
  Plus,
  Settings2,
  TrendingUp,
  LayoutGrid,
  Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { RuleList } from "@/components/comissoes/RuleList"
import { RuleForm } from "@/components/comissoes/RuleForm"
import { GoalManagement } from "@/components/comissoes/GoalManagement"
import { PolicyManagement } from "@/components/comissoes/PolicyManagement"
import { 
  getCommissionRules, 
  deleteCommissionRule, 
  upsertCommissionRule 
} from "./actions"
import { getInitialPdvData } from "../../pdv/actions"
import { useToast } from "@/hooks/use-toast"

export default function CommissionConfigPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("rules")
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<any>(null)
  
  // Data for Form
  const [leadSources, setLeadSources] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [sellers, setSellers] = useState<any[]>([])

  const loadData = async () => {
    setLoading(true)
    try {
      const [rulesData, pdvData] = await Promise.all([
        getCommissionRules(),
        getInitialPdvData()
      ])
      setRules(rulesData)
      setLeadSources(pdvData.leadSources)
      setProducts(pdvData.products)
      setSellers(pdvData.sellers)
    } catch (error) {
      console.error("Error loading commission data:", error)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleEdit = (rule: any) => {
    setSelectedRule(rule)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta regra?")) {
      const result = await deleteCommissionRule(id)
      if (result.success) {
        toast({ title: "Regra excluída" })
        loadData()
      }
    }
  }

  const handleToggleStatus = async (rule: any) => {
    const result = await upsertCommissionRule(rule.id, { ...rule, isActive: !rule.isActive })
    if (result.success) {
      toast({ title: rule.isActive ? "Regra pausada" : "Regra ativada" })
      loadData()
    }
  }

  return (
    <main className="flex-1 py-10 px-6 max-w-[1700px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <PageHeader 
        title="Configuração de Comissões"
        subtitle="Gerencie o motor de incentivos e políticas de performance da Spa do Colchão."
        icon={<Settings2 className="h-8 w-8 text-primary font-bold" />}
        actions={
          <Button 
            onClick={() => { setSelectedRule(null); setIsFormOpen(true); }}
            className="rounded-full h-12 px-8 gap-2 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 font-black text-xs uppercase tracking-widest"
          >
            <Plus className="h-4 w-4" /> Nova Regra
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
        <div className="bg-white/50 backdrop-blur-md p-2 rounded-[2.5rem] border border-slate-100 shadow-sm inline-flex">
          <TabsList className="bg-transparent border-none h-14 gap-2">
            <TabsTrigger 
              value="rules" 
              className="rounded-full px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest transition-all group"
            >
              <Percent className="h-4 w-4 mr-2 text-primary group-data-[state=active]:text-white transition-colors" /> Regras
            </TabsTrigger>
            <TabsTrigger 
              value="goals" 
              className="rounded-full px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest transition-all group"
            >
              <Target className="h-4 w-4 mr-2 text-primary group-data-[state=active]:text-white transition-colors" /> Metas
            </TabsTrigger>
            <TabsTrigger 
              value="policies" 
              className="rounded-full px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest transition-all group"
            >
              <Trophy className="h-4 w-4 mr-2 text-primary group-data-[state=active]:text-white transition-colors" /> Políticas
            </TabsTrigger>
            <TabsTrigger 
              value="simulator" 
              className="rounded-full px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest transition-all"
            >
              <Calculator className="h-4 w-4 mr-2 text-primary group-data-[state=active]:text-white transition-colors" /> Simulador
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="rounded-full px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-black text-[10px] uppercase tracking-widest transition-all"
            >
              <History className="h-4 w-4 mr-2 text-primary group-data-[state=active]:text-white transition-colors" /> Histórico
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="rules" className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
             <div className="lg:col-span-3 space-y-8">
                {/* Search & Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <Card className="rounded-[2.5rem] p-8 border-none shadow-sm bg-indigo-50/50 flex items-center justify-between group hover:bg-indigo-50 transition-colors">
                      <div className="space-y-1">
                         <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Regras por Origem</span>
                         <h4 className="text-2xl font-black text-indigo-950 uppercase italic tracking-tight">Estratégicas</h4>
                      </div>
                      <TrendingUp className="h-8 w-8 text-indigo-200 group-hover:text-indigo-400 transition-colors" />
                   </Card>
                   <Card className="rounded-[2.5rem] p-8 border-none shadow-sm bg-emerald-50/50 flex items-center justify-between group hover:bg-emerald-50 transition-colors">
                      <div className="space-y-1">
                         <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Incentivos de</span>
                         <h4 className="text-2xl font-black text-emerald-950 uppercase italic tracking-tight">Performance</h4>
                      </div>
                      <Trophy className="h-8 w-8 text-emerald-200 group-hover:text-emerald-400 transition-colors" />
                   </Card>
                   <Card className="rounded-[2.5rem] p-8 border-none shadow-sm bg-slate-100/50 flex items-center justify-between group hover:bg-slate-100 transition-colors">
                      <div className="relative w-full">
                         <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                         <Input placeholder="Filtrar regras..." className="border-none bg-transparent h-12 pl-8 font-bold text-sm shadow-none focus-visible:ring-0" />
                      </div>
                      <LayoutGrid className="h-6 w-6 text-slate-200 ml-4 shrink-0" />
                   </Card>
                </div>

                {loading ? (
                   <div className="bg-white rounded-[3rem] p-20 border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-4">
                      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                      <span className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">Sincronizando Motor de Regras...</span>
                   </div>
                ) : (
                   <RuleList 
                    rules={rules} 
                    onEdit={handleEdit} 
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                   />
                )}
             </div>

             <div className="space-y-8">
                <div className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-2xl space-y-6 sticky top-10 border-4 border-slate-900">
                   <h3 className="font-black text-xs uppercase tracking-[0.2em] text-primary">Resumo da Configuração</h3>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center py-4 border-b border-white/10">
                         <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total de Regras</span>
                         <span className="font-black text-2xl">{rules.length}</span>
                      </div>
                      <div className="flex justify-between items-center py-4 border-b border-white/10">
                         <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Regras Ativas</span>
                         <span className="font-black text-2xl text-emerald-400">{rules.filter(r => r.isActive).length}</span>
                      </div>
                      <div className="flex justify-between items-center py-4">
                         <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Base Principal</span>
                         <span className="font-black text-xs uppercase tracking-widest">Venda Bruta</span>
                      </div>
                   </div>
                   <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-[10px] text-slate-400 leading-relaxed italic">
                      Lembre-se: Regras com prioridade superior sobrepõem as de prioridade inferior em caso de múltiplas condições satisfeitas.
                   </div>
                </div>
             </div>
          </div>
        </TabsContent>

        <TabsContent value="goals">
           <GoalManagement sellers={sellers} />
        </TabsContent>

        <TabsContent value="policies">
           <PolicyManagement />
        </TabsContent>

        <TabsContent value="simulator">
           <div className="bg-white rounded-[3rem] p-20 border border-slate-100 shadow-sm text-center space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-4">
                 <Calculator className="h-10 w-10 font-bold" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight italic">Simulador de Comissão</h2>
              <p className="max-w-md mx-auto text-slate-500 font-medium">O simulador será implementado na Etapa 4 após o desenvolvimento do motor de cálculo.</p>
           </div>
        </TabsContent>
      </Tabs>

      <RuleForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen}
        rule={selectedRule}
        onSuccess={loadData}
        leadSources={leadSources}
        products={products}
        sellers={sellers}
      />
    </main>
  )
}
