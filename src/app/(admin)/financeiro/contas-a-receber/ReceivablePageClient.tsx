"use client"

import { useState, useEffect } from "react"
import { ReceivableList } from "./ReceivableList"
import { ReceivableFilters } from "./ReceivableFilters"
import { Button } from "@/components/ui/button"
import { PlusCircle, FileDown, LayoutDashboard, ArrowUpCircle } from "lucide-react"
import Link from "next/link"
import { getReceivables } from "./actions"
import { PageHeader } from "@/components/layout/PageHeader"
import { ReceivableFormDialog } from "./ReceivableFormDialog"

export function ReceivablePageClient({ initialData }: { initialData: any[] }) {
  const [receivables, setReceivables] = useState(initialData)
  const [showForm, setShowForm] = useState(false)
  const [selectedReceivable, setSelectedReceivable] = useState<any>(null)
  const [filters, setFilters] = useState({
    query: "",
    status: "ALL",
    startDate: "",
    endDate: ""
  })

  const fetchData = async () => {
    const data = await getReceivables(filters)
    setReceivables(data)
  }

  useEffect(() => {
    fetchData()
  }, [filters])

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-1">
      <PageHeader
        title="Contas a Receber"
        subtitle="Gestão de receitas, vendas parceladas e fluxo de entrada."
        icon={<ArrowUpCircle className="h-8 w-8 text-emerald-500" />}
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
              onClick={() => { setSelectedReceivable(null); setShowForm(true); }}
              className="rounded-full gap-2 bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all px-8 h-12 font-black text-xs uppercase tracking-[0.1em]"
            >
              <PlusCircle className="h-4 w-4" /> Lançar Título
            </Button>
            <Button 
              variant="outline"
              className="rounded-full gap-2 border-slate-200 hover:bg-slate-50 transition-all font-bold text-xs px-6 h-12 shadow-sm uppercase tracking-wider"
            >
              <FileDown className="h-4 w-4" /> Exportar
            </Button>
          </div>
        }
      />

      <ReceivableFilters onFilterChange={handleFilterChange} />
      
      <ReceivableList 
        receivables={receivables} 
        onEdit={(r) => { setSelectedReceivable(r); setShowForm(true); }} 
        onRefresh={fetchData}
      />

      <ReceivableFormDialog 
        open={showForm} 
        onOpenChange={setShowForm} 
        receivable={selectedReceivable}
        onSuccess={fetchData}
      />
    </div>
  )
}
