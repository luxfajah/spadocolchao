"use client"

import { useState, useMemo } from "react"
import { FinancialBaselineMetrics } from "@/lib/pricing/financial-baseline"
import { ProductRecipeCostDetail } from "@/lib/pricing/product-cost"
import { 
  PricingInputParams, 
  calculateDREFromPrice, 
  calculatePriceFromDesiredMargin 
} from "@/lib/pricing/pricing-engine"
import { 
  Calculator, 
  Fuel, 
  Megaphone, 
  Building2, 
  Users, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  DollarSign,
  TrendingUp,
  Percent
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface ProductPricingSimulatorProps {
  initialPrice?: number
  initialCost?: number
  initialMinutes?: number
  initialCommission?: number
  operationalCategory?: string
  financialBaseline: FinancialBaselineMetrics
  recipeCost?: ProductRecipeCostDetail | null
  onApplyPricing: (data: {
    defaultPrice: number
    minimumPrice: number
    estimatedLaborCost: number
    productionMinutes?: number
  }) => void
}

export function ProductPricingSimulator({
  initialPrice = 0,
  initialCost = 0,
  initialMinutes = 30,
  initialCommission = 3.0,
  operationalCategory = "Colchão novo",
  financialBaseline,
  recipeCost,
  onApplyPricing
}: ProductPricingSimulatorProps) {
  // Define se é reforma ou produto novo para selecionar o rateio sugerido da capacidade
  const isReforma = operationalCategory?.toLowerCase().includes("reforma")

  // Estado dos Parâmetros de Custo
  const [suppliesCost, setSuppliesCost] = useState<number>(() => {
    if (recipeCost && recipeCost.totalSuppliesCost > 0) return recipeCost.totalSuppliesCost
    return initialCost || 120
  })

  const [productionMinutes, setProductionMinutes] = useState<number>(() => {
    if (recipeCost && recipeCost.estimatedMinutes > 0) return recipeCost.estimatedMinutes
    if (initialMinutes > 0) return initialMinutes
    return isReforma ? 80 : 35
  })

  const [laborMinuteRate, setLaborMinuteRate] = useState<number>(financialBaseline.productionMOD.minuteRate || 1.44)

  // Combustível
  const [fuelCost, setFuelCost] = useState<number>(() => {
    // Para reformas (coleta + entrega) ou novos
    return isReforma ? financialBaseline.fuel.costPerSale : financialBaseline.fuel.costPerPiece
  })

  // Tráfego Pago / Marketing
  const [marketingType, setMarketingType] = useState<"FIXED_BRL" | "PERCENTAGE">("FIXED_BRL")
  const [marketingValue, setMarketingValue] = useState<number>(financialBaseline.marketing.costPerSaleCAC || 55.0)

  // Custo da Empresa Existir (Overhead)
  const [overheadCost, setOverheadCost] = useState<number>(() => {
    return isReforma 
      ? financialBaseline.overhead.costPerPieceCapacity330 
      : financialBaseline.overhead.costPerPieceCapacity1320
  })

  // Deduções Comerciais (%)
  const [taxRatePercent, setTaxRatePercent] = useState<number>(financialBaseline.commercialDefaults.taxRatePercent || 6.0)
  const [cardFeePercent, setCardFeePercent] = useState<number>(financialBaseline.commercialDefaults.cardFeeRatePercent || 3.5)
  const [commissionPercent, setCommissionPercent] = useState<number>(initialCommission || financialBaseline.commercialDefaults.salesCommissionPercent || 3.0)

  // Preço de Venda Simulado e Margem Alvo
  const [salePrice, setSalePrice] = useState<number>(initialPrice || 1290)
  const [targetMargin, setTargetMargin] = useState<number>(25.0)

  // Modo de exibição do painel de ajustes finos
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [appliedSuccess, setAppliedSuccess] = useState(false)

  // Monta objeto de parâmetros
  const pricingParams: PricingInputParams = useMemo(() => ({
    suppliesCost,
    productionMinutes,
    laborMinuteRate,
    fuelCost,
    marketingType,
    marketingValue,
    overheadCost,
    taxRatePercent,
    cardFeePercent,
    commissionPercent
  }), [
    suppliesCost,
    productionMinutes,
    laborMinuteRate,
    fuelCost,
    marketingType,
    marketingValue,
    overheadCost,
    taxRatePercent,
    cardFeePercent,
    commissionPercent
  ])

  // DRE Unitário em Tempo Real
  const dre = useMemo(() => {
    return calculateDREFromPrice(salePrice, pricingParams)
  }, [salePrice, pricingParams])

  // Preço Sugerido pela Margem Desejada
  const suggestedPrice = useMemo(() => {
    return calculatePriceFromDesiredMargin(targetMargin, pricingParams)
  }, [targetMargin, pricingParams])

  // Função para aplicar preço sugerido
  const handleApplySuggested = () => {
    setSalePrice(suggestedPrice)
  }

  // Função para resetar para as médias exatas do financeiro
  const handleResetToFinancialDefaults = () => {
    setLaborMinuteRate(financialBaseline.productionMOD.minuteRate)
    setFuelCost(isReforma ? financialBaseline.fuel.costPerSale : financialBaseline.fuel.costPerPiece)
    setMarketingType("FIXED_BRL")
    setMarketingValue(financialBaseline.marketing.costPerSaleCAC)
    setOverheadCost(
      isReforma 
        ? financialBaseline.overhead.costPerPieceCapacity330 
        : financialBaseline.overhead.costPerPieceCapacity1320
    )
    setTaxRatePercent(financialBaseline.commercialDefaults.taxRatePercent)
    setCardFeePercent(financialBaseline.commercialDefaults.cardFeeRatePercent)
    setCommissionPercent(financialBaseline.commercialDefaults.salesCommissionPercent)
  }

  // Salvar no cadastro principal do formulário
  const handleSyncToForm = () => {
    const minPrice = dre.breakEvenPrice > 0 ? Number((dre.breakEvenPrice * 1.08).toFixed(2)) : Number((salePrice * 0.9).toFixed(2))
    onApplyPricing({
      defaultPrice: salePrice,
      minimumPrice: minPrice,
      estimatedLaborCost: dre.laborCost,
      productionMinutes
    })
    setAppliedSuccess(true)
    setTimeout(() => setAppliedSuccess(false), 3000)
  }

  // Cores de status da margem
  const marginBadgeColor = useMemo(() => {
    if (dre.netProfitMarginPercent >= 25) return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
    if (dre.netProfitMarginPercent >= 12) return "bg-amber-500/10 text-amber-600 border-amber-500/20"
    return "bg-rose-500/10 text-rose-600 border-rose-500/20"
  }, [dre.netProfitMarginPercent])

  return (
    <div className="space-y-6">
      {/* Banner de Sincronização com o Financeiro */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-md border border-blue-900/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <Sparkles className="w-3 h-3 mr-1" />
                Inteligência Financeira Ativa
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {financialBaseline.periodLabel}
              </span>
            </div>
            <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-400" />
              Simulador Industrial de Precificação & Markup
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Custos de combustível da frota, tráfego pago (Meta Ads + Ozaila & Leslie), MOD e galpão obtidos diretamente das contas reais da empresa.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetToFinancialDefaults}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs h-8"
              title="Restaura os parâmetros para as médias exatas calculadas pelo financeiro"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Recarregar Médias
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs h-8"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
              {showAdvancedSettings ? "Ocultar Parâmetros" : "Ajustar Parâmetros"}
            </Button>
          </div>
        </div>

        {/* Resumo rápido das taxas financeiras vigentes */}
        <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <Fuel className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Frota/Posto: <strong className="text-white tabular-nums">R$ {fuelCost.toFixed(2)}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Megaphone className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>Tráfego & Mkt: <strong className="text-white tabular-nums">R$ {marketingValue.toFixed(2)}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>MOD Fábrica: <strong className="text-white tabular-nums">R$ {laborMinuteRate.toFixed(2)}/min</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Galpão/Fixos: <strong className="text-white tabular-nums">R$ {overheadCost.toFixed(2)}</strong></span>
          </div>
        </div>
      </div>

      {/* Painel Avançado de Ajustes dos Custos Financeiros (quando expandido) */}
      {showAdvancedSettings && (
        <div className="bg-muted/40 border border-border p-5 rounded-2xl space-y-4 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Parâmetros de Custo Específicos Deste Produto
            </h4>
            <span className="text-xs text-muted-foreground">
              Edite para simular cenários específicos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Insumos / BOM (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={suppliesCost}
                onChange={e => setSuppliesCost(parseFloat(e.target.value) || 0)}
                className="h-9 text-sm tabular-nums"
              />
              {recipeCost && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block">
                  ✓ Ficha Técnica: R$ {recipeCost.totalSuppliesCost.toFixed(2)}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Tempo Produção (min)</Label>
              <Input
                type="number"
                value={productionMinutes}
                onChange={e => setProductionMinutes(parseInt(e.target.value, 10) || 0)}
                className="h-9 text-sm tabular-nums"
              />
              <span className="text-[11px] text-muted-foreground block">
                MOD: R$ {dre.laborCost.toFixed(2)}
              </span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Combustível / Frota (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={fuelCost}
                onChange={e => setFuelCost(parseFloat(e.target.value) || 0)}
                className="h-9 text-sm tabular-nums"
              />
              <span className="text-[11px] text-muted-foreground block">
                Auto Posto rateado
              </span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Tráfego Pago / CAC (R$)</Label>
              <div className="flex gap-1.5">
                <Input
                  type="number"
                  step="0.01"
                  value={marketingValue}
                  onChange={e => setMarketingValue(parseFloat(e.target.value) || 0)}
                  className="h-9 text-sm tabular-nums"
                />
                <select
                  value={marketingType}
                  onChange={e => setMarketingType(e.target.value as any)}
                  className="h-9 px-2 text-xs rounded-md border border-input bg-background"
                >
                  <option value="FIXED_BRL">R$</option>
                  <option value="PERCENTAGE">%</option>
                </select>
              </div>
              <span className="text-[11px] text-muted-foreground block">
                Meta + Zai & Leslie
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-border/60">
            <div className="space-y-1.5">
              <Label className="text-xs">Galpão / Estrutura (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={overheadCost}
                onChange={e => setOverheadCost(parseFloat(e.target.value) || 0)}
                className="h-9 text-sm tabular-nums"
              />
              <span className="text-[11px] text-muted-foreground block">
                Aluguel, Luz, Contador...
              </span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Impostos / Simples (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={taxRatePercent}
                onChange={e => setTaxRatePercent(parseFloat(e.target.value) || 0)}
                className="h-9 text-sm tabular-nums"
              />
              <span className="text-[11px] text-muted-foreground block">
                Simples Nacional
              </span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Taxa Maquininha (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={cardFeePercent}
                onChange={e => setCardFeePercent(parseFloat(e.target.value) || 0)}
                className="h-9 text-sm tabular-nums"
              />
              <span className="text-[11px] text-muted-foreground block">
                Cartão / Antecipação
              </span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Comissão Vendedor (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={commissionPercent}
                onChange={e => setCommissionPercent(parseFloat(e.target.value) || 0)}
                className="h-9 text-sm tabular-nums"
              />
              <span className="text-[11px] text-muted-foreground block">
                Comissão comercial
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Grid Principal: Simulador Interativo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Coluna Esquerda: Controle de Preço e Margem Desejada (5 colunas) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-5">
            <h4 className="text-base font-semibold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Definição Comercial
              </span>
              <Badge variant="outline" className={`font-mono text-xs ${marginBadgeColor}`}>
                {dre.netProfitMarginPercent.toFixed(1)}% Lucro
              </Badge>
            </h4>

            {/* Input Principal: Preço de Venda Praticado */}
            <div className="space-y-2 bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-200/60 dark:border-blue-900/50">
              <Label htmlFor="simulatedPrice" className="text-sm font-semibold text-blue-950 dark:text-blue-200 flex justify-between">
                <span>Preço de Venda do Produto (R$)</span>
                <span className="font-mono text-xs text-blue-700 dark:text-blue-300">
                  Markup: {dre.markupMultiplier.toFixed(2)}x
                </span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-lg">
                  R$
                </span>
                <Input
                  id="simulatedPrice"
                  type="number"
                  step="0.01"
                  value={salePrice}
                  onChange={e => setSalePrice(parseFloat(e.target.value) || 0)}
                  className="pl-11 h-12 text-2xl font-bold font-mono tracking-tight text-blue-950 dark:text-blue-100 bg-background"
                />
              </div>
            </div>

            {/* Calculadora Inversa: Sugerir Preço pela Margem Alvo */}
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  Calcular Preço pela Margem Alvo
                </Label>
                <span className="text-xs font-mono font-bold text-foreground">
                  {targetMargin}% desejado
                </span>
              </div>

              {/* Botões rápidos de margem */}
              <div className="grid grid-cols-4 gap-2">
                {[15, 20, 25, 30].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTargetMargin(m)}
                    className={`py-1.5 text-xs rounded-lg font-medium border transition-colors ${
                      targetMargin === m
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-muted hover:bg-muted/80 text-foreground border-transparent"
                    }`}
                  >
                    {m}%
                  </button>
                ))}
              </div>

              {/* Slider / Display do Preço Sugerido */}
              <div className="bg-muted/30 p-3 rounded-xl border border-border flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    Preço Sugerido para {targetMargin}% líquido:
                  </span>
                  <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    R$ {suggestedPrice.toFixed(2)}
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleApplySuggested}
                  className="h-8 text-xs font-medium"
                >
                  Usar Este
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>

            {/* KPIs Resumo do Preço Atual */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-muted/20 p-3 rounded-xl border border-border/80">
                <span className="text-[11px] text-muted-foreground block font-medium">
                  Lucro Líquido Unitário
                </span>
                <span className={`text-lg font-bold font-mono tabular-nums ${
                  dre.netProfitAmount >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                }`}>
                  R$ {dre.netProfitAmount.toFixed(2)}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Livre no caixa
                </span>
              </div>

              <div className="bg-muted/20 p-3 rounded-xl border border-border/80">
                <span className="text-[11px] text-muted-foreground block font-medium">
                  Preço Mínimo (Zero a Zero)
                </span>
                <span className="text-lg font-bold font-mono tabular-nums text-slate-700 dark:text-slate-300">
                  R$ {dre.breakEvenPrice.toFixed(2)}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Break-even absoluto
                </span>
              </div>
            </div>

            {/* Botão de Ação: Aplicar no Cadastro */}
            <div className="pt-2">
              <Button
                type="button"
                onClick={handleSyncToForm}
                className={`w-full h-11 text-sm font-semibold transition-all ${
                  appliedSuccess
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-blue-900 hover:bg-blue-800 text-white dark:bg-blue-600 dark:hover:bg-blue-500"
                }`}
              >
                {appliedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Preços Aplicados aos Campos do Produto!
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Aplicar Este Preço ao Cadastro
                  </>
                )}
              </Button>
              <p className="text-[11px] text-center text-muted-foreground mt-2">
                Preenche automaticamente o Preço Base e Preço Mínimo na aba Comercial.
              </p>
            </div>
          </div>
        </div>

        {/* Coluna Direita: DRE Unitário e Visualização da Composição (7 colunas) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  DRE Unitário em Tempo Real
                </h4>
                <p className="text-xs text-muted-foreground">
                  Demonstração detalhada de onde cada centavo do cliente vai parar.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground block">Margem de Contribuição</span>
                <span className="text-sm font-bold font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                  {dre.contributionMarginPercent.toFixed(1)}% (R$ {dre.contributionMarginAmount.toFixed(2)})
                </span>
              </div>
            </div>

            {/* Barra Gráfica de Decomposição do Preço (Stacked Bar) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground font-medium">
                <span>Composição de 100% do Preço</span>
                <span className="tabular-nums">Total: R$ {salePrice.toFixed(2)}</span>
              </div>
              
              {/* Barra segmentada */}
              <div className="h-4 w-full rounded-full overflow-hidden flex bg-muted/40 shadow-inner">
                {/* 1. Insumos (Azul) */}
                <div 
                  style={{ width: `${Math.max(0, Math.min(100, (dre.suppliesCost / (salePrice || 1)) * 100))}%` }} 
                  className="bg-blue-600 transition-all duration-300"
                  title={`Insumos: R$ ${dre.suppliesCost.toFixed(2)}`}
                />
                {/* 2. MOD (Sky) */}
                <div 
                  style={{ width: `${Math.max(0, Math.min(100, (dre.laborCost / (salePrice || 1)) * 100))}%` }} 
                  className="bg-sky-400 transition-all duration-300"
                  title={`MOD Fábrica: R$ ${dre.laborCost.toFixed(2)}`}
                />
                {/* 3. Combustível (Amber) */}
                <div 
                  style={{ width: `${Math.max(0, Math.min(100, (dre.fuelCost / (salePrice || 1)) * 100))}%` }} 
                  className="bg-amber-500 transition-all duration-300"
                  title={`Combustível Frota: R$ ${dre.fuelCost.toFixed(2)}`}
                />
                {/* 4. Tráfego Pago & Mkt (Purple) */}
                <div 
                  style={{ width: `${Math.max(0, Math.min(100, (dre.marketingAmount / (salePrice || 1)) * 100))}%` }} 
                  className="bg-purple-600 transition-all duration-300"
                  title={`Tráfego Pago & Marketing: R$ ${dre.marketingAmount.toFixed(2)}`}
                />
                {/* 5. Galpão / Estrutura (Slate) */}
                <div 
                  style={{ width: `${Math.max(0, Math.min(100, (dre.overheadCost / (salePrice || 1)) * 100))}%` }} 
                  className="bg-slate-500 transition-all duration-300"
                  title={`Custo da Empresa Existir: R$ ${dre.overheadCost.toFixed(2)}`}
                />
                {/* 6. Impostos + Cartão + Comissão (Rose) */}
                <div 
                  style={{ width: `${Math.max(0, Math.min(100, ((dre.taxAmount + dre.cardFeeAmount + dre.commissionAmount) / (salePrice || 1)) * 100))}%` }} 
                  className="bg-rose-500 transition-all duration-300"
                  title={`Impostos & Taxas: R$ ${(dre.taxAmount + dre.cardFeeAmount + dre.commissionAmount).toFixed(2)}`}
                />
                {/* 7. Lucro Líquido (Emerald) */}
                {dre.netProfitAmount > 0 && (
                  <div 
                    style={{ width: `${Math.max(0, Math.min(100, (dre.netProfitAmount / (salePrice || 1)) * 100))}%` }} 
                    className="bg-emerald-500 transition-all duration-300"
                    title={`Lucro Líquido: R$ ${dre.netProfitAmount.toFixed(2)}`}
                  />
                )}
              </div>

              {/* Legenda das cores */}
              <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-[11px] text-muted-foreground font-mono">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Insumos
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> MOD
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Combustível
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600" /> Tráfego
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500" /> Galpão
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Impostos/Taxas
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 font-bold text-foreground" /> Lucro
                </span>
              </div>
            </div>

            {/* Linhas Detalhadas do DRE */}
            <div className="space-y-2 text-xs divide-y divide-border/60 pt-2 font-mono">
              
              {/* (+) Preço de Venda */}
              <div className="flex items-center justify-between py-1.5 font-bold text-sm text-foreground">
                <span className="font-sans font-semibold">(+) PREÇO DE VENDA</span>
                <span className="tabular-nums">R$ {salePrice.toFixed(2)} (100%)</span>
              </div>

              {/* (-) Deduções Comerciais e Marketing */}
              <div className="py-2 space-y-1.5 text-muted-foreground">
                <div className="flex justify-between font-sans font-semibold text-xs text-foreground">
                  <span>(-) DEDUÇÕES COMERCIAIS & MARKETING</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400 tabular-nums">
                    - R$ {dre.totalVariableDeductionsAmount.toFixed(2)} ({dre.totalVariableDeductionsPercent.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex justify-between pl-3 text-[11px]">
                  <span>• Imposto Simples Nacional ({taxRatePercent}%)</span>
                  <span className="tabular-nums">- R$ {dre.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pl-3 text-[11px]">
                  <span>• Taxa Maquininha / Antecipação ({cardFeePercent}%)</span>
                  <span className="tabular-nums">- R$ {dre.cardFeeAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pl-3 text-[11px]">
                  <span>• Comissão Vendedores ({commissionPercent}%)</span>
                  <span className="tabular-nums">- R$ {dre.commissionAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pl-3 text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                  <span>• Tráfego Pago & Marketing (Meta + Zai & Leslie)</span>
                  <span className="tabular-nums">- R$ {dre.marketingAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* (-) Custos Diretos de Produção & Logística */}
              <div className="py-2 space-y-1.5 text-muted-foreground">
                <div className="flex justify-between font-sans font-semibold text-xs text-foreground">
                  <span>(-) CUSTOS DIRETOS & LOGÍSTICA</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400 tabular-nums">
                    - R$ {dre.totalDirectCosts.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between pl-3 text-[11px]">
                  <span>• Insumos / Materiais (Ficha Técnica / Estoque)</span>
                  <span className="tabular-nums">- R$ {dre.suppliesCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pl-3 text-[11px]">
                  <span>• Mão de Obra Direta ({productionMinutes} min × R$ {laborMinuteRate.toFixed(2)}/min)</span>
                  <span className="tabular-nums">- R$ {dre.laborCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pl-3 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  <span>• Combustível Frota (Auto Posto rateado por entrega)</span>
                  <span className="tabular-nums">- R$ {dre.fuelCost.toFixed(2)}</span>
                </div>
              </div>

              {/* (=) Margem de Contribuição */}
              <div className="flex items-center justify-between py-2 font-sans font-semibold text-xs text-blue-900 dark:text-blue-300 bg-blue-50/40 dark:bg-blue-950/20 px-2 rounded-lg">
                <span>(=) MARGEM DE CONTRIBUIÇÃO</span>
                <span className="font-mono tabular-nums">
                  R$ {dre.contributionMarginAmount.toFixed(2)} ({dre.contributionMarginPercent.toFixed(1)}%)
                </span>
              </div>

              {/* (-) Custo da Empresa Existir */}
              <div className="py-2 space-y-1 text-muted-foreground">
                <div className="flex justify-between font-sans font-semibold text-xs text-foreground">
                  <span>(-) CUSTO DA EMPRESA EXISTIR (Galpão / Custos Fixos)</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400 tabular-nums">
                    - R$ {dre.overheadCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between pl-3 text-[11px]">
                  <span>• Aluguel, Energia, Água, Internet, Contador, Pró-labore</span>
                  <span className="tabular-nums text-slate-500">
                    Rateio de R$ {financialBaseline.overhead.monthlyTotal.toLocaleString("pt-BR")} / mês
                  </span>
                </div>
              </div>

              {/* (=) Lucro Líquido Real */}
              <div className={`flex items-center justify-between p-3 rounded-xl border mt-2 ${
                dre.netProfitAmount >= 0 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300"
              }`}>
                <div className="font-sans">
                  <span className="font-bold text-sm block">(=) LUCRO LÍQUIDO REAL</span>
                  <span className="text-[11px] opacity-80 block">
                    Sobrando limpo após todas as despesas e impostos
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold font-mono tabular-nums block">
                    R$ {dre.netProfitAmount.toFixed(2)}
                  </span>
                  <span className="text-xs font-semibold font-mono tabular-nums">
                    {dre.netProfitMarginPercent.toFixed(2)}% da venda
                  </span>
                </div>
              </div>

            </div>

            {/* Alerta de Risco caso o Preço esteja abaixo do Break-even */}
            {dre.netProfitAmount < 0 && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl flex items-start gap-2.5 text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block">Atenção: Preço com Prejuízo Operacional</strong>
                  Este produto está gerando prejuízo de R$ {Math.abs(dre.netProfitAmount).toFixed(2)} por unidade. O preço mínimo para cobrir combustível, tráfego, mão de obra e estrutura é de <strong>R$ {dre.breakEvenPrice.toFixed(2)}</strong>.
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
