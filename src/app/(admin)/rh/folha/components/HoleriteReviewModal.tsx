"use client"

import { useState, useEffect, useTransition, useMemo } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Calculator, 
  Save, 
  X, 
  TrendingUp, 
  ArrowDownCircle, 
  Wallet,
  Clock,
  Calendar,
  AlertCircle,
  Info,
  History,
  CheckCircle2
} from "lucide-react"
import { HoleriteEmployee, saveHolerite, finalizeHolerite } from "../actions"
import { calculatePayrollValuesByPeriod } from "@/lib/payroll/tax-policy"
import { useToast } from "@/hooks/use-toast"

type HoleriteReviewModalProps = {
  employee: HoleriteEmployee
  period: string
  isOpen: boolean
  onClose: () => void
}

export function HoleriteReviewModal({ employee, period, isOpen, onClose }: HoleriteReviewModalProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  
  // Estados para Benefícios
  const [bonus, setBonus] = useState(0)
  const [gratification, setGratification] = useState(0)
  const [vtValue, setVtValue] = useState(0)
  const [vrValue, setVrValue] = useState(0)
  const [fuelValue, setFuelValue] = useState(0)

  // Estados para Frequência (Minutos)
  const [he50Min, setHe50Min] = useState(0)
  const [he100Min, setHe100Min] = useState(0)
  const [delayMin, setDelayMin] = useState(0)
  const [absences, setAbsences] = useState(0)
  
  const [notes, setNotes] = useState("")

  // Inicialização baseada nos dados do banco e espelho
  useEffect(() => {
    // Valores padrão do espelho e benefícios (caso não haja dados salvos no payroll)
    const mirrorHe50 = employee.attendanceMirror?.overtimeMinutes || 0
    const mirrorDelay = employee.attendanceMirror?.deficitMinutes || 0
    let mirrorAbsences = 0
    if (employee.attendanceMirror?.summary) {
      try {
        const summary = JSON.parse(employee.attendanceMirror.summary)
        mirrorAbsences = summary.absences || 0
      } catch (e) {}
    }

    const configVt = employee.benefits.transportationAllowance || 0
    const configVr = employee.benefits.foodAllowance || 0
    const configFuel = employee.benefits.fuelAllowance || 0
    const configBonus = employee.benefits.attendanceBonusEnabled ? (employee.benefits.attendanceBonusAmount || 0) : 0

    if (employee.payroll?.notes) {
      try {
        const savedData = JSON.parse(employee.payroll.notes)
        setBonus(savedData.bonus ?? configBonus)
        setGratification(savedData.gratification || 0)
        setVtValue(savedData.vtValue ?? configVt)
        setVrValue(savedData.vrValue ?? configVr)
        setFuelValue(savedData.fuelValue ?? configFuel)
        setHe50Min(savedData.he50Min ?? mirrorHe50)
        setHe100Min(savedData.he100Min || 0)
        setDelayMin(savedData.delayMin ?? mirrorDelay)
        setAbsences(savedData.absences ?? mirrorAbsences)
        setNotes(savedData.internalNotes || "")
      } catch (e) {
        // Se a nota não for JSON (ex: nota de geração em lote legada), usamos os valores do espelho/cadastro
        // mas mantemos o texto da nota para exibição.
        setHe50Min(mirrorHe50)
        setHe100Min(0)
        setDelayMin(mirrorDelay)
        setAbsences(mirrorAbsences)
        setVtValue(configVt)
        setVrValue(configVr)
        setFuelValue(configFuel)
        setBonus(configBonus)
        setGratification(0)
        setNotes(employee.payroll.notes || "")
      }
    } else {
      // Sem holerite prévio: inicia com dados frescos do espelho e cadastro
      setHe50Min(mirrorHe50)
      setHe100Min(0)
      setDelayMin(mirrorDelay)
      setAbsences(mirrorAbsences)
      setVtValue(configVt)
      setVrValue(configVr)
      setFuelValue(configFuel)
      setBonus(configBonus)
      setGratification(0)
      setNotes("")
    }
  }, [employee])

  // Lógica de cálculo monetário baseada na escala
  const calculations = useMemo(() => {
    const salary = employee.salaryBase || 0
    const weeklyHours = employee.workSchedule?.weeklyHours || 44
    // Base mensal sugerida (44h -> 220h, 40h -> 200h)
    const baseMonthlyHours = weeklyHours * 5 
    const hourValue = salary / baseMonthlyHours
    const dayValue = salary / 30

    const totalHe50 = (he50Min / 60) * hourValue * 1.5
    const totalHe100 = (he100Min / 60) * hourValue * 2.0
    // DSR sobre HE (Soma das HEs / Dias Úteis do mês * DSRs)
    // Usaremos um fator padrão de 1/6 (aproximadamente 17%) se não tivermos o calendário exato
    const totalDsr = (totalHe50 + totalHe100) * 0.1667

    const totalDelay = (delayMin / 60) * hourValue
    const totalAbsence = absences * dayValue

    // Agregados para a Tax Policy
    const otherAdditions = bonus + gratification + vtValue + vrValue + fuelValue + totalHe50 + totalHe100 + totalDsr
    const otherDeductions = totalDelay + totalAbsence

    // Chamada para política fiscal 2026 (INSS/IRRF/FGTS)
    const taxes = calculatePayrollValuesByPeriod({
      period,
      grossSalary: salary,
      otherAdditions,
      otherDeductions
    })

    return {
      hourValue,
      dayValue,
      totalHe50,
      totalHe100,
      totalDsr,
      totalDelay,
      totalAbsence,
      ...taxes
    }
  }, [employee, period, bonus, gratification, vtValue, vrValue, fuelValue, he50Min, he100Min, delayMin, absences])

  async function handleFinalize() {
    startTransition(async () => {
      try {
        const detailedNotes = JSON.stringify({
          bonus, gratification, vtValue, vrValue, fuelValue,
          he50Min, he100Min, delayMin, absences,
          internalNotes: notes
        })

        // Salva como rascunho primeiro para garantir que os valores estão atualizados
        await saveHolerite(employee.id, period, {
          grossSalary: calculations.grossSalary,
          inss: calculations.inss,
          fgts: calculations.fgts,
          irrf: calculations.irrf,
          otherAdditions: calculations.otherAdditions,
          otherDeductions: calculations.otherDeductions,
          notes: detailedNotes,
          status: "DRAFT"
        })

        // Chama o saveHolerite com status GENERATED (isso já dispara o financeiro via generatePayrollForEmployee internamente)
        await saveHolerite(employee.id, period, {
          grossSalary: calculations.grossSalary,
          inss: calculations.inss,
          fgts: calculations.fgts,
          irrf: calculations.irrf,
          otherAdditions: calculations.otherAdditions,
          otherDeductions: calculations.otherDeductions,
          notes: detailedNotes,
          status: "GENERATED"
        })


        toast({
          title: "Holerite Gerado",
          description: "O holerite foi processado e o lançamento financeiro foi criado.",
        })
        onClose()
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro ao gerar",
          description: "Verifique os dados e tente novamente.",
        })
      }
    })
  }

  async function handleSave() {
    startTransition(async () => {
      try {
        // Guardamos o detalhamento no campo de Notes para re-edição
        const detailedNotes = JSON.stringify({
          bonus, gratification, vtValue, vrValue, fuelValue,
          he50Min, he100Min, delayMin, absences,
          internalNotes: notes
        })

        await saveHolerite(employee.id, period, {
          grossSalary: calculations.grossSalary,
          inss: calculations.inss,
          fgts: calculations.fgts,
          irrf: calculations.irrf,
          otherAdditions: calculations.otherAdditions,
          otherDeductions: calculations.otherDeductions,
          notes: detailedNotes,
          status: "DRAFT"
        })

        toast({
          title: "Alterações Salvas",
          description: "Rascunho atualizado com os novos cálculos.",
        })
        onClose()
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro ao salvar",
          description: "Verifique os dados e tente novamente.",
        })
      }
    })
  }

  const formatBRL = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)
  const initials = employee.fullName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[70vw] w-full bg-slate-950 text-white border-white/10 p-0 overflow-hidden shadow-2xl rounded-[2.5rem]">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] h-[85vh]">
          
          {/* PAINEL DE EDIÇÃO (ESQUERDA) */}
          <div className="p-10 space-y-10 overflow-y-auto custom-scrollbar bg-slate-900/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Calculator className="h-7 w-7 text-emerald-400" />
                </div>
                <div>
                  <h2 className="font-outfit font-black text-2xl uppercase italic tracking-tight leading-none">Checkout de Holerite</h2>
                  <div className="flex flex-col gap-1 mt-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Competência {period.split("-").reverse().join("/")}</p>
                    {employee.attendanceMirror && (
                      <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                        <History className="h-3 w-3" /> Baseado no espelho de {employee.attendanceMirror.period.split("-").reverse().join("/")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="h-8 rounded-full border-white/10 bg-white/5 px-4 font-black text-[9px] uppercase tracking-widest text-slate-400">
                Escala: {employee.workSchedule?.weeklyHours}h Semanais
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* BLOCO: FREQUÊNCIA E HORAS */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <h3 className="font-outfit font-black text-sm uppercase tracking-widest">Frequência e Horas</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Horas Extras 50% (min)</label>
                    <Input 
                      type="number" 
                      value={he50Min} 
                      onChange={e => setHe50Min(Number(e.target.value))}
                      className="h-12 bg-white/5 border-white/10 rounded-xl font-bold text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Horas Extras 100% (min)</label>
                    <Input 
                      type="number" 
                      value={he100Min} 
                      onChange={e => setHe100Min(Number(e.target.value))}
                      className="h-12 bg-white/5 border-white/10 rounded-xl font-bold text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Atrasos (minutos)</label>
                    <Input 
                      type="number" 
                      value={delayMin} 
                      onChange={e => setDelayMin(Number(e.target.value))}
                      className="h-12 bg-white/5 border-white/10 rounded-xl font-bold text-rose-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Faltas (dias)</label>
                    <Input 
                      type="number" 
                      value={absences} 
                      onChange={e => setAbsences(Number(e.target.value))}
                      className="h-12 bg-white/5 border-white/10 rounded-xl font-bold text-rose-400"
                    />
                  </div>
                </div>
              </div>

              {/* BLOCO: BENEFÍCIOS E PROVENTOS */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <h3 className="font-outfit font-black text-sm uppercase tracking-widest">Benefícios e Prêmios</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Bônus / Produtividade</label>
                    <Input 
                      type="number" 
                      value={bonus} 
                      onChange={e => setBonus(Number(e.target.value))}
                      className="h-12 bg-white/5 border-white/10 rounded-xl font-bold text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Gratificação Cargo</label>
                    <Input 
                      type="number" 
                      value={gratification} 
                      onChange={e => setGratification(Number(e.target.value))}
                      className="h-12 bg-white/5 border-white/10 rounded-xl font-bold text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Vale Transporte (VT)</label>
                    <Input 
                      type="number" 
                      value={vtValue} 
                      onChange={e => setVtValue(Number(e.target.value))}
                      className="h-12 bg-white/5 border-white/10 rounded-xl font-bold text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">VA / Refeição (VR)</label>
                    <Input 
                      type="number" 
                      value={vrValue} 
                      onChange={e => setVrValue(Number(e.target.value))}
                      className="h-12 bg-white/5 border-white/10 rounded-xl font-bold text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* NOTAS INTERNAS */}
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <History className="h-3.5 w-3.5" /> Notas e Observações Operacionais
              </label>
              <textarea 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Detalhe o motivo de prêmios ou descontos manuais..."
                className="w-full min-h-[120px] bg-white/5 border border-white/10 rounded-[1.5rem] p-5 text-xs text-white focus:outline-none focus:border-emerald-500/30 transition-all resize-none font-medium leading-relaxed"
              />
            </div>
          </div>

          {/* PAINEL DE RESULTADOS (DIREITA) */}
          <div className="bg-black p-10 flex flex-col justify-between border-l border-white/5 relative">
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
            
            <div className="space-y-10 relative">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 rounded-2xl border-2 border-white/10 shadow-lg">
                  <AvatarImage src={employee.photoUrl || ""} />
                  <AvatarFallback className="bg-slate-800 text-white font-black text-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="font-outfit font-black text-base uppercase italic tracking-tight leading-none text-white">{employee.socialName || employee.fullName}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{employee.jobTitle?.name}</p>
                </div>
              </div>

              {/* DEMONSTRATIVO ANALÍTICO */}
              <div className="space-y-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-6 flex items-center gap-2">
                   <div className="h-1 w-8 bg-emerald-500/40 rounded-full" /> Demonstrativo Real-Time
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Horas Regulares</span>
                    <span className="text-xs font-bold text-slate-300">
                      {Math.floor(Math.max(0, (employee.attendanceMirror?.workedMinutes || 0) - he50Min - he100Min) / 60)}h {Math.max(0, (employee.attendanceMirror?.workedMinutes || 0) - he50Min - he100Min) % 60}min
                    </span>
                  </div>

                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Salário Base</span>
                    <span className="text-xs font-bold text-slate-300">{formatBRL(employee.salaryBase || 0)}</span>
                  </div>
                  
                  {calculations.totalHe50 > 0 && (
                    <div className="flex justify-between items-center px-1 animate-in slide-in-from-right-2 duration-300">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/80">Horas Extras 50% ({Math.floor(he50Min / 60)}h {he50Min % 60}m)</span>
                      <span className="text-xs font-black text-emerald-400">+{formatBRL(calculations.totalHe50)}</span>
                    </div>
                  )}

                  {calculations.totalHe100 > 0 && (
                    <div className="flex justify-between items-center px-1 animate-in slide-in-from-right-2 duration-300">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/80">Horas Extras 100% ({Math.floor(he100Min / 60)}h {he100Min % 60}m)</span>
                      <span className="text-xs font-black text-emerald-400">+{formatBRL(calculations.totalHe100)}</span>
                    </div>
                  )}

                  {calculations.totalDsr > 0 && (
                    <div className="flex justify-between items-center px-1 animate-in slide-in-from-right-2 duration-300">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/60 font-italic">DSR s/ Horas Extras</span>
                      <span className="text-[11px] font-bold text-emerald-500/90 italic">+{formatBRL(calculations.totalDsr)}</span>
                    </div>
                  )}

                  {(bonus + gratification + vtValue + vrValue + fuelValue) > 0 && (
                     <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Benefícios e Prêmios</span>
                      <span className="text-xs font-bold text-emerald-500/80">+{formatBRL(bonus + gratification + vtValue + vrValue + fuelValue)}</span>
                    </div>
                  )}

                  {calculations.totalAbsence > 0 && (
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500/70">Desconto de Faltas</span>
                      <span className="text-xs font-black text-rose-400">-{formatBRL(calculations.totalAbsence)}</span>
                    </div>
                  )}

                  {calculations.totalDelay > 0 && (
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500/70">Desconto de Atrasos</span>
                      <span className="text-xs font-black text-rose-400">-{formatBRL(calculations.totalDelay)}</span>
                    </div>
                  )}

                  <div className="h-px bg-white/10 my-6" />

                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">INSS (Alíquota 2026)</span>
                    <span className="text-xs font-bold text-slate-400">-{formatBRL(calculations.inss)}</span>
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">IRRF (Simp. 2026)</span>
                    <span className="text-xs font-bold text-slate-400">-{formatBRL(calculations.irrf)}</span>
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">FGTS (Custo Empresa)</span>
                    <span className="text-xs font-bold text-amber-500/80">{formatBRL(calculations.fgts)}</span>
                  </div>
                </div>

                <div className="mt-10 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 p-8 space-y-2 group transition-all hover:bg-emerald-500/10 hover:border-emerald-500/30">
                   <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400/80">Salário Líquido</span>
                     <Wallet className="h-5 w-5 text-emerald-500 opacity-50 group-hover:scale-110 transition-transform" />
                   </div>
                   <p className="text-5xl font-black font-outfit text-emerald-400 italic tracking-tighter">
                    {formatBRL(calculations.netSalary)}
                   </p>
                </div>
              </div>

              <div className="flex gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                <Info className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                <p className="text-[9px] text-slate-500 leading-relaxed font-bold uppercase tracking-[0.1em]">
                  Base: {formatBRL(calculations.hourValue)}/hora. HE calculada com multiplicadores de 1.5x e 2.0x sobre o valor/hora da escala.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 relative mt-10">
              <Button 
                onClick={handleFinalize}
                disabled={isPending}
                className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-sm tracking-[0.15em] shadow-xl shadow-indigo-500/10 transition-all hover:-translate-y-1 flex gap-2"
              >
                {isPending ? "Processando..." : (
                  <><CheckCircle2 className="h-5 w-5" /> Gerar Holerite</>
                )}
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isPending}
                variant="outline"
                className="w-full h-14 rounded-2xl border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-500 font-black uppercase text-[11px] tracking-[0.15em] transition-all flex gap-2"
              >
                {isPending ? "Processando..." : (
                  <><Save className="h-4 w-4" /> Salvar Rascunho</>
                )}
              </Button>
              <Button 
                variant="ghost" 
                onClick={onClose}
                className="w-full h-10 rounded-2xl text-slate-500 hover:text-white hover:bg-white/5 font-black uppercase text-[9px] tracking-widest transition-all"
              >
                <X className="mr-2 h-4 w-4" /> Cancelar
              </Button>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
