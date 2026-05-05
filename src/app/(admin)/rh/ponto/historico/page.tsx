import Link from "next/link"
import { Calendar, CheckCircle2, Eye, History } from "lucide-react"

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
import { formatAttendancePeriodLabel } from "@/lib/attendance/period"
import { getEmployeeLegalName, getEmployeePrimaryName } from "@/lib/employee-name"
import { prisma } from "@/lib/prisma"

import { PontoHistoryEmployeeFilter } from "./PontoHistoryEmployeeFilter"

function formatHours(minutes?: number | null) {
  if (!minutes) {
    return "--"
  }

  return `${(minutes / 60).toFixed(1)}h`
}

export default async function PontoHistoricoPage({
  searchParams,
}: {
  searchParams?: { q?: string; employeeId?: string }
}) {
  const q = searchParams?.q?.trim() || ""
  const selectedEmployeeId = searchParams?.employeeId || ""

  const employeeFilters = []

  if (selectedEmployeeId) {
    employeeFilters.push({ id: selectedEmployeeId })
  }

  if (q) {
    employeeFilters.push({ fullName: { contains: q } })
    employeeFilters.push({ socialName: { contains: q } })
  }

  const employeeOptions =
    employeeFilters.length > 0
      ? await (prisma as any).employee.findMany({
          where: {
            AND: [
              { attendanceMirrors: { some: {} } },
              { OR: employeeFilters },
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
          },
          orderBy: { fullName: "asc" },
        })
      : []

  const selectedEmployee =
    (selectedEmployeeId
      ? employeeOptions.find((employee: any) => employee.id === selectedEmployeeId)
      : null) ||
    (selectedEmployeeId
      ? await (prisma as any).employee.findFirst({
          where: {
            id: selectedEmployeeId,
            attendanceMirrors: { some: {} },
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
          },
        })
      : null)

  const mirrors = selectedEmployee
    ? await (prisma as any).attendanceMirror.findMany({
        where: {
          employeeId: selectedEmployee.id,
        },
        include: {
          employee: {
            select: {
              fullName: true,
              socialName: true,
            },
          },
        },
        orderBy: [{ endDate: "desc" }, { createdAt: "desc" }],
      })
    : []

  const resultCount = selectedEmployee ? mirrors.length : employeeOptions.length
  const resultLabel = selectedEmployee ? "Espelhos" : "Funcionários"
  const selectedEmployeeName = selectedEmployee ? getEmployeePrimaryName(selectedEmployee) : null
  const selectedEmployeeLegalName = selectedEmployee ? getEmployeeLegalName(selectedEmployee) : null

  const emptyStateMessage = !q && !selectedEmployeeId
    ? "Digite o nome de um funcionário para localizar o histórico."
    : q && employeeOptions.length === 0
      ? "Nenhum funcionário encontrado para esse nome."
      : !selectedEmployee
        ? "Selecione um funcionário para ver todos os espelhos dele."
        : "Este funcionário ainda não possui espelhos salvos."

  return (
    <main className="flex-1 py-10 px-6 max-w-[1700px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <PageHeader
        title="Histórico de Espelhos"
        subtitle="Busque por nome, selecione o funcionário e consulte todos os espelhos salvos para ele."
        icon={<History className="h-8 w-8 text-indigo-500" />}
        actions={
          <Link href="/rh/ponto">
            <Button
              variant="secondary"
              className="rounded-full gap-2 bg-white border border-slate-100 hover:bg-slate-50 shadow-sm transition-all px-8 h-12 font-black text-xs uppercase tracking-[0.1em] text-slate-600"
            >
              Voltar para Atual
            </Button>
          </Link>
        }
      />

      <div className="bg-white p-8 rounded-[2.5rem] shadow-lahomes border border-slate-50 flex flex-col xl:flex-row gap-8 items-start xl:items-center justify-between">
        <div className="flex flex-col gap-2 w-full xl:max-w-sm">
          <h4 className="text-sm font-black text-slate-800 font-outfit uppercase tracking-tight">
            Buscar Histórico
          </h4>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Pesquise por nome e selecione o colaborador para abrir todos os espelhos dele.
          </p>
          {selectedEmployeeName && (
            <div className="flex flex-col gap-1 pt-2">
              <span className="text-xs font-black uppercase tracking-widest text-indigo-700">
                Exibindo {selectedEmployeeName}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {selectedEmployeeLegalName ? `Legal: ${selectedEmployeeLegalName} | ` : ""}
                {selectedEmployee.jobTitle?.name || "Sem cargo"}
              </span>
            </div>
          )}
        </div>

        <PontoHistoryEmployeeFilter
          initialQuery={q}
          selectedEmployeeId={selectedEmployeeId}
          employeeOptions={employeeOptions.map((employee: any) => ({
            id: employee.id,
            label: getEmployeePrimaryName(employee),
            meta: employee.jobTitle?.name || getEmployeeLegalName(employee) || null,
          }))}
        />

        <div className="flex items-center gap-6 px-6 py-3 bg-slate-50 rounded-3xl border border-slate-100/50 self-stretch xl:self-auto">
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">
              {resultLabel}
            </p>
            <p className="text-2xl font-black text-indigo-600 font-outfit leading-none">{resultCount}</p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100 text-slate-300">
            <History className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-lahomes border border-slate-50 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-50/30">
          <div className="flex items-center gap-2 text-indigo-800">
            <History className="w-5 h-5 text-indigo-500" />
            <h3 className="font-outfit font-black text-lg uppercase tracking-tight">
              {selectedEmployeeName ? `Todos os espelhos de ${selectedEmployeeName}` : "Selecione um funcionário"}
            </h3>
          </div>
          {selectedEmployeeName && (
            <Badge className="bg-white text-indigo-600 border border-indigo-100 px-4 py-1.5 shadow-none font-black text-[10px] uppercase tracking-wider">
              {mirrors.length} espelhos salvos
            </Badge>
          )}
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <Table className="min-w-[1100px]">
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] h-14 pl-8">
                  Funcionário / Período
                </TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] text-center">
                  Data Geração
                </TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] text-center">
                  Trabalhado
                </TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] text-center">
                  Extras
                </TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] text-center">
                  Faltas
                </TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">
                  Status
                </TableHead>
                <TableHead className="text-right pr-8"></TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {mirrors.map((mirror: any) => (
                <TableRow
                  key={mirror.id}
                  className="border-slate-50 h-20 group hover:bg-slate-50/50 transition-colors"
                >
                  <TableCell className="pl-8">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-800 tracking-tight text-sm font-outfit uppercase">
                        {getEmployeePrimaryName(mirror.employee)}
                      </span>
                      {getEmployeeLegalName(mirror.employee) && (
                        <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">
                          Legal: {getEmployeeLegalName(mirror.employee)}
                        </span>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3 text-indigo-400" />
                        <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
                          {formatAttendancePeriodLabel(mirror.period, mirror.startDate)}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-slate-600">
                        {new Date(mirror.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                      <span className="text-[9px] text-slate-300 font-bold">
                        {new Date(mirror.createdAt).toLocaleTimeString("pt-BR")}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-center font-bold text-slate-600 text-xs">
                    {formatHours(mirror.workedMinutes)}
                  </TableCell>

                  <TableCell className="text-center font-black text-emerald-600 text-sm">
                    {mirror.overtimeMinutes > 0 ? `+${formatHours(mirror.overtimeMinutes)}` : "--"}
                  </TableCell>

                  <TableCell className="text-center font-bold text-rose-500 text-xs">
                    {mirror.deficitMinutes > 0 ? `-${formatHours(mirror.deficitMinutes)}` : "--"}
                  </TableCell>

                  <TableCell>
                    <Badge
                      className={`border-none px-3 py-1 font-black text-[9px] uppercase tracking-wider gap-1 ${
                        mirror.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-600"
                          : mirror.status === "ADJUSTED"
                            ? "bg-indigo-50 text-indigo-600"
                            : mirror.status === "EDITING"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {mirror.status === "APPROVED"
                        ? "Fechado"
                        : mirror.status === "ADJUSTED"
                          ? "Tratado"
                          : mirror.status === "EDITING"
                            ? "Em Edição"
                            : "Gerado"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <Link href={`/rh/ponto/espelho/${mirror.id}`}>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="rounded-xl font-bold uppercase tracking-widest text-[9px] text-indigo-600 bg-indigo-50 border-indigo-100 hover:bg-indigo-100 shadow-sm gap-2"
                        >
                          <Eye className="h-3.5 w-3.5" /> Visualizar
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {mirrors.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center h-44 text-slate-400 font-bold uppercase tracking-widest text-xs border-none"
                  >
                    {emptyStateMessage}
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
