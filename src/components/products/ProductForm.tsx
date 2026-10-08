"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Save, Sparkles, CheckCircle2 } from "lucide-react"
import { NcmAutocomplete } from "./NcmAutocomplete"
import { ProductPricingSimulator } from "./ProductPricingSimulator"
import { FinancialBaselineMetrics } from "@/lib/pricing/financial-baseline"
import { ProductRecipeCostDetail } from "@/lib/pricing/product-cost"

interface ProductFormProps {
  initialData?: any
  onAction: (data: any) => Promise<any>
  financialBaseline?: FinancialBaselineMetrics
  recipeCost?: ProductRecipeCostDetail | null
}

export function ProductForm({ 
  initialData = {}, 
  onAction,
  financialBaseline,
  recipeCost
}: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState(initialData.type || "PRODUCT")
  const [operationalCategory, setOperationalCategory] = useState(initialData.operationalCategory || "Colchão novo")

  // Estado dos valores comerciais e operacionais controlados pelo simulador
  const [defaultPrice, setDefaultPrice] = useState<number | undefined>(
    initialData.defaultPrice !== null && initialData.defaultPrice !== undefined 
      ? Number(initialData.defaultPrice) 
      : undefined
  )
  const [minimumPrice, setMinimumPrice] = useState<number | undefined>(
    initialData.minimumPrice !== null && initialData.minimumPrice !== undefined 
      ? Number(initialData.minimumPrice) 
      : undefined
  )
  const [defaultCommission, setDefaultCommission] = useState<number | undefined>(
    initialData.defaultCommission !== null && initialData.defaultCommission !== undefined 
      ? Number(initialData.defaultCommission) 
      : 3.0
  )
  const [productionTimeMinutes, setProductionTimeMinutes] = useState<number | undefined>(
    initialData.productionTimeMinutes !== null && initialData.productionTimeMinutes !== undefined 
      ? Number(initialData.productionTimeMinutes) 
      : undefined
  )
  const [estimatedLaborCost, setEstimatedLaborCost] = useState<number | undefined>(
    initialData.estimatedLaborCost !== null && initialData.estimatedLaborCost !== undefined 
      ? Number(initialData.estimatedLaborCost) 
      : undefined
  )

  // JSON operational config state
  const [opConfig, setOpConfig] = useState<any>(initialData.operationalConfig ? JSON.parse(initialData.operationalConfig) : {})

  // Callback ao aplicar preços calculados no simulador
  const handleApplyPricingFromSimulator = (pricing: {
    defaultPrice: number
    minimumPrice: number
    estimatedLaborCost: number
    productionMinutes?: number
  }) => {
    setDefaultPrice(pricing.defaultPrice)
    setMinimumPrice(pricing.minimumPrice)
    setEstimatedLaborCost(pricing.estimatedLaborCost)
    if (pricing.productionMinutes !== undefined) {
      setProductionTimeMinutes(pricing.productionMinutes)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set("type", type)
    formData.set("operationalCategory", operationalCategory)
    formData.set("operationalConfig", JSON.stringify(opConfig))
    
    // Assegura que os valores numéricos sincronizados pelo simulador estejam corretos no FormData
    if (defaultPrice !== undefined && defaultPrice !== null) {
      formData.set("defaultPrice", String(defaultPrice))
    }
    if (minimumPrice !== undefined && minimumPrice !== null) {
      formData.set("minimumPrice", String(minimumPrice))
    }
    if (defaultCommission !== undefined && defaultCommission !== null) {
      formData.set("defaultCommission", String(defaultCommission))
    }
    if (productionTimeMinutes !== undefined && productionTimeMinutes !== null) {
      formData.set("productionTimeMinutes", String(productionTimeMinutes))
    }
    if (estimatedLaborCost !== undefined && estimatedLaborCost !== null) {
      formData.set("estimatedLaborCost", String(estimatedLaborCost))
    }

    // Convert switch/checkbox values to explicit booleans (FormData only has "on" if checked)
    const booleanFields = [
      "isActive", "allowPriceChangeInPDV", "requirePriceChangeJustification", "highlightInPDV",
      "useTechnicalSheet", "consumesStock", "generatesProductionOrder", "managesStock"
    ]
    booleanFields.forEach(f => {
      formData.set(f, formData.get(f) ? "true" : "false")
    })

    try {
      const result = await onAction(formData)
      if (result && result.error) {
        alert("Erro: " + result.error)
      } else {
        router.push("/estoque-produtos/produtos-servicos")
        router.refresh()
      }
    } catch (error) {
      console.error(error)
      alert("Ocorreu um erro de comunicação ao salvar o registro.")
    } finally {
      setLoading(false)
    }
  }

  const renderOpConfig = () => {
    switch (operationalCategory) {
      case "Reforma de colchão":
      case "Reforma de box":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configuração de Reforma</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de serviço (separado por vírgula)</Label>
                <Input value={opConfig.serviceTypes || ""} onChange={e => setOpConfig({...opConfig, serviceTypes: e.target.value})} placeholder="ex: simples, média, profunda..." />
              </div>
              <div className="space-y-2">
                <Label>Densidades permitidas</Label>
                <Input value={opConfig.densities || ""} onChange={e => setOpConfig({...opConfig, densities: e.target.value})} placeholder="ex: D20, D23, D33" />
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <Checkbox id="comSize" checked={opConfig.allowCommercialSize} onCheckedChange={(v) => setOpConfig({...opConfig, allowCommercialSize: !!v})} />
              <Label htmlFor="comSize">Permite tamanho comercial?</Label>
            </div>
            <div className="flex gap-4 items-center">
              <Checkbox id="realSize" checked={opConfig.allowRealSize} onCheckedChange={(v) => setOpConfig({...opConfig, allowRealSize: !!v})} />
              <Label htmlFor="realSize">Permite medidas reais?</Label>
            </div>
            <div className="flex gap-4 items-center">
              <Checkbox id="useStockFabric" checked={opConfig.useStockFabric} onCheckedChange={(v) => setOpConfig({...opConfig, useStockFabric: !!v})} />
              <Label htmlFor="useStockFabric">Usa tecido do estoque?</Label>
            </div>
          </div>
        )
      case "Limpeza de estofados":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configuração de Limpeza</h3>
            <div className="space-y-2">
              <Label>Objetos disponíveis (separado por vírgula)</Label>
              <Textarea value={opConfig.objects || ""} onChange={e => setOpConfig({...opConfig, objects: e.target.value})} placeholder="ex: sofá 2 lugares, sofá 3 lugares, poltrona, puff..." />
            </div>
            <div className="flex gap-4 items-center">
              <Checkbox id="multObjs" checked={opConfig.allowMultipleObjects} onCheckedChange={(v) => setOpConfig({...opConfig, allowMultipleObjects: !!v})} />
              <Label htmlFor="multObjs">Permite múltiplos objetos por venda?</Label>
            </div>
          </div>
        )
      default:
        return <p className="text-sm text-slate-500">Sem configurações operacionais específicas para esta categoria.</p>
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-20">
      
      {/* Topo fixo: Tipo e Categoria */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
        <h2 className="text-xl font-semibold mb-4 text-blue-900 dark:text-blue-400">Classificação Principal</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Tipo de Cadastro</Label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="flex h-10 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-blue-500">
              <option value="SERVICE">Serviço</option>
              <option value="PRODUCT">Produto final</option>
              <option value="INSUMO">Insumo</option>
              <option value="TECIDO">Tecido</option>
              <option value="ESPUMA">Espuma</option>
              <option value="ESTRUTURA">Estrutura / Ferragem</option>
              <option value="LIMPEZA">Item de Limpeza</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Categoria Operacional</Label>
            <select value={operationalCategory} onChange={(e) => setOperationalCategory(e.target.value)} className="flex h-10 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-blue-500">
              <optgroup label="Serviços">
                <option value="Reforma de colchão">Reforma de colchão</option>
                <option value="Reforma de box">Reforma de box</option>
                <option value="Limpeza de estofados">Limpeza de estofados</option>
              </optgroup>
              <optgroup label="Produtos">
                <option value="Colchão novo">Colchão novo</option>
                <option value="Box novo">Box novo</option>
              </optgroup>
              <optgroup label="Insumos">
                <option value="Tecido">Tecido</option>
                <option value="Espuma">Espuma</option>
                <option value="Mola">Mola</option>
                <option value="Madeira / estrutura">Madeira / estrutura</option>
                <option value="Ferragem">Ferragem</option>
                <option value="Embalagem">Embalagem</option>
                <option value="Outros">Outros</option>
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      <Tabs defaultValue="identificacao" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 mb-8 rounded-xl bg-card border border-border p-1">
          <TabsTrigger value="identificacao">Identificação</TabsTrigger>
          <TabsTrigger value="comercial" className="relative">
            Comercial & Preço
            {financialBaseline && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5" />
            )}
          </TabsTrigger>
          <TabsTrigger value="operacional">Operacional</TabsTrigger>
          <TabsTrigger value="ficha">Ficha Técnica</TabsTrigger>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
          <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
        </TabsList>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          {/* ABA 1: Identificação */}
          <TabsContent value="identificacao" className="space-y-4 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome / Descrição do Cadastro *</Label>
                <Input id="name" name="name" defaultValue={initialData.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Código Interno</Label>
                <Input id="code" name="code" defaultValue={initialData.code} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="imageUrl">URL da Imagem do Produto</Label>
                <Input id="imageUrl" name="imageUrl" placeholder="https://exemplo.com/imagem.jpg" defaultValue={initialData.imageUrl} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição Curta (Aparece no PDV)</Label>
              <Textarea id="description" name="description" defaultValue={initialData.description} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="internalNotes">Observações Internas</Label>
              <Textarea id="internalNotes" name="internalNotes" defaultValue={initialData.internalNotes} />
            </div>
            <div className="flex items-center space-x-2 pt-4 border-t border-border">
              <Switch id="isActive" name="isActive" defaultChecked={initialData.isActive ?? true} />
              <Label htmlFor="isActive">Cadastro Ativo</Label>
            </div>
          </TabsContent>

          {/* ABA 2: Comercial & Precificação com Motor Financeiro */}
          <TabsContent value="comercial" className="space-y-8 mt-0">
            
            {/* Simulador Integrado com o Setor Financeiro */}
            {financialBaseline && (
              <ProductPricingSimulator
                initialPrice={defaultPrice}
                initialCost={recipeCost?.totalSuppliesCost || initialData.defaultCost}
                initialMinutes={productionTimeMinutes}
                initialCommission={defaultCommission}
                operationalCategory={operationalCategory}
                financialBaseline={financialBaseline}
                recipeCost={recipeCost}
                onApplyPricing={handleApplyPricingFromSimulator}
              />
            )}

            {/* Inputs Oficiais Gravados no Banco de Dados */}
            <div className="pt-6 border-t border-border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-semibold text-foreground">
                    Valores Oficiais Gravados no Cadastro
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Preços e diretrizes comerciais ativos no Ponto de Venda (PDV).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultPrice" className="text-xs font-semibold">Preço Base Oficial (R$)</Label>
                  <Input 
                    id="defaultPrice" 
                    name="defaultPrice" 
                    type="number" 
                    step="0.01" 
                    value={defaultPrice !== undefined && defaultPrice !== null ? defaultPrice : ""} 
                    onChange={e => setDefaultPrice(e.target.value ? parseFloat(e.target.value) : undefined)} 
                    className="h-10 font-mono font-bold text-base text-blue-950 dark:text-blue-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumPrice" className="text-xs font-semibold">Preço Mínimo Autorizado (R$)</Label>
                  <Input 
                    id="minimumPrice" 
                    name="minimumPrice" 
                    type="number" 
                    step="0.01" 
                    value={minimumPrice !== undefined && minimumPrice !== null ? minimumPrice : ""} 
                    onChange={e => setMinimumPrice(e.target.value ? parseFloat(e.target.value) : undefined)} 
                    className="h-10 font-mono font-bold text-base text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultCommission" className="text-xs font-semibold">Comissão Vendedores (%)</Label>
                  <Input 
                    id="defaultCommission" 
                    name="defaultCommission" 
                    type="number" 
                    step="0.01" 
                    value={defaultCommission !== undefined && defaultCommission !== null ? defaultCommission : ""} 
                    onChange={e => setDefaultCommission(e.target.value ? parseFloat(e.target.value) : undefined)} 
                    className="h-10 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border pt-4">
                <div className="flex items-center space-x-2">
                  <Switch id="allowPriceChangeInPDV" name="allowPriceChangeInPDV" defaultChecked={initialData.allowPriceChangeInPDV} />
                  <Label htmlFor="allowPriceChangeInPDV" className="text-xs">Permite alterar preço no PDV?</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="requirePriceChangeJustification" name="requirePriceChangeJustification" defaultChecked={initialData.requirePriceChangeJustification} />
                  <Label htmlFor="requirePriceChangeJustification" className="text-xs">Exige justificativa para alterar?</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="highlightInPDV" name="highlightInPDV" defaultChecked={initialData.highlightInPDV} />
                  <Label htmlFor="highlightInPDV" className="text-xs">Destacar no PDV?</Label>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ABA 3: Operacional */}
          <TabsContent value="operacional" className="mt-0">
            {renderOpConfig()}
          </TabsContent>

          {/* ABA 4: Ficha */}
          <TabsContent value="ficha" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-border">
              <div className="flex items-center space-x-2">
                <Switch id="useTechnicalSheet" name="useTechnicalSheet" defaultChecked={initialData.useTechnicalSheet} />
                <Label htmlFor="useTechnicalSheet">Usa ficha técnica?</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="consumesStock" name="consumesStock" defaultChecked={initialData.consumesStock} />
                <Label htmlFor="consumesStock">Consome estoque visível?</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="generatesProductionOrder" name="generatesProductionOrder" defaultChecked={initialData.generatesProductionOrder} />
                <Label htmlFor="generatesProductionOrder">Gera ordem de produção?</Label>
              </div>
            </div>

            {recipeCost && (
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Ficha Técnica Vinculada: {recipeCost.recipeName}
                  </h4>
                  <span className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-300">
                    Custo de Insumos: R$ {recipeCost.totalSuppliesCost.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Composição de {recipeCost.items.length} insumos ({recipeCost.items.map(i => i.supplyName).slice(0, 4).join(", ")}...).
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productionTimeMinutes">Tempo médio produção (min)</Label>
                <Input 
                  id="productionTimeMinutes" 
                  name="productionTimeMinutes" 
                  type="number" 
                  value={productionTimeMinutes !== undefined && productionTimeMinutes !== null ? productionTimeMinutes : ""} 
                  onChange={e => setProductionTimeMinutes(e.target.value ? parseInt(e.target.value, 10) : undefined)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedLaborCost">Custo est. mão de obra (R$)</Label>
                <Input 
                  id="estimatedLaborCost" 
                  name="estimatedLaborCost" 
                  type="number" 
                  step="0.01" 
                  value={estimatedLaborCost !== undefined && estimatedLaborCost !== null ? estimatedLaborCost : ""} 
                  onChange={e => setEstimatedLaborCost(e.target.value ? parseFloat(e.target.value) : undefined)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wastePercentage">Percentual de perda (%)</Label>
                <Input id="wastePercentage" name="wastePercentage" type="number" step="0.01" defaultValue={initialData.wastePercentage} />
              </div>
            </div>
          </TabsContent>

          {/* ABA 5: Estoque */}
          <TabsContent value="estoque" className="space-y-6 mt-0">
             <div className="flex items-center space-x-2 pb-4 border-b border-border">
                <Switch id="managesStock" name="managesStock" defaultChecked={initialData.managesStock} />
                <Label htmlFor="managesStock">Controla Estoque Físico?</Label>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit">Unidade de Medida</Label>
                  <Input id="unit" name="unit" placeholder="UN, KG, M, LT" defaultValue={initialData.unit} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumStock">Estoque Mínimo</Label>
                  <Input id="minimumStock" name="minimumStock" type="number" defaultValue={initialData.minimumStock} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentStock">Estoque Atual Base</Label>
                  <Input id="currentStock" name="currentStock" type="number" defaultValue={initialData.currentStock} readOnly className="bg-muted" />
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="space-y-2">
                  <Label htmlFor="stockLocation">Localização</Label>
                  <Input id="stockLocation" name="stockLocation" defaultValue={initialData.stockLocation} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultCost">Custo Médio (R$)</Label>
                  <Input id="defaultCost" name="defaultCost" type="number" step="0.01" defaultValue={initialData.defaultCost} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchaseLeadTime">Lead Time de Compra (Dias)</Label>
                  <Input id="purchaseLeadTime" name="purchaseLeadTime" type="number" defaultValue={initialData.purchaseLeadTime} />
                </div>
             </div>
          </TabsContent>

          {/* ABA 6: Fiscal */}
          <TabsContent value="fiscal" className="space-y-4 mt-0">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ncm">NCM</Label>
                  <NcmAutocomplete defaultValue={initialData.ncm} name="ncm" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cest">CEST</Label>
                  <Input id="cest" name="cest" defaultValue={initialData.cest} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cfop">CFOP Padrão</Label>
                  <Input id="cfop" name="cfop" defaultValue={initialData.cfop} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxOrigin">Origem (0, 1, 2...)</Label>
                  <Input id="taxOrigin" name="taxOrigin" defaultValue={initialData.taxOrigin} />
                </div>
             </div>
             <div className="space-y-2">
                <Label htmlFor="taxNotes">Observação Fiscal</Label>
                <Textarea id="taxNotes" name="taxNotes" defaultValue={initialData.taxNotes} />
             </div>
          </TabsContent>
        </div>
      </Tabs>

      <div className="flex justify-end gap-4 fixed bottom-0 right-0 left-64 bg-background/80 backdrop-blur-md p-4 border-t border-border z-10">
        <Button variant="outline" type="button" onClick={() => router.back()}>Cancelar</Button>
        <Button type="submit" disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? "Salvando..." : "Salvar Cadastro"}
        </Button>
      </div>
    </form>
  )
}
