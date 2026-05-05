"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import { batchPayTitles, getBatchPaySummary } from "./actions"
import { CreditCard, Wallet, Calendar as CalendarIcon, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"

interface BatchPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function BatchPaymentDialog({ open, onOpenChange, onSuccess }: BatchPaymentDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetchingSummary, setFetchingSummary] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])
  const [summary, setSummary] = useState({ count: 0, totalAmount: 0 })
  
  const [formData, setFormData] = useState({
    cutOffDate: new Date().toISOString().split('T')[0],
    accountId: "",
    paymentDate: new Date().toISOString().split('T')[0],
    notes: "Pagamento em lote automático"
  })

  useEffect(() => {
    if (open) {
      fetchAccounts()
      fetchSummary()
    }
  }, [open, formData.cutOffDate])

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/financeiro/aux-data?type=EXIT')
      const data = await res.json()
      setAccounts(data.accounts || [])
    } catch (e) {
      console.error("Erro ao buscar contas", e)
    }
  }

  const fetchSummary = async () => {
    setFetchingSummary(true)
    try {
      const res = await getBatchPaySummary(formData.cutOffDate)
      setSummary(res)
    } catch (e) {
      console.error("Erro ao buscar sumário", e)
    } finally {
      setFetchingSummary(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.accountId) {
      toast({ title: "Selecione a conta de origem", variant: "destructive" })
      return
    }

    if (summary.count === 0) {
      toast({ title: "Nenhum título para pagar", description: "Não há títulos pendentes até a data selecionada.", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const result = await batchPayTitles({
        cutOffDate: formData.cutOffDate,
        accountId: formData.accountId,
        paymentDate: formData.paymentDate,
        notes: formData.notes
      })
      
      toast({ 
        title: "Processamento concluído!",
        description: `${result.count} títulos foram baixados, totalizando ${formatCurrency(result.totalPaid)}.`,
      })
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast({ 
        title: "Erro ao processar lote", 
        description: error.message,
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="bg-slate-900 p-8 text-white relative">
          <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mb-4 backdrop-blur-sm">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-black font-outfit uppercase tracking-tighter italic leading-none">
            Baixa em Lote
          </DialogTitle>
          <DialogDescription className="text-white/60 font-bold text-[10px] uppercase tracking-widest mt-2">
            Liquidate multiple titles based on due date
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pagar títulos vencendo até</Label>
              <Input 
                type="date" 
                className="bg-white border-none rounded-2xl h-12 font-bold text-xs uppercase px-4 shadow-sm"
                value={formData.cutOffDate}
                onChange={(e) => setFormData({ ...formData, cutOffDate: e.target.value })}
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Títulos Selecionados</span>
                <span className="text-xl font-black font-outfit italic text-slate-800">
                  {fetchingSummary ? "..." : summary.count}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Total da Baixa</span>
                <span className="text-xl font-black font-outfit italic text-rose-500">
                  {fetchingSummary ? "..." : formatCurrency(summary.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Data do Pagamento (Lançamento)</Label>
              <Input 
                type="date" 
                className="bg-slate-50 border-none rounded-2xl h-12 font-bold text-xs uppercase px-4"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Conta de Origem</Label>
              <Select 
                value={formData.accountId} 
                onValueChange={(v) => setFormData({ ...formData, accountId: v })}
                required
              >
                <SelectTrigger className="bg-slate-50 border-none rounded-2xl h-12 font-bold text-xs uppercase px-4 focus:ring-2 focus:ring-primary/20">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-slate-400" />
                    <SelectValue placeholder="Selecione a conta" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                  {accounts.map((acc: any) => (
                    <SelectItem key={acc.id} value={acc.id} className="rounded-xl p-3 font-bold text-[10px] uppercase tracking-widest">
                      {acc.name} • {formatCurrency(acc.currentBalance)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[9px] font-bold text-amber-700 uppercase leading-relaxed tracking-wider">
              ESTA AÇÃO É IRREVERSÍVEL E CRIARÁ MÚLTIPLOS LANÇAMENTOS NO FLUXO DE CAIXA. CERTIFIQUE-SE DE QUE O SALDO DA CONTA É SUFICIENTE.
            </p>
          </div>

          <DialogFooter className="mt-8">
            <Button 
              type="submit" 
              disabled={loading || summary.count === 0 || fetchingSummary}
              className="w-full h-14 bg-slate-900 hover:bg-slate-800 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-slate-900/20 transition-all gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Processar Baixa em Lote
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
