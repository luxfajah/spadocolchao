import { PageHeader } from "@/components/layout/PageHeader"
import {
  CalendarDays,
  Clock,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  BadgeAlert,
  Calendar as CalendarIcon,
  User,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  formatAttendanceDate,
  formatBusinessTime,
  getStoredAttendanceWeekDay,
} from "@/lib/attendance/business-time"
import { getEmployeeLegalName, getEmployeePrimaryName } from "@/lib/employee-name"
import { MirrorDetailHeaderActions } from "./MirrorDetailHeaderActions"

export default async function EspelhoDetalhePage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: { autoDownload?: string }
}) {
  const mirror = await (prisma as any).attendanceMirror.findUnique({
    where: { id: params.id },
    include: {
      employee: {
        include: {
          jobTitle: true,
          workSchedule: true
        }
      },
      days: {
        orderBy: { date: "asc" }
      }
    }
  })

  if (!mirror) return <div>Espelho não encontrado</div>

  const primaryName = getEmployeePrimaryName(mirror.employee)
  const legalName = getEmployeeLegalName(mirror.employee)

  const statusMap: Record<string, { label: string, color: string, bg: string }> = {
    WORKED_COMPLETE: { label: "Completo", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
    WORKED_INCOMPLETE: { label: "Incompleto", color: "text-amber-700", bg: "bg-amber-50 border-amber-100" },
    ABSENT: { label: "Falta", color: "text-rose-700", bg: "bg-rose-50 border-rose-100" },
    WEEKLY_REST: { label: "DSR", color: "text-slate-500", bg: "bg-slate-50 border-slate-100" },
    WEEKLY_REST_WORKED: { label: "DSR Trab.", color: "text-slate-700", bg: "bg-slate-100 border-slate-200" },
    HOLIDAY: { label: "Feriado", color: "text-purple-700", bg: "bg-purple-50 border-purple-100" },
    HOLIDAY_WORKED: { label: "Feriado Trab.", color: "text-purple-700", bg: "bg-purple-50 border-purple-100" },
    VACATION: { label: "Férias", color: "text-blue-700", bg: "bg-blue-50 border-blue-100" },
    LEAVE: { label: "Afast.", color: "text-orange-700", bg: "bg-orange-50 border-orange-100" },
    ADJUSTED: { label: "Ajustado", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-100" },
    NO_SCHEDULE: { label: "S/ Escala", color: "text-slate-400", bg: "bg-slate-50 border-slate-50" },
  }

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins.toString().padStart(2, "0")}m`
  }

  return (
    <main id="mirror-content" className="flex-1 py-10 px-6 max-w-[1700px] mx-auto space-y-8 animate-in fade-in duration-700 pb-20 bg-white">
      <div className="hidden border-b-2 border-slate-900 pb-6 mb-8 print:flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black font-outfit uppercase">SPA DO COLCHÃO</h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">CNPJ: 00.000.000/0001-00 • Relatório de Espelho de Ponto</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data de Emissão</p>
          <p className="text-sm font-bold font-outfit">{new Date().toLocaleDateString("pt-BR")}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-2">
        <Link href="/rh/ponto/historico">
          <Button variant="ghost" size="icon" className="rounded-full bg-white border border-slate-100 h-10 w-10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="h-6 w-[1px] bg-slate-200" />
        <Badge variant="outline" className="rounded-full px-4 h-6 border-indigo-200 text-indigo-600 font-black text-[9px] uppercase tracking-widest bg-indigo-50/30">
          ID: {mirror.id.slice(-8).toUpperCase()}
        </Badge>
      </div>

      <PageHeader
        title={`Espelho de Ponto • ${mirror.period}`}
        subtitle={`Visualização detalhada das batidas de ${primaryName}${legalName ? ` (legal: ${legalName})` : ""}.`}
        icon={<CalendarDays className="h-8 w-8 text-indigo-600" />}
        actions={
          <MirrorDetailHeaderActions
            mirrorId={mirror.id}
            employeeId={mirror.employeeId}
            period={mirror.period}
            canGeneratePayroll={mirror.status === "APPROVED"}
            autoOpenPdf={searchParams?.autoDownload === "1"}
          />
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-lahomes border border-slate-100 p-8 space-y-6">
            <div className="flex flex-col items-center text-center pb-6 border-b border-slate-50">
              <div className="h-20 w-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                <User className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="font-black text-lg text-slate-800 font-outfit uppercase tracking-tight leading-tight">
                {primaryName}
              </h3>
              {legalName && (
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.18em] mt-2">
                  Legal: {legalName}
                </p>
              )}
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
                {mirror.employee.jobTitle?.name || "Cargo não definido"}
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Escala</p>
                  <p className="text-xs font-bold text-slate-700">{mirror.employee.workSchedule?.name || "Fallback 44h"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <CalendarIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Período</p>
                  <p className="text-xs font-bold text-slate-700">
                    {formatAttendanceDate(mirror.startDate)} - {formatAttendanceDate(mirror.endDate)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-700 to-indigo-600 rounded-[2.5rem] shadow-xl p-8 text-white relative overflow-hidden">
            <div className="absolute bottom-0 right-0 p-8 pt-4 opacity-10">
              <TrendingUp className="h-24 w-24" />
            </div>
            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em] mb-4">Resumo da Competência</p>

            <div className="space-y-6">
              <div>
                <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest">Horas Trabalhadas</p>
                <p className="text-3xl font-black font-outfit">{formatMinutes(mirror.workedMinutes)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-bold text-emerald-300 uppercase tracking-widest">Extras</p>
                  <p className="text-xl font-black font-outfit text-emerald-400">+{formatMinutes(mirror.overtimeMinutes)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-rose-300 uppercase tracking-widest">Faltas</p>
                  <p className="text-xl font-black font-outfit text-rose-400">-{formatMinutes(mirror.deficitMinutes)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-[2.5rem] shadow-lahomes border border-slate-50 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                  <CalendarDays className="h-5 w-5 text-indigo-500" />
                </div>
                <h3 className="font-outfit font-black text-xl uppercase tracking-tight text-slate-800">Cálculo Diário</h3>
              </div>
              <Badge className="bg-emerald-50 text-emerald-600 border-none px-4 py-1.5 h-8 font-black text-[10px] uppercase tracking-wider gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" /> Geração Validada
              </Badge>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <Table>
                <TableHeader className="bg-white">
                  <TableRow className="hover:bg-transparent border-slate-100 h-14">
                    <TableHead className="w-40 pl-8 font-black text-slate-400 uppercase tracking-widest text-[10px]">Dia / Data</TableHead>
                    <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] text-center">Entrada</TableHead>
                    <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] text-center">Saída Almoço</TableHead>
                    <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] text-center">Volta Almoço</TableHead>
                    <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] text-center">Saída</TableHead>
                    <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px] text-center">Trabalhado</TableHead>
                    <TableHead className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Status / Anomalia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mirror.days.map((day: any) => {
                    const isWeekend = [0, 6].includes(getStoredAttendanceWeekDay(day.date))
                    const status = statusMap[day.status] || statusMap.NO_SCHEDULE
                    const anomalies = day.anomalies ? JSON.parse(day.anomalies) : []

                    return (
                      <TableRow key={day.id} className={`h-16 group transition-colors ${isWeekend ? "bg-slate-50/50" : "hover:bg-indigo-50/20"}`}>
                        <TableCell className="pl-8">
                          <div className="flex flex-col">
                            <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${isWeekend ? "text-indigo-400" : "text-slate-400"}`}>
                              {formatAttendanceDate(day.date, { weekday: "long" })}
                            </span>
                            <span className="text-sm font-black text-slate-800 font-outfit uppercase tracking-tighter">
                              {formatAttendanceDate(day.date)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-bold text-slate-600 text-xs">{day.firstIn ? formatBusinessTime(day.firstIn) : "--:--"}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-bold text-slate-600 text-xs">{day.lunchOut ? formatBusinessTime(day.lunchOut) : "--:--"}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-bold text-slate-600 text-xs">{day.lunchIn ? formatBusinessTime(day.lunchIn) : "--:--"}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-bold text-slate-600 text-xs">{day.lastOut ? formatBusinessTime(day.lastOut) : "--:--"}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-700 font-outfit">{day.workedMinutes > 0 ? formatMinutes(day.workedMinutes) : "--"}</span>
                            {day.overtimeMinutes > 0 && <span className="text-[9px] font-black text-emerald-500">+{formatMinutes(day.overtimeMinutes)}</span>}
                            {day.deficitMinutes > 0 && <span className="text-[9px] font-black text-rose-500">-{formatMinutes(day.deficitMinutes)}</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={`border-none px-3 py-1 font-black text-[9px] uppercase tracking-wider ${status.bg} ${status.color}`}>
                              {status.label}
                            </Badge>
                            {anomalies.length > 0 && (
                              <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center" title={anomalies.join(", ")}>
                                <BadgeAlert className="h-3 w-3 text-amber-600" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="mt-8 p-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] flex items-center gap-4">
            <div className="h-10 w-10 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <p className="text-xs font-medium text-slate-500 max-w-2xl leading-relaxed">
              Este documento é uma representação digital das batidas registradas no período.
              Tratamentos de anomalias pontuais podem ter sido aplicados conforme as regras de negócio vigentes (Tolerância: 5 min).
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
