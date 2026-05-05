"use client"

import { useState, useEffect } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { savePayable, getAccountPayableFormData } from "./actions"
import { Loader2, Calendar, DollarSign, User, Tag, Building2, Wallet } from "lucide-react"

interface PayableFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payable?: any
  onSuccess?: () => void
}

export function PayableFormDialog({ open, onOpenChange, payable, onSuccess }: PayableFormDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<any>({
    description: "",
    amount: "",
    dueDate: "",
    issueDate: new Date().toISOString().split('T')[0],
    supplierId: "",
    financialCategoryId: "",
    costCenterId: "",
    financialAccountId: "",
    notes: ""
  })

  const [options, setOptions] = useState<{
    suppliers: any[],
    costCenters: any[],
    categories: any[],
    accounts: any[]
  }>({
    suppliers: [],
    costCenters: [],
    categories: [],
    accounts: []
  })

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        const data = await getAccountPayableFormData()
        setOptions(data)
      }
      fetchData()
    }
  }, [open])

  useEffect(() => {
    if (payable) {
      setFormData({
        id: payable.id,
        description: payable.description || "",
        amount: payable.amount?.toString() || "",
        dueDate: payable.dueDate ? new Date(payable.dueDate).toISOString().split('T')[0] : "",
        issueDate: payable.issueDate ? new Date(payable.issueDate).toISOString().split('T')[0] : "",
        supplierId: payable.supplierId || "none",
        financialCategoryId: payable.financialCategoryId || "none",
        costCenterId: payable.costCenterId || "none",
        financialAccountId: payable.financialAccountId || "none",
        notes: payable.notes || ""
      })
    } else {
      setFormData({
        description: "",
        amount: "",
        dueDate: "",
        issueDate: new Date().toISOString().split('T')[0],
        supplierId: "none",
        financialCategoryId: "none",
        costCenterId: "none",
        financialAccountId: "none",
        notes: ""
      })
    }
  }, [payable, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const submissionData = { ...formData }
      // Clean up "none" values to null
      if (submissionData.supplierId === "none") submissionData.supplierId = null
      if (submissionData.financialCategoryId === "none") submissionData.financialCategoryId = null
      if (submissionData.costCenterId === "none") submissionData.costCenterId = null
      if (submissionData.financialAccountId === "none") submissionData.financialAccountId = null

      await savePayable(submissionData)
      toast({ title: "Sucesso", description: `Conta a pagar ${formData.id ? 'atualizada' : 'criada'} com sucesso.` })
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-[2.5rem] border-none p-0 overflow-hidden shadow-2xl bg-white">
        <div className="bg-slate-950 p-8 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
           <div className="relative z-10">
              <DialogTitle className="text-2xl font-black font-outfit uppercase italic leading-none tracking-tight">
                {formData.id ? 'Editar Conta' : 'Nova Conta a Pagar'}
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
                Gestão de Obrigações Financeiras
              </DialogDescription>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Tag className="w-3 h-3" /> Descrição do Lançamento
              </Label>
              <Input 
                required 
                className="h-14 rounded-2xl border-none bg-slate-50 font-bold text-slate-800 placeholder:text-slate-400 focus-visible:ring-primary/20" 
                placeholder="Ex: Aluguel Mensal, Compra de Insumos..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <DollarSign className="w-3 h-3" /> Valor Total
              </Label>
              <Input 
                required 
                type="number" 
                step="0.01"
                className="h-14 rounded-2xl border-none bg-slate-50 font-black text-lg text-primary font-outfit" 
                placeholder="0,00"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Data de Vencimento
              </Label>
              <Input 
                required 
                type="date"
                className="h-14 rounded-2xl border-none bg-slate-50 font-bold text-slate-700"
                value={formData.dueDate}
                onChange={e => setFormData({...formData, dueDate: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <User className="w-3 h-3" /> Fornecedor / Credor
              </Label>
              <Select value={formData.supplierId} onValueChange={v => setFormData({...formData, supplierId: v})}>
                <SelectTrigger className="h-14 rounded-2xl border-none bg-slate-50 font-bold text-slate-700">
                  <SelectValue placeholder="Selecione o fornecedor" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="none" className="font-bold text-slate-400 italic">Nenhum / Não informado</SelectItem>
                  {options.suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id} className="font-bold uppercase text-[10px] tracking-tight py-3">
                      {s.legalName || s.tradeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Building2 className="w-3 h-3" /> Centro de Custo
              </Label>
              <Select value={formData.costCenterId} onValueChange={v => setFormData({...formData, costCenterId: v})}>
                <SelectTrigger className="h-14 rounded-2xl border-none bg-slate-50 font-bold text-slate-700">
                  <SelectValue placeholder="Selecione o centro de custo" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="none" className="font-bold text-slate-400 italic">Nenhum / Não informado</SelectItem>
                  {options.costCenters.map(cc => (
                    <SelectItem key={cc.id} value={cc.id} className="font-bold uppercase text-[10px] tracking-tight py-3">
                      {cc.name} ({cc.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Wallet className="w-3 h-3" /> Categoria Financeira
              </Label>
              <Select value={formData.financialCategoryId} onValueChange={v => setFormData({...formData, financialCategoryId: v})}>
                <SelectTrigger className="h-14 rounded-2xl border-none bg-slate-50 font-bold text-slate-700">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="none" className="font-bold text-slate-400 italic">Nenhuma / Não informada</SelectItem>
                  {options.categories.map(c => (
                    <SelectItem key={c.id} value={c.id} className="font-bold uppercase text-[10px] tracking-tight py-3">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Building2 className="w-3 h-3" /> Conta de Origem
              </Label>
              <Select value={formData.financialAccountId} onValueChange={v => setFormData({...formData, financialAccountId: v})}>
                <SelectTrigger className="h-14 rounded-2xl border-none bg-slate-50 font-bold text-slate-700">
                  <SelectValue placeholder="Selecione a conta bancária" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="none" className="font-bold text-slate-400 italic">Indefinido (Lançamento Pendente)</SelectItem>
                  {options.accounts.map(a => (
                    <SelectItem key={a.id} value={a.id} className="font-bold uppercase text-[10px] tracking-tight py-3">
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Observações Internas</Label>
              <Textarea 
                className="min-h-[100px] rounded-2xl border-none bg-slate-50 font-medium text-slate-700 focus-visible:ring-primary/20"
                placeholder="Detalhes adicionais sobre este pagamento..."
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter className="gap-3 pt-4">
             <Button 
               type="button" 
               variant="ghost" 
               className="h-14 px-8 rounded-full font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50"
               onClick={() => onOpenChange(false)}
             >
               Cancelar
             </Button>
             <Button 
               type="submit" 
               disabled={loading}
               className="h-14 px-12 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-rose-500/20"
             >
               {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : formData.id ? 'Salvar Alterações' : 'Confirmar Lançamento'}
             </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
