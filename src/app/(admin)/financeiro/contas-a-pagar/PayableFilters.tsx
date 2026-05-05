"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

export function PayableFilters({ onFilterChange }: { onFilterChange: (f: any) => void }) {
  return (
    <div className="flex flex-col md:flex-row gap-4 bg-white p-6 rounded-[2rem] shadow-lahomes border-none">
      <div className="flex-1 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Buscar fornecedor, descrição..." 
          className="pl-12 bg-slate-50 border-none rounded-full h-12 text-sm font-medium focus:ring-2 focus:ring-rose-500/20"
          onChange={(e) => onFilterChange({ query: e.target.value })}
        />
      </div>
      
      <div className="w-full md:w-48">
        <Select onValueChange={(v) => onFilterChange({ status: v })}>
          <SelectTrigger className="bg-slate-50 border-none rounded-full h-12 text-sm font-bold uppercase tracking-wider text-slate-700 px-6">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-none shadow-2xl">
            <SelectItem value="ALL">Todos os Status</SelectItem>
            <SelectItem value="PENDING">Pendente</SelectItem>
            <SelectItem value="PARTIALLY_PAID">Parcial</SelectItem>
            <SelectItem value="PAID">Pago</SelectItem>
            <SelectItem value="OVERDUE">Atrasado</SelectItem>
            <SelectItem value="CANCELLED">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
