"use client"

import { useState, useEffect } from "react"
import { PayableList } from "./PayableList"
import { PayableFilters } from "./PayableFilters"
import { Button } from "@/components/ui/button"
import { PlusCircle, FileDown, LayoutDashboard, ArrowDownCircle } from "lucide-react"
import Link from "next/link"
import { getPayables } from "./actions"
import { PageHeader } from "@/components/layout/PageHeader"
import { PayableFormDialog } from "./PayableFormDialog"
import { BatchPaymentDialog } from "./BatchPaymentDialog"
import { CreditCard as ProcessIcon } from "lucide-react"

export function PayablePageClient({ initialData }: { initialData: any[] }) {
  const [payables, setPayables] = useState(initialData)
  const [showForm, setShowForm] = useState(false)
  const [showBatchPay, setShowBatchPay] = useState(false)
  const [selectedPayable, setSelectedPayable] = useState<any>(null)
  const [filters, setFilters] = useState({
    query: "",
    status: "ALL",
    startDate: "",
    endDate: ""
  })

  const fetchData = async () => {
    const data = await getPayables(filters)
    setPayables(data)
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
        title="Contas a Pagar"
        subtitle="Gestão de obrigações, pagamentos a fornecedores e centros de custo."
        icon={<ArrowDownCircle className="h-8 w-8 text-rose-500" />}
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
              onClick={() => { setSelectedPayable(null); setShowForm(true); }}
              className="rounded-full gap-2 bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20 transition-all px-8 h-12 font-black text-xs uppercase tracking-[0.1em]"
            >
              <PlusCircle className="h-4 w-4" /> Nova Conta
            </Button>
            <Button 
              onClick={() => setShowBatchPay(true)}
              variant="outline"
              className="rounded-full gap-2 border-slate-900 border-2 hover:bg-slate-900 hover:text-white transition-all font-black text-xs px-8 h-12 shadow-sm uppercase tracking-wider text-slate-900"
            >
              <ProcessIcon className="h-4 w-4" /> Baixa em Lote
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

      <PayableFilters onFilterChange={handleFilterChange} />
      
      <PayableList 
        payables={payables} 
        onEdit={(p) => { setSelectedPayable(p); setShowForm(true); }} 
        onRefresh={fetchData}
      />

      <PayableFormDialog 
        open={showForm} 
        onOpenChange={setShowForm} 
        payable={selectedPayable}
        onSuccess={fetchData}
      />

      <BatchPaymentDialog
        open={showBatchPay}
        onOpenChange={setShowBatchPay}
        onSuccess={fetchData}
      />
    </div>
  )
}
