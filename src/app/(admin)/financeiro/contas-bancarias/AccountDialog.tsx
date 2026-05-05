"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { saveAccount } from "./actions"
import { Loader2, Landmark, CheckCircle2, PiggyBank, ShieldCheck, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export function AccountDialog({ open, onOpenChange, account }: { open: boolean, onOpenChange: (o: boolean) => void, account: any }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    type: "BANK",
    bankName: "",
    agency: "",
    accountNumber: "",
    pixKey: "",
    initialBalance: 0
  })

  useEffect(() => {
    if (open) {
      if (account) {
        setFormData({
          id: account.id,
          name: account.name,
          type: account.type,
          bankName: account.bankName || "",
          agency: account.agency || "",
          accountNumber: account.accountNumber || "",
          pixKey: account.pixKey || "",
          initialBalance: account.initialBalance
        })
      } else {
        setFormData({
          id: "",
          name: "",
          type: "BANK",
          bankName: "",
          agency: "",
          accountNumber: "",
          pixKey: "",
          initialBalance: 0
        })
      }
    }
  }, [open, account])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await saveAccount(formData)
      toast({ 
        title: "Sucesso!",
        description: account ? "Conta atualizada com sucesso." : "Conta criada com sucesso."
      })
      onOpenChange(false)
    } catch (error: any) {
      toast({ 
        title: "Erro",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const isBank = formData.type === "BANK" || formData.type === "PIX" || formData.type === "SAVINGS"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden bg-white animate-in zoom-in-95 duration-200">
        <DialogHeader className="bg-slate-950 p-10 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[80px] -mr-16 -mt-16" />
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center border border-white/10 shadow-2xl">
                {isBank ? <Landmark className="w-8 h-8 text-primary" /> : <PiggyBank className="w-8 h-8 text-primary" />}
            </div>
            <div>
              <DialogTitle className="text-2xl font-black font-outfit uppercase tracking-tighter italic leading-none">
                {account ? 'Editar Conta' : 'Nova Conta'}
              </DialogTitle>
              <DialogDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">
                SPA DO COLCHÃO • Gestão de Ativos Financeiros
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Nome Amigável / Identificador</Label>
                  <Input 
                    required
                    placeholder="Ex: Banco Itaú Principal" 
                    className="h-14 rounded-full border-none bg-slate-50 px-6 font-bold text-slate-900 focus:ring-2 focus:ring-primary transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Tipo de Conta / Fluxo</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                      <SelectTrigger className="h-14 rounded-full border-none bg-slate-50 px-6 font-black uppercase text-xs text-slate-800 focus:ring-2 focus:ring-primary transition-all">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-[2rem] border-none shadow-2xl p-2 bg-white">
                         <SelectItem value="BANK" className="rounded-xl px-4 py-3 font-black text-[10px] uppercase tracking-widest cursor-pointer focus:bg-slate-50 transition-colors">Conta Corrente</SelectItem>
                         <SelectItem value="CASH" className="rounded-xl px-4 py-3 font-black text-[10px] uppercase tracking-widest cursor-pointer focus:bg-slate-50 transition-colors">Caixa Físico / PDV</SelectItem>
                         <SelectItem value="SAVINGS" className="rounded-xl px-4 py-3 font-black text-[10px] uppercase tracking-widest cursor-pointer focus:bg-slate-50 transition-colors">Conta Poupança</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary border border-slate-100/50">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Patrimônio Inicial</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Saldo base para o fluxo de caixa</p>
                    </div>
                </div>
                <div className="relative w-48">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xs font-black text-primary/50">R$</span>
                    <Input 
                        type="number" 
                        step="0.01"
                        className="h-14 pl-12 rounded-full border-none bg-white px-6 font-black text-slate-900 font-outfit text-xl shadow-sm focus:ring-2 focus:ring-primary transition-all"
                        value={formData.initialBalance}
                        onChange={(e) => setFormData({ ...formData, initialBalance: parseFloat(e.target.value) })}
                        disabled={!!account}
                    />
                </div>
            </div>

            {isBank && (
              <div className="animate-in slide-in-from-top-4 duration-500 space-y-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Instituição Financeira (Banco)</Label>
                  <Input 
                    placeholder="Ex: Itaú Unibanco S/A" 
                    className="h-14 rounded-full border-none bg-slate-50 px-6 font-bold text-slate-900 focus:ring-2 focus:ring-primary transition-all"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Agência</Label>
                    <Input 
                      placeholder="Sem dígito" 
                      className="h-14 rounded-full border-none bg-slate-50 px-6 font-bold text-slate-900 focus:ring-2 focus:ring-primary transition-all"
                      value={formData.agency}
                      onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Número da Conta</Label>
                    <Input 
                      placeholder="Ex: 12345-6" 
                      className="h-14 rounded-full border-none bg-slate-50 px-6 font-bold text-slate-900 focus:ring-2 focus:ring-primary transition-all"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3 bg-indigo-50/30 p-8 rounded-[2rem] border border-indigo-100/50">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-700 ml-4">Chave PIX Identificada</Label>
                  <Input 
                    placeholder="Email, CPF, CNPJ ou Telefone de destino" 
                    className="h-14 rounded-full border-none bg-white px-6 font-bold text-indigo-900 shadow-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={formData.pixKey}
                    onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                  />
                  <div className="flex items-center gap-2 px-4 mt-2">
                    <Info className="h-3 w-3 text-indigo-400" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Esta chave será usada para gerar QR Codes e pagamentos</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-slate-50 gap-4 flex-col sm:flex-row">
            <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="h-14 rounded-full border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 flex-1 order-2 sm:order-1"
            >
                Cancelar Operação
            </Button>
            <Button 
                type="submit" 
                disabled={loading}
                className="h-14 bg-primary hover:bg-primary/90 text-[10px] font-black uppercase tracking-[0.2em] text-white rounded-full shadow-2xl shadow-primary/20 flex-1 order-1 sm:order-2 border-none transition-all gap-2"
            >
               {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <CheckCircle2 className="w-4 h-4 text-white" />}
               Efetivar Configuração
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
