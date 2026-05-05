"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PowerOff, Loader2, AlertTriangle } from "lucide-react"
import { startTerminationFromList, getActiveEmployees } from "./rh-actions"
import { FileUploadField } from "./FileUploadField"
import { getEmployeeOptionLabel } from "@/lib/employee-name"

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  employeeId?: string
  employeeName?: string
  onSuccess?: () => void
}

export function NovoDesligamentoModal({ open, onOpenChange, employeeId, employeeName, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState<{ id: string; fullName: string; socialName?: string | null }[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const today = new Date().toISOString().split("T")[0]
  const [form, setForm] = useState({
    employeeId: employeeId || "",
    type: "VOLUNTARY",
    reason: "",
    terminationDate: today,
    notes: ""
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
    if (!form.reason) return alert("Informe o motivo do desligamento.")
    setLoading(true)
    try {
      // Em produção: upload para armazenamento e obtenção da URL
      const attachmentUrl = selectedFile ? `documentos/desligamentos/${Date.now()}_${selectedFile.name}` : undefined
      await startTerminationFromList({ ...form, attachmentUrl })
      onOpenChange(false)
      setSelectedFile(null)
      setForm({ employeeId: employeeId || "", type: "VOLUNTARY", reason: "", terminationDate: today, notes: "" })
      onSuccess?.()
      window.location.reload()
    } catch (err) {
      alert("Erro ao registrar desligamento.")
    } finally {
      setLoading(false)
    }
  }

  const selectedEmployee = employees.find((employee) => employee.id === form.employeeId)
  const selectedName = employeeName || (selectedEmployee ? getEmployeeOptionLabel(selectedEmployee) : "")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-2xl bg-orange-500/10 flex items-center justify-center">
              <PowerOff className="h-5 w-5 text-orange-500" />
            </div>
            <DialogTitle className="text-2xl font-black font-outfit uppercase italic leading-none tracking-tight text-orange-600">
              Novo Desligamento
            </DialogTitle>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Iniciar processo de off-boarding</p>
        </DialogHeader>

        {/* Alerta de confirmação */}
        {selectedName && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-orange-50 border border-orange-100 mb-4">
            <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-orange-800">Funcionário selecionado:</p>
              <p className="text-base font-black text-orange-900 font-outfit uppercase">{selectedName}</p>
              <p className="text-[10px] text-orange-600 uppercase tracking-widest font-bold mt-0.5">
                O status será alterado para INATIVO após confirmar.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!employeeId && (
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5 pl-1">Funcionário *</label>
              <select required value={form.employeeId} onChange={e => set("employeeId", e.target.value)}
                className="flex h-12 w-full rounded-full border border-slate-100 bg-slate-50 px-5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Selecione o funcionário...</option>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{getEmployeeOptionLabel(emp)}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5 pl-1">Tipo *</label>
              <select required value={form.type} onChange={e => set("type", e.target.value)}
                className="flex h-12 w-full rounded-full border border-slate-100 bg-slate-50 px-5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="VOLUNTARY">Pedido de Demissão</option>
                <option value="WITHOUT_CAUSE">Demissão S/ Justa Causa</option>
                <option value="WITH_CAUSE">Demissão C/ Justa Causa</option>
                <option value="MUTUAL">Distrato / Mútuo Acordo</option>
                <option value="RETIREMENT">Aposentadoria</option>
                <option value="CONTRACT_END">Fim de Contrato</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5 pl-1">Data *</label>
              <Input required type="date" value={form.terminationDate} onChange={e => set("terminationDate", e.target.value)}
                className="rounded-full h-12 border-slate-100 bg-slate-50 font-medium" />
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5 pl-1">Motivo do Desligamento *</label>
            <Input required value={form.reason} onChange={e => set("reason", e.target.value)}
              placeholder="Ex: Reestruturação de equipe"
              className="rounded-full h-12 border-slate-100 bg-slate-50 font-medium" />
          </div>

          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5 pl-1">Observações</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
              rows={2} placeholder="Checklist, pendências de devolução..."
              className="flex w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
          </div>

          {/* Upload de documentos */}
          <FileUploadField
            label="Carta de Demissão / Documentos Rescisórios"
            hint="Pedido de demissão, termo de rescisão ou distrato • PDF ou imagem • Máx. 10MB"
            accentColor="orange"
            onChange={setSelectedFile}
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}
              className="flex-1 rounded-full h-12 font-black text-xs uppercase tracking-widest text-slate-400">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}
              className="flex-[2] rounded-full h-12 px-8 bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 font-black text-xs uppercase tracking-widest gap-2">
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Processando...</>
                : <><PowerOff className="h-4 w-4" /> Confirmar Desligamento</>
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
