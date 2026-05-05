import { getInterviews } from "./actions"
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
import { Search, Eye, Edit, CalendarCheck, Clock, MapPin, Video } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/layout/PageHeader"
import { ClickableRow } from "@/components/ui/ClickableRow"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { RHActionButton } from "../components/RHActionButton"
import { getEmployeeLegalName, getEmployeePrimaryName } from "@/lib/employee-name"

export default async function InterviewsPage({
  searchParams,
}: {
  searchParams?: { q?: string }
}) {
  const q = searchParams?.q || ""
  const interviews = await getInterviews(q)

  return (
    <main className="flex-1 py-10 px-6 max-w-[1700px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <PageHeader 
        title="Agenda de Entrevistas"
        subtitle="Controle e acompanhamento de entrevistas, triagens e avaliações com candidatos."
        icon={<CalendarCheck className="h-8 w-8 text-blue-500" />}
        actions={
          <RHActionButton type="entrevista" />
        }
      />

      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-white p-6 rounded-[2rem] shadow-lahomes border border-slate-50">
        <form method="GET" className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors font-bold" />
            <Input 
              name="q"
              placeholder="Buscar candidato, vaga ou entrevistador..." 
              defaultValue={q}
              className="pl-12 rounded-full border-slate-100 focus-visible:ring-primary h-12 text-sm font-medium shadow-inner bg-slate-50/30"
            />
          </div>
          <Button type="submit" variant="secondary" className="rounded-full h-12 px-8 font-bold text-xs uppercase tracking-widest bg-slate-100/50 hover:bg-slate-100 transition-all">
            Consultar Agenda
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-lahomes border border-slate-50 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar custom-scrollbar">
          <Table className="min-w-[1100px]">
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] h-14 pl-8">Candidato / Vaga</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Data & Hora</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Categoria</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Entrevistador / Local</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Status</TableHead>
                <TableHead className="text-right pr-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interviews.map((interview) => {
                const isOnline = interview.locationOrLink && (interview.locationOrLink.includes('meet') || interview.locationOrLink.includes('zoom') || interview.locationOrLink.includes('teams'))
                const interviewerName = interview.interviewer ? getEmployeePrimaryName(interview.interviewer) : "A Definir"
                const interviewerLegalName = interview.interviewer ? getEmployeeLegalName(interview.interviewer) : null
                return (
                  <ClickableRow 
                    key={interview.id} 
                    href={`/rh/entrevistas/${interview.id}`}
                    className="border-slate-50 h-20 group hover:bg-slate-50 transition-colors"
                  >
                    <TableCell className="pl-8">
                      <div className="flex flex-col">
                        <span className="font-black text-primary tracking-tight text-sm font-outfit uppercase">
                          {interview.candidate.fullName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
                          VAGA: {interview.jobOpening?.title || "NÃO VINCULADA"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-slate-600 font-bold text-xs uppercase">
                          {format(new Date(interview.scheduledDate), "dd 'de' MMMM", { locale: ptBR })}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold uppercase mt-1">
                          <Clock className="w-3 h-3 text-blue-400" />
                          {format(new Date(interview.startTime), "HH:mm")} - {format(new Date(interview.endTime), "HH:mm")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`border-slate-200 text-slate-500 font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-full`}>
                        {interview.stage === 'SCREENING' ? 'Triagem' : 
                         interview.stage === 'TECHNICAL' ? 'Técnica' :
                         interview.stage === 'FINAL' ? 'Final' :
                         interview.stage === 'FIT' ? 'Cultural' : interview.stage}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-slate-500 font-bold text-xs uppercase tracking-tight">
                          {interviewerName}
                        </span>
                        {interviewerLegalName && (
                          <span className="text-[10px] text-slate-400 tracking-wider font-semibold uppercase mt-1">
                            Legal: {interviewerLegalName}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 tracking-wider font-semibold flex items-center gap-1 mt-1">
                          {isOnline ? (
                            <><Video className="w-3 h-3 text-indigo-400" /> Online / Link na Entrevista</>
                          ) : (
                            <><MapPin className="w-3 h-3 text-emerald-400" /> Presencial: {interview.locationOrLink || "RH Spa do Colchão"}</>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`border-none font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-full ${
                        interview.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-600' : 
                        interview.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-600' :
                        interview.status === 'COMPLETED' ? 'bg-slate-100 text-slate-500' :
                        interview.status === 'RESCHEDULED' ? 'bg-amber-50 text-amber-600' :
                        'bg-rose-50 text-rose-500' // CANCELLED or NO_SHOW
                      }`}>
                        {interview.status === 'SCHEDULED' ? 'Agendada' :
                         interview.status === 'CONFIRMED' ? 'Confirmada' :
                         interview.status === 'COMPLETED' ? 'Realizada' :
                         interview.status === 'RESCHEDULED' ? 'Reagendada' :
                         interview.status === 'NO_SHOW' ? 'Faltou' : 'Cancelada'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                       <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                         <Link href={`/rh/entrevistas/${interview.id}`}>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-primary bg-slate-50 border border-slate-100 hover:bg-white shadow-sm">
                            <Eye className="h-5 w-5" />
                          </Button>
                        </Link>
                        <Link href={`/rh/entrevistas/${interview.id}/editar`}>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 border border-transparent hover:border-slate-100 hover:bg-white shadow-sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </ClickableRow>
                )
              })}
              {interviews.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-40 text-slate-400 font-bold uppercase tracking-widest text-xs border-none">
                    Nenhuma entrevista agendada.
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
