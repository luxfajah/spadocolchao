"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  Clock,
  AlertCircle,
  FileText,
  FileDown,
  Loader2,
  CalendarDays,
  CreditCard,
} from "lucide-react"
import { downloadPayrollPdfAction } from "../actions"
import { Badge } from "@/components/ui/badge"

interface PontoHistoryViewProps {
  data: {
    periods?: {
      period: string
      startDate: Date | string
      endDate: Date | string
    }[]
    activeMirror?: {
      id: string
      period: string
      startDate: Date | string
      endDate: Date | string
      expectedMinutes: number
      workedMinutes: number
      overtimeMinutes: number
      deficitMinutes: number
      status: string
      days: {
        id: string
        date: Date | string
        expectedMinutes: number
        workedMinutes: number
        overtimeMinutes: number
        deficitMinutes: number
        firstIn: Date | string | null
        lunchOut: Date | string | null
        lunchIn: Date | string | null
        lastOut: Date | string | null
        status: string
        anomalies: string[]
      }[]
    } | null
    payrolls?: {
      id: string
      referencePeriod: string
      netSalary: number
      grossSalary: number
      status: string
      createdAt: Date | string
    }[]
    targetPeriod?: string
    error?: string
  }
}

function formatHours(minutes?: number | null) {
  if (minutes === null || minutes === undefined) {
    return "--"
  }
  const totalMinutes = Math.abs(minutes)
  const hours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60
  return `${hours}h${String(remainingMinutes).padStart(2, "0")}`
}

function formatPunchTime(dateInput?: Date | string | null) {
  if (!dateInput) return "--"
  return new Date(dateInput).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  })
}

function formatDateLabel(dateInput: Date | string) {
  const d = new Date(dateInput)
  const day = String(d.getUTCDate()).padStart(2, "0")
  const month = String(d.getUTCMonth() + 1).padStart(2, "0")
  const weekday = d.toLocaleDateString("pt-BR", { weekday: "short", timeZone: "UTC" })
  return {
    date: `${day}/${month}`,
    weekday: weekday.substring(0, 3).toUpperCase(),
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function triggerBrowserDownload(fileUrl: string, documentName: string) {
  if (typeof window === "undefined") return
  const downloadLink = document.createElement("a")
  downloadLink.href = fileUrl
  downloadLink.download = `${documentName}.pdf`
  downloadLink.rel = "noopener"
  document.body.appendChild(downloadLink)
  downloadLink.click()
  document.body.removeChild(downloadLink)
}

export function PontoHistoryView({ data }: PontoHistoryViewProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"ponto" | "holerite">("ponto")
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const period = e.target.value
    startTransition(() => {
      router.push(`/app-ponto/historico?period=${period}`)
    })
  }

  const handleDownloadPayroll = async (payrollId: string) => {
    if (downloadingId) return
    setDownloadingId(payrollId)

    try {
      const res = await downloadPayrollPdfAction(payrollId)
      if (res.error) {
        alert("Erro ao baixar holerite: " + res.error)
      } else if (res.fileUrl && res.documentName) {
        triggerBrowserDownload(res.fileUrl, res.documentName)
      }
    } catch (err: any) {
      alert("Erro ao baixar holerite: " + err.message)
    } finally {
      setDownloadingId(null)
    }
  }

  // Formatar competência (ex: "2026-06" -> "Junho de 2026")
  const getPeriodLabel = (period?: string) => {
    if (!period) return "Competência Atual"
    const [year, month] = period.split("-")
    const date = new Date(Number(year), Number(month) - 1, 1)
    const monthName = date.toLocaleDateString("pt-BR", { month: "long" })
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} / ${year}`
  }

  if (data.error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[80vh]">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Erro ao carregar histórico</h2>
        <p className="text-slate-400 max-w-sm mb-6">{data.error}</p>
        <Link
          href="/app-ponto"
          className="bg-slate-900 border border-slate-800 text-white font-semibold py-3 px-6 rounded-xl"
        >
          Voltar ao Ponto
        </Link>
      </div>
    )
  }

  const mirror = data.activeMirror
  const periods = data.periods || []
  const payrolls = data.payrolls || []

  return (
    <div className="px-4 py-8 max-w-md mx-auto space-y-6">
      {/* Header */}
      <header className="flex items-center gap-4">
        <Link
          href="/app-ponto"
          className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h2 className="text-xl font-black font-outfit uppercase tracking-tight text-white italic leading-none">
            Histórico e Holerites
          </h2>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">
            Seus registros e holerites
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex bg-slate-900/60 p-1.5 rounded-2xl border border-slate-900/80">
        <button
          onClick={() => setActiveTab("ponto")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === "ponto"
              ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10"
              : "text-slate-450 hover:text-slate-200"
          }`}
        >
          <CalendarDays size={14} />
          Ponto
        </button>
        <button
          onClick={() => setActiveTab("holerite")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            activeTab === "holerite"
              ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/10"
              : "text-slate-450 hover:text-slate-200"
          }`}
        >
          <CreditCard size={14} />
          Holerites
        </button>
      </div>

      {activeTab === "ponto" ? (
        <>
          {/* Seletor de Período */}
          <div className="flex flex-col gap-2 p-4 rounded-3xl bg-slate-900/40 border border-slate-900 relative">
            {isPending && (
              <div className="absolute inset-0 bg-slate-950/60 rounded-3xl flex items-center justify-center z-10">
                <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
              </div>
            )}
            <label
              htmlFor="period-select"
              className="text-[9px] font-black uppercase tracking-widest text-slate-500"
            >
              Escolher Mês
            </label>
            <select
              id="period-select"
              value={data.targetPeriod || ""}
              onChange={handlePeriodChange}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wider text-white focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer"
            >
              {periods.length === 0 ? (
                <option value={data.targetPeriod}>{getPeriodLabel(data.targetPeriod)}</option>
              ) : (
                periods.map((p) => (
                  <option key={p.period} value={p.period}>
                    {getPeriodLabel(p.period)}
                  </option>
                ))
              )}
            </select>
          </div>

          {!mirror ? (
            <section className="rounded-[2rem] bg-slate-900/50 border border-slate-900 p-8 text-center space-y-3">
              <Calendar className="w-10 h-10 text-slate-500 mx-auto" />
              <p className="font-bold text-sm text-slate-400 uppercase tracking-wider">
                Nenhum espelho gerado para este período.
              </p>
            </section>
          ) : (
            <>
              {/* Totais de Horas Card */}
              <section className="rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-900 p-6 space-y-5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />

                <div className="flex justify-between items-center border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                      Resumo de Horas
                    </span>
                  </div>
                  <Badge
                    className={`border-0 font-black text-[9px] uppercase tracking-wider rounded-full px-2.5 py-1 ${
                      mirror.status === "APPROVED"
                        ? "bg-emerald-500 text-white"
                        : mirror.status === "ADJUSTED"
                        ? "bg-cyan-500 text-slate-950"
                        : "bg-amber-400 text-slate-950"
                    }`}
                  >
                    {mirror.status === "APPROVED"
                      ? "Fechado"
                      : mirror.status === "ADJUSTED"
                      ? "Tratado"
                      : "Pendente"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                      Horas Previstas
                    </p>
                    <p className="font-outfit font-black text-xl text-white tabular-nums">
                      {formatHours(mirror.expectedMinutes)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                      Horas Trabalhadas
                    </p>
                    <p className="font-outfit font-black text-xl text-white tabular-nums">
                      {formatHours(mirror.workedMinutes)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                      Saldo de Extras
                    </p>
                    <p className="font-outfit font-black text-xl text-emerald-400 tabular-nums">
                      +{formatHours(mirror.overtimeMinutes)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                      Saldo de Faltas/Atrasos
                    </p>
                    <p className="font-outfit font-black text-xl text-red-400 tabular-nums">
                      -{formatHours(mirror.deficitMinutes)}
                    </p>
                  </div>
                </div>
              </section>

              {/* Diário de Batidas */}
              <section className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Diário de Frequência
                </h3>

                <div className="space-y-2.5 animate-in fade-in duration-300">
                  {mirror.days.map((day: any) => {
                    const dateParts = formatDateLabel(day.date)
                    const hasAnomalies = day.anomalies && day.anomalies.length > 0
                    const isOffDay = day.status === "WEEKLY_REST" || day.status === "HOLIDAY"
                    const isAbsent = day.status === "ABSENT"

                    return (
                      <div
                        key={day.id}
                        className={`rounded-3xl border p-4 flex gap-4 transition-all hover:bg-slate-900/40 ${
                          isAbsent
                            ? "bg-red-500/5 border-red-500/10"
                            : hasAnomalies
                            ? "bg-amber-500/5 border-amber-500/10"
                            : "bg-slate-900/30 border-slate-900/60"
                        }`}
                      >
                        {/* Data Indicator */}
                        <div className="flex flex-col items-center justify-center w-12 border-r border-slate-800 pr-4">
                          <span className="font-outfit font-black text-[16px] text-white leading-none">
                            {dateParts.date}
                          </span>
                          <span className="text-[8px] font-black text-slate-500 mt-1">
                            {dateParts.weekday}
                          </span>
                        </div>

                        {/* Punch details */}
                        <div className="flex-1 flex flex-col justify-center space-y-1.5">
                          <div className="flex flex-wrap gap-x-2 gap-y-1 text-slate-300">
                            {day.firstIn || day.lunchOut || day.lunchIn || day.lastOut ? (
                              <div className="text-xs font-outfit font-bold tracking-wider text-cyan-400 flex items-center gap-1.5 flex-wrap">
                                <span className="tabular-nums">{formatPunchTime(day.firstIn)}</span>
                                <span className="text-slate-700">|</span>
                                <span className="tabular-nums">{formatPunchTime(day.lunchOut)}</span>
                                <span className="text-slate-700">|</span>
                                <span className="tabular-nums">{formatPunchTime(day.lunchIn)}</span>
                                <span className="text-slate-700">|</span>
                                <span className="tabular-nums">{formatPunchTime(day.lastOut)}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                                {isOffDay ? "Folga / DSR" : isAbsent ? "Falta" : "Sem registro"}
                              </span>
                            )}
                          </div>

                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-500 font-bold uppercase tracking-widest">
                              Trabalhado: {formatHours(day.workedMinutes)}
                            </span>

                            <div className="flex items-center gap-1">
                              {day.overtimeMinutes > 0 && (
                                <span className="text-emerald-400 font-black font-outfit">
                                  +{formatHours(day.overtimeMinutes)}
                                </span>
                              )}
                              {day.deficitMinutes > 0 && (
                                <span className="text-red-400 font-black font-outfit">
                                  -{formatHours(day.deficitMinutes)}
                                </span>
                              )}
                              {day.deficitMinutes === 0 && day.overtimeMinutes === 0 && !isOffDay && (
                                <span className="text-slate-600 font-bold uppercase tracking-widest">
                                  OK
                                </span>
                              )}
                            </div>
                          </div>

                          {day.anomalies && day.anomalies.length > 0 && (
                            <div className="mt-1 flex items-start gap-1 text-[9px] font-black text-amber-500 uppercase tracking-tight">
                              <AlertCircle size={10} className="mt-0.5 shrink-0" />
                              <span className="line-clamp-1">{day.anomalies.join(" • ")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            </>
          )}
        </>
      ) : (
        /* Aba de Holerites */
        <section className="space-y-4 animate-in fade-in duration-300">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Seus Holerites Publicados
          </h3>

          <div className="space-y-2.5">
            {payrolls.length === 0 ? (
              <div className="rounded-[2rem] bg-slate-900/50 border border-slate-900 p-8 text-center space-y-3">
                <FileText className="w-10 h-10 text-slate-500 mx-auto" />
                <p className="font-bold text-sm text-slate-400 uppercase tracking-wider">
                  Nenhum holerite publicado.
                </p>
                <p className="text-xs text-slate-500">
                  Os holerites aparecem aqui assim que forem fechados e publicados pelo RH.
                </p>
              </div>
            ) : (
              payrolls.map((payroll) => {
                const isDownloading = downloadingId === payroll.id
                return (
                  <div
                    key={payroll.id}
                    className="rounded-3xl border border-slate-900 bg-slate-900/30 p-5 flex items-center justify-between gap-4 transition-all hover:bg-slate-900/40"
                  >
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {getPeriodLabel(payroll.referencePeriod)}
                      </p>
                      <p className="font-outfit font-black text-[15px] text-white italic">
                        Líquido: {formatCurrency(payroll.netSalary)}
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                        Emitido em {new Date(payroll.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={downloadingId !== null}
                      onClick={() => handleDownloadPayroll(payroll.id)}
                      className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all ${
                        isDownloading
                          ? "bg-slate-950 text-cyan-400"
                          : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 active:scale-95 disabled:opacity-50"
                      }`}
                    >
                      {isDownloading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <FileDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </section>
      )}
    </div>
  )
}
