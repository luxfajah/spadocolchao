import Link from "next/link"
import { revalidatePath } from "next/cache"
import { notFound, redirect } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  FileSearch,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import {
  getEmployeeMonthAttendanceSource,
  getMirrorByEmployeePeriod,
  recalculateEmployeeMonth,
} from "@/lib/attendance/service"

import { generateEmployeePayroll } from "../../folha/actions"
import { AttendancePeriodCalendar } from "../components/AttendancePeriodCalendar"
import { AttendanceHeroPeriodPicker } from "@/app/(admin)/rh/ponto/components/AttendanceHeroPeriodPicker"
import { ApprovedMirrorPdfButton } from "../components/ApprovedMirrorPdfButton"
import { PontoIndividualTable } from "../components/PontoIndividualTable"
import { checkMirrorLock, confirmMirrorChanges, enableMirrorEditing } from "./adjust-actions"

async function getAdvancedEspelhoData(
  employeeId: string,
  year: number,
  month: number,
  hasCollectedData: boolean
) {
  const period = `${year}-${String(month).padStart(2, "0")}`
  const startDate = new Date(Date.UTC(year, month - 1, 1))
  const endDate = new Date(Date.UTC(year, month, 0))

  const employee = await (prisma as any).employee.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      fullName: true,
      socialName: true,
      contractType: true,
      serialId: true,
      jobTitle: { select: { name: true } },
      workSchedule: true,
    },
  })

  if (!employee) return null

  const loadMirror = () => getMirrorByEmployeePeriod(employeeId, period)

  const loadStoredDays = () =>
    (prisma as any).attendanceDay.findMany({
      where: {
        employeeId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: "asc" },
    })

  let mirror = await loadMirror()
  let days = mirror?.days?.length ? mirror.days : await loadStoredDays()

  // Corrige espelhos antigos que ficaram apenas com os totais salvos,
  // mas sem a materialização diária do período.
  if (mirror && mirror.days.length === 0 && days.length === 0 && hasCollectedData && mirror.status === "GENERATED") {
    await recalculateEmployeeMonth(employeeId, year, month)
    mirror = await loadMirror()
    days = mirror?.days?.length ? mirror.days : await loadStoredDays()
  }

  return {
    employee,
    mirror,
    days,
    stats: mirror
      ? {
          expectedMinutes: mirror.expectedMinutes,
          workedMinutes: mirror.workedMinutes,
          overtimeMinutes: mirror.overtimeMinutes,
          deficitMinutes: mirror.deficitMinutes,
        }
      : null,
  }
}

function minToHour(min: number) {
  const hours = Math.floor(Math.abs(min) / 60)
  const minutes = Math.abs(min) % 60
  return `${hours}h${minutes > 0 ? `${minutes.toString().padStart(2, "0")}m` : ""}`
}

function formatPeriodLabel(period: string) {
  const match = period.match(/^(\d{4})-(\d{2})$/)

  if (!match) {
    return period
  }

  return `${match[2]}/${match[1]}`
}

function buildPointPageUrl(employeeId: string, month: number, year: number) {
  return `/rh/ponto/${employeeId}?mes=${month}&ano=${year}`
}

async function recalculateMonthAction(formData: FormData) {
  "use server"

  const employeeId = String(formData.get("employeeId") || "")
  const month = Number(formData.get("month"))
  const year = Number(formData.get("year"))

  if (!employeeId || !Number.isInteger(month) || !Number.isInteger(year)) {
    throw new Error("Dados inválidos para recálculo do espelho.")
  }

  const sourceState = await getEmployeeMonthAttendanceSource(employeeId, year, month)
  if (sourceState.importedPunches === 0) {
    throw new Error("Importe batidas reais deste período antes de processar o espelho.")
  }

  await recalculateEmployeeMonth(employeeId, year, month)
  revalidatePath(buildPointPageUrl(employeeId, month, year))
  revalidatePath(`/rh/funcionarios/${employeeId}`)
  revalidatePath("/rh/ponto/historico")
  redirect(buildPointPageUrl(employeeId, month, year))
}

async function enableEditingAction(formData: FormData) {
  "use server"

  const employeeId = String(formData.get("employeeId") || "")
  const period = String(formData.get("period") || "")
  const month = Number(formData.get("month"))
  const year = Number(formData.get("year"))

  if (!employeeId || !period || !Number.isInteger(month) || !Number.isInteger(year)) {
    throw new Error("Dados inválidos para habilitar edição.")
  }

  const mirror = await enableMirrorEditing(employeeId, period)
  revalidatePath(buildPointPageUrl(employeeId, month, year))
  revalidatePath(`/rh/funcionarios/${employeeId}`)
  revalidatePath(`/rh/ponto/espelho/${mirror.id}`)
  revalidatePath("/rh/ponto/historico")
  redirect(buildPointPageUrl(employeeId, month, year))
}

async function confirmMirrorAction(formData: FormData) {
  "use server"

  const employeeId = String(formData.get("employeeId") || "")
  const period = String(formData.get("period") || "")

  if (!employeeId || !period) {
    throw new Error("Dados inválidos para confirmar o espelho.")
  }

  const mirror = await confirmMirrorChanges(employeeId, period)
  revalidatePath(`/rh/ponto/${employeeId}`)
  revalidatePath(`/rh/funcionarios/${employeeId}`)
  revalidatePath(`/rh/ponto/espelho/${mirror.id}`)
  revalidatePath("/rh/ponto/historico")
  redirect(`/rh/ponto/espelho/${mirror.id}?autoDownload=1`)
}

async function generatePayrollAction(formData: FormData) {
  "use server"

  const employeeId = String(formData.get("employeeId") || "")
  const period = String(formData.get("period") || "")
  const mirrorId = String(formData.get("mirrorId") || "")

  if (!employeeId || !period) {
    throw new Error("Dados inválidos para gerar o holerite.")
  }

  const result = await generateEmployeePayroll(employeeId, period, mirrorId || undefined)
  redirect(`/rh/folha?period=${encodeURIComponent(result.period)}&funcionario=${encodeURIComponent(employeeId)}`)
}

export default async function EspelhoFuncionarioPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: { mes?: string; ano?: string; periodo?: string }
}) {
  const now = new Date()
  const periodMatch = searchParams?.periodo?.match(/^(\d{4})-(\d{2})$/)
  const month = periodMatch
    ? Number(periodMatch[2])
    : parseInt(searchParams?.mes || String(now.getMonth() + 1))
  const year = periodMatch
    ? Number(periodMatch[1])
    : parseInt(searchParams?.ano || String(now.getFullYear()))
  const attendanceSource = await getEmployeeMonthAttendanceSource(params.id, year, month)

  const data = await getAdvancedEspelhoData(params.id, year, month, attendanceSource.hasCollectedData)

  if (!data) notFound()

  const periodSlug = `${year}-${String(month).padStart(2, "0")}`
  const isLocked = await checkMirrorLock(params.id, periodSlug)

  const { employee, mirror, days, stats } = data
  const displayName = employee.socialName || employee.fullName
  const legalName = employee.socialName ? employee.fullName : null
  const monthLabel = format(new Date(year, month - 1, 1), "MMMM 'de' yyyy", { locale: ptBR })
  const hasImportedPunches = attendanceSource.importedPunches > 0
  const hasProcessedDays = days.length > 0
  const editingEnabled = !isLocked && (mirror?.status === "EDITING" || mirror?.status === "ADJUSTED")
  const lastMirrorUpdate = mirror?.updatedAt || mirror?.createdAt
  const canProcessSelectedPeriod = hasImportedPunches && !isLocked
  const canEnableEditing = canProcessSelectedPeriod && !!mirror?.id && hasProcessedDays
  const canConfirmMirror = canProcessSelectedPeriod && !!mirror?.id && hasProcessedDays
  const canPrintApprovedMirror = !!mirror?.id && hasImportedPunches && hasProcessedDays
  const recalculateLabel = mirror ? "Reprocessar Batidas" : "Processar Batidas"

  const mirrorStatusMeta: Record<string, { label: string; className: string; description: string }> = {
    GENERATED: {
      label: "Processado",
      className: "bg-slate-900 text-white",
      description: "Batidas importadas processadas e prontas para iniciar o tratamento.",
    },
    EDITING: {
      label: "Edição Liberada",
      className: "bg-amber-400 text-amber-950",
      description: "Batidas e abonos podem ser ajustados neste período.",
    },
    ADJUSTED: {
      label: "Tratado",
      className: "bg-indigo-500 text-white",
      description: "Há alterações manuais. Confirme o espelho para fechar a versão da folha.",
    },
    APPROVED: {
      label: "Fechado Para Folha",
      className: "bg-emerald-500 text-white",
      description: "Período fechado. Esta é a versão que deve ser usada no holerite.",
    },
  }

  const mirrorStatusInfo = mirror ? mirrorStatusMeta[mirror.status] || mirrorStatusMeta.GENERATED : null
  const canGeneratePayroll = canPrintApprovedMirror && !isLocked

  const flowSteps = [
    {
      label: "Liberar edições",
      done: !!mirror && ["EDITING", "ADJUSTED", "APPROVED"].includes(mirror.status),
    },
    {
      label: "Tratar período",
      done: !!mirror && ["ADJUSTED", "APPROVED"].includes(mirror.status),
    },
    {
      label: "Confirmar espelho",
      done: mirror?.status === "APPROVED",
    },
    {
      label: "Gerar holerite",
      done: isLocked,
    },
  ]

  return (
    <main className="flex-1 py-10 px-6 max-w-[1400px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <section className="relative overflow-hidden rounded-[3rem] border-0 bg-slate-950 text-white shadow-[0_45px_100px_-48px_rgba(15,23,42,0.9)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_36%),radial-gradient(circle_at_80%_20%,_rgba(16,185,129,0.18),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.94),_rgba(15,23,42,0.82))]" />
        <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-cyan-400/5 blur-3xl" />
        <div className="absolute -left-14 top-8 h-60 w-60 rounded-full bg-blue-500/5 blur-3xl transition-all duration-1000 group-hover:bg-blue-500/10" />
        
        <div className="relative p-8 md:p-14">
          <div className="grid gap-12 xl:grid-cols-[1fr_380px] items-center">
            <div className="flex flex-col gap-10">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
                <div className="flex items-center gap-6">
                  <Link href="/rh/ponto">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 shadow-2xl hover:bg-white/10 text-white transition-all hover:scale-105 active:scale-95"
                    >
                      <ArrowLeft className="h-6 w-6" />
                    </Button>
                  </Link>

                  <div className="h-24 w-24 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center text-white text-3xl font-black italic font-outfit shadow-[0_25px_60px_-15px_rgba(37,99,235,0.45)] ring-1 ring-white/10">
                    {displayName.slice(0, 2).toUpperCase()}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                      <ShieldCheck className="h-3 w-3 text-blue-400" />
                      Espelho Individual
                    </span>
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400">
                      Competência {formatPeriodLabel(periodSlug)}
                    </span>
                  </div>
                  <h1 className="text-5xl md:text-6xl font-black text-white font-outfit uppercase italic tracking-[ -0.04em] leading-none drop-shadow-2xl">
                    {displayName}
                  </h1>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                <div className="group/card rounded-[2.75rem] border border-white/10 bg-white/5 p-8 backdrop-blur-md transition-all hover:bg-white/[0.08] flex flex-col justify-center gap-4 min-h-[220px] shadow-2xl">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] group-hover/card:text-blue-400 transition-colors">Competência Ativa</p>
                    <div className="h-0.5 w-6 bg-blue-500/30 rounded-full" />
                  </div>
                  
                  <div>
                    <AttendanceHeroPeriodPicker 
                      employeeId={params.id} 
                      currentPeriod={periodSlug} 
                    />
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.7)] animate-pulse" />
                    <p className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.15em] italic">{monthLabel}</p>
                  </div>
                </div>

                <div className="group/card rounded-[2.75rem] border border-white/10 bg-white/5 p-8 backdrop-blur-md transition-all hover:bg-white/[0.08] min-h-[220px] shadow-2xl flex flex-col justify-center gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] group-hover/card:text-emerald-400 transition-colors">Situação do Espelho</p>
                    <div className="h-0.5 w-6 bg-emerald-500/30 rounded-full" />
                  </div>

                  <div>
                    <Badge className={`border-0 px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-black/30 w-fit ${mirrorStatusInfo?.className || "bg-slate-800 text-slate-400"}`}>
                      {mirrorStatusInfo?.label || "Pendente"}
                    </Badge>
                  </div>

                  <p className="text-[11px] font-bold text-slate-400 leading-relaxed italic line-clamp-2 uppercase tracking-wide opacity-70 group-hover/card:opacity-100 transition-opacity">
                    {mirrorStatusInfo?.description || "Aguardando processamento."}
                  </p>
                </div>

                <div className="group/card rounded-[2.75rem] border border-white/10 bg-white/5 p-8 backdrop-blur-md transition-all hover:bg-white/[0.08] min-h-[220px] shadow-2xl flex flex-col justify-center gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] group-hover/card:text-violet-400 transition-colors">Fluxo Operacional</p>
                    <div className="h-0.5 w-6 bg-violet-500/30 rounded-full" />
                  </div>

                  <div>
                    <p className="text-2xl font-black italic tracking-tight text-white font-outfit uppercase">
                      {isLocked ? "Bloqueado" : editingEnabled ? "Em Tratamento" : "Aguardando"}
                    </p>
                  </div>

                  <p className="text-[11px] font-bold text-slate-400 leading-relaxed italic line-clamp-2 uppercase tracking-wide opacity-70 group-hover/card:opacity-100 transition-opacity">
                    {isLocked ? "Holerite já gerado." : "Execute as etapas laterais."}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-8 backdrop-blur-md shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <ShieldCheck className="h-20 w-20 text-white" />
                </div>
                
                <h3 className="text-xl font-black italic font-outfit uppercase tracking-tight text-white">
                  Controle de Tratamento
                </h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Siga o fluxo recomendado para garantir a integridade dos dados antes do fechamento.
                </p>

                <div className="mt-8 space-y-3">
                  {flowSteps.map((step, index) => (
                    <div
                      key={step.label}
                      className={`flex items-center gap-4 rounded-2xl border px-4 py-3 transition-all duration-500 ${
                        step.done
                          ? "border-emerald-500/30 bg-emerald-500/10"
                          : "border-white/5 bg-white/[0.02]"
                      }`}
                    >
                      <div className={`h-8 w-8 rounded-xl flex items-center justify-center font-black text-[10px] ${
                        step.done ? "bg-emerald-500 text-white" : "bg-white/10 text-slate-400"
                      }`}>
                        {step.done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                      </div>
                      <span className={`text-[11px] font-black uppercase tracking-[0.1em] ${
                        step.done ? "text-emerald-400" : "text-slate-500"
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-lahomes border border-slate-50 group hover:border-blue-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Horas Trabalhadas</p>
            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
              <Clock className="h-5 w-5 text-blue-600 group-hover:text-white" />
            </div>
          </div>
          <p className="text-4xl font-black text-slate-900 font-outfit tabular-nums italic lowercase">
            {stats ? minToHour(stats.workedMinutes) : "--"}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.1em]">
              Meta: {stats ? minToHour(stats.expectedMinutes) : "--"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 shadow-lahomes border border-slate-50 group hover:border-emerald-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Horas Extras</p>
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
              <TrendingUp className="h-5 w-5 text-emerald-500 group-hover:text-white" />
            </div>
          </div>
          <p className="text-4xl font-black text-emerald-600 font-outfit tabular-nums italic lowercase">
            {stats && stats.overtimeMinutes > 0 ? `+${minToHour(stats.overtimeMinutes)}` : "--"}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.1em]">Acúmulo positivo</p>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 shadow-lahomes border border-slate-50 group hover:border-rose-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Débito / Atrasos</p>
            <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all shadow-sm">
              <TrendingDown className="h-5 w-5 text-rose-500 group-hover:text-white" />
            </div>
          </div>
          <p className="text-4xl font-black text-rose-600 font-outfit tabular-nums italic lowercase">
            {stats && stats.deficitMinutes > 0 ? `-${minToHour(stats.deficitMinutes)}` : "--"}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.1em]">Horas devidas</p>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 shadow-lahomes border border-slate-50 group hover:border-slate-300 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Última Ação</p>
            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
              <Award className="h-5 w-5 text-slate-600 group-hover:text-white" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-950 font-outfit uppercase italic tracking-tighter">
            {mirror?.status === "APPROVED" ? "Fechado" : mirror?.status === "ADJUSTED" ? "Tratado" : mirror ? "Em Edição" : "Pendente"}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-900" />
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.1em]">
              {lastMirrorUpdate ? format(lastMirrorUpdate, "dd/MM/yy HH:mm") : "Sem registro"}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] shadow-lahomes border border-slate-100 overflow-hidden">
        <div className="p-10 border-b border-slate-50 bg-slate-50/30 flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="font-outfit font-black text-2xl uppercase italic tracking-tight text-slate-950 leading-none">
              Tratamento materializado
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              Período de {monthLabel} pronto para conferência
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <form action={recalculateMonthAction}>
              <input type="hidden" name="employeeId" value={params.id} />
              <input type="hidden" name="month" value={month} />
              <input type="hidden" name="year" value={year} />
              <Button
                type="submit"
                disabled={!canProcessSelectedPeriod}
                className="rounded-2xl h-12 px-6 bg-slate-100 text-slate-900 hover:bg-slate-200 font-black text-[10px] uppercase tracking-widest border-0 transition-all active:scale-95"
              >
                {recalculateLabel}
              </Button>
            </form>

            <form action={enableEditingAction}>
              <input type="hidden" name="employeeId" value={params.id} />
              <input type="hidden" name="period" value={periodSlug} />
              <input type="hidden" name="month" value={month} />
              <input type="hidden" name="year" value={year} />
              <Button
                type="submit"
                disabled={!canEnableEditing}
                className={`rounded-2xl h-12 px-6 font-black text-[10px] uppercase tracking-widest border-0 shadow-lg transition-all active:scale-95 ${
                  editingEnabled 
                    ? "bg-amber-400 text-amber-950 shadow-amber-400/20 hover:bg-amber-500" 
                    : "bg-slate-950 text-white shadow-slate-950/20 hover:bg-slate-900"
                }`}
              >
                {editingEnabled ? "Edição Ativa" : "Habilitar Edição"}
              </Button>
            </form>

            <form action={confirmMirrorAction}>
              <input type="hidden" name="employeeId" value={params.id} />
              <input type="hidden" name="period" value={periodSlug} />
              <Button
                type="submit"
                disabled={!canConfirmMirror}
                className="rounded-2xl h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/30 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
              >
                Confirmar Espelho
              </Button>
            </form>

            {mirror?.id && (
              <ApprovedMirrorPdfButton
                mirrorId={mirror.id}
                disabled={!canPrintApprovedMirror}
                label="Imprimir Espelho"
                className="rounded-2xl h-12 px-6 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-[10px] uppercase tracking-widest"
              />
            )}

            <form action={generatePayrollAction}>
              <input type="hidden" name="employeeId" value={params.id} />
              <input type="hidden" name="period" value={periodSlug} />
              <input type="hidden" name="mirrorId" value={mirror?.id || ""} />
              <Button
                type="submit"
                disabled={!canGeneratePayroll}
                className="rounded-2xl h-12 px-8 bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/30 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
              >
                {isLocked ? "Folha Materializada" : "Processar Holerite"}
              </Button>
            </form>
          </div>
        </div>

        <div className="p-2">
          {days.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-10 bg-slate-50/50 rounded-[2.5rem] m-4 border border-dashed border-slate-200">
              <div className="h-24 w-24 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm flex items-center justify-center relative">
                <Clock className="h-10 w-10 text-slate-300 animate-pulse" />
                <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center font-black">?</div>
              </div>
              <div className="text-center max-w-sm space-y-3">
                <p className="font-black text-slate-950 uppercase tracking-[0.15em] text-sm italic font-outfit">Sem materialização ativa</p>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">
                  {hasImportedPunches
                    ? "As batidas estão importadas, mas o espelho ainda não foi materializado para este colaborador."
                    : "Importe o arquivo TXT do relógio oficial para liberar o tratamento deste colaborador."}
                </p>
              </div>
              <form action={recalculateMonthAction}>
                <input type="hidden" name="employeeId" value={params.id} />
                <input type="hidden" name="month" value={month} />
                <input type="hidden" name="year" value={year} />
                <Button
                  disabled={!canProcessSelectedPeriod}
                  className="rounded-2xl h-14 px-10 bg-slate-950 hover:bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-slate-950/40 gap-3 transition-all active:scale-95"
                >
                  {recalculateLabel}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </div>
          ) : (
            <div className="p-4">
              <PontoIndividualTable
                days={days}
                employeeId={params.id}
                isLocked={isLocked}
                editingEnabled={editingEnabled}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
