import { prisma } from "@/lib/prisma"
import { MetasPageClient } from "./components/MetasPageClient"
import { PeriodType } from "./actions"
import { 
  startOfDay, endOfDay, 
  startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek,
  setWeek
} from "date-fns"

interface PageProps {
  searchParams: {
    type?: string
    value?: string
    year?: string
  }
}

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
      const half = parseInt(value)
      if (half === 1) {
        start = new Date(year, 0, 1, 0, 0, 0)
        end = endOfMonth(new Date(year, 5, 1))
      } else {
        start = new Date(year, 6, 1, 0, 0, 0)
        end = endOfMonth(new Date(year, 11, 1))
      }
      break
    }
    default: {
      const d = new Date()
      start = startOfMonth(d)
      end = endOfMonth(d)
    }
  }

  return { start, end }
}

export default async function MetasPage({ searchParams }: PageProps) {
  // Parse Search Params
  const type = (searchParams.type as PeriodType) || "MONTHLY"
  const year = parseInt(searchParams.year || new Date().getFullYear().toString())
  const value = searchParams.value || (type === "MONTHLY" ? (new Date().getMonth() + 1).toString() : 
                                      type === "DAILY" ? new Date().toISOString().split('T')[0] : "1")

  const { start, end } = getPeriodRange(type, value, year)

  // 1. Fetch Data
  const [sellers, leadSources, sellerGoals, storeGoal] = await Promise.all([
    prisma.seller.findMany({ where: { isActive: true } }),
    prisma.leadSource.findMany({ where: { isActive: true } }),
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

  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <MetasPageClient 
        sellers={sellers}
        leadSources={leadSources}
        sellerGoals={sellerGoals}
        storeGoal={storeGoal}
        period={{ type, value, year }}
      />
    </div>
  )
}
