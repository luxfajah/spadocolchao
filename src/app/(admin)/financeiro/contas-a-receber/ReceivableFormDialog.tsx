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
import { saveReceivable, getAccountReceivableFormData } from "./actions"
import { Loader2, Calendar, DollarSign, User, Tag, Building2, Wallet } from "lucide-react"

interface ReceivableFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  receivable?: any
  onSuccess?: () => void
}

export function ReceivableFormDialog({ open, onOpenChange, receivable, onSuccess }: ReceivableFormDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<any>({
    description: "",
    amount: "",
    dueDate: "",
    issueDate: new Date().toISOString().split('T')[0],
    customerId: "",
    financialCategoryId: "",
    costCenterId: "",
    financialAccountId: "",
    paymentMethodId: "",
    notes: ""
  })

  const [options, setOptions] = useState<{
    customers: any[],
    costCenters: any[],
    categories: any[],
    accounts: any[],
    paymentMethods: any[]
  }>({
    customers: [],
    costCenters: [],
    categories: [],
    accounts: [],
    paymentMethods: []
  })

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        const data = await getAccountReceivableFormData()
        setOptions(data)
      }
      fetchData()
    }
  }, [open])

  useEffect(() => {
    if (receivable) {
      setFormData({
        id: receivable.id,
        description: receivable.description || "",
        amount: receivable.amount?.toString() || "",
        dueDate: receivable.dueDate ? new Date(receivable.dueDate).toISOString().split('T')[0] : "",
        issueDate: receivable.issueDate ? new Date(receivable.issueDate).toISOString().split('T')[0] : "",
        customerId: receivable.customerId || "none",
        financialCategoryId: receivable.financialCategoryId || "none",
        costCenterId: receivable.costCenterId || "none",
        financialAccountId: receivable.financialAccountId || "none",
        paymentMethodId: receivable.paymentMethodId || "none",
        notes: receivable.notes || ""
      })
    } else {
      setFormData({
        description: "",
        amount: "",
        dueDate: "",
        issueDate: new Date().toISOString().split('T')[0],
        customerId: "none",
        financialCategoryId: "none",
        costCenterId: "none",
        financialAccountId: "none",
        paymentMethodId: "none",
        notes: ""
      })
    }
  }, [receivable, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const submissionData = { ...formData }
      if (submissionData.customerId === "none") submissionData.customerId = null
      if (submissionData.financialCategoryId === "none") submissionData.financialCategoryId = null
      if (submissionData.costCenterId === "none") submissionData.costCenterId = null
      if (submissionData.financialAccountId === "none") submissionData.financialAccountId = null
      if (submissionData.paymentMethodId === "none") submissionData.paymentMethodId = null

      await saveReceivable(submissionData)
      toast({ title: "Sucesso", description: `Título a receber ${formData.id ? 'atualizado' : 'criado'} com sucesso.` })
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
           <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
           <div className="relative z-10">
              <DialogTitle className="text-2xl font-black font-outfit uppercase italic leading-none tracking-tight">
                {formData.id ? 'Editar Título' : 'Novo Título a Receber'}
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
                Gestão de Receitas e Fluxo de Entrada
              </DialogDescription>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Tag className="w-3 h-3" /> Descrição do Recebimento
              </Label>
              <Input 
                required 
                className="h-14 rounded-2xl border-none bg-slate-50 font-bold text-slate-800 placeholder:text-slate-400 focus-visible:ring-primary/20" 
                placeholder="Ex: Pagamento de Venda #123, Serviço de Limpeza..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <DollarSign className="w-3 h-3" /> Valor Esperado
              </Label>
              <Input 
                required 
                type="number" 
                step="0.01"
                className="h-14 rounded-2xl border-none bg-slate-50 font-black text-lg text-emerald-600 font-outfit" 
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
                <User className="w-3 h-3" /> Cliente
              </Label>
              <Select value={formData.customerId} onValueChange={v => setFormData({...formData, customerId: v})}>
                <SelectTrigger className="h-14 rounded-2xl border-none bg-slate-50 font-bold text-slate-700">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="none" className="font-bold text-slate-400 italic">Nenhum / Venda Balcão</SelectItem>
                  {options.customers.map(c => (
                    <SelectItem key={c.id} value={c.id} className="font-bold uppercase text-[10px] tracking-tight py-3">
                      {c.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Wallet className="w-3 h-3" /> Forma de Pagamento
              </Label>
              <Select value={formData.paymentMethodId} onValueChange={v => setFormData({...formData, paymentMethodId: v})}>
                <SelectTrigger className="h-14 rounded-2xl border-none bg-slate-50 font-bold text-slate-700">
                  <SelectValue placeholder="Forma esperada" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="none" className="font-bold text-slate-400 italic">Não definida</SelectItem>
                  {options.paymentMethods.map(pm => (
                    <SelectItem key={pm.id} value={pm.id} className="font-bold uppercase text-[10px] tracking-tight py-3">
                      {pm.name}
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
                  <SelectItem value="none" className="font-bold text-slate-400 italic">Nenhum</SelectItem>
                  {options.costCenters.map(cc => (
                    <SelectItem key={cc.id} value={cc.id} className="font-bold uppercase text-[10px] tracking-tight py-3">
                      {cc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Wallet className="w-3 h-3" /> Categoria de Receita
              </Label>
              <Select value={formData.financialCategoryId} onValueChange={v => setFormData({...formData, financialCategoryId: v})}>
                <SelectTrigger className="h-14 rounded-2xl border-none bg-slate-50 font-bold text-slate-700">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="none" className="font-bold text-slate-400 italic">Nenhuma</SelectItem>
                  {options.categories.map(c => (
                    <SelectItem key={c.id} value={c.id} className="font-bold uppercase text-[10px] tracking-tight py-3">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Observações</Label>
              <Textarea 
                className="min-h-[100px] rounded-2xl border-none bg-slate-50 font-medium text-slate-700 focus-visible:ring-primary/20"
                placeholder="Detalhes adicionais..."
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
               className="h-14 px-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20"
             >
               {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : formData.id ? 'Salvar Alterações' : 'Confirmar Recebimento'}
             </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
