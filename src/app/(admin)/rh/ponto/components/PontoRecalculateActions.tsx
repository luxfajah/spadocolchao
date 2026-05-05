"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  RefreshCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  FileWarning
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Props {
  mode: "employee" | "competency" | "all"
  employeeId?: string
  year?: number
  month?: number
  period?: string // YYYY-MM
  label?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link"
  className?: string
  showIcon?: boolean
}

export function PontoRecalculateActions({ 
  mode, 
  employeeId, 
  year, 
  month, 
  period, 
  label,
  variant = "outline",
  className = "",
  showIcon = true
}: Props) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmData, setConfirmData] = useState<any>(null)

  const handleRecalculate = async (confirmLocked = false) => {
    setLoading(true)
    try {
      const response = await fetch("/api/attendance/recalculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          employeeId,
          year,
          month,
          period,
          confirmLocked
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          // Locked competency detected
          setConfirmData(data)
          setShowConfirm(true)
          return
        }
        throw new Error(data.error || "Erro ao recalcular ponto")
      }

      toast({
        title: "Sucesso!",
        description: mode === "employee" 
          ? "Espelho recalculado com sucesso." 
          : mode === "competency" 
            ? `Processados ${data.succeeded} de ${data.total} espelhos.`
            : "Todos os espelhos foram atualizados.",
      })

      // Refresh page to show new data
      window.location.reload()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no Recálculo",
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const getButtonLabel = () => {
    if (label) return label
    switch (mode) {
      case "employee": return "Recalcular Mês"
      case "competency": return "Recalcular Todos (Mês)"
      case "all": return "Recalcular Histórico Total"
    }
  }

  return (
    <>
      <Button 
        variant={variant}
        className={`rounded-full gap-2 font-black text-[10px] uppercase tracking-widest ${className}`}
        onClick={() => handleRecalculate(false)}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : showIcon ? (
          <RefreshCcw className="h-3.5 w-3.5" />
        ) : null}
        {getButtonLabel()}
      </Button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="rounded-[2rem] border-slate-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 font-outfit uppercase font-black tracking-tight">
              <AlertTriangle className="h-5 w-5" /> Atenção: Folha Fechada
            </DialogTitle>
            <DialogDescription className="text-slate-600 font-medium leading-relaxed">
              {mode === "employee" ? (
                <>
                  Este funcionário já possui uma holerite <strong>{confirmData?.payrollStatus === 'PAID' ? 'PAGA' : 'GERADA'}</strong> para este período. 
                  Recalcular o ponto mudará os saldos de horas e pode gerar inconsistência com o que já foi processado financeiramente.
                </>
              ) : (
                <>
                  Existem <strong>{confirmData?.locked?.length || confirmData?.lockedPayrolls}</strong> folhas de pagamento já geradas ou pagas neste grupo. 
                  O recálculo afetará dados contratuais de períodos já encerrados.
                </>
              )}
              <br /><br />
              Deseja prosseguir com o recálculo forçado?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)} className="rounded-xl border-slate-200 font-bold uppercase text-[10px] tracking-widest h-11">
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                setShowConfirm(false)
                handleRecalculate(true)
              }}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10px] tracking-widest h-11 shadow-lg shadow-rose-600/20"
            >
              Sim, Recalcular Tudo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
