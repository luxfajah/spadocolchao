"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

interface CashFlowFiltersProps {
  onFilterChange: (filters: any) => void
  accounts: any[]
  categories: any[]
  currentFilters: any
}

export function CashFlowFilters({ onFilterChange, accounts, categories, currentFilters }: CashFlowFiltersProps) {
  const setQuickFilter = (type: 'today' | 'week' | 'month' | 'lastMonth') => {
    const today = new Date()
    let start = new Date()
    let end = new Date()

    if (type === 'today') {
      start = today
      end = today
    } else if (type === 'week') {
      const day = today.getDay()
      const diff = today.getDate() - day + (day === 0 ? -6 : 1)
      start = new Date(today.setDate(diff))
      end = new Date()
    } else if (type === 'month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1)
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    } else if (type === 'lastMonth') {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      end = new Date(today.getFullYear(), today.getMonth(), 0)
    }

    onFilterChange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    })
  }

  return (
    <div className="flex flex-col gap-4 bg-white p-8 rounded-[2.5rem] shadow-lahomes border-none">
      <div className="flex flex-col md:flex-row flex-wrap gap-4">
      <div className="flex-1 min-w-[200px] relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Buscar descrição, observação..." 
          className="pl-12 bg-slate-50 border-none rounded-2xl h-12 text-sm font-medium focus:ring-2 focus:ring-primary/20"
          onChange={(e) => onFilterChange({ query: e.target.value })}
        />
      </div>
      
      <div className="w-full md:w-40 min-w-[120px]">
        <Select onValueChange={(v) => onFilterChange({ type: v })}>
          <SelectTrigger className="bg-slate-50 border-none rounded-2xl h-12 text-sm font-bold uppercase tracking-wider text-slate-700 px-6">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-none shadow-2xl">
            <SelectItem value="ALL">Qualquer Tipo</SelectItem>
            <SelectItem value="ENTRY">Entrada</SelectItem>
            <SelectItem value="EXIT">Saída</SelectItem>
            <SelectItem value="BOTH">Transferência</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="w-full md:w-48 min-w-[160px]">
        <Select onValueChange={(v) => onFilterChange({ accountId: v })}>
          <SelectTrigger className="bg-slate-50 border-none rounded-2xl h-12 text-sm font-bold uppercase tracking-wider text-slate-700 px-6">
            <SelectValue placeholder="Conta" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-none shadow-2xl">
            <SelectItem value="ALL">Todas as Contas</SelectItem>
            {accounts.map(acc => (
              <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full md:w-56 min-w-[180px]">
        <Select onValueChange={(v) => onFilterChange({ categoryId: v })}>
          <SelectTrigger className="bg-slate-50 border-none rounded-2xl h-12 text-sm font-bold uppercase tracking-wider text-slate-700 px-6 line-clamp-1">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-none shadow-2xl">
            <SelectItem value="ALL">Todas as Categorias</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Input 
          type="date"
          value={currentFilters.startDate}
          className="bg-slate-50 border-none rounded-2xl h-12 font-bold text-xs uppercase w-36 px-4"
          onChange={(e) => onFilterChange({ startDate: e.target.value })}
        />
        <Input 
          type="date"
          value={currentFilters.endDate}
          className="bg-slate-50 border-none rounded-2xl h-12 font-bold text-xs uppercase w-36 px-4"
          onChange={(e) => onFilterChange({ endDate: e.target.value })}
        />
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
        <button 
          onClick={() => setQuickFilter('today')}
          className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-50 hover:bg-primary hover:text-white transition-all text-slate-500"
        >
          Hoje
        </button>
        <button 
          onClick={() => setQuickFilter('week')}
          className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-50 hover:bg-primary hover:text-white transition-all text-slate-500"
        >
          Esta Semana
        </button>
        <button 
          onClick={() => setQuickFilter('month')}
          className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20"
        >
          Este Mês
        </button>
        <button 
          onClick={() => setQuickFilter('lastMonth')}
          className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-50 hover:bg-primary hover:text-white transition-all text-slate-500"
        >
          Mês Passado
        </button>
      </div>
      </div>
    </div>
  )
}
