"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Save, 
  ArrowLeft, 
  Info, 
  Zap, 
  Search, 
  Activity,
  Award,
  ShieldCheck,
  MapPin,
  BarChart3
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

interface OrigemFormProps {
  initialData?: any
  action: (formData: FormData) => Promise<void>
  isEditing?: boolean
}

export function OrigemForm({ initialData, action, isEditing }: OrigemFormProps) {
  const [activeTab, setActiveTab] = useState("identificacao")

  const categories = [
    "Digital paga",
    "Digital orgânica",
    "Loja física",
    "Indicação",
    "Campanha",
    "Externa",
    "Parceria",
    "Reativação",
    "Outro"
  ]

  return (
    <form action={action} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-6 rounded-[2rem] border border-white/40 shadow-sm sticky top-4 z-10">
        <div className="flex items-center gap-4">
          <Link href="/vendas-clientes/origens-de-venda">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white shadow-sm transition-all border border-transparent hover:border-slate-100">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-primary font-outfit tracking-tight">
              {isEditing ? `Editar: ${initialData.name}` : "Nova Origem de Venda"}
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Configuração de Canal Comercial</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/vendas-clientes/origens-de-venda">
            <Button type="button" variant="outline" className="rounded-full px-6 border-slate-200 font-bold text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" className="rounded-full px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-black text-xs uppercase tracking-[0.1em] h-12 gap-2">
            <Save className="h-4 w-4" /> {isEditing ? "Salvar Alterações" : "Criar Origem"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100/50 p-1.5 rounded-[1.5rem] h-auto flex flex-wrap md:flex-nowrap gap-2 mb-8">
          <TabsTrigger value="identificacao" className="rounded-xl px-6 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold text-xs uppercase tracking-widest transition-all gap-2 flex-1 md:flex-none">
            <Info className="h-4 w-4" /> 1. Identificação
          </TabsTrigger>
          <TabsTrigger value="regras" className="rounded-xl px-6 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold text-xs uppercase tracking-widest transition-all gap-2 flex-1 md:flex-none">
            <ShieldCheck className="h-4 w-4" /> 2. Regras Comerciais
          </TabsTrigger>
          <TabsTrigger value="rastreamento" className="rounded-xl px-6 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary font-bold text-xs uppercase tracking-widest transition-all gap-2 flex-1 md:flex-none">
            <Activity className="h-4 w-4" /> 3. Rastreamento / Análise
          </TabsTrigger>
        </TabsList>

        <TabsContent value="identificacao" className="space-y-6 outline-none">
          <Card className="border-slate-50 shadow-lahomes rounded-[2.5rem] overflow-hidden bg-white">
            <CardContent className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-1">Nome da Origem</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    defaultValue={initialData?.name} 
                    placeholder="Ex: Tráfego Pago Google"
                    required 
                    className="h-14 rounded-2xl border-slate-100 focus:ring-primary/20 text-base font-medium shadow-inner bg-slate-50/30"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="code" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-1">Código Interno</Label>
                  <Input 
                    id="code" 
                    name="code" 
                    defaultValue={initialData?.code} 
                    placeholder="Ex: GOOGLE_ADS"
                    required 
                    className="h-14 rounded-2xl border-slate-100 focus:ring-primary/20 font-black text-primary uppercase tracking-widest shadow-inner bg-slate-50/30"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="category" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-1">Categoria</Label>
                  <Select name="category" defaultValue={initialData?.category || "Outro"}>
                    <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50/30 text-base font-medium">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-50 shadow-xl overflow-hidden font-sans">
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat} className="rounded-xl focus:bg-primary/5 py-3">
                          <span className="font-bold text-slate-600">{cat}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-1">Descrição Operacional</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  defaultValue={initialData?.description} 
                  placeholder="Descreva como essa origem deve ser gerenciada..."
                  className="min-h-[120px] rounded-2xl border-slate-100 bg-slate-50/30 text-base font-medium p-4"
                />
              </div>

              <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100 w-full md:w-fit">
                <Switch id="isActive" name="isActive" defaultChecked={initialData ? initialData.isActive : true} />
                <div className="space-y-1">
                  <Label htmlFor="isActive" className="text-xs font-black uppercase tracking-widest text-slate-700 cursor-pointer">Status Ativo</Label>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Habilita ou desabilita esta origem no sistema.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regras" className="space-y-6 outline-none">
          <Card className="border-slate-50 shadow-lahomes rounded-[2.5rem] overflow-hidden bg-white">
            <CardContent className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex items-start gap-4 p-6 rounded-3xl border border-slate-100 bg-slate-50/30 hover:bg-slate-50 transition-colors">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <Zap className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="commissionEligible" className="text-sm font-black uppercase tracking-widest text-slate-700 cursor-pointer">Participa da Comissão?</Label>
                      <Switch id="commissionEligible" name="commissionEligible" defaultChecked={initialData ? initialData.commissionEligible : true} />
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight leading-relaxed">
                      Se desativado, vendas desta origem não gerarão comissão automática.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 rounded-3xl border border-slate-100 bg-slate-50/30 hover:bg-slate-50 transition-colors">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <Award className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="hasCommissionOverride" className="text-sm font-black uppercase tracking-widest text-slate-700 cursor-pointer">Comissão Diferenciada?</Label>
                      <Switch id="hasCommissionOverride" name="hasCommissionOverride" defaultChecked={initialData?.hasCommissionOverride} />
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight leading-relaxed">
                      Ative para configurar regras específicas de comissão para este canal.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 rounded-3xl border border-slate-100 bg-slate-50/30 hover:bg-slate-50 transition-colors">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <Search className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="requiresDetail" className="text-sm font-black uppercase tracking-widest text-slate-700 cursor-pointer">Exigir Complemento?</Label>
                      <Switch id="requiresDetail" name="requiresDetail" defaultChecked={initialData?.requiresDetail} />
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight leading-relaxed">
                      Obriga o preenchimento de informação extra no PDV (ex: nome do indicador).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-6 rounded-3xl border border-slate-100 bg-slate-50/30 hover:bg-slate-50 transition-colors">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <MapPin className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="isDefaultPdv" className="text-sm font-black uppercase tracking-widest text-slate-700 cursor-pointer">Origem Padrão do PDV?</Label>
                      <Switch id="isDefaultPdv" name="isDefaultPdv" defaultChecked={initialData?.isDefaultPdv} />
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight leading-relaxed">
                      Define esta origem como selecionada automaticamente ao abrir o PDV.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-50">
                <div className="flex flex-col gap-2 w-full max-w-xs">
                  <Label htmlFor="priority" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-1">Prioridade de Exibição</Label>
                  <Input 
                    id="priority" 
                    name="priority" 
                    type="number"
                    defaultValue={initialData?.priority || 0} 
                    className="h-12 rounded-2xl border-slate-100 bg-slate-50/30 font-bold text-slate-600"
                  />
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight pl-1 italic">Maiores números aparecem primeiro no PDV.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rastreamento" className="space-y-6 outline-none">
          <Card className="border-slate-50 shadow-lahomes rounded-[2.5rem] overflow-hidden bg-white">
            <CardContent className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div className="space-y-3">
                    <Label htmlFor="estimatedCost" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-1">Custo Estimado Mensal (BRL)</Label>
                    <Input 
                      id="estimatedCost" 
                      name="estimatedCost" 
                      type="number"
                      step="0.01"
                      defaultValue={initialData?.estimatedCost || 0} 
                      className="h-14 rounded-2xl border-slate-100 bg-slate-50/30 text-lg font-black text-primary font-outfit"
                    />
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight pl-1">Usado para cálculo de ROI (Retorno sobre Investimento).</p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="notes" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-1">Observações de Análise</Label>
                    <Textarea 
                      id="notes" 
                      name="notes" 
                      defaultValue={initialData?.notes} 
                      placeholder="Insights e anotações para análise de desempenho..."
                      className="min-h-[150px] rounded-3xl border-slate-100 bg-slate-50/30 p-6 text-sm font-medium leading-relaxed"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 flex flex-col justify-center gap-6">
                  <div className="p-4 bg-white rounded-3xl shadow-sm border border-slate-100 w-fit">
                    <BarChart3 className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xl font-black text-slate-700 font-outfit tracking-tight">Inteligência de Canais</h3>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-relaxed leading-loose">
                      Estes dados permitem ao Spa do Colchão entender quais canais trazem clientes com maior ticket médio e menor custo de aquisição.
                    </p>
                    <div className="space-y-3 pt-4 border-t border-slate-200/50">
                       <div className="flex items-center gap-3">
                         <div className="h-2 w-2 rounded-full bg-emerald-500" />
                         <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Calcula ROAS automaticamente</span>
                       </div>
                       <div className="flex items-center gap-3">
                         <div className="h-2 w-2 rounded-full bg-blue-500" />
                         <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Projeta Metas por Canal</span>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  )
}
