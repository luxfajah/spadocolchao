import { prisma } from "../src/lib/prisma"
import { getPricingFinancialBaseline } from "../src/lib/pricing/financial-baseline"
import { calculatePriceFromDesiredMargin, calculateDREFromPrice } from "../src/lib/pricing/pricing-engine"

function roundCommercial(val: number): number {
  // Arredonda para valores comerciais limpos terminando em .90 ou .00 ou .50 (ex: 1300, 1450, 1590, 1990)
  const tens = Math.round(val / 10) * 10
  if (tens >= 500) {
    const remainder = tens % 100
    if (remainder >= 65) {
      return Math.floor(tens / 100) * 100 + 90
    }
    if (remainder >= 35 && remainder < 65) {
      return Math.floor(tens / 100) * 100 + 50
    }
    return Math.floor(tens / 100) * 100
  }
  return tens
}

async function applyThirtyPercentMarginToAllProducts() {
  console.log("================================================================================")
  console.log("INICIANDO ATUALIZAÇÃO GERAL: FIXANDO 30% DE MARGEM LÍQUIDA EM TODOS OS PRODUTOS")
  console.log("================================================================================")

  const baseline = await getPricingFinancialBaseline()
  console.log("\nBalizadores do Setor Financeiro:")
  console.log(`• Taxa do minuto MOD Fábrica: R$ ${baseline.productionMOD.minuteRate.toFixed(2)}/min`)
  console.log(`• Combustível Frota Auto Posto: R$ ${baseline.fuel.costPerPiece.toFixed(2)} (novos) / R$ 75.00 (reformas)`)
  console.log(`• Tráfego Pago CAC (Meta + Zai & Leslie): R$ ${baseline.marketing.costPerSaleCAC.toFixed(2)} / venda`)
  console.log(`• Galpão/Fixos: R$ ${baseline.overhead.costPerPieceCapacity1320.toFixed(2)} (novos) / R$ ${baseline.overhead.costPerPieceCapacity330.toFixed(2)} (reformas)`)
  console.log(`• Deduções Comerciais: 12,5% (Simples 6% + Maquininha 3,5% + Comissão 3%)\n`)

  const products = await prisma.productService.findMany({
    where: { isActive: true },
    include: {
      recipes: {
        include: {
          items: {
            include: { supplyItem: true }
          }
        }
      }
    },
    orderBy: [
      { operationalCategory: "asc" },
      { name: "asc" }
    ]
  })

  console.log(`Total de produtos ativos a atualizar: ${products.length}\n`)

  let count = 0
  const summary: any[] = []

  for (const product of products) {
    const isReforma = (product.operationalCategory || "").toLowerCase().includes("reforma") || product.name.toLowerCase().includes("reforma")
    const isBox = (product.operationalCategory || "").toLowerCase().includes("box") || product.name.toLowerCase().includes("box")
    const isConjunto = (product.operationalCategory || "").toLowerCase().includes("conjunto") || product.name.toLowerCase().includes("conjunto")
    const isMagnus = product.name.toLowerCase().includes("magnus")
    const isBau = product.name.toLowerCase().includes("baú") || product.name.toLowerCase().includes("bau")

    // 1. Custo de Insumos da Ficha Técnica (BOM)
    let suppliesCost = 0
    let estimatedMinutes = 35

    const defaultRecipe = product.recipes[0]
    if (defaultRecipe && defaultRecipe.items.length > 0) {
      suppliesCost = defaultRecipe.items.reduce((sum, item) => {
        const cost = item.supplyItem?.averageCost || item.supplyItem?.lastPurchaseCost || 0
        const wasteFactor = 1 + ((item.wastePercentage || 0) / 100)
        return sum + (item.baseQuantity * (item.multiplier || 1) * cost * wasteFactor)
      }, 0)
    } else {
      suppliesCost = product.defaultCost || 120
    }

    // 2. Tempo de Produção Realista de Chão de Fábrica (minutos de MOD)
    if (isConjunto) {
      estimatedMinutes = 85 // Reforma completa de conjunto (colchão + box)
    } else if (isReforma && isBox) {
      estimatedMinutes = 30 // Retapeçaria de box
    } else if (isReforma) {
      estimatedMinutes = 60 // Reforma completa de colchão
    } else if (isMagnus) {
      estimatedMinutes = 55 // Montagem magnética / vibromassagem
    } else if (isBau) {
      estimatedMinutes = 45 // Montagem de baú c/ pistões
    } else if (isBox) {
      estimatedMinutes = 25 // Montagem box MDF
    } else {
      estimatedMinutes = 40 // Colchão novo
    }

    // 3. Custos Diretos e Indiretos
    const fuelCost = isReforma ? 75.0 : 62.50
    const marketingValue = 60.0
    const overheadCost = isReforma 
      ? baseline.overhead.costPerPieceCapacity330 
      : baseline.overhead.costPerPieceCapacity1320

    // 4. Parâmetros de Precificação com Margem Alvo FIXADA EM 30%
    const TARGET_MARGIN = 30.0

    const pricingParams = {
      suppliesCost: Number(suppliesCost.toFixed(2)),
      productionMinutes: estimatedMinutes,
      laborMinuteRate: baseline.productionMOD.minuteRate,
      fuelCost,
      marketingType: "FIXED_BRL" as const,
      marketingValue,
      overheadCost,
      taxRatePercent: 6.0,
      cardFeePercent: 3.5,
      commissionPercent: 3.0
    }

    // Preço Calculado com 30% de Margem Líquida
    const calculatedPrice = calculatePriceFromDesiredMargin(TARGET_MARGIN, pricingParams)
    const basePrice = roundCommercial(calculatedPrice)
    const dre = calculateDREFromPrice(basePrice, pricingParams)

    // Preço Mínimo Autorizado (Cobre custos totais + break-even com 8% margem de segurança)
    const minimumPrice = roundCommercial(dre.breakEvenPrice * 1.08)
    const estimatedLaborCost = Number(dre.laborCost.toFixed(2))
    const defaultCost = Number((suppliesCost + dre.laborCost).toFixed(2))

    // Atualiza no banco de dados
    await prisma.productService.update({
      where: { id: product.id },
      data: {
        defaultPrice: basePrice,
        minimumPrice,
        defaultCost,
        productionTimeMinutes: estimatedMinutes,
        estimatedLaborCost,
        allowPriceChangeInPDV: true,
        requirePriceChangeJustification: true
      }
    })

    if (defaultRecipe) {
      await prisma.productRecipe.update({
        where: { id: defaultRecipe.id },
        data: {
          estimatedProductionMinutes: estimatedMinutes,
          estimatedLaborCost
        }
      })
    }

    count++
    summary.push({
      num: count,
      name: product.name,
      cat: product.operationalCategory,
      oldPrice: `R$ ${product.defaultPrice?.toFixed(2) || '0.00'}`,
      newPrice: `R$ ${basePrice.toFixed(2)}`,
      minPrice: `R$ ${minimumPrice.toFixed(2)}`,
      netProfit: `R$ ${dre.netProfitAmount.toFixed(2)}`,
      margin: `${dre.netProfitMarginPercent.toFixed(1)}%`,
      markup: `${dre.markupMultiplier.toFixed(2)}x`
    })

    console.log(`[${String(count).padStart(2, '0')}/${products.length}] ${product.name}`)
    console.log(`     ↳ Novo Preço: R$ ${basePrice.toFixed(2)} | Mínimo: R$ ${minimumPrice.toFixed(2)} | Lucro Líquido: R$ ${dre.netProfitAmount.toFixed(2)} (${dre.netProfitMarginPercent.toFixed(1)}% limpo)`)
  }

  console.log("\n================================================================================")
  console.log(`SUCESSO: TODOS OS ${count} PRODUTOS ATUALIZADOS PARA 30% DE MARGEM LÍQUIDA NO PDV!`)
  console.log("================================================================================")
}

applyThirtyPercentMarginToAllProducts()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Erro ao aplicar 30% de margem:", err)
    process.exit(1)
  })
