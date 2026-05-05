"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertOctagon, Loader2 } from "lucide-react"
import { createDisciplinaryAction, getActiveEmployees } from "./rh-actions"
import { FileUploadField } from "./FileUploadField"
import { getEmployeeOptionLabel } from "@/lib/employee-name"

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  employeeId?: string
  onSuccess?: () => void
}

export function NovaOcorrenciaModal({ open, onOpenChange, employeeId, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState<{ id: string; fullName: string; socialName?: string | null }[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const today = new Date().toISOString().split("T")[0]
  const [form, setForm] = useState({
    employeeId: employeeId || "",
    type: "WRITTEN_WARNING",
    reason: "",
    description: "",
    incidentDate: today,
    applicationDate: today,
  })

  useEffect(() => {
    if (open) {
      if (!employeeId) getActiveEmployees().then(setEmployees)
      else setForm(prev => ({ ...prev, employeeId }))
    }
  }, [open, employeeId])

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.employeeId) return alert("Selecione um funcionário.")
    if (!form.reason) return alert("Informe o motivo da ocorrência.")
    setLoading(true)
    try {
      // Em produção, fazer upload do arquivo para armazenamento (S3/R2) e obter URL
      const attachmentUrl = selectedFile ? `documentos/advertencias/${Date.now()}_${selectedFile.name}` : undefined
      await createDisciplinaryAction({ ...form, attachmentUrl })
      onOpenChange(false)
      setSelectedFile(null)
      setForm({ employeeId: employeeId || "", type: "WRITTEN_WARNING", reason: "", description: "", incidentDate: today, applicationDate: today })
      onSuccess?.()
      window.location.reload()
    } catch (err) {
      alert("Erro ao registrar ocorrência.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-2xl bg-rose-500/10 flex items-center justify-center">
              <AlertOctagon className="h-5 w-5 text-rose-500" />
            </div>
            <DialogTitle className="text-2xl font-black font-outfit uppercase italic leading-none tracking-tight text-rose-600">
              Nova Ocorrência
            </DialogTitle>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Registro de Ação Disciplinar</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!employeeId && (
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5 pl-1">Funcionário *</label>
              <select required value={form.employeeId} onChange={e => set("employeeId", e.target.value)}
                className="flex h-12 w-full rounded-full border border-slate-100 bg-slate-50 px-5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500">
                <option value="">Selecione o funcionário...</option>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{getEmployeeOptionLabel(emp)}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5 pl-1">Tipo de Ocorrência *</label>
            <select required value={form.type} onChange={e => set("type", e.target.value)}
              className="flex h-12 w-full rounded-full border border-slate-100 bg-slate-50 px-5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500">
              <option value="VERBAL_WARNING">Advertência Verbal</option>
              <option value="WRITTEN_WARNING">Advertência Escrita</option>
              <option value="SUSPENSION">Suspensão</option>
              <option value="WRITTEN_COMMITMENT">Termo de Compromisso</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5 pl-1">Data do Fato *</label>
              <Input required type="date" value={form.incidentDate} onChange={e => set("incidentDate", e.target.value)}
                className="rounded-full h-12 border-slate-100 bg-slate-50 font-medium" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5 pl-1">Data de Aplicação *</label>
              <Input required type="date" value={form.applicationDate} onChange={e => set("applicationDate", e.target.value)}
                className="rounded-full h-12 border-slate-100 bg-slate-50 font-medium" />
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5 pl-1">Motivo / Infração *</label>
            <Input required value={form.reason} onChange={e => set("reason", e.target.value)}
              placeholder="Ex: Atraso reiterado sem justificativa"
              className="rounded-full h-12 border-slate-100 bg-slate-50 font-medium" />
          </div>

          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5 pl-1">Descrição Detalhada</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              rows={2} placeholder="Descreva os fatos com detalhes..."
              className="flex w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none" />
          </div>

          {/* Upload de documento */}
          <FileUploadField
            label="Documento / Carta de Advertência"
            hint="PDF, DOCX ou imagem da advertência assinada • Máx. 10MB"
            accentColor="rose"
            onChange={setSelectedFile}
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}
              className="flex-1 rounded-full h-12 font-black text-xs uppercase tracking-widest text-slate-400">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}
              className="flex-[2] rounded-full h-12 px-8 bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 font-black text-xs uppercase tracking-widest gap-2">
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Registrando...</>
                : <><AlertOctagon className="h-4 w-4" /> Registrar Ocorrência</>
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
