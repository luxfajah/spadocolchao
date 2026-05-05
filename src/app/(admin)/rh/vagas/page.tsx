import { getJobOpenings } from "./actions"
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
import { Plus, Search, Eye, Edit, Briefcase } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/layout/PageHeader"
import { ClickableRow } from "@/components/ui/ClickableRow"

export default async function JobOpeningsPage({
  searchParams,
}: {
  searchParams?: { q?: string }
}) {
  const q = searchParams?.q || ""
  const jobs = await getJobOpenings(q)

  return (
    <main className="flex-1 py-10 px-6 max-w-[1700px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <PageHeader 
        title="Quadro de Vagas"
        subtitle="Gerencie posições abertas e pipeline de contratações ativas na empresa."
        icon={<Briefcase className="h-8 w-8 text-blue-500" />}
        actions={
          <div className="flex gap-4">
            <Link href="/rh/candidatos">
              <Button variant="secondary" className="rounded-full shadow-sm bg-white border border-slate-100 hover:bg-slate-50 transition-all px-8 h-12 font-black text-xs uppercase tracking-[0.1em] text-slate-600">
                Banco de Talentos
              </Button>
            </Link>
            <Link href="/rh/vagas/nova">
              <Button className="rounded-full gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all px-8 h-12 font-black text-xs uppercase tracking-[0.1em]">
                <Plus className="h-4 w-4" /> Nova Vaga
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-white p-6 rounded-[2rem] shadow-lahomes border border-slate-50">
        <form method="GET" className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors font-bold" />
            <Input 
              name="q"
              placeholder="Pesquisar vagas pelo cargo, nome ou setor..." 
              defaultValue={q}
              className="pl-12 rounded-full border-slate-100 focus-visible:ring-primary h-12 text-sm font-medium shadow-inner bg-slate-50/30"
            />
          </div>
          <Button type="submit" variant="secondary" className="rounded-full h-12 px-8 font-bold text-xs uppercase tracking-widest bg-slate-100/50 hover:bg-slate-100 transition-all">
            Buscar
          </Button>
        </form>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-lahomes border border-slate-50 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar custom-scrollbar">
          <Table className="min-w-[1100px]">
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] h-14 pl-8">Cargo / Vaga</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px] text-center">Inscritos</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Contratação</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Abertura</TableHead>
                <TableHead className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Status</TableHead>
                <TableHead className="text-right pr-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <ClickableRow 
                  key={job.id} 
                  href={`/rh/vagas/${job.id}`}
                  className="border-slate-50 h-20 group hover:bg-slate-50 transition-colors"
                >
                  <TableCell className="pl-8">
                    <div className="flex flex-col">
                      <span className="font-black text-primary tracking-tight text-sm font-outfit uppercase">
                        {job.jobTitle?.name || job.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
                        {job.jobTitle?.department || job.department || "Sem departamento definido"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-white text-slate-500 font-black text-xs uppercase rounded-full border border-slate-200 shadow-sm px-4">
                      {job._count.applications} candidatos
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-slate-600 font-bold text-xs uppercase">{job.contractType}</span>
                      <span className="text-[10px] text-slate-400">{job.workModel === 'REMOTE' ? 'Híbrido/Remoto' : 'Presencial'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-tight">
                      {job.openingDate ? new Date(job.openingDate).toLocaleDateString("pt-BR") : "---"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={`border-none font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-full ${
                      job.status === 'OPEN' ? 'bg-emerald-50 text-emerald-600' : 
                      job.status === 'SCREENING' ? 'bg-blue-50 text-blue-600' :
                      job.status === 'INTERVIEWS' ? 'bg-indigo-50 text-indigo-600' :
                      job.status === 'CLOSED' ? 'bg-slate-100 text-slate-500' :
                      'bg-rose-50 text-rose-500' // CANCELLED
                    }`}>
                      {job.status === 'OPEN' ? 'Aberto' :
                       job.status === 'SCREENING' ? 'Em Triagem' :
                       job.status === 'INTERVIEWS' ? 'Entrevistas' :
                       job.status === 'CLOSED' ? 'Fechada' : 
                       job.status === 'DRAFT' ? 'Rascunho' : 'Cancelada'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                     <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                       <Link href={`/rh/vagas/${job.id}`}>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-primary bg-slate-50 border border-slate-100 hover:bg-white shadow-sm">
                          <Eye className="h-5 w-5" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </ClickableRow>
              ))}
              {jobs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-40 text-slate-400 font-bold uppercase tracking-widest text-xs border-none">
                    Não há vagas disponíveis no momento.
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
