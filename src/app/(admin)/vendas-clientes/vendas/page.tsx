import { prisma } from "@/lib/prisma"
import { getSales, getSalesSummary } from "@/lib/services/sales"
import { SalesPageClient } from "./SalesPageClient"
import { startOfMonth, endOfMonth } from "date-fns"

export default async function VendasPage() {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const [
    sales,
    summary,
    monthConfirmedCount,
    draftCount,
    pendingReceivablesCount,
    sellerGoalSummary,
    topSellerGroups,
    topLeadSourceGroups,
    orderPipelineGroups,
    pendingCommissions,
    approvedCommissions,
    paidCommissions,
  ] = await Promise.all([
    getSales({}),
    getSalesSummary(),
    prisma.sale.count({
      where: {
        status: "CONFIRMED",
        saleDate: { gte: monthStart },
      },
    }),
    prisma.sale.count({
      where: {
        status: "DRAFT",
      },
    }),
    prisma.sale.count({
      where: {
        status: "CONFIRMED",
        saleDate: { gte: monthStart },
        financialStatus: { in: ["PENDING", "PARTIALLY_PAID", "OVERDUE"] },
      },
    }),
    prisma.sellerGoal.aggregate({
      where: {
        periodType: "MONTHLY",
        startDate: monthStart,
        endDate: monthEnd,
      },
      _sum: {
        targetAmount: true,
        achievedAmount: true,
      },
      _count: {
        _all: true,
      },
    }),
    prisma.sale.groupBy({
      by: ["sellerId"],
      where: {
        status: "CONFIRMED",
        saleDate: { gte: monthStart },
        sellerId: { not: null },
      },
      _sum: { totalAmount: true },
      _count: { _all: true },
      orderBy: {
        _sum: { totalAmount: "desc" },
      },
      take: 4,
    }),
    prisma.sale.groupBy({
      by: ["leadSourceId"],
      where: {
        status: "CONFIRMED",
        saleDate: { gte: monthStart },
      },
      _sum: { totalAmount: true },
      _count: { _all: true },
      orderBy: {
        _sum: { totalAmount: "desc" },
      },
      take: 4,
    }),
    prisma.order.groupBy({
      by: ["currentStatus"],
      _count: { _all: true },
    }),
    prisma.commissionEntry.aggregate({
      where: {
        createdAt: { gte: monthStart },
        status: "PENDING",
      },
      _sum: { commissionAmount: true },
      _count: { _all: true },
    }),
    prisma.commissionEntry.aggregate({
      where: {
        createdAt: { gte: monthStart },
        status: "APPROVED",
      },
      _sum: { commissionAmount: true },
      _count: { _all: true },
    }),
    prisma.commissionEntry.aggregate({
      where: {
        createdAt: { gte: monthStart },
        status: "PAID",
      },
      _sum: { commissionAmount: true },
      _count: { _all: true },
    }),
  ])

  const sellerIds = topSellerGroups
    .map(group => group.sellerId)
    .filter((sellerId): sellerId is string => Boolean(sellerId))

  const leadSourceIds = topLeadSourceGroups.map(group => group.leadSourceId)

  const [sellerRecords, leadSourceRecords] = await Promise.all([
    sellerIds.length
      ? prisma.seller.findMany({
          where: { id: { in: sellerIds } },
          select: { id: true, name: true, employee: { select: { photoUrl: true } } },
        })
      : Promise.resolve([]),
    leadSourceIds.length
      ? prisma.leadSource.findMany({
          where: { id: { in: leadSourceIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ])

  const sellerMap = new Map(sellerRecords.map(seller => [seller.id, { name: seller.name, photoUrl: seller.employee?.photoUrl }]))
  const leadSourceMap = new Map(leadSourceRecords.map(source => [source.id, source.name]))

  const orderPipelineMap = orderPipelineGroups.reduce<Record<string, number>>((accumulator, group) => {
    accumulator[group.currentStatus] = group._count._all
    return accumulator
  }, {})

  const dashboard = {
    referencePeriod: `${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`,
    monthConfirmedCount,
    draftCount,
    pendingReceivablesCount,
    monthlyGoals: {
      sellers: sellerGoalSummary._count._all,
      targetAmount: sellerGoalSummary._sum.targetAmount || 0,
      achievedAmount: sellerGoalSummary._sum.achievedAmount || 0,
    },
    topSellers: topSellerGroups.map((group, index) => {
      const sellerData = group.sellerId ? sellerMap.get(group.sellerId) : null;
      return {
        id: group.sellerId || `sem-vendedor-${index}`,
        name: sellerData?.name || "Sem vendedor",
        photoUrl: sellerData?.photoUrl || null,
        total: group._sum.totalAmount || 0,
        count: group._count._all,
        avgTicket:
          group._count._all > 0 ? (group._sum.totalAmount || 0) / group._count._all : 0,
      }
    }),
    topLeadSources: topLeadSourceGroups.map(group => ({
      id: group.leadSourceId,
      name: leadSourceMap.get(group.leadSourceId) || "Origem sem nome",
      total: group._sum.totalAmount || 0,
      count: group._count._all,
    })),
    orderPipeline: {
      sold: orderPipelineMap.SOLD || 0,
      inProduction: orderPipelineMap.IN_PRODUCTION || 0,
      delivered: orderPipelineMap.DELIVERED || 0,
      finalized: orderPipelineMap.FINALIZED || 0,
      cancelled: orderPipelineMap.CANCELLED || 0,
    },
    commissions: {
      pendingAmount: pendingCommissions._sum.commissionAmount || 0,
      pendingCount: pendingCommissions._count._all,
      approvedAmount: approvedCommissions._sum.commissionAmount || 0,
      approvedCount: approvedCommissions._count._all,
      paidAmount: paidCommissions._sum.commissionAmount || 0,
      paidCount: paidCommissions._count._all,
    },
  }

  return (
    <main className="flex-1 py-10 px-6 max-w-[1600px] mx-auto">
      <SalesPageClient initialSales={sales} summary={summary} dashboard={dashboard} />
    </main>
  )
}
