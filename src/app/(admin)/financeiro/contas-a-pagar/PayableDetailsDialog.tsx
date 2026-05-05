"use client"

import Link from "next/link"
import { CalendarDays, CreditCard, FileText, Receipt, Target, UserRound } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getEmployeePrimaryName } from "@/lib/employee-name"
import { formatCurrency, formatDate } from "@/lib/utils"

function resolveStatusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "Pendente"
    case "PARTIALLY_PAID":
      return "Parcial"
    case "PAID":
      return "Pago"
    case "OVERDUE":
      return "Atrasado"
    case "CANCELLED":
      return "Cancelado"
    default:
      return status
  }
}

export function PayableDetailsDialog({
  open,
  onOpenChange,
  title,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: any
}) {
  if (!title) return null

  const openBalance = title.amount - (title.paidAmount || 0)
  const payrollEmployee = title.payroll?.employee || null
  const payrollEmployeeName = payrollEmployee ? getEmployeePrimaryName(payrollEmployee) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-[2.5rem] border-none p-0 shadow-2xl overflow-hidden">
        <DialogHeader className="bg-slate-950 px-8 py-7 text-white">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.75rem] bg-white/10 text-emerald-300">
              <Receipt className="h-8 w-8" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-2xl font-black font-outfit uppercase tracking-tight">
                Detalhe da cobranca
              </DialogTitle>
              <DialogDescription className="mt-2 max-w-xl truncate text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">
                {title.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 p-8">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Valor total</p>
              <p className="mt-3 text-xl font-black text-slate-900">{formatCurrency(title.amount)}</p>
            </div>
            <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/70 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-500">Pago</p>
              <p className="mt-3 text-xl font-black text-emerald-700">{formatCurrency(title.paidAmount || 0)}</p>
            </div>
            <div className="rounded-[1.5rem] border border-rose-100 bg-rose-50/70 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-500">Saldo aberto</p>
              <p className="mt-3 text-xl font-black text-rose-700">{formatCurrency(openBalance)}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.75rem] border border-slate-100 bg-white p-5">
              <div className="flex items-center gap-2 text-slate-700">
                <CalendarDays className="h-4 w-4 text-slate-400" />
                <p className="text-xs font-black uppercase tracking-widest">Datas</p>
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p><span className="font-black uppercase text-[10px] tracking-widest text-slate-400">Emissao:</span> {formatDate(title.issueDate)}</p>
                <p><span className="font-black uppercase text-[10px] tracking-widest text-slate-400">Vencimento:</span> {formatDate(title.dueDate)}</p>
                <p><span className="font-black uppercase text-[10px] tracking-widest text-slate-400">Pagamento:</span> {title.paymentDate ? formatDate(title.paymentDate) : "Não registrado"}</p>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-100 bg-white p-5">
              <div className="flex items-center gap-2 text-slate-700">
                <CreditCard className="h-4 w-4 text-slate-400" />
                <p className="text-xs font-black uppercase tracking-widest">Classificacao</p>
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p><span className="font-black uppercase text-[10px] tracking-widest text-slate-400">Status:</span> {resolveStatusLabel(title.status)}</p>
                <p><span className="font-black uppercase text-[10px] tracking-widest text-slate-400">Conta de origem:</span> {title.financialAccount?.name || "Não informada"}</p>
                <p><span className="font-black uppercase text-[10px] tracking-widest text-slate-400">Categoria:</span> {title.financialCategory?.name || "Não vinculada"}</p>
                <p><span className="font-black uppercase text-[10px] tracking-widest text-slate-400">Centro de custo:</span> {title.costCenter?.name || "Não vinculado"}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.75rem] border border-slate-100 bg-white p-5">
              <div className="flex items-center gap-2 text-slate-700">
                <UserRound className="h-4 w-4 text-slate-400" />
                <p className="text-xs font-black uppercase tracking-widest">Origem</p>
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p><span className="font-black uppercase text-[10px] tracking-widest text-slate-400">Credor:</span> {title.supplier?.legalName || title.supplier?.tradeName || "Não informado"}</p>
                <p><span className="font-black uppercase text-[10px] tracking-widest text-slate-400">Compra:</span> {title.purchaseOrder?.number ? `#${title.purchaseOrder.number}` : "Sem pedido de compra"}</p>
                <p><span className="font-black uppercase text-[10px] tracking-widest text-slate-400">Tipo:</span> {title.payrollId ? "Holerite vinculado" : "Conta manual / operacional"}</p>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-100 bg-white p-5">
              <div className="flex items-center gap-2 text-slate-700">
                <Target className="h-4 w-4 text-slate-400" />
                <p className="text-xs font-black uppercase tracking-widest">Vinculo RH</p>
              </div>
              {title.payroll ? (
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <p><span className="font-black uppercase text-[10px] tracking-widest text-slate-400">Competencia:</span> {title.payroll.referencePeriod}</p>
                  <p><span className="font-black uppercase text-[10px] tracking-widest text-slate-400">Funcionário:</span> {payrollEmployeeName || "Não informado"}</p>
                  <p><span className="font-black uppercase text-[10px] tracking-widest text-slate-400">Cargo:</span> {payrollEmployee?.jobTitle?.name || "Não informado"}</p>
                  {title.payroll.employee?.id && (
                    <Link href={`/rh/funcionarios/${title.payroll.employee.id}`}>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-2 h-10 rounded-full border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-700"
                      >
                        Ver funcionario
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">Sem holerite ou modulo de RH vinculado a esta cobranca.</p>
              )}
            </div>
          </div>

          {title.notes && (
            <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50/70 p-5">
              <div className="flex items-center gap-2 text-slate-700">
                <FileText className="h-4 w-4 text-slate-400" />
                <p className="text-xs font-black uppercase tracking-widest">Observacoes</p>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">{title.notes}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Badge className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
              {resolveStatusLabel(title.status)}
            </Badge>
            {title.financialCategory?.name && (
              <Badge className="rounded-full bg-indigo-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-700">
                {title.financialCategory.name}
              </Badge>
            )}
            {title.costCenter?.name && (
              <Badge className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                {title.costCenter.name}
              </Badge>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
