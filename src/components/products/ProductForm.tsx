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
import { ArrowLeft, Save } from "lucide-react"

export function ProductForm({ initialData = {}, onAction }: { initialData?: any, onAction: (data: any) => Promise<any> }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState(initialData.type || "PRODUCT")
  const [operationalCategory, setOperationalCategory] = useState(initialData.operationalCategory || "Colchão novo")

  // JSON operational config state
  const [opConfig, setOpConfig] = useState<any>(initialData.operationalConfig ? JSON.parse(initialData.operationalConfig) : {})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set("type", type)
    formData.set("operationalCategory", operationalCategory)
    formData.set("operationalConfig", JSON.stringify(opConfig))
    
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
          <TabsTrigger value="comercial">Comercial</TabsTrigger>
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

          {/* ABA 2: Comercial */}
          <TabsContent value="comercial" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultPrice">Preço Base (R$)</Label>
                <Input id="defaultPrice" name="defaultPrice" type="number" step="0.01" defaultValue={initialData.defaultPrice} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimumPrice">Preço Mínimo (R$)</Label>
                <Input id="minimumPrice" name="minimumPrice" type="number" step="0.01" defaultValue={initialData.minimumPrice} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultCommission">Comissão Padrão (%)</Label>
                <Input id="defaultCommission" name="defaultCommission" type="number" step="0.01" defaultValue={initialData.defaultCommission} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
              <div className="flex items-center space-x-2">
                <Switch id="allowPriceChangeInPDV" name="allowPriceChangeInPDV" defaultChecked={initialData.allowPriceChangeInPDV} />
                <Label htmlFor="allowPriceChangeInPDV">Permite alterar preço no PDV?</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="requirePriceChangeJustification" name="requirePriceChangeJustification" defaultChecked={initialData.requirePriceChangeJustification} />
                <Label htmlFor="requirePriceChangeJustification">Exige justificativa para alterar valor?</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="highlightInPDV" name="highlightInPDV" defaultChecked={initialData.highlightInPDV} />
                <Label htmlFor="highlightInPDV">Destacar este item no PDV?</Label>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productionTimeMinutes">Tempo médio produção (min)</Label>
                <Input id="productionTimeMinutes" name="productionTimeMinutes" type="number" defaultValue={initialData.productionTimeMinutes} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedLaborCost">Custo est. mão de obra (R$)</Label>
                <Input id="estimatedLaborCost" name="estimatedLaborCost" type="number" step="0.01" defaultValue={initialData.estimatedLaborCost} />
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
                  <Input id="ncm" name="ncm" defaultValue={initialData.ncm} />
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
