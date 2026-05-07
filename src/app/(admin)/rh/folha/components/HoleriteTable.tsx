"use client"

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Eye, 
  FileEdit, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle,
  MoreHorizontal,
  FileText,
  Loader2
} from "lucide-react"
import { HoleriteEmployee, issuePayrollPdf } from "../actions"
import { useState, useTransition } from "react"
import { HoleriteReviewModal } from "./HoleriteReviewModal"
import { useToast } from "@/hooks/use-toast"

function triggerBrowserDownload(fileUrl: string, documentName: string) {
  if (typeof window === "undefined") return
  const downloadLink = document.createElement("a")
  downloadLink.href = fileUrl
  downloadLink.download = `${documentName}.pdf`
  downloadLink.rel = "noopener"
  document.body.appendChild(downloadLink)
  downloadLink.click()
  document.body.removeChild(downloadLink)
}

type HoleriteTableProps = {
  employees: HoleriteEmployee[]
  period: string
}

export function HoleriteTable({ employees, period }: HoleriteTableProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<HoleriteEmployee | null>(null)
  const [isDownloading, startDownloadTransition] = useTransition()
  const { toast } = useToast()

  const formatBRL = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)

  return (
    <div className="bg-white rounded-[2.5rem] shadow-lahomes border border-slate-50 overflow-hidden transition-all duration-500">
      <div className="p-7 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
        <div className="flex flex-col">
          <h3 className="font-outfit font-black text-xl text-slate-900 uppercase tracking-tight">
            Analítico de Colaboradores
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Status de processamento para a competência {period.split("-").reverse().join("/")}
          </p>
        </div>
        <div className="flex gap-2">
           <Badge className="bg-white text-slate-500 border border-slate-200 shadow-sm rounded-full px-4 py-1.5 font-black text-[10px] uppercase tracking-wider">
            {employees.length} Total
          </Badge>
          <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm rounded-full px-4 py-1.5 font-black text-[10px] uppercase tracking-wider">
            {employees.filter(e => e.payroll).length} Gerados
          </Badge>
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-100 h-14">
              <TableHead className="pl-8 font-black text-slate-500 uppercase tracking-widest text-[10px]">Funcionário</TableHead>
              <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Departamento</TableHead>
              <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] text-right">Salário Base</TableHead>
              <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] text-right">Líquido</TableHead>
              <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] text-center">Status</TableHead>
              <TableHead className="pr-8 text-right font-black text-slate-500 uppercase tracking-widest text-[10px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((e) => {
              const initials = e.fullName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
              const isProcessed = !!e.payroll

              return (
                <TableRow key={e.id} className="group border-slate-50 hover:bg-slate-50/80 transition-all duration-300 h-20">
                  <TableCell className="pl-8">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-11 w-11 rounded-xl shadow-sm border-2 border-white">
                        <AvatarImage src={e.photoUrl || ""} />
                        <AvatarFallback className="bg-slate-100 text-slate-500 font-bold text-sm uppercase">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-outfit font-black text-[13px] text-slate-900 uppercase tracking-tight group-hover:text-primary transition-colors">
                          {e.socialName || e.fullName}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {e.jobTitle?.name || "Cargo não definido"}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-full bg-white border-slate-100 px-3 py-1 font-black text-[9px] uppercase tracking-widest text-slate-500">
                      {e.department || "Geral"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold text-slate-600 text-xs">
                    {formatBRL(e.salaryBase || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {isProcessed ? (
                       <span className="font-outfit font-black text-emerald-600 text-sm italic">
                        {formatBRL(e.payroll!.netSalary)}
                      </span>
                    ) : (
                      <span className="text-slate-300 italic font-medium text-xs">Pendente</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`rounded-full px-3 py-1 font-black text-[9px] uppercase tracking-widest border-none ${
                        isProcessed && e.payroll?.status === "PAID" ? "bg-emerald-50 text-emerald-600" :
                        isProcessed && e.payroll?.status === "GENERATED" ? "bg-indigo-50 text-indigo-600" :
                        isProcessed && e.payroll?.status === "DRAFT" ? "bg-amber-50 text-amber-600" :
                        "bg-slate-50 text-slate-400"
                      }`}>
                      {isProcessed ? (
                        e.payroll?.status === "DRAFT" ? "Rascunho" :
                        e.payroll?.status === "GENERATED" ? "Processado" : "Pago"
                      ) : "Aguardando"}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-8 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      {isProcessed ? (
                         <>
                           <Button 
                             onClick={() => {
                               startDownloadTransition(async () => {
                                 try {
                                   const result = await issuePayrollPdf(e.payroll!.id)
                                   triggerBrowserDownload(result.fileUrl, result.documentName)
                                   toast({
                                     title: "Holerite baixado",
                                     description: "O documento foi gerado e baixado com sucesso."
                                   })
                                 } catch (err) {
                                   toast({
                                     title: "Erro ao baixar",
                                     description: err instanceof Error ? err.message : "Tente novamente.",
                                     variant: "destructive"
                                   })
                                 }
                               })
                             }}
                             disabled={isDownloading}
                             variant="ghost" 
                             size="icon" 
                             className="h-10 w-10 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-primary shadow-sm"
                           >
                             {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                           </Button>
                           <Button 
                             onClick={() => setSelectedEmployee(e)}
                             variant="ghost" 
                             size="icon" 
                             className="h-10 w-10 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-amber-500 shadow-sm"
                           >
                             <FileEdit className="h-4 w-4" />
                           </Button>
                         </>
                      ) : (
                        <Button 
                          onClick={() => setSelectedEmployee(e)}
                          variant="ghost" 
                          className="h-10 rounded-xl border border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white font-black text-[10px] uppercase tracking-widest px-4 gap-2 shadow-sm"
                        >
                          <PlusCircle className="h-4 w-4" /> Gerar Holerite
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      
      {employees.length === 0 && (
        <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
          <div className="h-20 w-20 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-200">
            <FileText className="h-10 w-10" />
          </div>
          <div className="space-y-1">
            <h3 className="font-outfit font-black text-lg text-slate-800 uppercase">Nenhum registro encontrado</h3>
            <p className="text-sm text-slate-400">Tente ajustar seus filtros para encontrar outros colaboradores.</p>
          </div>
        </div>
      )}

      {selectedEmployee && (
        <HoleriteReviewModal 
          employee={selectedEmployee} 
          period={period} 
          isOpen={!!selectedEmployee} 
          onClose={() => setSelectedEmployee(null)} 
          key={selectedEmployee.id}
        />
      )}
    </div>
  )
}
