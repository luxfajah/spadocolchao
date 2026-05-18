import Image from "next/image"
import type { WorkSchedule } from "@prisma/client"
import { getUser } from "@/app/login/actions"
import { getUserAccessProfile } from "@/lib/access-control"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  createBusinessDateTime,
  getStoredAttendanceDateKey,
  getStoredAttendanceWeekDay,
} from "@/lib/attendance/business-time"
import { prisma } from "@/lib/prisma"
import {
  Award,
  BarChart3,
  Briefcase,
  Factory,
  Megaphone,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
} from "lucide-react"
import { DashboardCharts } from "./DashboardCharts"
import { RoleDashboard } from "@/components/dashboard/RoleDashboard"

const MARKETING_LEAD_CATEGORIES = new Set(["Digital paga", "Digital orgânica", "Campanha"])

const scheduleStartFieldByWeekDay = {
  0: "sundayIn1",
  1: "mondayIn1",
  2: "tuesdayIn1",
  3: "wednesdayIn1",
  4: "thursdayIn1",
  5: "fridayIn1",
  6: "saturdayIn1",
} as const

type ScheduleWeekDay = keyof typeof scheduleStartFieldByWeekDay

const dashboardCardClass =
  "overflow-hidden rounded-[2.5rem] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.98)_100%)] text-slate-950 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.35)]"
const dashboardCardHoverClass = `${dashboardCardClass} transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_28px_70px_-42px_rgba(37,99,235,0.28)]`
const dashboardCardTitleClass =
  "text-[10px] font-black uppercase tracking-[0.22em] text-slate-500"
const dashboardSectionTitleClass =
  "flex items-center gap-3 font-heading text-xl font-black uppercase italic tracking-tight text-slate-950"
const dashboardDescriptionClass =
  "text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500"
const dashboardPanelClass = "rounded-[1.8rem] border border-slate-200 bg-slate-50/85 p-5"
const dashboardBluePanelClass = "rounded-[1.8rem] border border-blue-100 bg-blue-50/80 p-5"

function resolveEmployeeSchedule(employee: {
  workSchedule: WorkSchedule | null
  jobTitle: { workSchedule: WorkSchedule | null } | null
}) {
  return employee.workSchedule ?? employee.jobTitle?.workSchedule ?? null
}

function resolveArrivalLimit(dayDate: Date, schedule: WorkSchedule | null) {
  if (!schedule) {
    return null
  }

  const startField = scheduleStartFieldByWeekDay[getStoredAttendanceWeekDay(dayDate) as ScheduleWeekDay]
  const startTime = schedule[startField]

  if (!startTime) {
    return null
  }

  const expectedStart = createBusinessDateTime(getStoredAttendanceDateKey(dayDate), startTime)
  return new Date(expectedStart.getTime() + (schedule.toleranceMinutes || 0) * 60 * 1000)
}

export default async function DashboardPage() {
  const user = await getUser()
  if (!user) {
    return null
  }

  const accessProfile = await getUserAccessProfile(user)

  if (accessProfile.dashboardVariant !== "full") {
    return <RoleDashboard user={user} accessProfile={accessProfile} />
  }

  const now = new Date()
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
  const startOfPreviousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const endOfPreviousMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999)
  const startOfPreviousAttendanceMonth = new Date(Date.UTC(today.getFullYear(), today.getMonth() - 1, 1))
  const endOfPreviousAttendanceMonth = new Date(Date.UTC(today.getFullYear(), today.getMonth(), 0))

  const [
    vendasHoje,
    vendasMes,
    vendasMesAnterior,
    monthTransactions,
    previousMonthAttendanceDays,
    openJobs,
    hiresThisMonth,
    terminationsThisMonth,
    storeGoal,
    sellerGoals,
  ] = await Promise.all([
    prisma.sale.findMany({
      where: {
        saleDate: { gte: today },
        status: "CONFIRMED",
      },
      select: {
        totalAmount: true,
        saleDate: true,
      },
    }),
    prisma.sale.findMany({
      where: {
        saleDate: { gte: startOfMonth, lte: endOfMonth },
        status: "CONFIRMED",
      },
      select: {
        totalAmount: true,
        saleDate: true,
        createdAt: true,
        seller: {
          select: {
            id: true,
            name: true,
            employee: {
              select: {
                photoUrl: true,
              },
            },
          },
        },
        leadSource: {
          select: {
            name: true,
            category: true,
          },
        },
      },
    }),
    prisma.sale.findMany({
      where: {
        saleDate: { gte: startOfPreviousMonth, lte: endOfPreviousMonth },
        status: "CONFIRMED",
      },
      select: {
        totalAmount: true,
        seller: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.financialTransaction.findMany({
      where: {
        transactionDate: { gte: startOfMonth, lte: endOfMonth },
        status: "CONFIRMED",
        isTransfer: false,
      },
      select: {
        type: true,
        amount: true,
        financialCategory: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    }),
    prisma.attendanceDay.findMany({
      where: {
        date: { gte: startOfPreviousAttendanceMonth, lte: endOfPreviousAttendanceMonth },
      },
      select: {
        employeeId: true,
        date: true,
        expectedMinutes: true,
        firstIn: true,
        isManualAdjustment: true,
        employee: {
          select: {
            fullName: true,
            workSchedule: true,
            jobTitle: {
              select: {
                workSchedule: true,
              },
            },
          },
        },
      },
    }),
    prisma.jobOpening.count({
      where: { status: "OPEN" },
    }),
    prisma.employee.count({
      where: {
        admissionDate: { gte: startOfMonth, lte: endOfMonth },
      },
    }),
    prisma.terminationProcess.count({
      where: {
        terminationDate: { gte: startOfMonth, lte: endOfMonth },
        status: { not: "CANCELLED" },
      },
    }),
    prisma.storeGoal.findUnique({
      where: {
        periodType_startDate_endDate: {
          periodType: "MONTHLY",
          startDate: startOfMonth,
          endDate: endOfMonth,
        },
      },
    }),
    prisma.sellerGoal.findMany({
      where: {
        periodType: "MONTHLY",
        startDate: startOfMonth,
        endDate: endOfMonth,
      },
    }),
  ])

  const totalVendidoHoje = vendasHoje.reduce((acc, sale) => acc + sale.totalAmount, 0)
  const quantidadeVendasHoje = vendasHoje.length
  const ticketMedioHoje = quantidadeVendasHoje > 0 ? totalVendidoHoje / quantidadeVendasHoje : 0

  const metaTotal = storeGoal?.targetAmount || 150000
  const totalAlcancado = vendasMes.reduce((acc, sale) => acc + sale.totalAmount, 0)
  const valorPendente = Math.max(metaTotal - totalAlcancado, 0)
  const progressoMeta = metaTotal > 0 ? Math.min((totalAlcancado / metaTotal) * 100, 100) : 0

  const diasNoMes = endOfMonth.getDate()
  let acumuladoDiario = 0
  const chartData: { day: string; acumulado: number }[] = []

  for (let day = 1; day <= diasNoMes; day += 1) {
    const dataDia = new Date(today.getFullYear(), today.getMonth(), day)
    if (dataDia > now) break

    const vendasDoDia = vendasMes.filter((sale) => new Date(sale.saleDate).getDate() === day)
    const totalDia = vendasDoDia.reduce((acc, sale) => acc + sale.totalAmount, 0)
    acumuladoDiario += totalDia

    chartData.push({
      day: `${day}/${today.getMonth() + 1}`,
      acumulado: acumuladoDiario,
    })
  }

  let monthEntries = monthTransactions
    .filter((transaction) => transaction.type === "ENTRY")
    .reduce((acc, transaction) => acc + transaction.amount, 0)

  // Fallback: If no explicit financial transactions for entries exist,
  // use the sum of confirmed sales for the month as simulated entry data.
  if (monthEntries === 0 && totalAlcancado > 0) {
    monthEntries = totalAlcancado
  }

  const monthExits = monthTransactions
    .filter((transaction) => transaction.type === "EXIT")
    .reduce((acc, transaction) => acc + transaction.amount, 0)

  const operatingProfit = monthEntries - monthExits

  const marketingSpendTransactions = monthTransactions.filter(
    (transaction) => transaction.type === "EXIT" && transaction.financialCategory?.code === "DESP_MKT"
  )
  const marketingSpend = marketingSpendTransactions.reduce((acc, transaction) => acc + transaction.amount, 0)
  const marketingAttributedSales = vendasMes.filter((sale) =>
    MARKETING_LEAD_CATEGORIES.has(sale.leadSource?.category || "") ||
    ["Google Ads", "Instagram", "Facebook"].includes(sale.leadSource?.name || "")
  )
  const marketingSalesTotal = marketingAttributedSales.reduce((acc, sale) => acc + sale.totalAmount, 0)
  const marketingSalesCount = marketingAttributedSales.length
  const marketingRoas = marketingSpend > 0 ? marketingSalesTotal / marketingSpend : null
  const marketingShareOfSales = totalAlcancado > 0 ? (marketingSalesTotal / totalAlcancado) * 100 : null

  const currentSellerRanking = vendasMes.reduce((acc, sale) => {
    if (!sale.seller) {
      return acc
    }

    if (!acc[sale.seller.id]) {
      acc[sale.seller.id] = {
        nome: sale.seller.name,
        total: 0,
        quantidade: 0,
        photoUrl: sale.seller.employee?.photoUrl || null,
      }
    }

    acc[sale.seller.id].total += sale.totalAmount
    acc[sale.seller.id].quantidade += 1
    return acc
  }, {} as Record<string, { nome: string; total: number; quantidade: number; photoUrl: string | null }>)

  const vendedorDestaqueMes =
    Object.values(currentSellerRanking).sort(
      (a, b) => b.total - a.total || b.quantidade - a.quantidade || a.nome.localeCompare(b.nome, "pt-BR")
    )[0] || null

  const attendanceByEmployee = previousMonthAttendanceDays.reduce((acc, day) => {
    const schedule = resolveEmployeeSchedule(day.employee)
    const arrivalLimit = resolveArrivalLimit(day.date, schedule)

    if (day.expectedMinutes <= 0 || day.isManualAdjustment || !day.firstIn || !arrivalLimit) {
      return acc
    }

    if (!acc[day.employeeId]) {
      acc[day.employeeId] = {
        nome: day.employee.fullName,
        diasPontuais: 0,
        diasComAtraso: 0,
        diasAnalisados: 0,
        escala: schedule?.name || "Escala não vinculada",
      }
    }

    acc[day.employeeId].diasAnalisados += 1

    if (day.firstIn.getTime() <= arrivalLimit.getTime()) {
      acc[day.employeeId].diasPontuais += 1
    } else {
      acc[day.employeeId].diasComAtraso += 1
    }

    return acc
  }, {} as Record<string, { nome: string; diasPontuais: number; diasComAtraso: number; diasAnalisados: number; escala: string }>)

  const attendanceEmployees = Object.values(attendanceByEmployee)
  const funcionarioDestaqueSemAtraso =
    attendanceEmployees
      .filter((employee) => employee.diasAnalisados > 0 && employee.diasComAtraso === 0)
      .sort(
        (a, b) =>
          b.diasPontuais - a.diasPontuais ||
          b.diasAnalisados - a.diasAnalisados ||
          a.nome.localeCompare(b.nome, "pt-BR")
      )[0] || null
  const hasAttendanceBaseFromPreviousMonth = attendanceEmployees.some((employee) => employee.diasAnalisados > 0)

  const goalsBySeller = sellerGoals.reduce((acc, g) => {
    acc[g.sellerId] = g.targetAmount
    return acc
  }, {} as Record<string, number>)

  const ranking = vendasMes.reduce((acc, sale) => {
    const sellerId = sale.seller?.id || "sem-vendedor"
    const sellerName = sale.seller?.name || "Sem vendedor"

    if (!acc[sellerId]) {
      acc[sellerId] = { 
        nome: sellerName, 
        total: 0, 
        meta: goalsBySeller[sellerId] || 30000 
      }
    }

    acc[sellerId].total += sale.totalAmount
    return acc
  }, {} as Record<string, { nome: string; total: number; meta: number }>)

  const rankingOrdenado = Object.values(ranking)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  const formatCurrency = (value: number) =>
    `R$ ${value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`

  const currentHour = now.getHours()
  const greeting = currentHour < 12 ? "Bom dia" : currentHour < 18 ? "Boa tarde" : "Boa noite"
  const welcomeName = (user?.name || user?.username || "Equipe").trim()
  const firstName = welcomeName.split(/\s+/)[0] || "Equipe"
  const currentPeriodLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(today)
  const previousPeriodLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(startOfPreviousMonth)
  const marketingRoasLabel = marketingRoas !== null ? `ROAS ${marketingRoas.toFixed(1)}x` : "Sem gasto registrado"
  const marketingShareLabel =
    marketingShareOfSales !== null
      ? `${marketingShareOfSales.toFixed(0)}% do vendido no mês`
      : "Sem vendas confirmadas"
  const roleLabel =
    user?.roles
      ?.map((userRole) => userRole.role?.name)
      .filter(Boolean)
      .join(" | ") || "Operação conectada"

  return (
    <div className="animate-in slide-in-from-bottom-4 space-y-10 px-1 pb-20 duration-700 fade-in">
      <section className="relative overflow-hidden rounded-[2.75rem] bg-slate-950 shadow-lahomes">
        <Image
          src="/fachada-dashboard.jpg"
          alt="Fachada da fábrica Spa do Colchão"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(2,6,23,0.92)_0%,rgba(2,6,23,0.75)_44%,rgba(15,23,42,0.28)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.26),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.24),transparent_28%)]" />

        <div className="relative grid gap-8 p-8 md:p-10 xl:grid-cols-[1.45fr_0.8fr]">
          <div className="flex flex-col justify-between gap-8">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-white/90 backdrop-blur-sm">
                <Factory className="h-4 w-4 text-cyan-300" />
                Unidade principal
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-400/15 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-emerald-100 backdrop-blur-sm">
                <ShieldCheck className="h-4 w-4" />
                Sistema em operação
              </div>
            </div>

            <div className="max-w-3xl space-y-4">
              <p className="text-sm font-bold uppercase tracking-[0.35em] text-cyan-100/80">
                {greeting}, {firstName}
              </p>
              <h1 className="max-w-3xl font-heading text-4xl font-black uppercase italic leading-[0.95] tracking-tight text-white md:text-5xl xl:text-[4.2rem]">
                Bem-vindo ao centro de comando da Spa do Colchão
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-200/90 md:text-lg">
                Use esta leitura rápida para acompanhar vendas, meta mensal e ritmo da operação
                logo na abertura do sistema.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[2rem] border border-white/12 bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-200/70">
                  Vendas do dia
                </p>
                <p className="mt-3 font-heading text-3xl font-black italic tracking-tight text-white">
                  {formatCurrency(totalVendidoHoje)}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/75">
                  {quantidadeVendasHoje} vendas confirmadas
                </p>
              </div>

              <div className="rounded-[2rem] border border-white/12 bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-200/70">
                  Meta do mês
                </p>
                <p className="mt-3 font-heading text-3xl font-black italic tracking-tight text-white">
                  {progressoMeta.toFixed(0)}%
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/75">
                  {formatCurrency(totalAlcancado)} acumulados
                </p>
              </div>

              <div className="rounded-[2rem] border border-white/12 bg-white/10 p-5 backdrop-blur-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-200/70">
                  Falta para meta
                </p>
                <p className="mt-3 font-heading text-3xl font-black italic tracking-tight text-white">
                  {formatCurrency(valorPendente)}
                </p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100/75">
                  Competência {currentPeriodLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-[2.25rem] border border-white/12 bg-white/10 p-6 backdrop-blur-md">
            <div className="space-y-5">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-200/70">
                  Usuário conectado
                </p>
                <p className="mt-3 text-2xl font-black uppercase tracking-tight text-white">
                  {welcomeName}
                </p>
                <p className="mt-2 text-sm uppercase tracking-[0.2em] text-cyan-100/80">
                  {roleLabel}
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/35 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-200/70">
                  Ticket médio do dia
                </p>
                <p className="mt-3 font-heading text-[2rem] font-black italic tracking-tight text-white">
                  {formatCurrency(ticketMedioHoje)}
                </p>
              </div>
            </div>

            <div className="grid gap-3 pt-6 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/10 px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-200/65">
                  Janela analisada
                </p>
                <p className="mt-2 text-sm font-black uppercase tracking-[0.2em] text-white">
                  {currentPeriodLabel}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-white/10 px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-200/65">
                  Meta estabelecida
                </p>
                <p className="mt-2 text-sm font-black uppercase tracking-[0.2em] text-emerald-200">
                  {formatCurrency(metaTotal)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 font-body md:grid-cols-2 lg:grid-cols-4">
        <Card className={dashboardCardHoverClass}>
          <CardHeader className="px-8 pb-2 pt-8">
            <CardTitle className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Vendas de hoje
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="font-heading text-4xl font-black italic tracking-tighter text-slate-950">
              {formatCurrency(totalVendidoHoje)}
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-6 text-[11px] text-slate-600">
              <span className="font-black uppercase tracking-widest text-slate-500">
                {quantidadeVendasHoje} vendas
              </span>
              <div className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[9px] font-black text-blue-700 shadow-sm">
                TM: {formatCurrency(ticketMedioHoje)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={dashboardCardClass}>
          <CardHeader className="px-8 pb-2 pt-8">
            <CardTitle className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Meta mensal
              <Target className="h-4 w-4 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="font-heading text-4xl font-black italic tracking-tighter text-slate-950">
              {formatCurrency(totalAlcancado)}
            </div>
            <div className="mt-6">
              <div className="mb-2 flex items-end justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest leading-none text-slate-500">
                  Progresso
                </span>
                <span className="text-xs font-black text-blue-700">{progressoMeta.toFixed(0)}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 p-0.5 shadow-inner">
                <div
                  className="h-full rounded-full bg-blue-600 shadow-[0_0_18px_rgba(37,99,235,0.24)] transition-all duration-1000"
                  style={{ width: `${progressoMeta}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${dashboardCardClass} col-span-1 md:col-span-2`}>
          <CardHeader className="px-8 pb-2 pt-8">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Resumo financeiro do mês
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="grid grid-cols-1 gap-8 pt-2 sm:grid-cols-3">
              <div className="flex flex-col gap-1 rounded-[2rem] border border-blue-100 bg-blue-50/80 p-5">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-700">
                  <div className="h-2 w-2 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.24)]" />
                  Entradas
                </div>
                <div className="font-heading text-2xl font-black italic text-slate-950">
                  {formatCurrency(monthEntries)}
                </div>
              </div>

              <div className="flex flex-col gap-1 rounded-[2rem] border border-slate-200 bg-slate-50/90 p-5">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600">
                  <div className="h-2 w-2 rounded-full bg-slate-500 shadow-[0_0_10px_rgba(100,116,139,0.18)]" />
                  Saídas
                </div>
                <div className="font-heading text-2xl font-black italic text-slate-950">
                  {formatCurrency(monthExits)}
                </div>
              </div>

              <div className="flex flex-col gap-1 rounded-[2rem] border border-blue-200 bg-[linear-gradient(145deg,rgba(239,246,255,0.95)_0%,rgba(255,255,255,1)_100%)] p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">
                  Lucro líquido
                </p>
                <div className="font-heading text-2xl font-black italic text-slate-950">
                  {formatCurrency(operatingProfit)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">
              Novos indicadores da abertura
            </p>
            <h2 className="mt-2 font-heading text-2xl font-black uppercase italic tracking-tight text-slate-950">
              RH, marketing e destaques de performance
            </h2>
          </div>
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 shadow-sm">
            Base de {previousPeriodLabel} e leitura de {currentPeriodLabel}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-12">
          <Card className={`${dashboardCardClass} xl:col-span-4`}>
            <CardHeader className="p-8 pb-4">
              <CardTitle className={dashboardSectionTitleClass}>
                <Award className="h-5 w-5 text-blue-600" />
                Funcionário destaque
              </CardTitle>
              <CardDescription className={dashboardDescriptionClass}>
                Sem atrasos em {previousPeriodLabel}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              {funcionarioDestaqueSemAtraso ? (
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-700">
                      Fechamento validado
                    </p>
                    <p className="mt-3 text-2xl font-black uppercase tracking-tight text-slate-950">
                      {funcionarioDestaqueSemAtraso.nome}
                    </p>
                    <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {funcionarioDestaqueSemAtraso.escala}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className={dashboardBluePanelClass}>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-700">
                        Dias pontuais
                      </p>
                      <p className="mt-3 font-heading text-3xl font-black italic text-slate-950">
                        {funcionarioDestaqueSemAtraso.diasPontuais}
                      </p>
                    </div>

                    <div className={dashboardPanelClass}>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                        Dias analisados
                      </p>
                      <p className="mt-3 font-heading text-3xl font-black italic text-slate-950">
                        {funcionarioDestaqueSemAtraso.diasAnalisados}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-[2rem] border border-slate-200 bg-slate-50/85 p-6">
                  <p className="text-lg font-black uppercase tracking-tight text-slate-950">
                    {hasAttendanceBaseFromPreviousMonth
                      ? `Ninguém zerou atrasos em ${previousPeriodLabel}.`
                      : `Sem fechamento de ponto em ${previousPeriodLabel}.`}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    O destaque aparece quando existe base de ponto tratada e ao menos um colaborador fecha o mês
                    anterior dentro da tolerância em todos os dias analisados.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={`${dashboardCardClass} xl:col-span-4`}>
            <CardHeader className="p-8 pb-4">
              <CardTitle className={dashboardSectionTitleClass}>
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Vendedor destaque
              </CardTitle>
              <CardDescription className={dashboardDescriptionClass}>
                Melhor resultado comercial de {currentPeriodLabel}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              {vendedorDestaqueMes ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-5">
                    {vendedorDestaqueMes.photoUrl ? (
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[1.25rem] border-2 border-white shadow-[0_8px_16px_-6px_rgba(37,99,235,0.2)]">
                        <Image
                          src={vendedorDestaqueMes.photoUrl}
                          alt={vendedorDestaqueMes.nome}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.25rem] border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white text-2xl font-black text-blue-700 shadow-[0_8px_16px_-6px_rgba(37,99,235,0.15)]">
                        {vendedorDestaqueMes.nome.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-700">
                        Volume confirmado
                      </p>
                      <p className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-950">
                        {vendedorDestaqueMes.nome}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className={dashboardBluePanelClass}>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-700">
                        Total vendido
                      </p>
                      <p className="mt-3 font-heading text-3xl font-black italic text-slate-950">
                        {formatCurrency(vendedorDestaqueMes.total)}
                      </p>
                    </div>

                    <div className={dashboardPanelClass}>
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                        Vendas fechadas
                      </p>
                      <p className="mt-3 font-heading text-3xl font-black italic text-slate-950">
                        {vendedorDestaqueMes.quantidade}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-[2rem] border border-slate-200 bg-slate-50/85 p-6">
                  <p className="text-lg font-black uppercase tracking-tight text-slate-950">
                    Sem vendas confirmadas em {currentPeriodLabel}.
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Assim que houver faturamento fechado no mês atual, o vendedor destaque entra nesta área.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={`${dashboardCardClass} xl:col-span-4`}>
            <CardHeader className="p-8 pb-4">
              <CardTitle className={dashboardSectionTitleClass}>
                <Briefcase className="h-5 w-5 text-blue-600" />
                Indicadores de RH
              </CardTitle>
              <CardDescription className={dashboardDescriptionClass}>
                Vagas abertas e movimentação de {currentPeriodLabel}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 p-8 pt-0">
              <div className={dashboardPanelClass}>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                  Vagas abertas
                </p>
                <p className="mt-3 font-heading text-3xl font-black italic text-slate-950">{openJobs}</p>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
                  Snapshot atual do funil
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className={dashboardBluePanelClass}>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-700">
                    Contratados
                  </p>
                  <p className="mt-3 font-heading text-3xl font-black italic text-slate-950">
                    {hiresThisMonth}
                  </p>
                </div>

                <div className={dashboardPanelClass}>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                    Demitidos
                  </p>
                  <p className="mt-3 font-heading text-3xl font-black italic text-slate-950">
                    {terminationsThisMonth}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${dashboardCardClass} xl:col-span-6`}>
            <CardHeader className="p-8 pb-4">
              <CardTitle className={dashboardSectionTitleClass}>
                <Megaphone className="h-5 w-5 text-blue-600" />
                Gasto com marketing
              </CardTitle>
              <CardDescription className={dashboardDescriptionClass}>
                Categoria financeira Marketing e Propaganda em {currentPeriodLabel}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="font-heading text-4xl font-black italic tracking-tighter text-slate-950">
                    {formatCurrency(marketingSpend)}
                  </p>
                  <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {marketingSpendTransactions.length} lançamentos confirmados no financeiro
                  </p>
                </div>

                <div className="rounded-[1.8rem] border border-blue-100 bg-blue-50/80 px-5 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-700">
                    Código monitorado
                  </p>
                  <p className="mt-2 text-sm font-black uppercase tracking-[0.18em] text-slate-950">
                    DESP_MKT
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${dashboardCardClass} xl:col-span-6`}>
            <CardHeader className="p-8 pb-4">
              <CardTitle className={dashboardSectionTitleClass}>
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Retorno de vendas do marketing
              </CardTitle>
              <CardDescription className={dashboardDescriptionClass}>
                Digital paga, digital orgânica e campanhas em {currentPeriodLabel}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="font-heading text-4xl font-black italic tracking-tighter text-slate-950">
                    {formatCurrency(marketingSalesTotal)}
                  </p>
                  <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {marketingSalesCount} vendas atribuídas ao marketing
                  </p>
                </div>

                <div className="rounded-[1.8rem] border border-blue-100 bg-blue-50/80 px-5 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-700">
                    Destaque do período
                  </p>
                  <p className="mt-2 text-sm font-black uppercase tracking-[0.18em] text-slate-950">
                    {marketingRoasLabel}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className={dashboardBluePanelClass}>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-700">
                    Participação nas vendas
                  </p>
                  <p className="mt-3 text-sm font-black uppercase tracking-[0.18em] text-slate-950">
                    {marketingShareLabel}
                  </p>
                </div>

                <div className={dashboardPanelClass}>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                    Fontes consideradas
                  </p>
                  <p className="mt-3 text-sm font-black uppercase tracking-[0.18em] text-slate-950">
                    Digital paga, orgânica e campanha
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardCharts data={chartData} metaDiaria={metaTotal / diasNoMes} />
        </div>

        <Card className={dashboardCardClass}>
          <CardHeader className="p-8 pb-4">
            <CardTitle className="flex items-center gap-3 font-heading text-xl font-black uppercase italic leading-none tracking-tighter text-slate-950">
              <Users className="h-6 w-6 text-blue-600" />
              Ranking de vendas
            </CardTitle>
            <CardDescription className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Performance mensal dos vendedores
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            {rankingOrdenado.length === 0 ? (
              <div className="py-12 text-center text-sm font-bold uppercase tracking-widest text-slate-500">
                Nenhum registro
              </div>
            ) : (
              <div className="space-y-6">
                {rankingOrdenado.map((vendedor, index) => {
                  const percAlcancado = Math.min((vendedor.total / vendedor.meta) * 100, 100)

                  return (
                    <div key={`${vendedor.nome}-${index}`} className="group relative">
                      <div className="mb-3 flex items-end justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-8 w-8 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-[11px] font-black text-blue-700 shadow-sm transition-all group-hover:border-blue-200 group-hover:bg-blue-100">
                            {index + 1}
                          </div>
                          <span className="text-sm font-black uppercase leading-none tracking-tight text-slate-950">
                            {vendedor.nome}
                          </span>
                        </div>
                        <span className="text-sm font-black text-blue-700">
                          {formatCurrency(vendedor.total)}
                        </span>
                      </div>

                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner">
                        <div
                          className="h-full rounded-full bg-blue-600 shadow-[0_0_14px_rgba(37,99,235,0.2)] transition-all duration-1000"
                          style={{ width: `${percAlcancado}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
