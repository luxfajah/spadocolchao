import { getDisciplinaryActions } from "./actions"
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
import { Search, Eye, AlertOctagon, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/layout/PageHeader"
import { ClickableRow } from "@/components/ui/ClickableRow"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { RHActionButton } from "../components/RHActionButton"
import { getEmployeeLegalName, getEmployeePrimaryName } from "@/lib/employee-name"

export default async function DisciplinaryActionsPage({
  searchParams,
}: {
  searchParams?: { q?: string }
}) {
  const q = searchParams?.q || ""
  const actions = await getDisciplinaryActions(q)

  return (
    <main className="flex-1 py-10 px-6 max-w-[1700px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <PageHeader 
        title="Painel Disciplinar"
        subtitle="Registro de ocorrências, advertências e suspensões de colaboradores."
        icon={<AlertOctagon className="h-8 w-8 text-rose-500" />}
        actions={
          <RHActionButton type="ocorrencia" />
        }
      />

      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-white p-6 rounded-[2rem] shadow-lahomes border border-slate-50">
        <form method="GET" className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-rose-500 transition-colors font-bold" />
            <Input 
              name="q"
              placeholder="Buscar por funcionário, motivo ou advertência..." 
              defaultValue={q}
              className="pl-12 rounded-full border-slate-100 focus-visible:ring-rose-500 h-12 text-sm font-medium shadow-inner bg-slate-50/30"
            />
          </div>
          <Button type="submit" variant="secondary" className="rounded-full h-12 px-8 font-bold text-xs uppercase tracking-widest bg-slate-100/50 hover:bg-slate-100 transition-all text-slate-500 hover:text-rose-500 hover:bg-rose-50">
            Consultar Registros
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-lahomes border border-slate-50 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar custom-scrollbar">
          <Table className="min-w-[1100px]">
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] h-14 pl-8">Funcionário</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Data do Fato</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Tipo de Ocorrência</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Motivo</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Assinatura</TableHead>
                <TableHead className="text-right pr-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions.map((action) => {
                const primaryName = getEmployeePrimaryName(action.employee)
                const legalName = getEmployeeLegalName(action.employee)

                return (
                  <ClickableRow 
                    key={action.id} 
                    href={`/rh/advertencias/${action.id}`}
                    className="border-slate-50 h-20 group hover:bg-rose-50/30 transition-colors"
                  >
                    <TableCell className="pl-8">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800 tracking-tight text-sm font-outfit uppercase">
                          {primaryName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
                          {legalName ? `Legal: ${legalName} | ` : ""}
                          {action.employee.jobTitle?.name || "Sem cargo definido"}
                        </span>
                      </div>
                    </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-slate-600 font-bold text-xs uppercase">
                        {format(new Date(action.incidentDate), "dd/MM/yyyy")}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold mt-1">
                        Aplicada em: {format(new Date(action.applicationDate), "dd/MM")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-full ${
                      action.type === 'VERBAL_WARNING' ? 'border-amber-200 text-amber-600 bg-amber-50' : 
                      action.type === 'WRITTEN_WARNING' ? 'border-orange-200 text-orange-600 bg-orange-50' :
                      action.type === 'SUSPENSION' ? 'border-rose-200 text-rose-600 bg-rose-50' :
                      'border-slate-200 text-slate-500 bg-slate-50'
                    }`}>
                      {action.type === 'VERBAL_WARNING' ? 'Advertência Verbal' : 
                       action.type === 'WRITTEN_WARNING' ? 'Advertência Escrita' :
                       action.type === 'SUSPENSION' ? 'Suspensão' : action.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-semibold text-slate-600 truncate max-w-[200px] block">
                      {action.reason}
                    </span>
                  </TableCell>
                  <TableCell>
                     {action.employeeAwareness ? (
                       <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none px-2 shadow-none font-black text-[10px] uppercase tracking-wider gap-1">
                         <CheckCircle2 className="w-3 h-3" /> Assinou
                       </Badge>
                     ) : (
                       <Badge className="bg-slate-100 text-slate-400 hover:bg-slate-200 border-none px-2 shadow-none font-black text-[10px] uppercase tracking-wider">
                         Pendente
                       </Badge>
                     )}
                  </TableCell>
                  <TableCell className="text-right pr-8">
                     <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                       <Link href={`/rh/advertencias/${action.id}`}>
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-rose-600 bg-white border border-rose-100 hover:bg-rose-50 hover:border-rose-200 shadow-sm rounded-xl">
                          <Eye className="h-5 w-5" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                  </ClickableRow>
                )
              })}
              {actions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-40 text-slate-400 font-bold uppercase tracking-widest text-xs border-none">
                    Nenhuma advertência ou ocorrência registrada.
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
