"use client"

import { useState } from "react"
import { startTerminationProcess } from "../desligamentos/actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { CalendarIcon, Play } from "lucide-react"

export function StartTerminationModal({ employeeId }: { employeeId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      await startTerminationProcess(employeeId, {
        type: formData.get("type") as string,
        terminationDate: new Date(formData.get("terminationDate") as string),
        noticeDate: formData.get("noticeDate") ? new Date(formData.get("noticeDate") as string) : undefined,
        reason: formData.get("reason") as string,
      })
      setOpen(false)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-rose-500 text-white shadow-lg shadow-rose-500/30 px-8 py-3 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-rose-600 transition-colors">
          <Play className="w-4 h-4 mr-2" /> Iniciar Desligamento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Iniciar Processo de Desligamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-4">Tipo de Rescisão</label>
            <select name="type" className="flex h-12 w-full items-center justify-between rounded-full border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1" required>
              <option value="RESIGNATION">Pedido de Demissão</option>
              <option value="DISMISSAL_WITHOUT_CAUSE">Demissão sem Justa Causa</option>
              <option value="DISMISSAL_WITH_CAUSE">Demissão com Justa Causa</option>
              <option value="END_OF_CONTRACT">Término de Contrato</option>
              <option value="PROBATION_PERIOD">Fim de Experiência</option>
              <option value="MUTUAL_AGREEMENT">Acordo Mútuo</option>
            </select>
          </div>
          <div>
             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-4">Data de Saída</label>
             <Input type="date" name="terminationDate" required className="rounded-full h-12 mt-1" />
          </div>
          <div>
             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-4">Data do Aviso Prévio (Opcional)</label>
             <Input type="date" name="noticeDate" className="rounded-full h-12 mt-1" />
          </div>
          <div>
             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-4">Motivo / Notas</label>
             <Input name="reason" placeholder="Detalhes adicionais..." className="rounded-full h-12 mt-1" />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-12 rounded-full font-black uppercase tracking-widest">
             {loading ? "Processando..." : "Confirmar e Congelar Funcionário"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
