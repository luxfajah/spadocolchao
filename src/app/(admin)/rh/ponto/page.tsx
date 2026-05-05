import Link from "next/link"
import { CheckCircle2, Clock4, ClockAlert, Eye, Info } from "lucide-react"

import { PageHeader } from "@/components/layout/PageHeader"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  dedupeAttendanceMirrorsByPeriod,
  formatAttendancePeriodLabel,
} from "@/lib/attendance/period"
import { getEmployeeLegalName, getEmployeePrimaryName } from "@/lib/employee-name"
import { prisma } from "@/lib/prisma"

import { PontoImportButton } from "./PontoImportButton"
import { PontoEmployeeSearch } from "./components/PontoEmployeeSearch"

function formatHours(minutes?: number | null) {
  if (minutes === null || minutes === undefined) {
    return "--"
  }

  const totalMinutes = Math.abs(minutes)
  const hours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60

  return `${hours}h${String(remainingMinutes).padStart(2, "0")}`
}

function formatDateTime(value?: Date | string | null) {
  if (!value) {
    return "--"
  }

  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  })
}

export default async function PontoPage({
  searchParams,
}: {
  searchParams?: { q?: string }
}) {
  const q = searchParams?.q || ""
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const currentPeriod = `${currentYear}-${String(currentMonth).padStart(2, "0")}`

  const employees = await (prisma as any).employee.findMany({
    where: {
      AND: [
        ...(q
          ? [
              {
                OR: [
                  { fullName: { contains: q } },
                  { socialName: { contains: q } },
                ],
              },
            ]
          : []),
        {
          OR: [
            { timePunches: { some: {} } },
            { attendanceMirrors: { some: {} } },
            { attendanceDays: { some: {} } },
          ],
        },
      ],
    },
    select: {
      id: true,
      fullName: true,
      socialName: true,
      jobTitle: {
        select: {
          name: true,
        },
      },
      timePunches: {
        orderBy: { punchDateTime: "desc" },
        take: 1,
        select: {
          punchDateTime: true,
        },
      },
      attendanceMirrors: {
        orderBy: [{ endDate: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          period: true,
          startDate: true,
          endDate: true,
          workedMinutes: true,
          overtimeMinutes: true,
          deficitMinutes: true,
          status: true,
        },
      },
      payrolls: {
        orderBy: [{ referencePeriod: "desc" }, { createdAt: "desc" }],
        take: 1,
        select: {
          id: true,
          referencePeriod: true,
          notes: true,
        },
      },
      _count: {
        select: {
          timePunches: true,
          attendanceDays: true,
          attendanceMirrors: true,
          payrolls: true,
        },
      },
    },
    orderBy: { fullName: "asc" },
  })

  const displayData = employees.map((employee: any) => {
    const uniqueMirrors = dedupeAttendanceMirrorsByPeriod(employee.attendanceMirrors)
    const latestPunch = employee.timePunches[0] || null
    const latestMirror = uniqueMirrors[0] || null
    const latestPayroll = employee.payrolls[0] || null
    const historySummary = [
      employee._count.timePunches > 0 ? `${employee._count.timePunches} batidas` : null,
      employee._count.attendanceDays > 0 ? `${employee._count.attendanceDays} dias tratados` : null,
      employee._count.payrolls > 0 ? `${employee._count.payrolls} holerites` : null,
    ]
      .filter(Boolean)
      .join(" | ")

    return {
      id: employee.id,
      employeeId: employee.id,
      employeeName: getEmployeePrimaryName(employee),
      legalName: getEmployeeLegalName(employee),
      jobTitle: employee.jobTitle?.name || "Sem cargo",
      latestPunch,
      latestMirror,
      latestPayroll,
      timePunchesCount: employee._count.timePunches,
      attendanceDaysCount: employee._count.attendanceDays,
      mirrorsCount: uniqueMirrors.length,
      payrollsCount: employee._count.payrolls,
      historySummary,
    }
  })

  return (
    <main className="flex-1 py-10 px-6 max-w-[1700px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <section className="relative overflow-hidden rounded-[2.75rem] border-0 bg-slate-950 text-white shadow-[0_36px_90px_-48px_rgba(15,23,42,0.85)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_36%),radial-gradient(circle_at_80%_20%,_rgba(16,185,129,0.18),_transparent_28%),linear-gradient(135deg,_rgba(15,23,42,0.94),_rgba(15,23,42,0.82))]" />
        <div className="absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -left-14 top-8 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
        
        <div className="relative p-8 md:p-10">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                  <Clock4 className="h-6 w-6" />
                </div>
                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-slate-100">
                  Gestão de Frequência
                </span>
              </div>
              
              <div className="space-y-4">
                <h1 className="font-outfit text-4xl font-black uppercase italic tracking-tight text-white md:text-5xl">
                  Espelho de Ponto
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                  Visualize, trate e confirme as batidas de ponto dos colaboradores com histórico real importado. 
                  O fechamento mensal materializa a folha de pagamento.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {["Importacao de batidas", "Tratamento de faltas", "Fechamento de folha"].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-200"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 xl:flex-col xl:items-end xl:justify-center">
              <PontoImportButton className="rounded-2xl h-14 px-8 text-[11px] tracking-[0.12em] bg-white text-slate-950 hover:bg-slate-100 shadow-xl shadow-white/5 font-black uppercase" />
              <div className="flex gap-3">
                <Link href="/rh/ponto/historico">
                  <Button
                    variant="ghost"
                    className="rounded-2xl gap-2 border border-white/10 bg-white/5 hover:bg-white/10 text-white px-6 h-12 font-black text-[10px] uppercase tracking-[0.12em]"
                  >
                    Histórico Geral
                  </Button>
                </Link>
                <Link href="/rh/folha">
                  <Button
                    variant="ghost"
                    className="rounded-2xl gap-2 border border-white/10 bg-white/5 hover:bg-white/10 text-white px-6 h-12 font-black text-[10px] uppercase tracking-[0.12em]"
                  >
                    Fechamento de Folha
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-white/80 backdrop-blur-md p-6 rounded-[2.5rem] shadow-lahomes border border-slate-100">
        <PontoEmployeeSearch initialQuery={q} />
        <div className="bg-blue-50/50 border border-blue-100/50 rounded-full px-6 py-3 text-[10px] font-black text-blue-700 uppercase tracking-[0.15em] flex items-center gap-2">
          <Info className="w-3.5 h-3.5" /> 
          Abra o espelho ou a ficha do funcionário para consultar todo o histórico
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-lahomes border border-slate-50 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
              <ClockAlert className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <h3 className="font-outfit font-black text-xl uppercase italic tracking-tight text-slate-900 leading-none">
                Colaboradores ativos
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">
                Filtrando apenas por registros com histórico de ponto salvo
              </p>
            </div>
          </div>
          <Badge className="bg-slate-950 text-white border-0 px-4 py-2 rounded-full shadow-lg shadow-slate-950/20 font-black text-[10px] uppercase tracking-[0.18em]">
            Competência atual: {formatAttendancePeriodLabel(currentPeriod)}
          </Badge>
        </div>
        <div className="overflow-x-auto no-scrollbar custom-scrollbar">
          <Table className="min-w-[1100px]">
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="font-black text-slate-400 uppercase tracking-[0.18em] text-[10px] h-14 pl-10">
                  Funcionário
                </TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-[0.18em] text-[10px]">
                  Último Espelho Salvo
                </TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-[0.18em] text-[10px] text-center">
                  Trabalhado
                </TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-[0.18em] text-[10px] text-center">
                  Saldo
                </TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-[0.18em] text-[10px]">
                  Histórico
                </TableHead>
                <TableHead className="font-black text-slate-400 uppercase tracking-[0.18em] text-[10px]">
                  Status
                </TableHead>
                <TableHead className="text-right pr-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((employee: any) => (
                <TableRow
                  key={employee.id}
                  className="border-slate-50 h-24 group hover:bg-slate-50/50 transition-all duration-300"
                >
                  <TableCell className="pl-10">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-[1.25rem] bg-slate-900 flex items-center justify-center text-white text-sm font-black italic font-outfit shadow-lg shadow-slate-900/10 transition-transform group-hover:scale-110">
                        {employee.employeeName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-950 tracking-tight text-[15px] font-outfit uppercase italic">
                          {employee.employeeName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold tracking-[0.15em] uppercase mt-0.5">
                          {employee.jobTitle}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {employee.latestMirror ? (
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800 text-[11px] uppercase tracking-[0.15em]">
                          {formatAttendancePeriodLabel(
                            employee.latestMirror.period,
                            employee.latestMirror.startDate
                          )}
                        </span>
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.12em] mt-1">
                          Ate {new Date(employee.latestMirror.endDate).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-[10px] text-amber-500 font-black uppercase tracking-[0.12em] italic">
                          Aguardando geração
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-black text-slate-950 text-xs font-outfit tabular-nums">
                      {employee.latestMirror ? formatHours(employee.latestMirror.workedMinutes) : "--"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {employee.latestMirror ? (
                      <div className="flex flex-col items-center gap-1.5">
                        {employee.latestMirror.overtimeMinutes > 0 && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-black text-emerald-600 text-[9px] uppercase tracking-tighter shadow-sm border border-emerald-100/50">
                            +{formatHours(employee.latestMirror.overtimeMinutes)}
                          </span>
                        )}
                        {employee.latestMirror.deficitMinutes > 0 && (
                          <span className="rounded-full bg-rose-50 px-2 py-0.5 font-black text-rose-500 text-[9px] uppercase tracking-tighter shadow-sm border border-rose-100/50">
                            -{formatHours(employee.latestMirror.deficitMinutes)}
                          </span>
                        )}
                        {employee.latestMirror.overtimeMinutes === 0 && employee.latestMirror.deficitMinutes === 0 && (
                          <span className="text-slate-300 font-black text-[10px]">--</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300 font-black text-[10px]">--</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-black text-slate-700 text-[10px] uppercase tracking-[0.14em]">
                        {employee.mirrorsCount} registros
                      </span>
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.12em] mt-1 line-clamp-1 max-w-[150px]">
                        {employee.historySummary || "Importado"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {employee.latestMirror?.status === "APPROVED" ? (
                      <Badge className="bg-emerald-500 text-white border-0 px-3 py-1 shadow-sm font-black text-[9px] uppercase tracking-[0.12em] gap-1 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Fechado
                      </Badge>
                    ) : employee.latestMirror?.status === "ADJUSTED" ? (
                      <Badge className="bg-slate-900 text-white border-0 px-3 py-1 shadow-sm font-black text-[9px] uppercase tracking-[0.12em] gap-1 rounded-full italic">
                        Tratado
                      </Badge>
                    ) : employee.latestMirror?.status === "EDITING" ? (
                      <Badge className="bg-amber-400 text-amber-950 border-0 px-3 py-1 shadow-sm font-black text-[9px] uppercase tracking-[0.12em] gap-1 rounded-full">
                        Edição
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-400 border-0 px-3 py-1 shadow-none font-black text-[9px] uppercase tracking-[0.12em] rounded-full">
                        Pendente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-10">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                      <Link href={`/rh/ponto/${employee.employeeId}`}>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="rounded-xl font-black uppercase tracking-[0.15em] text-[9px] text-white bg-slate-900 hover:bg-slate-800 shadow-md gap-1.5 h-9 px-4"
                        >
                          <Eye className="h-3.5 w-3.5 text-blue-400" /> Abrir Espelho
                        </Button>
                      </Link>
                      <Link href={`/rh/funcionarios/${employee.employeeId}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl font-black uppercase tracking-[0.15em] text-[9px] text-slate-500 hover:text-slate-900 h-9 px-4"
                        >
                          Ficha RH
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {displayData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-52 border-none">
                    <div className="flex flex-col items-center justify-center gap-4 px-6 text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                        <ClockAlert className="h-6 w-6" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-black uppercase tracking-widest text-slate-700">
                          Nenhum funcionário com histórico de ponto encontrado.
                        </p>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                          Importe o arquivo TXT do relógio para carregar as batidas e montar os espelhos.
                        </p>
                      </div>
                      <PontoImportButton className="rounded-2xl px-6" />
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </main>
  )
}
