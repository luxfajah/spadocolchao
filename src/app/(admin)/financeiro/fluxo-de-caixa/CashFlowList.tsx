"use client"

import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { formatCurrency, cn } from "@/lib/utils"
import { ArrowUpCircle, ArrowDownCircle, ArrowRightLeft } from "lucide-react"

export function CashFlowList({ transactions }: { transactions: any[] }) {
  if (transactions.length === 0) {
    return (
      <div className="bg-white p-20 rounded-[2.5rem] shadow-lahomes text-center flex flex-col items-center justify-center gap-4">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
          <ArrowRightLeft className="w-10 h-10 text-slate-300" />
        </div>
        <div>
          <h3 className="text-xl font-black text-primary font-outfit uppercase italic tracking-tighter">Nenhuma movimentação</h3>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Nenhum registro encontrado no período.</p>
        </div>
      </div>
    )
  }

  // Agrupar por data
  const grouped = transactions.reduce((acc, tx) => {
    const date = new Date(tx.transactionDate).toISOString().split('T')[0]
    if (!acc[date]) acc[date] = []
    acc[date].push(tx)
    return acc
  }, {} as Record<string, any[]>)

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div className="flex flex-col gap-12">
      {sortedDates.map(date => {
        const dayTransactions = grouped[date]
        const dailyIn = dayTransactions.filter((t: any) => t.type === 'ENTRY').reduce((acc: number, t: any) => acc + t.amount, 0)
        const dailyOut = dayTransactions.filter((t: any) => t.type === 'EXIT').reduce((acc: number, t: any) => acc + t.amount, 0)
        const dailyBalance = dailyIn - dailyOut

        return (
          <div key={date} className="space-y-4">
            {/* Daily Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between px-6 pb-2 border-b-2 border-slate-100 gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-primary text-white w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-primary/20">
                  <span className="text-xs font-black uppercase tracking-tighter leading-none opacity-70">
                    {new Date(date).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                  </span>
                  <span className="text-xl font-black font-outfit italic leading-none">
                    {new Date(date).getDate() + 1}
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-800 font-outfit italic uppercase tracking-tighter leading-none">
                    {new Date(date).toLocaleDateString('pt-BR', { weekday: 'long' })}
                  </h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    {dayTransactions.length} Movimentações registradas
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-8 bg-slate-50/50 px-6 py-3 rounded-2xl">
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Entradas</span>
                  <span className="text-sm font-black text-emerald-500 font-outfit italic">+{formatCurrency(dailyIn)}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Saídas</span>
                  <span className="text-sm font-black text-rose-500 font-outfit italic">-{formatCurrency(dailyOut)}</span>
                </div>
                <div className="flex flex-col items-end border-l border-slate-200 pl-8 ml-2">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Saldo do Dia</span>
                  <span className={cn(
                    "text-lg font-black font-outfit italic",
                    dailyBalance >= 0 ? "text-primary" : "text-rose-600"
                  )}>
                    {formatCurrency(dailyBalance)}
                  </span>
                </div>
              </div>
            </div>

            {/* Daily List */}
            <div className="bg-white rounded-[2.5rem] shadow-lahomes overflow-hidden border border-slate-50">
              <Table>
                <TableBody>
                  {dayTransactions.map((tx: any) => {
                    const isEntry = tx.type === 'ENTRY'
                    const isTransfer = tx.isTransfer

                    return (
                      <TableRow key={tx.id} className="group border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <TableCell className="px-8 py-6 w-1/2">
                          <div className="flex items-start gap-4">
                            <div className={cn(
                              "mt-1 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0",
                              isTransfer ? "bg-slate-100 text-slate-500" : isEntry ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
                            )}>
                              {isTransfer ? <ArrowRightLeft className="w-5 h-5" /> : isEntry ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                            </div>
                            <div>
                              <span className="font-bold text-sm text-slate-800 uppercase tracking-tight block group-hover:text-primary transition-colors">
                                {tx.description}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                  {tx.financialCategory?.name || 'Sem categoria'}
                                </span>
                                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-tight">
                                  {new Date(tx.transactionDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-6">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-slate-200" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{tx.financialAccount?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className={cn(
                          "py-6 text-right font-black text-base font-outfit italic px-8",
                          isTransfer ? "text-slate-600" : isEntry ? "text-emerald-500" : "text-rose-500"
                        )}>
                          {isEntry ? "+" : "-"}{formatCurrency(tx.amount)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )
      })}
    </div>
  )
}
