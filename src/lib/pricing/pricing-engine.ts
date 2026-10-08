export interface PricingInputParams {
  // 1. Custos Diretos
  suppliesCost: number // R$ Insumos / Materiais (BOM)
  productionMinutes: number // Minutos de chão de fábrica
  laborMinuteRate: number // R$ por minuto da fábrica (MOD)
  fuelCost: number // R$ Combustível por peça/entrega

  // 2. Tráfego Pago / Marketing
  marketingType: "FIXED_BRL" | "PERCENTAGE"
  marketingValue: number // R$ fixo por venda ou % sobre o preço

  // 3. Estrutura / Overhead (Empresa Existir)
  overheadCost: number // R$ Rateio de custos fixos do galpão

  // 4. Encargos Comerciais Variáveis (%)
  taxRatePercent: number // Simples Nacional (%)
  cardFeePercent: number // Taxa maquininha / antecipação (%)
  commissionPercent: number // Comissão de vendas (%)
}

export interface UnitDRE {
  salePrice: number

  // Deduções Variáveis sobre a Venda
  taxAmount: number
  cardFeeAmount: number
  commissionAmount: number
  marketingAmount: number
  totalVariableDeductionsAmount: number
  totalVariableDeductionsPercent: number

  // Custos Diretos
  suppliesCost: number
  laborCost: number
  fuelCost: number
  totalDirectCosts: number

  // Margem de Contribuição
  contributionMarginAmount: number
  contributionMarginPercent: number

  // Custos Fixos de Estrutura
  overheadCost: number

  // Resultado Final
  netProfitAmount: number
  netProfitMarginPercent: number
  markupMultiplier: number

  // Ponto de Equilíbrio
  breakEvenPrice: number
}

/**
 * Calcula o DRE Unitário completo a partir de um Preço de Venda informado
 */
export function calculateDREFromPrice(
  price: number,
  params: PricingInputParams
): UnitDRE {
  const salePrice = Math.max(0, price)

  // 1. Custos Diretos
  const suppliesCost = Math.max(0, params.suppliesCost || 0)
  const laborCost = Math.max(0, (params.productionMinutes || 0) * (params.laborMinuteRate || 0))
  const fuelCost = Math.max(0, params.fuelCost || 0)
  const totalDirectCosts = suppliesCost + laborCost + fuelCost

  // 2. Custos Fixos de Estrutura
  const overheadCost = Math.max(0, params.overheadCost || 0)

  // 3. Deduções Variáveis (%)
  const taxRate = Math.max(0, params.taxRatePercent || 0) / 100
  const cardFeeRate = Math.max(0, params.cardFeePercent || 0) / 100
  const commRate = Math.max(0, params.commissionPercent || 0) / 100

  const taxAmount = salePrice * taxRate
  const cardFeeAmount = salePrice * cardFeeRate
  const commissionAmount = salePrice * commRate

  // Tráfego Pago (em R$ ou em %)
  let marketingAmount = 0
  let marketingPercentOfPrice = 0
  if (params.marketingType === "PERCENTAGE") {
    const mktRate = Math.max(0, params.marketingValue || 0) / 100
    marketingAmount = salePrice * mktRate
    marketingPercentOfPrice = mktRate * 100
  } else {
    marketingAmount = Math.max(0, params.marketingValue || 0)
    marketingPercentOfPrice = salePrice > 0 ? (marketingAmount / salePrice) * 100 : 0
  }

  const totalVariableDeductionsAmount = taxAmount + cardFeeAmount + commissionAmount + (params.marketingType === "PERCENTAGE" ? marketingAmount : 0)
  const totalVariableDeductionsPercent = (taxRate + cardFeeRate + commRate + (params.marketingType === "PERCENTAGE" ? (params.marketingValue / 100) : 0)) * 100

  // Margem de Contribuição = Preço - Deduções Comerciais - Custos Diretos - Tráfego se Fixo
  const variableAndDirectExpenses = totalVariableDeductionsAmount + totalDirectCosts + (params.marketingType === "FIXED_BRL" ? marketingAmount : 0)
  const contributionMarginAmount = salePrice - variableAndDirectExpenses
  const contributionMarginPercent = salePrice > 0 ? (contributionMarginAmount / salePrice) * 100 : 0

  // Lucro Líquido = Margem de Contribuição - Custos Fixos de Estrutura
  const netProfitAmount = contributionMarginAmount - overheadCost
  const netProfitMarginPercent = salePrice > 0 ? (netProfitAmount / salePrice) * 100 : 0

  // Base de Custos Totais para Markup
  const totalBaseCost = totalDirectCosts + overheadCost + (params.marketingType === "FIXED_BRL" ? marketingAmount : 0)
  const markupMultiplier = totalBaseCost > 0 ? salePrice / totalBaseCost : 1

  // Ponto de Equilíbrio (Break-even): Preço onde Net Profit = 0
  // Lucro = 0 => Preço * (1 - soma_taxas_perc) = totalBaseCost
  const percentRateSum = (params.taxRatePercent + params.cardFeePercent + params.commissionPercent + (params.marketingType === "PERCENTAGE" ? params.marketingValue : 0)) / 100
  const breakEvenPrice = percentRateSum < 1 ? totalBaseCost / (1 - percentRateSum) : totalBaseCost

  return {
    salePrice,
    taxAmount: Number(taxAmount.toFixed(2)),
    cardFeeAmount: Number(cardFeeAmount.toFixed(2)),
    commissionAmount: Number(commissionAmount.toFixed(2)),
    marketingAmount: Number(marketingAmount.toFixed(2)),
    totalVariableDeductionsAmount: Number(totalVariableDeductionsAmount.toFixed(2)),
    totalVariableDeductionsPercent: Number(totalVariableDeductionsPercent.toFixed(2)),
    suppliesCost: Number(suppliesCost.toFixed(2)),
    laborCost: Number(laborCost.toFixed(2)),
    fuelCost: Number(fuelCost.toFixed(2)),
    totalDirectCosts: Number(totalDirectCosts.toFixed(2)),
    contributionMarginAmount: Number(contributionMarginAmount.toFixed(2)),
    contributionMarginPercent: Number(contributionMarginPercent.toFixed(2)),
    overheadCost: Number(overheadCost.toFixed(2)),
    netProfitAmount: Number(netProfitAmount.toFixed(2)),
    netProfitMarginPercent: Number(netProfitMarginPercent.toFixed(2)),
    markupMultiplier: Number(markupMultiplier.toFixed(2)),
    breakEvenPrice: Number(breakEvenPrice.toFixed(2))
  }
}

/**
 * Calcula o Preço de Venda Sugerido para atingir uma Margem Líquida Desejada (%)
 */
export function calculatePriceFromDesiredMargin(
  desiredMarginPercent: number,
  params: PricingInputParams
): number {
  // 1. Custos em Reais (Insumos + Mão de Obra + Combustível + Estrutura + Tráfego se Fixo)
  const suppliesCost = Math.max(0, params.suppliesCost || 0)
  const laborCost = Math.max(0, (params.productionMinutes || 0) * (params.laborMinuteRate || 0))
  const fuelCost = Math.max(0, params.fuelCost || 0)
  const overheadCost = Math.max(0, params.overheadCost || 0)
  const marketingFixed = params.marketingType === "FIXED_BRL" ? Math.max(0, params.marketingValue || 0) : 0

  const fixedAndDirectBRL = suppliesCost + laborCost + fuelCost + overheadCost + marketingFixed

  // 2. Soma de todas as deduções percentuais + Margem Desejada
  const marketingPercent = params.marketingType === "PERCENTAGE" ? Math.max(0, params.marketingValue || 0) : 0
  const totalDeductionsPercent = (params.taxRatePercent || 0) + (params.cardFeePercent || 0) + (params.commissionPercent || 0) + marketingPercent
  const targetMargin = Math.max(0, desiredMarginPercent || 0)

  const denominator = 1 - (totalDeductionsPercent + targetMargin) / 100

  if (denominator <= 0.05) {
    // Evita divisão por zero ou negativa se as margens somarem mais de 95%
    return Number((fixedAndDirectBRL * 3.5).toFixed(2))
  }

  const suggestedPrice = fixedAndDirectBRL / denominator
  return Number(suggestedPrice.toFixed(2))
}
