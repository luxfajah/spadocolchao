"use client"

import { useState } from "react"
import Link from "next/link"
import { ExternalLink, Receipt, Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PayrollPdfButton } from "../../components/PayrollPdfButton"

interface PayrollHistoryItem {
  id: string
  referencePeriod: string
  grossSalary: number
  netSalary: number
  otherAdditions: number
  otherDeductions: number
  inss: number
  irrf: number
  status: string
  createdAt: Date | string
  attendanceMirror?: {
    id: string
    period: string
  } | null
}

function formatPeriodLabel(period: string) {
  const match = period.match(/^(\d{4})-(\d{2})$/)

  if (!match) {
    return period
  }

  return `${match[2]}/${match[1]}`
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function EmployeePayrollHistory({
  employeeId,
  payrolls,
}: {
  employeeId: string
  payrolls: PayrollHistoryItem[]
}) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredPayrolls = payrolls.filter((payroll) => {
    const query = searchTerm.toLowerCase()
    const linkedMirrorPeriod = payroll.attendanceMirror?.period || ""

    return (
      payroll.referencePeriod.toLowerCase().includes(query) ||
      formatPeriodLabel(payroll.referencePeriod).toLowerCase().includes(query) ||
      linkedMirrorPeriod.toLowerCase().includes(query) ||
      formatPeriodLabel(linkedMirrorPeriod).toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-50 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="font-outfit text-2xl font-black uppercase italic tracking-tight text-primary">
            Histórico de Holerites
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Todos os registros salvos por competencia
          </p>
        </div>
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors font-bold" />
          <Input
            placeholder="Ex: 03/2026..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 rounded-2xl border-slate-100 focus-visible:ring-emerald-500 h-12 text-sm font-bold shadow-inner bg-slate-50/50"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-slate-100">
              <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] h-12 pl-6">
                Competencia
              </TableHead>
              <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] text-center">
                Espelho Vinculado
              </TableHead>
              <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] text-right">
                Bruto Total
              </TableHead>
              <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] text-right">
                Liquido
              </TableHead>
              <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] text-center">
                Status
              </TableHead>
              <TableHead className="text-right pr-6"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayrolls.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Receipt className="w-12 h-12 opacity-20 mb-3" />
                    <p className="font-bold uppercase tracking-widest text-xs">
                      Nenhum holerite salvo para este filtro.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredPayrolls.map((payroll) => {
                const grossWithAdditions = payroll.grossSalary + payroll.otherAdditions

                return (
                  <TableRow
                    key={payroll.id}
                    className="border-slate-50 hover:bg-slate-50/50 transition-colors h-16"
                  >
                    <TableCell className="pl-6">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800 uppercase text-sm">
                          {formatPeriodLabel(payroll.referencePeriod)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
                          Gerado em {new Date(payroll.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {payroll.attendanceMirror ? (
                        <div className="flex flex-col items-center">
                          <span className="font-black text-emerald-600 text-xs uppercase">
                            {formatPeriodLabel(payroll.attendanceMirror.period)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            Espelho fechado
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">
                          Sem vinculo
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-black text-slate-700 text-xs">
                      {formatCurrency(grossWithAdditions)}
                    </TableCell>
                    <TableCell className="text-right font-black text-emerald-600 text-sm">
                      {formatCurrency(payroll.netSalary)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={`border-none font-black text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          payroll.status === "PAID"
                            ? "bg-emerald-50 text-emerald-600"
                            : payroll.status === "GENERATED"
                              ? "bg-blue-50 text-blue-600"
                              : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        {payroll.status === "PAID"
                          ? "Pago"
                          : payroll.status === "GENERATED"
                            ? "Processado"
                            : "Simulacao"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-2">
                        <PayrollPdfButton
                          payrollId={payroll.id}
                          label="PDF"
                          className="h-9 px-3 rounded-xl text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-white shadow-sm transition-all hover:scale-105 active:scale-95 font-black text-[9px] uppercase tracking-widest"
                        />
                        {payroll.attendanceMirror && (
                          <Link href={`/rh/ponto/espelho/${payroll.attendanceMirror.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-xl text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-white shadow-sm transition-all hover:scale-105 active:scale-95"
                            >
                              <Receipt className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        <Link href={`/rh/folha?funcionario=${employeeId}&period=${payroll.referencePeriod}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl text-emerald-600 bg-emerald-50 border border-emerald-100 hover:bg-white shadow-sm transition-all hover:scale-105 active:scale-95"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
