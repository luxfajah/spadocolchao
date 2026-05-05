"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import { payTitle } from "./actions"
import { CreditCard, Wallet, Calendar as CalendarIcon, Loader2, AlertCircle } from "lucide-react"

export function PaymentDialog({ open, onOpenChange, title }: { open: boolean, onOpenChange: (o: boolean) => void, title: any }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    amount: 0,
    accountId: "",
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ""
  })

  useEffect(() => {
    if (open) {
      if (title) {
        setFormData(prev => ({ 
          ...prev, 
          amount: title.amount - (title.paidAmount || 0)
        }))
      }
      fetchAccounts()
    }
  }, [open, title])

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/financeiro/aux-data?type=EXIT')
      const data = await res.json()
      setAccounts(data.accounts || [])
    } catch (e) {
      console.error("Erro ao buscar contas", e)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.accountId) {
      toast({ title: "Selecione a conta de origem", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      await payTitle({
        titleId: title.id,
        amount: formData.amount,
        accountId: formData.accountId,
        paymentDate: new Date(formData.paymentDate),
        notes: formData.notes
      })
      
      toast({ 
        title: "Pagamento registrado!",
        description: `O pagamento de ${formatCurrency(formData.amount)} foi processado.`,
      })
      onOpenChange(false)
    } catch (error: any) {
      toast({ 
        title: "Erro ao processar", 
        description: error.message,
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  if (!title) return null

  const openBalance = title.amount - (title.paidAmount || 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="bg-rose-500 p-8 text-white relative">
          <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mb-4 backdrop-blur-sm">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-black font-outfit uppercase tracking-tighter italic leading-none">
            Baixar Pagamento
          </DialogTitle>
          <DialogDescription className="text-white/70 font-bold text-[10px] uppercase tracking-widest mt-2 truncate">
            {title.description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Valor Pago</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">R$</span>
                <Input 
                  type="number" 
                  step="0.01"
                  max={openBalance}
                  className="pl-10 bg-slate-50 border-none rounded-2xl h-12 font-black text-rose-600 font-outfit"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <p className="text-[9px] font-bold text-slate-400 tracking-wider">SALDO: {formatCurrency(openBalance)}</p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Data do Pagamento</Label>
              <Input 
                type="date" 
                className="bg-slate-50 border-none rounded-2xl h-12 font-bold text-xs uppercase"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Conta de Origem</Label>
            <Select 
              value={formData.accountId} 
              onValueChange={(v) => setFormData({ ...formData, accountId: v })}
              required
            >
              <SelectTrigger className="bg-slate-50 border-none rounded-2xl h-12 font-bold text-xs uppercase px-4">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-slate-400" />
                  <SelectValue placeholder="Selecione a conta" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                {accounts.map((acc: any) => (
                  <SelectItem key={acc.id} value={acc.id} className="rounded-xl p-3 font-bold text-[10px] uppercase tracking-widest">
                    {acc.name} • {formatCurrency(acc.currentBalance)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Observações</Label>
            <Input 
              placeholder="Ex: Pago via transferência, boleto nº..." 
              className="bg-slate-50 border-none rounded-2xl h-12 text-sm font-medium"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <DialogFooter className="mt-8">
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 bg-rose-500 hover:bg-rose-600 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-rose-500/20 transition-all gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
