"use client"

import { useState, useEffect } from "react"
import { CashFlowList } from "./CashFlowList"
import { CashFlowFilters } from "./CashFlowFilters"
import { Button } from "@/components/ui/button"
import { FileDown, LayoutDashboard, PlusCircle } from "lucide-react"
import Link from "next/link"
import { getCashFlow } from "./actions"
import { cn, formatCurrency } from "@/lib/utils"

export function CashFlowClient({ initialData, accounts, categories }: { initialData: any[], accounts: any[], categories: any[] }) {
  const [transactions, setTransactions] = useState(initialData)
  // Data de hoje e início do mês para filtros iniciais
  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]

  const [filters, setFilters] = useState({
    query: "",
    type: "ALL",
    accountId: "ALL",
    categoryId: "ALL",
    startDate: firstDayOfMonth,
    endDate: lastDayOfMonth
  })

  useEffect(() => {
    const fetchData = async () => {
      const data = await getCashFlow(filters)
      setTransactions(data)
    }
    fetchData()
  }, [filters])

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  // Estatísticas do período filtrado
  const totalEntradas = transactions.filter(t => t.type === 'ENTRY').reduce((acc, t) => acc + t.amount, 0)
  const totalSaidas = transactions.filter(t => t.type === 'EXIT').reduce((acc, t) => acc + t.amount, 0)
  const saldoPeriodo = totalEntradas - totalSaidas

  const summary = [
    { label: "Total de Entradas", value: totalEntradas, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Total de Saídas", value: totalSaidas, color: "text-rose-500", bg: "bg-rose-50" },
    { label: "Saldo do Período", value: saldoPeriodo, color: saldoPeriodo >= 0 ? "text-primary" : "text-rose-600", bg: "bg-slate-50" },
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-1">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[2.5rem] shadow-lahomes">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-primary mb-2 font-outfit uppercase italic leading-none">Fluxo de Caixa</h2>
          <p className="text-slate-600 font-bold text-sm uppercase tracking-wider">Histórico de Movimentações • Spa do Colchão</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/financeiro/dashboard" className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-sm transition-all border border-slate-100">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
          <Button variant="ghost" className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-sm transition-all border border-slate-100">
            <FileDown className="w-4 h-4" /> Exportar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {summary.map((item, i) => (
          <div key={i} className="bg-white p-8 rounded-[2rem] shadow-lahomes flex flex-col gap-2 relative overflow-hidden group">
            <div className={cn("absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-10 rounded-full transition-transform group-hover:scale-150 duration-700", item.bg)} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{item.label}</span>
            <span className={cn("text-3xl font-black font-outfit italic", item.color)}>{formatCurrency(item.value)}</span>
          </div>
        ))}
      </div>

      <CashFlowFilters onFilterChange={handleFilterChange} accounts={accounts} categories={categories} currentFilters={filters} />
      
      <CashFlowList transactions={transactions} />
    </div>
  )
}
