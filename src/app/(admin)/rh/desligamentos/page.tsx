import { getTerminations } from "./actions"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { Search, Eye, PowerSquare, Settings, CheckCircle2, Circle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/layout/PageHeader"
import { ClickableRow } from "@/components/ui/ClickableRow"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { RHActionButton } from "../components/RHActionButton"
import { getEmployeeLegalName, getEmployeePrimaryName } from "@/lib/employee-name"

export default async function TerminationsPage({
  searchParams,
}: {
  searchParams?: { q?: string }
}) {
  const q = searchParams?.q || ""
  const terminations = await getTerminations(q)

  return (
    <main className="flex-1 py-10 px-6 max-w-[1700px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <PageHeader 
        title="Painel de Desligamentos"
        subtitle="Gerenciamento de off-boarding, cálculo de rescisões e acompanhamento de devoluções."
        icon={<PowerSquare className="h-8 w-8 text-slate-700" />}
        actions={
          <RHActionButton type="desligamento" />
        }
      />

      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-white p-6 rounded-[2rem] shadow-lahomes border border-slate-50">
        <form method="GET" className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-800 transition-colors font-bold" />
            <Input 
              name="q"
              placeholder="Buscar colaborador ou motivo de saída..." 
              defaultValue={q}
              className="pl-12 rounded-full border-slate-100 focus-visible:ring-slate-800 h-12 text-sm font-medium shadow-inner bg-slate-50/30"
            />
          </div>
          <Button type="submit" variant="secondary" className="rounded-full h-12 px-8 font-bold text-xs uppercase tracking-widest bg-slate-100/50 hover:bg-slate-100 transition-all text-slate-500 hover:text-slate-800 hover:bg-slate-100">
            Filtrar Processos
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-lahomes border border-slate-50 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar custom-scrollbar">
          <Table className="min-w-[1100px]">
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] h-14 pl-8">Funcionário</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Aviso / Término</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Tipo de Rescisão</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Checklist Off-boarding</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Status do Processo</TableHead>
                <TableHead className="text-right pr-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {terminations.map((process) => {
                const totalChecklist = 5
                let completedChecks = 0
                if (process.itemsReturned) completedChecks++
                if (process.accessRevoked) completedChecks++
                if (process.docsCompleted) completedChecks++
                if (process.resignationCalc) completedChecks++
                if (process.financialSent) completedChecks++
                
                const percentage = Math.round((completedChecks / totalChecklist) * 100)
                const primaryName = getEmployeePrimaryName(process.employee)
                const legalName = getEmployeeLegalName(process.employee)
                
                return (
                  <ClickableRow 
                    key={process.id} 
                    href={`/rh/desligamentos/${process.id}`}
                    className="border-slate-50 h-20 group hover:bg-slate-50/50 transition-colors"
                  >
                    <TableCell className="pl-8">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800 tracking-tight text-sm font-outfit uppercase line-through decoration-slate-300">
                          {primaryName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-1">
                          {legalName ? `Legal: ${legalName} | ` : ""}
                          CC: {process.employee.costCenter?.name || "Sem CC"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-slate-600 font-bold text-xs uppercase flex items-center gap-1">
                          {format(new Date(process.terminationDate), "dd/MM/yyyy")}
                          <Badge variant="outline" className="border-rose-200 text-rose-600 bg-rose-50 px-1 py-0 h-4 text-[8px] tracking-widest ml-1 shadow-none font-black uppercase">
                            Saída
                          </Badge>
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold mt-1">
                          Aviso: {process.noticeDate ? format(new Date(process.noticeDate), "dd/MM/yyyy") : "IMEDIATO"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`font-black text-[9px] uppercase tracking-wider px-3 py-1 rounded-full border-slate-200 bg-slate-50 text-slate-600`}>
                        {process.type === 'RESIGNATION' ? 'Pedido Demissão' : 
                         process.type === 'DISMISSAL_WITHOUT_CAUSE' ? 'Sem Justa Causa' :
                         process.type === 'DISMISSAL_WITH_CAUSE' ? 'Justa Causa' :
                         process.type === 'END_OF_CONTRACT' ? 'Término de Contrato' :
                         process.type === 'PROBATION_PERIOD' ? 'Fim de Experiência' :
                         process.type === 'MUTUAL_AGREEMENT' ? 'Acordo Mútuo' : process.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-3">
                         <div className="flex gap-1">
                            {process.itemsReturned ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Circle className="w-3 h-3 text-slate-200" />}
                            {process.accessRevoked ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Circle className="w-3 h-3 text-slate-200" />}
                            {process.docsCompleted ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Circle className="w-3 h-3 text-slate-200" />}
                            {process.resignationCalc ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Circle className="w-3 h-3 text-slate-200" />}
                            {process.financialSent ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Circle className="w-3 h-3 text-slate-200" />}
                         </div>
                         <span className={`text-[10px] font-black uppercase tracking-widest ${percentage === 100 ? 'text-emerald-500' : 'text-slate-400'}`}>
                           {percentage}%
                         </span>
                       </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`border-none font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-full ${
                        process.status === 'STARTED' ? 'bg-amber-100 text-amber-600' :
                        process.status === 'WAITING_DOCUMENTS' ? 'bg-blue-100 text-blue-600' :
                        process.status === 'WAITING_PAYMENT' ? 'bg-indigo-100 text-indigo-600' :
                        process.status === 'COMPLETED' ? 'bg-slate-100 text-slate-400 line-through' :
                        'bg-slate-50 text-slate-600'
                      }`}>
                        {process.status === 'STARTED' ? 'Iniciado' :
                         process.status === 'CALCULATING' ? 'Cálculo Rescisão' :
                         process.status === 'WAITING_DOCUMENTS' ? 'Aguardando Assinaturas' :
                         process.status === 'WAITING_PAYMENT' ? 'Pendente Financeiro' :
                         process.status === 'COMPLETED' ? 'Arquivado' : 'Cancelado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                       <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                         <Link href={`/rh/desligamentos/${process.id}`}>
                          <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm rounded-xl">
                            <Settings className="h-5 w-5" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </ClickableRow>
                )
              })}
              {terminations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-40 text-slate-400 font-bold uppercase tracking-widest text-xs border-none">
                    Nenhum processo de desligamento em andamento.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </main>
  )
}
