import { prisma } from "@/lib/prisma"
import { subDays } from "date-fns"
import { OrigensListClient } from "./components/OrigensListClient"

export default async function OrigensListPage() {
  const last30 = subDays(new Date(), 30)

  // 1. Fetch Origens with relations
  const origens = await prisma.leadSource.findMany({
    include: {
      _count: {
        select: {
          sales: {
            where: { saleDate: { gte: last30 } }
          }
        }
      },
      sales: {
        where: { saleDate: { gte: last30 } },
        select: { totalAmount: true, saleDate: true }
      }
    },
    orderBy: { priority: "desc" }
  })

  // 2. Prepare Data for Client
  const listData = origens.map(o => {
    const periodSalesCount = o._count.sales
    const periodTotalValue = o.sales.reduce((acc, sale) => acc + sale.totalAmount, 0)
    const ticketMedio = periodSalesCount > 0 ? periodTotalValue / periodSalesCount : 0
    const lastSale = o.sales.length > 0 ? new Date(Math.max(...o.sales.map(s => s.saleDate.getTime()))) : null

    return {
      ...o,
      periodSalesCount,
      periodTotalValue,
      ticketMedio,
      lastSale: lastSale?.toISOString() || null // JSON serializable
    }
  })

  // 3. Global Stats
  const totalActive = await prisma.leadSource.count({ where: { isActive: true } })
  const periodSalesCountGlobal = await prisma.sale.count({ where: { saleDate: { gte: last30 } } })
  const periodTotalValueGlobal = await prisma.sale.aggregate({ 
    _sum: { totalAmount: true },
    where: { saleDate: { gte: last30 } }
  })

  const championSourceObj = [...listData].sort((a, b) => b.periodSalesCount - a.periodSalesCount)[0]
  const highestTicketObj = [...listData].sort((a, b) => b.ticketMedio - a.ticketMedio)[0]

  const stats = {
    totalActive,
    periodSalesCount: periodSalesCountGlobal,
    periodTotalValue: periodTotalValueGlobal._sum.totalAmount || 0,
    championSource: championSourceObj?.periodSalesCount > 0 ? championSourceObj.name : "---",
    highestTicketSource: highestTicketObj?.ticketMedio > 0 ? highestTicketObj.name : "---",
    bestPerformance: championSourceObj?.periodSalesCount > 0 ? championSourceObj.name : "---"
  }

  return (
    <main className="flex-1 py-10 px-6 max-w-[1700px] mx-auto animate-in fade-in duration-700 pb-20">
      <OrigensListClient initialData={listData} stats={stats} />
    </main>
  )
}
