"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getSessionDetails, closeCashSession } from "./actions"
import { Loader2, TerminalSquare, AlertTriangle, ShieldCheck, ArrowUpCircle, ArrowDownCircle, Banknote, CalendarRange, UserCheck, Search, FileBarChart2 } from "lucide-react"
import { formatCurrency, formatDate, cn } from "@/lib/utils"

export function SessionDialog({ open, onOpenChange, session, closingUserId }: { open: boolean, onOpenChange: (o: boolean) => void, session: any, closingUserId: string }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [details, setDetails] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    reportedBalance: 0,
    notes: ""
  })

  useEffect(() => {
    if (open && session?.id) {
      setLoading(true)
      getSessionDetails(session.id)
        .then(data => {
          setDetails(data)
          setLoading(false)
        })
        .catch(err => {
          toast({ title: "Falha de Conexão", variant: "destructive", description: err.message })
          setLoading(false)
        })
    }
  }, [open, session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await closeCashSession(session.id, {
        reportedBalance: formData.reportedBalance,
        closingUserId: closingUserId,
        notes: formData.notes
      })
      toast({ 
        title: "Sessão Finalizada",
        description: "O encerramento do caixa foi processado com sucesso.",
      })
      onOpenChange(false)
    } catch (error: any) {
      toast({ 
        title: "Erro no Encerramento", 
        description: error.message,
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  if (!session) return null

  const isOpen = session.status === 'OPEN'
  const isLoaded = !!details

  // Cálculos de Resumo
  let expectedBalance = 0
  let totalEntries = 0
  let totalExits = 0
  
  if (isLoaded) {
    totalEntries = details.movements.filter((m: any) => m.type === 'ENTRY').reduce((acc: number, m: any) => acc + m.amount, 0)
    totalExits = details.movements.filter((m: any) => m.type === 'EXIT').reduce((acc: number, m: any) => acc + m.amount, 0)
    expectedBalance = details.openingBalance + totalEntries - totalExits
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden bg-white animate-in zoom-in-95 duration-200">
        <DialogHeader className="bg-slate-950 p-10 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[80px] -mr-16 -mt-16" />
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center border border-white/10 shadow-2xl">
                <TerminalSquare className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-black font-outfit uppercase tracking-tighter italic leading-none">
                Gestão da Sessão de Caixa
              </DialogTitle>
              <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <CalendarRange className="h-3 w-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{formatDate(session.openedAt)} às {new Date(session.openedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="h-4 w-px bg-white/10" />
                  <div className="flex items-center gap-2 text-primary">
                    <UserCheck className="h-3 w-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{session.openedBy.name}</span>
                  </div>
              </div>
            </div>
            {!isOpen && (
                <div className="px-5 py-2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest">
                    Encerrado
                </div>
            )}
          </div>
        </DialogHeader>

        {!isLoaded ? (
           <div className="p-24 flex flex-col items-center gap-6">
               <Loader2 className="w-10 h-10 text-primary animate-spin" />
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Carregando Fluxos Financeiros...</p>
           </div>
        ) : (
           <div className="flex flex-col h-full max-h-[70vh] overflow-y-auto">
              <div className="p-10 space-y-10 bg-white">
                 
                 {/* Flash Metrics */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-between h-28 hover:bg-white hover:shadow-lg transition-all">
                       <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] leading-none">Abertura / Fundo</p>
                       <p className="text-xl font-black text-slate-900 font-outfit italic tracking-tight">{formatCurrency(details.openingBalance)}</p>
                    </div>
                    <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100/50 flex flex-col justify-between h-28 group hover:bg-emerald-100 transition-all">
                       <div className="flex justify-between items-start">
                           <p className="text-[9px] font-black uppercase text-emerald-600 tracking-[0.2em] leading-none">Entradas</p>
                           <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
                       </div>
                       <p className="text-xl font-black text-emerald-700 font-outfit italic tracking-tight">+{formatCurrency(totalEntries)}</p>
                    </div>
                    <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100/50 flex flex-col justify-between h-28 group hover:bg-rose-100 transition-all">
                       <div className="flex justify-between items-start">
                           <p className="text-[9px] font-black uppercase text-rose-600 tracking-[0.2em] leading-none">Retiradas</p>
                           <ArrowDownCircle className="h-4 w-4 text-rose-500" />
                       </div>
                       <p className="text-xl font-black text-rose-700 font-outfit italic tracking-tight">-{formatCurrency(totalExits)}</p>
                    </div>
                    <div className="bg-slate-950 p-6 rounded-[2rem] shadow-xl shadow-slate-950/20 text-white flex flex-col justify-between h-28 relative overflow-hidden group">
                       <div className="absolute bottom-0 right-0 w-12 h-12 bg-primary blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" />
                       <p className="text-[9px] font-black uppercase text-white/40 tracking-[0.2em] leading-none relative z-10">Saldo Projetado</p>
                       <p className="text-xl font-black text-white font-outfit italic tracking-tight relative z-10">{formatCurrency(expectedBalance)}</p>
                    </div>
                 </div>

                 {/* Movimentações */}
                 <div className="space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                <Search className="h-4 w-4" />
                            </div>
                            <h3 className="font-black text-[11px] text-slate-900 uppercase tracking-widest italic leading-none">Lançamentos Consolidados</h3>
                        </div>
                        <Badge className="rounded-full bg-slate-50 border border-slate-100 text-slate-400 text-[9px] font-black px-4">{details.movements.length} Movimentos</Badge>
                    </div>

                    {details.movements.length === 0 ? (
                       <div className="p-10 rounded-[2rem] border border-dashed border-slate-200 flex flex-col items-center text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nenhum fluxo de caixa detectado</p>
                       </div>
                    ) : (
                       <div className="space-y-3 pr-2 custom-scrollbar">
                          {details.movements.map((mov: any) => (
                             <div key={mov.id} className="flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-50 hover:bg-slate-50/50 hover:border-slate-100 transition-all group">
                                <div className="flex items-center gap-4">
                                   <div className={cn(
                                       "h-10 w-10 rounded-2xl flex items-center justify-center transition-transform group-hover:translate-x-1",
                                       mov.type === 'ENTRY' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'
                                   )}>
                                       {mov.type === 'ENTRY' ? <ArrowUpCircle className="h-5 w-5" /> : <ArrowDownCircle className="h-5 w-5" />}
                                   </div>
                                   <div>
                                       <p className="text-xs font-black text-slate-800 uppercase tracking-tight line-clamp-1">{mov.notes || mov.category || "Movimento sem notas"}</p>
                                       <div className="flex items-center gap-2 mt-1">
                                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(mov.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                           <span className="text-[9px] font-bold text-slate-300">•</span>
                                           <span className="text-[9px] font-black text-primary/70 uppercase tracking-widest">Liquidado</span>
                                       </div>
                                   </div>
                                </div>
                                <div className={cn(
                                    "font-black text-lg italic pr-4 font-outfit transition-all group-hover:scale-110",
                                    mov.type === 'ENTRY' ? 'text-emerald-500' : 'text-rose-500'
                                )}>
                                   {mov.type === 'ENTRY' ? '+' : '-'}{formatCurrency(mov.amount).replace('R$', '').trim()}
                                </div>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>

                 {/* Rodapé Operacional */}
                 {isOpen ? (
                    <form onSubmit={handleSubmit} className="bg-slate-50 rounded-[3rem] p-10 space-y-8 border border-slate-100 relative shadow-inner">
                       <div className="flex items-start gap-4 text-rose-500 bg-rose-50/80 p-6 rounded-3xl border border-rose-100/50">
                          <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-black uppercase tracking-tight leading-none mb-2">Protocolo de Segurança Ativo</p>
                            <p className="text-[10px] font-bold text-rose-600/70 leading-relaxed uppercase">O fechamento é irreversível. Divergências detectadas impactarão o relatório de auditoria do operador <span className="underline font-black">{details.openedBy.name}</span>.</p>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-4">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 flex items-center gap-2">
                                <Banknote className="h-3 w-3" /> Saldo Real em Gaveta
                             </Label>
                             <div className="relative">
                               <span className="absolute left-6 top-1/2 -translate-y-1/2 text-sm font-black text-primary/50">R$</span>
                               <Input 
                                 type="number" 
                                 step="0.01"
                                 required
                                 className="h-16 pl-14 rounded-[1.5rem] border-none bg-white px-6 font-black text-slate-900 font-outfit text-2xl shadow-xl shadow-slate-900/5 focus:ring-2 focus:ring-primary transition-all pr-6 text-right"
                                 value={formData.reportedBalance}
                                 onChange={(e) => setFormData({ ...formData, reportedBalance: parseFloat(e.target.value) })}
                               />
                             </div>
                          </div>

                          <div className="space-y-4">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Consolidação por</Label>
                             <div className="bg-white rounded-[1.5rem] h-16 flex items-center px-8 border border-slate-100 shadow-sm transition-all hover:bg-slate-50">
                                <UserCheck className="h-4 w-4 text-slate-300 mr-3" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{details.openedBy.name}</span>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">OPERADOR RESPONSÁVEL</span>
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="space-y-4">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Relatório de Encerramento (Divergências/Notas)</Label>
                          <textarea 
                            rows={3}
                            placeholder="Descreva qualquer inconsistência ou observação relevante..." 
                            className="w-full bg-white border-none rounded-[2rem] p-8 text-sm font-medium shadow-sm focus:ring-2 focus:ring-primary transition-all resize-none outline-none"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          />
                       </div>

                       <Button 
                         type="submit" 
                         disabled={loading}
                         className="w-full h-16 bg-slate-950 hover:bg-slate-900 text-white rounded-full font-black text-xs uppercase tracking-[0.24em] shadow-2xl shadow-slate-950/20 transition-all gap-4 mt-4 border-none"
                       >
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5 text-emerald-400" />}
                          Efetivar Conciliação de Caixa
                       </Button>
                    </form>
                 ) : (
                    <div className="bg-slate-950 p-10 rounded-[3.5rem] text-center mt-10 shadow-2xl shadow-slate-950/40 relative overflow-hidden group">
                       <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/10 blur-[60px] -ml-16 -mt-16" />
                       <div className="h-16 w-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-emerald-500/20 shadow-inner group-hover:scale-110 transition-transform">
                            <ShieldCheck className="h-8 w-8 text-emerald-400" />
                       </div>
                       <h4 className="text-white font-black text-2xl mb-2 font-outfit italic tracking-tight uppercase leading-none">Conciliado e Auditorado</h4>
                       <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-8">Auditoria final por: <span className="text-white">{details.closedBy?.name}</span></p>
                       
                       <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/5 text-left flex flex-col justify-between h-24 transition-colors hover:bg-white/10">
                                <span className="text-[8px] uppercase tracking-widest font-black text-slate-500">Saldo Informado</span>
                                <span className="text-lg font-black text-white italic tracking-tight uppercase">{formatCurrency(details.reportedBalance || 0)}</span>
                            </div>
                            <div className={cn(
                                "rounded-2xl p-6 border text-left flex flex-col justify-between h-24 transition-all hover:scale-[1.02]",
                                (details.difference || 0) < 0 ? "bg-rose-500/10 border-rose-500/30" : "bg-emerald-500/10 border-emerald-500/30"
                            )}>
                               <span className={cn(
                                   "text-[8px] uppercase tracking-widest font-black",
                                   (details.difference || 0) < 0 ? "text-rose-400" : "text-emerald-400"
                               )}>Divergência de Auditoria</span>
                               <span className={cn(
                                   "text-lg font-black italic tracking-tight uppercase transition-all",
                                   (details.difference || 0) < 0 ? "text-rose-500" : "text-emerald-500"
                               )}>
                                  {formatCurrency(details.difference || 0)}
                               </span>
                            </div>
                       </div>
                       <Button variant="ghost" className="mt-8 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors gap-2">
                           <FileBarChart2 className="h-4 w-4" /> Download do Comprovante de Conferência
                       </Button>
                    </div>
                 )}
              </div>
           </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
