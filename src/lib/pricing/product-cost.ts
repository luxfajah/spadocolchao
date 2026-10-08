import { prisma } from "@/lib/prisma"

export interface ProductRecipeCostDetail {
  recipeId: string
  recipeName: string
  totalSuppliesCost: number
  estimatedMinutes: number
  items: Array<{
    supplyName: string
    unit: string
    quantity: number
    unitCost: number
    wastePercentage: number
    totalItemCost: number
  }>
}

/**
 * Busca a ficha técnica do produto e calcula o custo exato dos insumos
 */
export async function getProductTechnicalSheetCost(productServiceId: string): Promise<ProductRecipeCostDetail | null> {
  try {
    const defaultRecipe = await prisma.productRecipe.findFirst({
      where: {
        productServiceId,
        isActive: true
      },
      orderBy: { isDefault: "desc" },
      include: {
        items: {
          include: {
            supplyItem: true
          }
        }
      }
    })

    if (!defaultRecipe) return null

    let totalSuppliesCost = 0
    const items = defaultRecipe.items.map(item => {
      const unitCost = item.supplyItem?.averageCost || item.supplyItem?.lastPurchaseCost || 0
      const wasteFactor = 1 + ((item.wastePercentage || 0) / 100)
      const totalItemCost = (item.baseQuantity || 0) * (item.multiplier || 1) * unitCost * wasteFactor
      totalSuppliesCost += totalItemCost

      return {
        supplyName: item.supplyItem?.name || "Insumo",
        unit: item.unit || item.supplyItem?.unit || "UN",
        quantity: (item.baseQuantity || 0) * (item.multiplier || 1),
        unitCost: Number(unitCost.toFixed(2)),
        wastePercentage: item.wastePercentage || 0,
        totalItemCost: Number(totalItemCost.toFixed(2))
      }
    })

    return {
      recipeId: defaultRecipe.id,
      recipeName: defaultRecipe.name,
      totalSuppliesCost: Number(totalSuppliesCost.toFixed(2)),
      estimatedMinutes: defaultRecipe.estimatedProductionMinutes || 0,
      items
    }
  } catch (err) {
    console.error("Erro ao calcular custo da ficha técnica:", err)
    return null
  }
}
