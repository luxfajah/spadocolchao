"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import { receiveTitle } from "./actions"
import { CheckCircle2, Wallet, Calendar as CalendarIcon, Loader2 } from "lucide-react"

interface ReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: any
}

export function ReceiptDialog({ open, onOpenChange, title }: ReceiptDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    amount: 0,
    accountId: "",
    categoryId: "",
    receivedDate: new Date().toISOString().split('T')[0],
    notes: ""
  })

  // Carregar dados de auxílio (contas e categorias)
  useEffect(() => {
    if (open) {
      if (title) {
        setFormData(prev => ({ 
          ...prev, 
          amount: title.amount - title.paidAmount,
          categoryId: title.financialCategoryId || ""
        }))
      }
      
      // Simulação de busca (em um sistema real, viria de uma action dedicada)
      // Vou usar uma action genérica ou fetch aqui se necessário
      fetchAuxData()
    }
  }, [open, title])

  const fetchAuxData = async () => {
    try {
      // Usando uma rota de api ou action que retorne esses dados
      // Para este exemplo, vou simplificar e assumir que o pai passa ou buscar via fetch lateral
      const res = await fetch('/api/financeiro/aux-data?type=ENTRY')
      const data = await res.json()
      setAccounts(data.accounts || [])
      setCategories(data.categories || [])
    } catch (e) {
      console.error("Erro ao buscar dados auxiliares", e)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.accountId) {
      toast({ title: "Selecione uma conta", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      await receiveTitle({
        titleId: title.id,
        amount: formData.amount,
        accountId: formData.accountId,
        receivedDate: new Date(formData.receivedDate),
        categoryId: formData.categoryId || undefined,
        notes: formData.notes
      })
      
      toast({ 
        title: "Recebimento registrado!",
        description: `O valor de ${formatCurrency(formData.amount)} foi creditado com sucesso.`,
      })
      onOpenChange(false)
    } catch (error: any) {
      toast({ 
        title: "Erro ao registrar", 
        description: error.message,
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  if (!title) return null

  const openBalance = title.amount - title.paidAmount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="bg-emerald-500 p-8 text-white relative">
          <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mb-4 backdrop-blur-sm">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-black font-outfit uppercase tracking-tighter italic leading-none">
            Registrar Recebimento
          </DialogTitle>
          <DialogDescription className="text-white/70 font-bold text-[10px] uppercase tracking-widest mt-2 overflow-hidden text-ellipsis whitespace-nowrap">
            {title.description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Valor a Receber</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">R$</span>
                <Input 
                  type="number" 
                  step="0.01"
                  max={openBalance}
                  className="pl-10 bg-slate-50 border-none rounded-2xl h-12 font-black text-primary font-outfit"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Saldo aberto: {formatCurrency(openBalance)}</p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Data do Recebimento</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  type="date" 
                  className="pl-12 bg-slate-50 border-none rounded-2xl h-12 font-bold text-xs uppercase"
                  value={formData.receivedDate}
                  onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Conta de Destino</Label>
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
                  <SelectItem key={acc.id} value={acc.id} className="rounded-xl p-3 font-bold text-[10px] uppercase tracking-widest cursor-pointer">
                    {acc.name} • {formatCurrency(acc.currentBalance)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Observações</Label>
            <Input 
              placeholder="Ex: Recebido em Pix, Cheque nº..." 
              className="bg-slate-50 border-none rounded-2xl h-12 text-sm font-medium"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <DialogFooter className="mt-8">
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 transition-all gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Confirmar Recebimento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
