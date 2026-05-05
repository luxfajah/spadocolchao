"use client"

import { useState } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign, CreditCard, Banknote, Landmark, CheckCircle2 } from "lucide-react"
import { processOrderPayment } from "@/app/(admin)/vendas-clientes/pedidos/actions"
import { useToast } from "@/hooks/use-toast"

interface PaymentModalProps {
  order: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function PaymentModal({ order, open, onOpenChange, onSuccess }: PaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [method, setMethod] = useState("DINHEIRO")
  const { toast } = useToast()

  const remainingBalance = (order?.sale?.totalAmount || 0) - (order?.sale?.paidAmount || 0)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const amountStr = String(formData.get("amount")).replace(",", ".")
    const data = {
      amount: parseFloat(amountStr),
      method: method,
      notes: String(formData.get("notes")),
    }

    if (isNaN(data.amount) || data.amount <= 0) {
      toast({
        title: "Valor inválido",
        description: "O valor do pagamento deve ser maior que zero.",
        variant: "destructive"
      })
      setLoading(false)
      return
    }

    const result = await processOrderPayment(order.id, data)

    if (result.success) {
      toast({
        title: "Pagamento Registrado",
        description: `O pagamento de R$ ${data.amount.toFixed(2)} foi processado com sucesso.`,
      })
      onOpenChange(false)
      onSuccess()
    } else {
      toast({
        title: "Erro ao processar",
        description: result.error,
        variant: "destructive"
      })
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl">
        <DialogHeader className="space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-600 mb-2">
            <DollarSign className="h-8 w-8" />
          </div>
          <DialogTitle className="text-2xl font-black font-outfit uppercase italic tracking-tight text-primary">
            Registrar Recebimento
          </DialogTitle>
          <DialogDescription className="font-bold text-slate-500 uppercase text-[11px] tracking-widest leading-relaxed">
            Informe o valor recebido e a forma de pagamento para o pedido <span className="text-primary">#{order?.code}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid gap-6">
            <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 flex justify-between items-center shadow-inner">
               <span className="font-black text-[10px] uppercase tracking-widest text-slate-400">Saldo Devedor</span>
               <span className="text-2xl font-black font-outfit italic text-primary">R$ {remainingBalance.toFixed(2)}</span>
            </div>

            <div className="space-y-3">
              <Label htmlFor="amount" className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">Valor do Pagamento</Label>
              <div className="relative group">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-primary font-black text-sm italic">R$</span>
                <Input 
                  id="amount" 
                  name="amount"
                  type="number"
                  step="0.01"
                  placeholder="0,00" 
                  required
                  defaultValue={remainingBalance.toFixed(2)}
                  className="pl-12 rounded-2xl h-14 border-slate-100 bg-slate-50/50 font-black text-lg focus-visible:ring-blue-500/20 focus-visible:border-blue-500/50 font-outfit"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="font-black text-[10px] uppercase tracking-widest text-slate-400 ml-1">Método de Pagamento</Label>
              <Select defaultValue={method} onValueChange={setMethod}>
                <SelectTrigger className="rounded-2xl h-14 border-slate-100 bg-slate-50/50 font-bold uppercase text-[11px] tracking-widest focus-visible:ring-blue-500/20 focus-visible:border-blue-500/50">
                  <SelectValue placeholder="Selecione o método" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-xl">
                  <SelectItem value="DINHEIRO" className="h-12 font-bold uppercase text-[10px] tracking-widest"> Dinheiro </SelectItem>
                  <SelectItem value="PIX" className="h-12 font-bold uppercase text-[10px] tracking-widest"> PIX </SelectItem>
                  <SelectItem value="CARTAO_CREDITO" className="h-12 font-bold uppercase text-[10px] tracking-widest"> Cartão de Crédito </SelectItem>
                  <SelectItem value="CARTAO_DEBITO" className="h-12 font-bold uppercase text-[10px] tracking-widest"> Cartão de Débito </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="rounded-full h-14 px-8 font-black text-xs uppercase tracking-widest text-slate-400 hover:text-rose-500 hover:bg-rose-50"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="rounded-full h-14 px-10 gap-2 bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all font-black text-xs uppercase tracking-widest"
            >
              {loading ? "Processando..." : <><CheckCircle2 className="h-4 w-4" /> Confirmar Pagamento</>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
