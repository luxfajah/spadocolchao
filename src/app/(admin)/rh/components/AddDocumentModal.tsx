"use client"

import { useState } from "react"
import { addEmployeeDocument } from "../funcionarios/[id]/actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"

export function AddDocumentModal({ employeeId }: { employeeId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      await addEmployeeDocument(employeeId, {
        type: formData.get("type") as string,
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        fileUrl: formData.get("fileUrl") as string,
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
        <Button variant="outline" className="rounded-xl border-dashed border-slate-300 text-slate-500 font-bold uppercase tracking-widest text-xs h-12 w-full mt-4">
          <Plus className="w-4 h-4 mr-2" /> Adicionar Documento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
           <DialogTitle>Anexar Novo Documento</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-4">Tipo de Documento</label>
            <select name="type" className="flex h-12 w-full items-center justify-between rounded-full border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none mt-1" required>
              <option value="ID">Identidade / CNH</option>
              <option value="CPF">CPF</option>
              <option value="PROOF_OF_ADDRESS">Comprovante de Residência</option>
              <option value="CONTRACT">Contrato Assinado</option>
              <option value="CERTIFICATE">Certificado / Diploma</option>
              <option value="EXAM">Exame Ocupacional</option>
              <option value="OTHER">Outro</option>
            </select>
          </div>
          <div>
             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-4">Nome do Arquivo</label>
             <Input name="name" required placeholder="Ex: CNH Frente e Verso" className="rounded-full h-12 mt-1" />
          </div>
          <div>
             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-4">Descrição (Opcional)</label>
             <Input name="description" className="rounded-full h-12 mt-1" />
          </div>
          <div>
             <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-4">URL do Arquivo (Simulação/S3)</label>
             <Input name="fileUrl" required type="url" placeholder="https://..." defaultValue="https://exemplo.com/arquivo.pdf" className="rounded-full h-12 mt-1" />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-12 rounded-full font-black uppercase tracking-widest mt-4 bg-primary hover:bg-primary/90 text-white">
             {loading ? "Salvando..." : "Salvar Anexo"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
