"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function duplicateFicha(id: string) {
  try {
    const existing = await prisma.productRecipe.findUnique({
      where: { id },
      include: {
        items: {
          include: { rules: true }
        }
      }
    })

    if (!existing) {
      return { success: false, error: "Ficha não encontrada" }
    }

    const { id: _, createdAt, updatedAt, items, ...fields } = existing

    const duplicated = await prisma.productRecipe.create({
      data: {
        ...fields,
        name: `${fields.name} (Cópia)`,
        isDefault: false,
        items: {
          create: items.map((item: any) => ({
            supplyItemId: item.supplyItemId,
            componentPart: item.componentPart,
            baseQuantity: item.baseQuantity,
            unit: item.unit,
            multiplier: item.multiplier,
            wastePercentage: item.wastePercentage,
            displayOrder: item.displayOrder,
            notes: item.notes,
            rules: {
              create: item.rules.map((rule: any) => ({
                ruleType: rule.ruleType,
                conditionValue: rule.conditionValue,
                computedQuantity: rule.computedQuantity,
                multiplier: rule.multiplier
              }))
            }
          }))
        }
      }
    })

    revalidatePath("/estoque-produtos/ficha-tecnica")
    return { success: true, data: duplicated }
  } catch (error) {
    console.error("Erro ao duplicar ficha", error)
    return { success: false, error: "Falha ao duplicar ficha" }
  }
}

export async function toggleFichaStatus(id: string, isActive: boolean) {
  try {
    await prisma.productRecipe.update({
      where: { id },
      data: { isActive }
    })
    revalidatePath("/estoque-produtos/ficha-tecnica")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Falha ao alterar status" }
  }
}

export async function setFichaDefault(id: string, productServiceId: string) {
  try {
    await prisma.$transaction(async (tx) => {
      // Remove default from all other recipes for this product
      await tx.productRecipe.updateMany({
        where: { productServiceId },
        data: { isDefault: false }
      })

      // Set default for this recipe
      await tx.productRecipe.update({
        where: { id },
        data: { isDefault: true }
      })
    })
    
    revalidatePath("/estoque-produtos/ficha-tecnica")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Falha ao definir como padrão" }
  }
}

export async function deleteFicha(id: string) {
  try {
    await prisma.productRecipe.delete({
      where: { id }
    })
    revalidatePath("/estoque-produtos/ficha-tecnica")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Falha ao excluir ficha" }
  }
}

export async function saveFichaTecnica(data: any) {
  try {
    const { id, items, ...fields } = data

    if (id) {
      // Update logic
      const updated = await prisma.productRecipe.update({
        where: { id },
        data: {
          ...fields,
          items: {
            deleteMany: {}, // Clear old items
            create: items.map((item: any) => ({
              supplyItemId: item.supplyItemId,
              componentPart: item.componentPart,
              baseQuantity: Number(item.baseQuantity),
              unit: item.unit || null,
              multiplier: Number(item.multiplier || 1),
              wastePercentage: Number(item.wastePercentage || 0),
              displayOrder: Number(item.displayOrder || 0),
              notes: item.notes || null,
              rules: {
                create: item.rules?.map((rule: any) => ({
                  ruleType: rule.ruleType,
                  conditionValue: rule.conditionValue,
                  computedQuantity: rule.computedQuantity ? Number(rule.computedQuantity) : null,
                  multiplier: rule.multiplier ? Number(rule.multiplier) : null
                })) || []
              }
            }))
          }
        }
      })
      revalidatePath("/estoque-produtos/ficha-tecnica")
      return { success: true, data: updated }
    } else {
      // Create logic
      const created = await prisma.productRecipe.create({
        data: {
          ...fields,
          items: {
            create: items.map((item: any) => ({
              supplyItemId: item.supplyItemId,
              componentPart: item.componentPart,
              baseQuantity: Number(item.baseQuantity),
              unit: item.unit || null,
              multiplier: Number(item.multiplier || 1),
              wastePercentage: Number(item.wastePercentage || 0),
              displayOrder: Number(item.displayOrder || 0),
              notes: item.notes || null,
              rules: {
                create: item.rules?.map((rule: any) => ({
                  ruleType: rule.ruleType,
                  conditionValue: rule.conditionValue,
                  computedQuantity: rule.computedQuantity ? Number(rule.computedQuantity) : null,
                  multiplier: rule.multiplier ? Number(rule.multiplier) : null
                })) || []
              }
            }))
          }
        }
      })
      revalidatePath("/estoque-produtos/ficha-tecnica")
      return { success: true, data: created }
    }
  } catch (error) {
    console.error("Error saving Ficha Tecnica", error)
    return { success: false, error: "Falha ao salvar a ficha técnica. Verifique os dados." }
  }
}
