"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createPurchase(data: {
  supplierId: string
  expectedDate?: string
  notes?: string
  items: {
    supplyItemId: string
    quantity: number
    unit: string
    unitCost: number
    totalCost: number
  }[]
}) {
  const purchase = await prisma.purchaseOrder.create({
    data: {
      number: `PC-${Date.now()}`,
      supplierId: data.supplierId,
      expectedDeliveryDate: data.expectedDate ? new Date(data.expectedDate) : null,
      notes: data.notes,
      totalAmount: data.items.reduce((acc, item) => acc + item.totalCost, 0),
      status: "PENDING",
      items: {
        create: data.items.map(item => ({
          supplyItemId: item.supplyItemId,
          quantityOrdered: item.quantity,
          unit: item.unit,
          unitCost: item.unitCost,
          totalCost: item.totalCost
        }))
      }
    }
  })

  revalidatePath("/estoque-produtos/suprimentos")
  return purchase.id
}

export async function cancelPurchase(purchaseId: string) {
  await prisma.purchaseOrder.update({
    where: { id: purchaseId },
    data: { status: "CANCELLED" }
  })
  revalidatePath("/estoque-produtos/suprimentos")
  revalidatePath(`/estoque-produtos/compras/${purchaseId}`)
}

export async function receivePurchaseItem(purchaseItemId: string, receivedQty: number) {
  const pItem = await prisma.purchaseOrderItem.findUnique({
    where: { id: purchaseItemId },
    include: { supplyItem: true, purchaseOrder: true }
  })

  if (!pItem) throw new Error("Item não encontrado")
  if (pItem.purchaseOrder.status === "CANCELLED") throw new Error("Compra cancelada")
  
  const remaining = pItem.quantityOrdered - pItem.quantityReceived
  if (receivedQty > remaining) throw new Error("Quantidade recebida maior que a pendente")

  // Update item
  await prisma.purchaseOrderItem.update({
    where: { id: purchaseItemId },
    data: {
      quantityReceived: { increment: receivedQty }
    }
  })

  // Recalculate Average Cost
  const currentStock = pItem.supplyItem.currentStock
  const currentAvgCost = pItem.supplyItem.averageCost || 0
  const totalValueExisting = currentStock * currentAvgCost
  const totalValueReceived = receivedQty * pItem.unitCost
  const newStock = currentStock + receivedQty
  const newAvgCost = newStock > 0 ? (totalValueExisting + totalValueReceived) / newStock : pItem.unitCost

  // Update supply item
  await prisma.supplyItem.update({
    where: { id: pItem.supplyItemId },
    data: {
      currentStock: newStock,
      averageCost: newAvgCost,
      lastPurchaseCost: pItem.unitCost,
    }
  })

  // Create Stock Movement
  await prisma.stockMovement.create({
    data: {
      supplyItemId: pItem.supplyItemId,
      movementType: "IN",
      quantity: receivedQty,
      unitCost: pItem.unitCost,
      totalCost: receivedQty * pItem.unitCost,
      referenceType: "PURCHASE",
      referenceId: pItem.purchaseOrderId,
      notes: `Recebimento Ref. PC: ${pItem.purchaseOrder.number}`
    }
  })

  // Update Purchase Status
  const allItems = await prisma.purchaseOrderItem.findMany({ where: { purchaseOrderId: pItem.purchaseOrderId } })
  const allReceived = allItems.every((i: any) => i.quantityReceived >= i.quantityOrdered)
  const someReceived = allItems.some((i: any) => i.quantityReceived > 0)

  await prisma.purchaseOrder.update({
    where: { id: pItem.purchaseOrderId },
    data: {
      status: allReceived ? "RECEIVED" : (someReceived ? "PARTIAL" : "PENDING")
    }
  })

  revalidatePath(`/estoque-produtos/compras/${pItem.purchaseOrderId}`)
  revalidatePath("/estoque-produtos/suprimentos")
}
