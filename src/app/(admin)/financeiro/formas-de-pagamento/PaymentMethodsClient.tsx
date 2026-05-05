"use client"

import { useState, useTransition, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { savePaymentMethod, togglePaymentMethodStatus } from "./actions"
import { PlusCircle, Edit, Power, LayoutDashboard, CreditCard, Search, Percent, Timer, CheckCircle2, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { PageHeader } from "@/components/layout/PageHeader"
import { cn } from "@/lib/utils"

export function PaymentMethodsClient({ initialData }: { initialData: any[] }) {
  const { toast } = useToast()
  const [methods, setMethods] = useState(initialData)
  const [showDialog, setShowDialog] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<any>(null)
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState("")
  
  const [formData, setFormData] = useState({ 
    id: "", 
    name: "",
    type: "CREDIT",
    allowsInstallments: false,
    maxInstallments: 1,
    feePercentage: 0,
    fixedFee: 0,
    settlementDays: 0
  })

  const filteredMethods = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return methods
    return methods.filter(m => 
      m.name.toLowerCase().includes(q) || 
      m.type.toLowerCase().includes(q)
    )
  }, [methods, query])

  const handleOpenEdit = (pm?: any) => {
    if (pm) {
      setSelectedMethod(pm)
      setFormData({ 
        id: pm.id, 
        name: pm.name,
        type: pm.type,
        allowsInstallments: pm.allowsInstallments,
        maxInstallments: pm.maxInstallments || 1,
        feePercentage: pm.feePercentage,
        fixedFee: pm.fixedFee,
        settlementDays: pm.settlementDays
      })
    } else {
      setSelectedMethod(null)
      setFormData({ 
        id: "", 
        name: "",
        type: "CREDIT",
        allowsInstallments: false,
        maxInstallments: 1,
        feePercentage: 0,
        fixedFee: 0,
        settlementDays: 0
      })
    }
    setShowDialog(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        await savePaymentMethod(formData)
        toast({ title: "Sucesso", description: "Forma de pagamento salva com sucesso" })
        setShowDialog(false)
        window.location.reload()
      } catch (err: any) {
        toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" })
      }
    })
  }

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await togglePaymentMethodStatus(id, current)
      toast({ title: "Status alterado" })
      window.location.reload()
    } catch (err: any) {
      toast({ title: "Erro ao alterar", description: err.message, variant: "destructive" })
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 px-1 font-outfit">
      <PageHeader 
        title="Formas de Pagamento"
        subtitle="Gerencie taxas, prazos de liquidação e parcelamentos disponíveis."
        icon={<CreditCard className="h-8 w-8 text-primary" />}
        actions={
          <div className="flex flex-wrap gap-4">
            <Link href="/financeiro/dashboard">
              <Button
                variant="outline"
                className="rounded-full gap-2 border-slate-200 hover:bg-slate-50 transition-all font-bold text-xs px-6 h-12 shadow-sm uppercase tracking-wider"
              >
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Button>
            </Link>
            <Button 
              onClick={() => handleOpenEdit()}
              className="rounded-full gap-2 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all px-8 h-12 font-black text-xs uppercase tracking-[0.1em] border-none text-white"
            >
              <PlusCircle className="h-4 w-4" /> Nova Forma
            </Button>
          </div>
        }
      />

      {/* Filtros e Métricas Rápidas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-lahomes border border-slate-100 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
            <Search className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Busca Rápida</p>
            <Input 
              value={query} 
              onChange={e => setQuery(e.target.value)}
              placeholder="Pesquisar..." 
              className="h-8 border-none bg-transparent p-0 text-sm font-bold placeholder:text-slate-300 focus-visible:ring-0"
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] shadow-lahomes border border-slate-100 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ativas</p>
            <p className="text-xl font-black text-slate-900 leading-none mt-1">
              {methods.filter(m => m.isActive).length} <span className="text-xs text-slate-400 font-bold uppercase ml-1">Formas</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] shadow-lahomes border border-slate-100 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
            <Percent className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Taxa Média</p>
            <p className="text-xl font-black text-slate-900 leading-none mt-1">
              {(methods.reduce((acc, curr) => acc + curr.feePercentage, 0) / (methods.length || 1)).toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] shadow-lahomes border border-slate-100 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-500">
            <Timer className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Liquidação</p>
            <p className="text-xl font-black text-slate-900 leading-none mt-1">
              D+{(methods.reduce((acc, curr) => acc + curr.settlementDays, 0) / (methods.length || 1)).toFixed(0)} <span className="text-xs text-slate-400 font-bold uppercase ml-1">Média</span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-lahomes overflow-hidden border border-slate-100/50">
        <div className="px-8 py-8 border-b border-slate-50 flex items-center justify-between">
            <div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 italic">Formas Configuradas</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Detalhamento de custos operacionais por canal</p>
            </div>
            <Badge className="rounded-full bg-slate-50 border border-slate-100 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                {filteredMethods.length} registros
            </Badge>
        </div>

        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Identificação / Canal</TableHead>
              <TableHead className="py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Tipo</TableHead>
              <TableHead className="py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Taxas e Encargos</TableHead>
              <TableHead className="py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Liquidação</TableHead>
              <TableHead className="py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</TableHead>
              <TableHead className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMethods.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="py-20 text-center">
                        <div className="flex flex-col items-center">
                            <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mb-4">
                                <CreditCard className="h-8 w-8" />
                            </div>
                            <p className="text-sm font-black uppercase tracking-widest text-slate-700">Nenhuma forma encontrada</p>
                        </div>
                    </TableCell>
                </TableRow>
            ) : (
                filteredMethods.map((pm) => (
                  <TableRow key={pm.id} className="group border-slate-50/50 hover:bg-slate-50/30 transition-colors">
                    <TableCell className="px-8 py-6 font-bold text-sm text-slate-800 uppercase tracking-tight">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 shrink-0 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black uppercase tracking-tight">{pm.name}</span>
                          {pm.allowsInstallments ? (
                             <span className="text-[10px] font-black text-indigo-500 mt-1 uppercase">Até {pm.maxInstallments}x parcelado</span>
                          ) : (
                              <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Pagamento à vista</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 text-center">
                        <Badge className="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-600 border-none">
                            {pm.type}
                        </Badge>
                    </TableCell>
                    <TableCell className="py-6 text-center">
                      <div className="flex flex-col items-center justify-center">
                         {pm.feePercentage > 0 ? (
                             <span className="font-outfit font-black text-lg text-rose-500 leading-none">{pm.feePercentage}%</span>
                         ) : (
                             <span className="text-xs font-black text-slate-400">ISENTO</span>
                         )}
                         {pm.fixedFee > 0 && <span className="text-[9px] font-black text-slate-400 uppercase mt-1">+ R$ {pm.fixedFee.toFixed(2)} fixa</span>}
                      </div>
                    </TableCell>
                    <TableCell className="py-6 text-center">
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-black text-slate-700 leading-none">{pm.settlementDays === 0 ? "IMEDIATO" : `D+${pm.settlementDays}`}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">Crédito em conta</span>
                        </div>
                    </TableCell>
                    <TableCell className="py-6 text-center">
                      <Badge className={cn(
                          "rounded-full border-none px-4 py-1.5 text-[9px] font-black uppercase tracking-widest shadow-sm",
                          pm.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                      )}>
                        {pm.isActive ? 'Disponível' : 'Suspenso'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                        <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-10 w-10 rounded-[1.2rem] bg-white shadow-sm border border-slate-100 hover:bg-primary hover:text-white hover:border-primary transition-all text-slate-500" 
                            onClick={() => handleOpenEdit(pm)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                            size="icon" 
                            variant="ghost" 
                            className={cn(
                                "h-10 w-10 rounded-[1.2rem] bg-white shadow-sm border border-slate-100 transition-all",
                                pm.isActive ? "hover:bg-rose-500 hover:text-white hover:border-rose-500 text-rose-500" : "hover:bg-emerald-500 hover:text-white hover:border-emerald-500 text-emerald-500"
                            )} 
                            onClick={() => handleToggle(pm.id, pm.isActive)}
                        >
                          <Power className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden max-w-2xl bg-white animate-in zoom-in-95 duration-200">
          <div className="bg-slate-950 px-10 py-8 text-white relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[80px] -mr-16 -mt-16" />
            <DialogHeader>
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                        <CreditCard className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <DialogTitle className="font-outfit text-2xl font-black uppercase italic leading-none tracking-tight">
                            {selectedMethod ? 'Editar Forma' : 'Configurar Forma'}
                        </DialogTitle>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-2">SPA DO COLCHÃO • Gestão de Taxas</p>
                    </div>
                </div>
            </DialogHeader>
          </div>

          <form onSubmit={handleSave} className="p-10 space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Apelido (Nome Exibido)</Label>
                <Input 
                    required 
                    placeholder="Ex: Cartão de Crédito"
                    className="h-14 rounded-full border-none bg-slate-50 px-6 font-bold text-slate-900 focus:ring-2 focus:ring-primary transition-all" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Tipo de Transação</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                   <SelectTrigger className="h-14 rounded-full border-none bg-slate-50 px-6 font-black uppercase text-xs text-slate-800 focus:ring-2 focus:ring-primary transition-all">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent className="border-none rounded-[2rem] shadow-2xl p-2 bg-white">
                      <SelectItem value="CREDIT" className="rounded-xl py-3 px-4 font-bold uppercase text-[10px] tracking-widest focus:bg-slate-50">Cartão de Crédito</SelectItem>
                      <SelectItem value="DEBIT" className="rounded-xl py-3 px-4 font-bold uppercase text-[10px] tracking-widest focus:bg-slate-50">Cartão de Débito</SelectItem>
                      <SelectItem value="PIX" className="rounded-xl py-3 px-4 font-bold uppercase text-[10px] tracking-widest focus:bg-slate-50">PIX</SelectItem>
                      <SelectItem value="BOLETO" className="rounded-xl py-3 px-4 font-bold uppercase text-[10px] tracking-widest focus:bg-slate-50">Boleto Bancário</SelectItem>
                      <SelectItem value="CASH" className="rounded-xl py-3 px-4 font-bold uppercase text-[10px] tracking-widest focus:bg-slate-50">Dinheiro</SelectItem>
                      <SelectItem value="TRANSFER" className="rounded-xl py-3 px-4 font-bold uppercase text-[10px] tracking-widest focus:bg-slate-50">Transferência</SelectItem>
                   </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
               <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Taxa Variável (%)</Label>
                 <div className="relative">
                    <Percent className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                    <Input 
                        type="number" 
                        step="0.01" 
                        className="h-14 rounded-full border-none bg-slate-50 px-6 font-black text-slate-900 focus:ring-2 focus:ring-primary transition-all pr-12" 
                        value={formData.feePercentage} 
                        onChange={e => setFormData({...formData, feePercentage: parseFloat(e.target.value)})} 
                    />
                 </div>
               </div>
               <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Tarifa Fixa (R$)</Label>
                 <Input 
                    type="number" 
                    step="0.01" 
                    className="h-14 rounded-full border-none bg-slate-50 px-6 font-black text-slate-900 focus:ring-2 focus:ring-primary transition-all" 
                    value={formData.fixedFee} 
                    onChange={e => setFormData({...formData, fixedFee: parseFloat(e.target.value)})} 
                 />
               </div>
               <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Prazo (D+N)</Label>
                 <Input 
                    type="number" 
                    className="h-14 rounded-full border-none bg-slate-50 px-6 font-black text-slate-900 focus:ring-2 focus:ring-primary transition-all" 
                    value={formData.settlementDays} 
                    onChange={e => setFormData({...formData, settlementDays: parseInt(e.target.value)})} 
                 />
               </div>
            </div>

            <div className="flex items-center justify-between bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
               <div className="space-y-1">
                 <p className="text-[11px] font-black uppercase tracking-widest text-slate-800 italic">Habilitar Parcelamento?</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Permitir seleção de parcelas no PDV</p>
               </div>
               <div className="flex p-1 bg-white rounded-full border border-slate-100">
                    <button 
                        type="button"
                        onClick={() => setFormData({...formData, allowsInstallments: false})}
                        className={cn(
                            "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                            !formData.allowsInstallments ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        Não
                    </button>
                    <button 
                        type="button"
                        onClick={() => setFormData({...formData, allowsInstallments: true})}
                        className={cn(
                            "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                            formData.allowsInstallments ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        Sim
                    </button>
               </div>
            </div>

            {formData.allowsInstallments && (
               <div className="bg-indigo-50/50 p-8 rounded-[2rem] border border-indigo-100 space-y-4 animate-in slide-in-from-top-2">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-8 rounded-xl bg-white flex items-center justify-center text-indigo-500 shadow-sm">
                        <PlusCircle className="h-4 w-4" />
                    </div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Configuração de Parcelas</Label>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-indigo-400 ml-4">Máximo de parcelas permitidas</Label>
                    <Input 
                        type="number" 
                        className="h-14 rounded-full border-none bg-white px-6 font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm" 
                        value={formData.maxInstallments} 
                        onChange={e => setFormData({...formData, maxInstallments: parseInt(e.target.value)})} 
                    />
                 </div>
               </div>
            )}

            <DialogFooter className="pt-4 border-t border-slate-50 gap-4 flex-col sm:flex-row">
                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowDialog(false)}
                    className="h-14 rounded-full border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 flex-1 order-2 sm:order-1"
                >
                    Descartar
                </Button>
                <Button 
                    type="submit" 
                    disabled={isPending}
                    className="h-14 rounded-full bg-primary text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-primary/90 shadow-2xl shadow-primary/20 flex-1 order-1 sm:order-2 border-none"
                >
                    {isPending ? "Salvando..." : "Salvar Configuração"}
                </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
