import { differenceInHours, endOfMonth, startOfMonth, subDays } from "date-fns"
import { Prisma } from "@prisma/client"
import { KANBAN_COLUMNS } from "@/lib/order-flow"
import { prisma } from "@/lib/prisma"

const ORDER_STATUS_LABELS: Record<string, string> = {
  SOLD: "Vendido",
  WAITING_PREPARATION: "Aguardando preparo",
  IN_PRODUCTION: "Em produção",
  WAITING_DELIVERY: "Aguardando entrega",
  DELIVERED: "Entregue",
  FINALIZED: "Finalizado",
  CANCELLED: "Cancelado",
}

const ACTIVE_STATUSES = [
  "SOLD",
  "WAITING_PREPARATION",
  "IN_PRODUCTION",
  "WAITING_DELIVERY",
  "DELIVERED",
]

type OrderListItem = Awaited<ReturnType<typeof getOrders>>[number]

function getStatusLabel(status?: string | null) {
  if (!status) return "Sem status"
  return ORDER_STATUS_LABELS[status] || status
}

function getFirstTransitionAt(
  history: Array<{ toStatus: string | null; changedAt: Date }>,
  targetStatus: string
) {
  for (const item of history) {
    if (item.toStatus === targetStatus) return item.changedAt
  }

  return null
}

function getLastTransitionAt(
  history: Array<{ toStatus: string | null; changedAt: Date }>,
  targetStatus: string
) {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    if (history[index]?.toStatus === targetStatus) return history[index].changedAt
  }

  return null
}

function getProductionStartAt(order: OrderListItem) {
  return order.productionStartedAt || getFirstTransitionAt(order.statusHistory, "IN_PRODUCTION")
}

function getReadyForDeliveryAt(order: OrderListItem) {
  return order.readyForDeliveryAt || getFirstTransitionAt(order.statusHistory, "WAITING_DELIVERY")
}

function getDeliveredAt(order: OrderListItem) {
  return (
    order.deliveredAt ||
    order.deliveries.find((delivery) => delivery.deliveredAt)?.deliveredAt ||
    getFirstTransitionAt(order.statusHistory, "DELIVERED")
  )
}

function getFinalizedAt(order: OrderListItem) {
  return getFirstTransitionAt(order.statusHistory, "FINALIZED")
}

function getCurrentStageStartedAt(order: OrderListItem) {
  return getLastTransitionAt(order.statusHistory, order.currentStatus) || order.createdAt
}

function toDayValue(start: Date, end: Date) {
  return differenceInHours(end, start) / 24
}

function buildOrdersDashboard(orders: OrderListItem[]) {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const recentWindowStart = subDays(now, 30)

  const counts = orders.reduce((acc, order) => {
    acc[order.currentStatus] = (acc[order.currentStatus] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const delayedOrders = orders.filter(
    (order) =>
      Boolean(order.promisedDate) &&
      order.promisedDate! < now &&
      !["FINALIZED", "CANCELLED"].includes(order.currentStatus)
  )

  const activeOrders = orders.filter((order) => ACTIVE_STATUSES.includes(order.currentStatus))

  const productionDurations: number[] = []
  const fullCycleDurations: number[] = []
  let completedWithPromise = 0
  let completedOnTime = 0
  let finalizedThisMonth = 0
  let deliveredThisMonth = 0

  const stageAgingMap = new Map<
    string,
    { count: number; totalDays: number; oldestDays: number }
  >()

  const sellerRankingMap = new Map<
    string,
    {
      id: string
      name: string
      activeCount: number
      completedCount: number
      delayedCount: number
      backlogValue: number
    }
  >()

  const recentTransitions = orders
    .flatMap((order) =>
      order.statusHistory.map((entry) => ({
        id: entry.id,
        orderId: order.id,
        orderCode: order.code,
        customerName: order.customer.fullName,
        sellerName: order.seller?.name || "Venda direta",
        toStatus: entry.toStatus,
        label: getStatusLabel(entry.toStatus),
        changedAt: entry.changedAt,
        transitionSource: entry.transitionSource,
        changedByName: entry.changedBy?.name || "Sistema",
      }))
    )
    .sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime())
    .slice(0, 8)

  for (const order of orders) {
    const productionStartAt = getProductionStartAt(order)
    const readyForDeliveryAt = getReadyForDeliveryAt(order)
    const deliveredAt = getDeliveredAt(order)
    const finalizedAt = getFinalizedAt(order)
    const cycleClosedAt = finalizedAt || deliveredAt

    if (
      productionStartAt &&
      readyForDeliveryAt &&
      readyForDeliveryAt.getTime() > productionStartAt.getTime()
    ) {
      productionDurations.push(toDayValue(productionStartAt, readyForDeliveryAt))
    }

    if (cycleClosedAt && cycleClosedAt.getTime() > order.createdAt.getTime()) {
      fullCycleDurations.push(toDayValue(order.createdAt, cycleClosedAt))
    }

    if (order.promisedDate && cycleClosedAt) {
      completedWithPromise += 1
      if (cycleClosedAt.getTime() <= order.promisedDate.getTime()) {
        completedOnTime += 1
      }
    }

    if (finalizedAt && finalizedAt >= monthStart && finalizedAt <= monthEnd) {
      finalizedThisMonth += 1
    }

    if (deliveredAt && deliveredAt >= monthStart && deliveredAt <= monthEnd) {
      deliveredThisMonth += 1
    }

    if (ACTIVE_STATUSES.includes(order.currentStatus)) {
      const stageStartedAt = getCurrentStageStartedAt(order)
      const ageInDays = Math.max(toDayValue(stageStartedAt, now), 0)
      const currentStage = stageAgingMap.get(order.currentStatus) || {
        count: 0,
        totalDays: 0,
        oldestDays: 0,
      }

      currentStage.count += 1
      currentStage.totalDays += ageInDays
      currentStage.oldestDays = Math.max(currentStage.oldestDays, ageInDays)
      stageAgingMap.set(order.currentStatus, currentStage)
    }

    const sellerKey = order.seller?.id || "direct-sales"
    const sellerName = order.seller?.name || "Venda direta"
    const sellerCurrent = sellerRankingMap.get(sellerKey) || {
      id: sellerKey,
      name: sellerName,
      activeCount: 0,
      completedCount: 0,
      delayedCount: 0,
      backlogValue: 0,
    }

    if (ACTIVE_STATUSES.includes(order.currentStatus)) {
      sellerCurrent.activeCount += 1
      sellerCurrent.backlogValue += order.sale.totalAmount
    }

    if (order.promisedDate && order.promisedDate < now && ACTIVE_STATUSES.includes(order.currentStatus)) {
      sellerCurrent.delayedCount += 1
    }

    if (cycleClosedAt && cycleClosedAt >= recentWindowStart) {
      sellerCurrent.completedCount += 1
    }

    sellerRankingMap.set(sellerKey, sellerCurrent)
  }

  const stageAging = KANBAN_COLUMNS.filter((column) => ACTIVE_STATUSES.includes(column.id)).map((column) => {
    const current = stageAgingMap.get(column.id) || {
      count: 0,
      totalDays: 0,
      oldestDays: 0,
    }

    return {
      status: column.id,
      label: column.title,
      count: current.count,
      averageDays: current.count > 0 ? current.totalDays / current.count : 0,
      oldestDays: current.oldestDays,
      color: column.color,
    }
  })

  const bottleneck = [...stageAging]
    .sort((a, b) => b.count - a.count || b.averageDays - a.averageDays)[0] || null

  const sellerRanking = Array.from(sellerRankingMap.values())
    .sort((a, b) => b.activeCount - a.activeCount || b.backlogValue - a.backlogValue)
    .slice(0, 5)

  const backlogValue = activeOrders.reduce((acc, order) => acc + order.sale.totalAmount, 0)

  return {
    summary: {
      sold: counts.SOLD || 0,
      waitingPreparation: counts.WAITING_PREPARATION || 0,
      inProduction: counts.IN_PRODUCTION || 0,
      waitingDelivery: counts.WAITING_DELIVERY || 0,
      delivered: counts.DELIVERED || 0,
      finalized: counts.FINALIZED || 0,
      delayed: delayedOrders.length,
      cancelled: counts.CANCELLED || 0,
    },
    metrics: {
      activeCount: activeOrders.length,
      delayedCount: delayedOrders.length,
      backlogValue,
      avgProductionDays:
        productionDurations.length > 0
          ? productionDurations.reduce((acc, current) => acc + current, 0) / productionDurations.length
          : 0,
      avgCycleDays:
        fullCycleDurations.length > 0
          ? fullCycleDurations.reduce((acc, current) => acc + current, 0) / fullCycleDurations.length
          : 0,
      onTimeRate: completedWithPromise > 0 ? (completedOnTime / completedWithPromise) * 100 : 0,
      finalizedThisMonth,
      deliveredThisMonth,
      recentTransitionsCount: recentTransitions.length,
      bottleneckLabel: bottleneck?.label || "Sem gargalo dominante",
      bottleneckCount: bottleneck?.count || 0,
    },
    sellerRanking,
    stageAging,
    recentTransitions,
  }
}

export async function getOrdersSummary() {
  const orders = await getOrders({})
  return buildOrdersDashboard(orders).summary
}

export async function getOrders(filters: {
  status?: string
  financialStatus?: string
  customerId?: string
  sellerId?: string
  startDate?: Date
  endDate?: Date
}) {
  const where: Prisma.OrderWhereInput = {}

  if (filters.status) where.currentStatus = filters.status
  if (filters.customerId) where.customerId = filters.customerId
  if (filters.sellerId) where.sellerId = filters.sellerId
  if (filters.financialStatus) {
    where.sale = {
      is: {
        financialStatus: filters.financialStatus,
      },
    }
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {}
    if (filters.startDate) where.createdAt.gte = filters.startDate
    if (filters.endDate) where.createdAt.lte = filters.endDate
  }

  // Auto-archiving: exclude FINALIZED or CANCELLED orders older than 2 days
  const twoDaysAgo = subDays(new Date(), 2)
  where.AND = [
    ...(where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : []),
    {
      OR: [
        { currentStatus: { notIn: ["FINALIZED", "CANCELLED"] } },
        { 
          currentStatus: { in: ["FINALIZED", "CANCELLED"] },
          updatedAt: { gte: twoDaysAgo } 
        }
      ]
    }
  ]

  return prisma.order.findMany({
    where,
    include: {
      customer: { select: { fullName: true } },
      seller: { select: { id: true, name: true } },
      sale: {
        select: {
          id: true,
          number: true,
          financialStatus: true,
          totalAmount: true,
          items: {
            select: {
              description: true,
            },
            take: 3,
          },
        },
      },
      deliveries: {
        select: {
          deliveredAt: true,
        },
        orderBy: {
          deliveredAt: "desc",
        },
      },
      statusHistory: {
        include: {
          changedBy: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { changedAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getOrdersDashboardData(filters: {
  status?: string
  financialStatus?: string
  customerId?: string
  sellerId?: string
  startDate?: Date
  endDate?: Date
} = {}) {
  const orders = await getOrders(filters)
  const dashboard = buildOrdersDashboard(orders)

  return {
    orders,
    ...dashboard,
  }
}

export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      customer: {
        include: {
          addresses: true,
          contacts: true,
        },
      },
      seller: true,
      sale: {
        include: {
          items: {
            include: {
              productService: true,
              detailMattressReform: true,
              detailBoxReform: true,
              detailNewMattress: true,
              detailNewBox: true,
              detailUpholsteryCleaning: true,
            },
          },
          installments: {
            include: {
              paymentMethod: true,
            },
          },
        },
      },
      statusHistory: {
        include: {
          changedBy: true,
        },
        orderBy: { changedAt: "desc" },
      },
      productionSlips: {
        include: {
          lines: {
            include: {
              saleItem: true,
            },
          },
        },
      },
      deliveries: true,
      orderNotes: {
        include: {
          createdBy: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })
}

export async function updateOrderStatus(orderId: string, status: string, userId: string, notes?: string) {
  return prisma.$transaction(async (tx) => {
    const currentOrder = await tx.order.findUnique({
      where: { id: orderId },
      select: { currentStatus: true },
    })

    const order = await tx.order.update({
      where: { id: orderId },
      data: {
        currentStatus: status,
        updatedAt: new Date(),
      },
    })

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: currentOrder?.currentStatus,
        toStatus: status,
        notes,
        transitionSource: "MANUAL",
        changedById: userId,
      },
    })

    return order
  })
}

export async function createProductionSlip(orderId: string, items: { saleItemId: string; quantity: number }[], userId: string) {
  return prisma.$transaction(async (tx) => {
    const slipCount = await tx.orderProductionSlip.count({ where: { orderId } })
    const slipNumber = `FP-${orderId.substring(0, 5)}-${slipCount + 1}`

    const slip = await tx.orderProductionSlip.create({
      data: {
        orderId,
        number: slipNumber,
        status: "ISSUED",
        createdById: userId,
        lines: {
          create: items.map((item) => ({
            saleItemId: item.saleItemId,
            quantity: item.quantity,
          })),
        },
      },
    })

    const order = await tx.order.findUnique({ where: { id: orderId } })
    if (order?.currentStatus === "WAITING_PREPARATION") {
      await tx.order.update({
        where: { id: orderId },
        data: {
          currentStatus: "IN_PRODUCTION",
          productionStartedAt: order.productionStartedAt || new Date(),
        },
      })

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.currentStatus,
          toStatus: "IN_PRODUCTION",
          notes: "Ficha de produção gerada automaticamente.",
          transitionSource: "AUTOMATIC",
          changedById: userId,
        },
      })
    }

    return slip
  })
}

export async function addOrderNote(orderId: string, content: string, type: string, userId: string) {
  return prisma.orderNote.create({
    data: {
      orderId,
      content,
      type,
      createdById: userId,
    },
  })
}
