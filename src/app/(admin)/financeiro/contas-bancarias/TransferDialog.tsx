"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { executeTransfer } from "./transfer-actions"
import { Loader2, ArrowRightLeft, CheckCircle2, Wallet, ArrowDownCircle, ArrowUpCircle, Info } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"

export function TransferDialog({ open, onOpenChange, accounts }: { open: boolean, onOpenChange: (o: boolean) => void, accounts: any[] }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    originAccountId: "",
    destinationAccountId: "",
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.originAccountId === formData.destinationAccountId) {
      toast({ title: "Operação Inválida", description: "Contas de origem e destino devem ser diferentes.", variant: "destructive" })
      return
    }

    if (formData.amount <= 0) {
      toast({ title: "Valor Inválido", description: "O montante da transferência deve ser superior a zero.", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      await executeTransfer({
        originAccountId: formData.originAccountId,
        destinationAccountId: formData.destinationAccountId,
        amount: formData.amount,
        date: new Date(formData.date),
        notes: formData.notes
      })
      
      toast({ 
        title: "Sucesso!",
        description: `Transferência de ${formatCurrency(formData.amount)} efetivada com sucesso.`
      })
      onOpenChange(false)
      setFormData({
         originAccountId: "",
         destinationAccountId: "",
         amount: 0,
         date: new Date().toISOString().split('T')[0],
         notes: ""
      })
    } catch (error: any) {
      toast({ 
        title: "Falha na Transação",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const activeAccounts = accounts.filter(a => a.status === 'ACTIVE')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden bg-white animate-in zoom-in-95 duration-200">
        <DialogHeader className="bg-slate-950 p-10 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[80px] -mr-16 -mt-16" />
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center border border-white/10 shadow-2xl">
                <ArrowRightLeft className="w-8 h-8 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black font-outfit uppercase tracking-tighter italic leading-none">
                Mover Capitais
              </DialogTitle>
              <DialogDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">
                SPA DO COLCHÃO • Operação Interna de Tesouraria
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6 relative">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center z-10 text-slate-300">
                    <ArrowRightLeft className="h-4 w-4" />
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 flex items-center gap-2">
                    <ArrowUpCircle className="h-3 w-3 text-rose-400" /> Origem (Débito)
                  </Label>
                  <Select value={formData.originAccountId} onValueChange={(v) => setFormData({...formData, originAccountId: v})} required>
                    <SelectTrigger className="h-16 rounded-[1.5rem] border-none bg-slate-50 px-6 font-black uppercase text-[10px] text-slate-800 focus:ring-2 focus:ring-primary transition-all shadow-sm">
                      <SelectValue placeholder="Selecione o caixa" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl p-2 bg-white max-h-64">
                       {activeAccounts.map(acc => (
                          <SelectItem key={acc.id} value={acc.id} className="rounded-xl px-4 py-3 font-black text-[9px] uppercase tracking-widest cursor-pointer focus:bg-slate-50 transition-colors">
                             {acc.name} <span className="text-rose-500 ml-1">({formatCurrency(acc.currentBalance)})</span>
                          </SelectItem>
                       ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 flex items-center gap-2">
                    <ArrowDownCircle className="h-3 w-3 text-emerald-400" /> Destino (Crédito)
                  </Label>
                  <Select value={formData.destinationAccountId} onValueChange={(v) => setFormData({...formData, destinationAccountId: v})} required>
                    <SelectTrigger className="h-16 rounded-[1.5rem] border-none bg-slate-50 px-6 font-black uppercase text-[10px] text-slate-800 focus:ring-2 focus:ring-primary transition-all shadow-sm">
                      <SelectValue placeholder="Selecione a conta" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl p-2 bg-white max-h-64">
                       {activeAccounts.map(acc => (
                          <SelectItem key={acc.id} value={acc.id} className="rounded-xl px-4 py-3 font-black text-[9px] uppercase tracking-widest cursor-pointer focus:bg-slate-50 transition-colors">
                             {acc.name}
                          </SelectItem>
                       ))}
                    </SelectContent>
                  </Select>
                </div>
            </div>

            <div className="bg-slate-950 rounded-[2.5rem] p-8 text-white flex items-center justify-between shadow-2xl shadow-slate-950/20 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 blur-2xl group-hover:bg-white/10 transition-all" />
                <div className="flex items-center gap-4 relative z-10">
                    <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center text-primary shadow-sm border border-white/5">
                        <Wallet className="h-7 w-7" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Montante da Operação</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase mt-1">Conferência exigida para o lançamento</p>
                    </div>
                </div>
                <div className="relative w-56 z-10">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-sm font-black text-primary/70">R$</span>
                    <Input 
                        type="number" 
                        step="0.01"
                        required
                        className="h-16 pl-14 rounded-[1.5rem] border-white/10 bg-white/5 px-6 font-black text-white font-outfit text-3xl shadow-sm focus:ring-2 focus:ring-primary transition-all text-right"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Data da Efetivação</Label>
                  <Input 
                    type="date" 
                    required
                    className="h-14 rounded-full border-none bg-slate-50 px-6 font-black uppercase text-xs text-slate-700 focus:ring-2 focus:ring-primary transition-all shadow-sm"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div className="space-y-3 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Motivo / Justificativa (D+0)</Label>
                  <Input 
                    placeholder="Ex: Reforço de fundo de caixa da loja" 
                    className="h-12 border-none bg-white rounded-xl px-6 text-sm font-medium focus:ring-2 focus:ring-primary transition-all shadow-sm"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                  <div className="flex items-center gap-2 px-4 mt-2">
                    <Info className="h-3 w-3 text-slate-400" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Este texto será anexado ao histórico de ambas as contas</p>
                  </div>
                </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-50 gap-4 flex-col sm:flex-row">
            <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="h-14 rounded-full border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 flex-1 order-2 sm:order-1"
            >
                Cancelar Transferência
            </Button>
            <Button 
                type="submit" 
                disabled={loading}
                className="h-14 bg-primary hover:bg-primary/90 text-[10px] font-black uppercase tracking-[0.2em] text-white rounded-full shadow-2xl shadow-primary/20 flex-1 order-1 sm:order-2 border-none transition-all gap-2"
            >
               {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <ArrowRightLeft className="w-4 h-4 text-white" />}
               Processar Lançamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
