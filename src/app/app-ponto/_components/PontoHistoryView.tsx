"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  AlertCircle,
  FileText,
  FileDown,
  Loader2,
  CalendarDays,
  CreditCard,
} from "lucide-react"
import { downloadPayrollPdfAction } from "../actions"

interface PontoHistoryViewProps {
  data: {
    payrolls?: {
      id: string
      referencePeriod: string
      netSalary: number
      grossSalary: number
      status: string
      createdAt: Date | string
    }[]
    mirrors?: {
      id: string
      name: string
      description: string | null
      fileUrl: string
      createdAt: Date | string
    }[]
    error?: string
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
  downloadLink.target = "_blank" // fallback to open in new tab if direct download isn't supported
  document.body.appendChild(downloadLink)
  downloadLink.click()
  document.body.removeChild(downloadLink)
}

export function PontoHistoryView({ data }: PontoHistoryViewProps) {
  const [activeTab, setActiveTab] = useState<"ponto" | "holerite">("ponto")
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

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

  const mirrors = data.mirrors || []
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
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <CalendarDays size={14} />
          Espelho de Ponto
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
        /* Aba de Espelhos de Ponto (Tratados) */
        <section className="space-y-4 animate-in fade-in duration-300">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Espelhos de Ponto Tratados
          </h3>

          <div className="space-y-2.5">
            {mirrors.length === 0 ? (
              <div className="rounded-[2rem] bg-slate-900/50 border border-slate-900 p-8 text-center space-y-3">
                <FileText className="w-10 h-10 text-slate-500 mx-auto" />
                <p className="font-bold text-sm text-slate-400 uppercase tracking-wider">
                  Nenhum espelho tratado disponível.
                </p>
                <p className="text-xs text-slate-500">
                  Os espelhos tratados e assinados aparecem aqui assim que forem fechados pelo RH.
                </p>
              </div>
            ) : (
              mirrors.map((mirror) => {
                return (
                  <div
                    key={mirror.id}
                    className="rounded-3xl border border-slate-900 bg-slate-900/30 p-5 flex items-center justify-between gap-4 transition-all hover:bg-slate-900/40"
                  >
                    <div className="space-y-1">
                      <p className="font-outfit font-black text-[14px] text-white italic">
                        {mirror.name}
                      </p>
                      {mirror.description && (
                        <p className="text-[10px] text-slate-400 font-medium">
                          {mirror.description.split("MirrorId:")[0].trim()}
                        </p>
                      )}
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                        Publicado em {new Date(mirror.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => triggerBrowserDownload(mirror.fileUrl, mirror.name)}
                      className="h-11 w-11 rounded-2xl flex items-center justify-center bg-cyan-500 hover:bg-cyan-400 text-slate-950 active:scale-95 transition-all"
                    >
                      <FileDown className="w-5 h-5" />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </section>
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
