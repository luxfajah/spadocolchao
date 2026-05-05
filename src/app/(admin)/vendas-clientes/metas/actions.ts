"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { 
  startOfDay, endOfDay, 
  startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek,
  setWeek, getYear, setYear,
  startOfQuarter, endOfQuarter,
  addMonths
} from "date-fns"

export type PeriodType = "DAILY" | "WEEKLY" | "MONTHLY" | "SEMESTRAL"

function getPeriodRange(type: PeriodType, value: string, year: number) {
  let start: Date, end: Date

  switch (type) {
    case "DAILY": {
      const date = new Date(value)
      start = startOfDay(date)
      end = endOfDay(date)
      break
    }
    case "WEEKLY": {
      const weekNum = parseInt(value)
      // Note: setWeek is locale dependent, we should be careful. 
      // Usually week starts on Sunday or Monday.
      const firstDayOfYear = new Date(year, 0, 1)
      const targetDate = setWeek(firstDayOfYear, weekNum, { weekStartsOn: 0 })
      start = startOfWeek(targetDate, { weekStartsOn: 0 })
      end = endOfWeek(targetDate, { weekStartsOn: 0 })
      break
    }
    case "MONTHLY": {
      const month = parseInt(value)
      const date = new Date(year, month - 1, 1)
      start = startOfMonth(date)
      end = endOfMonth(date)
      break
    }
    case "SEMESTRAL": {
      const half = parseInt(value) // 1 or 2
      if (half === 1) {
        start = new Date(year, 0, 1, 0, 0, 0)
        end = endOfMonth(new Date(year, 5, 1))
      } else {
        start = new Date(year, 6, 1, 0, 0, 0)
        end = endOfMonth(new Date(year, 11, 1))
      }
      break
    }
    default:
      throw new Error("Tipo de período inválido")
  }

  return { start, end }
}

export async function upsertStoreGoal(data: { 
  type: PeriodType, 
  value: string, 
  year: number, 
  target: number,
  segments?: { leadSourceId: string, target: number }[]
}) {
  try {
    const { start, end } = getPeriodRange(data.type, data.value, data.year)
    
    // 1. Upsert Main Store Goal
    const storeGoal = await prisma.storeGoal.upsert({
      where: {
        periodType_startDate_endDate: {
          periodType: data.type,
          startDate: start,
          endDate: end
        }
      },
      update: { targetAmount: data.target },
      create: {
        periodType: data.type,
        startDate: start,
        endDate: end,
        targetAmount: data.target
      }
    })

    // 2. Handle Segments if provided
    if (data.segments) {
      // Clear existing segments for this goal to ensure a clean sync
      await prisma.storeGoalSegment.deleteMany({
        where: { storeGoalId: storeGoal.id }
      })

      if (data.segments.length > 0) {
        await prisma.storeGoalSegment.createMany({
          data: data.segments.map(s => ({
            storeGoalId: storeGoal.id,
            leadSourceId: s.leadSourceId,
            targetAmount: s.target
          }))
        })
      }
    }
    
    revalidatePath("/vendas-clientes/metas")
    return { success: true }
  } catch (error: any) {
    console.error("Error upserting store goal:", error)
    return { success: false, error: error.message }
  }
}

export async function upsertSellerGoal(data: { 
  sellerId: string, 
  type: PeriodType, 
  value: string, 
  year: number, 
  target: number 
}) {
  try {
    const { start, end } = getPeriodRange(data.type, data.value, data.year)
    
    // Calculate performance for this specific interval
    const achieved = await prisma.sale.aggregate({
      where: {
        sellerId: data.sellerId,
        status: "CONFIRMED",
        saleDate: { gte: start, lte: end }
      },
      _sum: { totalAmount: true }
    })
    
    const achievedAmount = achieved._sum.totalAmount || 0
    const achievedPercent = data.target > 0 ? (achievedAmount / data.target) * 100 : 0
    
    await prisma.sellerGoal.upsert({
      where: {
        sellerId_periodType_startDate_endDate: {
          sellerId: data.sellerId,
          periodType: data.type,
          startDate: start,
          endDate: end
        }
      },
      update: { 
        targetAmount: data.target,
        achievedAmount,
        achievedPercent,
        status: achievedPercent >= 100 ? "ACHIEVED" : "OPEN"
      },
      create: {
        sellerId: data.sellerId,
        periodType: data.type,
        startDate: start,
        endDate: end,
        targetAmount: data.target,
        achievedAmount,
        achievedPercent,
        status: achievedPercent >= 100 ? "ACHIEVED" : "OPEN"
      }
    })
    
    revalidatePath("/vendas-clientes/metas")
    return { success: true }
  } catch (error: any) {
    console.error("Error upserting seller goal:", error)
    return { success: false, error: error.message }
  }
}

export async function syncAllGoals(type: PeriodType, value: string, year: number) {
  try {
    const { start, end } = getPeriodRange(type, value, year)
    
    const sellers = await prisma.seller.findMany({ where: { isActive: true } })
    
    for (const seller of sellers) {
      const achieved = await prisma.sale.aggregate({
        where: {
          sellerId: seller.id,
          status: "CONFIRMED",
          saleDate: { gte: start, lte: end }
        },
        _sum: { totalAmount: true }
      })
      
      const achievedAmount = achieved._sum.totalAmount || 0
      
      const goal = await prisma.sellerGoal.findUnique({
        where: {
          sellerId_periodType_startDate_endDate: {
            sellerId: seller.id,
            periodType: type,
            startDate: start,
            endDate: end
          }
        }
      })
      
      if (goal) {
        const achievedPercent = goal.targetAmount > 0 ? (achievedAmount / goal.targetAmount) * 100 : 0
        await prisma.sellerGoal.update({
          where: { id: goal.id },
          data: {
            achievedAmount,
            achievedPercent,
            status: achievedPercent >= 100 ? "ACHIEVED" : "OPEN"
          }
        })
      }
    }
    
    revalidatePath("/vendas-clientes/metas")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getGoalsForPeriod(type: PeriodType, value: string, year: number) {
  try {
    const { start, end } = getPeriodRange(type, value, year)
    
    const [sellerGoals, storeGoal] = await Promise.all([
      prisma.sellerGoal.findMany({
        where: {
          periodType: type,
          startDate: start,
          endDate: end
        },
        include: { seller: true }
      }),
      prisma.storeGoal.findUnique({
        where: {
          periodType_startDate_endDate: {
            periodType: type,
            startDate: start,
            endDate: end
          }
        },
        include: { segments: true }
      })
    ])

    return { success: true, sellerGoals, storeGoal }
  } catch (error: any) {
    console.error("Error fetching goals for period:", error)
    return { success: false, error: error.message }
  }
}
