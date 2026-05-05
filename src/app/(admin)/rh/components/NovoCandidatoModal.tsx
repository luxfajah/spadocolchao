"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UserPlus, Loader2, Upload, X, FileText } from "lucide-react"
import { createCandidate } from "./rh-actions"

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess?: () => void
}

export function NovoCandidatoModal({ open, onOpenChange, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", positionOfInterest: "", notes: ""
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      // In production, upload to storage (S3/Cloudflare R2) and get URL
      // For local ERP, we save the file name as reference
      const resumeUrl = selectedFile ? `curriculos/${selectedFile.name}` : undefined
      
      await createCandidate({
        ...form,
        resumeUrl
      })
      
      onOpenChange(false)
      setForm({ fullName: "", email: "", phone: "", positionOfInterest: "", notes: "" })
      setSelectedFile(null)
      onSuccess?.()
      window.location.reload()
    } catch (err) {
      alert("Erro ao cadastrar candidato.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8 max-w-lg">
        <DialogHeader className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black font-outfit uppercase italic leading-none tracking-tight">
              Novo Candidato
            </DialogTitle>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cadastro no Banco de Talentos</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5 pl-1">Nome Completo *</label>
            <Input required value={form.fullName} onChange={e => set("fullName", e.target.value)}
              placeholder="Nome do candidato" className="rounded-full h-12 border-slate-100 bg-slate-50 font-medium" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5 pl-1">E-mail</label>
              <Input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                placeholder="email@exemplo.com" className="rounded-full h-12 border-slate-100 bg-slate-50 font-medium" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5 pl-1">Telefone</label>
              <Input value={form.phone} onChange={e => set("phone", e.target.value)}
                placeholder="(11) 9 9999-9999" className="rounded-full h-12 border-slate-100 bg-slate-50 font-medium" />
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5 pl-1">Cargo de Interesse</label>
            <Input value={form.positionOfInterest} onChange={e => set("positionOfInterest", e.target.value)}
              placeholder="Ex: Auxiliar de Produção" className="rounded-full h-12 border-slate-100 bg-slate-50 font-medium" />
          </div>

          {/* Upload de Currículo */}
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5 pl-1">Currículo (PDF/DOCX)</label>
            <label className="cursor-pointer flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-primary hover:bg-primary/5 transition-all group">
              <div className="h-10 w-10 rounded-xl bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center flex-shrink-0 transition-colors">
                {selectedFile ? <FileText className="h-5 w-5 text-primary" /> : <Upload className="h-5 w-5 text-slate-400 group-hover:text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                {selectedFile ? (
                  <p className="text-sm font-bold text-primary truncate">{selectedFile.name}</p>
                ) : (
                  <p className="text-sm font-bold text-slate-400 group-hover:text-primary">Clique para selecionar o arquivo</p>
                )}
                <p className="text-[10px] text-slate-300 uppercase font-bold tracking-widest mt-0.5">PDF, DOC ou DOCX • Máx. 5MB</p>
              </div>
              {selectedFile && (
                <button type="button" onClick={(e) => { e.preventDefault(); setSelectedFile(null) }}
                  className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 flex-shrink-0 transition-colors">
                  <X className="h-3 w-3 text-red-500" />
                </button>
              )}
              <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1.5 pl-1">Observações</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
              rows={2} placeholder="Indicação, origem do currículo, observações..."
              className="flex w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}
              className="flex-1 rounded-full h-13 font-black text-xs uppercase tracking-widest text-slate-400">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}
              className="flex-2 rounded-full h-13 px-8 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 font-black text-xs uppercase tracking-widest gap-2">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</> : <><UserPlus className="h-4 w-4" /> Cadastrar</>}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
