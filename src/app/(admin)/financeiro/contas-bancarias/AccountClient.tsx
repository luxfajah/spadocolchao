"use client"

import { useMemo, useState } from "react"
import { PlusCircle, Landmark, MoreVertical, Edit, Power, PiggyBank, Copy, ArrowRightLeft, Wallet, TrendingUp, History, ShieldCheck, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { formatCurrency, cn } from "@/lib/utils"
import { AccountDialog } from "./AccountDialog"
import { TransferDialog } from "./TransferDialog"
import { toggleAccountStatus } from "./actions"
import { useToast } from "@/hooks/use-toast"
import { PageHeader } from "@/components/layout/PageHeader"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export function AccountClient({ initialData }: { initialData: any[] }) {
  const { toast } = useToast()
  const [showDialog, setShowDialog] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<any>(null)

  const totalBalance = useMemo(() => {
      return initialData
        .filter(acc => acc.status === 'ACTIVE')
        .reduce((acc, curr) => acc + curr.currentBalance, 0)
  }, [initialData])

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      await toggleAccountStatus(id, currentStatus)
      toast({ title: "Status atualizado", description: "A conta bancária teve seu status alterado com sucesso." })
    } catch (e: any) {
      toast({ title: "Erro na operação", variant: "destructive", description: e.message })
    }
  }

  const handleCopyPix = (pixKey: string) => {
    navigator.clipboard.writeText(pixKey)
    toast({ title: "PIX Copiado!", description: "A chave foi copiada para sua área de transferência." })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 px-1 font-outfit">
      <PageHeader 
        title="Contas e Caixas"
        subtitle="Gestão centralizada de saldos bancários, caixas físicos e chaves PIX."
        icon={<Landmark className="h-8 w-8 text-primary" />}
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
              onClick={() => setShowTransfer(true)}
              variant="outline"
              className="rounded-full gap-2 border-slate-200 hover:bg-slate-50 transition-all font-bold text-xs px-6 h-12 shadow-sm uppercase tracking-wider"
            >
              <ArrowRightLeft className="w-4 h-4 text-primary" /> Transferir
            </Button>
            <Button 
              onClick={() => { setSelectedAccount(null); setShowDialog(true); }}
              className="rounded-full gap-2 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all px-8 h-12 font-black text-xs uppercase tracking-[0.1em] border-none text-white"
            >
              <PlusCircle className="h-4 w-4" /> Nova Conta
            </Button>
          </div>
        }
      />

      {/* Métricas Rápidas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-slate-950 p-8 rounded-[2.5rem] shadow-2xl shadow-slate-950/20 text-white relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/5 blur-3xl group-hover:bg-white/10 transition-all" />
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Patrimônio Líquido Total</p>
            <p className="mt-6 text-3xl font-black italic tracking-tighter text-white leading-none">
                {formatCurrency(totalBalance)}
            </p>
            <div className="mt-6 flex items-center gap-2">
                <div className="h-1 w-12 rounded-full bg-primary" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Saldo consolidado ativo</p>
            </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-lahomes border border-slate-100 flex items-center gap-6 group hover:shadow-xl transition-all">
          <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
            <TrendingUp className="h-7 w-7" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contas Ativas</p>
            <p className="text-2xl font-black text-slate-900 leading-none mt-2">
              {initialData.filter(a => a.status === 'ACTIVE').length} <span className="text-[10px] text-slate-400 uppercase ml-1">Unidades</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-lahomes border border-slate-100 flex items-center gap-6 group hover:shadow-xl transition-all">
          <div className="h-14 w-14 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-500 group-hover:scale-110 transition-transform">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Caixas de Loja</p>
            <p className="text-2xl font-black text-slate-900 leading-none mt-2">
              {initialData.filter(a => a.type === 'CASH').length} <span className="text-[10px] text-slate-400 uppercase ml-1">Físicos</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-lahomes border border-slate-100 flex items-center gap-6 group hover:shadow-xl transition-all">
          <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
            <History className="h-7 w-7" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Última Movimentação</p>
            <p className="text-xs font-black text-slate-700 leading-none mt-3 uppercase tracking-tight">
              Hoje <span className="text-slate-400 ml-1">14:20</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {initialData.map((account) => {
          const isActive = account.status === 'ACTIVE'
          const isBank = account.type === 'BANK' || account.type === 'SAVINGS'
          
          return (
            <Card key={account.id} className={cn(
              "border-none shadow-lahomes rounded-[3rem] transition-all group overflow-hidden relative",
              isActive ? "bg-white hover:shadow-2xl hover:shadow-slate-200" : "bg-slate-50 opacity-60 grayscale"
            )}>
              {!isActive && (
                <div className="absolute top-6 right-6 bg-slate-200/50 backdrop-blur-sm shadow-sm text-slate-500 text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full z-10 border border-slate-300/30">
                  Desativada
                </div>
              )}
              
              <CardContent className="p-10">
                <div className="flex justify-between items-start mb-8">
                  <div className={cn(
                    "w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
                    isBank ? "bg-blue-600 text-white shadow-blue-600/20" : "bg-emerald-600 text-white shadow-emerald-600/20"
                  )}>
                    {isBank ? <Landmark className="w-8 h-8" /> : <PiggyBank className="w-8 h-8" />}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 transition-all">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="rounded-[1.5rem] border-none shadow-2xl p-2 min-w-[200px] bg-white animate-in zoom-in-95">
                      <DropdownMenuItem 
                        className="rounded-xl flex items-center gap-4 px-4 py-3 font-black text-[10px] uppercase tracking-widest text-slate-600 cursor-pointer focus:bg-slate-50"
                        onClick={() => { setSelectedAccount(account); setShowDialog(true); }}
                      >
                        <Edit className="w-4 h-4 text-slate-400" /> Detalhes da Conta
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className={cn(
                          "rounded-xl flex items-center gap-4 px-4 py-3 font-black text-[10px] uppercase tracking-widest cursor-pointer mt-1",
                          isActive ? "text-rose-500 focus:bg-rose-50" : "text-emerald-500 focus:bg-emerald-50"
                        )}
                        onClick={() => handleToggleStatus(account.id, account.status)}
                      >
                        <Power className="w-4 h-4" /> {isActive ? 'Suspender Operação' : 'Restaurar Conta'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.24em] mb-2 leading-none">
                      {account.type === 'CASH' ? 'Espécie / Gaveta' : account.bankName || 'Instituição Financeira'}
                    </p>
                    <h3 className={cn(
                      "font-black text-slate-900 uppercase tracking-tight leading-none group-hover:text-primary transition-colors",
                      account.name.length > 25 ? "text-lg" : account.name.length > 18 ? "text-xl" : "text-2xl"
                    )}>
                      {account.name}
                    </h3>
                  </div>

                  <div className="pt-6 border-t border-slate-50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.16em] mb-2">Disponibilidade Imediata</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">R$</span>
                        <p className={cn(
                            "text-4xl font-black font-outfit uppercase italic tracking-tighter leading-none transition-all",
                            isActive ? "text-slate-900 group-hover:scale-105" : "text-slate-400"
                        )}>
                            {formatCurrency(account.currentBalance).replace('R$', '').trim()}
                        </p>
                    </div>
                  </div>
                </div>

                {isBank && (account.accountNumber || account.agency || account.pixKey) && (
                  <div className="mt-8 pt-8 border-t border-slate-50 space-y-4">
                    {account.agency && account.accountNumber && (
                      <div className="flex justify-between items-center rounded-2xl bg-slate-50 px-5 py-3 border border-slate-100/50 group/item hover:bg-white transition-all">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Ag / Conta</span>
                        <span className="text-xs font-black text-slate-700 italic">{account.agency} • {account.accountNumber}</span>
                      </div>
                    )}
                    {account.pixKey && (
                      <div className="flex justify-between items-center rounded-2xl bg-slate-50 px-5 py-3 border border-slate-100/50 group/item hover:bg-white transition-all">
                         <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">PIX</span>
                            <Badge variant="outline" className="text-[8px] font-black bg-white px-2 py-0 border-slate-200">Padrao</Badge>
                         </div>
                         <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-700 truncate max-w-[140px] italic">{account.pixKey}</span>
                            <button onClick={() => handleCopyPix(account.pixKey)} className="text-primary hover:scale-125 transition-transform">
                               <Copy className="w-3.5 h-3.5" />
                            </button>
                         </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-8 flex items-center justify-between opacity-40 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Saldo Verificado</span>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Setor Administrativo</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <AccountDialog 
        open={showDialog} 
        onOpenChange={setShowDialog} 
        account={selectedAccount} 
      />

      <TransferDialog 
        open={showTransfer} 
        onOpenChange={setShowTransfer} 
        accounts={initialData} 
      />
    </div>
  )
}
