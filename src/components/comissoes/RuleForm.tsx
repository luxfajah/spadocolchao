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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { 
  Percent, 
  Settings2, 
  Plus, 
  Trash2, 
  AlertCircle,
  Package,
  ArrowRight,
  Filter,
  CheckCircle2,
  DollarSign
} from "lucide-react"
import { upsertCommissionRule } from "@/app/(admin)/configuracoes/regras-de-comissao/actions"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

interface RuleFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule: any
  onSuccess: () => void
  leadSources: any[]
  products: any[]
  sellers: any[]
}

export function RuleForm({ open, onOpenChange, rule, onSuccess, leadSources, products, sellers }: RuleFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<any>({
    name: "",
    description: "",
    priority: 0,
    calculationType: "PERCENTAGE",
    baseType: "GROSS_SALE",
    percentage: 0,
    fixedAmount: 0,
    isActive: true,
    appliesOn: "CONFIRMED",
    conditions: []
  })

  useEffect(() => {
    if (rule) {
      setFormData({
        ...rule,
        validFrom: rule.validFrom ? new Date(rule.validFrom).toISOString().split('T')[0] : "",
        validTo: rule.validTo ? new Date(rule.validTo).toISOString().split('T')[0] : "",
        conditions: rule.conditions || []
      })
    } else {
      setFormData({
        name: "",
        description: "",
        priority: 0,
        calculationType: "PERCENTAGE",
        baseType: "GROSS_SALE",
        percentage: 0,
        fixedAmount: 0,
        isActive: true,
        appliesOn: "CONFIRMED",
        conditions: []
      })
    }
  }, [rule, open])

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [
        ...formData.conditions,
        { conditionType: "LEAD_SOURCE", operator: "EQUALS", value: "" }
      ]
    })
  }

  const removeCondition = (index: number) => {
    const newConditions = [...formData.conditions]
    newConditions.splice(index, 1)
    setFormData({ ...formData, conditions: newConditions })
  }

  const updateCondition = (index: number, field: string, value: any) => {
    const newConditions = [...formData.conditions]
    newConditions[index] = { ...newConditions[index], [field]: value }
    setFormData({ ...formData, conditions: newConditions })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const result = await upsertCommissionRule(rule?.id || null, formData)
    if (result.success) {
      toast({ title: "Sucesso", description: `Regra ${rule ? 'atualizada' : 'criada'} com sucesso.` })
      onOpenChange(false)
      onSuccess()
    } else {
      toast({ title: "Erro", description: result.error, variant: "destructive" })
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] h-[90vh] p-0 rounded-[3rem] border-none shadow-2xl flex flex-col overflow-hidden">
        <DialogHeader className="p-10 pb-6">
          <div className="flex items-center gap-4 mb-2">
             <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <Settings2 className="h-6 w-6" />
             </div>
             <div>
                <DialogTitle className="text-2xl font-black font-outfit uppercase italic tracking-tight text-slate-800">
                  {rule ? 'Editar Regra' : 'Nova Regra de Comissão'}
                </DialogTitle>
                <DialogDescription className="font-bold text-slate-400 uppercase text-[10px] tracking-widest mt-1">
                  Configure o cálculo dinâmico e os gatilhos da regra.
                </DialogDescription>
             </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-10 pt-0">
          <form id="rule-form" onSubmit={handleSubmit} className="space-y-12 pb-10 px-1">
            {/* Bloco 1: Identificação */}
            <div className="space-y-6">
              <h3 className="font-black text-xs uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-[10px]">01</span>
                Identificação e Vigência
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome amigável da regra</Label>
                    <Input 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="Ex: Comissão Varejo Loja" 
                      className="rounded-2xl h-14 border-slate-100 bg-slate-50/50 font-medium focus-visible:ring-primary/20"
                      required
                    />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Prioridade (Maior vence)</Label>
                    <Input 
                      type="number"
                      value={formData.priority} 
                      onChange={e => setFormData({...formData, priority: Number(e.target.value)})}
                      className="rounded-2xl h-14 border-slate-100 bg-slate-50/50 font-medium"
                    />
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-3 p-6 bg-slate-50/50 rounded-3xl border border-slate-100 flex items-center justify-between">
                    <div>
                       <Label className="font-black text-xs uppercase tracking-tight text-slate-700">Regra Ativa?</Label>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Define se a regra será processada nas vendas.</p>
                    </div>
                    <Switch 
                      checked={formData.isActive}
                      onCheckedChange={v => setFormData({...formData, isActive: v})}
                    />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Gatilho de Cálculo</Label>
                    <Select value={formData.appliesOn} onValueChange={v => setFormData({...formData, appliesOn: v})}>
                       <SelectTrigger className="rounded-2xl h-14 border-slate-100 bg-slate-50/50 font-medium">
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent className="rounded-2xl border-slate-100">
                          <SelectItem value="CONFIRMED" className="font-black text-xs uppercase tracking-widest py-3">Ao Confirmar Venda</SelectItem>
                          <SelectItem value="DELIVERED" className="font-black text-xs uppercase tracking-widest py-3">Na Entrega</SelectItem>
                          <SelectItem value="PAID" className="font-black text-xs uppercase tracking-widest py-3">Na Quitação Total</SelectItem>
                          <SelectItem value="FINALIZED" className="font-black text-xs uppercase tracking-widest py-3">Na Finalização</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
              </div>
            </div>

            {/* Bloco 2: Cálculo */}
            <div className="space-y-6">
              <h3 className="font-black text-xs uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-[10px]">02</span>
                Definição do Cálculo
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tipo de Cálculo</Label>
                    <Select value={formData.calculationType} onValueChange={v => setFormData({...formData, calculationType: v})}>
                       <SelectTrigger className="rounded-2xl h-14 border-slate-100 bg-slate-50/50 font-medium">
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent className="rounded-2xl border-slate-100">
                          <SelectItem value="PERCENTAGE" className="font-black text-xs uppercase tracking-widest py-3">Percentual (%)</SelectItem>
                          <SelectItem value="FIXED" className="font-black text-xs uppercase tracking-widest py-3">Valor Fixo (R$)</SelectItem>
                          <SelectItem value="HYBRID" className="font-black text-xs uppercase tracking-widest py-3">Híbrido (% + R$)</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Base de Cálculo</Label>
                    <Select value={formData.baseType} onValueChange={v => setFormData({...formData, baseType: v})}>
                       <SelectTrigger className="rounded-2xl h-14 border-slate-100 bg-slate-50/50 font-medium">
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent className="rounded-2xl border-slate-100">
                          <SelectItem value="GROSS_SALE" className="font-black text-xs uppercase tracking-widest py-3">Venda Bruta</SelectItem>
                          <SelectItem value="NET_SALE" className="font-black text-xs uppercase tracking-widest py-3">Venda Líquida</SelectItem>
                          <SelectItem value="ITEM_BRUTO" className="font-black text-xs uppercase tracking-widest py-3">Valor Bruto do Item</SelectItem>
                          <SelectItem value="RECEIVED" className="font-black text-xs uppercase tracking-widest py-3">Valor Recebido</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {(formData.calculationType === 'PERCENTAGE' || formData.calculationType === 'HYBRID') && (
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Porcentagem (%)</Label>
                      <div className="relative group">
                         <Percent className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                         <Input 
                            type="number" step="0.01"
                            value={formData.percentage} 
                            onChange={e => setFormData({...formData, percentage: Number(e.target.value)})}
                            className="pl-12 rounded-2xl h-14 border-slate-100 bg-slate-50/50 font-black text-lg"
                         />
                      </div>
                    </div>
                 )}
                 {(formData.calculationType === 'FIXED' || formData.calculationType === 'HYBRID') && (
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Valor Fixo (R$)</Label>
                      <div className="relative group">
                         <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                         <Input 
                            type="number" step="0.01"
                            value={formData.fixedAmount} 
                            onChange={e => setFormData({...formData, fixedAmount: Number(e.target.value)})}
                            className="pl-12 rounded-2xl h-14 border-slate-100 bg-slate-50/50 font-black text-lg"
                         />
                      </div>
                    </div>
                 )}
              </div>
            </div>

            {/* Bloco 3: Condições (AQUI ESTÁ A MAGIA) */}
            <div className="space-y-6">
              <div className="flex justify-between items-end mb-4">
                 <h3 className="font-black text-xs uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-[10px]">03</span>
                    Condições do Filtro
                 </h3>
                 <Button type="button" variant="ghost" onClick={addCondition} className="h-8 rounded-full border border-slate-100 font-black text-[9px] uppercase tracking-widest gap-2 hover:bg-primary/5 hover:text-primary transition-all">
                    <Plus className="h-3 w-3" /> Adicionar Filtro
                 </Button>
              </div>

              <div className="space-y-4">
                 {formData.conditions.map((condition: any, index: number) => (
                    <div key={index} className="flex gap-4 p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 items-end group relative animate-in zoom-in-95 duration-200">
                       <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                             <Label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Se a</Label>
                             <Select 
                               value={condition.conditionType} 
                               onValueChange={v => updateCondition(index, "conditionType", v)}
                             >
                                <SelectTrigger className="rounded-xl h-12 border-slate-100 bg-white font-black text-[10px] uppercase tracking-widest">
                                   <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-100">
                                   <SelectItem value="LEAD_SOURCE" className="font-black text-[10px] uppercase tracking-widest py-3">Origem da Venda</SelectItem>
                                   <SelectItem value="PRODUCT_SERVICE" className="font-black text-[10px] uppercase tracking-widest py-3">Produto Específico</SelectItem>
                                   <SelectItem value="PRODUCT_CATEGORY" className="font-black text-[10px] uppercase tracking-widest py-3">Categoria Operacional</SelectItem>
                                   <SelectItem value="SELLER" className="font-black text-[10px] uppercase tracking-widest py-3">Vendedor</SelectItem>
                                   <SelectItem value="GOAL_PERCENTAGE" className="font-black text-[10px] uppercase tracking-widest py-3">Meta Atingida (%)</SelectItem>
                                </SelectContent>
                             </Select>
                          </div>
                          <div className="space-y-2">
                             <Label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">For</Label>
                             <Select 
                               value={condition.operator} 
                               onValueChange={v => updateCondition(index, "operator", v)}
                             >
                                <SelectTrigger className="rounded-xl h-12 border-slate-100 bg-white font-black text-[10px] uppercase tracking-widest">
                                   <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-100">
                                   <SelectItem value="EQUALS" className="font-black text-[10px] uppercase tracking-widest py-3">Igual a</SelectItem>
                                   <SelectItem value="IN" className="font-black text-[10px] uppercase tracking-widest py-3">Contém em</SelectItem>
                                   <SelectItem value="GTE" className="font-black text-[10px] uppercase tracking-widest py-3">Maior ou Igual a</SelectItem>
                                   <SelectItem value="LTE" className="font-black text-[10px] uppercase tracking-widest py-3">Menor ou Igual a</SelectItem>
                                </SelectContent>
                             </Select>
                          </div>
                          <div className="space-y-2">
                             <Label className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">O Valor</Label>
                             {condition.conditionType === 'LEAD_SOURCE' ? (
                                <Select value={condition.value} onValueChange={v => updateCondition(index, "value", v)}>
                                   <SelectTrigger className="rounded-xl h-12 border-slate-100 bg-white font-black text-[10px] uppercase tracking-widest">
                                      <SelectValue placeholder="Selecione origem" />
                                   </SelectTrigger>
                                   <SelectContent className="rounded-xl">
                                      {leadSources.map(ls => <SelectItem key={ls.id} value={ls.id} className="font-black text-[10px] uppercase tracking-widest py-3">{ls.name}</SelectItem>)}
                                   </SelectContent>
                                </Select>
                             ) : condition.conditionType === 'PRODUCT_CATEGORY' ? (
                                <Select value={condition.value} onValueChange={v => updateCondition(index, "value", v)}>
                                   <SelectTrigger className="rounded-xl h-12 border-slate-100 bg-white font-black text-[10px] uppercase tracking-widest">
                                      <SelectValue placeholder="Selecione categoria" />
                                   </SelectTrigger>
                                   <SelectContent className="rounded-xl">
                                      <SelectItem value="REFORMA_COLCHAO">Reforma Colchão</SelectItem>
                                      <SelectItem value="REFORMA_BOX">Reforma Box</SelectItem>
                                      <SelectItem value="COLCHAO_NOVO">Colchão Novo</SelectItem>
                                      <SelectItem value="BOX_NOVO">Box Novo</SelectItem>
                                   </SelectContent>
                                </Select>
                             ) : (
                                <Input 
                                   value={condition.value} 
                                   onChange={e => updateCondition(index, "value", e.target.value)}
                                   placeholder="Valor..." 
                                   className="rounded-xl h-12 border-slate-100 bg-white font-bold text-xs"
                                />
                             )}
                          </div>
                       </div>
                       <Button type="button" variant="ghost" onClick={() => removeCondition(index)} className="h-10 w-10 p-0 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                          <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                 ))}
                 {formData.conditions.length === 0 && (
                    <div className="p-8 border-2 border-dashed border-slate-100 rounded-[2rem] text-center space-y-2">
                       <Filter className="h-6 w-6 text-slate-200 mx-auto" />
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 italic">Sem filtros configurados. Esta regra valerá para TODAS as situações compatíveis com a base.</p>
                    </div>
                 )}
              </div>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter className="p-10 bg-slate-50 border-t border-slate-100">
           <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-full h-14 px-8 font-black text-xs uppercase tracking-widest text-slate-400 hover:text-rose-500 hover:bg-rose-50">
              Cancelar
           </Button>
           <Button form="rule-form" type="submit" disabled={loading} className="rounded-full h-14 px-12 gap-2 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all font-black text-xs uppercase tracking-widest">
              {loading ? "Processando..." : <><CheckCircle2 className="h-4 w-4" /> Salvar Alterações</>}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
