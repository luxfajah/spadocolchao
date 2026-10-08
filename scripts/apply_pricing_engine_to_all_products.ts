import { prisma } from "../src/lib/prisma"
import { getPricingFinancialBaseline } from "../src/lib/pricing/financial-baseline"
import { calculatePriceFromDesiredMargin, calculateDREFromPrice } from "../src/lib/pricing/pricing-engine"

function roundCommercial(val: number): number {
  // Arredonda para valores comerciais terminando em .90 ou .00 (ex: 1890, 2290, 990, 790)
  const tens = Math.round(val / 10) * 10
  if (tens >= 500) {
    // Se estiver a menos de 40 de terminar em 90, arredonda para 90 (ex: 1870 -> 1890, 1850 -> 1850 ou 1890)
    const remainder = tens % 100
    if (remainder >= 60) {
      return Math.floor(tens / 100) * 100 + 90
    }
    if (remainder >= 30 && remainder < 60) {
      return Math.floor(tens / 100) * 100 + 50
    }
    return Math.floor(tens / 100) * 100
  }
  return tens
}

async function updateAllProducts() {
  console.log("Iniciando recalculo de precificação para todos os produtos ativos...")
  const baseline = await getPricingFinancialBaseline()
  console.log("Métricas financeiras base:", {
    minuteRate: baseline.productionMOD.minuteRate,
    fuelPerPiece: baseline.fuel.costPerPiece,
    fuelPerSale: baseline.fuel.costPerSale,
    marketingCAC: baseline.marketing.costPerSaleCAC,
    overheadCap330: baseline.overhead.costPerPieceCapacity330,
    overheadCap1320: baseline.overhead.costPerPieceCapacity1320
  })

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
    }
  })

  console.log(`Encontrados ${products.length} produtos ativos para atualizar.`)

  let updatedCount = 0

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

    // 2. Tempo Realista de Chão de Fábrica (minutos de mão de obra direta)
    if (isConjunto) {
      estimatedMinutes = 85 // Desmontagem, nova espuma, matelassê, retapeçaria de box e colchão
    } else if (isReforma && isBox) {
      estimatedMinutes = 30 // Retapeçaria e reforço estrutural de box
    } else if (isReforma) {
      estimatedMinutes = 60 // Reforma completa de colchão
    } else if (isMagnus) {
      estimatedMinutes = 55 // Instalação de kit vibromassagem, ímãs e fechamento
    } else if (isBau) {
      estimatedMinutes = 45 // Montagem de baú c/ pistões a gás e tapeçaria veludo
    } else if (isBox) {
      estimatedMinutes = 25 // Armação em MDF e tapeçaria
    } else {
      estimatedMinutes = 40 // Colchão novo (corte, colagem de espuma e fechamento fitilho)
    }

    // 3. Custos Diretos & Indiretos do Motor Financeiro
    const fuelCost = isReforma ? 75.0 : 62.50 // Auto Posto (coleta + entrega para reformas, entrega para novos)
    const marketingValue = 60.0 // Meta Ads + Ozaila (R$ 2.200) + Leslie (R$ 3.000)
    const overheadCost = isReforma 
      ? baseline.overhead.costPerPieceCapacity330 // R$ 159.06 (rateio na capacidade de 330 reformas/mês)
      : baseline.overhead.costPerPieceCapacity1320 // R$ 39.77 (rateio na capacidade de 1.320 novos/mês)

    // Margem Líquida Alvo (23% a 26% líquida no bolso da empresa)
    const targetMargin = isReforma ? 24.0 : 26.0

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

    const calculatedPrice = calculatePriceFromDesiredMargin(targetMargin, pricingParams)
    const basePrice = roundCommercial(calculatedPrice)
    const dre = calculateDREFromPrice(basePrice, pricingParams)

    // Preço Mínimo Autorizado (Break-even + 8% de segurança)
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

    // Se tiver receita vinculada, atualiza também os minutos e custo de mão de obra da ficha técnica
    if (defaultRecipe) {
      await prisma.productRecipe.update({
        where: { id: defaultRecipe.id },
        data: {
          estimatedProductionMinutes: estimatedMinutes,
          estimatedLaborCost
        }
      })
    }

    updatedCount++
    console.log(`[${updatedCount}/${products.length}] ${product.name}: Preço Base R$ ${basePrice.toFixed(2)} | Min R$ ${minimumPrice.toFixed(2)} | Lucro R$ ${dre.netProfitAmount.toFixed(2)} (${dre.netProfitMarginPercent.toFixed(1)}%)`)
  }

  console.log(`\nSucesso! Todos os ${updatedCount} produtos foram atualizados com a lógica do motor de precificação.`)
}

updateAllProducts()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Erro ao atualizar produtos:", err)
    process.exit(1)
  })
