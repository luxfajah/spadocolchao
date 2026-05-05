"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CalendarCheck, Loader2 } from "lucide-react"
import { scheduleInterview, getAllCandidates, getAllJobOpenings } from "./rh-actions"

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  candidateId?: string
  jobOpeningId?: string
  onSuccess?: () => void
}

export function AgendarEntrevistaModal({ open, onOpenChange, candidateId, jobOpeningId, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [candidates, setCandidates] = useState<{ id: string; fullName: string }[]>([])
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([])
  const [form, setForm] = useState({
    candidateId: candidateId || "",
    jobOpeningId: jobOpeningId || "",
    scheduledDate: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "10:00",
    stage: "SCREENING",
    locationOrLink: "",
    notes: ""
  })

  useEffect(() => {
    if (open) {
      getAllCandidates().then(setCandidates)
      getAllJobOpenings().then(setJobs)
      if (candidateId) setForm(prev => ({ ...prev, candidateId }))
      if (jobOpeningId) setForm(prev => ({ ...prev, jobOpeningId }))
    }
  }, [open, candidateId, jobOpeningId])

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.candidateId) return alert("Selecione um candidato.")
    setLoading(true)
    try {
      await scheduleInterview(form)
      onOpenChange(false)
      onSuccess?.()
      window.location.reload()
    } catch (err) {
      alert("Erro ao agendar entrevista. Verifique os dados.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 max-w-lg">
        <DialogHeader className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <CalendarCheck className="h-5 w-5 text-blue-500" />
            </div>
            <DialogTitle className="text-2xl font-black font-outfit uppercase italic leading-none tracking-tight">
              Agendar Entrevista
            </DialogTitle>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Defina data, horário e candidato</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!candidateId && (
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5 pl-1">Candidato *</label>
              <select required value={form.candidateId} onChange={e => set("candidateId", e.target.value)}
                className="flex h-12 w-full rounded-full border border-slate-100 bg-slate-50 px-5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Selecione um candidato...</option>
                {candidates.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
              </select>
            </div>
          )}

          {!jobOpeningId && (
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5 pl-1">Vaga (opcional)</label>
              <select value={form.jobOpeningId} onChange={e => set("jobOpeningId", e.target.value)}
                className="flex h-12 w-full rounded-full border border-slate-100 bg-slate-50 px-5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Entrevista geral / sem vaga vinculada</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5 pl-1">Etapa</label>
              <select value={form.stage} onChange={e => set("stage", e.target.value)}
                className="flex h-12 w-full rounded-full border border-slate-100 bg-slate-50 px-5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="SCREENING">Triagem</option>
                <option value="TECHNICAL">Técnica</option>
                <option value="FINAL">Final</option>
                <option value="FIT">Cultural</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5 pl-1">Data *</label>
              <Input required type="date" value={form.scheduledDate} onChange={e => set("scheduledDate", e.target.value)}
                className="rounded-full h-12 border-slate-100 bg-slate-50 font-medium" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5 pl-1">Início *</label>
              <Input required type="time" value={form.startTime} onChange={e => set("startTime", e.target.value)}
                className="rounded-full h-12 border-slate-100 bg-slate-50 font-medium" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5 pl-1">Término *</label>
              <Input required type="time" value={form.endTime} onChange={e => set("endTime", e.target.value)}
                className="rounded-full h-12 border-slate-100 bg-slate-50 font-medium" />
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5 pl-1">Local / Link Online</label>
            <Input value={form.locationOrLink} onChange={e => set("locationOrLink", e.target.value)}
              placeholder="Sala de RH • ou cole o link do Meet/Zoom" className="rounded-full h-12 border-slate-100 bg-slate-50 font-medium" />
          </div>

          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5 pl-1">Observações</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
              rows={2} placeholder="Orientações para o entrevistador ou candidato..."
              className="flex w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}
              className="flex-1 rounded-full h-12 font-black text-xs uppercase tracking-widest text-slate-400">Cancelar</Button>
            <Button type="submit" disabled={loading}
              className="flex-2 rounded-full h-12 px-8 bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20 font-black text-xs uppercase tracking-widest gap-2">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Agendando...</> : <><CalendarCheck className="h-4 w-4" /> Confirmar Agendamento</>}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
