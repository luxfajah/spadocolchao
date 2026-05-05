"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Upload,
  X,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  RotateCcw,
  Info,
  CalendarDays,
  Users,
  Check,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getEmployeeLegalName, getEmployeePrimaryName } from "@/lib/employee-name"

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface AnalyzedEmployee {
  pointMachineId: string
  name?: string
  recordsCount: number
  startDate: string
  endDate: string
  rhEmployee?: {
    id: string
    fullName: string
    socialName?: string | null
    pointMachineId: string
  } | null
}

interface AnalysisResult {
  startDate: string
  endDate: string
  employees: AnalyzedEmployee[]
  totalRecords: number
}

interface ImportResult {
  success: boolean
  batchId: string
  totalGenerated: number
}

type Step = "UPLOAD" | "PREVIEW" | "SCOPE" | "PERIOD" | "CONFIRM" | "RESULT"

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function ImportarPontoModal({ open, onOpenChange }: Props) {
  const [step, setStep] = useState<Step>("UPLOAD")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // State de Dados
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [scopeType, setScopeType] = useState<"ALL" | "SELECTIVE">("ALL")
  const [periodType, setPeriodType] = useState<"MONTH" | "CUSTOM">("MONTH")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [periodLabel, setPeriodLabel] = useState("")
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  
  // Controle de Mês Fechado
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Efeito para Cálculo de Período Automático
  useEffect(() => {
    if (periodType === "MONTH") {
      const firstDay = new Date(selectedYear, selectedMonth - 1, 1)
      const lastDay = new Date(selectedYear, selectedMonth, 0)
      
      const formatDate = (d: Date) => {
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, "0")
        const day = String(d.getDate()).padStart(2, "0")
        return `${year}-${month}-${day}`
      }
      setStartDate(formatDate(firstDay))
      setEndDate(formatDate(lastDay))
      
      const label = firstDay.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
      setPeriodLabel(label.charAt(0).toUpperCase() + label.slice(1))
    }
  }, [selectedMonth, selectedYear, periodType])

  const reset = () => {
    setStep("UPLOAD")
    setSelectedFile(null)
    setAnalysis(null)
    setSelectedIds([])
    setError("")
    setLoading(false)
    setImportResult(null)
  }

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return ""
    // Se for formato ISO completo vindo do server
    if (dateStr.includes("T")) {
      const d = new Date(dateStr)
      return d.toLocaleDateString("pt-BR")
    }
    // Se for formato YYYY-MM-DD
    const parts = dateStr.split("-")
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return dateStr
  }

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(reset, 300)
  }

  // 1. Analisar Arquivo
  const handleFileUpload = async (file: File) => {
    setSelectedFile(file)
    setLoading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/attendance/imports/parse", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erro ao analisar arquivo")
      }

      const data = await res.json()
      setAnalysis(data)
      
      // Auto-configurar período inicial com base no arquivo
      const start = new Date(data.startDate)
      setStartDate(data.startDate.split("T")[0])
      setEndDate(data.endDate.split("T")[0])
      setPeriodLabel(start.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }))
      
      setStep("PREVIEW")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 2. Definir Escopo
  const toggleEmployee = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleScopeConfirm = () => {
    if (scopeType === "SELECTIVE" && selectedIds.length === 0) {
      setError("Selecione pelo menos um funcionário.")
      return
    }
    setError("")
    setStep("PERIOD")
  }

  // 3. Gerar Espelhos
  const handleGenerate = async () => {
    if (!selectedFile || !analysis) return
    setLoading(true)
    setError("")

    try {
      const idsToProcess = scopeType === "ALL" 
        ? analysis.employees.filter(e => e.rhEmployee).map(e => e.pointMachineId)
        : selectedIds

      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("selectedPointIds", JSON.stringify(idsToProcess))
      formData.append("startDate", startDate)
      formData.append("endDate", endDate)
      formData.append("periodLabel", periodLabel)

      const res = await fetch("/api/attendance/imports/generate", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erro ao gerar espelhos")
      }

      const data = await res.json()
      setImportResult(data)
      setStep("RESULT")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 max-w-2xl overflow-hidden bg-white">
        {/* Header Elegante */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 pb-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <DialogHeader className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 backdrop-blur-xl flex items-center justify-center border border-white/10">
                <Clock className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black text-white font-outfit uppercase italic tracking-tight">
                  Gestão de Ponto
                </DialogTitle>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">
                  Importação • Análise • Geração de Espelhos
                </p>
              </div>
            </div>

            {/* Progress Steps UI */}
            <div className="flex items-center gap-2 mt-8">
              {(["UPLOAD", "SCOPE", "PERIOD", "CONFIRM"] as const).map((s, i) => (
                <div key={s} className="flex items-center gap-1.5 group">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-500
                    ${step === s ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 scale-110" : 
                      (["PREVIEW", "SCOPE", "PERIOD", "CONFIRM", "RESULT"].indexOf(step) > ["UPLOAD", "SCOPE", "PERIOD", "CONFIRM"].indexOf(s)) ? "bg-emerald-500 text-white" : "bg-white/10 text-white/40"}`}>
                    {(["PREVIEW", "SCOPE", "PERIOD", "CONFIRM", "RESULT"].indexOf(step) > ["UPLOAD", "SCOPE", "PERIOD", "CONFIRM"].indexOf(s)) ? <Check className="h-3 w-3" /> : i + 1}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest transition-colors
                    ${step === s ? "text-white" : "text-white/30"}`}>
                    {s === "UPLOAD" ? "Arquivo" : s === "SCOPE" ? "Escopo" : s === "PERIOD" ? "Período" : "Confirmar"}
                  </span>
                  {i < 3 && <div className="w-4 h-[1px] bg-white/10 mx-1" />}
                </div>
              ))}
            </div>
          </DialogHeader>
        </div>

        <div className="p-8 pb-10 bg-white">
          {/* STEP: UPLOAD */}
          {step === "UPLOAD" && (
            <div className="space-y-6">
              <label
                className={`cursor-pointer flex flex-col items-center justify-center gap-5 p-12 rounded-[2.5rem] border-2 border-dashed transition-all duration-300
                  ${loading ? "opacity-50 pointer-events-none" : "border-slate-200 bg-slate-50/50 hover:border-indigo-400 hover:bg-indigo-50/30 group"}`}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault()
                  const f = e.dataTransfer.files?.[0]
                  if (f) handleFileUpload(f)
                }}
              >
                <div className="h-20 w-20 rounded-3xl bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 border border-slate-100">
                  {loading ? <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" /> : <Upload className="h-8 w-8 text-indigo-500" />}
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-slate-700 font-outfit uppercase tracking-tight">Solte o arquivo TXT aqui</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Ou clique para selecionar na pasta</p>
                </div>
                <input type="file" accept=".txt" className="hidden" 
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }} />
              </label>

              <div className="flex items-start gap-4 p-5 rounded-3xl bg-indigo-50/50 border border-indigo-100/50">
                <Info className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-black text-indigo-900 uppercase tracking-widest">Requisitos do Arquivo</p>
                  <p className="text-[11px] text-indigo-700/70 font-medium leading-relaxed">
                    O arquivo deve ser exportado da máquina de ponto com tabulação. <br/>
                    As colunas <strong>EnNo</strong> (ID do Máquina) e <strong>DateTime</strong> (Data/Hora) são obrigatórias para o processamento.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP: PREVIEW (Analysis Result) */}
          {step === "PREVIEW" && analysis && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 flex flex-col items-center">
                  <Users className="h-4 w-4 text-indigo-500 mb-2" />
                  <p className="text-2xl font-black text-slate-800 font-outfit leading-none">{analysis.employees.length}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 px-2 text-center">No Arquivo</p>
                </div>
                <div className="bg-indigo-50 rounded-3xl p-5 border border-indigo-100 flex flex-col items-center">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mb-2" />
                  <p className="text-2xl font-black text-indigo-600 font-outfit leading-none">
                    {analysis.employees.filter(e => e.rhEmployee).length}
                  </p>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-2 text-center">Vinculados RH</p>
                </div>
                <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 flex flex-col items-center">
                  <FileText className="h-4 w-4 text-slate-400 mb-2" />
                  <p className="text-2xl font-black text-slate-600 font-outfit leading-none">{analysis.totalRecords}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 text-center">Registros</p>
                </div>
              </div>

              <div className="bg-slate-900 rounded-[2rem] p-6 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 pt-6 opacity-10">
                   <CalendarDays className="h-20 w-20" />
                </div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Período Detectado</p>
                <div className="flex items-center gap-4">
                   <div className="flex flex-col">
                      <span className="text-xl font-black font-outfit">{formatDisplayDate(analysis.startDate.split("T")[0])}</span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase uppercase tracking-widest">Início</span>
                   </div>
                   <ArrowRight className="h-4 w-4 text-slate-700" />
                   <div className="flex flex-col">
                      <span className="text-xl font-black font-outfit text-indigo-300">{formatDisplayDate(analysis.endDate.split("T")[0])}</span>
                      <span className="text-[9px] text-indigo-400/50 font-bold uppercase tracking-widest">Fim</span>
                   </div>
                </div>
              </div>

              <div className="flex gap-3">
                 <Button variant="ghost" onClick={reset} className="flex-1 rounded-full h-12 font-black text-xs uppercase tracking-widest text-slate-400 h-14">
                    Trocar Arquivo
                 </Button>
                 <Button onClick={() => setStep("SCOPE")} className="flex-[2] rounded-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 gap-2">
                    Prosseguir <ArrowRight className="h-4 w-4" />
                 </Button>
              </div>
            </div>
          )}

          {/* STEP: SCOPE (Choose Employees) */}
          {step === "SCOPE" && analysis && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex flex-col gap-1 px-1">
                  <h4 className="text-lg font-black text-slate-800 font-outfit uppercase tracking-tight">Definir Escopo de Geração</h4>
                  <p className="text-xs text-slate-400 font-medium tracking-tight">Escolha quais funcionários terão seus espelhos gerados agora.</p>
               </div>

               <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setScopeType("ALL")}
                    className={`flex items-center gap-4 p-5 rounded-3xl border-2 transition-all text-left group
                      ${scopeType === "ALL" ? "border-indigo-600 bg-indigo-50/50 shadow-lg shadow-indigo-600/5" : "border-slate-100 hover:border-slate-200 bg-slate-50/30"}`}
                  >
                     <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all ${scopeType === "ALL" ? "bg-indigo-600 text-white shadow-lg" : "bg-white text-slate-400 border border-slate-100"}`}>
                        <Users className="h-5 w-5" />
                     </div>
                     <div>
                        <p className={`text-xs font-black uppercase tracking-widest ${scopeType === "ALL" ? "text-indigo-900" : "text-slate-600"}`}>Todos os Vinculados</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">{analysis.employees.filter(e => e.rhEmployee).length} funcionários</p>
                     </div>
                  </button>
                  <button 
                    onClick={() => setScopeType("SELECTIVE")}
                    className={`flex items-center gap-4 p-5 rounded-3xl border-2 transition-all text-left group
                      ${scopeType === "SELECTIVE" ? "border-indigo-600 bg-indigo-50/50 shadow-lg shadow-indigo-600/5" : "border-slate-100 hover:border-slate-200 bg-slate-50/30"}`}
                  >
                     <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all ${scopeType === "SELECTIVE" ? "bg-indigo-600 text-white shadow-lg" : "bg-white text-slate-400 border border-slate-100"}`}>
                        <Users className="h-5 w-5" />
                     </div>
                     <div>
                        <p className={`text-xs font-black uppercase tracking-widest ${scopeType === "SELECTIVE" ? "text-indigo-900" : "text-slate-600"}`}>Personalizado</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">Escolher da lista</p>
                     </div>
                  </button>
               </div>

               {scopeType === "SELECTIVE" && (
                 <div className="rounded-[2rem] border border-slate-100 overflow-hidden bg-slate-50/50">
                    <div className="bg-slate-50/80 px-6 py-3 border-b border-slate-100">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lista de Funcionários no Arquivo</p>
                    </div>
                    <div className="max-h-60 overflow-y-auto no-scrollbar py-2">
                       {analysis.employees.map((emp) => (
                         <div 
                           key={emp.pointMachineId}
                           onClick={() => toggleEmployee(emp.pointMachineId)}
                           className={`flex items-center gap-4 px-6 py-3 cursor-pointer transition-colors hover:bg-white group
                            ${!emp.rhEmployee ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                         >
                            <Checkbox 
                              checked={selectedIds.includes(emp.pointMachineId)}
                              disabled={!emp.rhEmployee}
                              onCheckedChange={() => toggleEmployee(emp.pointMachineId)}
                              className="rounded-lg h-5 w-5 border-slate-200 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                            />
                            <div className="flex-1 min-w-0">
                               <p className="text-sm font-bold text-slate-800 truncate uppercase font-outfit">
                                 {emp.rhEmployee ? getEmployeePrimaryName(emp.rhEmployee) : `ID Máquina: ${emp.pointMachineId}`}
                               </p>
                               <div className="flex items-center gap-2 mt-0.5">
                                 {emp.rhEmployee && getEmployeeLegalName(emp.rhEmployee) && (
                                   <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                     Legal: {getEmployeeLegalName(emp.rhEmployee)}
                                   </span>
                                 )}
                                 {!emp.rhEmployee && <Badge variant="destructive" className="bg-rose-50 text-rose-500 border-none font-black text-[8px] h-4 uppercase tracking-[0.05em]">Sem Vínculo RH</Badge>}
                                 <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{emp.recordsCount} registros</span>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
               )}

               <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setStep("PREVIEW")} className="flex-1 rounded-full h-14 font-black text-xs uppercase tracking-widest text-slate-400">
                     Voltar
                  </Button>
                  <Button onClick={handleScopeConfirm} className="flex-1 rounded-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20">
                     Prosseguir
                  </Button>
               </div>
            </div>
          )}

          {/* STEP: PERIOD & PERIOD SELECTION */}
          {step === "PERIOD" && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col gap-1 px-1">
                  <h4 className="text-lg font-black text-slate-800 font-outfit uppercase tracking-tight">Competência e Período</h4>
                  <p className="text-xs text-slate-400 font-medium tracking-tight">Defina os limites de data e o rótulo do espelho.</p>
                </div>

                <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100/50 space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-indigo-900 uppercase tracking-widest ml-1">Rótulo da Competência (ex: Mar/2026)</label>
                      <Input 
                        value={periodLabel} 
                        onChange={e => setPeriodLabel(e.target.value)}
                        placeholder="Mês/Ano do Espelho"
                        className="rounded-2xl border-indigo-100 focus-visible:ring-indigo-500 h-12 bg-white"
                      />
                   </div>

                   <div className="flex items-center gap-4">
                      <button 
                         onClick={() => setPeriodType("MONTH")}
                         className={`flex-1 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all
                           ${periodType === "MONTH" ? "bg-indigo-600 text-white border-transparent" : "bg-white text-slate-400 border-indigo-100"}`}
                      >
                         Mês Fechado
                      </button>
                      <button 
                         onClick={() => setPeriodType("CUSTOM")}
                         className={`flex-1 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all
                           ${periodType === "CUSTOM" ? "bg-indigo-600 text-white border-transparent" : "bg-white text-slate-400 border-indigo-100"}`}
                      >
                         Intervalo Livre
                      </button>
                   </div>

                   {periodType === "MONTH" ? (
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-indigo-900/50 uppercase tracking-widest ml-1">Mês</label>
                          <Select 
                            value={selectedMonth.toString()} 
                            onValueChange={(v) => setSelectedMonth(parseInt(v))}
                          >
                            <SelectTrigger className="rounded-2xl border-indigo-100 focus:ring-indigo-500 h-12 bg-white font-bold text-xs uppercase">
                              <SelectValue placeholder="Mês" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                              {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map((m, i) => (
                                <SelectItem key={m} value={(i + 1).toString()} className="font-bold text-xs uppercase tracking-widest py-3">
                                  {m}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-indigo-900/50 uppercase tracking-widest ml-1">Ano</label>
                          <Select 
                            value={selectedYear.toString()} 
                            onValueChange={(v) => setSelectedYear(parseInt(v))}
                          >
                            <SelectTrigger className="rounded-2xl border-indigo-100 focus:ring-indigo-500 h-12 bg-white font-bold text-xs uppercase">
                              <SelectValue placeholder="Ano" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                              {[2024, 2025, 2026, 2027].map((y) => (
                                <SelectItem key={y} value={y.toString()} className="font-bold text-xs uppercase tracking-widest py-3">
                                  {y}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                     </div>
                   ) : (
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-indigo-900/50 uppercase tracking-widest ml-1">Início do Período</label>
                          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                            className="rounded-2xl border-indigo-100 focus-visible:ring-indigo-500 h-12 bg-white text-sm font-bold" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-indigo-900/50 uppercase tracking-widest ml-1">Fim do Período</label>
                          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                            className="rounded-2xl border-indigo-100 focus-visible:ring-indigo-500 h-12 bg-white text-sm font-bold" />
                        </div>
                     </div>
                   )}
                </div>

                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => setStep("SCOPE")} className="flex-1 rounded-full h-14 font-black text-xs uppercase tracking-widest text-slate-400">
                     Voltar
                  </Button>
                  <Button onClick={() => setStep("CONFIRM")} className="flex-1 rounded-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20">
                     Revisar
                  </Button>
               </div>
             </div>
          )}

          {/* STEP: CONFIRM (Final Review) */}
          {step === "CONFIRM" && analysis && (
             <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                 <div className="flex flex-col items-center text-center gap-2 mb-2">
                    <div className="h-16 w-16 bg-amber-50 rounded-3xl flex items-center justify-center border border-amber-100 mb-2">
                       <Clock className="h-8 w-8 text-amber-500" />
                    </div>
                    <h4 className="text-xl font-black text-slate-800 font-outfit uppercase tracking-tight">Confirmar Geração</h4>
                    <p className="text-sm text-slate-500 font-medium">Os espelhos antigos no mesmo intervalo serão substituídos.</p>
                 </div>

                 <div className="rounded-[2.5rem] bg-slate-50 border border-slate-100 p-8 space-y-5">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Competência</span>
                       <span className="text-sm font-black text-slate-700 uppercase font-outfit">{periodLabel}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Funcionários</span>
                       <span className="text-sm font-black text-indigo-600 font-outfit">
                          {scopeType === "ALL" ? analysis.employees.filter(e => e.rhEmployee).length : selectedIds.length} selecionados
                       </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Intervalo</span>
                       <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-600">{formatDisplayDate(startDate)}</span>
                          <ArrowRight className="h-3 w-3 text-slate-300" />
                          <span className="text-xs font-bold text-slate-600">{formatDisplayDate(endDate)}</span>
                       </div>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Arquivo Origem</span>
                       <span className="text-xs font-bold text-slate-500 italic max-w-[50%] truncate">{selectedFile?.name}</span>
                    </div>
                 </div>

                 {error && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold flex items-center gap-3">
                       <AlertTriangle className="h-4 w-4" /> {error}
                    </div>
                 )}

                 <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => setStep("PERIOD")} disabled={loading} className="flex-1 rounded-full h-14 font-black text-xs uppercase tracking-widest text-slate-400">
                       Ajustar
                    </Button>
                    <Button onClick={handleGenerate} disabled={loading} className="flex-[2] rounded-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 gap-2">
                       {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando...</> : <><CheckCircle2 className="h-4 w-4" /> Confirmar e Gerar</>}
                    </Button>
                 </div>
             </div>
          )}

          {/* STEP: RESULT (Success) */}
          {step === "RESULT" && importResult && (
             <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 py-4">
                <div className="flex flex-col items-center text-center gap-4">
                   <div className="h-20 w-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center shadow-xl shadow-emerald-500/30">
                      <Check className="h-10 w-10 text-white stroke-[3px]" />
                   </div>
                   <div>
                      <h4 className="text-2xl font-black text-slate-800 font-outfit uppercase tracking-tight">Processo Concluído!</h4>
                      <p className="text-sm text-slate-500 font-medium mt-1">Os espelhos foram gerados no histórico.</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                   <div className="text-center space-y-1 border-r border-slate-200">
                      <p className="text-3xl font-black text-emerald-600 font-outfit">{importResult.totalGenerated}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Espelhos Gerados</p>
                   </div>
                   <div className="text-center space-y-1">
                      <p className="text-3xl font-black text-indigo-600 font-outfit">{periodLabel.split('/')[0]}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Competência</p>
                   </div>
                </div>

                <div className="flex gap-3 pt-4">
                   <Button variant="ghost" onClick={reset} className="flex-1 rounded-full h-14 font-black text-xs uppercase tracking-widest text-slate-400 gap-2">
                       <RotateCcw className="h-4 w-4" /> Novo Arquivo
                   </Button>
                   <Button onClick={handleClose} className="flex-1 rounded-full h-14 bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-900/20">
                       Ver Histórico
                   </Button>
                </div>
             </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
