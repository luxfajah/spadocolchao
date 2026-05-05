"use server"

import { Prisma } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { getUser } from "@/app/login/actions"
import { getUserAccessProfile } from "@/lib/access-control"
import { approveSaleCommissions } from "@/lib/commission-engine"
import { canUserPerformTransition, OrderStatus } from "@/lib/order-flow"
import { prisma } from "@/lib/prisma"

const DEFAULT_ACCOUNT_ID = "acc_santander"
const DEFAULT_CATEGORY_ID = "cmncocgiw0000kkw65f7hytmo"

export async function ensureOrderFinancialSync(
  orderId: string,
  tx: Prisma.TransactionClient,
  customDate?: Date,
  userId?: string,
  forceAmount?: number // Novo parâmetro opcional
) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: {
      sale: {
        include: {
          customer: true
        }
      }
    }
  })

  if (!order || !order.sale) return

  const sale = order.sale
  
  // Se forceAmount for passado, usamos ele. Senão, usamos o saldo pendente.
  const amountToRecord = forceAmount !== undefined ? forceAmount : (sale.totalAmount - sale.paidAmount)

  // Se não há nada para registrar e não é um force, apenas sincronizamos o status
  const shouldSkipTransaction = amountToRecord <= 0 && forceAmount === undefined;

  const transactionDate = customDate || new Date()

  // 1. Criar Transação Financeira (se houver valor)
  let transactionId = null
  if (amountToRecord > 0) {
    const transaction = await tx.financialTransaction.create({
      data: {
        type: "ENTRY",
        amount: amountToRecord,
        transactionDate,
        description: `Recebimento Pedido #${order.code || '---'} - ${sale.customer.fullName}`,
        status: "CONFIRMED",
        financialAccountId: DEFAULT_ACCOUNT_ID,
        financialCategoryId: DEFAULT_CATEGORY_ID,
        performedById: userId
      }
    })
    transactionId = transaction.id

    // 2. Atualizar Saldo da Conta
    await tx.financialAccount.update({
      where: { id: DEFAULT_ACCOUNT_ID },
      data: {
        currentBalance: { increment: amountToRecord }
      }
    })
  }

  // 3. Tentar encontrar Conta a Receber vinculada ou criar uma
  let receivable = await tx.accountReceivable.findFirst({
    where: { saleId: sale.id }
  })

  if (!receivable) {
    receivable = await tx.accountReceivable.create({
      data: {
        saleId: sale.id,
        customerId: sale.customerId,
        description: `Saldo Pedido #${order.code || '---'}`,
        amount: sale.totalAmount,
        paidAmount: sale.paidAmount,
        dueDate: transactionDate,
        status: "PENDING",
        financialCategoryId: DEFAULT_CATEGORY_ID,
        financialAccountId: DEFAULT_ACCOUNT_ID
      }
    })
  }

  // 4. Se houvar transação, vincular ao título
  if (transactionId && amountToRecord > 0) {
    const currentReceivablePaid = receivable.paidAmount || 0
    const newReceivablePaidAmount = currentReceivablePaid + amountToRecord
    
    await tx.accountReceivable.update({
      where: { id: receivable.id },
      data: {
        paidAmount: newReceivablePaidAmount,
        status: newReceivablePaidAmount >= receivable.amount ? "RECEIVED" : "PARTIALLY_RECEIVED",
        receivedDate: transactionDate,
        financialAccountId: DEFAULT_ACCOUNT_ID
      }
    })

    await tx.paymentAllocation.create({
      data: {
        transactionId: transactionId,
        accountReceivableId: receivable.id,
        amountAllocated: amountToRecord
      }
    })
  } else if (receivable.status !== "RECEIVED" && sale.paidAmount >= sale.totalAmount) {
     // Garantir que se a venda está paga, o título também esteja
     await tx.accountReceivable.update({
      where: { id: receivable.id },
      data: {
        paidAmount: sale.totalAmount,
        status: "RECEIVED",
        receivedDate: transactionDate,
        financialAccountId: DEFAULT_ACCOUNT_ID
      }
    })
  }

  // 5. Garantir consistência da Venda e Pedido
  if (sale.financialStatus !== "PAID" || sale.paidAmount < sale.totalAmount) {
     await tx.sale.update({
        where: { id: sale.id },
        data: {
          paidAmount: sale.totalAmount,
          financialStatus: "PAID"
        }
      })
  }

  if (!order.paidAt) {
    await tx.order.update({
      where: { id: order.id },
      data: {
        paidAt: transactionDate
      }
    })
  }
}

function buildOrderStatusTimelineData(
  order: {
    productionStartedAt?: Date | null
    readyForDeliveryAt?: Date | null
    cancelledAt?: Date | null
    cancelledById?: string | null
  },
  toStatus: OrderStatus,
  userId: string,
) {
  const now = new Date()
  const data: Record<string, Date | string | null> = {
    currentStatus: toStatus,
  }

  if (toStatus === "IN_PRODUCTION" && !order.productionStartedAt) {
    data.productionStartedAt = now
  }

  if (toStatus === "WAITING_DELIVERY" && !order.readyForDeliveryAt) {
    data.readyForDeliveryAt = now
  }

  if (toStatus === "CANCELLED") {
    data.cancelledAt = now
    data.cancelledById = userId
  }

  if (toStatus === "SOLD") {
    data.cancelledAt = null
    data.cancelledById = null
  }

  return data
}

async function consumeOrderProductionStock(orderId: string, tx: Prisma.TransactionClient) {
  const existingConsumption = await tx.stockMovement.findFirst({
    where: {
      referenceType: "ORDER_PRODUCTION",
      referenceId: orderId,
      movementType: "EXIT",
    },
    select: { id: true },
  })

  if (existingConsumption) {
    return { consumed: false, count: 0 }
  }

  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: {
      code: true,
      sale: {
        select: {
          items: {
            select: {
              id: true,
              materialRequirements: {
                select: {
                  supplyItemId: true,
                  quantityCalculated: true,
                  unitCostSnapshot: true,
                  totalCostSnapshot: true,
                  part: true,
                },
              },
            },
          },
        },
      },
    },
  })

  const requirements =
    order?.sale.items.flatMap((item) =>
      item.materialRequirements.map((requirement) => ({
        ...requirement,
        saleItemId: item.id,
      })),
    ) || []

  if (requirements.length === 0) {
    return { consumed: false, count: 0 }
  }

  const totalsBySupplyItem = new Map<
    string,
    { quantity: number; unitCost: number; totalCost: number; parts: Set<string> }
  >()

  for (const requirement of requirements) {
    const current = totalsBySupplyItem.get(requirement.supplyItemId) || {
      quantity: 0,
      unitCost: requirement.unitCostSnapshot || 0,
      totalCost: 0,
      parts: new Set<string>(),
    }

    current.quantity += requirement.quantityCalculated
    current.totalCost += requirement.totalCostSnapshot || 0
    current.parts.add(requirement.part)
    totalsBySupplyItem.set(requirement.supplyItemId, current)
  }

  for (const [supplyItemId, total] of Array.from(totalsBySupplyItem.entries())) {
    await tx.supplyItem.update({
      where: { id: supplyItemId },
      data: {
        currentStock: { decrement: total.quantity },
      },
    })

    await tx.stockMovement.create({
      data: {
        supplyItemId,
        movementType: "EXIT",
        quantity: total.quantity,
        unitCost: total.unitCost,
        totalCost: total.totalCost,
        referenceType: "ORDER_PRODUCTION",
        referenceId: orderId,
        notes: `Baixa por producao do pedido #${order?.code || "---"}: ${Array.from(total.parts).join(", ")}`,
      },
    })
  }

  return { consumed: true, count: totalsBySupplyItem.size }
}

async function requireOrderActor() {
  const user = await getUser()

  if (!user) {
    return { error: "Usuário não autenticado." as const }
  }

  const accessProfile = await getUserAccessProfile(user)

  if (!accessProfile.orderFlowRole) {
    return { error: "Seu perfil não tem permissão para movimentar o kanban." as const }
  }

  return {
    user,
    accessProfile,
    orderFlowRole: accessProfile.orderFlowRole,
  }
}

export async function updateOrderStatus(orderId: string, toStatus: OrderStatus, notes?: string) {
  try {
    const actorState = await requireOrderActor()
    if ("error" in actorState) {
      return { error: actorState.error }
    }

    const { user, orderFlowRole } = actorState

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        saleId: true,
        currentStatus: true,
        productionStartedAt: true,
        readyForDeliveryAt: true,
      },
    })

    if (!order) {
      return { error: "Pedido não encontrado." }
    }

    const fromStatus = order.currentStatus as OrderStatus
    const transition = canUserPerformTransition(orderFlowRole, fromStatus, toStatus)

    if (!transition.allowed) {
      return { error: transition.reason || "Transição não permitida." }
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: buildOrderStatusTimelineData(order, toStatus, user.id),
      })

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus,
          toStatus,
          notes,
          transitionSource: "KANBAN",
          changedById: user.id,
        },
      })

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "UPDATE_STATUS",
          entity: "ORDER",
          entityId: orderId,
          details: `Transição de ${fromStatus} para ${toStatus}`,
        },
      })

      if (toStatus === "IN_PRODUCTION") {
        await consumeOrderProductionStock(orderId, tx)
      }

    })

    revalidatePath("/vendas-clientes/kanban")
    revalidatePath("/vendas-clientes/pedidos")
    revalidatePath(`/vendas-clientes/pedidos/${orderId}`)

    return { success: true }
  } catch (error) {
    console.error("Erro ao atualizar status:", error)
    return { error: "Erro interno ao processar a transição." }
  }
}

export async function recordOrderDelivery(
  orderId: string,
  deliveryData: {
    recipientName: string
    recipientPhone: string
    driverId?: string
    notes?: string
  },
) {
  try {
    const actorState = await requireOrderActor()
    if ("error" in actorState) {
      return { error: actorState.error }
    }

    const { user, accessProfile, orderFlowRole } = actorState

    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { currentStatus: true, saleId: true },
    })

    if (!currentOrder) {
      return { error: "Pedido não encontrado." }
    }

    const deliveryTransition = canUserPerformTransition(
      orderFlowRole,
      currentOrder.currentStatus as OrderStatus,
      "DELIVERED",
    )

    if (!deliveryTransition.allowed) {
      return { error: deliveryTransition.reason || "Seu perfil não pode confirmar esta entrega." }
    }

    await prisma.$transaction(async (tx) => {
      const existingDelivery = await tx.orderDelivery.findFirst({ where: { orderId } })
      if (existingDelivery) {
        await tx.orderDelivery.update({
          where: { id: existingDelivery.id },
          data: {
            recipientName: deliveryData.recipientName,
            recipientPhone: deliveryData.recipientPhone,
            status: "DELIVERED",
            deliveredAt: new Date(),
            notes: deliveryData.notes,
          },
        })
      } else {
        await tx.orderDelivery.create({
          data: {
            orderId,
            recipientName: deliveryData.recipientName,
            recipientPhone: deliveryData.recipientPhone,
            status: "DELIVERED",
            deliveredAt: new Date(),
            notes: deliveryData.notes,
          },
        })
      }

      const order = await tx.order.findUnique({ where: { id: orderId } })
      if (order) {
        const deliveredAt = new Date()

        await tx.order.update({
          where: { id: orderId },
          data: {
            currentStatus: "DELIVERED",
            deliveredAt,
            recipientName: deliveryData.recipientName,
            recipientPhone: deliveryData.recipientPhone,
          },
        })

        await tx.orderStatusHistory.create({
          data: {
            orderId,
            fromStatus: order.currentStatus,
            toStatus: "DELIVERED",
            notes: "Entrega registrada via modal.",
            transitionSource: "KANBAN",
            changedById: user.id,
          },
        })

      }
    })

    await approveSaleCommissions(currentOrder.saleId)

    revalidatePath("/vendas-clientes/kanban")
    return { success: true }
  } catch (error) {
    console.error("Erro ao registrar entrega:", error)
    return { error: "Falha ao registrar dados de entrega." }
  }
}

export async function processOrderPayment(
  orderId: string,
  paymentData: {
    amount: number
    method: string
    notes?: string
  },
) {
  void orderId
  void paymentData

  return {
    success: false,
    error:
      "Recebimentos de pedidos devem ser lancados manualmente em Financeiro > Contas a receber.",
  }
}
