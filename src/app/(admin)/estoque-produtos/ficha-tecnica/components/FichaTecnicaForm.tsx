"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ProductRecipe, ProductRecipeItem, ProductService, SupplyItem } from "@prisma/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, ArrowLeft, Save, AlertCircle, Copy, CheckCircle2 } from "lucide-react"
import { saveFichaTecnica } from "../actions"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

type ItemWithRules = any

interface FichaTecnicaFormProps {
  initialData?: any
  productServices: any[]
  supplyItems: any[]
}
const RULE_TYPES = [
  { value: "COMMERCIAL_SIZE", label: "Tamanho Comercial" },
  { value: "DIMENSION", label: "Dimensão Real (Área/Perímetro)" },
  { value: "MATTRESS_TYPE", label: "Tipo de Colchão" },
  { value: "BOX_TYPE", label: "Tipo de Box" },
  { value: "DENSITY", label: "Densidade" },
  { value: "SERVICE_OPTION", label: "Opção de Serviço" },
]

export function FichaTecnicaForm({ initialData, productServices, supplyItems }: FichaTecnicaFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const isNew = !initialData

  // Identify Tab
  const [formData, setFormData] = useState({
    id: initialData?.id || "",
    productServiceId: initialData?.productServiceId || "",
    name: initialData?.name || "",
    variant: initialData?.variant || "",
    operationalCategory: initialData?.operationalCategory || "",
    description: initialData?.description || "",
    isDefault: initialData?.isDefault ?? false,
    isActive: initialData?.isActive ?? true,
    
    // Config Tab
    consumesStock: initialData?.consumesStock ?? true,
    generatesProductionOrder: initialData?.generatesProductionOrder ?? true,
    usesCommercialSize: initialData?.usesCommercialSize ?? false,
    usesActualDimensions: initialData?.usesActualDimensions ?? false,
    usesMattressType: initialData?.usesMattressType ?? false,
    usesDensity: initialData?.usesDensity ?? false,
    usesBoxType: initialData?.usesBoxType ?? false,
    usesFabricSelection: initialData?.usesFabricSelection ?? false,
    usesServiceOptions: initialData?.usesServiceOptions ?? false,
    lossPercentage: initialData?.lossPercentage || 0,
    estimatedProductionMinutes: initialData?.estimatedProductionMinutes || 0,
    estimatedLaborCost: initialData?.estimatedLaborCost || 0,
    notes: initialData?.notes || "",
  })

  // Items Tab
  const [items, setItems] = useState<ItemWithRules[]>(
    initialData?.items?.map((i: any) => ({
      ...i,
      internalId: i.id || crypto.randomUUID(),
      rules: i.rules || []
    })) || []
  )

  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!formData.productServiceId || !formData.name) {
      toast({ title: "Erro", description: "Preencha o Produto/Serviço e o Nome da Ficha", variant: "destructive" })
      return
    }

    setSaving(true)
    const payload = {
      ...formData,
      items: items.map(i => ({
        supplyItemId: i.supplyItemId,
        componentPart: i.componentPart,
        baseQuantity: i.baseQuantity,
        unit: i.unit,
        multiplier: i.multiplier,
        wastePercentage: i.wastePercentage,
        displayOrder: i.displayOrder,
        notes: i.notes,
        rules: i.rules
      }))
    }

    const { id, ...dataNoId } = payload
    const finalPayload = isNew ? dataNoId : payload

    const result = await saveFichaTecnica(finalPayload)
    if (result.success) {
      toast({ title: "Sucesso", description: isNew ? "Ficha criada com sucesso!" : "Ficha atualizada." })
      router.push("/estoque-produtos/ficha-tecnica")
      router.refresh()
    } else {
      toast({ title: "Erro", description: result.error || "Erro ao salvar", variant: "destructive" })
    }
    setSaving(false)
  }

  const addItem = () => {
    setItems([
      ...items,
      {
        internalId: crypto.randomUUID(),
        supplyItemId: "",
        componentPart: "",
        baseQuantity: 1,
        unit: "UN",
        multiplier: 1,
        wastePercentage: 0,
        displayOrder: items.length,
        rules: []
      }
    ])
  }

  const updateItem = (internalId: string, field: string, value: any) => {
    setItems(items.map(i => i.internalId === internalId ? { ...i, [field]: value } : i))
  }

  const removeItem = (internalId: string) => {
    setItems(items.filter(i => i.internalId !== internalId))
  }

  const addRule = (itemInternalId: string) => {
    setItems(items.map(i => {
      if (i.internalId === itemInternalId) {
        return {
          ...i,
          rules: [...i.rules, { ruleType: "", conditionValue: "", computedQuantity: 0, multiplier: 1 }]
        }
      }
      return i
    }))
  }

  const updateRule = (itemInternalId: string, ruleIdx: number, field: string, value: any) => {
    setItems(items.map(i => {
      if (i.internalId === itemInternalId) {
        const newRules = [...i.rules]
        newRules[ruleIdx] = { ...newRules[ruleIdx], [field]: value }
        return { ...i, rules: newRules }
      }
      return i
    }))
  }

  const removeRule = (itemInternalId: string, ruleIdx: number) => {
    setItems(items.map(i => {
      if (i.internalId === itemInternalId) {
        return { ...i, rules: i.rules.filter((_: any, idx: number) => idx !== ruleIdx) }
      }
      return i
    }))
  }

  // Calculate costs summary
  const totalSupplyCost = items.reduce((acc, curr) => {
    const supply = supplyItems.find(s => s.id === curr.supplyItemId)
    const cost = supply?.averageCost || 0
    return acc + (cost * (Number(curr.baseQuantity) || 0))
  }, 0)
  
  const estimatedTotal = (Number(formData.estimatedLaborCost) || 0) + totalSupplyCost

  // Completeness check
  const isComplete = items.length > 0 && formData.estimatedLaborCost > 0

  return (
    <div className="pb-24">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <div className="flex gap-2 items-center">
          {!isComplete && (
            <Badge variant="outline" className="border-orange-500 text-orange-600 bg-orange-50">
              <AlertCircle className="w-3 h-3 mr-1" /> Ficha Incompleta
            </Badge>
          )}
          {isComplete && (
            <Badge className="bg-emerald-500 hover:bg-emerald-600">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Ficha Pronta
            </Badge>
          )}
          <Button onClick={handleSave} disabled={saving} className="bg-brand-600 hover:bg-brand-700">
            <Save className="mr-2 h-4 w-4" /> {saving ? "Salvando..." : "Salvar Ficha"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="identificacao" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 mb-8 w-full max-w-4xl bg-slate-100/50 p-1">
          <TabsTrigger value="identificacao">Identificação</TabsTrigger>
          <TabsTrigger value="regras_gerais">Regras Gerais</TabsTrigger>
          <TabsTrigger value="insumos">Insumos</TabsTrigger>
          <TabsTrigger value="regras_consumo">Regras Inteligentes</TabsTrigger>
          <TabsTrigger value="custo">Custo e Produção</TabsTrigger>
          <TabsTrigger value="resumo">Resumo Final</TabsTrigger>
        </TabsList>

        {/* 1. IDENTIFICAÇÃO */}
        <TabsContent value="identificacao">
          <Card>
            <CardHeader>
              <CardTitle>Identificação da Ficha Técnica</CardTitle>
              <CardDescription>Defina a qual produto ou serviço esta estrutura pertence.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Produto / Serviço Vinculado*</Label>
                  <Select 
                    value={formData.productServiceId} 
                    onValueChange={v => setFormData({ ...formData, productServiceId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto/serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {productServices.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nome da Ficha*</Label>
                  <Input 
                    placeholder="Ex: Reforma Casal Mola Padrão" 
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Categoria Operacional</Label>
                  <Input 
                    placeholder="Ex: Reforma de Colchão" 
                    value={formData.operationalCategory}
                    onChange={e => setFormData({ ...formData, operationalCategory: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Variante / Referência</Label>
                  <Input 
                    placeholder="Ex: Tecido Suede" 
                    value={formData.variant}
                    onChange={e => setFormData({ ...formData, variant: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição Pública / Observação</Label>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-6 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="isDefault" 
                    checked={formData.isDefault}
                    onCheckedChange={v => setFormData({ ...formData, isDefault: v })}
                  />
                  <Label htmlFor="isDefault" className="cursor-pointer">Ficha Padrão do Produto</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="isActive" 
                    checked={formData.isActive}
                    onCheckedChange={v => setFormData({ ...formData, isActive: v })}
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">Ficha Ativa</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. REGRAS GERAIS */}
        <TabsContent value="regras_gerais">
          <Card>
            <CardHeader>
              <CardTitle>Regras Gerais e Lógicas Aplicáveis</CardTitle>
              <CardDescription>Configure como esta ficha vai reagir no momento da venda e o que ela irá consumir.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                
                {/* Switches */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-brand-900 border-b pb-2">Comportamento Sistêmico</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Consome Estoque</Label>
                      <p className="text-xs text-muted-foreground">Baixa os insumos do estoque na venda</p>
                    </div>
                    <Switch checked={formData.consumesStock} onCheckedChange={v => setFormData({ ...formData, consumesStock: v })} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Gera Ordem de Produção</Label>
                      <p className="text-xs text-muted-foreground">Cria um card na fila de produção</p>
                    </div>
                    <Switch checked={formData.generatesProductionOrder} onCheckedChange={v => setFormData({ ...formData, generatesProductionOrder: v })} />
                  </div>
                </div>

                {/* Flags operacionais */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-brand-900 border-b pb-2">Variáveis Suportadas nesta ficha</h3>
                  
                  <div className="flex items-center space-x-2">
                    <Switch checked={formData.usesCommercialSize} onCheckedChange={v => setFormData({ ...formData, usesCommercialSize: v })} />
                    <Label className="text-sm">Usa referências de Tamanho Comercial (Casal, Queen...)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch checked={formData.usesActualDimensions} onCheckedChange={v => setFormData({ ...formData, usesActualDimensions: v })} />
                    <Label className="text-sm">Usa Dimensões Reais de Engenharia (Largura, Comp, Altura)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch checked={formData.usesFabricSelection} onCheckedChange={v => setFormData({ ...formData, usesFabricSelection: v })} />
                    <Label className="text-sm">Exige seleção de tecidos pelo vendedor</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch checked={formData.usesServiceOptions} onCheckedChange={v => setFormData({ ...formData, usesServiceOptions: v })} />
                    <Label className="text-sm">Permite Opções de Serviço extras (Waterproofing...)</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                 <h3 className="text-sm font-semibold text-brand-900 border-b pb-2">Estimativas de Produção</h3>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   <div className="space-y-2">
                     <Label>Tempo Médio (Minutos)</Label>
                     <Input 
                       type="number" 
                       value={formData.estimatedProductionMinutes} 
                       onChange={e => setFormData({ ...formData, estimatedProductionMinutes: Number(e.target.value) })}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label>Custo Fixo Mão de Obra (R$)</Label>
                     <Input 
                       type="number" step="0.01" 
                       value={formData.estimatedLaborCost} 
                       onChange={e => setFormData({ ...formData, estimatedLaborCost: Number(e.target.value) })}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label>% Perda Padrão (Fábrica)</Label>
                     <Input 
                       type="number" step="0.1" 
                       value={formData.lossPercentage} 
                       onChange={e => setFormData({ ...formData, lossPercentage: Number(e.target.value) })}
                     />
                   </div>
                 </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. INSUMOS */}
        <TabsContent value="insumos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Insumos e Matérias-Primas</CardTitle>
                <CardDescription>Adicione os materiais que compõem este produto na quantidade base.</CardDescription>
              </div>
              <Button onClick={addItem} variant="outline" size="sm" className="bg-brand-50 text-brand-700 hover:bg-brand-100">
                <Plus className="h-4 w-4 mr-1" /> Adicionar Insumo
              </Button>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg bg-slate-50 text-slate-500">
                  <p>Nenhum insumo adicionado a esta ficha.</p>
                  <Button onClick={addItem} variant="ghost" className="mt-4 text-brand-600">Adicionar o primeiro insumo</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={item.internalId} className="group relative border rounded-lg p-4 bg-white shadow-sm hover:border-brand-300 transition-colors">
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700" onClick={() => removeItem(item.internalId!)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-1 flex items-center justify-center font-medium text-slate-400">
                          #{index + 1}
                        </div>
                        <div className="md:col-span-4 space-y-1">
                          <Label className="text-xs">Insumo Real do Estoque</Label>
                          <Select 
                            value={item.supplyItemId} 
                            onValueChange={v => updateItem(item.internalId!, "supplyItemId", v)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Buscar insumo..." />
                            </SelectTrigger>
                            <SelectContent>
                              {supplyItems.map((s: any) => (
                                <SelectItem key={s.id} value={s.id}>{s.name} ({s.unit})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="md:col-span-3 space-y-1">
                          <Label className="text-xs">Parte / Camada</Label>
                          <Input 
                            value={item.componentPart || ""} 
                            placeholder="Ex: Tampo" 
                            className="h-9"
                            onChange={e => updateItem(item.internalId!, "componentPart", e.target.value)} 
                          />
                        </div>

                        <div className="md:col-span-2 space-y-1">
                          <Label className="text-xs">Quant. Base</Label>
                          <Input 
                            type="number" step="0.001" 
                            value={item.baseQuantity} 
                            className="h-9 font-mono"
                            onChange={e => updateItem(item.internalId!, "baseQuantity", e.target.value)} 
                          />
                        </div>

                        <div className="md:col-span-2 space-y-1">
                          <Label className="text-xs">Unidade</Label>
                          <Input 
                            value={item.unit || "UN"} 
                            className="h-9 bg-slate-50"
                            onChange={e => updateItem(item.internalId!, "unit", e.target.value)} 
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-3 pl-0 md:pl-[8.33%]">
                        <div className="md:col-span-12 flex gap-4">
                            <div className="w-32">
                              <Label className="text-xs text-muted-foreground">% Perda Item</Label>
                              <Input 
                                type="number" 
                                value={item.wastePercentage} 
                                className="h-8 text-xs font-mono"
                                onChange={e => updateItem(item.internalId!, "wastePercentage", e.target.value)} 
                              />
                            </div>
                            <div className="flex-1">
                              <Label className="text-xs text-muted-foreground">Nota / Especificação</Label>
                              <Input 
                                value={item.notes || ""} 
                                placeholder="Observações..."
                                className="h-8 text-xs"
                                onChange={e => updateItem(item.internalId!, "notes", e.target.value)} 
                              />
                            </div>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. REGRAS DE CONSUMO */}
        <TabsContent value="regras_consumo">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Regras Dimensionais e Condicionais</CardTitle>
                <CardDescription>Sobrescreva a quantidade base ou ative insumos baseados em condições do pedido (ex: Tamanho Casal consome 2.2m de tecido).</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                 <div className="text-center py-12 text-slate-500">
                    Nenhum insumo disponível para configurar regras. Adicione insumos primeiro.
                 </div>
              ) : (
                <div className="space-y-6 border-l-2 border-slate-100 pl-4">
                  {items.map((item, index) => {
                    const itemName = supplyItems.find(s => s.id === item.supplyItemId)?.name || `Insumo #${index+1} sem definição`
                    const hasRules = !!item.rules && item.rules.length > 0;
                    
                    return (
                      <div key={`rule-${item.internalId}`} className={`border rounded-lg p-4 ${hasRules ? 'border-brand-200 bg-brand-50/20' : 'bg-slate-50/50'}`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                             <div className="font-semibold text-brand-900">{itemName}</div>
                             <Badge variant="outline">{item.componentPart || "Sem Subgrupo"}</Badge>
                             <div className="text-xs text-muted-foreground">Qtd Base: {item.baseQuantity} {item.unit}</div>
                          </div>
                          <Button size="sm" variant="ghost" className="text-brand-600 hover:bg-brand-100" onClick={() => addRule(item.internalId!)}>
                            <Plus className="h-4 w-4 mr-1" /> Nova Regra
                          </Button>
                        </div>

                        {hasRules ? (
                          <div className="space-y-3">
                            {item.rules.map((rule: any, ruleIdx: number) => (
                              <div key={ruleIdx} className="flex flex-wrap md:flex-nowrap gap-3 items-end p-3 bg-white border border-slate-200 rounded-md shadow-sm">
                                <div className="space-y-1 flex-1">
                                  <Label className="text-[10px] uppercase tracking-wider text-slate-500">Variável</Label>
                                  <Select 
                                    value={rule.ruleType} 
                                    onValueChange={v => updateRule(item.internalId!, ruleIdx, "ruleType", v)}
                                  >
                                    <SelectTrigger className="h-8 text-xs font-medium bg-slate-50">
                                      <SelectValue placeholder="Variável" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {RULE_TYPES.map(rt => (
                                        <SelectItem key={rt.value} value={rt.value} className="text-xs">{rt.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-1 w-32">
                                  <Label className="text-[10px] uppercase tracking-wider text-slate-500">Se Igual a</Label>
                                  <Input 
                                    value={rule.conditionValue} 
                                    onChange={e => updateRule(item.internalId!, ruleIdx, "conditionValue", e.target.value)} 
                                    className="h-8 text-xs font-mono" 
                                    placeholder="Ex: QUEEN"
                                  />
                                </div>

                                <div className="space-y-1 w-32">
                                  <Label className="text-[10px] uppercase tracking-wider text-slate-500">Novo Consumo</Label>
                                  <Input 
                                    type="number" step="0.001"
                                    value={rule.computedQuantity} 
                                    onChange={e => updateRule(item.internalId!, ruleIdx, "computedQuantity", e.target.value)} 
                                    className="h-8 text-xs font-mono text-brand-700 bg-brand-50 border-brand-200" 
                                  />
                                </div>

                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => removeRule(item.internalId!, ruleIdx)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground italic">
                            Usa a quantidade base de {item.baseQuantity} {item.unit} incondicionalmente.
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. CUSTOS E PRODUÇÃO */}
        <TabsContent value="custo">
          <Card>
            <CardHeader>
              <CardTitle>Cálculos Estimados (Base Linear)</CardTitle>
              <CardDescription>Estes são os custos caso nenhuma condição especial seja ativada. Serve como guia de precificação.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 line-clamp-2">
                 
                 <div className="space-y-4">
                   <h3 className="font-medium flex items-center gap-2 pb-2 border-b"><Copy className="w-4 h-4"/> Custo dos Insumos (Qtd Base)</h3>
                   <div className="space-y-2">
                     {items.map((item, idx) => {
                       const s = supplyItems.find(x => x.id === item.supplyItemId)
                       const cost = (s?.averageCost || 0) * (Number(item.baseQuantity) || 0)
                       return (
                         <div key={idx} className="flex justify-between text-sm py-1 border-b border-dashed">
                           <span className="text-muted-foreground">{s?.name || 'Item'} ({item.baseQuantity} {item.unit})</span>
                           <span className="font-mono">R$ {cost.toFixed(2)}</span>
                         </div>
                       )
                     })}
                   </div>
                   <div className="flex justify-between text-brand-900 font-semibold pt-2">
                     <span>Subtotal Insumos</span>
                     <span>R$ {totalSupplyCost.toFixed(2)}</span>
                   </div>
                 </div>

                 <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 h-fit space-y-4">
                   <h3 className="font-medium pb-2 border-b text-slate-800">Custo Total de Produção Estimado</h3>
                   <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Insumos (A)</span>
                     <span className="font-mono text-slate-700">R$ {totalSupplyCost.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Mão de Obra Faturada (B)</span>
                     <span className="font-mono text-slate-700">R$ {(Number(formData.estimatedLaborCost) || 0).toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between text-lg font-bold text-brand-900 pt-4 border-t">
                     <span>Custo Base Estimado</span>
                     <span>R$ {estimatedTotal.toFixed(2)}</span>
                   </div>
                   <div className="text-xs text-orange-600 font-medium">
                     *Não inclui perdas ({formData.lossPercentage}%) nem variações dimensionais.
                   </div>
                 </div>

               </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6. RESUMO E VALIDAÇÃO */}
        <TabsContent value="resumo">
          <Card>
            <CardHeader>
              <CardTitle>Validação Operacional</CardTitle>
              <CardDescription>Revise o projeto da Ficha Técnica antes de liberar comercialmente para vendedores.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="max-w-xl space-y-4">
                 <div className={`p-4 rounded-lg flex gap-3 ${isComplete ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-orange-50 text-orange-900 border border-orange-200'}`}>
                   {isComplete ? <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />}
                   <div>
                     <h4 className="font-semibold">{isComplete ? "Ficha Funcional" : "Ficha Pendente ou Incompleta"}</h4>
                     <p className="text-sm mt-1 opacity-80">
                       {isComplete ? "Todos os requisitos mínimos atendidos. Pode ser vinculada e ativada." : "Para a ficha ficar pronta para o sistema operacional gerar ordens de produção ou baixar estoque limpo, é necessário preencher itens base e custo base de mão de obra."}
                     </p>
                   </div>
                 </div>

                 <ul className="space-y-2 mt-6">
                   <li className="flex items-center gap-2 text-sm text-slate-600">
                     <span className={items.length > 0 ? "text-emerald-500 font-bold" : "text-slate-300 font-bold"}>✓</span>
                     Insumos vinculados ({items.length})
                   </li>
                   <li className="flex items-center gap-2 text-sm text-slate-600">
                     <span className={formData.productServiceId ? "text-emerald-500 font-bold" : "text-slate-300 font-bold"}>✓</span>
                     Produto/Serviço atrelado
                   </li>
                   <li className="flex items-center gap-2 text-sm text-slate-600">
                     <span className={formData.estimatedProductionMinutes > 0 ? "text-emerald-500 font-bold" : "text-slate-300 font-bold"}>✓</span>
                     Tempo Médio Cadastrado ({formData.estimatedProductionMinutes} min)
                   </li>
                 </ul>
               </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
