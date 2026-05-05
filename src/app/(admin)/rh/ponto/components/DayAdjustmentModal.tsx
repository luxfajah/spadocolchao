"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { adjustAttendanceDay, updatePunchTimes } from "../[id]/adjust-actions"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Settings2, ShieldCheck, Lock, Clock } from "lucide-react"
import { formatBusinessTime } from "@/lib/attendance/business-time"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  dayId: string
  employeeId: string
  currentDate: string
  isLocked: boolean
  initialData?: {
    firstIn?: Date | string | null;
    lunchOut?: Date | string | null;
    lunchIn?: Date | string | null;
    lastOut?: Date | string | null;
    adjustmentType?: string;
    adjustmentReason?: string;
  }
}

const ADJUSTMENT_TYPES = [
  { value: "NONE", label: "Remover Ajuste (Limpar)" },
  { value: "ABONO", label: "Abonar Falta (Justificada)" },
  { value: "ATESTADO_MEDICO", label: "Atestado Médico" },
  { value: "ATESTADO_HORARIO", label: "Atestado de Horário" },
  { value: "FERIADO", label: "Feriado" },
  { value: "FOLGA_PREMIO", label: "Folga Prêmio" },
  { value: "MANUAL", label: "Ajuste Manual de Horários" },
]

export function DayAdjustmentModal({ open, onOpenChange, dayId, employeeId, currentDate, isLocked, initialData }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [type, setType] = useState<string>("ABONO")
  const [reason, setReason] = useState("")
  const { toast } = useToast()

  // State for punch times
  const [punches, setPunches] = useState({
    firstIn: "",
    lunchOut: "",
    lunchIn: "",
    lastOut: ""
  })

  useEffect(() => {
    if (initialData) {
      const formatTime = (d: any) => d ? formatBusinessTime(d) : ""
      setPunches({
        firstIn: formatTime(initialData.firstIn),
        lunchOut: formatTime(initialData.lunchOut),
        lunchIn: formatTime(initialData.lunchIn),
        lastOut: formatTime(initialData.lastOut)
      })
      setType(initialData.adjustmentType || "NONE")
      setReason(initialData.adjustmentReason || "")
    }
  }, [initialData, open])

  async function handleSave() {
    setIsSubmitting(true)
    try {
      if (type === "MANUAL") {
        await updatePunchTimes(dayId, {
          ...punches,
          reason
        })
      } else {
        await adjustAttendanceDay(dayId, {
          type: type as any,
          reason
        })
      }

      toast({
        title: "Ponto ajustado!",
        description: "Os cálculos foram atualizados conforme a escala.",
      })
      
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Erro no ajuste",
        description: error.message || "Verifique se a justificativa foi preenchida.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-[2rem] overflow-hidden p-0 border-none shadow-2xl">
        <DialogHeader className="p-8 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-4 mb-2">
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-sm ${isLocked ? 'bg-rose-100 text-rose-500' : 'bg-indigo-100 text-indigo-500' }`}>
               {isLocked ? <Lock className="h-6 w-6" /> : <Settings2 className="h-6 w-6" />}
            </div>
            <div>
              <DialogTitle className="text-2xl font-black text-slate-800 font-outfit uppercase tracking-tight">
                {isLocked ? "Período Travado" : "Ajustar Ocorrência"}
              </DialogTitle>
              <DialogDescription className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                {currentDate}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          {isLocked ? (
            <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl text-center">
               <ShieldCheck className="h-10 w-10 text-rose-300 mx-auto mb-4" />
               <p className="text-sm font-bold text-rose-700 leading-relaxed">
                 Este período não permite mais ajustes pois o **Holerite (Folha)** já foi gerado ou pago.
               </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo de Ajuste</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="rounded-xl h-12 border-slate-100 bg-slate-50/50 transition-all focus:ring-indigo-500">
                    <SelectValue placeholder="Selecione o tipo..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {ADJUSTMENT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value} className="rounded-lg">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {type === "MANUAL" && (
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Entrada 1</label>
                      <Input 
                        type="time" 
                        value={punches.firstIn} 
                        onChange={(e) => setPunches({...punches, firstIn: e.target.value})}
                        className="rounded-xl border-slate-100 bg-slate-50/10" 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Almoço (Saída)</label>
                      <Input 
                        type="time" 
                        value={punches.lunchOut} 
                        onChange={(e) => setPunches({...punches, lunchOut: e.target.value})}
                        className="rounded-xl border-slate-100 bg-slate-50/10" 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Almoço (Retorno)</label>
                      <Input 
                        type="time" 
                        value={punches.lunchIn} 
                        onChange={(e) => setPunches({...punches, lunchIn: e.target.value})}
                        className="rounded-xl border-slate-100 bg-slate-50/10" 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Saída Final</label>
                      <Input 
                        type="time" 
                        value={punches.lastOut} 
                        onChange={(e) => setPunches({...punches, lastOut: e.target.value})}
                        className="rounded-xl border-slate-100 bg-slate-50/10" 
                      />
                   </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ponto Justificativa (Obrigatório)</label>
                <Textarea 
                  placeholder="Descreva o motivo da alteração manual ou do abono..." 
                  className="rounded-2xl min-h-[100px] border-slate-100 bg-slate-50/30 focus:ring-indigo-500"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>
            </>
          )}
        </div>

        {!isLocked && (
          <DialogFooter className="p-8 pt-0 flex gap-3">
             <Button 
               variant="ghost" 
               className="flex-1 rounded-2xl h-12 font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50"
               onClick={() => onOpenChange(false)}
             >
                Cancelar
             </Button>
             <Button 
               className="flex-[2] rounded-2xl h-12 font-black text-xs uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 gap-2"
               onClick={handleSave}
               disabled={isSubmitting || (type === "MANUAL" && !reason)}
             >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Salvar Ajustes
             </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
