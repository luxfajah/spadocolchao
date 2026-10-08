import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sellerId = searchParams.get("sellerId")

    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const dayStart = startOfDay(now)
    const dayEnd = endOfDay(now)

    const whereSeller = sellerId && sellerId !== "__NONE__" && sellerId !== "null"
      ? { sellerId }
      : {}

    // Vendas no Mês
    const monthSales = await prisma.sale.aggregate({
      where: {
        ...whereSeller,
        status: { in: ["CONFIRMED", "DELIVERED", "COMPLETED"] },
        saleDate: { gte: monthStart, lte: monthEnd },
      },
      _sum: { totalAmount: true },
      _count: { id: true },
    })

    // Vendas Hoje
    const todaySales = await prisma.sale.aggregate({
      where: {
        ...whereSeller,
        status: { in: ["CONFIRMED", "DELIVERED", "COMPLETED"] },
        saleDate: { gte: dayStart, lte: dayEnd },
      },
      _sum: { totalAmount: true },
      _count: { id: true },
    })

    const monthTotal = monthSales._sum.totalAmount || 0
    const todayTotal = todaySales._sum.totalAmount || 0
    const monthCount = monthSales._count.id || 0
    const ticketMedio = monthCount > 0 ? monthTotal / monthCount : 0

    // Busca meta cadastrada
    let targetAmount = 50000 // default R$ 50.000 se não cadastrado
    if (sellerId && sellerId !== "__NONE__" && sellerId !== "null") {
      const goal = await prisma.sellerGoal.findFirst({
        where: {
          sellerId,
          endDate: { gte: now },
        },
        orderBy: { endDate: "desc" },
      })
      if (goal) {
        targetAmount = goal.targetAmount
      }
    }

    const progressPercent = Math.min(100, Math.round((monthTotal / targetAmount) * 100))
    const commissionEstimated = monthTotal * 0.05 // 5% comissão estimada

    return NextResponse.json({
      success: true,
      stats: {
        monthTotal,
        todayTotal,
        monthSalesCount: monthCount,
        ticketMedio,
        targetAmount,
        progressPercent,
        commissionEstimated,
      },
    })
  } catch (error: any) {
    console.error("Erro nas estatísticas do vendedor:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Erro ao calcular metas" },
      { status: 500 }
    )
  }
}
