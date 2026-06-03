"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CreditCard, MoreVertical, FileText, Trash2, Calendar, ShoppingBag } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { PaymentDialog } from "./PaymentDialog"
import { PayableDetailsDialog } from "./PayableDetailsDialog"

export function PayableList({ payables, onEdit, onRefresh }: { payables: any[], onEdit: (p: any) => void, onRefresh: () => void }) {
  const [selectedTitle, setSelectedTitle] = useState<any>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  if (payables.length === 0) {
    return (
      <div className="bg-white p-20 rounded-[2.5rem] shadow-lahomes text-center flex flex-col items-center justify-center gap-4">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
          <ShoppingBag className="w-10 h-10 text-slate-300" />
        </div>
        <div>
          <h3 className="text-xl font-black text-primary font-outfit uppercase italic tracking-tighter">Nenhuma obrigação encontrada</h3>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Sua lista de contas a pagar está limpa.</p>
        </div>
      </div>
    )
  }

  const statusColors: any = {
    PENDING: "bg-amber-100 text-amber-700 hover:bg-amber-200",
    PARTIALLY_PAID: "bg-rose-100 text-rose-800 hover:bg-rose-200",
    PAID: "bg-rose-500 text-white hover:bg-rose-600",
    OVERDUE: "bg-rose-200 text-rose-900 font-black",
    CANCELLED: "bg-slate-200 text-slate-600",
  }

  const statusLabels: any = {
    PENDING: "Pendente",
    PARTIALLY_PAID: "Parcial",
    PAID: "Pago",
    OVERDUE: "Atrasado",
    CANCELLED: "Cancelado",
  }

  return (
    <>
    {/* Desktop Table */}
    <div className="bg-white rounded-[2.5rem] shadow-lahomes overflow-hidden hidden md:block">
      <Table>
        <TableHeader className="bg-slate-50 border-none">
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Credor / Descrição</TableHead>
            <TableHead className="py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Vencimento</TableHead>
            <TableHead className="py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Valor Total</TableHead>
            <TableHead className="py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Saldo Devedor</TableHead>
            <TableHead className="py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</TableHead>
            <TableHead className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payables.map((title) => {
            const openBalance = title.amount - (title.paidAmount || 0)
            const isOverdue = new Date(title.dueDate) < new Date() && title.status === 'PENDING'

            return (
              <TableRow key={title.id} className="group border-slate-50 hover:bg-slate-50/50 transition-colors">
                <TableCell className="px-8 py-6">
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-sm text-slate-800 uppercase tracking-tight truncate max-w-[250px]">{title.description}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {title.supplier?.legalName || title.supplier?.tradeName || 'Credor não informado'} 
                      {title.purchaseOrder?.number && ` • Compra #${title.purchaseOrder.number}`}
                    </span>
                    {(title.costCenter?.name || title.financialCategory?.name) && (
                      <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest">
                        {title.costCenter?.name ? `CC: ${title.costCenter.name}` : "CC não vinculado"}
                        {title.financialCategory?.name ? ` • Categoria: ${title.financialCategory.name}` : ""}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-6">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(title.dueDate)}
                  </div>
                </TableCell>
                <TableCell className="py-6 text-right font-bold text-sm text-slate-800">
                  {formatCurrency(title.amount)}
                </TableCell>
                <TableCell className={cn(
                  "py-6 text-right font-black text-sm font-outfit italic",
                  openBalance > 0 ? "text-rose-500" : "text-emerald-500"
                )}>
                  {formatCurrency(openBalance)}
                </TableCell>
                <TableCell className="py-6 text-center">
                  <Badge className={cn(
                    "rounded-full px-4 py-1 font-black text-[9px] uppercase tracking-[0.1em] border-none shadow-sm shadow-black/5",
                    isOverdue ? statusColors.OVERDUE : statusColors[title.status]
                  )}>
                    {isOverdue ? statusLabels.OVERDUE : (statusLabels[title.status] || title.status)}
                  </Badge>
                </TableCell>
                <TableCell className="px-8 py-6 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {openBalance > 0 && title.status !== 'CANCELLED' && (
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-9 w-9 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-all shadow-sm shadow-rose-500/10"
                        onClick={() => {
                          setSelectedTitle(title)
                          setShowPaymentDialog(true)
                        }}
                      >
                        <CreditCard className="h-4 w-4" />
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-9 w-9 rounded-2xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all opacity-0 group-hover:opacity-100">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="rounded-2xl border-none shadow-2xl p-2 min-w-[180px]">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedTitle(title)
                            setShowDetailsDialog(true)
                          }}
                          className="rounded-xl flex items-center gap-3 p-3 font-bold text-xs uppercase tracking-widest text-slate-600 cursor-pointer focus:bg-slate-50"
                        >
                          <FileText className="w-4 h-4 text-slate-400" /> Detalhes
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem
                          onClick={() => onEdit(title)}
                          className="rounded-xl flex items-center gap-3 p-3 font-bold text-xs uppercase tracking-widest text-sky-600 cursor-pointer focus:bg-sky-50"
                        >
                          <FileText className="w-4 h-4" /> Editar Lançamento
                        </DropdownMenuItem>

                        {title.status !== 'CANCELLED' && (
                          <DropdownMenuItem className="rounded-xl flex items-center gap-3 p-3 font-bold text-xs uppercase tracking-widest text-rose-500 cursor-pointer focus:bg-rose-50">
                            <Trash2 className="w-4 h-4" /> Cancelar Título
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>

    {/* Mobile Cards */}
    <div className="flex flex-col gap-4 md:hidden mb-4">
      {payables.map((title) => {
        const openBalance = title.amount - (title.paidAmount || 0)
        const isOverdue = new Date(title.dueDate) < new Date() && title.status === 'PENDING'

        return (
          <DropdownMenu key={title.id}>
            <DropdownMenuTrigger asChild>
              <div className="bg-white p-5 rounded-[2rem] shadow-lahomes border border-slate-50 flex flex-col gap-3 active:scale-[0.98] transition-transform">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1 pr-4">
                    <span className="font-bold text-sm text-slate-800 uppercase tracking-tight">{title.description}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {title.supplier?.legalName || title.supplier?.tradeName || 'Credor não informado'} 
                      {title.purchaseOrder?.number && ` • Compra #${title.purchaseOrder.number}`}
                    </span>
                  </div>
                  <Badge className={cn(
                    "rounded-full px-2 py-0.5 font-black text-[9px] uppercase tracking-[0.1em] border-none shadow-sm shadow-black/5 whitespace-nowrap",
                    isOverdue ? statusColors.OVERDUE : statusColors[title.status]
                  )}>
                    {isOverdue ? statusLabels.OVERDUE : (statusLabels[title.status] || title.status)}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formatDate(title.dueDate)}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2 bg-slate-50 p-3 rounded-2xl">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Valor Total</span>
                    <span className="text-sm font-black text-slate-800 font-outfit mt-1">
                      {formatCurrency(title.amount)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end text-right">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Saldo Devedor</span>
                    <span className={cn(
                      "text-sm font-black font-outfit mt-1",
                      openBalance > 0 ? "text-rose-500" : "text-emerald-500"
                    )}>
                      {formatCurrency(openBalance)}
                    </span>
                  </div>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[85vw] max-w-[300px] rounded-2xl p-2 shadow-2xl border-none">
              {openBalance > 0 && title.status !== 'CANCELLED' && (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedTitle(title)
                    setShowPaymentDialog(true)
                  }}
                  className="rounded-xl flex items-center gap-3 p-3 font-bold text-xs uppercase tracking-widest text-emerald-600 cursor-pointer focus:bg-emerald-50"
                >
                  <CreditCard className="w-4 h-4 text-emerald-500" /> Realizar Pagamento
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem
                onClick={() => {
                  setSelectedTitle(title)
                  setShowDetailsDialog(true)
                }}
                className="rounded-xl flex items-center gap-3 p-3 font-bold text-xs uppercase tracking-widest text-slate-600 cursor-pointer focus:bg-slate-50"
              >
                <FileText className="w-4 h-4 text-slate-400" /> Detalhes
              </DropdownMenuItem>
              
              <DropdownMenuItem
                onClick={() => onEdit(title)}
                className="rounded-xl flex items-center gap-3 p-3 font-bold text-xs uppercase tracking-widest text-sky-600 cursor-pointer focus:bg-sky-50"
              >
                <FileText className="w-4 h-4 text-sky-500" /> Editar Lançamento
              </DropdownMenuItem>

              {title.status !== 'CANCELLED' && (
                <DropdownMenuItem className="rounded-xl flex items-center gap-3 p-3 font-bold text-xs uppercase tracking-widest text-rose-500 cursor-pointer focus:bg-rose-50">
                  <Trash2 className="w-4 h-4 text-rose-500" /> Cancelar Título
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      })}
    </div>

      <PaymentDialog 
        open={showPaymentDialog} 
        onOpenChange={setShowPaymentDialog} 
        title={selectedTitle}
      />
      <PayableDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        title={selectedTitle}
      />
    </>
  )
}
