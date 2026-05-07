"use client"

import { useState, useTransition } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Layers, 
  CheckCircle2, 
  Loader2, 
  AlertTriangle,
  Users
} from "lucide-react"
import { generateBulkHolerites, finalizeBulkHolerites } from "../actions"
import { useToast } from "@/hooks/use-toast"

type BulkGenerationModalProps = {
  isOpen: boolean
  onClose: () => void
  period: string
  departments: string[]
}

export function BulkGenerationModal({ isOpen, onClose, period, departments }: BulkGenerationModalProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [selectedDept, setSelectedDept] = useState("all")
  const [mode, setMode] = useState<"draft" | "finalize">("finalize")
  const [step, setStep] = useState<"confirm" | "success">("confirm")
  const [generatedCount, setGeneratedCount] = useState(0)

  function handleAction() {
    startTransition(async () => {
      try {
        let result
        if (mode === "draft") {
          result = await generateBulkHolerites(period, selectedDept)
        } else {
          result = await finalizeBulkHolerites(period, selectedDept)
        }
        
        setGeneratedCount(result.count)
        setStep("success")
        toast({
          title: "Sucesso",
          description: mode === "draft" 
            ? `${result.count} rascunhos gerados com sucesso!` 
            : `${result.count} holerites processados e finalizados!`,
        })
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao processar operação em lote.",
        })
        onClose()
      }
    })
  }

  function handleClose() {
    setStep("confirm")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-slate-950 text-white border-white/10 rounded-[2.5rem] p-8 overflow-hidden shadow-2xl">
        {step === "confirm" ? (
          <div className="space-y-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-20 w-20 rounded-[2.5rem] bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                <Layers className="h-10 w-10 text-indigo-400" />
              </div>
              <div className="space-y-2">
                <DialogTitle className="font-outfit font-black text-2xl uppercase italic tracking-tight">Geração em Bloco</DialogTitle>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest px-8">
                  O sistema irá processar automaticamente o rascunho de todos os colaboradores ativos sem holerite.
                </p>
              </div>
            </div>

            <div className="space-y-4 bg-white/5 p-6 rounded-[2rem] border border-white/5">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-2xl mb-4">
                <button 
                  onClick={() => setMode("finalize")}
                  className={`h-10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${mode === "finalize" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
                >
                  Finalizar Rascunhos
                </button>
                <button 
                  onClick={() => setMode("draft")}
                  className={`h-10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${mode === "draft" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
                >
                  Gerar Rascunhos
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Filtrar por Setor</label>
                <Select value={selectedDept} onValueChange={setSelectedDept}>
                  <SelectTrigger className="h-12 rounded-2xl bg-slate-900 border-white/10 text-white font-bold text-xs uppercase tracking-widest">
                    <SelectValue placeholder="Todos os setores" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white rounded-2xl">
                    <SelectItem value="all" className="font-bold uppercase tracking-widest text-[9px]">Todos os Setores</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept} className="font-bold uppercase tracking-widest text-[9px]">
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl transition-all">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                <p className="text-[9px] text-amber-200/80 font-medium uppercase tracking-wider leading-relaxed">
                  {mode === "finalize" 
                    ? "Esta ação processará todos os holerites em status RASCUNHO (DRAFT) para PROCESSADO (GENERATED), criando os lançamentos financeiros correspondentes."
                    : "O sistema irá criar rascunhos para todos os colaboradores ativos que ainda não possuem holerite nesta competência."}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button 
                onClick={handleAction}
                disabled={isPending}
                className="h-14 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase text-xs tracking-widest transition-all hover:-translate-y-1 shadow-xl shadow-indigo-500/10"
              >
                {isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</>
                ) : (
                  mode === "finalize" ? "Processar Holerites (Finalizar)" : "Gerar Novos Rascunhos"
                )}
              </Button>
              <Button 
                variant="ghost" 
                onClick={onClose}
                className="h-12 rounded-2xl text-slate-500 hover:text-white hover:bg-white/5 font-black uppercase text-[10px] tracking-widest"
              >
                Voltar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8 py-4 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-20 w-20 rounded-[2.5rem] bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              </div>
              <div className="space-y-2">
                <DialogTitle className="font-outfit font-black text-2xl uppercase italic tracking-tight text-emerald-400">Sucesso!</DialogTitle>
                <div className="flex items-center justify-center gap-2 bg-emerald-500/5 px-4 py-2 rounded-full border border-emerald-500/10">
                  <Users className="h-3 w-3 text-emerald-400" />
                  <span className="text-sm font-black text-white">{generatedCount} Holerites Processados</span>
                </div>
              </div>
            </div>

            <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest px-4 leading-relaxed">
              {mode === "draft" 
                ? "Os holerites foram criados com status Rascunho. Você pode revisá-los individualmente na lista principal antes de finalizar a folha."
                : "Os holerites foram finalizados e os lançamentos financeiros foram integrados com sucesso."}
            </p>

            <Button 
              onClick={handleClose}
              className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase text-xs tracking-widest transition-all"
            >
              Entendido
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
